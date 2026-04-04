// @vitest-environment node

import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  getIP: vi.fn(),
  rateLimit: vi.fn(),
  logActivity: vi.fn(),
  createClient: vi.fn(),
}))

vi.mock('@/lib/rateLimit', () => ({
  getIP: mocks.getIP,
  rateLimit: mocks.rateLimit,
}))

vi.mock('@/lib/activity-log', () => ({
  logActivity: mocks.logActivity,
}))

vi.mock('@supabase/supabase-js', () => ({
  createClient: mocks.createClient,
}))

import { POST } from '@/app/api/auth/log/route'
import { NextRequest } from 'next/server'

describe('POST /api/auth/log', () => {
  beforeEach(() => {
    mocks.getIP.mockReturnValue('203.0.113.4')
    mocks.rateLimit.mockReturnValue(true)
    mocks.logActivity.mockResolvedValue(undefined)
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co'
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key'

    mocks.createClient.mockReturnValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { email: 'test@example.com' } },
          error: null,
        }),
      },
    })
  })

  it('retourne 429 quand le rate limit est dépassé', async () => {
    mocks.rateLimit.mockReturnValue(false)

    const request = new NextRequest('http://localhost/api/auth/log', {
      method: 'POST',
      body: JSON.stringify({ email: 'test@example.com', event: 'SIGNED_IN', token: 'jwt' }),
    })
    const response = await POST(request)

    expect(response.status).toBe(429)
  })

  it('retourne 400 quand les données sont manquantes', async () => {
    const request = new NextRequest('http://localhost/api/auth/log', {
      method: 'POST',
      body: JSON.stringify({}),
    })
    const response = await POST(request)

    expect(response.status).toBe(400)
  })

  it('retourne 403 quand le token est invalide', async () => {
    mocks.createClient.mockReturnValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: null },
          error: new Error('Invalid token'),
        }),
      },
    })

    const request = new NextRequest('http://localhost/api/auth/log', {
      method: 'POST',
      body: JSON.stringify({ email: 'test@example.com', event: 'SIGNED_IN', token: 'invalid' }),
    })
    const response = await POST(request)

    expect(response.status).toBe(403)
  })

  it('log la connexion et retourne ok', async () => {
    const request = new NextRequest('http://localhost/api/auth/log', {
      method: 'POST',
      body: JSON.stringify({ email: 'test@example.com', event: 'SIGNED_IN', token: 'jwt' }),
    })
    const response = await POST(request)

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual({ ok: true })
    expect(mocks.logActivity).toHaveBeenCalledWith('auth', 'Connexion', 'test@example.com', { event: 'SIGNED_IN' })
  })

  it('log la déconnexion correctement', async () => {
    const request = new NextRequest('http://localhost/api/auth/log', {
      method: 'POST',
      body: JSON.stringify({ email: 'test@example.com', event: 'SIGNED_OUT', token: 'jwt' }),
    })
    const response = await POST(request)

    expect(response.status).toBe(200)
    expect(mocks.logActivity).toHaveBeenCalledWith('auth', 'Déconnexion', 'test@example.com', { event: 'SIGNED_OUT' })
  })

  it('retourne 500 quand une exception est lancée', async () => {
    mocks.createClient.mockImplementation(() => { throw new Error('boom') })

    const request = new NextRequest('http://localhost/api/auth/log', {
      method: 'POST',
      body: JSON.stringify({ email: 'test@example.com', event: 'SIGNED_IN', token: 'jwt' }),
    })
    const response = await POST(request)

    expect(response.status).toBe(500)
    expect(mocks.logActivity).toHaveBeenCalledWith('erreur', 'Échec auth/log', undefined, expect.any(Object))
  })
})
