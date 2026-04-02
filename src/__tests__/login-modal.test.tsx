import { describe, expect, it, vi, beforeEach } from 'vitest'
import { act, render, screen, fireEvent, waitFor } from '@testing-library/react'

const signInWithOtp = vi.fn()
const verifyOtp = vi.fn()

vi.mock('@/lib/auth', () => ({
  createBrowserClient: () => ({
    auth: {
      signInWithOtp,
      verifyOtp,
    },
  }),
}))

vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: React.PropsWithChildren<Record<string, unknown>>) => {
      const { initial, animate, transition, ...rest } = props as Record<string, unknown>
      void initial; void animate; void transition
      return <div {...(rest as React.HTMLAttributes<HTMLDivElement>)}>{children}</div>
    },
  },
}))

import LoginModal from '@/components/LoginModal'

describe('LoginModal', () => {
  const onClose = vi.fn()

  beforeEach(() => {
    signInWithOtp.mockReset()
    verifyOtp.mockReset()
    onClose.mockReset()
  })

  it('affiche le formulaire de courriel par défaut', () => {
    render(<LoginModal onClose={onClose} />)

    expect(screen.getByText('Connexion')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('exemple@courriel.com')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Envoyer le code/i })).toBeInTheDocument()
  })

  it('affiche l\'erreur traduite en français pour un token expiré', async () => {
    signInWithOtp.mockResolvedValue({
      error: { message: 'Token has expired or is invalid' },
    })

    render(<LoginModal onClose={onClose} />)

    fireEvent.change(screen.getByPlaceholderText('exemple@courriel.com'), {
      target: { value: 'test@example.com' },
    })
    fireEvent.click(screen.getByRole('button', { name: /Envoyer le code/i }))

    expect(
      await screen.findByText(
        'Le code a expiré ou est invalide. Veuillez en demander un nouveau.',
      ),
    ).toBeInTheDocument()
  })

  it('appelle onClose automatiquement après 2.5s à l\'étape "done"', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true })

    // Étape 1 : envoyer le code avec succès
    signInWithOtp.mockResolvedValue({ error: null })
    // Étape 2 : vérifier le code avec succès
    verifyOtp.mockResolvedValue({ error: null })

    render(<LoginModal onClose={onClose} />)

    // Remplir le courriel et soumettre
    fireEvent.change(screen.getByPlaceholderText('exemple@courriel.com'), {
      target: { value: 'test@example.com' },
    })
    fireEvent.click(screen.getByRole('button', { name: /Envoyer le code/i }))

    // Attendre le passage à l'étape "code"
    await waitFor(() => {
      expect(screen.getByPlaceholderText('000000')).toBeInTheDocument()
    })

    // Remplir le code et soumettre
    fireEvent.change(screen.getByPlaceholderText('000000'), {
      target: { value: '123456' },
    })
    fireEvent.click(screen.getByRole('button', { name: /Vérifier le code/i }))

    // Attendre le passage à l'étape "done"
    await waitFor(() => {
      expect(screen.getByText(/Connexion réussie/i)).toBeInTheDocument()
    })

    // Flush des microtasks pour que useEffect s'exécute et enregistre le setTimeout
    await act(async () => {
      await Promise.resolve()
    })

    // Vérifier que onClose n'a pas encore été appelé
    expect(onClose).not.toHaveBeenCalled()

    // Avancer le timer de 2.5s
    act(() => {
      vi.advanceTimersByTime(2500)
    })

    expect(onClose).toHaveBeenCalledTimes(1)

    vi.useRealTimers()
  })
})
