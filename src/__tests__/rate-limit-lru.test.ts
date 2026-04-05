// @vitest-environment node

import { describe, expect, it, vi } from 'vitest'

import { rateLimit } from '@/lib/rateLimit'

describe('rateLimit — comportement LRU', () => {
  // ────── Profil strict (2 req/s) ──────

  describe('profil strict', () => {
    it('autorise 2 requetes puis bloque la 3e', async () => {
      const ip = `strict-${Date.now()}-${Math.random()}`

      await expect(rateLimit(ip, 'strict')).resolves.toBe(true)
      await expect(rateLimit(ip, 'strict')).resolves.toBe(true)
      await expect(rateLimit(ip, 'strict')).resolves.toBe(false)
    })

    it('reautorise apres expiration de la fenetre', async () => {
      vi.useFakeTimers()
      vi.setSystemTime(new Date('2026-04-04T12:00:00.000Z'))

      const ip = `strict-expire-${Math.random()}`

      await expect(rateLimit(ip, 'strict')).resolves.toBe(true)
      await expect(rateLimit(ip, 'strict')).resolves.toBe(true)
      await expect(rateLimit(ip, 'strict')).resolves.toBe(false)

      // Avancer au-delà de la fenêtre de 1 seconde
      vi.advanceTimersByTime(1001)

      await expect(rateLimit(ip, 'strict')).resolves.toBe(true)

      vi.useRealTimers()
    })
  })

  // ────── Profil relaxed (10 req/s) ──────

  describe('profil relaxed', () => {
    it('autorise 10 requetes puis bloque la 11e', async () => {
      const ip = `relaxed-${Date.now()}-${Math.random()}`

      for (let i = 0; i < 10; i++) {
        await expect(rateLimit(ip, 'relaxed')).resolves.toBe(true)
      }

      await expect(rateLimit(ip, 'relaxed')).resolves.toBe(false)
    })
  })

  // ────── Éviction LRU au-delà de MAX_KEYS ──────

  describe('eviction LRU', () => {
    it('evince les entrees les plus anciennes quand le nombre de cles depasse MAX_KEYS', async () => {
      vi.useFakeTimers()
      vi.setSystemTime(new Date('2026-04-04T12:00:00.000Z'))

      // Remplir le cache avec 2048 IPs uniques (MAX_KEYS = 2048)
      // Chaque IP fait 1 requête pour occuper 1 entrée dans la Map
      for (let i = 0; i < 2048; i++) {
        await rateLimit(`lru-fill-${i}`, 'default')
      }

      // Ajouter une IP supplémentaire pour déclencher l'éviction
      await rateLimit('lru-overflow', 'default')

      // La toute première IP (lru-fill-0) devrait avoir été évincée.
      // En faisant 5 requêtes (limite default), elle devrait toutes passer
      // car son historique a été supprimé.
      for (let i = 0; i < 5; i++) {
        await expect(rateLimit('lru-fill-0', 'default')).resolves.toBe(true)
      }

      // La 6e devrait être bloquée (nouvelle entrée, limite atteinte)
      await expect(rateLimit('lru-fill-0', 'default')).resolves.toBe(false)

      vi.useRealTimers()
    })

    it('les entrees recemment accedees survivent a l eviction', async () => {
      vi.useFakeTimers()
      vi.setSystemTime(new Date('2026-04-04T13:00:00.000Z'))

      // Remplir avec 2048 IPs
      for (let i = 0; i < 2048; i++) {
        await rateLimit(`lru-survive-${i}`, 'default')
      }

      // Accéder à la première IP pour la déplacer en fin de Map (LRU refresh)
      await rateLimit('lru-survive-0', 'default')

      // Ajouter 1 IP pour déclencher l'éviction
      await rateLimit('lru-survive-new', 'default')

      // lru-survive-0 a été accédée récemment, donc elle a survécu.
      // Elle a déjà 2 requêtes dans sa fenêtre (la première + le refresh).
      // Il ne reste que 3 requêtes avant la limite de 5.
      for (let i = 0; i < 3; i++) {
        await expect(rateLimit('lru-survive-0', 'default')).resolves.toBe(true)
      }
      await expect(rateLimit('lru-survive-0', 'default')).resolves.toBe(false)

      // Par contre, lru-survive-1 (qui n'a pas été rafraîchie) a été évincée
      // et devrait donc accepter 5 nouvelles requêtes
      for (let i = 0; i < 5; i++) {
        await expect(rateLimit('lru-survive-1', 'default')).resolves.toBe(true)
      }
      await expect(rateLimit('lru-survive-1', 'default')).resolves.toBe(false)

      vi.useRealTimers()
    })
  })
})
