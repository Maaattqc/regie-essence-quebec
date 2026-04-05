// @vitest-environment node

import { describe, it, expect, vi, beforeEach } from "vitest";

const mocks = vi.hoisted(() => {
  const chain = {
    delete: vi.fn(),
    lt: vi.fn(),
    in: vi.fn(),
  };
  chain.delete.mockReturnValue(chain);
  chain.lt.mockReturnValue({ error: null });
  chain.in.mockReturnValue(chain);

  return {
    from: vi.fn(() => chain),
    chain,
    logActivity: vi.fn(),
  };
});

vi.mock("@/lib/supabase", () => ({
  supabaseAdmin: { from: mocks.from },
}));

vi.mock("@/lib/activity-log", () => ({
  logActivity: mocks.logActivity,
}));

import { GET } from "@/app/api/cron/cleanup/route";

describe("GET /api/cron/cleanup", () => {
  beforeEach(() => {
    process.env.CRON_SECRET = "test-secret";
    vi.clearAllMocks();
    mocks.chain.delete.mockReturnValue(mocks.chain);
    mocks.chain.lt.mockReturnValue({ error: null });
    mocks.chain.in.mockReturnValue(mocks.chain);
  });

  it("retourne 500 sans CRON_SECRET", async () => {
    delete process.env.CRON_SECRET;
    const res = await GET(new Request("http://localhost/api/cron/cleanup"));
    expect(res.status).toBe(500);
  });

  it("retourne 401 sans autorisation", async () => {
    const res = await GET(new Request("http://localhost/api/cron/cleanup"));
    expect(res.status).toBe(401);
  });

  it("retourne 401 avec un mauvais token", async () => {
    const res = await GET(new Request("http://localhost/api/cron/cleanup", {
      headers: { authorization: "Bearer wrong" },
    }));
    expect(res.status).toBe(401);
  });

  it("exécute le nettoyage avec le bon token", async () => {
    const res = await GET(new Request("http://localhost/api/cron/cleanup", {
      headers: { authorization: "Bearer test-secret" },
    }));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(body.results).toBeDefined();
    // Vérifie que from() a été appelé pour les 3 tables
    expect(mocks.from).toHaveBeenCalledWith("activity_logs");
    expect(mocks.from).toHaveBeenCalledWith("reports");
    expect(mocks.from).toHaveBeenCalledWith("page_views");
    expect(mocks.logActivity).toHaveBeenCalledWith("cron", "Nettoyage données expirées", undefined, expect.any(Object));
  });
});
