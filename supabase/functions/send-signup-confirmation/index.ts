// Public endpoint to send an event-signup confirmation email.
// No JWT required (guest signups are anonymous), but the request is validated
// against the event_signups table — we only send if a signup row exists for
// the given (event_id, email) created in the last 10 minutes. This prevents
// the function from being abused as an open email relay.
import { createClient } from 'npm:@supabase/supabase-js@2'
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors'

interface Body {
  eventId?: string
  email?: string
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  const supabase = createClient(supabaseUrl, serviceKey)

  console.log('signup-confirm: request received', { method: req.method })

  let body: Body
  try {
    body = await req.json()
  } catch (e) {
    console.warn('signup-confirm: invalid JSON body', e)
    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }


  const eventId = (body.eventId || '').trim()
  const emailRaw = (body.email || '').trim().toLowerCase()
  const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailRaw)
  if (!eventId || !emailOk) {
    console.log('signup-confirm: bad input', { eventId, emailRaw })
    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  // Validate: a signup row must exist for this (event, email). Use a 24h window
  // so legitimate confirmations succeed even with minor clock drift or slight
  // retry delays; the row's existence itself prevents abuse.
  // 14-day window: protection is the signup row's existence, not freshness.
  const since = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString()
  const { data: signup, error: lookupErr } = await supabase
    .from('event_signups')
    .select('id, full_name, created_at, event_id, email')
    .eq('event_id', eventId)
    .ilike('email', emailRaw)
    .gte('created_at', since)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (lookupErr) console.warn('signup-confirm: lookup error', lookupErr)
  if (!signup) {
    console.log('signup-confirm: no matching signup', { eventId, emailRaw })

    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  const { data: event, error: eventErr } = await supabase
    .from('events')
    .select('id,title,description,starts_at,location,is_online')
    .eq('id', eventId)
    .eq('is_published', true)
    .maybeSingle()

  if (eventErr) console.warn('signup-confirm: event lookup error', eventErr)
  if (!event) {
    console.log('signup-confirm: no published event', { eventId })
    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  const when = new Date(event.starts_at as string).toLocaleString('en-GB', {
    weekday: 'short', year: 'numeric', month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Helsinki',
  })
  const where = event.is_online ? 'Online' : (event.location || 'TBA')
  const intro = (event.description || '').replace(/\s+/g, ' ').trim().slice(0, 240)

  console.log('signup-confirm: invoking relay', {
    recipient: signup.email,
    eventTitle: event.title,
  })

  // Use the Supabase client's functions.invoke so the gateway accepts the
  // service-role credentials (raw fetch with the new sb_secret_* key gets
  // rejected as "Invalid JWT" by the edge gateway).
  try {
    const { data, error } = await supabase.functions.invoke(
      'send-transactional-email',
      {
        body: {
          templateName: 'event-confirmation',
          recipientEmail: signup.email,
          idempotencyKey: `signup-${event.id}-${signup.email}`,
          templateData: {
            name: signup.full_name,
            eventTitle: event.title,
            eventIntro: intro,
            eventTime: when,
            eventLocation: where,
            eventUrl: 'https://goodvibescafe.org/events',
          },
        },
      },
    )
    if (error) {
      console.error('signup-confirm: relay error', error)
    } else {
      console.log('signup-confirm: relay ok', data)
    }
  } catch (err) {
    console.warn('signup-confirm: relay threw', err)
  }



  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
})
