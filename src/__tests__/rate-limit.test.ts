import { describe, expect, it, vi } from 'vitest'

import { getIP, rateLimit } from '@/lib/rateLimit'

describe('rateLimit', () => {
  it('autorise les cinq premieres requetes dans la fenetre', () => {
    const ip = `ip-${Math.random()}`

    for (let index = 0; index < 5; index += 1) {
      expect(rateLimit(ip)).toBe(true)
    }

    expect(rateLimit(ip)).toBe(false)
  })

  it('repart a zero apres expiration de la fenetre', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-04-02T12:00:00.000Z'))

    const ip = `ip-${Math.random()}`

    for (let index = 0; index < 5; index += 1) {
      expect(rateLimit(ip)).toBe(true)
    }

    vi.advanceTimersByTime(1001)

    expect(rateLimit(ip)).toBe(true)

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
