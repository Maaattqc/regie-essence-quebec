import { describe, expect, it, vi, beforeEach } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'

type AuthCallback = (event: string, session: { user?: { email?: string }; access_token?: string } | null) => void

const mocks = vi.hoisted(() => {
  const unsubscribe = vi.fn()
  let authCallback: AuthCallback | null = null

  return {
    getSession: vi.fn(),
    onAuthStateChange: vi.fn(
      (cb: AuthCallback) => {
        authCallback = cb
        return { data: { subscription: { unsubscribe } } }
      },
    ),
    unsubscribe,
    getAuthCallback: () => authCallback,
  }
})

vi.mock('@/lib/auth', () => ({
  createBrowserClient: () => ({
    auth: {
      getSession: mocks.getSession,
      onAuthStateChange: mocks.onAuthStateChange,
    },
  }),
}))

import { useMapAuth } from '@/hooks/useMapAuth'

describe('useMapAuth', () => {
  beforeEach(() => {
    mocks.getSession.mockReset()
    mocks.onAuthStateChange.mockClear()
    mocks.unsubscribe.mockClear()
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true }))
  })

  it('retourne currentUser null initialement', () => {
    mocks.getSession.mockResolvedValue({ data: { session: null } })

    const { result } = renderHook(() => useMapAuth())

    expect(result.current.currentUser).toBeNull()
  })

  it('initialise le user depuis la session existante', async () => {
    mocks.getSession.mockResolvedValue({
      data: { session: { user: { email: 'alice@example.com' } } },
    })

    const { result } = renderHook(() => useMapAuth())

    await waitFor(() => {
      expect(result.current.currentUser).toEqual({ email: 'alice@example.com' })
    })
  })

  it('met currentUser à null quand la session est vide', async () => {
    mocks.getSession.mockResolvedValue({
      data: { session: { user: { email: 'alice@example.com' } } },
    })

    const { result } = renderHook(() => useMapAuth())

    await waitFor(() => {
      expect(result.current.currentUser).toEqual({ email: 'alice@example.com' })
    })

    // Simuler une déconnexion via le callback
    const callback = mocks.getAuthCallback()!
    act(() => {
      callback('SIGNED_OUT', null)
    })

    expect(result.current.currentUser).toBeNull()
  })

  it('appelle fetch /api/auth/log lors d\'un SIGNED_IN', async () => {
    mocks.getSession.mockResolvedValue({ data: { session: null } })
    const fetchMock = vi.fn().mockResolvedValue({ ok: true })
    vi.stubGlobal('fetch', fetchMock)

    renderHook(() => useMapAuth())

    const callback = mocks.getAuthCallback()!
    act(() => {
      callback('SIGNED_IN', {
        user: { email: 'bob@example.com' },
        access_token: 'token-123',
      })
    })

    expect(fetchMock).toHaveBeenCalledWith('/api/auth/log', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'bob@example.com',
        event: 'SIGNED_IN',
        token: 'token-123',
      }),
    })
  })

  it('appelle fetch /api/auth/log lors d\'un SIGNED_OUT avec les infos précédentes', async () => {
    mocks.getSession.mockResolvedValue({ data: { session: null } })
    const fetchMock = vi.fn().mockResolvedValue({ ok: true })
    vi.stubGlobal('fetch', fetchMock)

    renderHook(() => useMapAuth())

    const callback = mocks.getAuthCallback()!

    // D'abord simuler un SIGNED_IN pour stocker lastEmail/lastToken
    act(() => {
      callback('SIGNED_IN', {
        user: { email: 'bob@example.com' },
        access_token: 'token-123',
      })
    })

    fetchMock.mockClear()

    // Puis simuler un SIGNED_OUT
    act(() => {
      callback('SIGNED_OUT', null)
    })

    expect(fetchMock).toHaveBeenCalledWith('/api/auth/log', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'bob@example.com',
        event: 'SIGNED_OUT',
        token: 'token-123',
      }),
    })
  })

  it('se désabonne au démontage', async () => {
    mocks.getSession.mockResolvedValue({ data: { session: null } })

    const { unmount } = renderHook(() => useMapAuth())

    unmount()

    expect(mocks.unsubscribe).toHaveBeenCalledTimes(1)
  })
})
