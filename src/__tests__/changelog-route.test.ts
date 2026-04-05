// @vitest-environment node

import { NextRequest } from 'next/server'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  getIP: vi.fn(),
  rateLimit: vi.fn(),
  logActivity: vi.fn(),
}))

vi.mock('@/lib/rateLimit', () => ({
  getIP: mocks.getIP,
  rateLimit: mocks.rateLimit,
}))

vi.mock('@/lib/activity-log', () => ({
  logActivity: mocks.logActivity,
}))

import { GET } from '@/app/api/changelog/route'

describe('GET /api/changelog', () => {
  beforeEach(() => {
    delete process.env.GITHUB_TOKEN

    mocks.getIP.mockReset()
    mocks.rateLimit.mockReset()

    mocks.getIP.mockReturnValue('203.0.113.3')
    mocks.rateLimit.mockReturnValue(true)
  })

  it('retourne 429 quand le rate limit est depasse', async () => {
    mocks.rateLimit.mockReturnValue(false)

    const response = await GET(new NextRequest('http://localhost/api/changelog'))

    expect(response.status).toBe(429)
  })

  it('retourne une liste vide quand github repond en erreur', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(null, { status: 503 })))

    const response = await GET(new NextRequest('http://localhost/api/changelog'))

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual([])
  })

  it('mappe les commits github et transmet le token quand il existe', async () => {
    process.env.GITHUB_TOKEN = 'gh-token'

    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify([
          {
            sha: 'abcdef123456',
            commit: {
              author: { date: '2026-04-02T12:00:00.000Z' },
              message: 'Ajout tests\n\nDetails internes',
            },
          },
        ]),
        { status: 200 },
      ),
    )

    vi.stubGlobal('fetch', fetchMock)

    const response = await GET(new NextRequest('http://localhost/api/changelog'))

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual([
      {
        author: 'Mathieu Fournier',
        date: '2026-04-02T12:00:00.000Z',
        message: 'Ajout tests',
        sha: 'abcdef123456',
      },
    ])
    expect(fetchMock).toHaveBeenCalledWith(
      'https://api.github.com/repos/Maaattqc/regie-essence-quebec/commits?per_page=50',
      {
        headers: {
          Accept: 'application/vnd.github+json',
          Authorization: 'Bearer gh-token',
        },
        next: { revalidate: 300 },
      },
    )
  })

  it('filtre les commits contenant des mots sensibles', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify([
          {
            sha: 'aaa111',
            commit: {
              author: { date: '2026-04-02T12:00:00.000Z' },
              message: 'feat: ajout token Mapbox dans .env',
            },
          },
          {
            sha: 'bbb222',
            commit: {
              author: { date: '2026-04-02T11:00:00.000Z' },
              message: 'fix: corriger affichage prix',
            },
          },
          {
            sha: 'ccc333',
            commit: {
              author: { date: '2026-04-02T10:00:00.000Z' },
              message: 'update API_KEY for production',
            },
          },
          {
            sha: 'ddd444',
            commit: {
              author: { date: '2026-04-02T09:00:00.000Z' },
              message: 'chore: rotate secret keys',
            },
          },
        ]),
        { status: 200 },
      ),
    ))

    const response = await GET(new NextRequest('http://localhost/api/changelog'))

    expect(response.status).toBe(200)
    const data = await response.json()
    // Seul le commit "fix: corriger affichage prix" doit passer le filtre
    expect(data).toHaveLength(1)
    expect(data[0].sha).toBe('bbb222')
    expect(data[0].message).toBe('fix: corriger affichage prix')
  })

  it('retourne un tableau vide et log quand fetch throw', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('Network failure')))

    const response = await GET(new NextRequest('http://localhost/api/changelog'))

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual([])
    expect(mocks.logActivity).toHaveBeenCalledWith(
      'erreur',
      'Échec GitHub API (changelog)',
      undefined,
      expect.objectContaining({ error: expect.stringContaining('Network failure') }),
    )
  })
})
