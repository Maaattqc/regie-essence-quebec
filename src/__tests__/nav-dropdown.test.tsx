import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    back: vi.fn(),
    refresh: vi.fn(),
  }),
}))

vi.mock('@/components/ui/dropdown-menu', () => {
  return {
    DropdownMenu: ({ children }: React.PropsWithChildren) => (
      <div data-testid="dropdown-menu">{children}</div>
    ),
    DropdownMenuTrigger: ({ children }: React.PropsWithChildren) => (
      <div data-testid="dropdown-trigger">{children}</div>
    ),
    DropdownMenuContent: ({ children }: React.PropsWithChildren) => (
      <div data-testid="dropdown-content">{children}</div>
    ),
    DropdownMenuItem: ({
      children,
      onClick,
    }: React.PropsWithChildren<{ onClick?: () => void }>) => (
      <div data-testid="dropdown-item" onClick={onClick}>
        {children}
      </div>
    ),
  }
})

import NavDropdown from '@/components/NavDropdown'

describe('NavDropdown', () => {
  it('affiche l\'icône de réglages (Settings)', () => {
    render(<NavDropdown onChangelogClick={vi.fn()} />)

    // Le composant Settings de lucide-react rend un SVG
    const trigger = screen.getByTestId('dropdown-trigger')
    const svg = trigger.querySelector('svg')
    expect(svg).not.toBeNull()
  })

  it('contient l\'item Changelogs Code', () => {
    render(<NavDropdown onChangelogClick={vi.fn()} />)

    expect(screen.getByText('Changelogs Code')).toBeInTheDocument()
  })
})
