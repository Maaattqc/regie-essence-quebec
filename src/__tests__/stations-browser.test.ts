import { describe, expect, it, vi } from 'vitest'

import { getFavorites, reverseGeocode, toggleFavorite } from '@/lib/stations'

describe('favorites', () => {
  it('lit les favoris depuis localStorage', () => {
    localStorage.setItem('favorites', JSON.stringify(['shell|montreal']))

    expect(getFavorites()).toEqual(new Set(['shell|montreal']))
  })

  it('retourne un set vide quand le stockage est invalide', () => {
    localStorage.setItem('favorites', '{bad json')

    expect(getFavorites()).toEqual(new Set())
  })

  it('ajoute puis retire un favori et diffuse levenement', () => {
    const listener = vi.fn()

    window.addEventListener('favorites-changed', listener)

    expect(toggleFavorite('station-1')).toEqual(new Set(['station-1']))
    expect(localStorage.getItem('favorites')).toBe(JSON.stringify(['station-1']))
    expect(listener).toHaveBeenCalledTimes(1)

    expect(toggleFavorite('station-1')).toEqual(new Set())
    expect(localStorage.getItem('favorites')).toBe(JSON.stringify([]))
    expect(listener).toHaveBeenCalledTimes(2)

    window.removeEventListener('favorites-changed', listener)
  })
})

describe('reverseGeocode', () => {
  it('retourne la ville quand le service en fournit une', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      json: async () => ({
        address: {
          city: 'Montreal',
        },
      }),
    })

    vi.stubGlobal('fetch', fetchMock)

    await expect(reverseGeocode(45.5, -73.5)).resolves.toBe('Montreal')
    expect(fetchMock).toHaveBeenCalledWith(
      'https://nominatim.openstreetmap.org/reverse?lat=45.5&lon=-73.5&format=json&zoom=10',
    )
  })

  it('retourne null quand aucune localite nest disponible', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        json: async () => ({
          address: {},
        }),
      }),
    )

    await expect(reverseGeocode(45.5, -73.5)).resolves.toBeNull()
  })
})
