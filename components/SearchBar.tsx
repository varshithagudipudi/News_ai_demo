'use client';

import { useEffect, useLayoutEffect, useRef, useState, useSyncExternalStore } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { updateFeedLocation } from '@/lib/utils/feedNavigation';
import { siteConfig } from '@/lib/config/site';
import { constrainPanel, defaultPanelPreferences, getSearchFeedback, getServerSearchFeedback, OPEN_SEARCH_EVENT, readPanelPreferences, SEARCH_PANEL_STORAGE, subscribeSearchFeedback, type PanelPreferences } from '@/lib/utils/searchPanel';

const quickSearches = ['AI agents', 'New models', 'Research'];

function Icon({ name }: { name: 'search' | 'grip' | 'close' | 'minus' | 'reset' | 'arrow' }) {
  return <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 shrink-0">
    {name === 'search' && <><circle cx="10.5" cy="10.5" r="6.5" /><path d="m16 16 4 4" /></>}
    {name === 'grip' && [7, 12, 17].flatMap(y => [9, 15].map(x => <circle key={`${x}-${y}`} cx={x} cy={y} r="1" fill="currentColor" stroke="none" />))}
    {name === 'close' && <path d="m6 6 12 12M18 6 6 18" />}
    {name === 'minus' && <path d="M5 12h14" />}
    {name === 'reset' && <><path d="M3 10a9 9 0 1 1 2 8M3 4v6h6" /></>}
    {name === 'arrow' && <path d="M5 12h14m-5-5 5 5-5 5" />}
  </svg>;
}

