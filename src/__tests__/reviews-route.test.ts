// @vitest-environment node

import { NextRequest } from 'next/server'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => {
  const maybeSingle = vi.fn()
  const is = vi.fn(() => ({ maybeSingle, eq: vi.fn(() => ({ maybeSingle })) }))
  const selectChain = {
    eq: vi.fn((): unknown => selectChain),
    is: vi.fn((): unknown => ({ ...selectChain, eq: vi.fn(() => selectChain) })),
    order: vi.fn(),
    maybeSingle,
    select: vi.fn((): unknown => selectChain),
  }
  const deleteChain = {
    eq: vi.fn((): unknown => deleteChain),
    is: vi.fn((): unknown => deleteChain),
  }
  const updateChain = {
    eq: vi.fn((): unknown => updateChain),
    is: vi.fn((): unknown => updateChain),
  }
  const insert = vi.fn()
  const from = vi.fn((): unknown => ({
    delete: vi.fn(() => deleteChain),
    insert,
    is,
    select: selectChain.select,
    update: vi.fn(() => updateChain),
  }))
  const getUser = vi.fn()
  const getUserById = vi.fn()

  return {
    createClient: vi.fn(() => ({
      auth: {
        admin: { getUserById },
        getUser,
      },
      from,
      rpc: vi.fn(),
    })),
    deleteChain,
    from,
    getIP: vi.fn(),
    getUser,
    getUserById,
    insert,
    is,
    maybeSingle,
    rateLimit: vi.fn(),
    selectChain,
    updateChain,
  }
})

vi.mock('@/lib/supabase', () => ({
  supabaseAdmin: mocks.createClient(),
}))

vi.mock('@/lib/rateLimit', () => ({
  getIP: mocks.getIP,
  rateLimit: mocks.rateLimit,
}))

import { DELETE, GET, POST } from '@/app/api/reviews/route'

describe('/api/reviews', () => {
  beforeEach(() => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://example.supabase.co'
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'service-role'
    process.env.ADMIN_EMAILS = 'admin@test.com'

    mocks.getIP.mockReset()
    mocks.rateLimit.mockReset()
    mocks.from.mockClear()
    mocks.insert.mockReset()
    mocks.getUser.mockReset()
    mocks.getUserById.mockReset()
    mocks.selectChain.order.mockReset()
    mocks.selectChain.eq.mockClear()
    mocks.selectChain.select.mockClear()
    mocks.maybeSingle.mockReset()

    mocks.getIP.mockReturnValue('203.0.113.1')
    mocks.rateLimit.mockReturnValue(true)
    mocks.insert.mockResolvedValue({ error: null })
    mocks.selectChain.order.mockResolvedValue({ data: [] })
    mocks.getUser.mockResolvedValue({ data: { user: null } })
  })

  // ────── GET ──────

  describe('GET', () => {
    it('retourne 429 quand le rate limit est depasse', async () => {
      mocks.rateLimit.mockReturnValue(false)

      const response = await GET(
        new NextRequest('http://localhost/api/reviews?station=A&address=B'),
      )

      expect(response.status).toBe(429)
      await expect(response.json()).resolves.toMatchObject({
        error: expect.stringContaining('Trop de'),
      })
    })

    it('retourne 400 sans station ou address', async () => {
      const response = await GET(
        new NextRequest('http://localhost/api/reviews'),
      )

      expect(response.status).toBe(400)
      await expect(response.json()).resolves.toMatchObject({
        error: expect.stringContaining('station'),
      })
    })

    it('retourne la liste des commentaires', async () => {
      mocks.selectChain.order.mockResolvedValue({
        data: [
          {
            id: 1,
            content: 'Super station',
            parent_id: null,
            likes: 2,
            dislikes: 0,
            created_at: '2026-04-01T12:00:00Z',
            user_id: null,
            anonymous_id: 'abcd1234',
          },
        ],
      })

      const response = await GET(
        new NextRequest('http://localhost/api/reviews?station=Shell&address=123 Rue'),
      )

      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data).toHaveLength(1)
      expect(data[0]).toMatchObject({
        id: 1,
        content: 'Super station',
        author: 'Anonyme-abcd',
      })
    })
  })

  // ────── POST vote ──────

  describe('POST vote', () => {
    it('retourne 400 avec un vote invalide', async () => {
      const response = await POST(
        new NextRequest('http://localhost/api/reviews', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({
            action: 'vote',
            comment_id: 1,
            vote: 5,
            anonymous_id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
          }),
        }),
      )

      expect(response.status).toBe(400)
      await expect(response.json()).resolves.toMatchObject({
        error: expect.any(String),
      })
    })
  })

  // ────── POST comment ──────

  describe('POST comment', () => {
    it('retourne 400 sans contenu', async () => {
      const response = await POST(
        new NextRequest('http://localhost/api/reviews', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({
            station_name: 'Shell',
            address: '123 Rue',
            content: '',
            anonymous_id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
          }),
        }),
      )

      expect(response.status).toBe(400)
      await expect(response.json()).resolves.toMatchObject({
        error: expect.stringContaining('requis'),
      })
    })

    it('reussit avec un anonymous_id', async () => {
      const response = await POST(
        new NextRequest('http://localhost/api/reviews', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({
            station_name: 'Shell',
            address: '123 Rue',
            content: 'Bon service!',
            anonymous_id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
          }),
        }),
      )

      expect(response.status).toBe(200)
      await expect(response.json()).resolves.toEqual({ ok: true })
      expect(mocks.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          anonymous_id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
          content: 'Bon service!',
          station_name: 'Shell',
          address: '123 Rue',
          user_id: null,
        }),
      )
    })
  })

  // ────── DELETE ──────

  describe('DELETE', () => {
    it('retourne 401 sans token', async () => {
      const response = await DELETE(
        new NextRequest('http://localhost/api/reviews', {
          method: 'DELETE',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ comment_id: 1 }),
        }),
      )

      expect(response.status).toBe(401)
      await expect(response.json()).resolves.toMatchObject({
        error: expect.any(String),
      })
    })

    it('retourne 403 pour un non-admin', async () => {
      mocks.getUser.mockResolvedValue({
        data: { user: { id: 'user-1', email: 'user@test.com' } },
      })

      const response = await DELETE(
        new NextRequest('http://localhost/api/reviews', {
          method: 'DELETE',
          headers: {
            'content-type': 'application/json',
            authorization: 'Bearer some-token',
          },
          body: JSON.stringify({ comment_id: 1 }),
        }),
      )

      expect(response.status).toBe(403)
      await expect(response.json()).resolves.toMatchObject({
        error: expect.stringContaining('autorisé'),
      })
    })
  })
})
