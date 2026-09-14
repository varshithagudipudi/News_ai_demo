import 'server-only';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { createClient } from '@supabase/supabase-js';
import { getEnv, isSupabaseConfigured } from '@/lib/config/env';

// Separate cache records avoid changing article rows or requiring pgvector.
export function createEmbeddingCache() {
  const env = getEnv();
  const db = isSupabaseConfigured()
    ? createClient(env.NEXT_PUBLIC_SUPABASE_URL!, env.SUPABASE_SERVICE_ROLE_KEY!, {
        auth: { persistSession: false, autoRefreshToken: false },
      })
    : null;
  const directory = path.join(process.cwd(), '.data', 'embeddings');
  return {
    async get(key: string): Promise<unknown> {
      if (db) {
        const { data, error } = await db.from('article_embedding_cache')
          .select('embedding').eq('id', key).maybeSingle();
        if (error) throw new Error('Embedding cache unavailable; apply migration 0002.');
        return data?.embedding;
      }
      try { return JSON.parse(await readFile(path.join(directory, key + '.json'), 'utf8')); }
      catch (error) {
        if ((error as NodeJS.ErrnoException).code === 'ENOENT') return null;
        throw error;
      }
    },
    async set(key: string, embedding: number[]) {
      if (db) {
        const { error } = await db.from('article_embedding_cache').upsert({ id: key, embedding });
        if (error) throw new Error('Embedding cache write failed.');
      } else {
        await mkdir(directory, { recursive: true });
        await writeFile(path.join(directory, key + '.json'), JSON.stringify(embedding));
      }
    },
  };
}
