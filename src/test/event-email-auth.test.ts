// @vitest-environment node
import { describe, expect, it, vi, afterEach } from 'vitest'
import { authorizeEventEmail, verifySchedulerToken } from '../../supabase/functions/_shared/event-email-auth'

const jwt = (role: string) => `header.${btoa(JSON.stringify({ role }))}.signature`

afterEach(() => vi.unstubAllGlobals())

describe('event reminder and feedback scheduler authorization', () => {
  it('accepts a separately verified cron service JWT without a sub claim', async () => {
    const verifyService = vi.fn().mockResolvedValue(true)
    const verifyAdmin = vi.fn()
    expect(await authorizeEventEmail(jwt('service_role'), 'test-current-key', verifyService, verifyAdmin)).toBe(true)
    expect(verifyService).toHaveBeenCalledOnce()
    expect(verifyAdmin).not.toHaveBeenCalled()
  })

  it('rejects a forged or expired service-role JWT when server verification fails', async () => {
    expect(await authorizeEventEmail(jwt('service_role'), 'test-current-key', async () => false, async () => true)).toBe(false)
  })

  it('rejects missing credentials', async () => {
    expect(await authorizeEventEmail('', 'test-current-key', async () => true, async () => true)).toBe(false)
  })

  it('preserves access for the configured service key', async () => {
    expect(await authorizeEventEmail('test-current-key', 'test-current-key', async () => false, async () => false)).toBe(true)
  })

  it('requires verified admin access for a user token', async () => {
    expect(await authorizeEventEmail(jwt('authenticated'), 'test-current-key', async () => true, async () => false)).toBe(false)
    expect(await authorizeEventEmail(jwt('authenticated'), 'test-current-key', async () => false, async () => true)).toBe(true)
  })

  it('fails closed when credential verification is unavailable', async () => {
    expect(await authorizeEventEmail(jwt('service_role'), 'test-current-key', async () => { throw new Error('offline') }, async () => true)).toBe(false)
  })

  it('uses a zero-row database request rather than Auth user lookup', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response('[]', { status: 200 }))
    vi.stubGlobal('fetch', fetchMock)
    expect(await verifySchedulerToken('test-cron-token', 'https://example.test', 'test-anon-key')).toBe(true)
    expect(fetchMock).toHaveBeenCalledWith('https://example.test/rest/v1/user_roles?select=role&limit=0', expect.objectContaining({
      headers: { apikey: 'test-anon-key', Authorization: 'Bearer test-cron-token' },
    }))
  })

  it('rejects database API authentication failures', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('{}', { status: 401 })))
    expect(await verifySchedulerToken('test-invalid-token', 'https://example.test', 'test-anon-key')).toBe(false)
  })
})