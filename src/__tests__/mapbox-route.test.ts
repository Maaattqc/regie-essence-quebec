// @vitest-environment node

import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  getIP: vi.fn(),
  rateLimit: vi.fn(),
  logActivity: vi.fn(),
}))

vi.mock('@/lib/rateLimit', () => ({
  getIP: mocks.getIP,
  rateLimit: mocks.rateLimit,
  checkCsrf: vi.fn(() => true),
  getRequestId: vi.fn(() => 'test-req-id'),
  redis: null,
}))

vi.mock('@/lib/activity-log', () => ({
  logActivity: mocks.logActivity,
}))

import { POST } from '@/app/api/mapbox/route'
import { NextRequest } from 'next/server'

describe('POST /api/mapbox', () => {
  beforeEach(() => {
    mocks.getIP.mockReturnValue('203.0.113.4')
    mocks.rateLimit.mockReturnValue(true)
    mocks.logActivity.mockResolvedValue(undefined)
    process.env.MAPBOX_TOKEN = 'test-token'
  })

  it('retourne 429 quand le rate limit est dépassé', async () => {
    mocks.rateLimit.mockReturnValue(false)

    const request = new NextRequest('http://localhost/api/mapbox', {
      method: 'POST',
      headers: { 'x-app-request': '1' },
      body: JSON.stringify({ type: 'matrix', coords: '1,2;3,4' }),
    })
    const response = await POST(request)

    expect(response.status).toBe(429)
  })

  it('retourne 400 pour un body invalide', async () => {
    const request = new NextRequest('http://localhost/api/mapbox', {
      method: 'POST',
      headers: { 'x-app-request': '1' },
      body: JSON.stringify({ type: 'invalid' }),
    })
    const response = await POST(request)

    expect(response.status).toBe(400)
  })

  it('proxy matrix et retourne les données', async () => {
    const mockResponse = { durations: [[0, 100]], distances: [[0, 5000]] }
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response(JSON.stringify(mockResponse), { status: 200 })
    )

    const request = new NextRequest('http://localhost/api/mapbox', {
      method: 'POST',
      headers: { 'x-app-request': '1' },
      body: JSON.stringify({ type: 'matrix', coords: '-73.5,45.5;-73.6,45.6' }),
    })
    const response = await POST(request)

    expect(response.status).toBe(200)
    const data = await response.json()
    expect(data.durations).toBeDefined()
  })

  it('retourne 502 quand Mapbox échoue (matrix)', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(new Response('error', { status: 500 }))

    const request = new NextRequest('http://localhost/api/mapbox', {
      method: 'POST',
      headers: { 'x-app-request': '1' },
      body: JSON.stringify({ type: 'matrix', coords: '-73.5,45.5;-73.6,45.6' }),
    })
    const response = await POST(request)

    expect(response.status).toBe(502)
  })

  it('proxy directions et retourne les données', async () => {
    const mockResponse = { routes: [{ geometry: { coordinates: [] }, duration: 600, distance: 5000 }] }
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response(JSON.stringify(mockResponse), { status: 200 })
    )

    const request = new NextRequest('http://localhost/api/mapbox', {
      method: 'POST',
      headers: { 'x-app-request': '1' },
      body: JSON.stringify({ type: 'directions', origin: [45.5, -73.5], destination: [45.6, -73.6] }),
    })
    const response = await POST(request)

    expect(response.status).toBe(200)
  })

  it('retourne 500 quand fetch lance une exception', async () => {
    vi.spyOn(globalThis, 'fetch').mockRejectedValueOnce(new Error('Network error'))

    const request = new NextRequest('http://localhost/api/mapbox', {
      method: 'POST',
      headers: { 'x-app-request': '1' },
      body: JSON.stringify({ type: 'matrix', coords: '-73.5,45.5;-73.6,45.6' }),
    })
    const response = await POST(request)

    expect(response.status).toBe(500)
    expect(mocks.logActivity).toHaveBeenCalledWith('erreur', 'Échec proxy routage', undefined, expect.any(Object))
  })
})
