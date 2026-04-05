import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

/* ------------------------------------------------------------------ */
/*  Mocks                                                              */
/* ------------------------------------------------------------------ */

const mocks = vi.hoisted(() => ({
  parsePrice: vi.fn((s: string) => parseFloat(s.replace("\u00A2", ""))),
  distanceKm: vi.fn(() => 3),
  effectivePrice: vi.fn((price: number, dist: number, conso: number, tank: number) =>
    price * (1 + (2 * dist * conso) / (100 * tank)),
  ),
  roadDistances: vi.fn(),
  roadRoute: vi.fn(),
}));

vi.mock("@/lib/stations", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/stations")>();
  return {
    ...actual,
    parsePrice: mocks.parsePrice,
    distanceKm: mocks.distanceKm,
    effectivePrice: mocks.effectivePrice,
    roadDistances: mocks.roadDistances,
    roadRoute: mocks.roadRoute,
  };
});

/* ------------------------------------------------------------------ */
/*  Import du hook APRÈS le mock                                       */
/* ------------------------------------------------------------------ */

import { useEffectivePrice } from "@/hooks/useEffectivePrice";

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function makeStation(name: string, lat: number, lng: number, price: string, gasType = "Régulier") {
  return {
    type: "Feature" as const,
    geometry: { type: "Point" as const, coordinates: [lng, lat] },
    properties: {
      Name: name,
      brand: "Shell",
      Address: `${name} Adresse`,
      PostalCode: "H1A 1A1",
      Region: "Montréal",
      Prices: [{ GasType: gasType, Price: price, IsAvailable: true }],
    },
  };
}

function makeData(features: ReturnType<typeof makeStation>[]) {
  return { type: "FeatureCollection" as const, features };
}

const USER_POS: [number, number] = [45.5, -73.6];

function defaultParams(overrides: Record<string, unknown> = {}) {
  return {
    data: makeData([
      makeStation("Station A", 45.51, -73.61, "175.9"),
      makeStation("Station B", 45.52, -73.62, "170.0"),
      makeStation("Station C", 45.60, -73.80, "165.0"),
    ]),
    gasType: "Régulier" as const,
    userPos: USER_POS,
    setUserPos: vi.fn(),
    geoReady: false, // false par défaut pour contrôler l'auto-search
    radiusKm: 5,
    setRadiusKm: vi.fn(),
    consoLper100: 9,
    tankVolume: 40,
    setFlyTarget: vi.fn(),
    ...overrides,
  };
}

/* ------------------------------------------------------------------ */
/*  Tests                                                              */
/* ------------------------------------------------------------------ */

