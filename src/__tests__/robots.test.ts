// @vitest-environment node

import { describe, it, expect } from "vitest";
import robots from "@/app/robots";

describe("robots.ts", () => {
  it("retourne les règles de crawling", () => {
    const result = robots();
    expect(result.rules).toBeDefined();
    expect(Array.isArray(result.rules)).toBe(true);
  });

  it("autorise la racine", () => {
    const result = robots();
    const rules = Array.isArray(result.rules) ? result.rules : [result.rules];
    expect(rules[0].allow).toBe("/");
  });

  it("bloque /admin, /api/, /auth/", () => {
    const result = robots();
    const rules = Array.isArray(result.rules) ? result.rules : [result.rules];
    expect(rules[0].disallow).toContain("/admin");
    expect(rules[0].disallow).toContain("/api/");
    expect(rules[0].disallow).toContain("/auth/");
  });

  it("inclut le sitemap", () => {
    const result = robots();
    expect(result.sitemap).toBe("https://essence-quebec.ca/sitemap.xml");
  });
});
