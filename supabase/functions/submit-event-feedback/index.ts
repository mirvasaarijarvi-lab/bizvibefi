// Validates an HMAC feedback token and stores an event feedback row.
import { createClient } from 'npm:@supabase/supabase-js@2'
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors'
import { verifyFeedbackToken } from '../_shared/feedback-token.ts'

interface Body {
  eventId: string
  email: string
  token: string
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
    name,
    overallRating,
    programRatings = [],
    comments,
  } = body || ({} as Body)

  if (
    !eventId ||
    !email ||
    !token ||
    !Number.isInteger(overallRating) ||
    overallRating < 1 ||
    overallRating > 5
  ) {
    return json(400, { error: 'invalid_input' })
  }

  const secret = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  const ok = await verifyFeedbackToken(eventId, email, token, secret)
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
    },
    { onConflict: 'event_id,email' },
  )

  if (error) {
    console.error('event_feedback upsert failed', error)
    return json(500, { error: 'db_error' })
  }

  return json(200, { success: true })
})
