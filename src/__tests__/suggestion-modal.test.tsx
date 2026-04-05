import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";

const mocks = vi.hoisted(() => ({
  fetch: vi.fn(),
  onClose: vi.fn(),
}));

vi.mock("framer-motion", () => ({
  motion: {
    div: ({
      children,
      ...props
    }: React.PropsWithChildren<Record<string, unknown>>) => {
      const { initial, animate, exit, transition, ...rest } =
        props as Record<string, unknown>;
      void initial;
      void animate;
      void exit;
      void transition;
      return (
        <div {...(rest as React.HTMLAttributes<HTMLDivElement>)}>{children}</div>
      );
    },
  },
  AnimatePresence: ({ children }: React.PropsWithChildren) => children,
}));

vi.mock("@/lib/auth", () => ({
  createBrowserClient: () => ({
    auth: { getSession: vi.fn().mockResolvedValue({ data: { session: null } }) },
  }),
}));

vi.mock("@/hooks/useFocusTrap", () => ({
  useFocusTrap: () => ({ current: null }),
}));

import SuggestionModal from "@/components/SuggestionModal";

describe("SuggestionModal", () => {
  beforeEach(() => {
    mocks.onClose.mockReset();
    mocks.fetch.mockReset();
    globalThis.fetch = mocks.fetch;
  });

  it("affiche le formulaire avec tous les champs", () => {
    render(<SuggestionModal onClose={mocks.onClose} />);

    expect(screen.getByText("Suggestion")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Prénom")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Nom")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Courriel")).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText("Décrivez votre suggestion...")
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Envoyer la suggestion/i })
    ).toBeInTheDocument();
  });

  it("appelle onClose quand on appuie sur Escape", () => {
    render(<SuggestionModal onClose={mocks.onClose} />);

    fireEvent.keyDown(document, { key: "Escape" });

    expect(mocks.onClose).toHaveBeenCalledTimes(1);
  });

  it("affiche les erreurs de validation quand les champs sont vides", async () => {
    render(<SuggestionModal onClose={mocks.onClose} />);

    fireEvent.click(
      screen.getByRole("button", { name: /Envoyer la suggestion/i })
    );

    await waitFor(() => {
      expect(
        screen.getByText("Le prénom doit contenir au moins 2 caractères")
      ).toBeInTheDocument();
      expect(
        screen.getByText("Le nom doit contenir au moins 2 caractères")
      ).toBeInTheDocument();
      expect(
        screen.getByText("L'adresse courriel est invalide")
      ).toBeInTheDocument();
      expect(
        screen.getByText("La suggestion doit contenir au moins 10 caractères")
      ).toBeInTheDocument();
    });

    expect(mocks.fetch).not.toHaveBeenCalled();
  });

  it("affiche le message de succès après un envoi réussi", async () => {
    mocks.fetch.mockResolvedValueOnce({ ok: true });

    render(<SuggestionModal onClose={mocks.onClose} />);

    fireEvent.change(screen.getByPlaceholderText("Prénom"), {
      target: { value: "Marie" },
    });
    fireEvent.change(screen.getByPlaceholderText("Nom"), {
      target: { value: "Gagnon" },
    });
    fireEvent.change(screen.getByPlaceholderText("Courriel"), {
      target: { value: "marie@example.com" },
    });
    fireEvent.change(
      screen.getByPlaceholderText("Décrivez votre suggestion..."),
      { target: { value: "Ajouter un filtre par marque de station" } }
    );

    fireEvent.click(
      screen.getByRole("button", { name: /Envoyer la suggestion/i })
    );

    await waitFor(() => {
      expect(
        screen.getByText("Merci pour votre suggestion !")
      ).toBeInTheDocument();
    });
  });
});
