import { describe, it, expect } from "vitest";
import {
  distanceKm,
  normalize,
  extractCity,
  deduplicateCities,
  parsePrice,
  getPriceColor,
  stationId,
  PRICE_COLORS,
} from "@/lib/stations";

describe("stationId", () => {
  it("retourne un identifiant unique basé sur Name et Address", () => {
    const props = { Name: "Shell", Address: "123 rue Main, Montréal" } as Parameters<typeof stationId>[0];
    expect(stationId(props)).toBe("Shell|123 rue Main, Montréal");
  });
});

describe("parsePrice", () => {
  it("parse un prix avec le symbole ¢", () => {
    expect(parsePrice("154.9¢")).toBe(154.9);
  });

  it("parse un prix sans symbole", () => {
    expect(parsePrice("160.3")).toBe(160.3);
  });
});

describe("getPriceColor", () => {
  it("retourne jaune quand min === max", () => {
    expect(getPriceColor(100, 100, 100)).toBe(PRICE_COLORS[2]);
  });

  it("retourne vert pour le prix le plus bas", () => {
    expect(getPriceColor(100, 100, 200)).toBe(PRICE_COLORS[0]);
  });

  it("retourne rouge pour le prix le plus haut", () => {
    expect(getPriceColor(200, 100, 200)).toBe(PRICE_COLORS[4]);
  });

  it("retourne une couleur intermédiaire", () => {
    const color = getPriceColor(150, 100, 200);
    expect(PRICE_COLORS).toContain(color);
  });
});

describe("distanceKm", () => {
  it("retourne 0 pour le même point", () => {
    expect(distanceKm(45.5, -73.6, 45.5, -73.6)).toBe(0);
  });

  it("calcule une distance réaliste entre Montréal et Québec", () => {
    const d = distanceKm(45.5017, -73.5673, 46.8139, -71.2080);
    expect(d).toBeGreaterThan(200);
    expect(d).toBeLessThan(280);
  });

  it("calcule une courte distance", () => {
    const d = distanceKm(45.5, -73.6, 45.51, -73.61);
    expect(d).toBeGreaterThan(0.5);
    expect(d).toBeLessThan(2);
  });
});

describe("normalize", () => {
  it("enlève les accents", () => {
    expect(normalize("Montréal")).toBe("montreal");
  });

  it("met en minuscules", () => {
    expect(normalize("QUÉBEC")).toBe("quebec");
  });

  it("gère les caractères complexes", () => {
    expect(normalize("Sainte-Thérèse")).toBe("sainte-therese");
  });
});

describe("extractCity", () => {
  it("extrait la ville après la dernière virgule", () => {
    expect(extractCity("123 rue Main, Montréal")).toBe("Montréal");
  });

  it("retourne null sans virgule", () => {
    expect(extractCity("123 rue Main")).toBeNull();
  });

  it("normalise la casse", () => {
    expect(extractCity("123 rue, LAVAL")).toBe("Laval");
  });
});

describe("deduplicateCities", () => {
  it("retourne les villes triées alphabétiquement en français", () => {
    const cities = new Set(["Montréal", "Laval", "Québec"]);
    const result = deduplicateCities(cities);
    expect(result).toEqual(["Laval", "Montréal", "Québec"]);
  });

  it("supprime les doublons par préfixe normalisé", () => {
    const cities = new Set(["Sainte-Anne", "Sainte-Anne-de-Bellevue"]);
    const result = deduplicateCities(cities);
    expect(result).toEqual(["Sainte-Anne"]);
  });

  it("garde les villes différentes même si proches", () => {
    const cities = new Set(["Laval", "Lavaltrie"]);
    const result = deduplicateCities(cities);
    expect(result.length).toBe(2);
    expect(result).toContain("Laval");
    expect(result).toContain("Lavaltrie");
  });
});
