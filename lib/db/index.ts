import 'server-only';
import { isSupabaseConfigured } from '@/lib/config/env';
import { createLocalRepository } from '@/lib/db/localRepository';
import { createSupabaseRepository } from '@/lib/db/supabaseRepository';
import type { ArticleRepository } from '@/lib/db/repository';

let repository: ArticleRepository | null = null;

/**
 * Picks the backend once per process: Supabase when its URL and service-role
 * key are present, otherwise the local JSON store.
 */
export function getRepository(): ArticleRepository {
  if (!repository) {
    repository = isSupabaseConfigured()
      ? createSupabaseRepository()
      : createLocalRepository();
  }
  return repository;
}

export type { ArticleRepository } from '@/lib/db/repository';
