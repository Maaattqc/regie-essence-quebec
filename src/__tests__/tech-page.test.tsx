import { describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";

const mockSetTheme = vi.fn();

vi.mock("next-themes", () => ({
  useTheme: () => ({
    resolvedTheme: "light",
    setTheme: mockSetTheme,
  }),
}));

vi.mock("framer-motion", () => ({
  motion: {
    section: ({ children, ...props }: React.PropsWithChildren<Record<string, unknown>>) => {
      const { initial, animate, exit, transition, whileInView, viewport, variants, ...rest } = props as Record<string, unknown>;
      void initial; void animate; void exit; void transition; void whileInView; void viewport; void variants;
      return <section {...(rest as React.HTMLAttributes<HTMLElement>)}>{children}</section>;
    },
    div: ({ children, ...props }: React.PropsWithChildren<Record<string, unknown>>) => {
      const { initial, animate, exit, transition, whileInView, viewport, variants, ...rest } = props as Record<string, unknown>;
      void initial; void animate; void exit; void transition; void whileInView; void viewport; void variants;
      return <div {...(rest as React.HTMLAttributes<HTMLDivElement>)}>{children}</div>;
    },
    h1: ({ children, ...props }: React.PropsWithChildren<Record<string, unknown>>) => {
      const { initial, animate, exit, transition, variants, ...rest } = props as Record<string, unknown>;
      void initial; void animate; void exit; void transition; void variants;
      return <h1 {...(rest as React.HTMLAttributes<HTMLHeadingElement>)}>{children}</h1>;
    },
    p: ({ children, ...props }: React.PropsWithChildren<Record<string, unknown>>) => {
      const { initial, animate, exit, transition, variants, ...rest } = props as Record<string, unknown>;
      void initial; void animate; void exit; void transition; void variants;
      return <p {...(rest as React.HTMLAttributes<HTMLParagraphElement>)}>{children}</p>;
    },
    span: ({ children, ...props }: React.PropsWithChildren<Record<string, unknown>>) => {
      const { initial, animate, exit, transition, variants, ...rest } = props as Record<string, unknown>;
      void initial; void animate; void exit; void transition; void variants;
      return <span {...(rest as React.HTMLAttributes<HTMLSpanElement>)}>{children}</span>;
    },
  },
  AnimatePresence: ({ children }: React.PropsWithChildren) => children,
}));

vi.mock("@/components/ScrollToTop", () => ({
  default: () => <div data-testid="scroll-to-top" />,
}));

import TechPage from "@/app/tech/page";

describe("TechPage", () => {
  it("affiche le header Essence Québec / À propos", () => {
    render(<TechPage />);
    expect(screen.getByText("Essence Québec")).toBeInTheDocument();
    expect(screen.getByText("À propos")).toBeInTheDocument();
  });

  it("affiche le titre principal en mode résumé", () => {
    render(<TechPage />);
    expect(
      screen.getByText(/Comparez les prix d'essence/)
    ).toBeInTheDocument();
  });

  it("affiche les buzzwords en mode résumé", () => {
    render(<TechPage />);
    expect(screen.getAllByText("Rapide").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("Sécurisé").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("Temps réel").length).toBeGreaterThanOrEqual(1);
  });

  it("affiche les fonctionnalités", () => {
    render(<TechPage />);
    expect(screen.getByText("Cartographie interactive temps réel")).toBeInTheDocument();
    expect(screen.getByText("Recherche intelligente de la station la moins chère")).toBeInTheDocument();
    expect(screen.getByText("Historique des prix sur 30 jours")).toBeInTheDocument();
  });

  it("affiche la source de données REQ", () => {
    render(<TechPage />);
    expect(
      screen.getByText(/Données officielles — Régie de l'énergie du Québec/)
    ).toBeInTheDocument();
  });

  it("affiche le contact", () => {
    render(<TechPage />);
    expect(screen.getByText("Mathieu Fournier")).toBeInTheDocument();
    expect(screen.getByText("mathieufournierqc@outlook.com")).toBeInTheDocument();
  });

  it("switch vers le mode détaillé quand on clique sur Fiche technique", () => {
    render(<TechPage />);
    const ficheBtn = screen.getByText("Fiche technique");
    fireEvent.click(ficheBtn);

    // En mode détaillé, on voit les sections techniques
    expect(screen.getByText("Architecture technique")).toBeInTheDocument();
    expect(screen.getByText("Sécurité applicative")).toBeInTheDocument();
    expect(screen.getByText("Tests et assurance qualité")).toBeInTheDocument();
  });

  it("affiche les métriques en mode détaillé", () => {
    render(<TechPage />);
    fireEvent.click(screen.getByText("Fiche technique"));

    expect(screen.getByText("2 500+")).toBeInTheDocument();
    expect(screen.getByText("17ms")).toBeInTheDocument();
    expect(screen.getByText("99.9%")).toBeInTheDocument();
    expect(screen.getByText("621")).toBeInTheDocument();
  });

  it("affiche le stack technique en mode détaillé", () => {
    render(<TechPage />);
    fireEvent.click(screen.getByText("Fiche technique"));

    expect(screen.getByText("Interface utilisateur")).toBeInTheDocument();
    expect(screen.getByText("Backend & API")).toBeInTheDocument();
    expect(screen.getByText("Base de données & Auth")).toBeInTheDocument();
    expect(screen.getByText("Infrastructure & DevOps")).toBeInTheDocument();
  });

  it("affiche les mesures de sécurité en mode détaillé", () => {
    render(<TechPage />);
    fireEvent.click(screen.getByText("Fiche technique"));

    expect(screen.getByText("Content Security Policy (CSP)")).toBeInTheDocument();
    expect(screen.getByText("Auth sans mot de passe (OTP)")).toBeInTheDocument();
    expect(screen.getByText("Rate limiting distribué (Upstash Redis)")).toBeInTheDocument();
  });

  it("retourne au mode résumé quand on clique sur Résumé", () => {
    render(<TechPage />);
    fireEvent.click(screen.getByText("Fiche technique"));
    expect(screen.getByText("Architecture technique")).toBeInTheDocument();

    fireEvent.click(screen.getByText("Résumé"));
    expect(screen.queryByText("Architecture technique")).not.toBeInTheDocument();
  });

  it("monte le composant ScrollToTop", () => {
    render(<TechPage />);
    expect(screen.getByTestId("scroll-to-top")).toBeInTheDocument();
  });

  it("affiche le toggle theme avec aria-label", () => {
    render(<TechPage />);
    expect(screen.getByLabelText("Mode sombre")).toBeInTheDocument();
  });

  it("appelle setTheme quand on clique sur le bouton theme", () => {
    mockSetTheme.mockClear();
    render(<TechPage />);

    const themeButton = screen.getByLabelText("Mode sombre");
    fireEvent.click(themeButton);

    expect(mockSetTheme).toHaveBeenCalledWith("dark");
  });
});
