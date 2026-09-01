import { siteConfig } from '@/lib/config/site';

export function Footer() {
  return (
    <footer className="mt-16 border-t border-border bg-surface">
      <div className="mx-auto max-w-content px-4 py-8 text-sm text-fg-muted sm:px-6">
        <p className="font-medium text-fg">{siteConfig.name}</p>
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
      </div>
    </footer>
  );
}
