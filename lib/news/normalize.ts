/**
 * Pure text/URL normalization helpers. No I/O, no environment access — these
 * are the most heavily unit-tested part of the pipeline.
 */

/** Query parameters that only identify a campaign or referrer. */
const TRACKING_PARAMS = new Set([
  'utm_source',
  'utm_medium',
  'utm_campaign',
  'utm_term',
  'utm_content',
  'utm_id',
  'utm_name',
  'utm_reader',
  'fbclid',
  'gclid',
  'dclid',
  'msclkid',
  'yclid',
  'igshid',
  'mc_cid',
  'mc_eid',
  'ref_src',
  'ref_url',
  'ito',
  'ncid',
  'cmpid',
  'campaign_id',
  'smid',
  'guccounter',
  'guce_referrer',
  'guce_referrer_sig',
  'spm',
  '_ga',
  '_gl',
  'at_medium',
  'at_campaign',
  'sh',
  'srnd',
  'taid',
]);

/**
 * Produces a canonical form of an article URL for duplicate comparison and
 * storage: lowercased host, no tracking parameters, no fragment, no trailing
 * slash. Path case is preserved because many sites are case sensitive.
 * Returns null when the URL is unusable or not http(s).
 */
export function normalizeUrl(rawUrl: string): string | null {
  let url: URL;
  try {
    url = new URL(rawUrl.trim());
  } catch {
    return null;
  }

  if (url.protocol !== 'https:' && url.protocol !== 'http:') return null;

  url.hostname = url.hostname.toLowerCase().replace(/\.$/, '');
  url.hash = '';
  url.username = '';
  url.password = '';

  for (const key of Array.from(url.searchParams.keys())) {
    if (TRACKING_PARAMS.has(key.toLowerCase())) {
      url.searchParams.delete(key);
    }
  }

  // Sort what remains so ?a=1&b=2 and ?b=2&a=1 compare equal.
  url.searchParams.sort();

  let result = url.toString();
  if (result.endsWith('?')) result = result.slice(0, -1);
  if (url.pathname !== '/' && result.endsWith('/')) result = result.slice(0, -1);

  return result;
}

/** Upgrades an http URL to https; other URLs are returned unchanged. */
export function preferHttps(rawUrl: string): string {
  return rawUrl.startsWith('http://')
    ? `https://${rawUrl.slice('http://'.length)}`
    : rawUrl;
}

/** " - ", " | ", en/em dash and middot, used as publisher-suffix separators. */
const TITLE_SUFFIX_SEPARATORS = /\s+[-|–—·]\s+/;

/**
 * Collapses a headline to a comparison key: no publisher suffix, no accents,
 * no punctuation, single-spaced and lowercased.
 */
export function normalizeTitle(rawTitle: string): string {
  let title = rawTitle.trim();

  // Providers commonly append " - Publisher Name". Drop a short trailing
  // segment, but never so much that the headline itself disappears.
  const parts = title.split(TITLE_SUFFIX_SEPARATORS);
  if (parts.length > 1) {
    const last = parts[parts.length - 1];
    const head = parts.slice(0, -1).join(' ');
    if (last.length <= 40 && head.length >= 20) {
      title = head;
    }
  }

  return (
    title
      .normalize('NFKD')
      // Drop the combining marks NFKD leaves behind, so accented and
      // unaccented spellings of the same headline compare equal.
      .replace(/\p{M}/gu, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, ' ')
      .trim()
      .replace(/\s+/g, ' ')
  );
}

/** Replaces control characters with spaces and collapses whitespace. */
export function sanitizeText(value: string | null | undefined): string | null {
  if (typeof value !== 'string') return null;

  let cleaned = '';
  for (const char of value) {
    const code = char.codePointAt(0) ?? 0;
    const isControl = code < 0x20 || (code >= 0x7f && code <= 0x9f);
    cleaned += isControl ? ' ' : char;
  }

  cleaned = cleaned.replace(/\s+/g, ' ').trim();
  return cleaned.length > 0 ? cleaned : null;
}

/** Truncates on a word boundary where possible, adding an ellipsis. */
export function truncate(
  value: string | null,
  maxLength: number,
): string | null {
  if (value === null) return null;
  if (value.length <= maxLength) return value;

  const slice = value.slice(0, maxLength - 1);
  const lastSpace = slice.lastIndexOf(' ');
  const base = lastSpace > maxLength * 0.6 ? slice.slice(0, lastSpace) : slice;
  return `${base.trimEnd()}…`;
}

/** Parses a provider date, rejecting anything unparseable or far in the future. */
export function parsePublishedAt(
  value: string | null | undefined,
  now: Date = new Date(),
): string | null {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;

  // Allow a little clock skew, but reject clearly bogus future dates.
  if (date.getTime() > now.getTime() + 60 * 60 * 1000) return null;
  // Reject dates before the web existed — usually a parsing artefact.
  if (date.getFullYear() < 1995) return null;

  return date.toISOString();
}
