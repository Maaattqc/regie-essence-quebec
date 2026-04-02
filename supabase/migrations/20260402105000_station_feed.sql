create table if not exists public.station_dataset_versions (
  id text primary key,
  status text not null default 'running'
    check (status in ('running', 'ready', 'failed')),
  sync_reason text,
  source_etag text,
  source_last_modified timestamptz,
  station_count integer not null default 0,
  price_snapshot_count integer not null default 0,
  imported_at timestamptz,
  error text,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.stations_live (
  dataset_id text not null references public.station_dataset_versions(id) on delete cascade,
  station_key text not null,
  name text not null,
  brand text not null,
  status text not null,
  address text not null,
  postal_code text not null,
  region text not null,
  latitude double precision not null,
  longitude double precision not null,
  prices jsonb not null,
  source_last_modified timestamptz,
  imported_at timestamptz not null default timezone('utc', now()),
  primary key (dataset_id, station_key)
);

create index if not exists stations_live_dataset_id_idx
  on public.stations_live(dataset_id);

create table if not exists public.station_sync_state (
  singleton boolean primary key default true check (singleton),
  active_dataset_id text references public.station_dataset_versions(id),
  running_dataset_id text references public.station_dataset_versions(id),
  sync_status text not null default 'idle'
    check (sync_status in ('idle', 'running', 'ready', 'failed')),
  source_etag text,
  source_last_modified timestamptz,
  last_started_at timestamptz,
  last_completed_at timestamptz,
  last_checked_at timestamptz,
  last_sync_reason text,
  last_error text,
  updated_at timestamptz not null default timezone('utc', now())
);

insert into public.station_sync_state (singleton)
values (true)
on conflict (singleton) do nothing;
