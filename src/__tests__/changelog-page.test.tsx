import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import ChangelogPage from '@/app/changelog/page'

describe('ChangelogPage', () => {
  it('affiche les commits recuperes depuis lapi', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      json: async () => [
        {
          sha: 'abcdef123456',
          date: '2026-04-02T12:00:00.000Z',
          message: 'Ajout de la suite de tests',
          author: 'Mathieu Fournier',
        },
      ],
    })

    vi.stubGlobal('fetch', fetchMock)

    render(<ChangelogPage />)

    expect(screen.getByText(/Chargement/i)).toBeInTheDocument()
    expect(await screen.findByText(/Ajout de la suite de tests/i)).toBeInTheDocument()
    expect(screen.getByText('abcdef1')).toBeInTheDocument()
    expect(fetchMock).toHaveBeenCalledWith('/api/changelog')
  })

  it('affiche letat vide quand la requete echoue', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('boom')))

    render(<ChangelogPage />)

    expect(await screen.findByText(/Aucun commit/i)).toBeInTheDocument()
  })
})
