// @vitest-environment node

import { describe, expect, it, vi, beforeEach } from "vitest";

/* ── Supabase mock with table-aware chains ── */
const mocks = vi.hoisted(() => {
  function makeChain(overrides: Record<string, unknown> = {}) {
    const chain: Record<string, unknown> = {
      data: overrides.data ?? null,
      error: overrides.error ?? null,
      count: overrides.count ?? null,
    };
    for (const m of ["select", "eq", "neq", "lt", "lte", "not", "order", "limit", "range", "upsert", "update", "insert", "delete", "single", "maybeSingle"]) {
      (chain as Record<string, ReturnType<typeof vi.fn>>)[m] = vi.fn().mockReturnValue(chain);
    }
    // Allow overriding specific methods after creation
    if (overrides.single) (chain as Record<string, unknown>).single = overrides.single;
    if (overrides.maybeSingle) (chain as Record<string, unknown>).maybeSingle = overrides.maybeSingle;
    return chain;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const from = vi.fn((_table: string): any => makeChain());

  return { from, makeChain };
});

vi.mock("@/lib/supabase", () => ({
  supabaseAdmin: {
    from: (...args: unknown[]) => mocks.from(...(args as [string])),
  },
}));

vi.mock("@/lib/stations", () => ({
  extractCity: (addr: string) => addr.split(",").pop()?.trim() ?? null,
  normalize: (s: string) => s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, ""),
  parsePrice: (p: string) => parseFloat(p.replace(",", ".")),
  STATIONS_URL: "https://regieessencequebec.ca/stations.geojson.gz",
  COORDINATE_OVERRIDES: {},
}));

import {
  shouldQueueStationRefresh,
  getStationFeed,
  syncStations,
  type StationFeedMeta,
} from "@/lib/station-sync";

/* ── Helpers ── */

function makeMeta(overrides: Partial<StationFeedMeta> = {}): StationFeedMeta {
  return {
    datasetId: "abc-123",
    stationCount: 100,
    syncStatus: "ready",
    lastStartedAt: new Date().toISOString(),
    lastCompletedAt: new Date().toISOString(),
    lastCheckedAt: new Date().toISOString(),
    sourceLastModified: null,
    lastError: null,
    ...overrides,
  };
}

const IDLE_STATE = {
  singleton: true,
  active_dataset_id: null,
  running_dataset_id: null,
  sync_status: "idle" as const,
  source_etag: null,
  source_last_modified: null,
  last_started_at: null,
  last_completed_at: null,
  last_checked_at: null,
  last_sync_reason: null,
  last_error: null,
  updated_at: new Date().toISOString(),
};

const READY_STATE = {
  ...IDLE_STATE,
  active_dataset_id: "ds-active",
  sync_status: "ready" as const,
  last_started_at: new Date().toISOString(),
  last_completed_at: new Date().toISOString(),
  last_checked_at: new Date().toISOString(),
};

const RUNNING_STATE = {
  ...IDLE_STATE,
  active_dataset_id: "ds-old",
  running_dataset_id: "ds-running",
  sync_status: "running" as const,
  last_started_at: new Date().toISOString(),
};

function setupSyncStateChain(state: Record<string, unknown>) {
  // station_sync_state upsert → select().eq().single()
  const upsertChain = mocks.makeChain({ error: null });
  const selectChain = mocks.makeChain();
  (selectChain as Record<string, ReturnType<typeof vi.fn>>).single = vi.fn().mockResolvedValue({ data: state, error: null });

  let callIdx = 0;
  mocks.from.mockImplementation((table: string) => {
    if (table === "station_sync_state") {
      callIdx++;
      // First call: upsert (ensureStationSyncState)
      // Second call: select (getStationSyncState)
      // Subsequent calls: update (claimStationSync / finalize)
      if (callIdx === 1) return upsertChain;
      if (callIdx === 2) return selectChain;
      return mocks.makeChain();
    }
    if (table === "station_dataset_versions") {
      return mocks.makeChain();
    }
    if (table === "stations_live") {
      return mocks.makeChain();
    }
    if (table === "price_snapshots") {
      return mocks.makeChain();
    }
    return mocks.makeChain();
  });
}

/* ── shouldQueueStationRefresh (pure function) ── */

