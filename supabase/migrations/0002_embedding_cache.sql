create table if not exists public.article_embedding_cache (
  id text primary key,
  embedding jsonb not null,
  created_at timestamptz not null default now()
);
alter table public.article_embedding_cache enable row level security;
revoke all on public.article_embedding_cache from anon, authenticated;
grant select, insert, update, delete on public.article_embedding_cache to service_role;
