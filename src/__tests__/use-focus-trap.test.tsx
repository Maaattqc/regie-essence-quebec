import { describe, expect, it, beforeEach } from 'vitest'
import { render, screen, fireEvent, cleanup } from '@testing-library/react'
import { useFocusTrap } from '@/hooks/useFocusTrap'

function TestTrap({ active = true }: { active?: boolean }) {
  const ref = useFocusTrap(active)
  return (
    <div ref={ref}>
      <button data-testid="btn1">First</button>
      <button data-testid="btn2">Second</button>
      <button data-testid="btn3">Third</button>
    </div>
  )
}

describe('useFocusTrap', () => {
  beforeEach(() => {
    cleanup()
  })

  it('retourne une ref attachable à un élément DOM', () => {
    render(<TestTrap />)

    // Si la ref est bien attachée, le premier bouton reçoit le focus
    expect(screen.getByTestId('btn1')).toBeInTheDocument()
  })

  it('met le focus sur le premier élément focusable au montage', () => {
    render(<TestTrap />)

    expect(document.activeElement).toBe(screen.getByTestId('btn1'))
  })

  it('boucle le Tab du dernier élément vers le premier', () => {
    render(<TestTrap />)

    const btn3 = screen.getByTestId('btn3')
    btn3.focus()
    expect(document.activeElement).toBe(btn3)

    fireEvent.keyDown(btn3, { key: 'Tab', shiftKey: false })

    expect(document.activeElement).toBe(screen.getByTestId('btn1'))
  })

  it('boucle le Shift+Tab du premier élément vers le dernier', () => {
    render(<TestTrap />)

    const btn1 = screen.getByTestId('btn1')
    expect(document.activeElement).toBe(btn1)

    fireEvent.keyDown(btn1, { key: 'Tab', shiftKey: true })

    expect(document.activeElement).toBe(screen.getByTestId('btn3'))
  })

  it('restaure le focus sur l\'élément précédent au démontage', () => {
    // Créer un bouton externe qui a le focus avant le montage du trap
    const outer = document.createElement('button')
    outer.textContent = 'Outer'
    document.body.appendChild(outer)
    outer.focus()
    expect(document.activeElement).toBe(outer)

    const { unmount } = render(<TestTrap />)

    // Le focus a été déplacé dans le trap
    expect(document.activeElement).toBe(screen.getByTestId('btn1'))

    unmount()

    // Le focus est restauré sur l'élément précédent
    expect(document.activeElement).toBe(outer)

    document.body.removeChild(outer)
  })

  it('ne fait rien quand active=false', () => {
    const outer = document.createElement('button')
    outer.textContent = 'Outer'
    document.body.appendChild(outer)
    outer.focus()

    render(<TestTrap active={false} />)

    // Le focus reste sur l'élément externe (pas de piège)
    expect(document.activeElement).toBe(outer)

    document.body.removeChild(outer)
  })
})
