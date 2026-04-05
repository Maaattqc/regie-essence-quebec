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

import ReportModal from "@/components/ReportModal";

describe("ReportModal", () => {
  const defaultProps = {
    stationName: "Shell Montréal",
    address: "123 Rue Principale",
    onClose: mocks.onClose,
  };

  beforeEach(() => {
    mocks.onClose.mockReset();
    mocks.fetch.mockReset();
    globalThis.fetch = mocks.fetch;
  });

  it("affiche les champs du formulaire", () => {
    render(<ReportModal {...defaultProps} />);

    expect(screen.getByPlaceholderText("Prénom")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Nom")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Courriel")).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText("Décrivez l'inexactitude...")
    ).toBeInTheDocument();
  });

  it("affiche le nom de la station et l'adresse", () => {
    render(<ReportModal {...defaultProps} />);

    expect(screen.getByText("Shell Montréal")).toBeInTheDocument();
    expect(
      screen.getByText((_, el) => el?.textContent === "Shell Montréal — 123 Rue Principale")
    ).toBeInTheDocument();
  });

  it("appelle onClose quand on appuie sur Escape", () => {
    render(<ReportModal {...defaultProps} />);

    fireEvent.keyDown(document, { key: "Escape" });

    expect(mocks.onClose).toHaveBeenCalledTimes(1);
  });

  it("affiche les erreurs de validation quand on soumet un formulaire vide", async () => {
    render(<ReportModal {...defaultProps} />);

    fireEvent.click(
      screen.getByRole("button", { name: /Envoyer le signalement/i })
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
        screen.getByText("Le message doit contenir au moins 10 caractères")
      ).toBeInTheDocument();
    });

    expect(mocks.fetch).not.toHaveBeenCalled();
  });

  it("affiche le message de succès après un envoi réussi", async () => {
    mocks.fetch.mockResolvedValueOnce({ ok: true });

    render(<ReportModal {...defaultProps} />);

    fireEvent.change(screen.getByPlaceholderText("Prénom"), {
      target: { value: "Jean" },
    });
    fireEvent.change(screen.getByPlaceholderText("Nom"), {
      target: { value: "Tremblay" },
    });
    fireEvent.change(screen.getByPlaceholderText("Courriel"), {
      target: { value: "jean@example.com" },
    });
    fireEvent.change(
      screen.getByPlaceholderText("Décrivez l'inexactitude..."),
      { target: { value: "Le prix affiché est incorrect depuis 2 jours" } }
    );

    fireEvent.click(
      screen.getByRole("button", { name: /Envoyer le signalement/i })
    );

    await waitFor(() => {
      expect(
        screen.getByText("Merci pour votre signalement !")
      ).toBeInTheDocument();
    });
  });

  it("désactive le bouton pendant l'envoi", async () => {
    let resolveRequest!: (value: { ok: boolean }) => void;
    mocks.fetch.mockReturnValueOnce(
      new Promise((resolve) => {
        resolveRequest = resolve;
      })
    );

    render(<ReportModal {...defaultProps} />);

    fireEvent.change(screen.getByPlaceholderText("Prénom"), {
      target: { value: "Jean" },
    });
    fireEvent.change(screen.getByPlaceholderText("Nom"), {
      target: { value: "Tremblay" },
    });
    fireEvent.change(screen.getByPlaceholderText("Courriel"), {
      target: { value: "jean@example.com" },
    });
    fireEvent.change(
      screen.getByPlaceholderText("Décrivez l'inexactitude..."),
      { target: { value: "Le prix affiché est incorrect depuis 2 jours" } }
    );

    fireEvent.click(
      screen.getByRole("button", { name: /Envoyer le signalement/i })
    );

    await waitFor(() => {
      const btn = screen.getByRole("button", { name: /Envoi\.\.\./i });
      expect(btn).toBeDisabled();
    });

    resolveRequest({ ok: true });

    await waitFor(() => {
      expect(
        screen.getByText("Merci pour votre signalement !")
      ).toBeInTheDocument();
    });
  });
});
