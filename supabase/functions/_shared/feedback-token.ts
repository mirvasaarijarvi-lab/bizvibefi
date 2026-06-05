// Shared HMAC token helpers for event feedback links.
// Token = base64url(hmacSha256(secret, `${eventId}|${email.toLowerCase()}`))
// truncated to 32 chars. Stateless: no DB lookup needed.

function b64url(bytes: Uint8Array): string {
  const s = btoa(String.fromCharCode(...bytes))
  return s.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

async function hmacKey(secret: string): Promise<CryptoKey> {
  return await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  )
}

export async function signFeedbackToken(
  eventId: string,
  email: string,
  secret: string,
): Promise<string> {
  const key = await hmacKey(secret)
  const sig = await crypto.subtle.sign(
    'HMAC',
    key,
    new TextEncoder().encode(`${eventId}|${email.toLowerCase()}`),
  )
  return b64url(new Uint8Array(sig)).slice(0, 32)
}

export async function verifyFeedbackToken(
  eventId: string,
  email: string,
  token: string,
  secret: string,
): Promise<boolean> {
  const expected = await signFeedbackToken(eventId, email, secret)
  if (expected.length !== token.length) return false
  let mismatch = 0
  for (let i = 0; i < expected.length; i++) {
    mismatch |= expected.charCodeAt(i) ^ token.charCodeAt(i)
  }
  return mismatch === 0
}
