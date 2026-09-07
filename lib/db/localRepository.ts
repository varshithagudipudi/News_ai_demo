import 'server-only';
import { randomUUID } from 'node:crypto';
import { mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import path from 'node:path';
import type { Article, ArticleQuery } from '@/lib/types/article';
import type { ValidatedNewArticle } from '@/lib/validation/article';
import type {
  ArticleFingerprint,
  ArticleRepository,
  InsertResult,
  ListResult,
} from '@/lib/db/repository';

/**
 * Zero-setup development store: a JSON file under `.data/`. It exists so the
 * POC runs end to end without provisioning Supabase, and implements exactly the
 * same contract. It is not intended for production use.
 */

const DATA_DIR = path.join(process.cwd(), '.data');
const ARTICLES_FILE = path.join(DATA_DIR, 'articles.json');
const LOCKS_FILE = path.join(DATA_DIR, 'locks.json');

interface LockRecord {
  expiresAt: number;
}

/** All writes funnel through this chain so concurrent requests cannot interleave. */
let writeQueue: Promise<unknown> = Promise.resolve();

function serialize<T>(operation: () => Promise<T>): Promise<T> {
  const result = writeQueue.then(operation, operation);
  writeQueue = result.catch(() => undefined);
  return result;
}

async function readJson<T>(file: string, fallback: T): Promise<T> {
  try {
    const raw = await readFile(file, 'utf8');
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

async function writeJson(file: string, value: unknown): Promise<void> {
  await mkdir(DATA_DIR, { recursive: true });
  // Write-then-rename keeps the file readable if the process dies mid-write.
  const temp = `${file}.${randomUUID()}.tmp`;
  await writeFile(temp, JSON.stringify(value, null, 2), 'utf8');
  await rename(temp, file);
}

function readArticles(): Promise<Article[]> {
  return readJson<Article[]>(ARTICLES_FILE, []);
}

function matchesSearch(article: Article, search: string): boolean {
  const needle = search.toLowerCase();
  return (
    article.title.toLowerCase().includes(needle) ||
    (article.description ?? '').toLowerCase().includes(needle)
  );
}

export function createLocalRepository(): ArticleRepository {
  return {
    name: 'local-json',

    async list(query: ArticleQuery): Promise<ListResult> {
      const all = await readArticles();

      const filtered = all.filter((article) => {
        if (query.category !== 'all' && article.category !== query.category) {
          return false;
        }
        if (query.search && !matchesSearch(article, query.search)) {
          return false;
        }
        if (
          query.startDate &&
          new Date(article.publishedAt).getTime() <
            new Date(query.startDate).getTime()
        ) {
          return false;
        }
        if (
          query.endDate &&
          new Date(article.publishedAt).getTime() >=
            new Date(query.endDate).getTime()
        ) {
          return false;
        }
        return true;
      });

      filtered.sort((a, b) => {
        const diff =
          new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime();
        return query.sort === 'newest' ? diff : -diff;
      });

      const start = (query.page - 1) * query.limit;
      return {
        items: filtered.slice(start, start + query.limit),
        total: filtered.length,
      };
    },

    async findExistingUrls(urls: string[]): Promise<Set<string>> {
      if (urls.length === 0) return new Set();
      const wanted = new Set(urls);
      const all = await readArticles();
      const found = new Set<string>();
      for (const article of all) {
        if (wanted.has(article.articleUrl)) found.add(article.articleUrl);
      }
      return found;
    },

    async findRecentFingerprints(
      sinceIso: string,
    ): Promise<ArticleFingerprint[]> {
      const since = new Date(sinceIso).getTime();
      const all = await readArticles();
      return all
        .filter((article) => new Date(article.publishedAt).getTime() >= since)
        .map((article) => ({
          articleUrl: article.articleUrl,
          normalizedTitle: article.normalizedTitle,
          sourceName: article.sourceName,
          publishedAt: article.publishedAt,
        }));
    },

    async insertMany(
      articles: ValidatedNewArticle[],
    ): Promise<InsertResult> {
      if (articles.length === 0) {
        return { inserted: 0, duplicate: 0, failed: 0 };
      }

      return serialize(async () => {
        const existing = await readArticles();
        const byUrl = new Map(
          existing.map((article) => [article.articleUrl, article]),
        );

        let inserted = 0;
        let duplicate = 0;
        const collectedAt = new Date().toISOString();

        for (const candidate of articles) {
          const current = byUrl.get(candidate.articleUrl);
          if (current) {
            duplicate += 1;
            // Fill gaps only — never overwrite good data with an empty value.
            byUrl.set(candidate.articleUrl, {
              ...current,
              description: current.description ?? candidate.description,
              imageUrl: current.imageUrl ?? candidate.imageUrl,
              sourceUrl: current.sourceUrl ?? candidate.sourceUrl,
              relevanceScore: Math.max(
                current.relevanceScore,
                candidate.relevanceScore,
              ),
            });
            continue;
          }

          byUrl.set(candidate.articleUrl, {
            id: randomUUID(),
            title: candidate.title,
            normalizedTitle: candidate.normalizedTitle,
            description: candidate.description,
            category: candidate.category,
            imageUrl: candidate.imageUrl,
            sourceName: candidate.sourceName,
            sourceUrl: candidate.sourceUrl,
            articleUrl: candidate.articleUrl,
            publishedAt: candidate.publishedAt,
            collectedAt,
            relevanceScore: candidate.relevanceScore,
            isFeatured: candidate.isFeatured,
            provider: candidate.provider,
            providerArticleId: candidate.providerArticleId,
          });
          inserted += 1;
        }

        await writeJson(ARTICLES_FILE, Array.from(byUrl.values()));
        return { inserted, duplicate, failed: 0 };
      });
    },

    async count(): Promise<number> {
      return (await readArticles()).length;
    },

    async deleteAll(): Promise<void> {
      await serialize(() => writeJson(ARTICLES_FILE, []));
    },

    async acquireLock(name: string, ttlMs: number): Promise<boolean> {
      return serialize(async () => {
        const locks = await readJson<Record<string, LockRecord>>(
          LOCKS_FILE,
          {},
        );
        const now = Date.now();
        const current = locks[name];
        if (current && current.expiresAt > now) return false;
        locks[name] = { expiresAt: now + ttlMs };
        await writeJson(LOCKS_FILE, locks);
        return true;
      });
    },

    async releaseLock(name: string): Promise<void> {
      await serialize(async () => {
        const locks = await readJson<Record<string, LockRecord>>(
          LOCKS_FILE,
          {},
        );
        delete locks[name];
        await writeJson(LOCKS_FILE, locks);
      });
    },
  };
}