describe("shouldQueueStationRefresh", () => {
  it("retourne true quand datasetId est null (bootstrap)", () => {
    expect(shouldQueueStationRefresh(makeMeta({ datasetId: null }))).toBe(true);
  });

  it("retourne false quand un sync est en cours et pas expiré", () => {
    const meta = makeMeta({ syncStatus: "running", lastStartedAt: new Date().toISOString() });
    expect(shouldQueueStationRefresh(meta)).toBe(false);
  });

  it("retourne true quand un sync est en cours mais expiré (> 15 min)", () => {
    const expired = new Date(Date.now() - 20 * 60 * 1000).toISOString();
    const meta = makeMeta({ syncStatus: "running", lastStartedAt: expired, lastCompletedAt: expired });
    expect(shouldQueueStationRefresh(meta)).toBe(true);
  });

  it("retourne false quand le dernier sync est frais (< 5 min)", () => {
    expect(shouldQueueStationRefresh(makeMeta({ lastCompletedAt: new Date().toISOString() }))).toBe(false);
  });

  it("retourne true quand le dernier sync est expiré (> 5 min)", () => {
    const old = new Date(Date.now() - 6 * 60 * 1000).toISOString();
    expect(shouldQueueStationRefresh(makeMeta({ lastCompletedAt: old }))).toBe(true);
  });

  it("retourne true quand lastCompletedAt est null", () => {
    expect(shouldQueueStationRefresh(makeMeta({ lastCompletedAt: null }))).toBe(true);
  });
});

/* ── getStationFeed ── */

describe("getStationFeed", () => {
  beforeEach(() => vi.clearAllMocks());

  it("retourne data null quand aucun dataset actif", async () => {
    setupSyncStateChain(IDLE_STATE);
    const result = await getStationFeed();
    expect(result.data).toBeNull();
    expect(result.meta.syncStatus).toBe("idle");
    expect(result.meta.datasetId).toBeNull();
  });

  it("retourne les stations quand un dataset est actif", async () => {
    const stateWithDataset = {
      ...READY_STATE,
      active_dataset_id: "ds-123",
    };

    const datasetVersion = {
      id: "ds-123",
      status: "ready",
      station_count: 1,
      price_snapshot_count: 1,
      imported_at: new Date().toISOString(),
    };

    const stationRows = [{
      dataset_id: "ds-123",
      station_key: "Shell::100 Rue Test",
      name: "Shell",
      brand: "Shell",
      status: "Open",
      address: "100 Rue Test, Québec",
      postal_code: "G1A 1A1",
      region: "Capitale-Nationale",
      latitude: 46.8,
      longitude: -71.2,
      prices: [{ GasType: "Régulier", Price: "165.9", IsAvailable: true }],
      source_last_modified: null,
      imported_at: new Date().toISOString(),
    }];

    let callIdx = 0;
    mocks.from.mockImplementation((table: string) => {
      callIdx++;
      if (table === "station_sync_state") {
        if (callIdx === 1) return mocks.makeChain({ error: null }); // upsert
        return mocks.makeChain({ single: vi.fn().mockResolvedValue({ data: stateWithDataset, error: null }) });
      }
      if (table === "station_dataset_versions") {
        return mocks.makeChain({ single: vi.fn().mockResolvedValue({ data: datasetVersion, error: null }) });
      }
      if (table === "stations_live") {
        // Paginated query — first page returns data, implied end
        return mocks.makeChain({ data: stationRows, error: null });
      }
      return mocks.makeChain();
    });

    const result = await getStationFeed();
    expect(result.data).not.toBeNull();
    expect(result.data!.type).toBe("FeatureCollection");
    expect(result.data!.features).toHaveLength(1);
    expect(result.data!.features[0].properties.Name).toBe("Shell");
    expect(result.meta.datasetId).toBe("ds-123");
    expect(result.meta.stationCount).toBe(1);
  });
});

/* ── syncStations ── */

