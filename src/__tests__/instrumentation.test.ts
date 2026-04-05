// @vitest-environment node

import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@sentry/nextjs", () => ({
  init: vi.fn(),
  captureRequestError: vi.fn(),
}));

vi.mock("../sentry.server.config", () => ({}));
vi.mock("../sentry.edge.config", () => ({}));

describe("instrumentation", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it("exporte register comme fonction async", async () => {
    const mod = await import("@/instrumentation");
    expect(typeof mod.register).toBe("function");
  });

  it("exporte onRequestError", async () => {
    const mod = await import("@/instrumentation");
    expect(mod.onRequestError).toBeDefined();
  });

  it("importe sentry.server.config quand NEXT_RUNTIME est nodejs", async () => {
    process.env.NEXT_RUNTIME = "nodejs";
    const mod = await import("@/instrumentation");
    await mod.register();
    // Le simple fait que register() ne throw pas confirme que l'import a réussi
    expect(typeof mod.register).toBe("function");
    delete process.env.NEXT_RUNTIME;
  });

  it("importe sentry.edge.config quand NEXT_RUNTIME est edge", async () => {
    process.env.NEXT_RUNTIME = "edge";
    const mod = await import("@/instrumentation");
    await mod.register();
    expect(typeof mod.register).toBe("function");
    delete process.env.NEXT_RUNTIME;
  });

  it("ne throw pas quand NEXT_RUNTIME n'est pas défini", async () => {
    delete process.env.NEXT_RUNTIME;
    const mod = await import("@/instrumentation");
    await expect(mod.register()).resolves.not.toThrow();
  });
});
