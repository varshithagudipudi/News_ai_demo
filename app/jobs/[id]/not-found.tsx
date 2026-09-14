import Link from 'next/link';
export default function JobNotFound() {
  return <section className="px-6 py-16 text-center"><h1 className="text-2xl font-bold text-fg">This opening is no longer listed.</h1><p className="mt-3 text-sm text-fg-muted">It may have closed or the link may be incorrect.</p><Link href="/jobs" className="mt-5 inline-flex rounded-full bg-accent px-6 py-3 text-sm font-semibold text-accent-fg">Browse current openings</Link></section>;
}
