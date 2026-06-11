// Validates an HMAC feedback token (personal or shared) and stores a row.
import { createClient } from 'npm:@supabase/supabase-js@2'
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors'
import {
  verifyFeedbackToken,
  verifyShareToken,
} from '../_shared/feedback-token.ts'

interface Body {
  eventId: string
  email: string
  token?: string
  share?: string
  name?: string
  overallRating: number
  programRatings?: { label: string; rating: number }[]
  comments?: string
  responses?: Record<string, unknown>
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
    return json(400, { error: 'invalid_json' })
  }

  const {
    eventId,
    email,
    token,
    share,
    name,
    overallRating,
    programRatings = [],
    comments,
    responses,
  } = body || ({} as Body)

  const emailOk =
    typeof email === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)

  if (
    !eventId ||
    !emailOk ||
    (!token && !share) ||
    !Number.isInteger(overallRating) ||
    overallRating < 1 ||
    overallRating > 5
  ) {
    return json(400, { error: 'invalid_input' })
  }

  const secret = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  const ok = share
    ? await verifyShareToken(eventId, share, secret)
    : await verifyFeedbackToken(eventId, email, token!, secret)
  if (!ok) return json(401, { error: 'invalid_token' })


  // Sanitize program ratings
  const cleanedProgram = Array.isArray(programRatings)
    ? programRatings
        .filter(
          (p) =>
            p &&
            typeof p.label === 'string' &&
            Number.isInteger(p.rating) &&
            p.rating >= 1 &&
            p.rating <= 5,
        )
        .slice(0, 20)
        .map((p) => ({ label: p.label.slice(0, 200), rating: p.rating }))
    : []

  const cleanedComments =
    typeof comments === 'string' ? comments.slice(0, 4000) : null

  // Sanitize responses: only keep string/number/boolean values, cap keys.
  const cleanedResponses: Record<string, unknown> = {}
  if (responses && typeof responses === 'object') {
    let i = 0
    for (const [k, v] of Object.entries(responses)) {
      if (i++ >= 20) break
      const key = String(k).slice(0, 80)
      if (v === null) cleanedResponses[key] = null
      else if (typeof v === 'string') cleanedResponses[key] = v.slice(0, 500)
      else if (typeof v === 'number' || typeof v === 'boolean')
        cleanedResponses[key] = v
    }
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  )

  const { error } = await supabase.from('event_feedback').upsert(
    {
      event_id: eventId,
      email: email.toLowerCase(),
      name: name?.slice(0, 200) ?? null,
      overall_rating: overallRating,
      program_ratings: cleanedProgram,
      comments: cleanedComments,
      responses: cleanedResponses,
    },
    { onConflict: 'event_id,email' },
  )

  if (error) {
    console.error('event_feedback upsert failed', error)
    return json(500, { error: 'db_error' })
  }

  return json(200, { success: true })
})
