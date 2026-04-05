// @vitest-environment node

import { NextRequest } from 'next/server'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => {
  const single = vi.fn()
  const eq = vi.fn(() => ({ single }))
  const gt = vi.fn(() => ({ lt: vi.fn().mockReturnValue({ count: 0 }) }))
  const lt = vi.fn()
  const gte = vi.fn().mockReturnValue({ count: 0 })
  const limit = vi.fn()
  const range = vi.fn()
  const order = vi.fn(() => ({ limit, range }))
  const update = vi.fn(() => ({ eq: vi.fn().mockResolvedValue({ error: null }) }))
  const insert = vi.fn().mockResolvedValue({ error: null })
  const select = vi.fn(() => ({ order, eq, gt, lt, gte, count: 0 }))
  const from = vi.fn(() => ({ select, update, insert }))
  const rpc = vi.fn()
  const getUser = vi.fn()
  const listUsers = vi.fn()

  return {
    createClient: vi.fn(() => ({
      from,
      rpc,
      auth: {
        getUser,
        admin: { listUsers },
      },
    })),
    from,
    select,
    order,
    limit,
    range,
    single,
    eq,
    gt,
    lt,
    gte,
    update,
    insert,
    rpc,
    getUser,
    listUsers,
    logActivity: vi.fn(),
    rateLimit: vi.fn(),
    getIP: vi.fn(),
    checkCsrf: vi.fn(() => true),
    getRequestId: vi.fn(() => 'test-request-id'),
  }
})

vi.mock('@/lib/supabase', () => ({
  supabaseAdmin: mocks.createClient(),
}))

vi.mock('@/lib/activity-log', () => ({
  logActivity: mocks.logActivity,
}))

vi.mock('@/lib/rateLimit', () => ({
  rateLimit: mocks.rateLimit,
  getIP: mocks.getIP,
  checkCsrf: mocks.checkCsrf,
  getRequestId: mocks.getRequestId,
}))

import { GET, PATCH } from '@/app/api/admin/route'

/* ------------------------------------------------------------------ */
/*  Helpers                                                           */
/* ------------------------------------------------------------------ */

function makeGetRequest(params: Record<string, string>, token?: string) {
  const url = new URL('http://localhost/api/admin')
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v)
  const headers: Record<string, string> = {}
  if (token) headers.authorization = `Bearer ${token}`
  return new NextRequest(url, { headers })
}

function makePatchRequest(body: Record<string, unknown>, token?: string) {
  const headers: Record<string, string> = { 'content-type': 'application/json' }
  if (token) headers.authorization = `Bearer ${token}`
  return new NextRequest('http://localhost/api/admin', {
    method: 'PATCH',
    body: JSON.stringify(body),
    headers,
  })
}

/** Configure mocks so verifyAdmin returns an admin user */
function setupAdmin() {
  mocks.getUser.mockResolvedValue({
    data: { user: { id: 'admin-id', email: 'admin@test.com' } },
  })
  mocks.single.mockResolvedValue({ data: { role: 'admin' } })
}

/** Configure mocks so verifyAdmin returns null (non-authenticated) */
function setupNonAdmin() {
  mocks.getUser.mockResolvedValue({ data: { user: null } })
}

/* ------------------------------------------------------------------ */
/*  Setup                                                             */
/* ------------------------------------------------------------------ */

