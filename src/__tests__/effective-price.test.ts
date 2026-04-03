import { describe, it, expect } from "vitest";
import { effectivePrice } from "@/lib/stations";

describe("effectivePrice", () => {
  it("retourne le prix brut quand la distance est 0", () => {
    expect(effectivePrice(170, 0, 9, 40)).toBe(170);
  });

  it("augmente le prix avec la distance", () => {
    const ep = effectivePrice(170, 10, 9, 40);
    // 170 * (1 + 2*10*9 / (100*40)) = 170 * (1 + 180/4000) = 170 * 1.045 = 177.65
    expect(ep).toBeCloseTo(177.65, 1);
  });

  it("pénalise plus une grosse consommation", () => {
    const eco = effectivePrice(170, 10, 6, 40);   // 6 L/100km
    const suv = effectivePrice(170, 10, 14, 40);  // 14 L/100km
    expect(suv).toBeGreaterThan(eco);
  });

  it("pénalise moins avec un gros réservoir", () => {
    const petit = effectivePrice(170, 10, 9, 30);  // 30L
    const gros = effectivePrice(170, 10, 9, 80);   // 80L
    expect(petit).toBeGreaterThan(gros);
  });

  it("station proche moins chère bat station loin au prix brut plus bas", () => {
    // Station A : 187.2¢ à 2 km
    const epA = effectivePrice(187.2, 2, 9, 40);
    // Station B : 187.0¢ à 15 km
    const epB = effectivePrice(187.0, 15, 9, 40);
    // A devrait être moins chère en prix effectif
    expect(epA).toBeLessThan(epB);
  });

  it("grande distance rend le prix effectif significativement plus élevé", () => {
    const ep = effectivePrice(170, 30, 9, 40);
    // 170 * (1 + 2*30*9 / 4000) = 170 * 1.135 = 192.95
    expect(ep).toBeCloseTo(192.95, 1);
    expect(ep - 170).toBeGreaterThan(20); // > 20¢ de pénalité
  });

  it("valeurs par défaut typiques (9 L/100km, 40L, 5km)", () => {
    const ep = effectivePrice(175, 5, 9, 40);
    // 175 * (1 + 90/4000) = 175 * 1.0225 = 178.9375
    expect(ep).toBeCloseTo(178.94, 1);
  });
});
