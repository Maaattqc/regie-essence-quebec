// @vitest-environment node
//
// Tests d'intégration POST /api/report
// Cas non couverts par report-route.test.ts :
//  - corps JSON non-objet (tableau)
//  - message trop court (< 10 chars) selon le schema
//  - message trop long (> 2000 chars)
//  - Content-Type de la réponse sur chaque statut (200, 400, 429)
//  - format d'erreur { error: string } cohérent

import { NextRequest } from 'next/server'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => {
  const insert = vi.fn()
  return {
    from: vi.fn(() => ({ insert })),
    getIP: vi.fn(),
    insert,
    logActivity: vi.fn(),
    rateLimit: vi.fn(),
  }
})

vi.mock('@/lib/supabase', () => ({
  supabaseAdmin: { from: mocks.from },
}))

vi.mock('@/lib/rateLimit', () => ({
  getIP: mocks.getIP,
  rateLimit: mocks.rateLimit,
  checkCsrf: vi.fn(() => true),
  getRequestId: vi.fn(() => 'test-req-id'),
}))

vi.mock('@/lib/activity-log', () => ({
  logActivity: mocks.logActivity,
}))

import { POST } from '@/app/api/report/route'

const validBody = {
  station_name: 'Shell Montreal',
  address: '123 Rue Main, Montreal',
  first_name: 'Jean',
  last_name: 'Tremblay',
  email: 'jean@example.com',
  message: 'Le prix affiché ne correspond pas au prix réel.',
}

describe('POST /api/report — intégration schéma et format de réponse', () => {
  beforeEach(() => {
    mocks.getIP.mockReturnValue('203.0.113.1')
    mocks.insert.mockResolvedValue({ error: null })
    mocks.rateLimit.mockReturnValue(true)
    mocks.from.mockClear()
    mocks.insert.mockClear()
    mocks.logActivity.mockClear()
  })

  // ── Validation de schéma ─────────────────────────────────────

  it('retourne 400 quand le corps est un tableau JSON au lieu dun objet', async () => {
    const response = await POST(
      new NextRequest('http://localhost/api/report', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify([validBody]),
      }),
    )

    expect(response.status).toBe(400)
    const body = await response.json()
    expect(typeof body.error).toBe('string')
  })

  it('retourne 400 quand message est trop court (< 10 chars)', async () => {
    const response = await POST(
      new NextRequest('http://localhost/api/report', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ ...validBody, message: 'Court' }),
      }),
    )

    expect(response.status).toBe(400)
    expect(mocks.insert).not.toHaveBeenCalled()
  })

  it('retourne 400 quand message depasse 2000 caracteres', async () => {
    const response = await POST(
      new NextRequest('http://localhost/api/report', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ ...validBody, message: 'a'.repeat(2001) }),
      }),
    )

    expect(response.status).toBe(400)
    expect(mocks.insert).not.toHaveBeenCalled()
  })

  it('retourne 400 quand first_name a moins de 2 caracteres', async () => {
    const response = await POST(
      new NextRequest('http://localhost/api/report', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ ...validBody, first_name: 'J' }),
      }),
    )

    expect(response.status).toBe(400)
    expect(mocks.insert).not.toHaveBeenCalled()
  })

  it('retourne 400 quand last_name a moins de 2 caracteres', async () => {
    const response = await POST(
      new NextRequest('http://localhost/api/report', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ ...validBody, last_name: 'T' }),
      }),
    )

    expect(response.status).toBe(400)
    expect(mocks.insert).not.toHaveBeenCalled()
  })

  it('retourne 400 quand station_name est une chaine vide', async () => {
    const response = await POST(
      new NextRequest('http://localhost/api/report', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ ...validBody, station_name: '' }),
      }),
    )

    expect(response.status).toBe(400)
    expect(mocks.insert).not.toHaveBeenCalled()
  })

  it('insere avec succes un corps valide a la limite superieure (message 2000 chars)', async () => {
    const response = await POST(
      new NextRequest('http://localhost/api/report', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ ...validBody, message: 'a'.repeat(2000) }),
      }),
    )

    expect(response.status).toBe(200)
    expect(mocks.insert).toHaveBeenCalledTimes(1)
  })

  // ── Format de réponse (Content-Type) ─────────────────────────

  it('reponse 200 a un Content-Type application/json', async () => {
    const response = await POST(
      new NextRequest('http://localhost/api/report', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(validBody),
      }),
    )

    expect(response.status).toBe(200)
    expect(response.headers.get('content-type')).toMatch(/application\/json/)
  })

  it('reponse 400 a un Content-Type application/json et error string', async () => {
    const response = await POST(
      new NextRequest('http://localhost/api/report', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ email: 'invalide' }),
      }),
    )

    expect(response.status).toBe(400)
    expect(response.headers.get('content-type')).toMatch(/application\/json/)
    const body = await response.json()
    expect(typeof body.error).toBe('string')
    expect(body.error.length).toBeGreaterThan(0)
  })

  it('reponse 429 a un Content-Type application/json et error string', async () => {
    mocks.rateLimit.mockReturnValue(false)

    const response = await POST(
      new NextRequest('http://localhost/api/report', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(validBody),
      }),
    )

    expect(response.status).toBe(429)
    expect(response.headers.get('content-type')).toMatch(/application\/json/)
    const body = await response.json()
    expect(typeof body.error).toBe('string')
    expect(body.error.length).toBeGreaterThan(0)
  })

  it('reponse 500 a un Content-Type application/json et error string', async () => {
    mocks.insert.mockResolvedValue({ error: { message: 'DB error' } })

    const response = await POST(
      new NextRequest('http://localhost/api/report', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(validBody),
      }),
    )

    expect(response.status).toBe(500)
    expect(response.headers.get('content-type')).toMatch(/application\/json/)
    const body = await response.json()
    expect(typeof body.error).toBe('string')
  })
})
