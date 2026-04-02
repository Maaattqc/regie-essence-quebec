// @vitest-environment node

import { NextRequest } from 'next/server'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => {
  const query: {
    eq: ReturnType<typeof vi.fn>
    gte: ReturnType<typeof vi.fn>
    order: ReturnType<typeof vi.fn>
    select: ReturnType<typeof vi.fn>
  } = {} as never

  query.select = vi.fn(() => query)
  query.eq = vi.fn(() => query)
  query.gte = vi.fn(() => query)
  query.order = vi.fn()

  return {
    getIP: vi.fn(),
    query,
    rateLimit: vi.fn(),
    supabase: {
      from: vi.fn(() => query),
    },
  }
})

vi.mock('@/lib/rateLimit', () => ({
  getIP: mocks.getIP,
  rateLimit: mocks.rateLimit,
}))

vi.mock('@/lib/supabase', () => ({
  supabase: mocks.supabase,
}))

import { GET } from '@/app/api/history/route'

describe('GET /api/history', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-04-02T12:00:00.000Z'))

    mocks.getIP.mockReset()
    mocks.query.eq.mockClear()
    mocks.query.gte.mockClear()
    mocks.query.order.mockReset()
    mocks.query.select.mockClear()
    mocks.rateLimit.mockReset()
    mocks.supabase.from.mockClear()

    mocks.getIP.mockReturnValue('203.0.113.2')
    mocks.query.order.mockResolvedValue({
      data: [{ price: 151.3, snapshot_date: '2026-04-01' }],
      error: null,
    })
    mocks.rateLimit.mockReturnValue(true)
  })

  it('retourne 429 quand le rate limit est depasse', async () => {
    mocks.rateLimit.mockReturnValue(false)

    const response = await GET(
      new NextRequest('http://localhost/api/history?station=A&address=B'),
    )

    expect(response.status).toBe(429)
  })

  it('retourne 400 quand des parametres sont manquants', async () => {
    const response = await GET(new NextRequest('http://localhost/api/history'))

    expect(response.status).toBe(400)
    await expect(response.json()).resolves.toEqual({
      error: 'station and address required',
    })
  })

  it('construit la requete supabase avec un nombre de jours borne a 90', async () => {
    const response = await GET(
      new NextRequest(
        'http://localhost/api/history?station=Shell&address=123%20Rue&type=Super&days=120',
      ),
    )

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual([
      { price: 151.3, snapshot_date: '2026-04-01' },
    ])
    expect(mocks.supabase.from).toHaveBeenCalledWith('price_snapshots')
    expect(mocks.query.eq).toHaveBeenNthCalledWith(1, 'station_name', 'Shell')
    expect(mocks.query.eq).toHaveBeenNthCalledWith(2, 'address', '123 Rue')
    expect(mocks.query.eq).toHaveBeenNthCalledWith(3, 'gas_type', 'Super')
    expect(mocks.query.gte).toHaveBeenCalledWith('snapshot_date', '2026-01-02')
    expect(mocks.query.order).toHaveBeenCalledWith('snapshot_date', {
      ascending: true,
    })
  })
})
