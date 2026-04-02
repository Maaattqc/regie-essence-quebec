// @vitest-environment node

import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  after: vi.fn(),
  getIP: vi.fn(),
  rateLimit: vi.fn(),
  syncStations: vi.fn(),
}))

vi.mock('next/server', async () => {
  const actual = await vi.importActual<typeof import('next/server')>('next/server')

  return {
    ...actual,
    after: mocks.after,
  }
})

vi.mock('@/lib/rateLimit', () => ({
  getIP: mocks.getIP,
  rateLimit: mocks.rateLimit,
}))

vi.mock('@/lib/station-sync', () => ({
  syncStations: mocks.syncStations,
}))

import { GET } from '@/app/api/cron/route'

describe('GET /api/cron', () => {
  beforeEach(() => {
    delete process.env.CRON_SECRET

    mocks.after.mockReset()
    mocks.getIP.mockReset()
    mocks.rateLimit.mockReset()
    mocks.syncStations.mockReset()

    mocks.after.mockImplementation((callback: () => Promise<void> | void) => {
      void callback()
    })
    mocks.getIP.mockReturnValue('203.0.113.4')
    mocks.rateLimit.mockReturnValue(true)
    mocks.syncStations.mockResolvedValue(undefined)
  })

  it('retourne 429 quand le rate limit est depasse', async () => {
    mocks.rateLimit.mockReturnValue(false)

    const response = await GET(new Request('http://localhost/api/cron'))

    expect(response.status).toBe(429)
    await expect(response.json()).resolves.toEqual({ error: 'Trop de requetes' })
    expect(mocks.after).not.toHaveBeenCalled()
  })

  it('retourne 401 quand le secret cron est requis', async () => {
    process.env.CRON_SECRET = 'top-secret'

    const response = await GET(new Request('http://localhost/api/cron'))

    expect(response.status).toBe(401)
    await expect(response.json()).resolves.toEqual({ error: 'Unauthorized' })
    expect(mocks.after).not.toHaveBeenCalled()
  })

  it('met la synchronisation en file et retourne 202', async () => {
    const response = await GET(
      new Request('http://localhost/api/cron', {
        headers: {
          authorization: 'Bearer top-secret',
        },
      }),
    )

    expect(response.status).toBe(202)
    await expect(response.json()).resolves.toMatchObject({
      ok: true,
      queued: true,
      queuedAt: expect.any(String),
    })
    expect(mocks.after).toHaveBeenCalledTimes(1)
    expect(mocks.syncStations).toHaveBeenCalledWith({
      force: true,
      reason: 'cron',
    })
  })
})
