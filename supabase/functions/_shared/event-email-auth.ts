// The event schedulers may use a different, still-valid service-role JWT.
// Decoding only routes verification. PostgREST must validate its signature,
// expiry and project before we trust the service_role claim.
export async function authorizeEventEmail(
  bearer: string,
  serviceKey: string,
  verifyServiceRole: (token: string) => Promise<boolean>,
  verifyAdmin: (token: string) => Promise<boolean>,
): Promise<boolean> {
  if (!bearer) return false
  if (bearer === serviceKey) return true

  try {
    const parts = bearer.split('.')
    if (parts.length !== 3) return false
    const payload = parts[1].replaceAll('-', '+').replaceAll('_', '/')
    const claims = JSON.parse(atob(payload.padEnd(Math.ceil(payload.length / 4) * 4, '=')))
    if (claims?.role === 'service_role') {
      return await verifyServiceRole(bearer)
    }
    return await verifyAdmin(bearer)
  } catch {
    return false
  }
}

export async function verifySchedulerToken(
  token: string,
  supabaseUrl: string,
  anonKey: string,
): Promise<boolean> {
  // A zero-row, read-only query verifies through the project's database API,
  // unlike Auth /user, which requires a sub claim absent from service JWTs.
  const response = await fetch(`${supabaseUrl}/rest/v1/user_roles?select=role&limit=0`, {
    headers: { apikey: anonKey, Authorization: `Bearer ${token}` },
    signal: AbortSignal.timeout(10_000),
  })
  await response.body?.cancel()
  return response.status === 200
}