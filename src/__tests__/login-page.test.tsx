import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const signInWithOtp = vi.fn()

vi.mock('@/lib/auth', () => ({
  createBrowserClient: () => ({
    auth: {
      signInWithOtp,
    },
  }),
}))

import LoginPage from '@/app/login/page'

describe('LoginPage', () => {
  beforeEach(() => {
    signInWithOtp.mockReset()
  })

  it('envoie le magic link et affiche letat de succes', async () => {
    signInWithOtp.mockResolvedValue({ error: null })

    render(<LoginPage />)

    fireEvent.change(screen.getByPlaceholderText(/courriel\.com/i), {
      target: { value: 'mathieu@example.com' },
    })
    fireEvent.click(screen.getByRole('button', { name: /Envoyer le lien/i }))

    await waitFor(() => {
      expect(signInWithOtp).toHaveBeenCalledWith({
        email: 'mathieu@example.com',
        options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
      })
    })

    expect(await screen.findByText(/mathieu@example\.com/i)).toBeInTheDocument()
  })

  it('affiche le message derreur supabase', async () => {
    signInWithOtp.mockResolvedValue({
      error: { message: 'Adresse refusee' },
    })

    render(<LoginPage />)

    fireEvent.change(screen.getByPlaceholderText(/courriel\.com/i), {
      target: { value: 'mathieu@example.com' },
    })
    fireEvent.click(screen.getByRole('button', { name: /Envoyer le lien/i }))

    expect(await screen.findByText('Adresse refusee')).toBeInTheDocument()
  })
})
