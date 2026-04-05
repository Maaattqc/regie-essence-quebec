import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import AProposPage from "@/app/a-propos/page";

describe("AProposPage", () => {
  it("affiche le titre À propos d'Essence Québec", () => {
    render(<AProposPage />);
    expect(
      screen.getByText("À propos d'Essence Québec")
    ).toBeInTheDocument();
  });

  it("affiche la section Le projet", () => {
    render(<AProposPage />);
    expect(screen.getByText("Le projet")).toBeInTheDocument();
  });

  it("affiche la section Source des données", () => {
    render(<AProposPage />);
    expect(screen.getByText("Source des données")).toBeInTheDocument();
  });

  it("affiche la section Fonctionnement", () => {
    render(<AProposPage />);
    expect(screen.getByText("Fonctionnement")).toBeInTheDocument();
  });

  it("affiche la section Contribution", () => {
    render(<AProposPage />);
    expect(screen.getByText("Contribution")).toBeInTheDocument();
  });

  it("mentionne la Régie de l'énergie du Québec", () => {
    render(<AProposPage />);
    expect(
      screen.getAllByText(/Régie de l'énergie/).length
    ).toBeGreaterThanOrEqual(1);
  });

  it("contient le fil d'Ariane", () => {
    render(<AProposPage />);
    const links = screen.getAllByRole("link");
    const hrefs = links.map((l) => l.getAttribute("href"));
    expect(hrefs).toContain("/");
  });

  it("contient les liens du footer", () => {
    render(<AProposPage />);
    const links = screen.getAllByRole("link");
    const hrefs = links.map((l) => l.getAttribute("href"));
    expect(hrefs).toContain("/faq");
    expect(hrefs).toContain("/changelog");
    expect(hrefs).toContain("/tech");
    expect(hrefs).toContain("/login");
  });

  it("mentionne les 30 derniers jours pour l'historique", () => {
    render(<AProposPage />);
    expect(
      screen.getByText(/30 derniers jours/)
    ).toBeInTheDocument();
  });
});
