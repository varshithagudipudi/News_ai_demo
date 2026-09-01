# AI Pulse

A proof-of-concept news aggregator for artificial intelligence and startup
stories. It collects headlines from the GNews API on a schedule, categorises and
deduplicates them, and shows them as responsive cards that link out to the
original publisher.

**AI Pulse does not host or republish articles.** It stores only metadata —
headline, short description, publisher, publication date, an image URL where the
provider permits it, and the original link.

---

## Contents

- [What is in the box](#what-is-in-the-box)
- [Requirements](#requirements)
- [Local setup](#local-setup)
- [Environment variables](#environment-variables)
- [Database](#database)
- [Running news collection manually](#running-news-collection-manually)
- [The automated schedule](#the-automated-schedule)
- [Optional AI enrichment](#optional-ai-enrichment)
- [API reference](#api-reference)
- [Project structure](#project-structure)
- [Verification commands](#verification-commands)
- [Deployment](#deployment)
- [Known limitations](#known-limitations)

---

## What is in the box

| Area | Detail |
| --- | --- |
| Framework | Next.js 15 (App Router) + React 19 + TypeScript |
| Styling | Tailwind CSS 3 with CSS-variable design tokens, light/dark themes |
| Validation | Zod, on API queries and on every article before storage |
| Storage | Supabase Postgres, **or** a zero-setup local JSON store |
| Provider | GNews Search API (server-side only) |
| Scheduling | Vercel Cron, plus a protected endpoint you can call by hand |
| Tests | Vitest — 64 unit tests across 7 files |

Features: category navigation, featured story, search, sort, pagination,
bookmarks in `localStorage`, skeleton/empty/error/image-failure states, keyboard
focus styles and reduced-motion support.

---

## Requirements

- Node.js 20.9 or newer (developed on 20.19)
- npm 10 or newer
- A GNews API key — only needed for real collection, not to run the UI

---

## Local setup

```bash
npm install
cp .env.example .env.local     # Windows PowerShell: copy .env.example .env.local
npm run db:seed                # loads development fixtures into .data/articles.json
npm run dev                    # http://localhost:3000
```

That is enough to see the whole application working. With no Supabase
credentials set, AI Pulse automatically uses the local JSON store at
`.data/articles.json`, so nothing needs provisioning.

`npm run db:seed -- --reset` clears the store before seeding.

The fixture records are clearly labelled `Sample:` and point at `example.com`.
They exist only for UI work and are **never** inserted by a collection run.

---

## Environment variables

Copy `.env.example` to `.env.local` and fill in what you need. Names only are
shown here — never commit real values.

| Variable | Required | Purpose |
| --- | --- | --- |
| `GNEWS_API_KEY` | for collection | GNews search key. Server-only. |
| `CRON_SECRET` | for collection | Bearer token the collection endpoint demands. Server-only. |
| `NEXT_PUBLIC_SUPABASE_URL` | optional | Supabase project URL. |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | optional | Supabase anon key (browser-safe). |
| `SUPABASE_SERVICE_ROLE_KEY` | optional | Supabase service-role key. Server-only. |
| `AI_ENRICHMENT_ENABLED` | optional | `true` to turn on AI enrichment. Default `false`. |
| `OPENAI_API_KEY` | optional | Only read when enrichment is enabled. Server-only. |
| `OPENAI_MODEL` | optional | Default `gpt-4o-mini`. |
| `AI_MAX_ENRICHMENTS_PER_RUN` | optional | Cost ceiling per run. Default `25`. |
| `COLLECT_ARTICLES_PER_CATEGORY` | optional | Provider results requested per category. Default `10`. |
| `COLLECT_MAX_AGE_HOURS` | optional | Only accept articles this recent. Default `72`. |

Rules enforced in the code:

- Server-only values never carry the `NEXT_PUBLIC_` prefix.
- `lib/config/env.ts`, the database modules, the GNews client and the AI module
  all `import 'server-only'`, so importing them from a client component is a
  **build error**, not a runtime surprise.
- Secrets are never returned in a response, written to a log line, or included
  in an error message.

Supabase is used only when **both** `NEXT_PUBLIC_SUPABASE_URL` and
`SUPABASE_SERVICE_ROLE_KEY` are present. Otherwise the local store is used.

---

## Database

### Option A — local JSON store (default, no setup)

Leave the Supabase variables blank. Articles are written to
`.data/articles.json`, which is gitignored. Good for development and demos; not
intended for production.

### Option B — Supabase Postgres

1. Create a Supabase project.
2. Open **SQL Editor** and run the contents of
   [`supabase/migrations/0001_init.sql`](supabase/migrations/0001_init.sql).
   With the Supabase CLI instead: `supabase db push`.
3. Put the project URL, anon key and service-role key into `.env.local`.
4. Restart the dev server.

The migration creates:

- `articles` — the schema from the specification, with a unique constraint on
  `article_url` and indexes on `(category, published_at)`, `published_at`,
  `normalized_title` and `(normalized_title, source_name)`.
- `collection_locks` — one row per in-flight run, so two runs cannot overlap.
- Row Level Security: `articles` is publicly **readable** only; all writes
  require the service-role key. `collection_locks` has no policies at all, so it
  is unreachable from the browser.

---

## Running news collection manually

You need `GNEWS_API_KEY` and `CRON_SECRET` in `.env.local`.

**From the command line** (does not need the server running):

```bash
npm run collect:local
```

**Through the HTTP endpoint** (server must be running):

```bash
# PowerShell
curl.exe -X POST http://localhost:3000/api/internal/collect-news `
  -H "Authorization: Bearer YOUR_CRON_SECRET"

# bash
curl -X POST http://localhost:3000/api/internal/collect-news \
  -H "Authorization: Bearer $CRON_SECRET"
```

A successful run returns a structured summary:

```json
{
  "runId": "…",
  "startedAt": "…",
  "finishedAt": "…",
  "durationMs": 4210,
  "fetched": 80, "inserted": 34, "skipped": 31, "duplicate": 15,
  "failed": 0, "enriched": 0,
  "categories": [
    { "category": "generative-ai", "fetched": 10, "inserted": 6,
      "skipped": 3, "duplicate": 1, "failed": 0 }
  ]
}
```

Responses you should expect:

| Status | Meaning |
| --- | --- |
| `200` | Run finished. Check `categories[]` for per-category errors. |
| `401` | Missing, malformed or wrong `Authorization` header. |
| `409` | Another run holds the lock. |
| `429` | More than 4 manual runs in 10 minutes. |
| `503` | `CRON_SECRET` is not configured on this deployment. |

### What a run actually does

1. Acquire the `collect-news` lock (5-minute TTL, so a crashed run self-heals).
2. Query GNews once per category, with a 10s timeout, up to 3 attempts and
   exponential backoff. `Retry-After` is honoured on 429.
3. Map each result: reject anything without a title, a parseable publication
   date, or an `https` article URL.
4. Reject job ads, sports, horoscopes, coupon spam, and bare unsupported "AI"
   mentions.
5. Sanitise control characters and truncate to the field limits.
6. Normalise URLs (drop ~35 known tracking parameters, sort the rest, lowercase
   the host, drop the fragment) and normalise titles for comparison.
7. Deduplicate: canonical URL first, then normalised title + publisher within a
   48-hour window.
8. Score relevance deterministically; anything under the threshold is dropped.
9. Optionally enrich with AI (see below).
10. Insert. Existing rows are never overwritten with empty values — only null
    columns are backfilled, and `relevance_score` only moves up.
11. Release the lock and log a structured summary.

**A failure in one category does not stop the others** — it is recorded in that
category's `error` field and the run continues.

---

## The automated schedule

[`vercel.json`](vercel.json) registers a Vercel Cron job:

```json
{ "path": "/api/internal/collect-news", "schedule": "30 0,6,12,18 * * *" }
```

Four runs a day. Cron schedules on Vercel are **UTC**:

| UTC | India (IST, UTC+5:30) |
| --- | --- |
| 00:30 | 06:00 |
| 06:30 | 12:00 |
| 12:30 | 18:00 |
| 18:30 | 00:00 (next day) |

At the default 10 articles × 8 categories, that is 32 provider requests per day
— comfortably inside the GNews free tier's 100/day.

Change the cadence by editing the `schedule` field; change the volume with
`COLLECT_ARTICLES_PER_CATEGORY`.

Vercel Cron sends `Authorization: Bearer $CRON_SECRET` as a `GET`. The route
accepts both `GET` and `POST` with the same authorisation check.

> **Licensing:** the GNews free plan is for development and testing only, and
> may return delayed results. A production deployment needs a GNews plan (or
> another provider) whose licence permits production use and whose terms cover
> how you display headlines, descriptions and images.

---

## Optional AI enrichment

Off by default. The application is fully functional without an AI key.

Set `AI_ENRICHMENT_ENABLED=true` and provide `OPENAI_API_KEY` to enable it.

- Runs **after** deterministic validation and deduplication, never before.
- Sends only the headline, provider description, publisher name and the
  provisional category. Never full article text — nothing is scraped.
- Requests strict structured output: `isRelevant`, `category`, `summary`,
  `tags`, `relevanceScore`. The response is re-validated with Zod, and the
  category must be one of the configured slugs.
- The prompt forbids inventing numbers, quotations or events, and instructs the
  model to preserve the provider description when metadata is too thin.
- Results are cached by a hash of the metadata sent.
- `AI_MAX_ENRICHMENTS_PER_RUN` caps cost per run.
- **Any failure returns null** and the deterministically processed article is
  stored anyway. AI problems never fail ingestion.

---

## API reference

### `GET /api/articles`

| Parameter | Type | Default | Notes |
| --- | --- | --- | --- |
| `category` | slug | `all` | Must be a configured slug. |
| `search` | string | – | Case-insensitive, title and description. |
| `sort` | `newest` \| `oldest` | `newest` | |
| `page` | integer ≥ 1 | `1` | |
| `limit` | integer 1–48 | `12` | |

```json
{
  "data": [],
  "pagination": { "page": 1, "limit": 12, "total": 0, "totalPages": 0 }
}
```

Invalid parameters return `400` with:

```json
{ "error": { "code": "INVALID_QUERY", "message": "…", "details": {} } }
```

### `POST /api/internal/collect-news`

Server-only ingestion endpoint. Also accepts `GET` for Vercel Cron. See
[Running news collection manually](#running-news-collection-manually).

---

## Project structure

```text
app/
  api/articles/route.ts               GET /api/articles
  api/internal/collect-news/route.ts  protected ingestion endpoint
  layout.tsx  page.tsx  saved/page.tsx  globals.css
components/                           Header, cards, grid, nav, states, …
lib/
  ai/enrichArticle.ts                 optional structured enrichment
  api/rateLimit.ts  api/response.ts
  config/categories.ts                categories live here, and only here
  config/site.ts                      product name lives here, and only here
  config/env.ts                       validated server-only environment access
  db/repository.ts                    storage contract
  db/localRepository.ts               JSON store
  db/supabaseRepository.ts            Supabase store
  db/index.ts  db/articles.ts
  fixtures/articles.ts                development fixtures
  news/collectNews.ts                 pipeline orchestration
  news/deduplicate.ts  news/gnewsClient.ts
  news/normalize.ts  news/relevance.ts
  validation/article.ts               Zod schemas
scripts/seed.ts  scripts/collect.ts
supabase/migrations/0001_init.sql
tests/
```

To change the product name, edit `siteConfig.name` in `lib/config/site.ts`.
To add or reorder categories, edit `lib/config/categories.ts`.
To tune relevance, edit `RELEVANCE_WEIGHTS` in `lib/news/relevance.ts` — the
weights are covered by unit tests.

---

## Verification commands

```bash
npm run lint         # ESLint
npm run typecheck    # tsc --noEmit
npm run test         # Vitest
npm run build        # production build
```

---

## Deployment

1. Push the repository to GitHub and import it into Vercel.
2. Add every environment variable from the table above to the Vercel project.
3. Deploy. `vercel.json` registers the cron job automatically.
4. Run one collection manually against the deployed URL to confirm the key and
   secret are correct.

Vercel Cron is available on the Hobby plan at a limited frequency; check your
plan's cron limits if all four daily runs matter.

---

## Known limitations

These are deliberate POC boundaries, not defects:

- **No Playwright end-to-end test.** Unit coverage is thorough (64 tests) but no
  browser-driven flow test is included, to avoid a large browser download in the
  POC. Adding one for "load home → filter → bookmark → open saved" is the
  obvious next step.
- **Local JSON store is single-instance.** It is fine for development, but a
  real deployment should use Supabase.
- **Rate limiting is in-process.** It resets on redeploy and is per-instance.
  The collection lock, not the rate limiter, is what prevents overlapping runs.
- **Bookmarks are per-browser.** No account, no sync — stated in the UI.
- **The featured story is picked from the current first page**, so on page 1 the
  grid shows 11 cards rather than 12 while pagination counts all 12.
- **No admin dashboard.** Run summaries go to the server log and the endpoint
  response only.
- **GNews free tier** returns delayed results and is licensed for development
  and testing only.
- **Images are hot-linked** from publishers with `referrerPolicy="no-referrer"`
  and a graceful fallback. Confirm this matches your provider agreement before
  going to production.

### Recommended next steps

1. Add the Playwright flow test and wire all four checks into CI.
2. Move to Supabase and add a `collection_runs` table for run history.
3. Replace the in-process rate limiter with a shared store (Upstash/Redis).
4. Add per-source caps so one prolific publisher cannot dominate a category.
5. Revisit provider licensing before any public launch.
