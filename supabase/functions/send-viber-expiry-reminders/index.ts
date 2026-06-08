// Sends warnings to Viber members whose membership expires in 14 or 7 days,
// and notifies admins. Designed to be invoked once per day by pg_cron.
// Idempotent: deterministic idempotency keys prevent duplicate sends.
import { createClient } from 'npm:@supabase/supabase-js@2'
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors'

interface ProfileRow {
  user_id: string
  display_name: string | null
  contact_email: string | null
  viber_ends_at: string // ISO date
}

function formatEndsOn(iso: string): string {
  try {
    const d = new Date(iso + 'T00:00:00Z')
    return d.toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      timeZone: 'UTC',
    })
  } catch {
    return iso
  }
}

function targetDateUTC(daysAhead: number): string {
  const d = new Date()
  d.setUTCHours(0, 0, 0, 0)
  d.setUTCDate(d.getUTCDate() + daysAhead)
  return d.toISOString().slice(0, 10)
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

  const authHeader = req.headers.get('Authorization') || ''
  if (authHeader !== `Bearer ${serviceKey}`) {
    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  const supabase = createClient(supabaseUrl, serviceKey)

  const windows = [
    { days: 14, label: '2-week' },
    { days: 7, label: '1-week' },
  ]

  let totalQueued = 0
  let totalSkipped = 0
  const adminMessages: string[] = []

  for (const w of windows) {
    const targetDate = targetDateUTC(w.days)

    const { data: profiles, error } = await supabase
      .from('profiles')
      .select('user_id,display_name,contact_email,viber_ends_at,membership_tier')
      .eq('membership_tier', 'viber')
      .eq('viber_ends_at', targetDate)

    if (error) {
      console.error('profiles query failed', error)
      continue
    }

    const rows = (profiles ?? []) as (ProfileRow & { membership_tier: string })[]
    if (rows.length === 0) continue

    // Resolve missing emails via auth
    for (const p of rows) {
      if (!p.contact_email) {
        const { data: authUser } = await supabase.auth.admin.getUserById(p.user_id)
        p.contact_email = authUser?.user?.email ?? null
      }
    }

    const endsOnFormatted = formatEndsOn(targetDate)

    for (const p of rows) {
      if (!p.contact_email) {
        totalSkipped++
        continue
      }
      const idempotencyKey = `viber-expiring-${w.days}-${p.user_id}-${targetDate}`
      try {
        const { data, error: invokeErr } = await supabase.functions.invoke(
          'send-transactional-email',
          {
            body: {
              templateName: 'viber-expiring',
              recipientEmail: p.contact_email,
              idempotencyKey,
              templateData: {
                name: p.display_name || '',
                endsOn: endsOnFormatted,
                daysRemaining: w.days,
              },
            },
          }
        )
        if (invokeErr) throw invokeErr
        if (data?.success === false) totalSkipped++
        else totalQueued++
      } catch (err) {
        console.error('viber expiry send failed', { user: p.user_id, err })
        totalSkipped++
      }
    }

    adminMessages.push(
      `${rows.length} Viber member(s) have ${w.label} until expiry (${endsOnFormatted}).`
    )
  }

  // Notify admins via admin_notifications (in-app bell)
  if (adminMessages.length > 0) {
    await supabase.from('admin_notifications').insert({
      title: 'Viber memberships expiring soon',
      message: adminMessages.join(' '),
      type: 'viber_expiring',
    })
  }

  return new Response(
    JSON.stringify({
      queued: totalQueued,
      skipped: totalSkipped,
      windows: windows.length,
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
})
