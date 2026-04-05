import { describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";

const mockSetTheme = vi.fn();
let mockResolvedTheme = "light";

vi.mock("next-themes", () => ({
  useTheme: () => ({
    get resolvedTheme() { return mockResolvedTheme; },
    setTheme: mockSetTheme,
  }),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    back: vi.fn(),
    refresh: vi.fn(),
  }),
}));

vi.mock("@/contexts/LanguageContext", () => ({
  useLanguage: () => ({
    locale: "fr",
    toggle: vi.fn(),
    t: {
      filterBar: { suggestion: "Suggestion", lightMode: "Mode clair", darkMode: "Mode sombre" },
      nav: { changelog: "Historique des mises à jour", about: "À propos", tech: "Informations techniques", privacy: "Confidentialité" },
    },
  }),
}));

vi.mock("@/components/ui/dropdown-menu", () => {
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
      className,
    }: React.PropsWithChildren<{ onClick?: () => void; className?: string }>) => (
      <div data-testid="dropdown-item" className={className} onClick={onClick}>
        {children}
      </div>
    ),
  };
});

import NavDropdown from "@/components/NavDropdown";

describe("NavDropdown", () => {
  it("affiche l'icône de réglages (Settings)", () => {
    render(<NavDropdown onChangelogClick={vi.fn()} />);

    const trigger = screen.getByTestId("dropdown-trigger");
    const svg = trigger.querySelector("svg");
    expect(svg).not.toBeNull();
  });

  it("contient l'item Historique des mises à jour", () => {
    render(<NavDropdown onChangelogClick={vi.fn()} />);

    expect(screen.getByText("Historique des mises à jour")).toBeInTheDocument();
  });

  it("affiche l'item Suggestion quand onSuggestionClick est fourni", () => {
    const mockSuggestion = vi.fn();
    render(<NavDropdown onChangelogClick={vi.fn()} onSuggestionClick={mockSuggestion} />);

    const suggestionItem = screen.getByText("Suggestion");
    expect(suggestionItem).toBeInTheDocument();

    fireEvent.click(suggestionItem.closest("[data-testid='dropdown-item']")!);
    expect(mockSuggestion).toHaveBeenCalled();
  });

  it("n'affiche pas l'item Suggestion quand onSuggestionClick est absent", () => {
    render(<NavDropdown onChangelogClick={vi.fn()} />);

    expect(screen.queryByText("Suggestion")).not.toBeInTheDocument();
  });

  it("bascule le thème en cliquant sur l'item theme (light vers dark)", () => {
    mockResolvedTheme = "light";
    render(<NavDropdown onChangelogClick={vi.fn()} />);

    // En mode light, le texte affiche "Mode sombre"
    const themeItem = screen.getByText("Mode sombre").closest("[data-testid='dropdown-item']")!;
    fireEvent.click(themeItem);

    expect(mockSetTheme).toHaveBeenCalledWith("dark");
  });

  it("bascule le thème en cliquant sur l'item theme (dark vers light)", () => {
    mockResolvedTheme = "dark";
    render(<NavDropdown onChangelogClick={vi.fn()} />);

    // En mode dark, le texte affiche "Mode clair"
    const themeItem = screen.getByText("Mode clair").closest("[data-testid='dropdown-item']")!;
    fireEvent.click(themeItem);

    expect(mockSetTheme).toHaveBeenCalledWith("light");
  });
});
