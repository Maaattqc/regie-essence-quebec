import { describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";

const mockPush = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

vi.mock("@/components/ui/dropdown-menu", () => ({
  DropdownMenu: ({ children }: React.PropsWithChildren) => (
    <div data-testid="dropdown-menu">{children}</div>
  ),
  DropdownMenuTrigger: ({ children }: React.PropsWithChildren) => (
    <div data-testid="dropdown-trigger">{children}</div>
  ),
  DropdownMenuContent: ({ children }: React.PropsWithChildren) => (
    <div data-testid="dropdown-content">{children}</div>
  ),
  DropdownMenuGroup: ({ children }: React.PropsWithChildren) => (
    <div>{children}</div>
  ),
  DropdownMenuLabel: ({ children }: React.PropsWithChildren) => (
    <div data-testid="dropdown-label">{children}</div>
  ),
  DropdownMenuItem: ({
    children,
    onClick,
  }: React.PropsWithChildren<{ onClick?: () => void; variant?: string }>) => (
    <div data-testid="dropdown-item" onClick={onClick}>
      {children}
    </div>
  ),
  DropdownMenuSeparator: () => <hr />,
}));

import UserDropdown from "@/components/UserDropdown";

describe("UserDropdown", () => {
  const onLogout = vi.fn();

  it("affiche l'initiale de l'utilisateur", () => {
    render(<UserDropdown email="marie@example.com" onLogout={onLogout} />);
    expect(screen.getByText("M")).toBeInTheDocument();
  });

  it("affiche le nom d'utilisateur (partie avant @)", () => {
    render(<UserDropdown email="marie@example.com" onLogout={onLogout} />);
    expect(screen.getByText("marie")).toBeInTheDocument();
  });

  it("affiche l'email complet dans le label du menu", () => {
    render(<UserDropdown email="marie@example.com" onLogout={onLogout} />);
    expect(screen.getByText("marie@example.com")).toBeInTheDocument();
  });

  it("affiche l'item Infos techniques", () => {
    render(<UserDropdown email="marie@example.com" onLogout={onLogout} />);
    expect(screen.getByText("Infos techniques")).toBeInTheDocument();
  });

  it("affiche l'item Déconnexion", () => {
    render(<UserDropdown email="marie@example.com" onLogout={onLogout} />);
    expect(screen.getByText("Déconnexion")).toBeInTheDocument();
  });

  it("appelle onLogout quand on clique sur Déconnexion", () => {
    render(<UserDropdown email="marie@example.com" onLogout={onLogout} />);
    const items = screen.getAllByTestId("dropdown-item");
    const logoutItem = items.find((item) =>
      item.textContent?.includes("Déconnexion")
    );
    fireEvent.click(logoutItem!);
    expect(onLogout).toHaveBeenCalled();
  });

  it("gère un email sans partie locale (fallback ?)", () => {
    render(<UserDropdown email="@broken.com" onLogout={onLogout} />);
    expect(screen.getByText("?")).toBeInTheDocument();
  });

  it("gère un email normal avec chiffres", () => {
    render(<UserDropdown email="user42@test.com" onLogout={onLogout} />);
    expect(screen.getByText("U")).toBeInTheDocument();
    expect(screen.getByText("user42")).toBeInTheDocument();
  });

  it("navigue vers /tech quand on clique sur Infos techniques", () => {
    render(<UserDropdown email="marie@example.com" onLogout={onLogout} />);
    const items = screen.getAllByTestId("dropdown-item");
    const techItem = items.find((item) =>
      item.textContent?.includes("Infos techniques")
    );
    fireEvent.click(techItem!);
    expect(mockPush).toHaveBeenCalledWith("/tech");
  });
});
