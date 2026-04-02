import { describe, it, expect } from "vitest";
import { reportSchema } from "@/lib/schemas";

describe("reportSchema", () => {
  const validData = {
    station_name: "Shell Montréal",
    address: "123 rue Main, Montréal",
    first_name: "Jean",
    last_name: "Tremblay",
    email: "jean@test.com",
    message: "Le prix affiché ne correspond pas au prix réel.",
  };

  it("accepte des données valides", () => {
    const result = reportSchema.safeParse(validData);
    expect(result.success).toBe(true);
  });

  it("rejette un email invalide", () => {
    const result = reportSchema.safeParse({ ...validData, email: "pas-un-email" });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.some((i) => i.path.includes("email"))).toBe(true);
    }
  });

  it("rejette un prénom trop court", () => {
    const result = reportSchema.safeParse({ ...validData, first_name: "J" });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.some((i) => i.path.includes("first_name"))).toBe(true);
    }
  });

  it("rejette un nom trop court", () => {
    const result = reportSchema.safeParse({ ...validData, last_name: "T" });
    expect(result.success).toBe(false);
  });

  it("rejette un message trop court", () => {
    const result = reportSchema.safeParse({ ...validData, message: "Court" });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.some((i) => i.path.includes("message"))).toBe(true);
    }
  });

  it("rejette si station_name est vide", () => {
    const result = reportSchema.safeParse({ ...validData, station_name: "" });
    expect(result.success).toBe(false);
  });

  it("rejette si address est vide", () => {
    const result = reportSchema.safeParse({ ...validData, address: "" });
    expect(result.success).toBe(false);
  });

  it("rejette si des champs sont manquants", () => {
    const result = reportSchema.safeParse({ station_name: "Shell" });
    expect(result.success).toBe(false);
  });
});
