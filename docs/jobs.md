# Live aidisha.pulse Jobs

Jobs now come from public employer APIs, not the former hand-maintained sample catalog.

## Sources and refresh
- Greenhouse Job Board API: Karya and Graphcore Early Careers.
- Lever Postings API: APPLY, Future of Life Organizations, and Welo Global / Welo Data.
- Configure the employer allowlist in `lib/jobs/sources.ts`. No API keys are needed for these public GET feeds.
- `lib/jobs/live.ts` fetches all Lever pages and Greenhouse job-board content on the server.
  Requests have a 45-second source timeout, shape validation, an in-flight request lock,
  and a 15-minute per-process cache. On expiry, the next request fetches again.
- Open browser tabs refresh through `GET /api/jobs` every 15 minutes while visible,
  and on return after 15 minutes. The Refresh jobs button checks the current server
  snapshot; it does not bypass the provider cache.
- Fetch times are shown accurately. This is request-driven refresh, not a scheduled
  background collector or a guarantee that employers promptly remove closed jobs.
- Failed sources contribute no listings and are identified in the UI; retries back off
  for 30 seconds. An empty successful feed removes that source's previous listings.
  There is no fallback to the former manual listings. Total provider failure returns 503.

## Normalization and scope
`lib/jobs/normalize.ts` derives sections from explicit commitment fields and internship
titles, and remote/hybrid status from workplace or location metadata. Unknown employment
types are not assumed full-time. AI relevance is based on the role/team, not generic
company AI text. General applications and clearly labeled talent pipelines are excluded.
Coverage is limited to connected employers and classifiable postings, not every AI job.

Country metadata and known location names drive country filters. Remote alone never
means worldwide; global availability must be explicit in the listed location. Country
labels do not assert work authorization. Always link readers to employer requirements.

Descriptions are short plain-text excerpts. HTML is never injected. Salary appears only
when currency, interval, and both bounds are provided. Missing posting dates stay missing;
provider update times are not treated as publication times. Original-source links use HTTPS.

## Details and saves
- `/jobs/[id]` reads the same live feed and offers the original employer application link.
  Missing listings return a useful 404; unavailable providers display a retry error.
- Stable source/posting IDs preserve saves across refreshes. The five old manual IDs
  migrate to their matching API IDs. Saves remain in `ai-pulse-saved-jobs` localStorage.
- Saved IDs absent from current feeds remain stored and are reported as unavailable;
  an outage is not silently described as a confirmed closure.
- Search, filters, pagination, dark mode, mobile layout, and browser Back remain local
  and preserve the existing Jobs UI.
- Old sample records now exist only as deterministic fixtures in `tests/fixtures/jobs.ts`.

API references:
- https://docs.greenhouse.io/job-board.html
- https://github.com/lever/postings-api