/** Movable, optional news search. Search queries remain shareable in the URL. */
export function SearchBar() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const urlValue = searchParams.get('search') ?? '';
  const allowed = !pathname.startsWith('/jobs') && !(pathname === '/' && searchParams.get('category') === 'ai-content-creators');
  const [value, setValue] = useState(urlValue);
  const [preferences, setPreferences] = useState<PanelPreferences>(defaultPanelPreferences);
  const [ready, setReady] = useState(false);
  const [focused, setFocused] = useState(false);
  const [focusRequest, setFocusRequest] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [geometry, setGeometry] = useState({ width: 520, height: 190, viewport: { x: 0, y: 0, width: 0, height: 0 } });
  const panelRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const restoreRef = useRef<HTMLButtonElement>(null);
  const consumedFocusRequest = useRef(0);
  const drag = useRef<{ id: number; x: number; y: number; left: number; top: number } | null>(null);
  const feedback = useSyncExternalStore(subscribeSearchFeedback, getSearchFeedback, getServerSearchFeedback);
  const minimized = preferences.mode === 'minimized';
  const visible = ready && allowed && preferences.mode !== 'hidden';
  const position = constrainPanel(preferences.position, geometry, geometry.viewport);

  useEffect(() => setValue(urlValue), [urlValue]);
  useEffect(() => {
    try { setPreferences(readPanelPreferences(localStorage.getItem(SEARCH_PANEL_STORAGE))); } catch { /* Keep working when storage is blocked. */ }
    setReady(true);
  }, []);
  useEffect(() => {
    if (!ready) return;
    try { localStorage.setItem(SEARCH_PANEL_STORAGE, JSON.stringify(preferences)); } catch { /* Preferences remain available in memory. */ }
  }, [preferences, ready]);

  useEffect(() => {
    if (!allowed) return;
    const open = () => {
      setPreferences(previous => ({ ...previous, mode: 'expanded' }));
      setFocused(true);
      setFocusRequest(previous => previous + 1);
    };
    window.addEventListener(OPEN_SEARCH_EVENT, open);
    return () => window.removeEventListener(OPEN_SEARCH_EVENT, open);
  }, [allowed]);

  useLayoutEffect(() => {
    if (visible && !minimized && focusRequest !== consumedFocusRequest.current) {
      inputRef.current?.focus({ preventScroll: true });
      consumedFocusRequest.current = focusRequest;
    }
  }, [visible, minimized, focusRequest]);

  useLayoutEffect(() => {
    const panel = panelRef.current;
    if (!visible || !panel) return;
    const measure = () => {
      const viewport = window.visualViewport;
      setGeometry({ width: panel.offsetWidth, height: panel.offsetHeight, viewport: {
        x: viewport?.offsetLeft ?? 0, y: viewport?.offsetTop ?? 0,
        width: viewport?.width ?? document.documentElement.clientWidth, height: viewport?.height ?? window.innerHeight,
      } });
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(panel);
    window.addEventListener('resize', measure);
    window.visualViewport?.addEventListener('resize', measure);
    window.visualViewport?.addEventListener('scroll', measure);
    return () => {
      observer.disconnect();
      window.removeEventListener('resize', measure);
      window.visualViewport?.removeEventListener('resize', measure);
      window.visualViewport?.removeEventListener('scroll', measure);
    };
  }, [visible, minimized]);

  function search(next: string) {
    const trimmed = next.trim();
    setValue(trimmed);
    if (trimmed) setPreferences(previous => ({ ...previous, recent: [trimmed.slice(0, 160), ...previous.recent.filter(item => item.toLowerCase() !== trimmed.toLowerCase())].slice(0, 5) }));
    setFocused(false);
    const params = new URLSearchParams(searchParams.toString());
    if (trimmed) params.set('search', trimmed); else params.delete('search');
    params.delete('category');
    params.delete('page');
    const query = params.toString();
    const href = query ? `/?${query}` : '/';
    if (updateFeedLocation(href)) window.scrollTo({ top: 0, behavior: 'instant' }); else router.push(href);
    if (window.matchMedia('(max-width: 639px)').matches) inputRef.current?.blur();
  }

  function resetPosition() { setPreferences(previous => ({ ...previous, position: null })); }
  function hide() {
    setPreferences(previous => ({ ...previous, mode: 'hidden' }));
    setFocused(false);
    document.querySelector<HTMLButtonElement>('header button[aria-controls="site-search"]')?.focus({ preventScroll: true });
  }

  if (!visible) return null;
  const matchingFeedback = pathname === '/' && urlValue.trim() && feedback?.query === urlValue.trim() ? feedback : null;

  return (
    <div ref={panelRef} className={`search-dock${minimized ? ' search-dock-minimized' : ''}${dragging ? ' is-dragging' : ''}`}
      style={{ left: position.x, top: position.y, maxWidth: geometry.viewport.width ? geometry.viewport.width - 24 : undefined, maxHeight: geometry.viewport.height ? geometry.viewport.height - 24 : undefined }}
      onBlurCapture={event => { if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setFocused(false); }}>
      <div className="search-dock-panel">
        <div className="search-dock-toolbar">
          <button type="button" className="search-dock-grip" aria-label="Move search panel" aria-describedby="search-move-help" title="Drag to move. Arrow keys move; Home resets."
            onPointerDown={event => {
              if (!event.isPrimary || event.button !== 0) return;
              const rect = panelRef.current!.getBoundingClientRect();
              drag.current = { id: event.pointerId, x: event.clientX, y: event.clientY, left: rect.left, top: rect.top };
              event.currentTarget.setPointerCapture(event.pointerId);
              setDragging(true);
            }}
            onPointerMove={event => {
              const start = drag.current;
              if (!start || start.id !== event.pointerId) return;
              const next = constrainPanel({ x: start.left + event.clientX - start.x, y: start.top + event.clientY - start.y }, geometry, geometry.viewport);
              setPreferences(previous => ({ ...previous, position: next }));
            }}
            onPointerUp={event => { if (drag.current?.id === event.pointerId) { drag.current = null; setDragging(false); event.currentTarget.releasePointerCapture(event.pointerId); } }}
            onPointerCancel={() => { drag.current = null; setDragging(false); }}
            onLostPointerCapture={() => { drag.current = null; setDragging(false); }}
            onKeyDown={event => {
              if (event.key === 'Home') { event.preventDefault(); resetPosition(); return; }
              const offsets: Record<string, [number, number]> = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] };
              const offset = offsets[event.key];
              if (!offset) return;
              event.preventDefault();
              const step = event.shiftKey ? 40 : 10;
              const next = constrainPanel({ x: position.x + offset[0] * step, y: position.y + offset[1] * step }, geometry, geometry.viewport);
              setPreferences(previous => ({ ...previous, position: next }));
            }}><Icon name="grip" /></button>
          <span id="search-move-help" className="sr-only">Drag to move. Use arrow keys to move 10 pixels, Shift and arrow keys for 40 pixels, or Home to reset.</span>
          {minimized ? <button ref={restoreRef} type="button" className="search-dock-restore" aria-label="Expand search" onClick={() => { setPreferences(previous => ({ ...previous, mode: 'expanded' })); setFocusRequest(previous => previous + 1); }}><Icon name="search" /> Search news</button>
            : <span className="search-dock-title">Search {siteConfig.name}</span>}
          <button type="button" className="search-dock-control" onClick={resetPosition} aria-label="Reset position" title="Reset position"><Icon name="reset" /></button>
          {!minimized && <button type="button" className="search-dock-control" aria-label="Minimize search" title="Minimize search" onClick={() => { setPreferences(previous => ({ ...previous, mode: 'minimized' })); setFocused(false); requestAnimationFrame(() => restoreRef.current?.focus({ preventScroll: true })); }}><Icon name="minus" /></button>}
          <button type="button" className="search-dock-control" aria-label="Hide search" title="Hide search · reopen from the header" onClick={hide}><Icon name="close" /></button>
        </div>
        {!minimized && <form role="search" aria-label={`Search ${siteConfig.name} news`} className="search-dock-body" onSubmit={event => { event.preventDefault(); search(value); }}>
          <div className="search-dock-input">
            <span className="ml-2 flex text-accent"><Icon name="search" /></span>
            <label htmlFor="site-search" className="sr-only">Search AI news</label>
            <input ref={inputRef} id="site-search" type="search" value={value} onChange={event => setValue(event.target.value)} onFocus={() => setFocused(true)} placeholder="Search AI news…" enterKeyHint="search" autoComplete="off" maxLength={160} className="min-w-0 flex-1 rounded-sm border-0 bg-transparent py-2 text-base text-fg placeholder:text-fg-muted focus-visible:ring-offset-0" />
            {value && <button type="button" className="search-dock-control" aria-label="Clear search" onClick={() => { search(''); inputRef.current?.focus({ preventScroll: true }); }}><Icon name="close" /></button>}
            <button type="submit" aria-label="Search news" disabled={!value.trim()} className="search-dock-submit"><Icon name="arrow" /></button>
          </div>
          <div role="group" aria-label="Quick searches" className="search-dock-suggestions">
            {quickSearches.map(query => <button key={query} type="button" onClick={() => search(query)}>{query}<span aria-hidden="true">↗</span></button>)}
          </div>
          {focused && preferences.recent.length > 0 && <div className="search-dock-recents">
            <div className="mb-2 flex items-center justify-between gap-2"><span className="text-[10px] font-semibold uppercase tracking-wider text-fg-muted">Recent searches</span><button type="button" className="px-2 py-2 text-xs font-medium text-accent hover:underline" onClick={() => { setPreferences(previous => ({ ...previous, recent: [] })); inputRef.current?.focus({ preventScroll: true }); }}>Clear history</button></div>
            <ul className="flex flex-wrap gap-2">{preferences.recent.map(query => <li key={query} className="min-w-0 max-w-full"><button type="button" className="block max-w-full truncate rounded-lg bg-accent-soft px-3 py-2 text-xs text-accent" onClick={() => search(query)}>{query}</button></li>)}</ul>
          </div>}
          <div role="status" aria-live="polite" aria-atomic="true" className="search-dock-feedback">
            {matchingFeedback ? <><span aria-hidden="true" className={matchingFeedback.status === 'loading' ? 'search-dock-spinner' : 'search-dock-status-dot'} />{matchingFeedback.status === 'loading' ? 'Searching news…' : matchingFeedback.status === 'error' ? 'Search unavailable. Retry in the results below.' : matchingFeedback.total === 0 ? 'No matching stories. Try another search.' : `${matchingFeedback.total} ${matchingFeedback.total === 1 ? 'story' : 'stories'} found`}</> : 'Find your next read.'}
          </div>
        </form>}
      </div>
    </div>
  );
}
