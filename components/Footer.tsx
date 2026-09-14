import { FeedLink as Link } from '@/components/FeedLink';
import { siteConfig } from '@/lib/config/site';

const footerGroups = [
  {
    title: 'Discover',
    links: [
      { label: 'Latest news', href: '/' },
      { label: 'Generative AI', href: '/?category=generative-ai' },
      { label: 'Machine learning', href: '/?category=machine-learning' },
      { label: 'Startups', href: '/?category=startups' },
      { label: 'Funding', href: '/?category=funding' },
    ],
  },
  {
    title: 'Explore',
    links: [
      { label: 'AI tools', href: '/?category=ai-tools' },
      { label: 'AI events', href: '/?category=ai-events' },
      { label: 'Robotics', href: '/?category=robotics' },
      { label: 'Creator directory', href: '/?category=ai-content-creators' },
      { label: 'AI jobs', href: '/jobs' },
      { label: 'Saved stories', href: '/saved' },
    ],
  },
];

const socialLinks = [
  {
    name: 'LinkedIn',
    href: siteConfig.socialLinks.linkedin,
    path: 'M20.45 2H3.55C2.69 2 2 2.68 2 3.52v16.96c0 .84.69 1.52 1.55 1.52h16.9c.86 0 1.55-.68 1.55-1.52V3.52c0-.84-.69-1.52-1.55-1.52ZM7.93 18.75H4.98V9.2h2.95v9.55ZM6.45 7.9a1.71 1.71 0 1 1 0-3.42 1.71 1.71 0 0 1 0 3.42Zm12.3 10.85H15.8V14.1c0-1.11-.02-2.54-1.55-2.54-1.55 0-1.79 1.21-1.79 2.46v4.73H9.51V9.2h2.83v1.3h.04c.39-.74 1.36-1.52 2.79-1.52 2.98 0 3.58 1.96 3.58 4.51v5.26Z',
  },
  {
    name: 'GitHub',
    href: siteConfig.socialLinks.github,
    path: 'M12 2a10 10 0 0 0-3.16 19.49c.5.09.68-.22.68-.48v-1.86c-2.78.6-3.37-1.18-3.37-1.18-.45-1.16-1.11-1.47-1.11-1.47-.91-.62.07-.61.07-.61 1 .07 1.53 1.03 1.53 1.03.89 1.53 2.34 1.09 2.91.83.09-.65.35-1.09.64-1.34-2.22-.25-4.56-1.11-4.56-4.94 0-1.09.39-1.99 1.03-2.69-.1-.25-.45-1.27.1-2.65 0 0 .84-.27 2.75 1.03a9.56 9.56 0 0 1 5 0c1.91-1.3 2.75-1.03 2.75-1.03.55 1.38.2 2.4.1 2.65.64.7 1.03 1.6 1.03 2.69 0 3.84-2.34 4.69-4.57 4.94.36.31.68.92.68 1.85v2.75c0 .27.18.58.69.48A10 10 0 0 0 12 2Z',
  },
  {
    name: 'X',
    href: siteConfig.socialLinks.x,
    path: 'M18.9 2H22l-6.78 7.75L23.2 22h-6.25l-4.9-7.43L5.55 22H2.4l7.98-9.12L.8 2h6.41l4.43 6.75L18.9 2ZM17.8 20h1.73L6.27 3.88H4.41L17.8 20Z',
  },
];

export function Footer() {
  return (
    <footer className="site-chrome overflow-hidden border-t border-border bg-surface pb-[var(--search-dock-space)] text-fg">
      <div className="mx-auto max-w-content px-4 pt-12 sm:px-6 sm:pt-16 lg:px-10">
        <div className="grid gap-12 lg:grid-cols-[1.4fr_1fr] lg:gap-20">
          <section aria-labelledby="footer-heading" className="max-w-xl">
            <Link href="/" className="inline-flex items-center gap-2 font-display text-sm font-bold tracking-tight text-fg">
              <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5 text-accent">
                <path d="M2 12h5l3-8 4 16 3-8h5" />
              </svg>
              {siteConfig.name}
            </Link>
            <h2 id="footer-heading" className="mt-6 text-3xl font-semibold leading-[1.12] tracking-tight sm:text-4xl lg:text-5xl">
              Stay ahead of<br />
              <span className="text-accent">what&apos;s next.</span>
            </h2>
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-fg-muted sm:text-base">
              A little clarity in the world of artificial intelligence.
              Discover the voices making sense of it all.
            </p>
            <Link
              href="/?category=ai-content-creators"
              className="group mt-7 inline-flex min-h-14 w-full max-w-sm items-center justify-between gap-4 rounded-full border border-accent/25 bg-accent/10 py-2 pl-5 pr-2 text-sm font-semibold text-fg transition-colors hover:border-accent/60 hover:bg-accent/15"
            >
              Discover AI creators
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent text-accent-fg transition-transform group-hover:translate-x-0.5">
                <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
                  <path d="M5 12h14m-6-6 6 6-6 6" />
                </svg>
              </span>
            </Link>
          </section>

          <nav aria-label="Footer navigation" className="grid grid-cols-2 gap-6 lg:pt-1">
            {footerGroups.map((group) => (
              <div key={group.title}>
                <h3 className="text-sm font-semibold text-fg">{group.title}</h3>
                <ul className="mt-5 space-y-1">
                  {group.links.map((link) => (
                    <li key={link.href}>
                      <Link href={link.href} className="inline-block py-2 text-sm text-fg-muted underline-offset-4 transition-colors hover:text-accent hover:underline sm:text-base">
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </nav>
        </div>

        <div className="mt-12 flex flex-col justify-between gap-4 text-xs leading-relaxed text-fg-muted sm:mt-16 lg:flex-row lg:gap-12">
          <p className="max-w-xl">Headlines and images belong to their original publishers. Follow a story to read it at the source. News collected via GNews.</p>
          <p>Your saved stories stay in your browser.</p>
        </div>

        <div aria-hidden="true" className="footer-wordmark select-none py-8 text-center font-bold uppercase sm:py-12">
          {siteConfig.name}
        </div>

        <div className="flex flex-col items-center justify-between gap-5 border-t border-border py-7 sm:flex-row sm:py-8">
          <p className="text-sm text-fg-muted">
            {siteConfig.name} &copy; Copyright {new Date().getFullYear()}.
          </p>
          <div role="group" aria-label="AI Pulse around the web" className="flex items-center gap-3">
            {socialLinks.map((social) => {
              const icon = (
                <svg aria-hidden="true" viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
                  <path d={social.path} />
                </svg>
              );

              return social.href ? (
                <a
                  key={social.name}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`${siteConfig.name} on ${social.name}`}
                  className="footer-social-link"
                >
                  {icon}
                </a>
              ) : (
                <span
                  key={social.name}
                  role="img"
                  aria-label={`${social.name} — link coming soon`}
                  title={`${social.name} — link coming soon`}
                  className="footer-social-link text-fg-muted"
                >
                  {icon}
                </span>
              );
            })}
            <Link href="/" aria-label="AI Pulse homepage" className="footer-social-link">
              <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className="h-5 w-5">
                <circle cx="12" cy="12" r="9" />
                <ellipse cx="12" cy="12" rx="4" ry="9" />
                <path d="M3 12h18" />
              </svg>
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
