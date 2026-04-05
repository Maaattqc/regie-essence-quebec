// @vitest-environment node

import { describe, it, expect } from "vitest";
import sitemap from "@/app/sitemap";

describe("sitemap.ts", () => {
  it("retourne un tableau d'URLs", () => {
    const result = sitemap();
    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBeGreaterThan(0);
  });

  it("contient la page d'accueil avec priorité 1", () => {
    const result = sitemap();
    const home = result.find((e) => e.url === "https://essence-quebec.ca");
    expect(home).toBeDefined();
    expect(home!.priority).toBe(1);
    expect(home!.changeFrequency).toBe("hourly");
  });

  it("contient les pages légales", () => {
    const result = sitemap();
    const urls = result.map((e) => e.url);
    expect(urls).toContain("https://essence-quebec.ca/confidentialite");
    expect(urls).toContain("https://essence-quebec.ca/conditions-utilisation");
    expect(urls).toContain("https://essence-quebec.ca/accessibilite");
  });

  it("contient la FAQ, À propos, Changelog, Tech", () => {
    const result = sitemap();
    const urls = result.map((e) => e.url);
    expect(urls).toContain("https://essence-quebec.ca/faq");
    expect(urls).toContain("https://essence-quebec.ca/a-propos");
    expect(urls).toContain("https://essence-quebec.ca/changelog");
    expect(urls).toContain("https://essence-quebec.ca/tech");
  });

  it("toutes les entrées ont lastModified", () => {
    const result = sitemap();
    for (const entry of result) {
      expect(entry.lastModified).toBeDefined();
    }
  });
});
