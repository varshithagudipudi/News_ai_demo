-- AI Pulse — initial schema.
-- Run in the Supabase SQL editor, or with `supabase db push`.

create extension if not exists "pgcrypto";

create table if not exists public.articles (
  id                  uuid primary key default gen_random_uuid(),
  title               text        not null,
  normalized_title    text        not null,
  description         text,
  category            text        not null,
  image_url           text,
  source_name         text        not null,
  source_url          text,
  article_url         text        not null unique,
  published_at        timestamptz not null,
  collected_at        timestamptz not null default now(),
  relevance_score     integer     not null default 0,
  is_featured         boolean     not null default false,
  provider            text        not null,
  provider_article_id text,
  raw_metadata        jsonb
);

create index if not exists articles_category_published_at_idx
  on public.articles (category, published_at desc);

create index if not exists articles_published_at_idx
  on public.articles (published_at desc);

create index if not exists articles_normalized_title_idx
  on public.articles (normalized_title);

-- Secondary duplicate check: same headline from the same publisher.
create index if not exists articles_normalized_title_source_idx
  on public.articles (normalized_title, source_name);

-- Advisory lock rows so overlapping collection runs cannot both proceed.
create table if not exists public.collection_locks (
  name       text primary key,
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);

-- Row level security -------------------------------------------------------
-- The browser never writes. Reads go through the server route, but RLS is
-- enabled anyway so a leaked anon key cannot be used to modify data.

alter table public.articles enable row level security;
alter table public.collection_locks enable row level security;

drop policy if exists "articles are publicly readable" on public.articles;
create policy "articles are publicly readable"
  on public.articles
  for select
  to anon, authenticated
  using (true);

-- No insert/update/delete policies: only the service-role key (which bypasses
-- RLS) may write. `collection_locks` has no policies at all, so it is
-- server-only in every respect.
