// @vitest-environment node

import { NextRequest } from 'next/server'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => {
  const rpc = vi.fn()
  const insert = vi.fn()
  const selectChain = {
    eq: vi.fn((): unknown => selectChain),
    is: vi.fn((): unknown => ({ ...selectChain, eq: vi.fn(() => selectChain) })),
    order: vi.fn(),
    select: vi.fn((): unknown => selectChain),
  }
  const from = vi.fn((): unknown => ({
    insert,
    select: selectChain.select,
    update: vi.fn(() => ({ eq: vi.fn(() => ({ eq: vi.fn() })) })),
    delete: vi.fn(() => ({ eq: vi.fn() })),
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
      rpc,
    })),
    from,
    getIP: vi.fn(),
    getUser,
    getUserById,
    insert,
    rateLimit: vi.fn(),
    rpc,
    selectChain,
  }
})

vi.mock('@/lib/supabase', () => ({
  supabaseAdmin: mocks.createClient(),
}))

vi.mock('@/lib/rateLimit', () => ({
  getIP: mocks.getIP,
  rateLimit: mocks.rateLimit,
  checkCsrf: vi.fn(() => true),
  getRequestId: vi.fn(() => 'test-req-id'),
}))

import { POST } from '@/app/api/reviews/route'

function makeVoteRequest(body: Record<string, unknown>, token?: string) {
  const headers: Record<string, string> = { 'content-type': 'application/json' }
  if (token) headers.authorization = `Bearer ${token}`
  return new NextRequest('http://localhost/api/reviews', {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  })
}

describe('/api/reviews — vote via RPC handle_vote', () => {
  beforeEach(() => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://example.supabase.co'
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'service-role'
    process.env.ADMIN_EMAILS = 'admin@test.com'

    mocks.getIP.mockReset()
    mocks.rateLimit.mockReset()
    mocks.rpc.mockReset()
    mocks.getUser.mockReset()
    mocks.insert.mockReset()
    mocks.selectChain.order.mockReset()

    mocks.getIP.mockReturnValue('203.0.113.1')
    mocks.rateLimit.mockReturnValue(true)
    mocks.rpc.mockResolvedValue({ error: null })
    mocks.getUser.mockResolvedValue({ data: { user: null } })
    mocks.selectChain.order.mockResolvedValue({ data: [] })
    mocks.insert.mockResolvedValue({ error: null })
  })

  // ────── Vote anonyme ──────

  it('vote valide appelle rpc handle_vote avec les bons parametres (anonyme)', async () => {
    const anonymousId = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890'

    const response = await POST(
      makeVoteRequest({
        action: 'vote',
        comment_id: 42,
        vote: 1,
        anonymous_id: anonymousId,
      }),
    )

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual({ ok: true })

    expect(mocks.rpc).toHaveBeenCalledOnce()
    expect(mocks.rpc).toHaveBeenCalledWith('handle_vote', {
      p_comment_id: 42,
      p_vote: 1,
      p_user_id: null,
      p_anonymous_id: anonymousId,
    })
  })

  // ────── Vote authentifié ──────

  it('vote valide appelle rpc handle_vote avec user_id (authentifie)', async () => {
    mocks.getUser.mockResolvedValue({
      data: { user: { id: 'user-abc-123', email: 'user@test.com' } },
    })

    const response = await POST(
      makeVoteRequest(
        {
          action: 'vote',
          comment_id: 7,
          vote: -1,
          anonymous_id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
        },
        'valid-token',
      ),
    )

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual({ ok: true })

    expect(mocks.rpc).toHaveBeenCalledOnce()
    expect(mocks.rpc).toHaveBeenCalledWith('handle_vote', {
      p_comment_id: 7,
      p_vote: -1,
      p_user_id: 'user-abc-123',
      p_anonymous_id: null,
    })
  })

  // ────── Erreur RPC ──────

  it('retourne 500 si rpc echoue', async () => {
    mocks.rpc.mockResolvedValue({ error: { message: 'db error' } })

    const response = await POST(
      makeVoteRequest({
        action: 'vote',
        comment_id: 1,
        vote: 1,
        anonymous_id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
      }),
    )

    expect(response.status).toBe(500)
    await expect(response.json()).resolves.toMatchObject({
      error: 'Erreur serveur',
    })
  })

  // ────── Vote invalide (valeur hors 1/-1) ──────

  it('retourne 400 pour un vote invalide (vote=0)', async () => {
    const response = await POST(
      makeVoteRequest({
        action: 'vote',
        comment_id: 1,
        vote: 0,
        anonymous_id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
      }),
    )

    expect(response.status).toBe(400)
    await expect(response.json()).resolves.toMatchObject({
      error: expect.any(String),
    })
    expect(mocks.rpc).not.toHaveBeenCalled()
  })

  it('retourne 400 pour un vote invalide (vote=5)', async () => {
    const response = await POST(
      makeVoteRequest({
        action: 'vote',
        comment_id: 1,
        vote: 5,
        anonymous_id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
      }),
    )

    expect(response.status).toBe(400)
    expect(mocks.rpc).not.toHaveBeenCalled()
  })

  // ────── Aucun identifiant ──────

  it('retourne 400 sans identifiant (pas de user ni anonymous_id)', async () => {
    const response = await POST(
      makeVoteRequest({
        action: 'vote',
        comment_id: 1,
        vote: 1,
      }),
    )

    expect(response.status).toBe(400)
    await expect(response.json()).resolves.toMatchObject({
      error: expect.stringContaining('requis'),
    })
    expect(mocks.rpc).not.toHaveBeenCalled()
  })
})
