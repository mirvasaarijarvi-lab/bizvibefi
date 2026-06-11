// Admin-only: mints a shareable feedback URL for an event.
import { createClient } from 'npm:@supabase/supabase-js@2'
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors'
import { signShareToken } from '../_shared/feedback-token.ts'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }
  const json = (status: number, body: unknown) =>
    new Response(JSON.stringify(body), {
      status,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  const auth = req.headers.get('Authorization') ?? ''
  const supaUrl = Deno.env.get('SUPABASE_URL')!
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  const userClient = createClient(supaUrl, Deno.env.get('SUPABASE_ANON_KEY')!, {
    global: { headers: { Authorization: auth } },
  })
  const { data: u } = await userClient.auth.getUser()
  if (!u?.user) return json(401, { error: 'unauthenticated' })

  const admin = createClient(supaUrl, serviceKey)
  const [{ data: isAdmin }, { data: isSuper }] = await Promise.all([
    admin.rpc('has_role', { _user_id: u.user.id, _role: 'admin' }),
    admin.rpc('has_role', { _user_id: u.user.id, _role: 'superadmin' }),
  ])
  if (!isAdmin && !isSuper) return json(403, { error: 'forbidden' })

  let body: { eventId?: string; baseUrl?: string }
  try { body = await req.json() } catch { return json(400, { error: 'invalid_json' }) }
  const eventId = body.eventId
  if (!eventId) return json(400, { error: 'missing_eventId' })

  const share = await signShareToken(eventId, serviceKey)
  const base = body.baseUrl?.replace(/\/$/, '') ?? 'https://www.goodvibescafe.org'
  const url = `${base}/events/${eventId}/feedback?s=${share}`
  return json(200, { share, url })
})
