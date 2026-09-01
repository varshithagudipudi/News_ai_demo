import 'server-only';
import { z } from 'zod';

/**
 * Server-only environment access.
 *
 * Nothing here may be imported from a client component — the `server-only`
 * guard turns any such import into a build error. Values are read lazily so a
 * missing optional key never breaks `next build`; the code paths that need a
 * key ask for it and fail with a clear message at request time.
 */

const optionalString = z
  .string()
  .trim()
  .min(1)
  .optional()
  .catch(undefined);

const booleanFlag = z
  .string()
  .trim()
  .toLowerCase()
  .transform((value) => value === 'true' || value === '1')
  .catch(false);

const positiveInt = (fallback: number) =>
  z.coerce.number().int().positive().catch(fallback);

const envSchema = z.object({
  GNEWS_API_KEY: optionalString,
  NEXT_PUBLIC_SUPABASE_URL: optionalString,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: optionalString,
  SUPABASE_SERVICE_ROLE_KEY: optionalString,
  CRON_SECRET: optionalString,
  AI_ENRICHMENT_ENABLED: booleanFlag,
  OPENAI_API_KEY: optionalString,
  OPENAI_MODEL: z.string().trim().min(1).catch('gpt-4o-mini'),
  AI_MAX_ENRICHMENTS_PER_RUN: positiveInt(25),
  COLLECT_ARTICLES_PER_CATEGORY: positiveInt(10),
  COLLECT_MAX_AGE_HOURS: positiveInt(72),
});

export type Env = z.infer<typeof envSchema>;

let cached: Env | null = null;

export function getEnv(): Env {
  if (!cached) {
    cached = envSchema.parse({
      GNEWS_API_KEY: process.env.GNEWS_API_KEY,
      NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
      NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
      CRON_SECRET: process.env.CRON_SECRET,
      AI_ENRICHMENT_ENABLED: process.env.AI_ENRICHMENT_ENABLED,
      OPENAI_API_KEY: process.env.OPENAI_API_KEY,
      OPENAI_MODEL: process.env.OPENAI_MODEL,
      AI_MAX_ENRICHMENTS_PER_RUN: process.env.AI_MAX_ENRICHMENTS_PER_RUN,
      COLLECT_ARTICLES_PER_CATEGORY:
        process.env.COLLECT_ARTICLES_PER_CATEGORY,
      COLLECT_MAX_AGE_HOURS: process.env.COLLECT_MAX_AGE_HOURS,
    });
  }
  return cached;
}

/** Reads a required server secret, throwing a message that never echoes it. */
export function requireEnv(key: keyof Env): string {
  const value = getEnv()[key];
  if (typeof value !== 'string' || value.length === 0) {
    throw new Error(
      `Missing required environment variable ${key}. Add it to .env.local (see .env.example).`,
    );
  }
  return value;
}

export function isSupabaseConfigured(): boolean {
  const env = getEnv();
  return Boolean(
    env.NEXT_PUBLIC_SUPABASE_URL && env.SUPABASE_SERVICE_ROLE_KEY,
  );
}

export function isAiEnrichmentEnabled(): boolean {
  const env = getEnv();
  return env.AI_ENRICHMENT_ENABLED && Boolean(env.OPENAI_API_KEY);
}
