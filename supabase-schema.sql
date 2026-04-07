-- IM Content System — Supabase Schema
-- Run this in the Supabase SQL editor to create all required tables.

-- 1. Clients
create table if not exists clients (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  website text default '',
  niche text default '',
  locations text default '',
  services text default '',
  target_audience text default '',
  tone_notes text default '',
  special_rules text default '',
  system_prompt text default '',
  created_at timestamptz not null default now()
);

-- 2. Generation History
create table if not exists generation_history (
  id uuid primary key default gen_random_uuid(),
  client_id uuid references clients(id) on delete set null,
  client_name text not null,
  keyword text not null,
  content_type text not null,
  content_versions jsonb default '{}'::jsonb,
  files_count integer default 0,
  created_at timestamptz not null default now()
);

-- 3. Report Folders
create table if not exists report_folders (
  id uuid primary key default gen_random_uuid(),
  month text not null,
  client_name text not null,
  topic text not null,
  created_at timestamptz not null default now()
);

-- 4. App Settings (API key and other admin config)
create table if not exists app_settings (
  id uuid primary key default gen_random_uuid(),
  key text not null unique,
  value text not null default '',
  created_at timestamptz not null default now()
);

-- Disable RLS so all authenticated app users share the same data
-- (App has its own JWT auth layer separate from Supabase auth)
alter table clients disable row level security;
alter table generation_history disable row level security;
alter table report_folders disable row level security;
alter table app_settings disable row level security;
