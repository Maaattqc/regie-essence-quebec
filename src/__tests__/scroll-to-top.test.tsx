import { afterEach, describe, expect, it, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'

import ScrollToTop from '@/components/ScrollToTop'

describe('ScrollToTop', () => {
  let container: HTMLDivElement | null = null

  function setupContainer() {
    container = document.createElement('div')
    container.id = 'scroll-root'
    Object.defineProperty(container, 'scrollTop', {
      value: 0,
      writable: true,
      configurable: true,
    })
    container.scrollTo = vi.fn()
    document.body.appendChild(container)
    return container
  }

  afterEach(() => {
    if (container && document.body.contains(container)) {
      document.body.removeChild(container)
    }
    container = null
  })

  it('retourne null initialement (bouton non visible)', () => {
    setupContainer()

    const { container: wrapper } = render(<ScrollToTop containerId="scroll-root" />)

    expect(wrapper.innerHTML).toBe('')
    expect(screen.queryByLabelText('Retour en haut')).not.toBeInTheDocument()
  })

  it('affiche le bouton après un scroll supérieur à 300px', () => {
    const el = setupContainer()

    render(<ScrollToTop containerId="scroll-root" />)

    // Simuler un scroll > 300
    Object.defineProperty(el, 'scrollTop', { value: 350, writable: true, configurable: true })
    fireEvent.scroll(el)

    expect(screen.getByLabelText('Retour en haut')).toBeInTheDocument()
  })

  it('appelle scrollTo au clic', () => {
    const el = setupContainer()

    render(<ScrollToTop containerId="scroll-root" />)

    // Rendre le bouton visible
    Object.defineProperty(el, 'scrollTop', { value: 400, writable: true, configurable: true })
    fireEvent.scroll(el)

    const button = screen.getByLabelText('Retour en haut')
    fireEvent.click(button)

    expect(el.scrollTo).toHaveBeenCalledWith({ top: 0, behavior: 'smooth' })
  })
})