describe('/api/admin', () => {
  beforeEach(() => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://example.supabase.co'
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'service-role'
    process.env.ADMIN_EMAILS = 'admin@test.com'

    mocks.createClient.mockClear()
    mocks.from.mockClear()
    mocks.select.mockClear()
    mocks.order.mockClear()
    mocks.limit.mockClear()
    mocks.range.mockClear()
    mocks.single.mockClear()
    mocks.eq.mockClear()
    mocks.gt.mockClear()
    mocks.lt.mockClear()
    mocks.gte.mockClear()
    mocks.update.mockClear()
    mocks.insert.mockClear()
    mocks.rpc.mockClear()
    mocks.getUser.mockReset()
    mocks.listUsers.mockReset()
    mocks.listUsers.mockResolvedValue({ data: { users: [] } })
    mocks.logActivity.mockReset()
    mocks.rateLimit.mockReturnValue(true)
    mocks.getIP.mockReturnValue('127.0.0.1')

    // Default chain: from().select() returns a chainable query builder
    const queryBuilder = {
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      range: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      gt: vi.fn().mockReturnThis(),
      lt: vi.fn().mockReturnThis(),
      gte: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: null }),
      count: 0,
      data: null,
    }

    // Make each chainable method return the builder (thenable for await)
    for (const method of ['order', 'limit', 'range', 'eq', 'gt', 'lt', 'gte', 'is']) {
      (queryBuilder as Record<string, ReturnType<typeof vi.fn>>)[method] ??= vi.fn();
      (queryBuilder as Record<string, ReturnType<typeof vi.fn>>)[method].mockReturnValue(queryBuilder)
    }

    mocks.select.mockReturnValue(queryBuilder)
    mocks.from.mockReturnValue({
      select: mocks.select,
      update: mocks.update,
      insert: mocks.insert,
    })

    // Default update chain
    mocks.update.mockReturnValue({
      eq: vi.fn().mockResolvedValue({ error: null }),
    })

    setupNonAdmin()
  })

  /* ---------------------------------------------------------------- */
  /*  GET type=stats                                                  */
  /* ---------------------------------------------------------------- */

  describe('GET type=stats', () => {
    it('retourne la forme correcte des statistiques', async () => {
      // We need fine-grained control for the stats endpoint because it makes
      // many chained queries. We rebuild the mock chain for each from() call.
      const makeChain = (overrides: Record<string, unknown> = {}) => {
        const chain: Record<string, unknown> = {
          select: vi.fn(),
          order: vi.fn(),
          limit: vi.fn(),
          eq: vi.fn(),
          gt: vi.fn(),
          lt: vi.fn(),
          gte: vi.fn(),
          single: vi.fn().mockResolvedValue({ data: null }),
          count: overrides.count ?? 0,
          data: overrides.data ?? null,
        }
        for (const method of ['select', 'order', 'limit', 'eq', 'gt', 'lt', 'gte']) {
          (chain as Record<string, ReturnType<typeof vi.fn>>)[method].mockReturnValue(chain)
        }
        return chain
      }

      // price_snapshots count, price_snapshots latest, reports count,
      // profiles count, page_views x4
      const snapshotsCount = makeChain({ count: 42 })
      const snapshotsLatest = makeChain({ data: [{ snapshot_at: '2026-04-01' }] })
      const reportsCount = makeChain({ count: 5 })
      const profilesCount = makeChain({ count: 10 })
      const pageViewsTotal = makeChain({ count: 1000 })
      const pageViewsToday = makeChain({ count: 50 })
      const pageViewsWeek = makeChain({ count: 300 })
      const pageViewsMonth = makeChain({ count: 800 })

      let callIndex = 0
      const fromResults = [
        snapshotsCount,   // price_snapshots (count)
        snapshotsLatest,  // price_snapshots (latest)
        reportsCount,     // reports
        profilesCount,    // profiles
        pageViewsTotal,   // page_views total
        pageViewsToday,   // page_views today
        pageViewsWeek,    // page_views week
        pageViewsMonth,   // page_views month
      ]

      mocks.from.mockImplementation(() => {
        const result = fromResults[callIndex] ?? makeChain()
        callIndex++
        return result as ReturnType<typeof makeChain>
      })

      mocks.rpc.mockResolvedValue({
        data: { regulier: 172.5, super: 192.3, diesel: 185.1 },
      })

      const response = await GET(makeGetRequest({ type: 'stats' }))
      expect(response.status).toBe(200)

      const json = await response.json()
      expect(json).toMatchObject({
        totalSnapshots: 42,
        lastSnapshot: '2026-04-01',
        totalReports: 5,
        totalUsers: 10,
        avgRegulier: 172.5,
        avgSuper: 192.3,
        avgDiesel: 185.1,
        totalPageViews: 1000,
        todayPageViews: 50,
        weekPageViews: 300,
        monthPageViews: 800,
      })
    })
  })

  /* ---------------------------------------------------------------- */
  /*  GET type=users                                                  */
  /* ---------------------------------------------------------------- */

  describe('GET type=users', () => {
    const fakeProfiles = [
      { id: 'u1', email: 'alice@example.com', created_at: '2026-01-01' },
      { id: 'u2', email: 'bob@example.com', created_at: '2026-02-01' },
    ]

    function setupUsersQuery() {
      const chain: Record<string, unknown> = {
        select: vi.fn(),
        order: vi.fn(),
        limit: vi.fn(),
        range: vi.fn(),
        eq: vi.fn(),
        single: vi.fn(),
        data: fakeProfiles,
        count: null,
      }
      for (const method of ['select', 'order', 'limit', 'range', 'eq']) {
        (chain as Record<string, ReturnType<typeof vi.fn>>)[method].mockReturnValue(chain)
      }
      // For verifyAdmin profile lookup, return a separate chain
      const adminProfileChain: Record<string, unknown> = {
        select: vi.fn(),
        eq: vi.fn(),
        single: vi.fn().mockResolvedValue({ data: { role: 'admin' } }),
      }
      for (const method of ['select', 'eq']) {
        (adminProfileChain as Record<string, ReturnType<typeof vi.fn>>)[method].mockReturnValue(adminProfileChain)
      }

      let fromCallIndex = 0
      mocks.from.mockImplementation(() => {
        fromCallIndex++
        // First from('profiles') call is from verifyAdmin
        if (fromCallIndex === 1) return adminProfileChain as ReturnType<typeof vi.fn>
        // Second from('profiles') call is the actual users query
        return chain as ReturnType<typeof vi.fn>
      })
    }

    it('retourne les emails complets pour un admin', async () => {
      setupAdmin()
      setupUsersQuery()

      // listUsers remplace N×getUserById — 1 seul appel
      mocks.listUsers.mockResolvedValue({
        data: { users: [
          { id: 'u1', email: 'alice@example.com' },
          { id: 'u2', email: 'bob@example.com' },
        ] },
      })

      const response = await GET(makeGetRequest({ type: 'users' }, 'valid-token'))
      expect(response.status).toBe(200)

      const json = await response.json()
      expect(json).toHaveLength(2)
      expect(json[0].email).toBe('alice@example.com')
      expect(json[1].email).toBe('bob@example.com')
    })

    it('retourne les emails masques pour un non-admin', async () => {
      setupNonAdmin()

      const chain: Record<string, unknown> = {
        select: vi.fn(),
        order: vi.fn(),
        limit: vi.fn(),
        range: vi.fn(),
        data: fakeProfiles,
      }
      for (const method of ['select', 'order', 'limit', 'range']) {
        (chain as Record<string, ReturnType<typeof vi.fn>>)[method].mockReturnValue(chain)
      }
      mocks.from.mockReturnValue(chain as ReturnType<typeof vi.fn>)

      mocks.listUsers.mockResolvedValue({
        data: { users: [
          { id: 'u1', email: 'alice@example.com' },
          { id: 'u2', email: 'bob@example.com' },
        ] },
      })

      const response = await GET(makeGetRequest({ type: 'users' }))
      expect(response.status).toBe(200)

      const json = await response.json()
      expect(json).toHaveLength(2)
      expect(json[0].email).not.toBe('alice@example.com')
      expect(json[0].email).toContain('***')
      expect(json[1].email).not.toBe('bob@example.com')
      expect(json[1].email).toContain('***')
    })
  })

  /* ---------------------------------------------------------------- */
  /*  GET type=reports                                                */
  /* ---------------------------------------------------------------- */

  describe('GET type=reports', () => {
    it('retourne les noms et emails masques pour un non-admin', async () => {
      setupNonAdmin()

      const fakeReports = [
        {
          id: 1,
          email: 'reporter@example.com',
          first_name: 'Alice',
          last_name: 'Tremblay',
          message: 'Prix incorrect',
        },
      ]

      const chain: Record<string, unknown> = {
        select: vi.fn(),
        order: vi.fn(),
        limit: vi.fn(),
        range: vi.fn(),
        data: fakeReports,
      }
      for (const method of ['select', 'order', 'limit', 'range']) {
        (chain as Record<string, ReturnType<typeof vi.fn>>)[method].mockReturnValue(chain)
      }
      mocks.from.mockReturnValue(chain as ReturnType<typeof vi.fn>)

      const response = await GET(makeGetRequest({ type: 'reports' }))
      expect(response.status).toBe(200)

      const json = await response.json()
      expect(json).toHaveLength(1)
      // Email should be masked
      expect(json[0].email).not.toBe('reporter@example.com')
      expect(json[0].email).toContain('***')
      // Names should be masked
      expect(json[0].first_name).not.toBe('Alice')
      expect(json[0].first_name).toContain('***')
      expect(json[0].last_name).not.toBe('Tremblay')
      expect(json[0].last_name).toContain('***')
      // Other fields remain untouched
      expect(json[0].message).toBe('Prix incorrect')
    })
  })

  /* ---------------------------------------------------------------- */
  /*  GET type=logs                                                   */
  /* ---------------------------------------------------------------- */

  describe('GET type=logs', () => {
    it('retourne les logs avec filtre de categorie', async () => {
      const fakeLogs = [
        { id: 1, category: 'admin', action: 'test', detail: null, metadata: {}, created_at: '2026-04-01' },
      ]

      const chain: Record<string, unknown> = {
        select: vi.fn(),
        order: vi.fn(),
        limit: vi.fn(),
        eq: vi.fn(),
        data: fakeLogs,
      }
      for (const method of ['select', 'order', 'limit', 'eq']) {
        (chain as Record<string, ReturnType<typeof vi.fn>>)[method].mockReturnValue(chain)
      }
      mocks.from.mockReturnValue(chain as ReturnType<typeof vi.fn>)

      const response = await GET(makeGetRequest({ type: 'logs', category: 'admin' }))
      expect(response.status).toBe(200)

      const json = await response.json()
      expect(json).toEqual(fakeLogs)

      // Verify that eq was called with category filter
      expect(chain.eq).toHaveBeenCalledWith('category', 'admin')
    })
  })

  /* ---------------------------------------------------------------- */
  /*  GET type=alerts                                                 */
  /* ---------------------------------------------------------------- */

  describe('GET type=alerts', () => {
    it('retourne les compteurs de prix anormaux', async () => {
      const highChain: Record<string, unknown> = {
        select: vi.fn(),
        gt: vi.fn(),
        count: 3,
      }
      for (const method of ['select', 'gt']) {
        (highChain as Record<string, ReturnType<typeof vi.fn>>)[method].mockReturnValue(highChain)
      }

      const lowChain: Record<string, unknown> = {
        select: vi.fn(),
        lt: vi.fn(),
        gt: vi.fn(),
        count: 7,
      }
      for (const method of ['select', 'lt', 'gt']) {
        (lowChain as Record<string, ReturnType<typeof vi.fn>>)[method].mockReturnValue(lowChain)
      }

      let fromCallIndex = 0
      mocks.from.mockImplementation(() => {
        fromCallIndex++
        return fromCallIndex === 1 ? highChain : lowChain
      })

      const response = await GET(makeGetRequest({ type: 'alerts' }))
      expect(response.status).toBe(200)

      const json = await response.json()
      expect(json).toEqual({ highPrices: 3, lowPrices: 7 })
    })
  })

  /* ---------------------------------------------------------------- */
  /*  PATCH action=report_status                                      */
  /* ---------------------------------------------------------------- */

  describe('PATCH action=report_status', () => {
    it('retourne 403 sans authentification admin', async () => {
      setupNonAdmin()

      const response = await PATCH(
        makePatchRequest({ action: 'report_status', id: 1, status: 'resolved' }),
      )

      expect(response.status).toBe(403)
      const json = await response.json()
      expect(json).toEqual({ error: 'Non autorisé' })
    })

    it('met a jour le statut du signalement en tant quadmin', async () => {
      setupAdmin()

      // verifyAdmin: from('profiles').select().eq().single()
      const adminProfileChain: Record<string, unknown> = {
        select: vi.fn(),
        eq: vi.fn(),
        single: vi.fn().mockResolvedValue({ data: { role: 'admin' } }),
      }
      for (const method of ['select', 'eq']) {
        (adminProfileChain as Record<string, ReturnType<typeof vi.fn>>)[method].mockReturnValue(adminProfileChain)
      }

      // from('reports').update().eq()
      const updateEq = vi.fn().mockResolvedValue({ error: null })
      const reportsChain = {
        select: vi.fn(),
        update: vi.fn().mockReturnValue({ eq: updateEq }),
        insert: vi.fn(),
      }

      let fromCallIndex = 0
      mocks.from.mockImplementation(() => {
        fromCallIndex++
        if (fromCallIndex === 1) return adminProfileChain
        return reportsChain
      })

      mocks.logActivity.mockResolvedValue(undefined)

      const response = await PATCH(
        makePatchRequest(
          { action: 'report_status', id: 42, status: 'resolved' },
          'valid-token',
        ),
      )

      expect(response.status).toBe(200)
      const json = await response.json()
      expect(json).toEqual({ ok: true })

      // Verify update was called
      expect(reportsChain.update).toHaveBeenCalledWith({ status: 'resolved' })
      expect(updateEq).toHaveBeenCalledWith('id', 42)

      // Verify activity was logged
      expect(mocks.logActivity).toHaveBeenCalledWith(
        'admin',
        'Signalement #42 → resolved',
        undefined,
        expect.objectContaining({ reportId: 42, status: 'resolved' }),
      )
    })
  })

  /* ---------------------------------------------------------------- */
  /*  GET type=me                                                     */
  /* ---------------------------------------------------------------- */

  describe('GET type=me', () => {
    it('retourne isAdmin=false pour un non-admin', async () => {
      setupNonAdmin()
      const response = await GET(makeGetRequest({ type: 'me' }))
      expect(response.status).toBe(200)
      const json = await response.json()
      expect(json).toEqual({ isAdmin: false })
    })

    it('retourne isAdmin=true pour un admin', async () => {
      setupAdmin()

      const adminProfileChain: Record<string, unknown> = {
        select: vi.fn(),
        eq: vi.fn(),
        single: vi.fn().mockResolvedValue({ data: { role: 'admin' } }),
      }
      for (const method of ['select', 'eq']) {
        (adminProfileChain as Record<string, ReturnType<typeof vi.fn>>)[method].mockReturnValue(adminProfileChain)
      }
      mocks.from.mockReturnValue(adminProfileChain as ReturnType<typeof vi.fn>)

      const response = await GET(makeGetRequest({ type: 'me' }, 'valid-token'))
      expect(response.status).toBe(200)
      const json = await response.json()
      expect(json).toEqual({ isAdmin: true })
    })
  })

  /* ---------------------------------------------------------------- */
  /*  GET type=suggestions                                            */
  /* ---------------------------------------------------------------- */

  describe('GET type=suggestions', () => {
    it('retourne les suggestions masquees pour un non-admin', async () => {
      setupNonAdmin()

      const fakeSuggestions = [
        { id: 1, email: 'user@example.com', first_name: 'Alice', last_name: 'Tremblay', message: 'Ajouter filtre' },
      ]
      const chain: Record<string, unknown> = {
        select: vi.fn(),
        order: vi.fn(),
        range: vi.fn(),
        data: fakeSuggestions,
      }
      for (const method of ['select', 'order', 'range']) {
        (chain as Record<string, ReturnType<typeof vi.fn>>)[method].mockReturnValue(chain)
      }
      mocks.from.mockReturnValue(chain as ReturnType<typeof vi.fn>)

      const response = await GET(makeGetRequest({ type: 'suggestions' }))
      expect(response.status).toBe(200)
      const json = await response.json()
      expect(json[0].email).toContain('***')
      expect(json[0].first_name).toContain('***')
    })
  })

  /* ---------------------------------------------------------------- */
  /*  GET type=init                                                   */
  /* ---------------------------------------------------------------- */

  describe('GET type=init', () => {
    function makeChain(overrides: Record<string, unknown> = {}) {
      const chain: Record<string, unknown> = {
        select: vi.fn(),
        order: vi.fn(),
        limit: vi.fn(),
        range: vi.fn(),
        eq: vi.fn(),
        gt: vi.fn(),
        lt: vi.fn(),
        gte: vi.fn(),
        single: vi.fn().mockResolvedValue({ data: null }),
        count: overrides.count ?? 0,
        data: overrides.data ?? null,
      }
      for (const method of ['select', 'order', 'limit', 'range', 'eq', 'gt', 'lt', 'gte']) {
        (chain as Record<string, ReturnType<typeof vi.fn>>)[method].mockReturnValue(chain)
      }
      return chain
    }

    it('retourne les données masquées pour un non-admin (accès sans connexion autorisé)', async () => {
      setupNonAdmin()

      const snapshotsCount = makeChain({ count: 100 })
      const snapshotsLatest = makeChain({ data: [{ snapshot_at: '2026-04-01T10:00:00Z' }] })
      const reportsCount = makeChain({ count: 3 })
      const profilesCount = makeChain({ count: 8 })
      const pvTotal = makeChain({ count: 500 })
      const pvToday = makeChain({ count: 20 })
      const pvWeek = makeChain({ count: 150 })
      const pvMonth = makeChain({ count: 400 })
      const profilesList = makeChain({
        data: [{ id: 'u1', email: 'alice@example.com', created_at: '2026-01-01' }],
      })
      const reportsList = makeChain({
        data: [{ id: 1, email: 'rep@test.com', first_name: 'Jean', last_name: 'Dupont', message: 'test' }],
      })
      const suggestionsList = makeChain({
        data: [{ id: 1, email: 'sug@test.com', first_name: 'Marie', last_name: 'Lavoie', message: 'idée' }],
      })

      let callIndex = 0
      const fromResults = [
        snapshotsCount, snapshotsLatest, reportsCount, profilesCount,
        pvTotal, pvToday, pvWeek, pvMonth,
        profilesList, reportsList, suggestionsList,
      ]
      mocks.from.mockImplementation(() => {
        const result = fromResults[callIndex] ?? makeChain()
        callIndex++
        return result as ReturnType<typeof makeChain>
      })
      mocks.rpc.mockResolvedValue({ data: { regulier: 170, super: 190, diesel: 180 } })
      mocks.listUsers.mockResolvedValue({ data: { users: [{ id: 'u1', email: 'alice@example.com' }] } })

      const response = await GET(makeGetRequest({ type: 'init' }))
      expect(response.status).toBe(200)

      const json = await response.json()
      expect(json.stats.totalSnapshots).toBe(100)
      // Emails et noms masqués pour non-admin
      expect(json.users[0].email).toContain('***')
      expect(json.reports[0].email).toContain('***')
      expect(json.reports[0].first_name).toContain('***')
      expect(json.suggestions[0].email).toContain('***')
    })

    it('retourne les données non masquées pour un admin', async () => {
      setupAdmin()

      const adminProfileChain: Record<string, unknown> = {
        select: vi.fn(),
        eq: vi.fn(),
        single: vi.fn().mockResolvedValue({ data: { role: 'admin' } }),
      }
      for (const method of ['select', 'eq']) {
        (adminProfileChain as Record<string, ReturnType<typeof vi.fn>>)[method].mockReturnValue(adminProfileChain)
      }

      const snapshotsCount = makeChain({ count: 50 })
      const snapshotsLatest = makeChain({ data: [{ snapshot_at: '2026-04-01' }] })
      const reportsCount = makeChain({ count: 2 })
      const profilesCount = makeChain({ count: 5 })
      const pvTotal = makeChain({ count: 100 })
      const pvToday = makeChain({ count: 10 })
      const pvWeek = makeChain({ count: 60 })
      const pvMonth = makeChain({ count: 90 })
      const profilesList = makeChain({
        data: [{ id: 'u1', email: 'admin@test.com', created_at: '2026-01-01' }],
      })
      const reportsList = makeChain({
        data: [{ id: 1, email: 'rep@test.com', first_name: 'Jean', last_name: 'Dupont', message: 'test' }],
      })
      const suggestionsList = makeChain({
        data: [{ id: 1, email: 'sug@test.com', first_name: 'Marie', last_name: 'Lavoie', message: 'idée' }],
      })

      let callIndex = 0
      const fromResults = [
        adminProfileChain, // verifyAdmin profile lookup
        snapshotsCount,
        snapshotsLatest,
        reportsCount,
        profilesCount,
        pvTotal,
        pvToday,
        pvWeek,
        pvMonth,
        profilesList,
        reportsList,
        suggestionsList,
      ]

      mocks.from.mockImplementation(() => {
        const result = fromResults[callIndex] ?? makeChain()
        callIndex++
        return result as ReturnType<typeof makeChain>
      })

      mocks.rpc.mockResolvedValue({ data: { regulier: 170, super: 190, diesel: 180 } })
      mocks.listUsers.mockResolvedValue({ data: { users: [{ id: 'u1', email: 'admin@test.com' }] } })

      const response = await GET(makeGetRequest({ type: 'init' }, 'valid-token'))
      expect(response.status).toBe(200)

      const json = await response.json()
      // Admin voit les emails complets
      expect(json.users[0].email).toBe('admin@test.com')
      expect(json.reports[0].email).toBe('rep@test.com')
      expect(json.reports[0].first_name).toBe('Jean')
      expect(json.suggestions[0].email).toBe('sug@test.com')
    })
  })

  /* ---------------------------------------------------------------- */
  /*  GET type=snapshots                                              */
  /* ---------------------------------------------------------------- */

  describe('GET type=snapshots', () => {
    it('retourne le résumé des snapshots via RPC', async () => {
      const fakeSnapshots = [
        { snapshot_at: '2026-04-01', station_count: 100 },
        { snapshot_at: '2026-03-31', station_count: 98 },
      ]
      mocks.rpc.mockResolvedValue({ data: fakeSnapshots, error: null })

      const response = await GET(makeGetRequest({ type: 'snapshots' }))
      expect(response.status).toBe(200)

      const json = await response.json()
      expect(json).toEqual(fakeSnapshots)
      expect(mocks.rpc).toHaveBeenCalledWith('get_snapshot_summary')
    })

    it('retourne un tableau vide si RPC échoue', async () => {
      mocks.rpc.mockResolvedValue({ data: null, error: { message: 'RPC failed' } })

      const response = await GET(makeGetRequest({ type: 'snapshots' }))
      expect(response.status).toBe(200)

      const json = await response.json()
      expect(json).toEqual([])
    })
  })

  /* ---------------------------------------------------------------- */
  /*  GET type=snapshot_detail                                        */
  /* ---------------------------------------------------------------- */

  describe('GET type=snapshot_detail', () => {
    function makeDetailChain(data: unknown[] | null = null) {
      const chain: Record<string, unknown> = {
        select: vi.fn(),
        order: vi.fn(),
        range: vi.fn(),
        eq: vi.fn(),
        data,
      }
      for (const method of ['select', 'order', 'range', 'eq']) {
        (chain as Record<string, ReturnType<typeof vi.fn>>)[method].mockReturnValue(chain)
      }
      return chain
    }

    it('retourne les détails pour un snapshotAt donné', async () => {
      const fakeRows = [
        { station_name: 'Shell', address: '123 Rue', gas_type: 'Régulier', price: 165 },
        { station_name: 'Petro', address: '456 Ave', gas_type: 'Régulier', price: 170 },
      ]

      const chain = makeDetailChain(fakeRows)
      mocks.from.mockReturnValue(chain as ReturnType<typeof vi.fn>)

      const response = await GET(makeGetRequest({
        type: 'snapshot_detail',
        snapshotAt: '2026-04-01T10:00:00Z',
      }))
      expect(response.status).toBe(200)

      const json = await response.json()
      expect(json).toEqual(fakeRows)
    })

    it('retourne 400 sans snapshotAt ni date', async () => {
      const response = await GET(makeGetRequest({ type: 'snapshot_detail' }))
      expect(response.status).toBe(400)

      const json = await response.json()
      expect(json.error).toContain('snapshotAt ou date requis')
    })

    it('retourne 400 avec un snapshotAt invalide', async () => {
      const response = await GET(makeGetRequest({
        type: 'snapshot_detail',
        snapshotAt: 'pas-une-date',
      }))
      expect(response.status).toBe(400)

      const json = await response.json()
      expect(json.error).toContain('Format snapshotAt invalide')
    })

    it('retourne 400 avec un format date invalide', async () => {
      const response = await GET(makeGetRequest({
        type: 'snapshot_detail',
        date: '04-01-2026',
      }))
      expect(response.status).toBe(400)

      const json = await response.json()
      expect(json.error).toContain('Format date invalide')
    })

    it('utilise latest=1 pour trouver le dernier snapshot', async () => {
      // Premier appel : chercher le dernier snapshot_at
      const latestChain: Record<string, unknown> = {
        select: vi.fn(),
        order: vi.fn(),
        limit: vi.fn(),
        data: [{ snapshot_at: '2026-04-01T10:00:00Z' }],
      }
      for (const method of ['select', 'order', 'limit']) {
        (latestChain as Record<string, ReturnType<typeof vi.fn>>)[method].mockReturnValue(latestChain)
      }

      const fakeRows = [
        { station_name: 'Shell', address: '123 Rue', gas_type: 'Régulier', price: 165 },
      ]
      const detailChain = makeDetailChain(fakeRows)

      let callIndex = 0
      mocks.from.mockImplementation(() => {
        callIndex++
        if (callIndex === 1) return latestChain
        return detailChain
      })

      const response = await GET(makeGetRequest({
        type: 'snapshot_detail',
        latest: '1',
      }))
      expect(response.status).toBe(200)

      const json = await response.json()
      expect(json).toEqual(fakeRows)
    })

    it('retourne tableau vide quand latest=1 mais aucun snapshot', async () => {
      const latestChain: Record<string, unknown> = {
        select: vi.fn(),
        order: vi.fn(),
        limit: vi.fn(),
        data: [],
      }
      for (const method of ['select', 'order', 'limit']) {
        (latestChain as Record<string, ReturnType<typeof vi.fn>>)[method].mockReturnValue(latestChain)
      }

      mocks.from.mockReturnValue(latestChain as ReturnType<typeof vi.fn>)

      const response = await GET(makeGetRequest({
        type: 'snapshot_detail',
        latest: '1',
      }))
      expect(response.status).toBe(200)

      const json = await response.json()
      expect(json).toEqual([])
    })
  })

  /* ---------------------------------------------------------------- */
  /*  GET type=auth_logs                                              */
  /* ---------------------------------------------------------------- */

  describe('GET type=auth_logs', () => {
    it('retourne les logs auth complets pour un admin', async () => {
      setupAdmin()

      const adminProfileChain: Record<string, unknown> = {
        select: vi.fn(),
        eq: vi.fn(),
        single: vi.fn().mockResolvedValue({ data: { role: 'admin' } }),
      }
      for (const method of ['select', 'eq']) {
        (adminProfileChain as Record<string, ReturnType<typeof vi.fn>>)[method].mockReturnValue(adminProfileChain)
      }

      const fakeLogs = [
        { id: 1, action: 'login', detail: 'admin@test.com', metadata: {}, created_at: '2026-04-01' },
        { id: 2, action: 'logout', detail: 'user@test.com', metadata: {}, created_at: '2026-04-01' },
      ]
      const logsChain: Record<string, unknown> = {
        select: vi.fn(),
        order: vi.fn(),
        limit: vi.fn(),
        eq: vi.fn(),
        data: fakeLogs,
      }
      for (const method of ['select', 'order', 'limit', 'eq']) {
        (logsChain as Record<string, ReturnType<typeof vi.fn>>)[method].mockReturnValue(logsChain)
      }

      let callIndex = 0
      mocks.from.mockImplementation(() => {
        callIndex++
        if (callIndex === 1) return adminProfileChain
        return logsChain
      })

      const response = await GET(makeGetRequest({ type: 'auth_logs' }, 'valid-token'))
      expect(response.status).toBe(200)

      const json = await response.json()
      expect(json).toEqual(fakeLogs)
      // Admin voit les emails complets
      expect(json[0].detail).toBe('admin@test.com')
      expect(json[1].detail).toBe('user@test.com')
    })

    it('retourne les logs auth masqués pour un non-admin', async () => {
      setupNonAdmin()

      const fakeLogs = [
        { id: 1, action: 'login', detail: 'admin@test.com', metadata: {}, created_at: '2026-04-01' },
        { id: 2, action: 'logout', detail: 'action sans email', metadata: {}, created_at: '2026-04-01' },
      ]
      const logsChain: Record<string, unknown> = {
        select: vi.fn(),
        order: vi.fn(),
        limit: vi.fn(),
        eq: vi.fn(),
        data: fakeLogs,
      }
      for (const method of ['select', 'order', 'limit', 'eq']) {
        (logsChain as Record<string, ReturnType<typeof vi.fn>>)[method].mockReturnValue(logsChain)
      }

      mocks.from.mockReturnValue(logsChain as ReturnType<typeof vi.fn>)

      const response = await GET(makeGetRequest({ type: 'auth_logs' }))
      expect(response.status).toBe(200)

      const json = await response.json()
      expect(json).toHaveLength(2)
      // Email masqué
      expect(json[0].detail).not.toBe('admin@test.com')
      expect(json[0].detail).toContain('***')
      // Detail sans email reste intact
      expect(json[1].detail).toBe('action sans email')
    })
  })

  /* ---------------------------------------------------------------- */
  /*  GET type=invalid                                                */
  /* ---------------------------------------------------------------- */

  describe('GET type=invalid', () => {
    it('retourne 400 sans type', async () => {
      const response = await GET(makeGetRequest({}))
      expect(response.status).toBe(400)
    })
  })

  /* ---------------------------------------------------------------- */
  /*  GET rate limit                                                  */
  /* ---------------------------------------------------------------- */

  describe('GET rate limit', () => {
    it('retourne 429 quand le rate limit est depasse', async () => {
      mocks.rateLimit.mockReturnValue(false)
      const response = await GET(makeGetRequest({ type: 'stats' }))
      expect(response.status).toBe(429)
    })
  })

  /* ---------------------------------------------------------------- */
  /*  PATCH action=suggestion_status                                  */
  /* ---------------------------------------------------------------- */

  describe('PATCH action=suggestion_status', () => {
    it('met a jour le statut de la suggestion', async () => {
      setupAdmin()

      const adminProfileChain: Record<string, unknown> = {
        select: vi.fn(),
        eq: vi.fn(),
        single: vi.fn().mockResolvedValue({ data: { role: 'admin' } }),
      }
      for (const method of ['select', 'eq']) {
        (adminProfileChain as Record<string, ReturnType<typeof vi.fn>>)[method].mockReturnValue(adminProfileChain)
      }

      const updateEq = vi.fn().mockResolvedValue({ error: null })
      const suggestionsChain = {
        select: vi.fn(),
        update: vi.fn().mockReturnValue({ eq: updateEq }),
        insert: vi.fn(),
      }

      let fromCallIndex = 0
      mocks.from.mockImplementation(() => {
        fromCallIndex++
        if (fromCallIndex === 1) return adminProfileChain
        return suggestionsChain
      })

      mocks.logActivity.mockResolvedValue(undefined)

      const response = await PATCH(
        makePatchRequest(
          { action: 'suggestion_status', id: 7, status: 'approved' },
          'valid-token',
        ),
      )

      expect(response.status).toBe(200)
      const json = await response.json()
      expect(json).toEqual({ ok: true })
      expect(suggestionsChain.update).toHaveBeenCalledWith({ status: 'approved' })
    })

    it('retourne 400 avec un statut invalide', async () => {
      setupAdmin()

      const adminProfileChain: Record<string, unknown> = {
        select: vi.fn(),
        eq: vi.fn(),
        single: vi.fn().mockResolvedValue({ data: { role: 'admin' } }),
      }
      for (const method of ['select', 'eq']) {
        (adminProfileChain as Record<string, ReturnType<typeof vi.fn>>)[method].mockReturnValue(adminProfileChain)
      }
      mocks.from.mockReturnValue(adminProfileChain as ReturnType<typeof vi.fn>)

      const response = await PATCH(
        makePatchRequest(
          { action: 'suggestion_status', id: 7, status: 'invalid_status' },
          'valid-token',
        ),
      )

      expect(response.status).toBe(400)
    })
  })

  /* ---------------------------------------------------------------- */
  /*  PATCH action=report_comment                                     */
  /* ---------------------------------------------------------------- */

  describe('PATCH action=report_comment', () => {
    it('ajoute un commentaire admin au signalement', async () => {
      setupAdmin()

      const adminProfileChain: Record<string, unknown> = {
        select: vi.fn(),
        eq: vi.fn(),
        single: vi.fn().mockResolvedValue({ data: { role: 'admin' } }),
      }
      for (const method of ['select', 'eq']) {
        (adminProfileChain as Record<string, ReturnType<typeof vi.fn>>)[method].mockReturnValue(adminProfileChain)
      }

      const updateEq = vi.fn().mockResolvedValue({ error: null })
      const reportsChain = {
        select: vi.fn(),
        update: vi.fn().mockReturnValue({ eq: updateEq }),
        insert: vi.fn(),
      }

      let fromCallIndex = 0
      mocks.from.mockImplementation(() => {
        fromCallIndex++
        if (fromCallIndex === 1) return adminProfileChain
        return reportsChain
      })

      mocks.logActivity.mockResolvedValue(undefined)

      const response = await PATCH(
        makePatchRequest(
          { action: 'report_comment', id: 5, admin_comment: 'Vérifié et correct' },
          'valid-token',
        ),
      )

      expect(response.status).toBe(200)
      const json = await response.json()
      expect(json).toEqual({ ok: true })
    })
  })

  /* ---------------------------------------------------------------- */
  /*  PATCH action=unknown                                            */
  /* ---------------------------------------------------------------- */

  describe('PATCH action inconnue', () => {
    it('retourne 400 pour une action inconnue', async () => {
      setupAdmin()

      const adminProfileChain: Record<string, unknown> = {
        select: vi.fn(),
        eq: vi.fn(),
        single: vi.fn().mockResolvedValue({ data: { role: 'admin' } }),
      }
      for (const method of ['select', 'eq']) {
        (adminProfileChain as Record<string, ReturnType<typeof vi.fn>>)[method].mockReturnValue(adminProfileChain)
      }
      mocks.from.mockReturnValue(adminProfileChain as ReturnType<typeof vi.fn>)

      const response = await PATCH(
        makePatchRequest({ action: 'nonexistent' }, 'valid-token'),
      )

      expect(response.status).toBe(400)
      const json = await response.json()
      expect(json.error).toContain('action inconnue')
    })
  })

  /* ---------------------------------------------------------------- */
  /*  PATCH rate limit                                                */
  /* ---------------------------------------------------------------- */

  describe('PATCH rate limit', () => {
    it('retourne 429 quand le rate limit est depasse', async () => {
      mocks.rateLimit.mockReturnValue(false)
      const response = await PATCH(
        makePatchRequest({ action: 'report_status', id: 1, status: 'resolved' }, 'valid-token'),
      )
      expect(response.status).toBe(429)
    })
  })

  /* ---------------------------------------------------------------- */
  /*  PATCH action=toggle_role                                        */
  /* ---------------------------------------------------------------- */

  describe('PATCH action=toggle_role', () => {
    it('retourne 403 sans authentification admin', async () => {
      setupNonAdmin()

      const response = await PATCH(
        makePatchRequest({ action: 'toggle_role', id: 'user-123', currentRole: 'user' }),
      )

      expect(response.status).toBe(403)
      const json = await response.json()
      expect(json).toEqual({ error: 'Non autorisé' })
    })

    it('bascule le role de user a admin', async () => {
      setupAdmin()

      const adminProfileChain: Record<string, unknown> = {
        select: vi.fn(),
        eq: vi.fn(),
        single: vi.fn().mockResolvedValue({ data: { role: 'admin' } }),
      }
      for (const method of ['select', 'eq']) {
        (adminProfileChain as Record<string, ReturnType<typeof vi.fn>>)[method].mockReturnValue(adminProfileChain)
      }

      const updateEq = vi.fn().mockResolvedValue({ error: null })
      const profilesChain = {
        select: vi.fn(),
        update: vi.fn().mockReturnValue({ eq: updateEq }),
        insert: vi.fn(),
      }

      let fromCallIndex = 0
      mocks.from.mockImplementation(() => {
        fromCallIndex++
        if (fromCallIndex === 1) return adminProfileChain
        return profilesChain
      })

      mocks.logActivity.mockResolvedValue(undefined)

      const response = await PATCH(
        makePatchRequest(
          { action: 'toggle_role', id: 'user-123', currentRole: 'user' },
          'valid-token',
        ),
      )

      expect(response.status).toBe(200)
      const json = await response.json()
      expect(json).toEqual({ ok: true })

      // user -> admin toggle
      expect(profilesChain.update).toHaveBeenCalledWith({ role: 'admin' })
      expect(updateEq).toHaveBeenCalledWith('id', 'user-123')

      expect(mocks.logActivity).toHaveBeenCalledWith(
        'admin',
        'Rôle changé → admin',
        undefined,
        expect.objectContaining({ userId: 'user-123', newRole: 'admin' }),
      )
    })
  })
})
