/** Update client-side feed filters without requesting a new page from Next. */
export function updateFeedLocation(href: string): boolean {
  const url = new URL(href, window.location.href);
  if (
    window.location.pathname !== '/' || url.pathname !== '/' ||
    url.origin !== window.location.origin || url.hash
  ) return false;

  const next = `${url.pathname}${url.search}`;
  if (next !== `${window.location.pathname}${window.location.search}`) {
    // Next synchronizes native history updates with useSearchParams and Back/Forward.
    window.history.pushState(null, '', next);
  }
  return true;
}
