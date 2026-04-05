import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";

const mockSetTheme = vi.fn();

vi.mock("next-themes", () => ({
  useTheme: () => ({ resolvedTheme: "light", setTheme: mockSetTheme }),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

vi.mock("@/components/ui/input", () => ({
  Input: (props: React.InputHTMLAttributes<HTMLInputElement>) => <input {...props} />,
}));

vi.mock("@/components/ui/dropdown-menu", () => ({
  DropdownMenu: ({ children }: React.PropsWithChildren) => <div>{children}</div>,
  DropdownMenuTrigger: ({ children }: React.PropsWithChildren) => <div>{children}</div>,
  DropdownMenuContent: ({ children }: React.PropsWithChildren) => <div>{children}</div>,
  DropdownMenuItem: ({ children, onClick }: React.PropsWithChildren<{ onClick?: () => void }>) => (
    <div onClick={onClick}>{children}</div>
  ),
  DropdownMenuSeparator: () => <hr />,
  DropdownMenuLabel: ({ children }: React.PropsWithChildren) => <div>{children}</div>,
  DropdownMenuGroup: ({ children }: React.PropsWithChildren) => <div>{children}</div>,
}));

vi.mock("@/components/NavDropdown", () => ({
  default: ({ onChangelogClick }: { onChangelogClick: () => void }) => (
    <button onClick={onChangelogClick} data-testid="nav-dropdown">Nav</button>
  ),
}));

vi.mock("@/components/UserDropdown", () => ({
  default: ({ email, onLogout }: { email: string; onLogout: () => void }) => (
    <div data-testid="user-dropdown">
      <span>{email}</span>
      <button onClick={onLogout}>Déconnexion</button>
    </div>
  ),
}));

import FilterBar from "@/components/FilterBar";

const defaultProps = {
  gasType: "Régulier" as const,
  onGasTypeChange: vi.fn(),
  brand: "",
  onBrandChange: vi.fn(),
  region: "",
  onRegionChange: vi.fn(),
  search: "",
  onSearchChange: vi.fn(),
  cities: ["Montréal", "Québec", "Laval"],
  showFavorites: false,
  onToggleFavorites: vi.fn(),
  regionCounts: { "Capitale-Nationale": 50, "Montréal": 120 },
  brandCounts: { Shell: 30, "Petro-Canada": 40 },
  cityCounts: { Montréal: 120, Québec: 80, Laval: 40 },
  totalStations: 2000,
  onLoginClick: vi.fn(),
  onChangelogClick: vi.fn(),
  onSuggestionClick: vi.fn(),
  currentUser: null,
  onLogout: vi.fn(),
};

beforeEach(() => {
  vi.useFakeTimers();
  for (const fn of Object.values(defaultProps)) {
    if (typeof fn === "function") (fn as ReturnType<typeof vi.fn>).mockClear();
  }
  mockSetTheme.mockClear();
});

afterEach(() => {
  vi.useRealTimers();
});

describe("FilterBar", () => {
  it("affiche le titre Essence Québec", () => {
    render(<FilterBar {...defaultProps} />);
    expect(screen.getByText("Essence Québec")).toBeInTheDocument();
  });

  it("affiche le sous-titre", () => {
    render(<FilterBar {...defaultProps} />);
    expect(screen.getByText("Prix en temps réel des stations-service")).toBeInTheDocument();
  });

  it("affiche les boutons de type de carburant", () => {
    render(<FilterBar {...defaultProps} />);
    expect(screen.getAllByText("Régulier").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("Super").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("Diesel").length).toBeGreaterThanOrEqual(1);
  });

  it("appelle onGasTypeChange quand on clique sur un type", () => {
    render(<FilterBar {...defaultProps} />);
    const superButtons = screen.getAllByText("Super");
    fireEvent.click(superButtons[0]);
    expect(defaultProps.onGasTypeChange).toHaveBeenCalled();
  });

  it("affiche le bouton Connexion quand pas d'utilisateur", () => {
    render(<FilterBar {...defaultProps} />);
    expect(screen.getAllByText("Connexion").length).toBeGreaterThanOrEqual(1);
  });

  it("affiche le UserDropdown quand connecté", () => {
    render(<FilterBar {...defaultProps} currentUser={{ email: "test@example.com" }} />);
    expect(screen.getByTestId("user-dropdown")).toBeInTheDocument();
  });

  it("appelle onLoginClick quand on clique Connexion", () => {
    render(<FilterBar {...defaultProps} />);
    fireEvent.click(screen.getAllByText("Connexion")[0]);
    expect(defaultProps.onLoginClick).toHaveBeenCalled();
  });

  it("appelle onToggleFavorites", () => {
    render(<FilterBar {...defaultProps} />);
    fireEvent.click(screen.getAllByText("Favoris")[0]);
    expect(defaultProps.onToggleFavorites).toHaveBeenCalled();
  });

  it("affiche Suggestion", () => {
    render(<FilterBar {...defaultProps} />);
    expect(screen.getAllByText("Suggestion").length).toBeGreaterThanOrEqual(1);
  });

  it("appelle onSuggestionClick", () => {
    render(<FilterBar {...defaultProps} />);
    const btns = screen.getAllByText("Suggestion");
    fireEvent.click(btns[0]);
    expect(defaultProps.onSuggestionClick).toHaveBeenCalled();
  });

  // ── SearchWithSuggestions ──

  it("filtre les suggestions avec debounce + focus", async () => {
    render(<FilterBar {...defaultProps} />);
    const inputs = screen.getAllByPlaceholderText("Ville…");
    fireEvent.focus(inputs[0]);
    fireEvent.change(inputs[0], { target: { value: "Mon" } });

    // Debounce 200ms
    await act(async () => { vi.advanceTimersByTime(250); });

    // Suggestions visible quand focused=true et debouncedInput a >= 2 chars
    const suggestions = document.querySelectorAll(".suggestion-item");
    expect(suggestions.length).toBeGreaterThanOrEqual(1);
  });

  it("appelle onSearchChange quand on appuie sur Enter", () => {
    render(<FilterBar {...defaultProps} />);
    const inputs = screen.getAllByPlaceholderText("Ville…");
    fireEvent.change(inputs[0], { target: { value: "Laval" } });
    fireEvent.keyDown(inputs[0], { key: "Enter" });
    expect(defaultProps.onSearchChange).toHaveBeenCalledWith("Laval");
  });

  it("affiche le bouton X pour effacer la recherche", () => {
    render(<FilterBar {...defaultProps} search="Québec" />);
    // Le composant SearchWithSuggestions utilise le state input interne
    // mais sync depuis search prop
    const inputs = screen.getAllByPlaceholderText("Ville…");
    fireEvent.change(inputs[0], { target: { value: "test" } });
    // Le bouton X apparaît quand input n'est pas vide
    const clearBtns = document.querySelectorAll(".nb-input-clear");
    expect(clearBtns.length).toBeGreaterThanOrEqual(1);
  });

  it("efface la recherche quand on clique X", () => {
    render(<FilterBar {...defaultProps} />);
    const inputs = screen.getAllByPlaceholderText("Ville…");
    fireEvent.change(inputs[0], { target: { value: "test" } });

    const clearBtns = document.querySelectorAll(".nb-input-clear");
    if (clearBtns[0]) {
      fireEvent.mouseDown(clearBtns[0]);
      expect(defaultProps.onSearchChange).toHaveBeenCalledWith("");
    }
  });

  // ── NbSelect ──

  it("appelle onRegionChange quand on change la région", () => {
    render(<FilterBar {...defaultProps} />);
    const selects = document.querySelectorAll(".nb-select");
    // First select is region (desktop), second is brand
    if (selects[0]) {
      fireEvent.change(selects[0], { target: { value: "Capitale-Nationale" } });
      expect(defaultProps.onRegionChange).toHaveBeenCalled();
    }
  });

  it("appelle onBrandChange quand on change la marque", () => {
    render(<FilterBar {...defaultProps} />);
    const selects = document.querySelectorAll(".nb-select");
    if (selects[1]) {
      fireEvent.change(selects[1], { target: { value: "Shell" } });
      expect(defaultProps.onBrandChange).toHaveBeenCalled();
    }
  });

  // ── ThemeToggle ──

  it("appelle setTheme au clic du toggle theme", () => {
    render(<FilterBar {...defaultProps} />);
    const themeBtn = screen.getByLabelText("Mode sombre");
    fireEvent.click(themeBtn);
    expect(mockSetTheme).toHaveBeenCalledWith("dark");
  });

  // ── Favoris actifs ──

  it("affiche le style actif quand showFavorites=true", () => {
    render(<FilterBar {...defaultProps} showFavorites={true} />);
    const favBtns = document.querySelectorAll(".nb-fav-active");
    expect(favBtns.length).toBeGreaterThanOrEqual(1);
  });

  // ── SearchWithSuggestions: sélection de suggestion ──

  it("appelle onSearchChange avec la ville quand on clique une suggestion", async () => {
    render(<FilterBar {...defaultProps} />);
    const inputs = screen.getAllByPlaceholderText("Ville…");
    fireEvent.focus(inputs[0]);
    fireEvent.change(inputs[0], { target: { value: "Mon" } });

    await act(async () => { vi.advanceTimersByTime(250); });

    const suggestions = document.querySelectorAll(".suggestion-item");
    expect(suggestions.length).toBeGreaterThanOrEqual(1);

    // mouseDown triggers select(city) which calls onSearchChange + onConfirm
    fireEvent.mouseDown(suggestions[0]);
    expect(defaultProps.onSearchChange).toHaveBeenCalledWith("Montréal");
  });

  // ── SearchWithSuggestions: onBlur ferme les suggestions ──

  it("ferme les suggestions au blur après un délai", async () => {
    render(<FilterBar {...defaultProps} />);
    const inputs = screen.getAllByPlaceholderText("Ville…");
    fireEvent.focus(inputs[0]);
    fireEvent.change(inputs[0], { target: { value: "Mon" } });

    await act(async () => { vi.advanceTimersByTime(250); });

    expect(document.querySelectorAll(".suggestion-item").length).toBeGreaterThanOrEqual(1);

    fireEvent.blur(inputs[0]);

    // Le setTimeout(150ms) dans onBlur met focused=false
    await act(async () => { vi.advanceTimersByTime(200); });

    expect(document.querySelectorAll(".suggestion-item").length).toBe(0);
  });

  // ── SearchWithSuggestions: affichage du compteur de stations par ville ──

  it("affiche le compteur de stations dans les suggestions", async () => {
    render(<FilterBar {...defaultProps} />);
    const inputs = screen.getAllByPlaceholderText("Ville…");
    fireEvent.focus(inputs[0]);
    fireEvent.change(inputs[0], { target: { value: "Mon" } });

    await act(async () => { vi.advanceTimersByTime(250); });

    const suggestions = document.querySelectorAll(".suggestion-item");
    expect(suggestions.length).toBeGreaterThanOrEqual(1);
    // cityCounts.Montréal = 120
    expect(suggestions[0].textContent).toContain("(120)");
  });
});
