export const jobSections = [
  { id: 'internship', label: 'Internships', description: 'Build your first experience' },
  { id: 'fulltime', label: 'Full-time', description: 'Find your next career move' },
  { id: 'remote', label: 'Remote', description: 'Explore flexible locations' },
  { id: 'freelancing', label: 'Freelancing', description: 'Put your skills to work' },
] as const;
export type JobSection = typeof jobSections[number]['id'];
export interface Job {
  id: string; title: string; company: string;
  employment: ('internship' | 'fulltime' | 'freelancing')[];
  arrangement: 'Remote' | 'Hybrid' | 'On-site' | 'Not specified';
  countries: string[]; city?: string; worldwide: boolean; eligibility: string;
  experience: 'Student / Graduate' | 'Experienced' | 'Leadership' | 'Not specified';
  specialization: string; skills: string[]; summary: string;
  responsibilities: string[]; requirements: string[];
  compensation?: string; duration?: string; note?: string;
  sourceUrl: string; checkedAt: string; reviewBy: string;
  postedAt?: string; closesAt?: string; closed?: boolean;
  sourceKey?: string; sourceName?: string; locationLabel?: string;
}

export function jobStatus(job: Job, now: string): 'open' | 'closed' | 'review' {
  if (job.closed || (job.closesAt && job.closesAt < now.slice(0, 10))) return 'closed';
  if (job.sourceKey) return 'open';
  return job.reviewBy < now.slice(0, 10) ? 'review' : 'open';
}
export function jobLocation(job: Job) {
  if (job.worldwide) return 'Worldwide remote';
  if (job.locationLabel) return job.locationLabel;
  return [job.city, ...job.countries].filter(Boolean).join(', ') || 'Location not specified';
}
export function sectionMatches(job: Job, section: string) {
  return section === 'remote' ? job.arrangement === 'Remote' : job.employment.some((type) => type === section);
}
export interface JobFilters { query: string; country: string; section: JobSection; experience: string; specialization: string; arrangement: string; saved: boolean; sort: string }
export function readJobFilters(params: URLSearchParams): JobFilters {
  const section = params.get('section');
  return {
    query: params.get('q') ?? '', country: params.get('country') ?? 'all',
    section: jobSections.some((item) => item.id === section) ? section as JobSection : 'internship',
    experience: params.get('experience') ?? 'all', specialization: params.get('specialization') ?? 'all',
    arrangement: params.get('arrangement') ?? 'all', saved: params.get('saved') === 'true', sort: params.get('sort') === 'company' ? 'company' : 'newest',
  };
}
export function filterJobs(items: Job[], filters: JobFilters, savedIds: readonly string[], now: string, ignoreSection = false) {
  const terms = filters.query.trim().toLowerCase().split(/\s+/).filter(Boolean);
  return items.filter((job) => {
    if (filters.saved ? !savedIds.includes(job.id) : jobStatus(job, now) !== 'open') return false;
    if (!ignoreSection && !sectionMatches(job, filters.section)) return false;
    if (filters.country === 'worldwide' ? !job.worldwide : filters.country !== 'all' && !job.worldwide && !job.countries.includes(filters.country)) return false;
    if (filters.experience !== 'all' && job.experience !== filters.experience) return false;
    if (filters.specialization !== 'all' && job.specialization !== filters.specialization) return false;
    if (filters.arrangement !== 'all' && job.arrangement !== filters.arrangement) return false;
    const text = [job.title, job.company, job.summary, ...job.skills].join(' ').toLowerCase();
    return terms.every((term) => text.includes(term));
  }).sort((a, b) => filters.sort === 'company' ? a.company.localeCompare(b.company)
    : (b.postedAt ?? '').localeCompare(a.postedAt ?? '') || b.checkedAt.localeCompare(a.checkedAt) || a.title.localeCompare(b.title));
}
