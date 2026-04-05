import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import ConditionsPage from "@/app/conditions-utilisation/page";

describe("ConditionsPage", () => {
  it("affiche le titre", () => {
    render(<ConditionsPage />);
    expect(screen.getAllByText("Conditions d'utilisation").length).toBeGreaterThanOrEqual(1);
  });

  it("affiche les 12 sections", () => {
    render(<ConditionsPage />);
    expect(screen.getByText("1. Acceptation des conditions")).toBeInTheDocument();
    expect(screen.getByText("2. Description du service")).toBeInTheDocument();
    expect(screen.getByText("3. Exactitude des données")).toBeInTheDocument();
    expect(screen.getByText("4. Utilisation acceptable")).toBeInTheDocument();
    expect(screen.getByText("5. Contenu utilisateur")).toBeInTheDocument();
    expect(screen.getByText("6. Propriété intellectuelle")).toBeInTheDocument();
    expect(screen.getByText("7. Limitation de responsabilité")).toBeInTheDocument();
    expect(screen.getByText("8. Protection des renseignements personnels")).toBeInTheDocument();
    expect(screen.getByText("9. Disponibilité du service")).toBeInTheDocument();
    expect(screen.getByText("10. Modification des conditions")).toBeInTheDocument();
    expect(screen.getByText("11. Droit applicable")).toBeInTheDocument();
    expect(screen.getByText("12. Contact")).toBeInTheDocument();
  });

  it("mentionne la REQ", () => {
    render(<ConditionsPage />);
    expect(screen.getAllByText(/Régie de l'énergie du Québec/).length).toBeGreaterThanOrEqual(1);
  });

  it("contient le lien confidentialité", () => {
    render(<ConditionsPage />);
    const links = screen.getAllByRole("link");
    const hrefs = links.map((l) => l.getAttribute("href"));
    expect(hrefs).toContain("/confidentialite");
  });

  it("affiche la date de mise à jour", () => {
    render(<ConditionsPage />);
    expect(screen.getByText(/4 avril 2026/)).toBeInTheDocument();
  });

  it("mentionne le droit du Québec", () => {
    render(<ConditionsPage />);
    expect(screen.getByText(/lois du Québec/)).toBeInTheDocument();
  });
});
