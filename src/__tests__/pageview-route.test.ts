// @vitest-environment node

import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => {
  const insert = vi.fn()
  const from = vi.fn(() => ({ insert }))

  return {
    from,
    insert,
    logActivity: vi.fn(),
    rateLimit: vi.fn(),
    getIP: vi.fn(),
  }
})

vi.mock('@/lib/supabase', () => ({
  supabaseAdmin: { from: mocks.from },
}))

vi.mock('@/lib/activity-log', () => ({
  logActivity: mocks.logActivity,
}))

vi.mock('@/lib/rateLimit', () => ({
  rateLimit: mocks.rateLimit,
  getIP: mocks.getIP,
}))

import { POST } from '@/app/api/pageview/route'

describe('POST /api/pageview', () => {
  beforeEach(() => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://example.supabase.co'
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'service-role'

    mocks.from.mockClear()
    mocks.insert.mockReset()
    mocks.logActivity.mockReset()

    mocks.insert.mockResolvedValue({ error: null })
    mocks.logActivity.mockResolvedValue(undefined)
    mocks.rateLimit.mockReturnValue(true)
    mocks.getIP.mockReturnValue('127.0.0.1')
  })

  it('retourne 429 quand le rate limit est dépassé', async () => {
    mocks.rateLimit.mockReturnValue(false)
    const response = await POST(
      new Request('http://localhost/api/pageview', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ sessionId: 'x' }),
      }),
    )
    expect(response.status).toBe(429)
  })

  it('retourne 400 sans sessionId', async () => {
    const response = await POST(
      new Request('http://localhost/api/pageview', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({}),
      }),
    )

    expect(response.status).toBe(400)
    await expect(response.json()).resolves.toMatchObject({
      error: expect.stringContaining('sessionId'),
    })
  })

  it('insere dans page_views et retourne ok', async () => {
    const response = await POST(
      new Request('http://localhost/api/pageview', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ sessionId: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' }),
      }),
    )

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual({ ok: true })
    expect(mocks.from).toHaveBeenCalledWith('page_views')
    expect(mocks.insert).toHaveBeenCalledWith({ session_id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  })

  it('appelle logActivity apres insertion', async () => {
    await POST(
      new Request('http://localhost/api/pageview', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ sessionId: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' }),
      }),
    )

    expect(mocks.logActivity).toHaveBeenCalledWith(
      'visite',
      'Nouvelle session',
      undefined,
      { sessionId: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' },
    )
  })
})
