import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import AccessibilitePage from "@/app/accessibilite/page";

describe("AccessibilitePage", () => {
  it("affiche le titre", () => {
    render(<AccessibilitePage />);
    expect(screen.getByText("Déclaration d'accessibilité")).toBeInTheDocument();
  });

  it("mentionne SGQRI 008", () => {
    render(<AccessibilitePage />);
    expect(screen.getAllByText(/SGQRI 008/).length).toBeGreaterThanOrEqual(1);
  });

  it("mentionne WCAG 2.1 AA", () => {
    render(<AccessibilitePage />);
    expect(screen.getAllByText(/WCAG 2.1.*AA/).length).toBeGreaterThanOrEqual(1);
  });

  it("liste les mesures d'accessibilité", () => {
    render(<AccessibilitePage />);
    expect(screen.getByText(/Lien d'évitement/)).toBeInTheDocument();
    expect(screen.getByText(/Navigation au clavier/)).toBeInTheDocument();
    expect(screen.getByText(/Piège de focus/)).toBeInTheDocument();
    expect(screen.getByText(/Attributs ARIA/)).toBeInTheDocument();
  });

  it("mentionne les limitations connues", () => {
    render(<AccessibilitePage />);
    expect(screen.getByText("Limitations connues")).toBeInTheDocument();
    expect(screen.getByText(/Carte interactive/)).toBeInTheDocument();
  });

  it("affiche le contact", () => {
    render(<AccessibilitePage />);
    expect(screen.getByText("mathieufournierqc@outlook.com")).toBeInTheDocument();
  });

  it("contient les liens du footer", () => {
    render(<AccessibilitePage />);
    const links = screen.getAllByRole("link");
    const hrefs = links.map((l) => l.getAttribute("href"));
    expect(hrefs).toContain("/confidentialite");
    expect(hrefs).toContain("/conditions-utilisation");
  });
});
