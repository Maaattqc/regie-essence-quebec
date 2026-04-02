// @vitest-environment node

import { NextRequest } from 'next/server'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  createClient: vi.fn(),
  verifyOtp: vi.fn(),
  logActivity: vi.fn(),
  rateLimit: vi.fn(),
  getIP: vi.fn(),
}))

vi.mock('@supabase/supabase-js', () => ({
  createClient: mocks.createClient,
}))

vi.mock('@/lib/activity-log', () => ({
  logActivity: mocks.logActivity,
}))

vi.mock('@/lib/rateLimit', () => ({
  rateLimit: mocks.rateLimit,
  getIP: mocks.getIP,
}))

import { GET } from '@/app/auth/callback/route'

describe('GET /auth/callback', () => {
  beforeEach(() => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://example.supabase.co'
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'anon-key'

    mocks.createClient.mockReset()
    mocks.verifyOtp.mockReset()

    mocks.createClient.mockReturnValue({
      auth: {
        verifyOtp: mocks.verifyOtp,
      },
    })
    mocks.verifyOtp.mockResolvedValue({ data: { user: { email: 'test@example.com' } }, error: null })
    mocks.logActivity.mockResolvedValue(undefined)
    mocks.rateLimit.mockReturnValue(true)
    mocks.getIP.mockReturnValue('127.0.0.1')
  })

  it('verifie le token otp quand les parametres sont presents', async () => {
    const response = await GET(
      new NextRequest(
        'http://localhost/auth/callback?token_hash=abc123&type=magiclink',
      ),
    )

    expect(response.status).toBe(307)
    expect(response.headers.get('location')).toBe('http://localhost/')
    expect(mocks.createClient).toHaveBeenCalledWith(
      'https://example.supabase.co',
      'anon-key',
    )
    expect(mocks.verifyOtp).toHaveBeenCalledWith({
      token_hash: 'abc123',
      type: 'magiclink',
    })
  })

  it('redirige meme sans verification quand les parametres manquent', async () => {
    const response = await GET(new NextRequest('http://localhost/auth/callback'))

    expect(response.status).toBe(307)
    expect(response.headers.get('location')).toBe('http://localhost/')
    expect(mocks.verifyOtp).not.toHaveBeenCalled()
  })
})
