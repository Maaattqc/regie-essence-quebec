// @vitest-environment node

import { describe, it, expect } from "vitest";
import { GET } from "@/app/api/health/route";

describe("GET /api/health", () => {
  it("retourne un statut 200", async () => {
    const response = await GET();
    expect(response.status).toBe(200);
  });

  it("retourne un body avec status ok", async () => {
    const response = await GET();
    const body = await response.json();
    expect(body.status).toBe("ok");
  });

  it("retourne un timestamp ISO valide", async () => {
    const response = await GET();
    const body = await response.json();
    expect(body.timestamp).toBeDefined();
    const parsed = new Date(body.timestamp);
    expect(parsed.toISOString()).toBe(body.timestamp);
  });
});
