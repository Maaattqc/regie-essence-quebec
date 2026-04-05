import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";

vi.mock("@/components/MapClient", () => ({
  default: () => <div data-testid="map-client">Map</div>,
}));

import Home from "@/app/page";

describe("Home page", () => {
  it("rend le MapClient", () => {
    render(<Home />);
    expect(screen.getByTestId("map-client")).toBeInTheDocument();
  });

  it("rend le contenu SEO sr-only", () => {
    render(<Home />);
    expect(screen.getByText("Prix de l'essence au Québec — Carte interactive en temps réel")).toBeInTheDocument();
  });

  it("contient l'attribution REQ visible", () => {
    render(<Home />);
    expect(screen.getByText(/Données : Régie de l'énergie du Québec/)).toBeInTheDocument();
  });

  it("contient les liens SEO", () => {
    render(<Home />);
    const links = screen.getAllByRole("link");
    const hrefs = links.map((l) => l.getAttribute("href"));
    expect(hrefs).toContain("/faq");
    expect(hrefs).toContain("/a-propos");
    expect(hrefs).toContain("/confidentialite");
    expect(hrefs).toContain("/conditions-utilisation");
    expect(hrefs).toContain("/accessibilite");
    expect(hrefs).toContain("/tech");
  });

  it("contient la section régions", () => {
    render(<Home />);
    expect(screen.getByText(/Régions couvertes/)).toBeInTheDocument();
  });
});
