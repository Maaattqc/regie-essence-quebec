import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  distanceKm,
  normalize,
  extractCity,
  deduplicateCities,
  parsePrice,
  getPriceColor,
  stationId,
  effectivePrice,
  roadDistances,
  roadRoute,
  reverseGeocode,
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

describe("effectivePrice", () => {
  it("retourne le prix brut quand la distance est 0", () => {
    expect(effectivePrice(150, 0, 9, 40)).toBe(150);
  });

  it("augmente le prix avec la distance", () => {
    const result = effectivePrice(150, 10, 9, 40);
    expect(result).toBeGreaterThan(150);
    expect(result).toBeLessThan(160);
  });

  it("augmente plus avec une consommation élevée", () => {
    const lowConso = effectivePrice(150, 10, 6, 40);
    const highConso = effectivePrice(150, 10, 15, 40);
    expect(highConso).toBeGreaterThan(lowConso);
  });

  it("augmente moins avec un gros réservoir", () => {
    const smallTank = effectivePrice(150, 10, 9, 30);
    const bigTank = effectivePrice(150, 10, 9, 80);
    expect(smallTank).toBeGreaterThan(bigTank);
  });
});

describe("roadDistances", () => {
  beforeEach(() => { vi.restoreAllMocks(); });

  it("retourne un tableau vide pour aucune destination", async () => {
    const result = await roadDistances([45.5, -73.5], []);
    expect(result).toEqual([]);
  });

  it("retourne le fallback quand fetch échoue", async () => {
    vi.spyOn(globalThis, "fetch").mockRejectedValueOnce(new Error("Network error"));
    const result = await roadDistances([45.5, -73.5], [[45.6, -73.6]]);
    expect(result).toEqual([{ distKm: null, durationMin: null }]);
  });

  it("retourne le fallback quand la réponse HTTP est en erreur", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(new Response("error", { status: 500 }));
    const result = await roadDistances([45.5, -73.5], [[45.6, -73.6]]);
    expect(result).toEqual([{ distKm: null, durationMin: null }]);
  });

  it("parse les distances et durées depuis la réponse Mapbox", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      new Response(JSON.stringify({ distances: [[0, 5000]], durations: [[0, 600]] }))
    );
    const result = await roadDistances([45.5, -73.5], [[45.6, -73.6]]);
    expect(result).toEqual([{ distKm: 5, durationMin: 10 }]);
  });
});

describe("roadRoute", () => {
  beforeEach(() => { vi.restoreAllMocks(); });

  it("retourne null quand fetch échoue", async () => {
    vi.spyOn(globalThis, "fetch").mockRejectedValueOnce(new Error("Network error"));
    const result = await roadRoute([45.5, -73.5], [45.6, -73.6]);
    expect(result).toBeNull();
  });

  it("retourne null quand aucune route n'est trouvée", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      new Response(JSON.stringify({ routes: [] }))
    );
    const result = await roadRoute([45.5, -73.5], [45.6, -73.6]);
    expect(result).toBeNull();
  });

  it("parse le tracé routier depuis la réponse Mapbox", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      new Response(JSON.stringify({
        routes: [{ geometry: { coordinates: [[-73.5, 45.5], [-73.6, 45.6]] }, distance: 10000, duration: 600 }],
      }))
    );
    const result = await roadRoute([45.5, -73.5], [45.6, -73.6]);
    expect(result).toEqual({ path: [[45.5, -73.5], [45.6, -73.6]], distKm: 10, durationMin: 10 });
  });
});

describe("reverseGeocode", () => {
  beforeEach(() => { vi.restoreAllMocks(); });

  it("retourne la ville depuis Nominatim", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      new Response(JSON.stringify({ address: { city: "Montréal" } }))
    );
    const result = await reverseGeocode(45.5, -73.5);
    expect(result).toBe("Montréal");
  });

  it("retourne null quand fetch échoue", async () => {
    vi.spyOn(globalThis, "fetch").mockRejectedValueOnce(new Error("Network"));
    const result = await reverseGeocode(45.5, -73.5);
    expect(result).toBeNull();
  });

  it("retourne null quand la réponse HTTP est en erreur", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      new Response(null, { status: 500 })
    );
    const result = await reverseGeocode(45.5, -73.5);
    expect(result).toBeNull();
  });

  it("retourne town quand city est absent", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      new Response(JSON.stringify({ address: { town: "Gaspé" } }))
    );
    const result = await reverseGeocode(48.8, -64.5);
    expect(result).toBe("Gaspé");
  });

  it("retourne village quand city et town sont absents", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      new Response(JSON.stringify({ address: { village: "Piopolis" } }))
    );
    const result = await reverseGeocode(45.5, -71.5);
    expect(result).toBe("Piopolis");
  });

  it("retourne municipality quand city, town et village sont absents", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      new Response(JSON.stringify({ address: { municipality: "Eeyou Istchee" } }))
    );
    const result = await reverseGeocode(51.0, -76.0);
    expect(result).toBe("Eeyou Istchee");
  });

  it("retourne null quand aucun champ d'adresse n'est présent", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      new Response(JSON.stringify({ address: {} }))
    );
    const result = await reverseGeocode(45.5, -73.5);
    expect(result).toBeNull();
  });
});

describe("roadDistances edge cases", () => {
  beforeEach(() => { vi.restoreAllMocks(); });

  it("retourne le fallback quand distRow est absent", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      new Response(JSON.stringify({ distances: null, durations: null }))
    );
    const result = await roadDistances([45.5, -73.5], [[45.6, -73.6]]);
    expect(result).toEqual([{ distKm: null, durationMin: null }]);
  });

  it("retourne null pour les distances et durées négatives ou nulles", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      new Response(JSON.stringify({ distances: [[0, 0]], durations: [[0, -1]] }))
    );
    const result = await roadDistances([45.5, -73.5], [[45.6, -73.6]]);
    expect(result).toEqual([{ distKm: null, durationMin: null }]);
  });
});

describe("roadRoute edge cases", () => {
  beforeEach(() => { vi.restoreAllMocks(); });

  it("retourne null quand la réponse HTTP est en erreur", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      new Response("error", { status: 500 })
    );
    const result = await roadRoute([45.5, -73.5], [45.6, -73.6]);
    expect(result).toBeNull();
  });

  it("retourne null quand route.geometry.coordinates est absent", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      new Response(JSON.stringify({ routes: [{ geometry: {} }] }))
    );
    const result = await roadRoute([45.5, -73.5], [45.6, -73.6]);
    expect(result).toBeNull();
  });
});
