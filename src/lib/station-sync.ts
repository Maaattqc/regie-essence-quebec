import { randomUUID } from "node:crypto";
import { extractCity, normalize, parsePrice, STATIONS_URL } from "@/lib/stations";
import { supabaseAdmin } from "@/lib/supabase";

const STATION_SYNC_MAX_AGE_MS = 5 * 60 * 1000;
const STATION_SYNC_LOCK_TIMEOUT_MS = 15 * 60 * 1000;
const INSERT_BATCH_SIZE = 500;

type SyncReason =
  | "bootstrap"
  | "cron"
  | "manual"
  | "serve-stale"
  | "serve-empty";

interface StationDatasetVersionRow {
  id: string;
  status: "running" | "ready" | "failed";
  station_count: number;
  price_snapshot_count: number;
  imported_at: string | null;
}

interface StationSyncStateRow {
  singleton: true;
  active_dataset_id: string | null;
  running_dataset_id: string | null;
  sync_status: "idle" | "running" | "ready" | "failed";
  source_etag: string | null;
  source_last_modified: string | null;
  last_started_at: string | null;
  last_completed_at: string | null;
  last_checked_at: string | null;
  last_sync_reason: string | null;
  last_error: string | null;
  updated_at: string;
}

interface RemoteStationPrice {
  GasType: string;
  Price: string;
  IsAvailable: boolean;
}

interface RemoteStationProperties {
  Name: string;
  brand: string | null;
  Status: string;
  Address: string;
  PostalCode: string;
  Region: string;
  Prices: RemoteStationPrice[];
  _city?: string;
  _cityNorm?: string;
}

interface RemoteStationFeature {
  type: "Feature";
  geometry: {
    type: "Point";
    coordinates: [number, number];
  };
  properties: RemoteStationProperties;
}

interface RemoteStationGeoJson {
  type: "FeatureCollection";
  features: RemoteStationFeature[];
}

interface StationLiveRow {
  dataset_id: string;
  station_key: string;
  name: string;
  brand: string;
  status: string;
  address: string;
  postal_code: string;
  region: string;
  latitude: number;
  longitude: number;
  prices: RemoteStationPrice[];
  source_last_modified: string | null;
  imported_at: string;
}

interface PriceSnapshotRow {
  station_name: string;
  address: string;
  gas_type: string;
  price: number;
  snapshot_date: string;
  snapshot_at: string;
}

export interface StationFeedMeta {
  datasetId: string | null;
  stationCount: number;
  syncStatus: StationSyncStateRow["sync_status"];
  lastStartedAt: string | null;
  lastCompletedAt: string | null;
  lastCheckedAt: string | null;
  sourceLastModified: string | null;
  lastError: string | null;
}

export interface StationFeedResponse {
  data: RemoteStationGeoJson | null;
  meta: StationFeedMeta;
}

export interface StationSyncResult {
  changed: boolean;
  datasetId: string | null;
  reason:
    | "fresh"
    | "already-running"
    | "not-modified"
    | "completed";
}

function buildStationKey(name: string, address: string) {
  return `${name}::${address}`;
}

function toIsoOrNull(value: string | null) {
  if (!value) {
    return null;
  }

  const date = new Date(value);
  if (Number.isNaN(date.valueOf())) {
    return null;
  }

  return date.toISOString();
}

function getQuebecSnapshotDate(now = new Date()) {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Toronto",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });

  return formatter.format(now);
}

function isExpired(isoDate: string | null, maxAgeMs: number) {
  if (!isoDate) {
    return true;
  }

  return Date.now() - new Date(isoDate).valueOf() >= maxAgeMs;
}

async function ensureStationSyncState() {
  const { error } = await supabaseAdmin.from("station_sync_state").upsert(
    { singleton: true },
    { onConflict: "singleton" }
  );

  if (error) {
    throw new Error(error.message);
  }
}

