'use client';
export default function JobsError({ reset }: { reset: () => void }) {
  return <section className="px-6 py-16 text-center"><h1 className="text-2xl font-bold text-fg">We couldn’t reach the employer feed.</h1><p className="mt-3 text-sm text-fg-muted">Please try again to check this opportunity’s current availability.</p><button type="button" onClick={reset} className="mt-5 rounded-full bg-accent px-6 py-3 text-sm font-semibold text-accent-fg">Try again</button></section>;
}
