import { describe, expect, it, vi, beforeEach } from 'vitest'

import { getIP, rateLimit } from '@/lib/rateLimit'

describe('rateLimit (memoire)', () => {
  it('autorise les cinq premieres requetes dans la fenetre', async () => {
    const ip = `ip-${Math.random()}`

    for (let index = 0; index < 5; index += 1) {
      await expect(rateLimit(ip)).resolves.toBe(true)
    }

    await expect(rateLimit(ip)).resolves.toBe(false)
  })

  it('repart a zero apres expiration de la fenetre', async () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-04-02T12:00:00.000Z'))

    const ip = `ip-${Math.random()}`

    for (let index = 0; index < 5; index += 1) {
      await expect(rateLimit(ip)).resolves.toBe(true)
    }

    vi.advanceTimersByTime(1001)

    await expect(rateLimit(ip)).resolves.toBe(true)

    vi.useRealTimers()
  })
})

describe('getIP', () => {
  it('priorise x-forwarded-for', () => {
    const request = new Request('http://localhost', {
      headers: {
        'x-forwarded-for': '192.168.0.1, 10.0.0.1',
        'x-real-ip': '127.0.0.1',
      },
    })

    expect(getIP(request)).toBe('192.168.0.1')
  })

  it('retourne unknown quand aucune ip nest disponible', () => {
    const request = new Request('http://localhost')

    expect(getIP(request)).toBe('unknown')
  })
})

/* ------------------------------------------------------------------ */
/*  Tests Upstash : on re-import le module avec les mocks activés     */
/* ------------------------------------------------------------------ */

describe('rateLimit (upstash)', () => {
  const mockLimit = vi.fn()

  beforeEach(() => {
    vi.resetModules()
    mockLimit.mockReset()
  })

  async function importWithUpstash() {
    // Configurer les env AVANT import pour activer le chemin Upstash
    vi.stubEnv('NODE_ENV', 'production')
    vi.stubEnv('KV_REST_API_URL', 'https://fake-kv.upstash.io')
    vi.stubEnv('KV_REST_API_TOKEN', 'fake-token')

    vi.doMock('@upstash/redis', () => ({
      Redis: class FakeRedis {
        constructor() { /* noop */ }
      },
    }))

    vi.doMock('@upstash/ratelimit', () => {
      class FakeRatelimit {
        limit = mockLimit
        static slidingWindow() { return {} }
      }
      return { Ratelimit: FakeRatelimit }
    })

    const mod = await import('@/lib/rateLimit')
    return mod
  }

  it('retourne le résultat Upstash quand le limiter répond avec succès', async () => {
    mockLimit.mockResolvedValue({ success: true })
    const { rateLimit: rl } = await importWithUpstash()

    const result = await rl('1.2.3.4', 'default')
    expect(result).toBe(true)
    expect(mockLimit).toHaveBeenCalledWith('1.2.3.4')
  })

  it('retourne false quand Upstash refuse la requête', async () => {
    mockLimit.mockResolvedValue({ success: false })
    const { rateLimit: rl } = await importWithUpstash()

    const result = await rl('1.2.3.4', 'default')
    expect(result).toBe(false)
  })

  it('fallback mémoire quand Upstash timeout (result null)', async () => {
    // Simuler un timeout : le limiter ne résout jamais, donc le Promise.race
    // renverra null via le setTimeout(2000). On utilise des faux timers.
    vi.useFakeTimers()

    mockLimit.mockImplementation(() => new Promise(() => {})) // ne résout jamais
    const { rateLimit: rl } = await importWithUpstash()

    const promise = rl('timeout-ip', 'default')
    // Avancer le timer de 2001ms pour déclencher le timeout
    vi.advanceTimersByTime(2001)
    const result = await promise

    // Le fallback mémoire devrait autoriser la requête
    expect(result).toBe(true)

    vi.useRealTimers()
  })

  it('fallback mémoire quand Upstash throw une erreur', async () => {
    mockLimit.mockRejectedValue(new Error('Redis connection failed'))
    const { rateLimit: rl } = await importWithUpstash()

    const result = await rl('error-ip', 'default')
    // Le fallback mémoire devrait autoriser la requête
    expect(result).toBe(true)
  })
})
