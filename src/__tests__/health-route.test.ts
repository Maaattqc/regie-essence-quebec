// @vitest-environment node

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

const mocks = vi.hoisted(() => {
  const selectChain = {
    limit: vi.fn(),
  };
  const select = vi.fn(() => selectChain);

  return {
    from: vi.fn(() => ({ select })),
    select,
    selectChain,
  };
});

vi.mock("@/lib/supabase", () => ({
  supabaseAdmin: { from: mocks.from },
}));

import { GET } from "@/app/api/health/route";

describe("GET /api/health", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.selectChain.limit.mockResolvedValue({ error: null });
  });

  it("retourne 200 quand Supabase est ok", async () => {
    const response = await GET();
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.status).toBe("ok");
    expect(body.checks.supabase.ok).toBe(true);
    expect(body.checks.supabase.latencyMs).toBeDefined();
  });

  it("retourne un timestamp ISO valide", async () => {
    const response = await GET();
    const body = await response.json();
    expect(body.timestamp).toBeDefined();
    const parsed = new Date(body.timestamp);
    expect(parsed.toISOString()).toBe(body.timestamp);
  });

  it("retourne down (503) quand Supabase échoue", async () => {
    mocks.selectChain.limit.mockResolvedValue({
      error: { message: "connection refused" },
    });

    const response = await GET();
    const body = await response.json();
    expect(response.status).toBe(503);
    expect(body.status).toBe("down");
    expect(body.checks.supabase.ok).toBe(false);
    expect(body.checks.supabase.error).toBe("connection refused");
  });

  it("retourne down quand Supabase throw", async () => {
    mocks.selectChain.limit.mockRejectedValue(new Error("network error"));

    const response = await GET();
    const body = await response.json();
    expect(response.status).toBe(503);
    expect(body.status).toBe("down");
    expect(body.checks.supabase.ok).toBe(false);
  });

  describe("Upstash Redis (quand configuré)", () => {
    const originalFetch = globalThis.fetch;

    beforeEach(() => {
      process.env.UPSTASH_REDIS_REST_URL = "https://fake-redis.upstash.io";
      process.env.UPSTASH_REDIS_REST_TOKEN = "fake-token";
    });

    afterEach(() => {
      delete process.env.UPSTASH_REDIS_REST_URL;
      delete process.env.UPSTASH_REDIS_REST_TOKEN;
      globalThis.fetch = originalFetch;
    });

    it("retourne ok pour Upstash quand le ping réussit", async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({ ok: true, status: 200 });

      const response = await GET();
      const body = await response.json();
      expect(response.status).toBe(200);
      expect(body.status).toBe("ok");
      expect(body.checks.upstash).toBeDefined();
      expect(body.checks.upstash.ok).toBe(true);
      expect(body.checks.upstash.latencyMs).toBeDefined();

      expect(globalThis.fetch).toHaveBeenCalledWith(
        "https://fake-redis.upstash.io/ping",
        expect.objectContaining({
          headers: { Authorization: "Bearer fake-token" },
        }),
      );
    });

    it("retourne degraded quand Upstash ping retourne non-ok", async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({ ok: false, status: 503 });

      const response = await GET();
      const body = await response.json();
      expect(response.status).toBe(200);
      expect(body.status).toBe("degraded");
      expect(body.checks.upstash).toBeDefined();
      expect(body.checks.upstash.ok).toBe(false);
      expect(body.checks.upstash.error).toBe("HTTP 503");
    });

    it("retourne degraded quand Upstash fetch throw", async () => {
      globalThis.fetch = vi.fn().mockRejectedValue(new Error("Connection refused"));

      const response = await GET();
      const body = await response.json();
      expect(response.status).toBe(200);
      expect(body.status).toBe("degraded");
      expect(body.checks.upstash).toBeDefined();
      expect(body.checks.upstash.ok).toBe(false);
      expect(body.checks.upstash.error).toBe("Connection refused");
    });

    it("retourne down quand Supabase et Upstash échouent", async () => {
      mocks.selectChain.limit.mockResolvedValue({
        error: { message: "db down" },
      });
      globalThis.fetch = vi.fn().mockRejectedValue(new Error("redis down"));

      const response = await GET();
      const body = await response.json();
      expect(response.status).toBe(503);
      expect(body.status).toBe("down");
      expect(body.checks.supabase.ok).toBe(false);
      expect(body.checks.upstash.ok).toBe(false);
    });
  });
});
