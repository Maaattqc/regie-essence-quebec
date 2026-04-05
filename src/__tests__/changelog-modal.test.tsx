import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";

const mocks = vi.hoisted(() => ({
  fetch: vi.fn(),
  onClose: vi.fn(),
}));

vi.mock("@/lib/auth", () => ({
  createBrowserClient: () => ({
    auth: { getSession: vi.fn().mockResolvedValue({ data: { session: null } }) },
  }),
}));

vi.mock("@/hooks/useFocusTrap", () => ({
  useFocusTrap: () => ({ current: null }),
}));

import ChangelogModal from "@/components/ChangelogModal";

describe("ChangelogModal", () => {
  beforeEach(() => {
    mocks.onClose.mockReset();
    mocks.fetch.mockReset();
    globalThis.fetch = mocks.fetch;
  });

  it("affiche le spinner de chargement", () => {
    mocks.fetch.mockReturnValueOnce(new Promise(() => {}));

    render(<ChangelogModal onClose={mocks.onClose} />);

    expect(screen.getByText("Changelog")).toBeInTheDocument();
    // Le Spinner rend un div.animate-spin
    const spinner = document.querySelector(".animate-spin");
    expect(spinner).toBeInTheDocument();
  });

  it("affiche la liste des commits après le chargement", async () => {
    const commits = [
      {
        sha: "abc1234567890",
        date: "2025-12-01T10:00:00Z",
        message: "fix: corriger le filtre de prix",
        author: "Jean",
      },
      {
        sha: "def4567890123",
        date: "2025-11-30T14:30:00Z",
        message: "feat: ajouter la carte interactive",
        author: "Marie",
      },
    ];

    mocks.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => commits,
    });

    render(<ChangelogModal onClose={mocks.onClose} />);

    await waitFor(() => {
      expect(
        screen.getByText("fix: corriger le filtre de prix")
      ).toBeInTheDocument();
      expect(
        screen.getByText("feat: ajouter la carte interactive")
      ).toBeInTheDocument();
    });

    expect(screen.getByText("abc1234")).toBeInTheDocument();
    expect(screen.getByText("def4567")).toBeInTheDocument();
  });

  it("affiche l'état vide en cas d'erreur", async () => {
    mocks.fetch.mockRejectedValueOnce(new Error("Network error"));

    render(<ChangelogModal onClose={mocks.onClose} />);

    await waitFor(() => {
      expect(
        screen.getByText("Aucun commit trouvé.")
      ).toBeInTheDocument();
    });
  });

  it("appelle onClose quand on clique sur le bouton fermer", () => {
    mocks.fetch.mockReturnValueOnce(new Promise(() => {}));

    render(<ChangelogModal onClose={mocks.onClose} />);

    const closeButton = screen.getByRole("button", { name: "Fermer" });
    closeButton.click();

    expect(mocks.onClose).toHaveBeenCalledTimes(1);
  });
});
