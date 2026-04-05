import { describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";

const mockSetTheme = vi.fn();

vi.mock("next-themes", () => ({
  useTheme: () => ({
    resolvedTheme: "light",
    setTheme: mockSetTheme,
  }),
}));

import ConfidentialitePage from "@/app/confidentialite/page";

describe("ConfidentialitePage", () => {
  it("affiche le titre Politique de confidentialité", () => {
    render(<ConfidentialitePage />);
    expect(
      screen.getAllByText("Politique de confidentialité").length
    ).toBeGreaterThanOrEqual(1);
  });

  it("mentionne la conformité Loi 25", () => {
    render(<ConfidentialitePage />);
    expect(
      screen.getByText(/Conforme à la Loi 25/)
    ).toBeInTheDocument();
  });

  it("affiche la date de mise à jour", () => {
    render(<ConfidentialitePage />);
    expect(screen.getByText(/2 avril 2026/)).toBeInTheDocument();
  });

  it("affiche le responsable du traitement", () => {
    render(<ConfidentialitePage />);
    expect(screen.getByText("Responsable du traitement")).toBeInTheDocument();
    expect(screen.getByText("Mathieu Fournier")).toBeInTheDocument();
  });

  it("affiche la section Données collectées", () => {
    render(<ConfidentialitePage />);
    expect(screen.getByText("Données collectées")).toBeInTheDocument();
  });

  it("liste les types de données collectées", () => {
    render(<ConfidentialitePage />);
    expect(screen.getByText("Session anonyme (UUID)")).toBeInTheDocument();
    expect(screen.getByText("Adresse courriel")).toBeInTheDocument();
    expect(screen.getByText("Commentaires et avis publics")).toBeInTheDocument();
    expect(screen.getByText("Signalements de prix")).toBeInTheDocument();
    expect(screen.getByText("Adresse IP (temporaire)")).toBeInTheDocument();
  });

  it("affiche les périodes de conservation", () => {
    render(<ConfidentialitePage />);
    expect(screen.getByText("90 jours")).toBeInTheDocument();
    expect(screen.getByText("12 mois")).toBeInTheDocument();
  });

  it("liste les sous-traitants", () => {
    render(<ConfidentialitePage />);
    expect(screen.getByText("Vercel Inc.")).toBeInTheDocument();
    expect(screen.getByText("Supabase Inc.")).toBeInTheDocument();
    expect(screen.getByText("Resend Inc.")).toBeInTheDocument();
  });

  it("affiche les droits des utilisateurs", () => {
    render(<ConfidentialitePage />);
    expect(screen.getByText("Droit d'accès")).toBeInTheDocument();
    expect(screen.getByText("Droit de rectification")).toBeInTheDocument();
    expect(screen.getByText("Droit à l'effacement")).toBeInTheDocument();
    expect(screen.getByText("Droit à la portabilité")).toBeInTheDocument();
    expect(screen.getByText("Droit de retrait du consentement")).toBeInTheDocument();
  });

  it("affiche la section Mesures de sécurité", () => {
    render(<ConfidentialitePage />);
    expect(screen.getByText("Mesures de sécurité")).toBeInTheDocument();
  });

  it("mentionne le chiffrement TLS et RLS", () => {
    render(<ConfidentialitePage />);
    expect(screen.getByText(/chiffrement TLS/)).toBeInTheDocument();
  });

  it("affiche l'email de contact", () => {
    render(<ConfidentialitePage />);
    const emailLinks = screen.getAllByText("mathieufournierqc@outlook.com");
    expect(emailLinks.length).toBeGreaterThanOrEqual(1);
  });

  it("mentionne le délai de réponse de 30 jours", () => {
    render(<ConfidentialitePage />);
    expect(screen.getByText("30 jours")).toBeInTheDocument();
  });

  it("mentionne qu'aucun cookie publicitaire n'est utilisé", () => {
    render(<ConfidentialitePage />);
    expect(
      screen.getByText(/Aucun cookie publicitaire/)
    ).toBeInTheDocument();
  });

  it("appelle setTheme quand on clique sur le bouton theme", () => {
    mockSetTheme.mockClear();
    render(<ConfidentialitePage />);

    const themeButton = screen.getByLabelText("Mode sombre");
    fireEvent.click(themeButton);

    expect(mockSetTheme).toHaveBeenCalledWith("dark");
  });
});
