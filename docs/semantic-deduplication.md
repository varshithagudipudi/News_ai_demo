# Semantic duplicate detection

Collection and `scripts/previewDuplicates.ts` now share the same pipeline:

1. Match canonical URLs or exact normalized titles (titles within 72 hours).
2. Embed headline and description using `gemini-embedding-001`.
3. Retrieve up to three retained articles within 72 hours with cosine similarity
   at least 0.65. This is a starting retrieval threshold, not a calibrated accuracy score.
4. Ask `GEMINI_DEDUP_MODEL` to compare the headlines, descriptions and publication
   dates. Skip only `same_event`; keep `different_event` and `uncertain`.

The earlier synonym-based matcher in `lib/news/deduplicate.ts` is no longer used
by collection or the preview. It cannot bypass semantic confirmation.

## Enable

For Supabase, run `supabase/migrations/0002_embedding_cache.sql` in the project's
SQL Editor. It creates an RLS-protected cache accessible only to the service role.
No vector extension is needed. Local storage uses `.data/embeddings/` instead.

Add to `.env.local` and your deployment's server environment:

```dotenv
AI_DEDUP_ENABLED=true
GEMINI_DEDUP_MODEL=gemini-3.1-flash-lite
GEMINI_API_KEY=your-existing-or-new-key
```

Use your actual key, and do not overwrite an existing key with this placeholder.
This feature is independent of `AI_ENRICHMENT_ENABLED`. Restart the app after
changing environment variables. Without the flag and key, collection performs
only URL/exact-title checks and logs that semantic checking is disabled.

## Review existing stories

```powershell
npx tsx --conditions=react-server scripts/previewDuplicates.ts
```

This uses Gemini embedding and confirmation API quotas. Use a free-tier Google project without paid billing to avoid API charges. If quota is exhausted, the scan stops semantic checks and marks the preview incomplete. It reads articles and
writes cache entries plus `.data/duplicate-preview.json`; it never deletes articles.
Each `matches` entry includes the duplicate, retained counterpart, similarity
and reason. `proposedDeletions` remains available for existing review workflows.
Check `complete` and `warnings` before interpreting the report. Do not reuse old
deletion SQL for a new preview; review the new pairs and back up before cleanup.

## Limits and verification

Embeddings are cached by model and exact input, so content changes get a new
embedding. Publication dates restrict comparisons and are sent to confirmation,
but are not embedded. Persistent cache entries can be pruned separately if needed.

Collection permits 40 confirmation requests and 60 seconds of semantic work per
run; each API request times out after 12 seconds, so an in-flight request can
finish after the budget. A cold cache may require several collection runs to
populate; the preview allows 1,500 confirmations and 30 minutes and can warm it.
On a failed API/cache operation or exhausted budget, remaining articles are kept
and a warning is emitted. This can leave duplicates for a later preview.

Automated tests mock embeddings and AI decisions. They cover the BCCI pair's
routing, distinct developments, uncertain results, time boundaries, cache reuse,
bad API responses and failure behavior. They do not establish real model accuracy.
Review actual BCCI pairs and a sample of distinct follow-ups in the live preview
before trusting automatic decisions. Neither embeddings nor confirmation are perfect.

API formats follow the official [embeddings guide](https://ai.google.dev/gemini-api/docs/embeddings)
and [structured outputs guide](https://ai.google.dev/gemini-api/docs/generate-content/structured-output).