describe("syncStations", () => {
  beforeEach(() => vi.clearAllMocks());

  it("retourne already-running quand un sync actif non expiré existe", async () => {
    setupSyncStateChain(RUNNING_STATE);
    const result = await syncStations({ reason: "cron" });
    expect(result.changed).toBe(false);
    expect(result.reason).toBe("already-running");
  });

  it("retourne fresh quand les données sont récentes et force=false", async () => {
    setupSyncStateChain(READY_STATE);
    const result = await syncStations({ reason: "cron" });
    expect(result.changed).toBe(false);
    expect(result.reason).toBe("fresh");
    expect(result.datasetId).toBe("ds-active");
  });

  it("lance le sync quand les données sont expirées", async () => {
    const expiredState = {
      ...READY_STATE,
      last_completed_at: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
    };

    const fakeGeoJson = {
      type: "FeatureCollection",
      features: [{
        type: "Feature",
        geometry: { type: "Point", coordinates: [-71.2, 46.8] },
        properties: {
          Name: "Shell", brand: "Shell", Status: "Open",
          Address: "100 Rue, Qu��bec", PostalCode: "G1A", Region: "Capitale-Nationale",
          Prices: [{ GasType: "Régulier", Price: "165.9", IsAvailable: true }],
        },
      }],
    };

    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(fakeGeoJson),
      headers: new Map([["etag", '"abc"'], ["last-modified", "Fri, 04 Apr 2026 12:00:00 GMT"]]),
    }));

    // station_sync_state is called many times (ensureState+getState in syncStations AND claimStationSync)
    // Use a persistent mock that always returns the right thing for each method
    mocks.from.mockImplementation((table: string) => {
      const chain = mocks.makeChain({ error: null, data: [] });
      if (table === "station_sync_state") {
        (chain as Record<string, ReturnType<typeof vi.fn>>).single = vi.fn().mockResolvedValue({ data: expiredState, error: null });
        (chain as Record<string, ReturnType<typeof vi.fn>>).maybeSingle = vi.fn().mockResolvedValue({ data: { singleton: true }, error: null });
      }
      if (table === "station_dataset_versions") {
        (chain as Record<string, ReturnType<typeof vi.fn>>).single = vi.fn().mockResolvedValue({ data: null, error: null });
      }
      return chain;
    });

    const result = await syncStations({ reason: "cron", force: false });
    expect(result.changed).toBe(true);
    expect(result.reason).toBe("completed");
    expect(result.datasetId).toBeDefined();

    vi.unstubAllGlobals();
  });

  it("retourne already-running si le claim échoue", async () => {
    const expiredState = {
      ...READY_STATE,
      last_completed_at: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
    };

    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ type: "FeatureCollection", features: [] }),
      headers: new Map([["etag", null], ["last-modified", null]]),
    }));

    mocks.from.mockImplementation((table: string) => {
      const chain = mocks.makeChain({ error: null, data: [] });
      if (table === "station_sync_state") {
        (chain as Record<string, ReturnType<typeof vi.fn>>).single = vi.fn().mockResolvedValue({ data: expiredState, error: null });
        // claim fails
        (chain as Record<string, ReturnType<typeof vi.fn>>).maybeSingle = vi.fn().mockResolvedValue({ data: null, error: null });
      }
      if (table === "station_dataset_versions") {
        (chain as Record<string, ReturnType<typeof vi.fn>>).single = vi.fn().mockResolvedValue({ data: null, error: null });
      }
      return chain;
    });

    const result = await syncStations({ reason: "cron", force: false });
    expect(result.changed).toBe(false);
    expect(result.reason).toBe("already-running");

    vi.unstubAllGlobals();
  });

  it("nettoie et relance l'erreur quand batchUpsertStations échoue", async () => {
    const expiredState = {
      ...READY_STATE,
      last_completed_at: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
    };

    const fakeGeoJson = {
      type: "FeatureCollection",
      features: [{
        type: "Feature",
        geometry: { type: "Point", coordinates: [-71.2, 46.8] },
        properties: {
          Name: "Shell", brand: "Shell", Status: "Open",
          Address: "100 Rue, Québec", PostalCode: "G1A", Region: "Capitale-Nationale",
          Prices: [{ GasType: "Régulier", Price: "165.9", IsAvailable: true }],
        },
      }],
    };

    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(fakeGeoJson),
      headers: new Map([["etag", '"abc"'], ["last-modified", "Fri, 04 Apr 2026 12:00:00 GMT"]]),
    }));

    const upsertError = new Error("upsert failed");

    mocks.from.mockImplementation((table: string) => {
      const chain = mocks.makeChain({ error: null, data: [] });
      if (table === "station_sync_state") {
        (chain as Record<string, ReturnType<typeof vi.fn>>).single = vi.fn().mockResolvedValue({ data: expiredState, error: null });
        (chain as Record<string, ReturnType<typeof vi.fn>>).maybeSingle = vi.fn().mockResolvedValue({ data: { singleton: true }, error: null });
      }
      if (table === "station_dataset_versions") {
        (chain as Record<string, ReturnType<typeof vi.fn>>).single = vi.fn().mockResolvedValue({ data: null, error: null });
      }
      if (table === "stations_live") {
        // upsert throws to trigger the catch block
        (chain as Record<string, ReturnType<typeof vi.fn>>).upsert = vi.fn().mockRejectedValue(upsertError);
      }
      return chain;
    });

    await expect(syncStations({ reason: "cron", force: false })).rejects.toThrow("upsert failed");

    // Verify cleanup calls were made (from() was called with the cleanup tables)
    const fromCalls = mocks.from.mock.calls.map((c: unknown[]) => c[0]);
    // After the error, catch block calls: station_dataset_versions (update failed), stations_live (delete), station_sync_state (update failed)
    expect(fromCalls.filter((t) => t === "station_dataset_versions").length).toBeGreaterThanOrEqual(2);
    expect(fromCalls.filter((t) => t === "stations_live").length).toBeGreaterThanOrEqual(2);
    expect(fromCalls.filter((t) => t === "station_sync_state").length).toBeGreaterThanOrEqual(3);

    vi.unstubAllGlobals();
  });

  it("lance le sync quand force=true même avec données récentes", async () => {
    const fakeGeoJson = {
      type: "FeatureCollection",
      features: [{
        type: "Feature",
        geometry: { type: "Point", coordinates: [-71.2, 46.8] },
        properties: {
          Name: "Shell", brand: null, Status: "Open",
          Address: "100 Rue, Québec", PostalCode: "G1A", Region: "Capitale-Nationale",
          Prices: [{ GasType: "Régulier", Price: "165.9", IsAvailable: true }],
        },
      }],
    };

    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(fakeGeoJson),
      headers: new Map([["etag", null], ["last-modified", null]]),
    }));

    mocks.from.mockImplementation((table: string) => {
      const chain = mocks.makeChain({ error: null, data: [] });
      if (table === "station_sync_state") {
        (chain as Record<string, ReturnType<typeof vi.fn>>).single = vi.fn().mockResolvedValue({ data: READY_STATE, error: null });
        (chain as Record<string, ReturnType<typeof vi.fn>>).maybeSingle = vi.fn().mockResolvedValue({ data: { singleton: true }, error: null });
      }
      if (table === "station_dataset_versions") {
        (chain as Record<string, ReturnType<typeof vi.fn>>).single = vi.fn().mockResolvedValue({ data: null, error: null });
      }
      return chain;
    });

    const result = await syncStations({ reason: "manual", force: true });
    expect(result.changed).toBe(true);
    expect(result.reason).toBe("completed");

    vi.unstubAllGlobals();
  });

  it("gère les features avec des prix non disponibles", async () => {
    const fakeGeoJson = {
      type: "FeatureCollection",
      features: [{
        type: "Feature",
        geometry: { type: "Point", coordinates: [-71.2, 46.8] },
        properties: {
          Name: "Shell", brand: "Shell", Status: "Open",
          Address: "100 Rue, Québec", PostalCode: "G1A", Region: "Capitale-Nationale",
          Prices: [
            { GasType: "Régulier", Price: "165.9", IsAvailable: false },
            { GasType: "Super", Price: "NaN", IsAvailable: true },
          ],
        },
      }],
    };

    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(fakeGeoJson),
      headers: new Map([["etag", '"abc"'], ["last-modified", "invalid-date"]]),
    }));

    mocks.from.mockImplementation((table: string) => {
      const chain = mocks.makeChain({ error: null, data: [] });
      if (table === "station_sync_state") {
        (chain as Record<string, ReturnType<typeof vi.fn>>).single = vi.fn().mockResolvedValue({
          data: {
            ...READY_STATE,
            last_completed_at: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
          }, error: null,
        });
        (chain as Record<string, ReturnType<typeof vi.fn>>).maybeSingle = vi.fn().mockResolvedValue({ data: { singleton: true }, error: null });
      }
      if (table === "station_dataset_versions") {
        (chain as Record<string, ReturnType<typeof vi.fn>>).single = vi.fn().mockResolvedValue({ data: null, error: null });
      }
      return chain;
    });

    const result = await syncStations({ reason: "cron", force: false });
    expect(result.changed).toBe(true);
    expect(result.reason).toBe("completed");

    vi.unstubAllGlobals();
  });
});
