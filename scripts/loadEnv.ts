/**
 * Loads `.env.local` then `.env` into process.env for command-line scripts.
 * Next.js does this itself for the dev server and build; the scripts run
 * outside Next, so they need their own loader. A missing file is not an error.
 *
 * Existing process.env values always win, so `CRON_SECRET=x npm run ...` works.
 */

import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';

function parse(contents: string): Record<string, string> {
  const result: Record<string, string> = {};

  for (const rawLine of contents.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;

    const separator = line.indexOf('=');
    if (separator === -1) continue;

    const key = line.slice(0, separator).trim();
    let value = line.slice(separator + 1).trim();

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    if (key) result[key] = value;
  }

  return result;
}

export function loadEnv(): void {
  for (const file of ['.env.local', '.env']) {
    const fullPath = path.join(process.cwd(), file);
    if (!existsSync(fullPath)) continue;

    const values = parse(readFileSync(fullPath, 'utf8'));
    for (const [key, value] of Object.entries(values)) {
      if (process.env[key] === undefined) process.env[key] = value;
    }
  }
}

loadEnv();
