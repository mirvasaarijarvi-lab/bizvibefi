// Sends post-event feedback emails ~24h after an event ends.
// Designed to be invoked hourly by pg_cron. Idempotent via deterministic key.
import { createClient } from 'npm:@supabase/supabase-js@2'
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors'
import { signFeedbackToken } from '../_shared/feedback-token.ts'

const SITE_URL = 'https://goodvibescafe.org'

interface EventRow {
  id: string
  title: string
  ends_at: string | null
  starts_at: string
  agenda: string | null
}

interface SignupRow {
  event_id: string
  full_name: string
  email: string
}

interface RsvpRow {
  event_id: string
  user_id: string
}

interface ProfileRow {
  user_id: string
  display_name: string | null
  contact_email: string | null
}

function parseAgenda(agenda: string | null): string[] {
  if (!agenda) return []
  return agenda
    .split(/\r?\n/)
    .map((l) => l.replace(/^[\s\-*•\d.)]+/, '').trim())
    .filter((l) => l.length > 0)
    .slice(0, 8)
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

  // Auth: accept the cron's vault token, the raw service-role key, or an
  // admin-user JWT. Silent fallback returns 200 so unauth probes don't 500.
  const authHeader = req.headers.get('Authorization') || ''
  const bearer = authHeader.startsWith('Bearer ')
    ? authHeader.slice(7).trim()
    : ''

  let authed = false
  if (bearer && bearer === serviceKey) {
    authed = true
  } else if (bearer) {
    const probe = createClient(Deno.env.get('SUPABASE_URL')!, serviceKey)
    const { data: userRes } = await probe.auth.getUser(bearer)
    const uid = userRes?.user?.id
    if (uid) {
      const { data: roleRow } = await probe
        .from('user_roles')
        .select('role')
        .eq('user_id', uid)
        .eq('role', 'admin')
        .maybeSingle()
      if (roleRow) authed = true
    }
  }
  if (!authed) {
    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    serviceKey,
  )
  const secret = serviceKey

  // Optional manual override: ?eventId=<uuid> sends feedback for a specific
  // event regardless of time window. Used for catch-up runs.
  const url = new URL(req.url)
  const overrideEventId = url.searchParams.get('eventId')
  const now = new Date()

  let events: EventRow[] | null = null
  let eventsErr: unknown = null
  if (overrideEventId) {
    const res = await supabase
      .from('events')
      .select('id,title,ends_at,starts_at,agenda')
      .eq('id', overrideEventId)
      .limit(1)
    events = (res.data ?? []) as EventRow[]
    eventsErr = res.error
  } else {
    // Events whose effective end was 23-25 hours ago.
    const upper = new Date(now.getTime() - 23 * 60 * 60 * 1000).toISOString()
    const lower = new Date(now.getTime() - 25 * 60 * 60 * 1000).toISOString()
    const res = await supabase
      .from('events')
      .select('id,title,ends_at,starts_at,agenda')
      .eq('is_published', true)
      .or(
        `and(ends_at.gte.${lower},ends_at.lte.${upper}),and(ends_at.is.null,starts_at.gte.${lower},starts_at.lte.${upper})`,
      )
    events = (res.data ?? []) as EventRow[]
    eventsErr = res.error
  }

  if (eventsErr) {
    console.error('events query failed', eventsErr)
    return new Response(JSON.stringify({ error: 'events query failed' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  const eventIds = (events ?? []).map((e: EventRow) => e.id)
  if (eventIds.length === 0) {
    return new Response(
      JSON.stringify({ events: 0, queued: 0, skipped: 0 }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    )
  }

  const [signupsRes, rsvpsRes] = await Promise.all([
    supabase
      .from('event_signups')
      .select('event_id,full_name,email')
      .in('event_id', eventIds),
    supabase
      .from('event_rsvps')
      .select('event_id,user_id')
      .in('event_id', eventIds)
      .eq('status', 'going'),
  ])

  const signups = (signupsRes.data ?? []) as SignupRow[]
  const rsvps = (rsvpsRes.data ?? []) as RsvpRow[]

  const userIds = Array.from(new Set(rsvps.map((r) => r.user_id)))
  const profiles: Record<string, ProfileRow> = {}
  if (userIds.length > 0) {
    const { data: pData } = await supabase
      .from('profiles')
      .select('user_id,display_name,contact_email')
      .in('user_id', userIds)
    for (const p of (pData ?? []) as ProfileRow[]) profiles[p.user_id] = p
    const missing = userIds.filter((uid) => !profiles[uid]?.contact_email)
    for (const uid of missing) {
      const { data: authUser } = await supabase.auth.admin.getUserById(uid)
      const email = authUser?.user?.email ?? null
      profiles[uid] = {
        user_id: uid,
        display_name: profiles[uid]?.display_name ?? null,
        contact_email: email,
      }
    }
  }

  const todayKey = now.toISOString().slice(0, 10)
  let totalQueued = 0
  let totalSkipped = 0

  for (const ev of (events ?? []) as EventRow[]) {
    const programItems = parseAgenda(ev.agenda)

    const recipients = new Map<string, { email: string; name: string }>()
    for (const s of signups.filter((x) => x.event_id === ev.id)) {
      const key = s.email.toLowerCase()
      if (!recipients.has(key)) {
        recipients.set(key, { email: s.email, name: s.full_name || '' })
      }
    }
    for (const r of rsvps.filter((x) => x.event_id === ev.id)) {
      const p = profiles[r.user_id]
      if (!p?.contact_email) continue
      const key = p.contact_email.toLowerCase()
      if (!recipients.has(key)) {
        recipients.set(key, {
          email: p.contact_email,
          name: p.display_name || '',
        })
      }
    }

    for (const { email, name } of recipients.values()) {
      const token = await signFeedbackToken(ev.id, email, secret)
      const feedbackUrl = `${SITE_URL}/events/${ev.id}/feedback?token=${token}&email=${encodeURIComponent(email)}`
      const idempotencyKey = `feedback-${ev.id}-${email.toLowerCase()}-${todayKey}`
      try {
        const { data, error } = await supabase.functions.invoke(
          'send-transactional-email',
          {
            body: {
              templateName: 'event-feedback',
              recipientEmail: email,
              idempotencyKey,
              templateData: {
                name,
                eventTitle: ev.title,
                programItems,
                feedbackUrl,
              },
            },
          },
        )
        if (error) throw error
        if (data?.success === false) totalSkipped++
        else totalQueued++
      } catch (err) {
        console.error('feedback send failed', { event: ev.id, email, err })
        totalSkipped++
      }
    }
  }

  return new Response(
    JSON.stringify({
      events: (events ?? []).length,
      queued: totalQueued,
      skipped: totalSkipped,
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
  )
})
