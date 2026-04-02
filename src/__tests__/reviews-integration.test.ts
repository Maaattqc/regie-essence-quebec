// @vitest-environment node
//
// Tests d'intégration /api/reviews
// Cas non couverts par reviews-route.test.ts :
//  - voteSchema : vote=0 invalide, vote=+2 invalide
//  - voteSchema : anonymous_id invalide (pas un UUID)
//  - commentSchema : content > 1000 chars invalide
//  - commentSchema : station_name absent → 400
//  - commentSchema : ni user_id ni anonymous_id → 400
//  - DELETE : format d'erreur JSON sur 401/403
//  - DELETE : succès admin (lignes 172-180)
//  - Vote toggle : vote existant (lignes 113-127)

// IMPORTANT: process.env.ADMIN_EMAILS doit être défini avant le chargement du module
// car la constante ADMIN_EMAILS est évaluée à l'initialisation du module.
vi.hoisted(() => {
  process.env.ADMIN_EMAILS = 'admin@test.com'
})

import { NextRequest } from 'next/server'
import { beforeEach, describe, expect, it, vi } from 'vitest'

// Mock universel : chaque méthode Supabase retourne l'objet chain lui-même
const chain = {
  delete: vi.fn(),
  eq: vi.fn(),
  insert: vi.fn(),
  is: vi.fn(),
  maybeSingle: vi.fn(),
  order: vi.fn(),
  rpc: vi.fn(),
  select: vi.fn(),
  update: vi.fn(),
}

// Toutes les méthodes de chaîne retournent le même objet
chain.select.mockReturnValue(chain)
chain.eq.mockReturnValue(chain)
chain.is.mockReturnValue(chain)
chain.delete.mockReturnValue(chain)
chain.update.mockReturnValue(chain)
chain.order.mockResolvedValue({ data: [] })
chain.maybeSingle.mockResolvedValue({ data: null })
chain.insert.mockResolvedValue({ error: null })
chain.rpc.mockResolvedValue({ error: null })

const mocks = vi.hoisted(() => ({
  from: vi.fn(() => chain),
  getIP: vi.fn(),
  getUser: vi.fn(),
  rateLimit: vi.fn(),
  rpc: vi.fn(),
}))

vi.mock('@/lib/supabase', () => ({
  supabaseAdmin: {
    auth: {
      admin: { getUserById: vi.fn().mockResolvedValue({ data: { user: null } }) },
      getUser: mocks.getUser,
    },
    from: mocks.from,
    rpc: mocks.rpc,
  },
}))

vi.mock('@/lib/rateLimit', () => ({
  getIP: mocks.getIP,
  rateLimit: mocks.rateLimit,
}))

import { DELETE, GET, POST } from '@/app/api/reviews/route'

