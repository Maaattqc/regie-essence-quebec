import { describe, expect, it, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";

vi.mock("@/lib/stations", () => ({
  extractCity: (addr: string) => addr.split(",").pop()?.trim() ?? null,
  normalize: (s: string) => s.toLowerCase(),
  toggleFavorite: vi.fn(() => new Set<string>()),
  getFavorites: vi.fn(() => new Set<string>()),
}));

import { useStationsData } from "@/hooks/useStationsData";

const makeGeoJson = () => ({
  type: "FeatureCollection" as const,
  features: [
    {
      type: "Feature" as const,
      geometry: { type: "Point" as const, coordinates: [-71.2, 46.8] },
      properties: {
        Name: "Shell Québec",
        brand: "Shell",
        Address: "100 Rue Test, Québec",
        PostalCode: "G1A 1A1",
        Region: "Capitale-Nationale",
        Prices: [{ GasType: "Régulier", Price: "175.9", IsAvailable: true }],
      },
    },
  ],
});

describe("useStationsData", () => {
  const callbacks = {
    setHistoryStation: vi.fn(),
    setReportStation: vi.fn(),
    setCommentStation: vi.fn(),
  };

  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
    vi.stubGlobal("sessionStorage", {
      getItem: vi.fn(() => null),
      setItem: vi.fn(),
      removeItem: vi.fn(),
      clear: vi.fn(),
      length: 0,
      key: vi.fn(),
    });
    callbacks.setHistoryStation.mockClear();
    callbacks.setReportStation.mockClear();
    callbacks.setCommentStation.mockClear();
  });

  it("commence avec data=null", () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve({ ok: true, data: null }),
    });

    const { result } = renderHook(() => useStationsData(callbacks));
    expect(result.current.data).toBeNull();
  });

  it("charge les données depuis l'API", async () => {
    const geojson = makeGeoJson();
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve({ ok: true, data: geojson }),
    });

    const { result } = renderHook(() => useStationsData(callbacks));

    await waitFor(() => {
      expect(result.current.data).not.toBeNull();
    });

    expect(result.current.data!.features).toHaveLength(1);
    expect(result.current.data!.features[0].properties.Name).toBe("Shell Québec");
  });

  it("charge les données depuis le cache sessionStorage", async () => {
    const geojson = makeGeoJson();
    (sessionStorage.getItem as ReturnType<typeof vi.fn>).mockReturnValue(
      JSON.stringify(geojson)
    );
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve({ ok: true, data: geojson }),
    });

    const { result } = renderHook(() => useStationsData(callbacks));

    await waitFor(() => {
      expect(result.current.data).not.toBeNull();
    });
  });

  it("retourne un Set de favoris", () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve({ ok: true, data: null }),
    });

    const { result } = renderHook(() => useStationsData(callbacks));
    expect(result.current.favs).toBeInstanceOf(Set);
  });

  it("enregistre les callbacks window pour les popups", async () => {
    const geojson = makeGeoJson();
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve({ ok: true, data: geojson }),
    });

    renderHook(() => useStationsData(callbacks));

    // Attendre que l'effect s'exécute
    await waitFor(() => {
      expect((window as unknown as Record<string, unknown>).__showHistory).toBeDefined();
    });

    // Tester __showHistory
    (window as unknown as Record<string, (...args: string[]) => void>).__showHistory("Shell", "100 Rue Test");
    expect(callbacks.setHistoryStation).toHaveBeenCalledWith({
      name: "Shell",
      address: "100 Rue Test",
    });

    // Tester __showReport
    (window as unknown as Record<string, (...args: string[]) => void>).__showReport("Petro", "200 Boul.");
    expect(callbacks.setReportStation).toHaveBeenCalledWith({
      name: "Petro",
      address: "200 Boul.",
    });

    // Tester __showReviews
    (window as unknown as Record<string, (...args: string[]) => void>).__showReviews("Esso", "300 Ave");
    expect(callbacks.setCommentStation).toHaveBeenCalledWith({
      name: "Esso",
      address: "300 Ave",
    });
  });

  it("sauvegarde les données en sessionStorage", async () => {
    const geojson = makeGeoJson();
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve({ ok: true, data: geojson }),
    });

    renderHook(() => useStationsData(callbacks));

    await waitFor(() => {
      expect(sessionStorage.setItem).toHaveBeenCalled();
    });
  });

  it("retente après un 429 (rate limit)", async () => {
    // Premier appel : 429, deuxième : succès (le retry se fait via setTimeout)
    const geojson = makeGeoJson();
    let fetchCount = 0;
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockImplementation(() => {
      fetchCount++;
      if (fetchCount === 1) {
        return Promise.resolve({
          ok: false,
          status: 429,
          json: () => Promise.resolve({}),
        });
      }
      return Promise.resolve({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ ok: true, data: geojson }),
      });
    });

    const { result } = renderHook(() => useStationsData(callbacks));

    // Le retry à 3s finira par charger les données
    await waitFor(() => {
      expect(result.current.data).not.toBeNull();
    }, { timeout: 10000 });

    // Le fetch a été appelé au moins 2 fois (1x 429, puis succès)
    expect(fetchCount).toBeGreaterThanOrEqual(2);
  }, 15000);

  it("__toggleFav met à jour les favoris via window", async () => {
    const { toggleFavorite } = await import("@/lib/stations");
    const mockToggle = toggleFavorite as ReturnType<typeof vi.fn>;
    mockToggle.mockReturnValue(new Set(["station-1"]));

    const geojson = makeGeoJson();
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve({ ok: true, data: geojson }),
    });

    const { result } = renderHook(() => useStationsData(callbacks));

    // Attendre que l'effect s'exécute et enregistre __toggleFav
    await waitFor(() => {
      expect((window as unknown as Record<string, unknown>).__toggleFav).toBeDefined();
    });

    // Appeler __toggleFav dans act()
    const { act } = await import("@testing-library/react");
    act(() => {
      (window as unknown as Record<string, (id: string) => void>).__toggleFav("station-1");
    });

    expect(mockToggle).toHaveBeenCalledWith("station-1");

    // Les favoris doivent être mis à jour
    await waitFor(() => {
      expect(result.current.favs).toEqual(new Set(["station-1"]));
    });
  });
});