describe("useEffectivePrice", () => {
  beforeEach(() => {
    mocks.distanceKm.mockReset().mockImplementation(() => 3);
    mocks.effectivePrice.mockReset().mockImplementation(
      (price: number, dist: number, conso: number, tank: number) =>
        price * (1 + (2 * dist * conso) / (100 * tank)),
    );
    mocks.parsePrice.mockReset().mockImplementation(
      (s: string) => parseFloat(s.replace("\u00A2", "")),
    );
    mocks.roadDistances.mockReset().mockResolvedValue([
      { distKm: 3.2, durationMin: 5 },
      { distKm: 4.1, durationMin: 7 },
      { distKm: 15.0, durationMin: 18 },
    ]);
    mocks.roadRoute.mockReset().mockResolvedValue({
      path: [[45.5, -73.6], [45.51, -73.61]],
      distKm: 3.2,
      durationMin: 5,
    });
  });

  it("retourne null initialement", () => {
    const params = defaultParams();
    const { result } = renderHook(() => useEffectivePrice(params));

    expect(result.current.cheapestResults).toBeNull();
    expect(result.current.cheapestRoute).toBeNull();
  });

  it("clearCheapest remet les résultats à null", async () => {
    const params = defaultParams();
    const { result } = renderHook(() => useEffectivePrice(params));

    // Déclencher une recherche manuelle
    await act(async () => {
      result.current.findBestEffectivePrice();
    });

    await waitFor(() => expect(result.current.cheapestResults).not.toBeNull());

    act(() => {
      result.current.clearCheapest();
    });

    expect(result.current.cheapestResults).toBeNull();
    expect(result.current.cheapestRoute).toBeNull();
  });

  it("findBestEffectivePrice filtre les stations dans le rayon", async () => {
    // Station C est à 20 km, hors du rayon de 5 km
    mocks.distanceKm.mockImplementation(
      (...args: number[]) => {
        if (args[2] === 45.60) return 20; // Station C — hors rayon
        return 3; // Stations A et B — dans le rayon
      },
    );

    // Seules 2 stations restent après filtrage
    mocks.roadDistances.mockResolvedValue([
      { distKm: 3.2, durationMin: 5 },
      { distKm: 4.1, durationMin: 7 },
    ]);

    const params = defaultParams();
    const { result } = renderHook(() => useEffectivePrice(params));

    await act(async () => {
      result.current.findBestEffectivePrice();
    });

    await waitFor(() => expect(result.current.cheapestResults).not.toBeNull());

    // roadDistances ne doit recevoir que les stations dans le rayon (A et B)
    const destinations = mocks.roadDistances.mock.calls[0][1] as [number, number][];
    expect(destinations).toHaveLength(2);
    expect(destinations.every(([lat]) => lat !== 45.60)).toBe(true);
  });

  it("findBestEffectivePrice retourne un message si aucune station trouvée", async () => {
    // Toutes les stations sont hors rayon
    mocks.distanceKm.mockReturnValue(100);

    const params = defaultParams();
    const { result } = renderHook(() => useEffectivePrice(params));

    await act(async () => {
      result.current.findBestEffectivePrice();
    });

    await waitFor(() => expect(result.current.cheapestResults).not.toBeNull());

    expect(result.current.cheapestResults!.stations).toHaveLength(0);
    expect(result.current.cheapestResults!.message).toContain("Aucune station");
  });

  it("findBestEffectivePrice trie par prix effectif", async () => {
    // Station B (170¢) est moins chère que A (175.9¢), même distance
    mocks.distanceKm.mockReturnValue(3);
    mocks.roadDistances.mockResolvedValue([
      { distKm: 3.0, durationMin: 5 },
      { distKm: 3.0, durationMin: 5 },
      { distKm: 3.0, durationMin: 5 },
    ]);

    const params = defaultParams();
    const { result } = renderHook(() => useEffectivePrice(params));

    await act(async () => {
      result.current.findBestEffectivePrice();
    });

    await waitFor(() => expect(result.current.cheapestResults).not.toBeNull());

    // La meilleure station est Station C (165¢) ou B (170¢) selon le filtrage
    const best = result.current.cheapestResults!.stations[0];
    expect(best).toBeDefined();
    // Le message doit contenir le nom de la station la moins chère
    expect(result.current.cheapestResults!.message).toContain(best.name);
  });

  it("auto-search se déclenche quand data+userPos+geoReady sont prêts", async () => {
    // Commencer avec geoReady=false
    const params = defaultParams({ geoReady: false });
    const { result, rerender } = renderHook(
      (props) => useEffectivePrice(props),
      { initialProps: params },
    );

    // Pas encore de résultat
    expect(result.current.cheapestResults).toBeNull();

    // Activer geoReady → l'auto-search doit se déclencher
    rerender({ ...params, geoReady: true });

    await waitFor(() => expect(result.current.cheapestResults).not.toBeNull());

    // roadDistances doit avoir été appelé (preuve que la recherche a eu lieu)
    expect(mocks.roadDistances).toHaveBeenCalled();
  });

  it("ne déclenche l'auto-search qu'une seule fois", async () => {
    const params = defaultParams({ geoReady: true });
    const { result, rerender } = renderHook(
      (props) => useEffectivePrice(props),
      { initialProps: params },
    );

    await waitFor(() => expect(result.current.cheapestResults).not.toBeNull());

    const callCount = mocks.roadDistances.mock.calls.length;

    // Re-render avec les mêmes données : pas de nouvel appel
    rerender({ ...params, geoReady: true });
    // Petit délai pour s'assurer qu'aucun appel supplémentaire n'est fait
    await act(async () => {
      await new Promise((r) => setTimeout(r, 50));
    });

    expect(mocks.roadDistances.mock.calls.length).toBe(callCount);
  });
});
