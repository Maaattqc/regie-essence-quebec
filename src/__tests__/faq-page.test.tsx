import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import FaqPage from "@/app/faq/page";

describe("FaqPage", () => {
  it("affiche le titre Questions fréquentes", () => {
    render(<FaqPage />);
    expect(screen.getByText("Questions fréquentes")).toBeInTheDocument();
  });

  it("affiche la question sur la fréquence de mise à jour", () => {
    render(<FaqPage />);
    expect(
      screen.getByText(/À quelle fréquence les prix/)
    ).toBeInTheDocument();
  });

  it("affiche la question sur la gratuité", () => {
    render(<FaqPage />);
    expect(
      screen.getByText(/La carte des prix d'essence est-elle gratuite/)
    ).toBeInTheDocument();
  });

  it("affiche la question sur les types de carburant", () => {
    render(<FaqPage />);
    expect(
      screen.getByText(/Quels types de carburant sont affichés/)
    ).toBeInTheDocument();
  });

  it("affiche la question sur le signalement", () => {
    render(<FaqPage />);
    expect(
      screen.getByText(/Puis-je signaler un prix incorrect/)
    ).toBeInTheDocument();
  });

  it("affiche la question sur la source des données", () => {
    render(<FaqPage />);
    expect(
      screen.getByText(/D'où proviennent les données de prix/)
    ).toBeInTheDocument();
  });

  it("affiche la question sur le mobile", () => {
    render(<FaqPage />);
    expect(
      screen.getByText(/La carte fonctionne-t-elle sur mobile/)
    ).toBeInTheDocument();
  });

  it("affiche la question sur l'historique", () => {
    render(<FaqPage />);
    expect(
      screen.getByText(/Puis-je voir l'historique des prix/)
    ).toBeInTheDocument();
  });

  it("contient le fil d'Ariane vers la carte", () => {
    render(<FaqPage />);
    expect(screen.getAllByText("Carte des prix").length).toBeGreaterThanOrEqual(1);
  });

  it("contient les liens du footer", () => {
    render(<FaqPage />);
    const links = screen.getAllByRole("link");
    const hrefs = links.map((l) => l.getAttribute("href"));
    expect(hrefs).toContain("/");
    expect(hrefs).toContain("/a-propos");
    expect(hrefs).toContain("/tech");
    expect(hrefs).toContain("/changelog");
  });

  it("mentionne la Régie de l'énergie du Québec", () => {
    render(<FaqPage />);
    expect(
      screen.getAllByText(/Régie de l'énergie du Québec/).length
    ).toBeGreaterThanOrEqual(1);
  });
});
