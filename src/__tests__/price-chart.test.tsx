import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import PriceChart from '@/components/PriceChart'

describe('PriceChart', () => {
  it('affiche letat vide quand il ny a pas assez de donnees', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      json: async () => [{ price: 154.9, snapshot_date: '2026-04-01' }],
    })

    vi.stubGlobal('fetch', fetchMock)

    render(
      <PriceChart
        stationName="Station Test"
        address="123 Rue Test"
        gasType="Regulier"
      />,
    )

    expect(screen.getByText(/Chargement/i)).toBeInTheDocument()
    expect(await screen.findByText(/Pas assez de donn/i)).toBeInTheDocument()
    expect(fetchMock).toHaveBeenCalledWith(
      '/api/history?station=Station%20Test&address=123%20Rue%20Test&type=Regulier&days=30',
    )
  })

  it('trace la courbe et affiche le point survolé', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        json: async () => [
          { price: 150.1, snapshot_date: '2026-04-01' },
          { price: 151.4, snapshot_date: '2026-04-02' },
          { price: 149.8, snapshot_date: '2026-04-03' },
        ],
      }),
    )

    const { container } = render(
      <PriceChart
        stationName="Station Test"
        address="123 Rue Test"
        gasType="Regulier"
      />,
    )

    await screen.findByText(/Min:/i)

    const svg = container.querySelector('svg')
    expect(svg).not.toBeNull()

    vi.spyOn(svg!, 'getBoundingClientRect').mockReturnValue({
      x: 0,
      y: 0,
      width: 280,
      height: 50,
      top: 0,
      right: 280,
      bottom: 50,
      left: 0,
      toJSON: () => ({}),
    } as DOMRect)

    fireEvent.mouseMove(svg!, { clientX: 140 })

    expect(container.querySelector('polyline')).not.toBeNull()
    expect(container.querySelector('circle')).not.toBeNull()
    expect(await screen.findByText(/2026-04-02/)).toBeInTheDocument()
  })

  it('affiche un état vide quand fetch échoue', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockRejectedValue(new Error('Network error')),
    )

    render(
      <PriceChart
        stationName="Station Test"
        address="123 Rue Test"
        gasType="Regulier"
      />,
    )

    expect(screen.getByText(/Chargement/i)).toBeInTheDocument()
    expect(await screen.findByText(/Pas assez de donn/i)).toBeInTheDocument()
  })

  it('masque le point au mouseLeave', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        json: async () => [
          { price: 150.1, snapshot_date: '2026-04-01' },
          { price: 151.4, snapshot_date: '2026-04-02' },
          { price: 149.8, snapshot_date: '2026-04-03' },
        ],
      }),
    )

    const { container } = render(
      <PriceChart
        stationName="Station Test"
        address="123 Rue Test"
        gasType="Regulier"
      />,
    )

    await screen.findByText(/Min:/i)

    const svg = container.querySelector('svg')!
    vi.spyOn(svg, 'getBoundingClientRect').mockReturnValue({
      x: 0, y: 0, width: 280, height: 50,
      top: 0, right: 280, bottom: 50, left: 0,
      toJSON: () => ({}),
    } as DOMRect)

    fireEvent.mouseMove(svg, { clientX: 140 })
    expect(container.querySelector('circle')).not.toBeNull()

    fireEvent.mouseLeave(svg)
    expect(container.querySelector('circle')).toBeNull()
  })

  it('gère le touchMove et touchEnd', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        json: async () => [
          { price: 150.1, snapshot_date: '2026-04-01' },
          { price: 151.4, snapshot_date: '2026-04-02' },
          { price: 149.8, snapshot_date: '2026-04-03' },
        ],
      }),
    )

    const { container } = render(
      <PriceChart
        stationName="Station Test"
        address="123 Rue Test"
        gasType="Regulier"
      />,
    )

    await screen.findByText(/Min:/i)

    const svg = container.querySelector('svg')!
    vi.spyOn(svg, 'getBoundingClientRect').mockReturnValue({
      x: 0, y: 0, width: 280, height: 50,
      top: 0, right: 280, bottom: 50, left: 0,
      toJSON: () => ({}),
    } as DOMRect)

    fireEvent.touchMove(svg, { touches: [{ clientX: 140 }] })
    expect(container.querySelector('circle')).not.toBeNull()

    fireEvent.touchEnd(svg)
    expect(container.querySelector('circle')).toBeNull()
  })
})
