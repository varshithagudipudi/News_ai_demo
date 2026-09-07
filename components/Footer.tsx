import { siteConfig } from '@/lib/config/site';

/**
 * No social accounts exist yet, so these render as decorative (not `<a>`
 * tags) rather than dead links that look clickable but go nowhere.
 */
const SOCIAL_ICONS: { name: string; path: string }[] = [
  {
    name: 'Instagram',
    path: 'M12 2.2c2.7 0 3 0 4.1.06 1 .05 1.6.2 2 .33.5.2.9.4 1.3.8.4.4.6.8.8 1.3.14.4.28 1 .33 2 .06 1.1.06 1.4.06 4.1s0 3-.06 4.1c-.05 1-.2 1.6-.33 2-.2.5-.4.9-.8 1.3-.4.4-.8.6-1.3.8-.4.14-1 .28-2 .33-1.1.06-1.4.06-4.1.06s-3 0-4.1-.06c-1-.05-1.6-.2-2-.33-.5-.2-.9-.4-1.3-.8-.4-.4-.6-.8-.8-1.3-.14-.4-.28-1-.33-2C2.2 15 2.2 14.7 2.2 12s0-3 .06-4.1c.05-1 .2-1.6.33-2 .2-.5.4-.9.8-1.3.4-.4.8-.6 1.3-.8.4-.14 1-.28 2-.33C8 2.2 8.3 2.2 12 2.2zM12 7a5 5 0 1 0 0 10 5 5 0 0 0 0-10zm0 8.2a3.2 3.2 0 1 1 0-6.4 3.2 3.2 0 0 1 0 6.4zm5.2-8.4a1.2 1.2 0 1 0 0-2.4 1.2 1.2 0 0 0 0 2.4z',
  },
  {
    name: 'X',
    path: 'M4 3h3.6l4 5.4L16.3 3H20l-6.3 8.1L20.4 21h-3.6l-4.3-5.8L7.6 21H4l6.7-8.6z',
  },
  {
    name: 'Facebook',
    path: 'M14 22v-8h2.7l.4-3.2H14V8.7c0-.9.3-1.6 1.6-1.6h1.7V4.3C17 4.2 16 4 14.8 4 12.4 4 10.8 5.4 10.8 8v2.8H8V14h2.8v8z',
  },
  {
    name: 'YouTube',
    path: 'M21.6 7.5a2.8 2.8 0 0 0-2-2C17.9 5 12 5 12 5s-5.9 0-7.6.5a2.8 2.8 0 0 0-2 2A29 29 0 0 0 2 12a29 29 0 0 0 .4 4.5 2.8 2.8 0 0 0 2 2C6.1 19 12 19 12 19s5.9 0 7.6-.5a2.8 2.8 0 0 0 2-2A29 29 0 0 0 22 12a29 29 0 0 0-.4-4.5zM10 15V9l5.2 3z',
  },
  {
    name: 'LinkedIn',
    path: 'M6.94 5a2 2 0 1 1-4 0 2 2 0 0 1 4 0zM3.2 8.5h3.5V21H3.2zM9.7 8.5h3.4v1.7h.05c.47-.9 1.6-1.85 3.3-1.85 3.5 0 4.15 2.3 4.15 5.3V21h-3.5v-6.1c0-1.45-.03-3.3-2-3.3-2.03 0-2.34 1.6-2.34 3.2V21H9.7z',
  },
];

export function Footer() {
  return (
    <footer className="mt-26 border-t-2 border-fg bg-fg p-8 text-bg">
      <div className="mx-auto max-w-content px-4 py-8 text-sm text-bg/70 sm:px-6">
        <p className="text-base font-extrabold uppercase tracking-tight text-bg">
          {siteConfig.name}
        </p>
        <p className="mt-2 max-w-2xl">
          {siteConfig.name} shows headlines, short descriptions and links only.
          All stories, images and copyright remain the property of their
          original publishers. Follow the &ldquo;Read more&rdquo; link on any
          card to read the full article on the publisher&rsquo;s own site.
        </p>
        <p className="mt-4 text-xs">
          Headlines collected via the GNews API. Saved articles are stored only
          in your browser.
        </p>

        <div className="mt-6 flex items-center gap-3">
          <span className="sr-only">
            Social accounts are not set up yet — icons shown for reference
            only.
          </span>
          {SOCIAL_ICONS.map((icon) => (
            <span
              key={icon.name}
              aria-hidden="true"
              title={icon.name}
              className="flex h-9 w-9 items-center justify-center rounded-full border border-bg/20 text-bg/70 transition-colors hover:border-accent hover:text-accent"
            >
              <svg
                viewBox="0 0 24 24"
                className="h-4 w-4"
                fill="currentColor"
              >
                <path d={icon.path} />
              </svg>
            </span>
          ))}
        </div>
      </div>
    </footer>
  );
}