describe('/api/reviews — intégration validation et format derreur', () => {
  beforeEach(() => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://example.supabase.co'
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'service-role'
    process.env.ADMIN_EMAILS = 'admin@test.com'

    mocks.getIP.mockReturnValue('203.0.113.10')
    mocks.rateLimit.mockReturnValue(true)
    mocks.getUser.mockResolvedValue({ data: { user: null } })
    mocks.rpc.mockResolvedValue({ error: null })
    mocks.from.mockClear()
    chain.insert.mockClear()
    chain.order.mockResolvedValue({ data: [] })
    chain.maybeSingle.mockResolvedValue({ data: null })
    chain.insert.mockResolvedValue({ error: null })
  })

  // ── Vote — validation des valeurs ───────────────────────────

  it('rejette un vote=0 (hors enum ±1)', async () => {
    const response = await POST(
      new NextRequest('http://localhost/api/reviews', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          action: 'vote',
          comment_id: 1,
          vote: 0,
          anonymous_id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
        }),
      }),
    )

    expect(response.status).toBe(400)
    const body = await response.json()
    expect(typeof body.error).toBe('string')
  })

  it('rejette un vote=2 (hors enum ±1)', async () => {
    const response = await POST(
      new NextRequest('http://localhost/api/reviews', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          action: 'vote',
          comment_id: 1,
          vote: 2,
          anonymous_id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
        }),
      }),
    )

    expect(response.status).toBe(400)
  })

  it('rejette un vote=-2 (hors enum ±1)', async () => {
    const response = await POST(
      new NextRequest('http://localhost/api/reviews', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          action: 'vote',
          comment_id: 1,
          vote: -2,
          anonymous_id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
        }),
      }),
    )

    expect(response.status).toBe(400)
  })

  it('rejette un anonymous_id qui nest pas un UUID valide', async () => {
    const response = await POST(
      new NextRequest('http://localhost/api/reviews', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          action: 'vote',
          comment_id: 1,
          vote: 1,
          anonymous_id: 'pas-un-uuid',
        }),
      }),
    )

    expect(response.status).toBe(400)
    const body = await response.json()
    expect(body.error).toMatch(/invalide|invalid|UUID/i)
  })

  it('rejette un comment_id negatif ou zero', async () => {
    const response = await POST(
      new NextRequest('http://localhost/api/reviews', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          action: 'vote',
          comment_id: -1,
          vote: 1,
          anonymous_id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
        }),
      }),
    )

    expect(response.status).toBe(400)
  })

  // ── Commentaire — validation du schéma ──────────────────────

  it('accepte un vote +1 valide et retourne 200', async () => {
    const response = await POST(
      new NextRequest('http://localhost/api/reviews', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          action: 'vote',
          comment_id: 42,
          vote: 1,
          anonymous_id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
        }),
      }),
    )

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual({ ok: true })
  })

  it('accepte un vote -1 valide et retourne 200', async () => {
    const response = await POST(
      new NextRequest('http://localhost/api/reviews', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          action: 'vote',
          comment_id: 42,
          vote: -1,
          anonymous_id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
        }),
      }),
    )

    expect(response.status).toBe(200)
  })

  it('rejette un commentaire avec content > 1000 chars', async () => {
    const response = await POST(
      new NextRequest('http://localhost/api/reviews', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          station_name: 'Shell',
          address: '123 Rue',
          content: 'a'.repeat(1001),
          anonymous_id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
        }),
      }),
    )

    expect(response.status).toBe(400)
    expect(chain.insert).not.toHaveBeenCalled()
  })

  it('rejette un commentaire quand station_name est absent', async () => {
    const response = await POST(
      new NextRequest('http://localhost/api/reviews', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          address: '123 Rue',
          content: 'Bon service!',
          anonymous_id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
        }),
      }),
    )

    expect(response.status).toBe(400)
  })

  it('rejette un commentaire quand ni user_id ni anonymous_id nest fourni', async () => {
    const response = await POST(
      new NextRequest('http://localhost/api/reviews', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          station_name: 'Shell',
          address: '123 Rue',
          content: 'Bon service!',
        }),
      }),
    )

    expect(response.status).toBe(400)
  })

  it('accepte un commentaire exactement a la limite (1000 chars)', async () => {
    const response = await POST(
      new NextRequest('http://localhost/api/reviews', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          station_name: 'Shell',
          address: '123 Rue',
          content: 'a'.repeat(1000),
          anonymous_id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
        }),
      }),
    )

    expect(response.status).toBe(200)
    expect(chain.insert).toHaveBeenCalledTimes(1)
  })

  // ── GET — paramètres ─────────────────────────────────────────

  it('GET retourne 400 avec error JSON quand station est absent', async () => {
    const response = await GET(
      new NextRequest('http://localhost/api/reviews?address=123+Rue'),
    )

    expect(response.status).toBe(400)
    expect(response.headers.get('content-type')).toMatch(/application\/json/)
    const body = await response.json()
    expect(typeof body.error).toBe('string')
  })

  it('GET retourne 400 avec error JSON quand address est absent', async () => {
    const response = await GET(
      new NextRequest('http://localhost/api/reviews?station=Shell'),
    )

    expect(response.status).toBe(400)
    const body = await response.json()
    expect(typeof body.error).toBe('string')
  })

  it('GET retourne un tableau vide avec Content-Type JSON', async () => {
    const response = await GET(
      new NextRequest('http://localhost/api/reviews?station=Shell&address=123+Rue'),
    )

    expect(response.status).toBe(200)
    expect(response.headers.get('content-type')).toMatch(/application\/json/)
    const data = await response.json()
    expect(Array.isArray(data)).toBe(true)
  })

  // ── DELETE — format d'erreur ─────────────────────────────────

  it('DELETE retourne 401 avec error JSON quand pas de token', async () => {
    const response = await DELETE(
      new NextRequest('http://localhost/api/reviews', {
        method: 'DELETE',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ comment_id: 1 }),
      }),
    )

    expect(response.status).toBe(401)
    expect(response.headers.get('content-type')).toMatch(/application\/json/)
    const body = await response.json()
    expect(typeof body.error).toBe('string')
  })

  it('DELETE retourne 403 avec error JSON pour un utilisateur non-admin', async () => {
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
    const body = await response.json()
    expect(typeof body.error).toBe('string')
  })

  it('DELETE retourne 200 quand ladmin supprime un commentaire valide', async () => {
    mocks.getUser.mockResolvedValue({
      data: { user: { id: 'admin-1', email: 'admin@test.com' } },
    })

    const response = await DELETE(
      new NextRequest('http://localhost/api/reviews', {
        method: 'DELETE',
        headers: {
          'content-type': 'application/json',
          authorization: 'Bearer admin-token',
        },
        body: JSON.stringify({ comment_id: 42 }),
      }),
    )

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual({ ok: true })
  })

  it('DELETE retourne 400 quand comment_id est absent', async () => {
    mocks.getUser.mockResolvedValue({
      data: { user: { id: 'admin-1', email: 'admin@test.com' } },
    })

    const response = await DELETE(
      new NextRequest('http://localhost/api/reviews', {
        method: 'DELETE',
        headers: {
          'content-type': 'application/json',
          authorization: 'Bearer admin-token',
        },
        body: JSON.stringify({}),
      }),
    )

    expect(response.status).toBe(400)
  })

  it('DELETE retourne 400 quand comment_id est une chaine et non un nombre', async () => {
    mocks.getUser.mockResolvedValue({
      data: { user: { id: 'admin-1', email: 'admin@test.com' } },
    })

    const response = await DELETE(
      new NextRequest('http://localhost/api/reviews', {
        method: 'DELETE',
        headers: {
          'content-type': 'application/json',
          authorization: 'Bearer admin-token',
        },
        body: JSON.stringify({ comment_id: 'abc' }),
      }),
    )

    expect(response.status).toBe(400)
  })

  // ── Vote — toggle (vote existant) ────────────────────────────

  it('vote retourne 200 quand un vote existant est remis dans le meme sens (suppression)', async () => {
    // existing vote = +1, new vote = +1 → toggle off (delete)
    chain.maybeSingle.mockResolvedValueOnce({ data: { vote: 1 } })

    const response = await POST(
      new NextRequest('http://localhost/api/reviews', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          action: 'vote',
          comment_id: 10,
          vote: 1,
          anonymous_id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
        }),
      }),
    )

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual({ ok: true })
  })

  it('vote retourne 200 quand un vote existant est change de sens (mise a jour)', async () => {
    // existing vote = +1, new vote = -1 → toggle direction (update)
    chain.maybeSingle.mockResolvedValueOnce({ data: { vote: 1 } })

    const response = await POST(
      new NextRequest('http://localhost/api/reviews', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          action: 'vote',
          comment_id: 10,
          vote: -1,
          anonymous_id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
        }),
      }),
    )

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual({ ok: true })
  })

  it('vote retourne 200 avec un utilisateur authentifie (couvre la branche user)', async () => {
    // Simule un utilisateur authentifié avec token
    mocks.getUser.mockResolvedValue({
      data: { user: { id: 'user-auth-1' } },
    })

    const response = await POST(
      new NextRequest('http://localhost/api/reviews', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          authorization: 'Bearer user-token',
        },
        body: JSON.stringify({
          action: 'vote',
          comment_id: 20,
          vote: 1,
          anonymous_id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
        }),
      }),
    )

    expect(response.status).toBe(200)
  })

  it('vote authentifie avec vote existant (couvre branche user dans toggle)', async () => {
    mocks.getUser.mockResolvedValue({
      data: { user: { id: 'user-auth-1' } },
    })
    chain.maybeSingle.mockResolvedValueOnce({ data: { vote: 1 } })

    const response = await POST(
      new NextRequest('http://localhost/api/reviews', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          authorization: 'Bearer user-token',
        },
        body: JSON.stringify({
          action: 'vote',
          comment_id: 20,
          vote: 1,
        }),
      }),
    )

    expect(response.status).toBe(200)
  })

  it('POST commentaire retourne 500 si supabase echoue sur insert', async () => {
    chain.insert.mockResolvedValueOnce({ error: { message: 'DB error' } })

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

    expect(response.status).toBe(500)
    const body = await response.json()
    expect(typeof body.error).toBe('string')
  })
})
