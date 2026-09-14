import { z } from 'zod';
import type { Job } from './catalog';
import type { JobSource } from './sources';

const text = z.string().nullish().transform((value) => value ?? '');
const httpsUrl = z.string().url().refine((value) => new URL(value).protocol === 'https:');
export const greenhouseJobSchema = z.object({
  id: z.number(), title: z.string(), absolute_url: httpsUrl, content: text,
  location: z.object({ name: text }).nullish(),
  departments: z.array(z.object({ name: text })).optional(),
  metadata: z.array(z.object({ name: text, value: z.unknown() })).nullish(),
  first_published: text, application_deadline: text,
});
export const leverJobSchema = z.object({
  id: z.string(), text: z.string(), hostedUrl: httpsUrl,
  categories: z.object({ location: text, allLocations: z.array(z.string()).optional(), commitment: text, team: text, department: text }).optional(),
  country: text, workplaceType: text, descriptionPlain: text, descriptionBodyPlain: text,
  lists: z.array(z.object({ text: text, content: text })).optional(),
  salaryRange: z.object({ currency: text, interval: text, min: z.number().nullish(), max: z.number().nullish() }).nullish(),
});

export function plainText(html: string): string {
  const entities: Record<string, string> = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ', ndash: '–', mdash: '—', rsquo: '’', lsquo: '‘', ldquo: '“', rdquo: '”', bull: '•' };
  let result = html;
  for (let i = 0; i < 3; i++) result = result.replace(/&(#x[\da-f]+|#\d+|[a-z]+);/gi, (match, entity: string) => {
    if (entity.startsWith('#')) {
      const code = entity[1].toLowerCase() === 'x' ? parseInt(entity.slice(2), 16) : Number(entity.slice(1));
      return code > 0 && code <= 0x10ffff ? String.fromCodePoint(code) : '';
    }
    return entities[entity.toLowerCase()] ?? match;
  });
  return result.replace(/<(script|style)\b[^>]*>[\s\S]*?<\/\1>/gi, '').replace(/<\/(p|div|li|h\d)>|<br\s*\/?>/gi, '\n')
    .replace(/<[^>]*>/g, '').replace(/[\t ]+/g, ' ').replace(/\n\s*\n/g, '\n').trim();
}
const countryCodes = 'US GB CA IN FR DE ES IT PT NL BE IE CH AT SE NO DK FI PL CZ RO GR HU UA TR AU NZ JP KR CN TW SG MY ID TH VN PH PK BD LK NP AE SA IL EG ZA KE NG GH AR BR CL CO MX PE EC CR UY VE LV LT EE IS MT LU CY SK SI HR RS BG KZ UZ GE AM AZ MA TN DZ JO LB QA KW BH OM TZ UG RW ZM ZW ET SO DJ CM SN CI'.split(' ');
const display = new Intl.DisplayNames(['en'], { type: 'region' });
const countryNames = countryCodes.map((code) => ({ code, name: display.of(code)! }));
export function locationCountries(location: string, code = ''): string[] {
  const result = new Set<string>();
  if (/^[a-z]{2}$/i.test(code)) { const name = display.of(code.toUpperCase()); if (name && name !== code.toUpperCase()) result.add(name); }
  const lower = location.toLowerCase();
  for (const country of countryNames) if (new RegExp(`\\b${country.name.toLowerCase()}\\b`).test(lower)) result.add(country.name);
  const aliases: [RegExp, string][] = [[/\b(usa|u\.s\.|united states|new york|san francisco|austin|seattle|boston)\b/i, 'United States'], [/\b(uk|united kingdom|bristol)\b/i, 'United Kingdom'], [/\b(bengaluru|bangalore|hyderabad|mumbai|pune|delhi)\b/i, 'India'], [/\b(toronto|vancouver|montreal)\b/i, 'Canada'], [/\b(paris)\b/i, 'France'], [/\b(berlin|munich)\b/i, 'Germany']];
  for (const [pattern, name] of aliases) if (pattern.test(location)) result.add(name);
  return [...result];
}
function employment(title: string, commitment: string): Job['employment'] {
  const result: Job['employment'] = [];
  if (/\bintern(ship)?\b/i.test(`${title} ${commitment}`)) result.push('internship');
  if (/full[ -]?time|permanent/i.test(commitment)) result.push('fulltime');
  if (/freelance|contract(?!ual)/i.test(commitment)) result.push('freelancing');
  return result;
}
function build(source: JobSource, now: string, raw: { id: string; title: string; url: string; location: string; code?: string; commitment: string; workplace: string; body: string; department: string; responsibilities?: string[]; requirements?: string[]; postedAt?: string; closesAt?: string; compensation?: string }): Job | null {
  // Match the role/team, not generic company boilerplate or hiring AI disclaimers.
  if (!/\b(ai|ml|llm|machine learning|deep learning|artificial intelligence|agentic|data annotat|prompt|silicon|alignment|research engineer)\b/i.test(`${raw.title} ${raw.department}`)) return null;
  if (/talent (pool|pipeline|network)|register your interest|general application/i.test(raw.title)) return null;
  const work = `${raw.workplace} ${raw.location}`;
  const arrangement: Job['arrangement'] = /hybrid/i.test(work) ? 'Hybrid' : /remote/i.test(work) ? 'Remote' : /on[ -]?site/i.test(work) ? 'On-site' : 'Not specified';
  const worldwide = arrangement === 'Remote' && /\b(worldwide|open globally|anywhere \(open globally\))\b/i.test(raw.location);
  const types = employment(raw.title, raw.commitment);
  if (!types.length && arrangement !== 'Remote') return null;
  const full = plainText(raw.body);
  const skills = ['Python', 'Java', 'SQL', 'PyTorch', 'TensorFlow', 'RAG', 'LLM', 'NLP', 'Kubernetes'].filter((skill) => new RegExp(`\\b${skill}\\b`, 'i').test(`${raw.title} ${full}`)).slice(0, 5);
  const duties = (raw.responsibilities ?? []).map(plainText).filter(Boolean).slice(0, 2).map((item) => item.slice(0, 240));
  const requirements = (raw.requirements ?? []).map(plainText).filter(Boolean).slice(0, 2).map((item) => item.slice(0, 240));
  return {
    id: `${source.key}_${raw.id}`, title: raw.title.trim(), company: source.company, employment: types,
    arrangement, countries: locationCountries(raw.location, raw.code), worldwide,
    locationLabel: raw.location || 'Location eligibility not specified',
    eligibility: `Employer-listed location: ${raw.location || 'not specified'}. ${worldwide ? 'The listing explicitly describes global remote availability. ' : ''}Confirm residency, work authorization, timezone, and contract terms in the original posting.`,
    experience: types.includes('internship') ? 'Student / Graduate' : /director|head of|vice president/i.test(raw.title) ? 'Leadership' : /senior|staff|lead|principal/i.test(raw.title) ? 'Experienced' : 'Not specified',
    specialization: /silicon|hardware/i.test(raw.title) ? 'AI Hardware' : /research|alignment/i.test(raw.title) ? 'AI Research' : /analyst|annotat|evaluat|rater|trainer/i.test(raw.title) ? 'AI Evaluation' : 'AI Engineering',
    skills, summary: full.slice(0, 280) + (full.length > 280 ? '…' : ''), responsibilities: duties, requirements,
    sourceUrl: raw.url, sourceKey: source.key, sourceName: source.provider === 'lever' ? 'Lever' : 'Greenhouse',
    checkedAt: now, reviewBy: now.slice(0, 10), postedAt: raw.postedAt, closesAt: raw.closesAt, compensation: raw.compensation,
  };
}
export function normalizeGreenhouse(value: unknown, source: JobSource, now: string): Job | null {
  const job = greenhouseJobSchema.parse(value);
  const commitment = (job.metadata ?? []).filter((item) => /employment|job type|contract|commitment/i.test(item.name)).map((item) => typeof item.value === 'string' ? item.value : '').join(' ');
  return build(source, now, { id: String(job.id), title: job.title, url: job.absolute_url,
    location: job.location?.name ?? '', commitment, workplace: '', body: job.content, department: (job.departments ?? []).map((item) => item.name).join(' '),
    postedAt: job.first_published && Number.isFinite(Date.parse(job.first_published)) ? job.first_published : undefined,
    closesAt: job.application_deadline && Number.isFinite(Date.parse(job.application_deadline)) ? new Date(job.application_deadline).toISOString().slice(0, 10) : undefined,
  });
}
export function normalizeLever(value: unknown, source: JobSource, now: string): Job | null {
  const job = leverJobSchema.parse(value);
  const lines = (pattern: RegExp) => (job.lists ?? []).filter((list) => pattern.test(list.text)).flatMap((list) => plainText(list.content).split('\n'));
  const salary = job.salaryRange;
  const amount = salary && salary.currency && salary.interval && salary.min != null && salary.max != null
    ? `${salary.currency} ${salary.min.toLocaleString('en-US')}${salary.max !== salary.min ? `–${salary.max.toLocaleString('en-US')}` : ''} / ${salary.interval}` : undefined;
  return build(source, now, { id: job.id, title: job.text, url: job.hostedUrl,
    location: [...new Set([job.categories?.location ?? '', ...(job.categories?.allLocations ?? [])])].filter(Boolean).join(' · '), code: job.country,
    commitment: job.categories?.commitment ?? '', workplace: job.workplaceType, body: job.descriptionBodyPlain || job.descriptionPlain,
    department: `${job.categories?.team ?? ''} ${job.categories?.department ?? ''}`,
    responsibilities: lines(/responsibil|what you.ll do|what you.ll work|the role/i), requirements: lines(/requir|qualif|what you.ll bring|looking for/i), compensation: amount,
  });
}
