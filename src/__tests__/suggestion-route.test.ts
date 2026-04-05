// @vitest-environment node

import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => {
  const insert = vi.fn();
  const from = vi.fn(() => ({ insert }));

  return {
    from,
    getIP: vi.fn(),
    insert,
    rateLimit: vi.fn(),
    logActivity: vi.fn(),
  };
});

vi.mock("@/lib/supabase", () => ({
  supabaseAdmin: { from: mocks.from },
}));

vi.mock("@/lib/rateLimit", () => ({
  getIP: mocks.getIP,
  rateLimit: mocks.rateLimit,
  checkCsrf: vi.fn(() => true),
  getRequestId: vi.fn(() => "test-req-id"),
}));

vi.mock("@/lib/activity-log", () => ({
  logActivity: mocks.logActivity,
}));

import { POST } from "@/app/api/suggestion/route";

const validBody = {
  first_name: "Jean",
  last_name: "Tremblay",
  email: "jean@example.com",
  message: "Ce serait bien d'ajouter un mode hors ligne pour consulter les prix.",
};

function makeRequest(body: unknown) {
  return new NextRequest("http://localhost/api/suggestion", {
    method: "POST",
    body: JSON.stringify(body),
    headers: { "Content-Type": "application/json" },
  });
}

describe("POST /api/suggestion", () => {
  beforeEach(() => {
    mocks.from.mockClear();
    mocks.getIP.mockReset();
    mocks.insert.mockReset();
    mocks.rateLimit.mockReset();
    mocks.logActivity.mockReset();

    mocks.getIP.mockReturnValue("203.0.113.1");
    mocks.insert.mockResolvedValue({ error: null });
    mocks.rateLimit.mockReturnValue(true);
  });

  it("bloque quand le rate limit est dépassé", async () => {
    mocks.rateLimit.mockReturnValue(false);
    const res = await POST(makeRequest(validBody));
    expect(res.status).toBe(429);
  });

  it("retourne 400 si le prénom est trop court", async () => {
    const res = await POST(makeRequest({ ...validBody, first_name: "J" }));
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toContain("prénom");
  });

  it("retourne 400 si le nom est trop court", async () => {
    const res = await POST(makeRequest({ ...validBody, last_name: "T" }));
    expect(res.status).toBe(400);
  });

  it("retourne 400 si le courriel est invalide", async () => {
    const res = await POST(makeRequest({ ...validBody, email: "pas-un-email" }));
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toContain("courriel");
  });

  it("retourne 400 si le message est trop court", async () => {
    const res = await POST(makeRequest({ ...validBody, message: "court" }));
    expect(res.status).toBe(400);
  });

  it("retourne 400 si le message dépasse 2000 caractères", async () => {
    const res = await POST(makeRequest({ ...validBody, message: "a".repeat(2001) }));
    expect(res.status).toBe(400);
  });

  it("insère dans la table suggestions avec des données valides", async () => {
    const res = await POST(makeRequest(validBody));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.ok).toBe(true);
    expect(mocks.from).toHaveBeenCalledWith("suggestions");
    expect(mocks.insert).toHaveBeenCalledWith(validBody);
  });

  it("retourne 500 si Supabase échoue", async () => {
    mocks.insert.mockResolvedValue({ error: { message: "DB error" } });
    const res = await POST(makeRequest(validBody));
    expect(res.status).toBe(500);
  });

  it("log l'activité après insertion réussie sans PII", async () => {
    await POST(makeRequest(validBody));
    expect(mocks.logActivity).toHaveBeenCalledWith(
      "suggestion",
      "Nouvelle suggestion",
      undefined,
      expect.objectContaining({ requestId: "test-req-id" }),
    );
    // Vérifier que le nom complet n'apparaît pas dans les arguments du log
    const callArgs = mocks.logActivity.mock.calls[0];
    expect(JSON.stringify(callArgs)).not.toContain("Jean");
    expect(JSON.stringify(callArgs)).not.toContain("Tremblay");
  });

  it("ne log pas l'activité si l'insertion échoue", async () => {
    mocks.insert.mockResolvedValue({ error: { message: "fail" } });
    await POST(makeRequest(validBody));
    expect(mocks.logActivity).not.toHaveBeenCalled();
  });

  it("retourne 400 quand le corps est vide", async () => {
    const res = await POST(makeRequest({}));
    expect(res.status).toBe(400);
    expect(mocks.insert).not.toHaveBeenCalled();
  });

  it("utilise le profil strict pour le rate limiting", async () => {
    await POST(makeRequest(validBody));
    expect(mocks.rateLimit).toHaveBeenCalledWith(expect.any(String), "strict");
  });

  it("n'insère pas si le rate limit est dépassé", async () => {
    mocks.rateLimit.mockReturnValue(false);
    await POST(makeRequest(validBody));
    expect(mocks.insert).not.toHaveBeenCalled();
    expect(mocks.logActivity).not.toHaveBeenCalled();
  });
});
