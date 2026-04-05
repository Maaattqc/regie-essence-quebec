// @vitest-environment node
//
// Tests d'intégration GET /api/history
// Couvre les cas non testés par history-route.test.ts :
//  - sans paramètre type (aucun filtre gas_type appliqué)
//  - avec days=30 explicite vs défaut
//  - retourne tableau vide quand Supabase retourne data=[]
//  - propagation d'erreur Supabase en 500
//  - Content-Type dans toutes les réponses

import { NextRequest } from 'next/server'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => {
  const query = {
    eq: vi.fn(function (this: unknown) { return this }),
    gte: vi.fn(function (this: unknown) { return this }),
    order: vi.fn(),
    select: vi.fn(function (this: unknown) { return this }),
  }

  return {
    getIP: vi.fn(),
    query,
    rateLimit: vi.fn(),
    supabase: { from: vi.fn(() => query) },
  }
})

vi.mock('@/lib/rateLimit', () => ({
  getIP: mocks.getIP,
  rateLimit: mocks.rateLimit,
}))

vi.mock('@/lib/supabase', () => ({
  supabase: mocks.supabase,
}))

import { GET } from '@/app/api/history/route'

describe('GET /api/history — intégration paramètres et erreurs', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-04-02T12:00:00.000Z'))

    mocks.getIP.mockReturnValue('203.0.113.2')
    mocks.rateLimit.mockReturnValue(true)
    mocks.query.eq.mockClear()
    mocks.query.gte.mockClear()
    mocks.query.order.mockReset()
    mocks.query.select.mockClear()
    mocks.supabase.from.mockClear()

    mocks.query.select.mockReturnValue(mocks.query)
    mocks.query.eq.mockReturnValue(mocks.query)
    mocks.query.gte.mockReturnValue(mocks.query)
    mocks.query.order.mockResolvedValue({ data: [], error: null })
  })

  it('utilise Regulier comme gas_type par defaut quand type nest pas fourni', async () => {
    const response = await GET(
      new NextRequest('http://localhost/api/history?station=Shell&address=123+Rue'),
    )

    expect(response.status).toBe(200)
    expect(mocks.query.eq).toHaveBeenCalledWith('gas_type', 'Régulier')
  })

  it('applique le filtre gas_type=Regulier quand type=Regulier est fourni', async () => {
    await GET(
      new NextRequest(
        'http://localhost/api/history?station=Shell&address=123+Rue&type=R%C3%A9gulier',
      ),
    )

    const eqCalls = (mocks.query.eq.mock.calls as unknown) as [string, unknown][]
    const gasTypeCall = eqCalls.find(([col]) => col === 'gas_type')
    expect(gasTypeCall).toBeDefined()
  })

  it('applique le filtre gas_type=Diesel quand type=Diesel est fourni', async () => {
    await GET(
      new NextRequest(
        'http://localhost/api/history?station=Shell&address=123+Rue&type=Diesel',
      ),
    )

    expect(mocks.query.eq).toHaveBeenCalledWith('gas_type', 'Diesel')
  })

  it('utilise 30 jours par defaut (date borne a 2026-03-03)', async () => {
    await GET(
      new NextRequest('http://localhost/api/history?station=Shell&address=123+Rue'),
    )

    expect(mocks.query.gte).toHaveBeenCalledWith('snapshot_date', '2026-03-03')
  })

  it('borne les jours a 90 quand days=150 est demande (date = 2026-01-02)', async () => {
    await GET(
      new NextRequest(
        'http://localhost/api/history?station=Shell&address=123+Rue&days=150',
      ),
    )

    expect(mocks.query.gte).toHaveBeenCalledWith('snapshot_date', '2026-01-02')
  })

  it('retourne un tableau vide quand supabase retourne data=[]', async () => {
    mocks.query.order.mockResolvedValue({ data: [], error: null })

    const response = await GET(
      new NextRequest('http://localhost/api/history?station=Shell&address=123+Rue'),
    )

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual([])
  })

  it('retourne les donnees triees par date quand supabase renvoie des enregistrements', async () => {
    mocks.query.order.mockResolvedValue({
      data: [
        { price: 151.3, snapshot_date: '2026-03-15' },
        { price: 153.9, snapshot_date: '2026-03-20' },
      ],
      error: null,
    })

    const response = await GET(
      new NextRequest('http://localhost/api/history?station=Shell&address=123+Rue'),
    )

    expect(response.status).toBe(200)
    const data = await response.json()
    expect(data).toHaveLength(2)
    expect(data[0].snapshot_date).toBe('2026-03-15')
    expect(data[1].snapshot_date).toBe('2026-03-20')
  })

  it('retourne 500 quand supabase retourne une erreur', async () => {
    mocks.query.order.mockResolvedValue({
      data: null,
      error: { message: 'connexion perdue' },
    })

    const response = await GET(
      new NextRequest('http://localhost/api/history?station=Shell&address=123+Rue'),
    )

    expect(response.status).toBe(500)
    const body = await response.json()
    expect(typeof body.error).toBe('string')
  })

  it('toutes les reponses ont un Content-Type application/json', async () => {
    const cases = [
      // 400 — params manquants
      new NextRequest('http://localhost/api/history'),
      // 200 — requete valide
      new NextRequest('http://localhost/api/history?station=Shell&address=123+Rue'),
    ]

    for (const req of cases) {
      const response = await GET(req)
      expect(response.headers.get('content-type')).toMatch(/application\/json/)
    }
  })

  it('retourne 400 avec message derreur JSON quand station est absent', async () => {
    const response = await GET(
      new NextRequest('http://localhost/api/history?address=123+Rue'),
    )

    expect(response.status).toBe(400)
    const body = await response.json()
    expect(typeof body.error).toBe('string')
  })

  it('ordonne les resultats par snapshot_date ascendant', async () => {
    mocks.query.order.mockResolvedValue({ data: [], error: null })

    await GET(
      new NextRequest('http://localhost/api/history?station=Shell&address=123+Rue'),
    )

    expect(mocks.query.order).toHaveBeenCalledWith('snapshot_date', { ascending: true })
  })
})
