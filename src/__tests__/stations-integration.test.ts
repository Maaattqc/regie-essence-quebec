// @vitest-environment node
//
// Tests d'intégration GET /api/stations
// Cas non couverts par stations-route.test.ts :
//  - Cache-Control: no-store présent sur 200, 202, 429
//  - format complet de la réponse 200 (ok, data, meta)
//  - format complet de la réponse 202 (ok=false, data=null, meta)
//  - syncStations appelé avec la bonne raison selon le cas
//  - syncStations non appelé quand le feed est frais

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
  return { ...actual, after: mocks.after }
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

const readyMeta = {
  datasetId: 'ds-test',
  stationCount: 5,
  syncStatus: 'ready',
  lastStartedAt: '2026-04-02T09:00:00.000Z',
  lastCompletedAt: '2026-04-02T09:01:00.000Z',
  lastCheckedAt: '2026-04-02T09:01:00.000Z',
  sourceLastModified: '2026-04-02T09:00:00.000Z',
  lastError: null,
}

describe('GET /api/stations — intégration Cache-Control, format et sync', () => {
  beforeEach(() => {
    mocks.after.mockImplementation((cb: () => void | Promise<void>) => { void cb() })
    mocks.getIP.mockReturnValue('203.0.113.5')
    mocks.rateLimit.mockReturnValue(true)
    mocks.shouldQueueStationRefresh.mockReturnValue(false)
    mocks.syncStations.mockResolvedValue(undefined)
    mocks.getStationFeed.mockReset()
    mocks.after.mockClear()
    mocks.syncStations.mockClear()
  })

  // ── Cache-Control ───────────────────────────────────────────

  it('inclut Cache-Control: no-store dans la reponse 200', async () => {
    mocks.getStationFeed.mockResolvedValue({
      data: { type: 'FeatureCollection', features: [] },
      meta: readyMeta,
    })

    const response = await GET(new Request('http://localhost/api/stations'))

    expect(response.status).toBe(200)
    expect(response.headers.get('Cache-Control')).toBe('no-store')
  })

  it('inclut Cache-Control: no-store dans la reponse 202', async () => {
    mocks.getStationFeed.mockResolvedValue({ data: null, meta: readyMeta })
    mocks.shouldQueueStationRefresh.mockReturnValue(true)

    const response = await GET(new Request('http://localhost/api/stations'))

    expect(response.status).toBe(202)
    expect(response.headers.get('Cache-Control')).toBe('no-store')
  })

  // ── Format complet de la réponse ────────────────────────────

  it('reponse 200 contient ok=true, data FeatureCollection et meta', async () => {
    const featureCollection = {
      type: 'FeatureCollection',
      features: [
        {
          type: 'Feature',
          geometry: { type: 'Point', coordinates: [-73.5, 45.5] },
          properties: { Name: 'Shell Test' },
        },
      ],
    }
    mocks.getStationFeed.mockResolvedValue({ data: featureCollection, meta: readyMeta })

    const response = await GET(new Request('http://localhost/api/stations'))

    expect(response.status).toBe(200)
    const body = await response.json()
    expect(body.ok).toBe(true)
    expect(body.data.type).toBe('FeatureCollection')
    expect(body.data.features).toHaveLength(1)
    expect(body.meta).toMatchObject({ stationCount: 5, syncStatus: 'ready' })
  })

  it('reponse 202 contient ok=false, data=null et meta', async () => {
    mocks.getStationFeed.mockResolvedValue({ data: null, meta: readyMeta })
    mocks.shouldQueueStationRefresh.mockReturnValue(true)

    const response = await GET(new Request('http://localhost/api/stations'))

    expect(response.status).toBe(202)
    const body = await response.json()
    expect(body.ok).toBe(false)
    expect(body.data).toBeNull()
    expect(body.meta).toBeDefined()
  })

  it('reponse 200 a un Content-Type application/json', async () => {
    mocks.getStationFeed.mockResolvedValue({
      data: { type: 'FeatureCollection', features: [] },
      meta: readyMeta,
    })

    const response = await GET(new Request('http://localhost/api/stations'))

    expect(response.headers.get('content-type')).toMatch(/application\/json/)
  })

  it('reponse 429 a un Content-Type application/json et error string', async () => {
    mocks.rateLimit.mockReturnValue(false)

    const response = await GET(new Request('http://localhost/api/stations'))

    expect(response.status).toBe(429)
    expect(response.headers.get('content-type')).toMatch(/application\/json/)
    const body = await response.json()
    expect(typeof body.error).toBe('string')
  })

  // ── Logique de sync ─────────────────────────────────────────

  it('appelle syncStations avec reason=serve-empty quand data est null', async () => {
    mocks.getStationFeed.mockResolvedValue({ data: null, meta: readyMeta })
    mocks.shouldQueueStationRefresh.mockReturnValue(true)

    await GET(new Request('http://localhost/api/stations'))

    expect(mocks.syncStations).toHaveBeenCalledWith({ reason: 'serve-empty' })
  })

  it('appelle syncStations avec reason=serve-stale quand le feed est perime', async () => {
    mocks.getStationFeed.mockResolvedValue({
      data: { type: 'FeatureCollection', features: [{ type: 'Feature' }] },
      meta: readyMeta,
    })
    mocks.shouldQueueStationRefresh.mockReturnValue(true)

    await GET(new Request('http://localhost/api/stations'))

    expect(mocks.syncStations).toHaveBeenCalledWith({ reason: 'serve-stale' })
  })

  it('nappelle pas syncStations quand le feed est frais', async () => {
    mocks.getStationFeed.mockResolvedValue({
      data: { type: 'FeatureCollection', features: [] },
      meta: readyMeta,
    })
    mocks.shouldQueueStationRefresh.mockReturnValue(false)

    await GET(new Request('http://localhost/api/stations'))

    expect(mocks.syncStations).not.toHaveBeenCalled()
    expect(mocks.after).not.toHaveBeenCalled()
  })

  it('appelle after() exactement une fois quand un refresh est planifie', async () => {
    mocks.getStationFeed.mockResolvedValue({ data: null, meta: readyMeta })
    mocks.shouldQueueStationRefresh.mockReturnValue(true)

    await GET(new Request('http://localhost/api/stations'))

    expect(mocks.after).toHaveBeenCalledTimes(1)
  })
})
