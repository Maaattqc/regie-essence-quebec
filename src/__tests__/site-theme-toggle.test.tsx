import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";

let mockTheme = "light";
const mockSetTheme = vi.fn();

vi.mock("next-themes", () => ({
  useTheme: () => ({
    theme: mockTheme,
    setTheme: mockSetTheme,
  }),
}));

vi.mock("@/components/ui/button", () => ({
  Button: ({
    children,
    onClick,
    ...props
  }: React.PropsWithChildren<React.ButtonHTMLAttributes<HTMLButtonElement>>) => (
    <button onClick={onClick} {...props}>
      {children}
    </button>
  ),
}));

import SiteThemeToggle from "@/components/SiteThemeToggle";

describe("SiteThemeToggle", () => {
  beforeEach(() => {
    mockTheme = "light";
    mockSetTheme.mockClear();
  });

  it("affiche le texte Mode sombre en mode clair", () => {
    render(<SiteThemeToggle />);
    expect(screen.getByText("Mode sombre")).toBeInTheDocument();
  });

  it("appelle setTheme('dark') quand on clique en mode clair", () => {
    render(<SiteThemeToggle />);
    fireEvent.click(screen.getByText("Mode sombre"));
    expect(mockSetTheme).toHaveBeenCalledWith("dark");
  });

  it("affiche Mode clair en mode sombre", () => {
    mockTheme = "dark";
    render(<SiteThemeToggle />);
    expect(screen.getByText("Mode clair")).toBeInTheDocument();
  });

  it("appelle setTheme('light') quand on clique en mode sombre", () => {
    mockTheme = "dark";
    render(<SiteThemeToggle />);
    fireEvent.click(screen.getByText("Mode clair"));
    expect(mockSetTheme).toHaveBeenCalledWith("light");
  });
});
