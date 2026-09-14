import { afterEach, describe, expect, it, vi } from 'vitest';
import { updateFeedLocation } from '@/lib/utils/feedNavigation';

afterEach(() => vi.unstubAllGlobals());

function setup(href = 'https://aipulse.test/') {
  const pushState = vi.fn();
  vi.stubGlobal('window', { location: new URL(href), history: { pushState } });
  return pushState;
}

describe('feed navigation', () => {
  it('updates category filters through history while preserving other query parameters', () => {
    const pushState = setup();
    expect(updateFeedLocation('/?category=ai-tools&search=agents&sort=oldest')).toBe(true);
    expect(pushState).toHaveBeenCalledWith(null, '', '/?category=ai-tools&search=agents&sort=oldest');
  });

  it('does not add duplicate history entries for the active section', () => {
    const pushState = setup('https://aipulse.test/?category=ai-tools');
    expect(updateFeedLocation('/?category=ai-tools')).toBe(true);
    expect(pushState).not.toHaveBeenCalled();
  });

  it.each(['/saved', 'https://other.test/?category=ai-tools', '/#main'])(
    'preserves normal navigation for %s', (href) => {
      const pushState = setup();
      expect(updateFeedLocation(href)).toBe(false);
      expect(pushState).not.toHaveBeenCalled();
    },
  );

  it('uses normal routing when returning from the saved page', () => {
    const pushState = setup('https://aipulse.test/saved');
    expect(updateFeedLocation('/?category=ai-tools')).toBe(false);
    expect(pushState).not.toHaveBeenCalled();
  });
});
