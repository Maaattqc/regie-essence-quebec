import { describe, it, expect } from "vitest";
import { computeMultiType } from "@/components/PricePanel";
import type { FeatureCollection } from "geojson";

function makeStation(name: string, region: string, city: string, prices: { GasType: string; Price: string; IsAvailable: boolean }[]) {
  return {
    type: "Feature" as const,
    geometry: { type: "Point" as const, coordinates: [-73.5, 45.5] },
    properties: {
      Name: name,
      Address: "123 rue Test",
      Region: region,
      _city: city,
      _cityNorm: city.toLowerCase(),
      brand: "Test",
      Prices: prices,
    },
  };
}

function makeGeoJSON(features: ReturnType<typeof makeStation>[]): FeatureCollection {
  return { type: "FeatureCollection", features };
}

const stationA = makeStation("Station A", "Montréal", "Montréal", [
  { GasType: "Régulier", Price: "170.0¢", IsAvailable: true },
  { GasType: "Super", Price: "190.0¢", IsAvailable: true },
  { GasType: "Diesel", Price: "180.0¢", IsAvailable: true },
]);

const stationB = makeStation("Station B", "Montréal", "Laval", [
  { GasType: "Régulier", Price: "175.0¢", IsAvailable: true },
  { GasType: "Super", Price: "195.0¢", IsAvailable: true },
]);

const stationC = makeStation("Station C", "Québec", "Québec", [
  { GasType: "Régulier", Price: "168.0¢", IsAvailable: true },
  { GasType: "Diesel", Price: "178.0¢", IsAvailable: true },
]);

const data = makeGeoJSON([stationA, stationB, stationC]);

describe("computeMultiType — mode region", () => {
  const result = computeMultiType(data, "region");

  it("regroupe les stations par région", () => {
    expect(result.entries).toHaveLength(2);
    const names = result.entries.map((e) => e.name).sort();
    expect(names).toEqual(["Montréal", "Québec"]);
  });

  it("calcule la moyenne correctement pour Régulier", () => {
    const mtl = result.entries.find((e) => e.name === "Montréal")!;
    // (170 + 175) / 2 = 172.5
    expect(mtl.prices["Régulier"]?.avg).toBeCloseTo(172.5, 1);
    expect(mtl.prices["Régulier"]?.count).toBe(2);
  });

  it("calcule min/max correctement", () => {
    const mtl = result.entries.find((e) => e.name === "Montréal")!;
    expect(mtl.prices["Régulier"]?.min).toBe(170);
    expect(mtl.prices["Régulier"]?.max).toBe(175);
  });

  it("retourne null pour un type non disponible", () => {
    const qc = result.entries.find((e) => e.name === "Québec")!;
    expect(qc.prices["Super"]).toBeNull();
  });

  it("retourne la liste des régions", () => {
    expect(result.regions.sort()).toEqual(["Montréal", "Québec"]);
  });
});

describe("computeMultiType — mode city", () => {
  const result = computeMultiType(data, "city");

  it("regroupe les stations par ville", () => {
    expect(result.entries).toHaveLength(3);
    const names = result.entries.map((e) => e.name).sort();
    expect(names).toEqual(["Laval", "Montréal", "Québec"]);
  });

  it("inclut la région sur chaque entrée ville", () => {
    const laval = result.entries.find((e) => e.name === "Laval")!;
    expect(laval.region).toBe("Montréal");
  });

  it("une seule station par ville donne avg === prix", () => {
    const qc = result.entries.find((e) => e.name === "Québec")!;
    expect(qc.prices["Régulier"]?.avg).toBe(168);
    expect(qc.prices["Régulier"]?.min).toBe(168);
    expect(qc.prices["Régulier"]?.max).toBe(168);
  });

  it("gère les données vides", () => {
    const empty = computeMultiType(makeGeoJSON([]), "city");
    expect(empty.entries).toHaveLength(0);
    expect(empty.regions).toHaveLength(0);
  });
});