async function getStationSyncState() {
  await ensureStationSyncState();

  const { data, error } = await supabaseAdmin
    .from("station_sync_state")
    .select("*")
    .eq("singleton", true)
    .single<StationSyncStateRow>();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

async function getStationDatasetVersion(datasetId: string | null) {
  if (!datasetId) {
    return null;
  }

  const { data, error } = await supabaseAdmin
    .from("station_dataset_versions")
    .select("id, status, station_count, price_snapshot_count, imported_at")
    .eq("id", datasetId)
    .single<StationDatasetVersionRow>();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

function buildMeta(
  state: StationSyncStateRow,
  datasetVersion: StationDatasetVersionRow | null
): StationFeedMeta {
  return {
    datasetId: state.active_dataset_id,
    stationCount: datasetVersion?.station_count ?? 0,
    syncStatus: state.sync_status,
    lastStartedAt: state.last_started_at,
    lastCompletedAt: state.last_completed_at,
    lastCheckedAt: state.last_checked_at,
    sourceLastModified: state.source_last_modified,
    lastError: state.last_error,
  };
}

function decorateProperties(properties: RemoteStationProperties) {
  const city = extractCity(properties.Address);

  return {
    ...properties,
    _city: city ?? undefined,
    _cityNorm: city ? normalize(city) : undefined,
  };
}

function hydrateGeoJson(rows: StationLiveRow[]): RemoteStationGeoJson {
  return {
    type: "FeatureCollection",
    features: rows.map((row) => ({
      type: "Feature",
      geometry: {
        type: "Point",
        coordinates: [row.longitude, row.latitude],
      },
      properties: decorateProperties({
        Name: row.name,
        brand: row.brand,
        Status: row.status,
        Address: row.address,
        PostalCode: row.postal_code,
        Region: row.region,
        Prices: row.prices,
      }),
    })),
  };
}

function normalizeRemoteGeoJson(
  geojson: RemoteStationGeoJson,
  datasetId: string,
  importedAt: string,
  sourceLastModified: string | null
) {
  const snapshotDate = getQuebecSnapshotDate(new Date(importedAt));
  const stations: StationLiveRow[] = [];
  const snapshots: PriceSnapshotRow[] = [];

  geojson.features.forEach((feature) => {
    const [longitude, latitude] = feature.geometry.coordinates;
    const { Name, brand, Status, Address, PostalCode, Region, Prices } =
      feature.properties;
    const safeBrand = brand ?? "Aucun";

    stations.push({
      dataset_id: datasetId,
      station_key: buildStationKey(Name, Address),
      name: Name,
      brand: safeBrand,
      status: Status,
      address: Address,
      postal_code: PostalCode,
      region: Region,
      latitude,
      longitude,
      prices: Prices,
      source_last_modified: sourceLastModified,
      imported_at: importedAt,
    });

    Prices.forEach((priceEntry) => {
      if (!priceEntry.IsAvailable) {
        return;
      }

      const price = parsePrice(priceEntry.Price);
      if (Number.isNaN(price)) {
        return;
      }

      snapshots.push({
        station_name: Name,
        address: Address,
        gas_type: priceEntry.GasType,
        price,
        snapshot_date: snapshotDate,
        snapshot_at: importedAt,
      });
    });
  });

  return { stations, snapshots };
}

async function batchUpsertStations(rows: StationLiveRow[]) {
  for (let index = 0; index < rows.length; index += INSERT_BATCH_SIZE) {
    const batch = rows.slice(index, index + INSERT_BATCH_SIZE);
    const { error } = await supabaseAdmin.from("stations_live").upsert(batch, {
      onConflict: "dataset_id,station_key",
    });

    if (error) {
      throw new Error(error.message);
    }
  }
}

async function batchUpsertSnapshots(rows: PriceSnapshotRow[]) {
  for (let index = 0; index < rows.length; index += INSERT_BATCH_SIZE) {
    const batch = rows.slice(index, index + INSERT_BATCH_SIZE);
    const { error } = await supabaseAdmin
      .from("price_snapshots")
      .upsert(batch, {
        onConflict: "station_name,address,gas_type,snapshot_at",
      });

    if (error) {
      throw new Error(error.message);
    }
  }
}

async function fetchSourceDataset(etag: string | null) {
  const headers = new Headers();
  if (etag) {
    headers.set("If-None-Match", etag);
  }

  const response = await fetch(STATIONS_URL, {
    headers,
    cache: "no-store",
    signal: AbortSignal.timeout(30_000),
  });

  if (response.status === 304) {
    return {
      changed: false as const,
      etag: response.headers.get("etag"),
      sourceLastModified: toIsoOrNull(response.headers.get("last-modified")),
      geojson: null,
    };
  }

  if (!response.ok) {
    throw new Error(`Source fetch failed with status ${response.status}`);
  }

  const geojson = (await response.json()) as RemoteStationGeoJson;

  return {
    changed: true as const,
    etag: response.headers.get("etag"),
    sourceLastModified: toIsoOrNull(response.headers.get("last-modified")),
    geojson,
  };
}

async function claimStationSync(datasetId: string, reason: SyncReason) {
  const state = await getStationSyncState();
  const startedAt = new Date().toISOString();

  if (
    state.sync_status === "running" &&
    !isExpired(state.last_started_at, STATION_SYNC_LOCK_TIMEOUT_MS)
  ) {
    return false;
  }

  let query = supabaseAdmin
    .from("station_sync_state")
    .update({
      sync_status: "running",
      running_dataset_id: datasetId,
      last_started_at: startedAt,
      last_sync_reason: reason,
      last_error: null,
      updated_at: startedAt,
    })
    .eq("singleton", true);

  if (state.sync_status === "running") {
    const expiredBefore = new Date(
      Date.now() - STATION_SYNC_LOCK_TIMEOUT_MS
    ).toISOString();

    query = query
      .eq("sync_status", "running")
      .lte("last_started_at", expiredBefore);
  } else {
    query = query.not("sync_status", "eq", "running");
  }

  const { data, error } = await query.select("singleton").maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return Boolean(data);
}

async function markStationSyncChecked(
  changes: Partial<StationSyncStateRow> & { updated_at?: string }
) {
  const updatedAt = changes.updated_at ?? new Date().toISOString();
  const { error } = await supabaseAdmin
    .from("station_sync_state")
    .update({ ...changes, updated_at: updatedAt })
    .eq("singleton", true);

  if (error) {
    throw new Error(error.message);
  }
}

export function shouldQueueStationRefresh(meta: StationFeedMeta) {
  if (!meta.datasetId) {
    return true;
  }

  if (
    meta.syncStatus === "running" &&
    !isExpired(meta.lastStartedAt, STATION_SYNC_LOCK_TIMEOUT_MS)
  ) {
    return false;
  }

  return isExpired(meta.lastCompletedAt, STATION_SYNC_MAX_AGE_MS);
}

export async function getStationFeed(): Promise<StationFeedResponse> {
  const state = await getStationSyncState();
  const datasetVersion = await getStationDatasetVersion(state.active_dataset_id);
  const meta = buildMeta(state, datasetVersion);

  if (!state.active_dataset_id) {
    return { data: null, meta };
  }

  const rows: StationLiveRow[] = [];
  const expectedCount = datasetVersion?.station_count ?? Number.POSITIVE_INFINITY;

  for (let from = 0; from < expectedCount; from += 1000) {
    const to = from + 999;
    const { data, error } = await supabaseAdmin
      .from("stations_live")
      .select(
        "dataset_id, station_key, name, brand, status, address, postal_code, region, latitude, longitude, prices, source_last_modified, imported_at"
      )
      .eq("dataset_id", state.active_dataset_id)
      .order("name", { ascending: true })
      .range(from, to);

    if (error) {
      throw new Error(error.message);
    }

    const batch = (data ?? []) as StationLiveRow[];
    rows.push(...batch);

    if (batch.length < 1000) {
      break;
    }
  }

  return {
    data: hydrateGeoJson(rows),
    meta,
  };
}

export async function syncStations({
  reason,
  force = false,
}: {
  reason: SyncReason;
  force?: boolean;
}): Promise<StationSyncResult> {
  const state = await getStationSyncState();

  if (
    state.sync_status === "running" &&
    !isExpired(state.last_started_at, STATION_SYNC_LOCK_TIMEOUT_MS)
  ) {
    return {
      changed: false,
      datasetId: state.running_dataset_id,
      reason: "already-running",
    };
  }

  if (
    !force &&
    state.active_dataset_id &&
    !isExpired(state.last_completed_at, STATION_SYNC_MAX_AGE_MS)
  ) {
    return {
      changed: false,
      datasetId: state.active_dataset_id,
      reason: "fresh",
    };
  }

  const source = await fetchSourceDataset(state.source_etag);
  const checkedAt = new Date().toISOString();

  if (!source.changed) {
    await markStationSyncChecked({
      last_checked_at: checkedAt,
      source_etag: source.etag ?? state.source_etag,
      source_last_modified:
        source.sourceLastModified ?? state.source_last_modified,
    });

    return {
      changed: false,
      datasetId: state.active_dataset_id,
      reason: "not-modified",
    };
  }

  if (
    state.active_dataset_id &&
    source.etag &&
    state.source_etag === source.etag
  ) {
    await markStationSyncChecked({
      last_checked_at: checkedAt,
      source_last_modified:
        source.sourceLastModified ?? state.source_last_modified,
    });

    return {
      changed: false,
      datasetId: state.active_dataset_id,
      reason: "not-modified",
    };
  }

  const datasetId = randomUUID();
  const importedAt = new Date().toISOString();

  const { error: insertDatasetError } = await supabaseAdmin
    .from("station_dataset_versions")
    .insert({
      id: datasetId,
      status: "running",
      sync_reason: reason,
      source_etag: source.etag,
      source_last_modified: source.sourceLastModified,
      created_at: importedAt,
    });

  if (insertDatasetError) {
    throw new Error(insertDatasetError.message);
  }

  const claimed = await claimStationSync(datasetId, reason);

  if (!claimed) {
    await supabaseAdmin
      .from("station_dataset_versions")
      .delete()
      .eq("id", datasetId);

    return {
      changed: false,
      datasetId,
      reason: "already-running",
    };
  }

  try {
    const { stations, snapshots } = normalizeRemoteGeoJson(
      source.geojson,
      datasetId,
      importedAt,
      source.sourceLastModified
    );

    await batchUpsertStations(stations);
    await batchUpsertSnapshots(snapshots);

    const completedAt = new Date().toISOString();

    const { error: finalizeDatasetError } = await supabaseAdmin
      .from("station_dataset_versions")
      .update({
        status: "ready",
        station_count: stations.length,
        price_snapshot_count: snapshots.length,
        imported_at: completedAt,
      })
      .eq("id", datasetId);

    if (finalizeDatasetError) {
      throw new Error(finalizeDatasetError.message);
    }

    const { error: finalizeStateError } = await supabaseAdmin
      .from("station_sync_state")
      .update({
        active_dataset_id: datasetId,
        running_dataset_id: null,
        sync_status: "ready",
        source_etag: source.etag,
        source_last_modified: source.sourceLastModified,
        last_checked_at: completedAt,
        last_completed_at: completedAt,
        last_error: null,
        updated_at: completedAt,
      })
      .eq("singleton", true)
      .eq("running_dataset_id", datasetId);

    if (finalizeStateError) {
      throw new Error(finalizeStateError.message);
    }

    const { error: cleanupError } = await supabaseAdmin
      .from("stations_live")
      .delete()
      .neq("dataset_id", datasetId);

    if (cleanupError) {
      throw new Error(cleanupError.message);
    }

    return {
      changed: true,
      datasetId,
      reason: "completed",
    };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Station sync failed";

    await supabaseAdmin
      .from("station_dataset_versions")
      .update({
        status: "failed",
        error: message,
      })
      .eq("id", datasetId);

    await supabaseAdmin
      .from("stations_live")
      .delete()
      .eq("dataset_id", datasetId);

    await supabaseAdmin
      .from("station_sync_state")
      .update({
        running_dataset_id: null,
        sync_status: "failed",
        last_error: message,
        updated_at: new Date().toISOString(),
      })
      .eq("singleton", true)
      .eq("running_dataset_id", datasetId);

    throw error;
  }
}
