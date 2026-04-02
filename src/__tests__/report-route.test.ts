// @vitest-environment node

import { NextRequest } from 'next/server'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => {
  const insert = vi.fn()
  const from = vi.fn(() => ({ insert }))

  return {
    createClient: vi.fn(() => ({ from })),
    from,
    getIP: vi.fn(),
    insert,
    rateLimit: vi.fn(),
  }
})

vi.mock('@supabase/supabase-js', () => ({
  createClient: mocks.createClient,
}))

vi.mock('@/lib/rateLimit', () => ({
  getIP: mocks.getIP,
  rateLimit: mocks.rateLimit,
}))

import { POST } from '@/app/api/report/route'

const validBody = {
  station_name: 'Shell Montreal',
  address: '123 Rue Main, Montreal',
  first_name: 'Jean',
  last_name: 'Tremblay',
  email: 'jean@example.com',
  message: 'Le prix affiche ne correspond pas au prix reel.',
}

describe('POST /api/report', () => {
  beforeEach(() => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://example.supabase.co'
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'service-role'

    mocks.createClient.mockClear()
    mocks.from.mockClear()
    mocks.getIP.mockReset()
    mocks.insert.mockReset()
    mocks.rateLimit.mockReset()

    mocks.getIP.mockReturnValue('203.0.113.1')
    mocks.insert.mockResolvedValue({ error: null })
    mocks.rateLimit.mockReturnValue(true)
  })

  it('bloque quand le rate limit est depasse', async () => {
    mocks.rateLimit.mockReturnValue(false)

    const response = await POST(
      new NextRequest('http://localhost/api/report', {
        body: JSON.stringify(validBody),
        headers: { 'content-type': 'application/json' },
        method: 'POST',
      }),
    )

    expect(response.status).toBe(429)
    await expect(response.json()).resolves.toMatchObject({
      error: expect.stringContaining('Trop de'),
    })
  })

  it('retourne 400 quand la charge utile est invalide', async () => {
    const response = await POST(
      new NextRequest('http://localhost/api/report', {
        body: JSON.stringify({ ...validBody, email: 'bad-email' }),
        headers: { 'content-type': 'application/json' },
        method: 'POST',
      }),
    )

    expect(response.status).toBe(400)
    await expect(response.json()).resolves.toMatchObject({
      error: expect.any(String),
    })
    expect(mocks.createClient).not.toHaveBeenCalled()
  })

  it('insere le signalement valide dans supabase', async () => {
    const response = await POST(
      new NextRequest('http://localhost/api/report', {
        body: JSON.stringify(validBody),
        headers: { 'content-type': 'application/json' },
        method: 'POST',
      }),
    )

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual({ ok: true })
    expect(mocks.createClient).toHaveBeenCalledWith(
      'https://example.supabase.co',
      'service-role',
    )
    expect(mocks.from).toHaveBeenCalledWith('reports')
    expect(mocks.insert).toHaveBeenCalledWith(validBody)
  })

  it('propage lerreur supabase en 500', async () => {
    mocks.insert.mockResolvedValue({
      error: { message: 'insert failed' },
    })

    const response = await POST(
      new NextRequest('http://localhost/api/report', {
        body: JSON.stringify(validBody),
        headers: { 'content-type': 'application/json' },
        method: 'POST',
      }),
    )

    expect(response.status).toBe(500)
    await expect(response.json()).resolves.toEqual({ error: 'insert failed' })
  })
})
