// Sends reminder emails to attendees of events starting in ~24h.
// Designed to be invoked once per hour by pg_cron. Idempotent: each
// (event, recipient) pair uses a deterministic idempotency key so duplicate
// runs within the same UTC date do not double-send.
import { createClient } from 'npm:@supabase/supabase-js@2'
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors'

const SITE_URL = 'https://goodvibescafe.org'

interface EventRow {
  id: string
  title: string
  description: string | null
  starts_at: string
  ends_at: string | null
  location: string | null
  is_online: boolean | null
}

function formatWhen(startIso: string, endIso: string | null): string {
  try {
    const start = new Date(startIso)
    const datePart = start.toLocaleDateString('en-GB', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      timeZone: 'Europe/Helsinki',
    })
    const startTime = start.toLocaleTimeString('en-GB', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
      timeZone: 'Europe/Helsinki',
    })
    if (!endIso) return `${datePart}, ${startTime}`
    const endTime = new Date(endIso).toLocaleTimeString('en-GB', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
      timeZone: 'Europe/Helsinki',
    })
    return `${datePart}, ${startTime} – ${endTime}`
  } catch {
    return startIso
  }
}

function shortIntro(desc: string | null): string {
  if (!desc) return ''
  const trimmed = desc.replace(/\s+/g, ' ').trim()
  return trimmed.length > 240 ? trimmed.slice(0, 237) + '...' : trimmed
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!

  // Auth: allow callers presenting either the service-role key or the queue's
  // service-role key from Vault (used by pg_cron via net.http_post). Verify
  // any other bearer token as a valid JWT belonging to an admin user.
  const authHeader = req.headers.get('Authorization') || ''
  const bearer = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : ''

  let authorized = false
  if (bearer && bearer === serviceKey) {
    authorized = true
  } else if (bearer) {
    try {
      const verifier = createClient(supabaseUrl, anonKey)
      const { data: claimsData } = await verifier.auth.getClaims(bearer)
      const uid = claimsData?.claims?.sub
      if (uid) {
        const admin = createClient(supabaseUrl, serviceKey)
        const { data: rolesData } = await admin
          .from('user_roles')
          .select('role')
          .eq('user_id', uid)
        const roles = (rolesData ?? []).map((r: { role: string }) => r.role)
        if (roles.includes('admin') || roles.includes('superadmin')) {
          authorized = true
        }
      }
    } catch (_e) {
      // fall through to unauthorized
    }
  }

  if (!authorized) {
    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  const supabase = createClient(supabaseUrl, serviceKey)

  // Window: by default events starting in 23-25h. Admins can override with
  // ?eventId=<uuid> for a one-off send (e.g. catch-up for a missed reminder).
  const url = new URL(req.url)
  const eventIdOverride = url.searchParams.get('eventId')

  const now = new Date()
  const lower = new Date(now.getTime() + 23 * 60 * 60 * 1000).toISOString()
  const upper = new Date(now.getTime() + 25 * 60 * 60 * 1000).toISOString()

  let eventsQuery = supabase
    .from('events')
    .select('id,title,description,starts_at,ends_at,location,is_online')
    .eq('is_published', true)

  if (eventIdOverride) {
    eventsQuery = eventsQuery.eq('id', eventIdOverride)
  } else {
    eventsQuery = eventsQuery.gte('starts_at', lower).lte('starts_at', upper)
  }

  const { data: events, error: eventsErr } = await eventsQuery

  if (eventsErr) {
    console.error('events query failed', eventsErr)
    return new Response(JSON.stringify({ error: 'events query failed' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  let totalQueued = 0
  let totalSkipped = 0
  const eventIds = (events ?? []).map((e: EventRow) => e.id)

  if (eventIds.length === 0) {
    return new Response(
      JSON.stringify({ events: 0, queued: 0, skipped: 0 }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  // Gather signups + rsvps in parallel
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

  // Fetch profile info for rsvp users
  const userIds = Array.from(new Set(rsvps.map((r) => r.user_id)))
  const profiles: Record<string, ProfileRow> = {}
  if (userIds.length > 0) {
    const { data: pData } = await supabase
      .from('profiles')
      .select('user_id,display_name,contact_email')
      .in('user_id', userIds)
    for (const p of (pData ?? []) as ProfileRow[]) {
      profiles[p.user_id] = p
    }
    // For rsvps without contact_email on profile, fall back to auth email.
    const missing = userIds.filter(
      (uid) => !profiles[uid]?.contact_email
    )
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

  const todayKey = now.toISOString().slice(0, 10) // YYYY-MM-DD

  for (const ev of (events ?? []) as EventRow[]) {
    const when = formatWhen(ev.starts_at, ev.ends_at)
    const where = ev.is_online
      ? 'Online'
      : ev.location || 'TBA'
    const intro = shortIntro(ev.description)
    const url = `${SITE_URL}/events`

    const recipients = new Map<
      string,
      { email: string; name: string }
    >()

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
      const idempotencyKey = `reminder-${ev.id}-${email.toLowerCase()}-${todayKey}`
      try {
        const { data, error } = await supabase.functions.invoke(
          'send-transactional-email',
          {
            body: {
              templateName: 'event-reminder',
              recipientEmail: email,
              idempotencyKey,
              templateData: {
                name,
                eventTitle: ev.title,
                eventIntro: intro,
                eventTime: when,
                eventLocation: where,
                eventUrl: url,
              },
            },
          }
        )
        if (error) throw error
        if (data?.success === false) totalSkipped++
        else totalQueued++
      } catch (err) {
        console.error('reminder send failed', { event: ev.id, email, err })
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
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
})
