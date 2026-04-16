// @vitest-environment node

import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  after: vi.fn(),
  getIP: vi.fn(),
  getStationFeed: vi.fn(),
  rateLimit: vi.fn(),
  shouldQueueStationRefresh: vi.fn(),
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
  getStationFeed: mocks.getStationFeed,
  shouldQueueStationRefresh: mocks.shouldQueueStationRefresh,
  syncStations: mocks.syncStations,
}))

import { GET } from '@/app/api/stations/route'

const baseMeta = {
  datasetId: 'dataset-1',
  stationCount: 1,
  syncStatus: 'ready',
  lastStartedAt: '2026-04-02T10:00:00.000Z',
  lastCompletedAt: '2026-04-02T10:01:00.000Z',
  lastCheckedAt: '2026-04-02T10:01:00.000Z',
  sourceLastModified: '2026-04-02T10:00:00.000Z',
  lastError: null,
}

describe('GET /api/stations', () => {
  beforeEach(() => {
    mocks.after.mockReset()
    mocks.getIP.mockReset()
    mocks.getStationFeed.mockReset()
    mocks.rateLimit.mockReset()
    mocks.shouldQueueStationRefresh.mockReset()
    mocks.syncStations.mockReset()

    mocks.after.mockImplementation((callback: () => Promise<void> | void) => {
      void callback()
    })
    mocks.getIP.mockReturnValue('203.0.113.5')
    mocks.rateLimit.mockReturnValue(true)
    mocks.shouldQueueStationRefresh.mockReturnValue(false)
    mocks.syncStations.mockResolvedValue(undefined)
  })

  it('retourne 429 quand le rate limit est depasse', async () => {
    mocks.rateLimit.mockReturnValue(false)

    const response = await GET(new Request('http://localhost/api/stations', { headers: { 'x-app-request': '1' } }))

    expect(response.status).toBe(429)
    await expect(response.json()).resolves.toEqual({ error: 'Trop de requêtes' })
  })

  it('retourne 202 et planifie un refresh quand aucun dataset nest pret', async () => {
    mocks.getStationFeed.mockResolvedValue({
      data: null,
      meta: baseMeta,
    })
    mocks.shouldQueueStationRefresh.mockReturnValue(true)

    const response = await GET(new Request('http://localhost/api/stations', { headers: { 'x-app-request': '1' } }))

    expect(response.status).toBe(202)
    expect(response.headers.get('Cache-Control')).toBe('no-store')
    await expect(response.json()).resolves.toEqual({
      ok: false,
      data: null,
      meta: baseMeta,
    })
    expect(mocks.after).toHaveBeenCalledTimes(1)
    expect(mocks.syncStations).toHaveBeenCalledWith({ reason: 'serve-empty' })
  })

  it('retourne le feed courant et ne queue rien si la meta est fraiche', async () => {
    const data = {
      type: 'FeatureCollection',
      features: [],
    }

    mocks.getStationFeed.mockResolvedValue({
      data,
      meta: baseMeta,
    })

    const response = await GET(new Request('http://localhost/api/stations', { headers: { 'x-app-request': '1' } }))

    expect(response.status).toBe(200)
    expect(response.headers.get('Cache-Control')).toBe('public, s-maxage=60, stale-while-revalidate=240')
    await expect(response.json()).resolves.toEqual({
      ok: true,
      data,
      meta: baseMeta,
    })
    expect(mocks.after).not.toHaveBeenCalled()
    expect(mocks.syncStations).not.toHaveBeenCalled()
  })

  it('rafraichit en arriere-plan avec la raison serve-stale quand le feed est stale', async () => {
    const data = {
      type: 'FeatureCollection',
      features: [{ type: 'Feature' }],
    }

    mocks.getStationFeed.mockResolvedValue({
      data,
      meta: baseMeta,
    })
    mocks.shouldQueueStationRefresh.mockReturnValue(true)

    const response = await GET(new Request('http://localhost/api/stations', { headers: { 'x-app-request': '1' } }))

    expect(response.status).toBe(200)
    expect(mocks.after).toHaveBeenCalledTimes(1)
    expect(mocks.syncStations).toHaveBeenCalledWith({ reason: 'serve-stale' })
  })
})
