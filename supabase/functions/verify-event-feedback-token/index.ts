// Verifies an HMAC feedback token and returns minimal event info.
// Used so the /events/:id/feedback page reveals nothing without a valid link.
import { createClient } from 'npm:@supabase/supabase-js@2'
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors'
import { verifyFeedbackToken } from '../_shared/feedback-token.ts'

interface Body {
  eventId?: string
  email?: string
  token?: string
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  const json = (status: number, body: unknown) =>
    new Response(JSON.stringify(body), {
      status,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  let body: Body
  try {
    body = (await req.json()) as Body
  } catch {
    return json(400, { valid: false })
  }

  const { eventId, email, token } = body || {}
  if (!eventId || !email || !token) return json(200, { valid: false })

  const secret = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  const ok = await verifyFeedbackToken(eventId, email, token, secret)
  if (!ok) return json(200, { valid: false })

  const supabase = createClient(Deno.env.get('SUPABASE_URL')!, secret)
  const { data, error } = await supabase
    .from('events')
    .select('id,title,agenda')
    .eq('id', eventId)
    .maybeSingle()

  if (error || !data) return json(200, { valid: false })

  return json(200, {
    valid: true,
    event: { id: data.id, title: data.title, agenda: data.agenda },
  })
})
