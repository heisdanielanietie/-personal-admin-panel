-- ============================================
-- Personal Admin Panel — Supabase setup
-- Run this once in your Supabase project's SQL Editor
-- (Dashboard → SQL Editor → New query → paste → Run)
-- ============================================

create extension if not exists "pgcrypto";

create table projects (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique not null,
  created_at timestamptz default now()
);

create table content_blocks (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references projects(id) on delete cascade,
  key text not null,
  value text default '',
  updated_at timestamptz default now(),
  unique (project_id, key)
);

alter table projects enable row level security;
alter table content_blocks enable row level security;

-- You, logged into the admin panel, get full read/write access
create policy "owner full access - projects"
  on projects for all
  using (auth.role() = 'authenticated');

create policy "owner full access - content"
  on content_blocks for all
  using (auth.role() = 'authenticated');

-- Your LIVE websites (using the public anon key, no login) can only read
create policy "public read - content"
  on content_blocks for select
  using (true);
