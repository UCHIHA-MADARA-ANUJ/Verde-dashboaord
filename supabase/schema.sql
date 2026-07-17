-- Project Verde V3.0 Supabase Schema
-- Run this in Supabase SQL Editor after creating the project.

create extension if not exists pgcrypto;

-- 1. Core node registry
create table if not exists public.verde_nodes (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  display_name text not null,
  owner_label text default 'DAV ACON 5 Demo Team',
  location_label text default 'Delhi, India',
  node_api_key_hash text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 2. Current sensor snapshot: dashboard reads this for instant status
create table if not exists public.node_current_state (
  node_id uuid primary key references public.verde_nodes(id) on delete cascade,
  moisture numeric not null default 0 check (moisture >= 0 and moisture <= 100),
  temperature numeric not null default 0,
  humidity numeric not null default 0 check (humidity >= 0 and humidity <= 100),
  tank_level numeric not null default 0 check (tank_level >= 0 and tank_level <= 100),
  light_lux integer not null default 0,
  soil_raw integer,
  rssi integer,
  firmware_version text,
  updated_at timestamptz not null default now()
);

-- 3. Historical sensor readings: dashboard charts and judging proof
create table if not exists public.sensor_readings (
  id bigint generated always as identity primary key,
  node_id uuid not null references public.verde_nodes(id) on delete cascade,
  moisture numeric not null check (moisture >= 0 and moisture <= 100),
  temperature numeric not null,
  humidity numeric not null check (humidity >= 0 and humidity <= 100),
  tank_level numeric not null check (tank_level >= 0 and tank_level <= 100),
  light_lux integer not null default 0,
  soil_raw integer,
  rssi integer,
  created_at timestamptz not null default now()
);
create index if not exists sensor_readings_node_time_idx on public.sensor_readings(node_id, created_at desc);

-- 4. Hardware control state: app writes, ESP32 reads
create table if not exists public.control_state (
  node_id uuid primary key references public.verde_nodes(id) on delete cascade,
  manual_mode boolean not null default false,
  pump_state boolean not null default false,
  relay2_state boolean not null default false,
  capture_photo boolean not null default false,
  moisture_threshold integer not null default 42 check (moisture_threshold between 0 and 100),
  weather_override boolean not null default false,
  emergency_stop boolean not null default false,
  updated_at timestamptz not null default now()
);

-- 5. Auditable command events: optional, shows judges every app action
create table if not exists public.command_events (
  id bigint generated always as identity primary key,
  node_id uuid not null references public.verde_nodes(id) on delete cascade,
  command text not null,
  payload jsonb not null default '{}'::jsonb,
  source text not null default 'dashboard',
  created_at timestamptz not null default now()
);
create index if not exists command_events_node_time_idx on public.command_events(node_id, created_at desc);

-- 6. Camera captures: Supabase Storage file metadata
create table if not exists public.camera_captures (
  id bigint generated always as identity primary key,
  node_id uuid not null references public.verde_nodes(id) on delete cascade,
  storage_path text not null,
  public_url text,
  byte_size integer,
  ai_status text not null default 'pending',
  created_at timestamptz not null default now()
);
create index if not exists camera_captures_node_time_idx on public.camera_captures(node_id, created_at desc);

-- 7. AI diagnosis output
create table if not exists public.ai_diagnoses (
  id bigint generated always as identity primary key,
  node_id uuid not null references public.verde_nodes(id) on delete cascade,
  capture_id bigint references public.camera_captures(id) on delete set null,
  plant_name text,
  disease_name text,
  confidence numeric,
  severity text,
  summary text,
  treatment_steps jsonb not null default '[]'::jsonb,
  raw_response jsonb,
  created_at timestamptz not null default now()
);
create index if not exists ai_diagnoses_node_time_idx on public.ai_diagnoses(node_id, created_at desc);

-- Updated-at helper
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_verde_nodes_updated_at on public.verde_nodes;
create trigger set_verde_nodes_updated_at before update on public.verde_nodes for each row execute function public.set_updated_at();

drop trigger if exists set_control_state_updated_at on public.control_state;
create trigger set_control_state_updated_at before update on public.control_state for each row execute function public.set_updated_at();

-- Demo seed IDs. Keep these aligned with .env.example.
insert into public.verde_nodes (id, slug, display_name)
values ('11111111-1111-1111-1111-111111111111', 'aarav-node-1', 'Aarav Physical Bench Node')
on conflict (id) do update set slug = excluded.slug, display_name = excluded.display_name;

insert into public.node_current_state (node_id, moisture, temperature, humidity, tank_level, light_lux, soil_raw, rssi, firmware_version)
values ('11111111-1111-1111-1111-111111111111', 37, 28.4, 62, 74, 486, 2870, -53, 'mock-v0')
on conflict (node_id) do nothing;

insert into public.control_state (node_id, manual_mode, pump_state, relay2_state, capture_photo, moisture_threshold, weather_override, emergency_stop)
values ('11111111-1111-1111-1111-111111111111', false, false, false, false, 42, false, false)
on conflict (node_id) do nothing;

-- Storage bucket for plant captures. Private by default; app can create signed URLs later.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('plant-captures', 'plant-captures', false, 5242880, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update set public = false, file_size_limit = 5242880, allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp'];

-- Row Level Security
alter table public.verde_nodes enable row level security;
alter table public.node_current_state enable row level security;
alter table public.sensor_readings enable row level security;
alter table public.control_state enable row level security;
alter table public.command_events enable row level security;
alter table public.camera_captures enable row level security;
alter table public.ai_diagnoses enable row level security;

-- Exhibition/demo policies: anon can read dashboard data and update controls for demo node.
-- For production, replace with authenticated user ownership policies.
drop policy if exists "demo read nodes" on public.verde_nodes;
create policy "demo read nodes" on public.verde_nodes for select using (true);

drop policy if exists "demo read current" on public.node_current_state;
create policy "demo read current" on public.node_current_state for select using (true);

drop policy if exists "demo read readings" on public.sensor_readings;
create policy "demo read readings" on public.sensor_readings for select using (true);

drop policy if exists "demo read controls" on public.control_state;
create policy "demo read controls" on public.control_state for select using (true);

drop policy if exists "demo update controls" on public.control_state;
create policy "demo update controls" on public.control_state for update using (true) with check (true);

drop policy if exists "demo insert command events" on public.command_events;
create policy "demo insert command events" on public.command_events for insert with check (true);

drop policy if exists "demo read command events" on public.command_events;
create policy "demo read command events" on public.command_events for select using (true);

drop policy if exists "demo read captures" on public.camera_captures;
create policy "demo read captures" on public.camera_captures for select using (true);

drop policy if exists "demo read diagnoses" on public.ai_diagnoses;
create policy "demo read diagnoses" on public.ai_diagnoses for select using (true);

-- NOTE: Hardware inserts should ultimately go through a secure Next.js API route or Supabase Edge Function
-- using SUPABASE_SERVICE_ROLE_KEY + VERDE_NODE_API_KEY, not browser anon permissions.
