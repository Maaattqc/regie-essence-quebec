import { describe, expect, it, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import type { FeatureCollection, Point } from 'geojson'
import type { StationProperties } from '@/lib/stations'

const mocks = vi.hoisted(() => ({
  reverseGeocode: vi.fn(),
  distanceKm: vi.fn(),
  normalize: vi.fn(),
}))

vi.mock('@/lib/stations', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/stations')>()
  return {
    ...actual,
    reverseGeocode: mocks.reverseGeocode,
    distanceKm: mocks.distanceKm,
    normalize: mocks.normalize,
  }
})

import { useGeolocation } from '@/hooks/useGeolocation'

function makeData(
  features: Array<{ lat: number; lng: number; region: string }>,
): FeatureCollection<Point, StationProperties> {
  return {
    type: 'FeatureCollection',
    features: features.map((f) => ({
      type: 'Feature' as const,
      geometry: { type: 'Point' as const, coordinates: [f.lng, f.lat] },
      properties: {
        Name: 'Station',
        brand: 'Brand',
        Address: '123 Rue',
        PostalCode: 'H1H 1H1',
        Region: f.region,
        Prices: [],
      },
    })),
  }
}

describe('useGeolocation', () => {
  const setRegion = vi.fn()
  const setSearch = vi.fn()
  const setFlyTarget = vi.fn()

  beforeEach(() => {
    setRegion.mockClear()
    setSearch.mockClear()
    setFlyTarget.mockClear()
    mocks.reverseGeocode.mockReset()
    mocks.distanceKm.mockReset()
    mocks.normalize.mockReset()

    // Valeur par défaut pour normalize : retourne la chaîne telle quelle en minuscules
    mocks.normalize.mockImplementation((s: string) => s.toLowerCase())
  })

  it('met geoReady à true quand la géolocalisation est indisponible', async () => {
    // Simuler l'absence de navigator.geolocation
    const original = navigator.geolocation
    Object.defineProperty(navigator, 'geolocation', {
      value: undefined,
      configurable: true,
      writable: true,
    })

    const { result } = renderHook(() =>
      useGeolocation({ data: null, setRegion, setSearch, setFlyTarget }),
    )

    await waitFor(() => {
      expect(result.current.geoReady).toBe(true)
    })
    expect(result.current.userPos).toBeNull()

    // Restaurer
    Object.defineProperty(navigator, 'geolocation', {
      value: original,
      configurable: true,
      writable: true,
    })
  })

  it('met userPos depuis la géolocalisation', async () => {
    const mockGetCurrentPosition = vi.fn(
      (success: PositionCallback) => {
        success({
          coords: { latitude: 45.5, longitude: -73.6 },
        } as GeolocationPosition)
      },
    )

    Object.defineProperty(navigator, 'geolocation', {
      value: { getCurrentPosition: mockGetCurrentPosition },
      configurable: true,
      writable: true,
    })

    mocks.reverseGeocode.mockResolvedValue(null)

    const { result } = renderHook(() =>
      useGeolocation({ data: null, setRegion, setSearch, setFlyTarget }),
    )

    await waitFor(() => {
      expect(result.current.userPos).toEqual([45.5, -73.6])
    })
  })

  it('appelle reverseGeocode avec les coordonnées', async () => {
    const mockGetCurrentPosition = vi.fn(
      (success: PositionCallback) => {
        success({
          coords: { latitude: 46.8, longitude: -71.2 },
        } as GeolocationPosition)
      },
    )

    Object.defineProperty(navigator, 'geolocation', {
      value: { getCurrentPosition: mockGetCurrentPosition },
      configurable: true,
      writable: true,
    })

    mocks.reverseGeocode.mockResolvedValue('Québec')

    const { result } = renderHook(() =>
      useGeolocation({ data: null, setRegion, setSearch, setFlyTarget }),
    )

    await waitFor(() => {
      expect(result.current.geoReady).toBe(true)
    })

    expect(mocks.reverseGeocode).toHaveBeenCalledWith(46.8, -71.2)
  })

  it('détermine la région depuis la station la plus proche', async () => {
    const mockGetCurrentPosition = vi.fn(
      (success: PositionCallback) => {
        success({
          coords: { latitude: 45.5, longitude: -73.6 },
        } as GeolocationPosition)
      },
    )

    Object.defineProperty(navigator, 'geolocation', {
      value: { getCurrentPosition: mockGetCurrentPosition },
      configurable: true,
      writable: true,
    })

    // La première station est plus proche (distance 2), la deuxième plus loin (distance 50)
    mocks.distanceKm
      .mockReturnValueOnce(2)
      .mockReturnValueOnce(50)
    mocks.reverseGeocode.mockResolvedValue(null)

    const data = makeData([
      { lat: 45.51, lng: -73.61, region: 'Montréal' },
      { lat: 46.8, lng: -71.2, region: 'Capitale-Nationale' },
    ])

    const { result } = renderHook(() =>
      useGeolocation({ data, setRegion, setSearch, setFlyTarget }),
    )

    await waitFor(() => {
      expect(result.current.geoReady).toBe(true)
    })

    expect(setRegion).toHaveBeenCalledWith('Montréal')
  })

  it('met geoReady à true après la géolocalisation réussie', async () => {
    const mockGetCurrentPosition = vi.fn(
      (success: PositionCallback) => {
        success({
          coords: { latitude: 45.5, longitude: -73.6 },
        } as GeolocationPosition)
      },
    )

    Object.defineProperty(navigator, 'geolocation', {
      value: { getCurrentPosition: mockGetCurrentPosition },
      configurable: true,
      writable: true,
    })

    mocks.reverseGeocode.mockResolvedValue(null)

    const { result } = renderHook(() =>
      useGeolocation({ data: null, setRegion, setSearch, setFlyTarget }),
    )

    await waitFor(() => {
      expect(result.current.geoReady).toBe(true)
    })
  })

  it('met geoReady à true après une erreur de géolocalisation', async () => {
    const mockGetCurrentPosition = vi.fn(
      (_success: PositionCallback, error: PositionErrorCallback) => {
        error({
          code: 1,
          message: 'User denied',
          PERMISSION_DENIED: 1,
          POSITION_UNAVAILABLE: 2,
          TIMEOUT: 3,
        })
      },
    )

    Object.defineProperty(navigator, 'geolocation', {
      value: { getCurrentPosition: mockGetCurrentPosition },
      configurable: true,
      writable: true,
    })

    const { result } = renderHook(() =>
      useGeolocation({ data: null, setRegion, setSearch, setFlyTarget }),
    )

    await waitFor(() => {
      expect(result.current.geoReady).toBe(true)
    })

    expect(result.current.userPos).toBeNull()
  })

  it('appelle setSearch quand reverseGeocode retourne une ville', async () => {
    const mockGetCurrentPosition = vi.fn(
      (success: PositionCallback) => {
        success({
          coords: { latitude: 45.5, longitude: -73.6 },
        } as GeolocationPosition)
      },
    )

    Object.defineProperty(navigator, 'geolocation', {
      value: { getCurrentPosition: mockGetCurrentPosition },
      configurable: true,
      writable: true,
    })

    mocks.reverseGeocode.mockResolvedValue('Laval')
    mocks.distanceKm.mockReturnValue(5)

    const data = makeData([
      { lat: 45.51, lng: -73.61, region: 'Laval' },
    ])

    const { result } = renderHook(() =>
      useGeolocation({ data, setRegion, setSearch, setFlyTarget }),
    )

    await waitFor(() => {
      expect(result.current.geoReady).toBe(true)
    })

    expect(setSearch).toHaveBeenCalledWith('Laval')
  })

  it('utilise un zoom de 13 pour Saint-Georges', async () => {
    const mockGetCurrentPosition = vi.fn(
      (success: PositionCallback) => {
        success({
          coords: { latitude: 46.12, longitude: -70.67 },
        } as GeolocationPosition)
      },
    )

    Object.defineProperty(navigator, 'geolocation', {
      value: { getCurrentPosition: mockGetCurrentPosition },
      configurable: true,
      writable: true,
    })

    mocks.reverseGeocode.mockResolvedValue('Saint-Georges')
    mocks.normalize.mockImplementation((s: string) => s.toLowerCase())

    const { result } = renderHook(() =>
      useGeolocation({ data: null, setRegion, setSearch, setFlyTarget }),
    )

    await waitFor(() => {
      expect(result.current.geoReady).toBe(true)
    })

    expect(setFlyTarget).toHaveBeenCalledWith(
      expect.objectContaining({ zoom: 13 }),
    )
  })
})
