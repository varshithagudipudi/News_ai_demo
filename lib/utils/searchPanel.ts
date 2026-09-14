export const SEARCH_PANEL_STORAGE = 'ai-pulse-search-panel';
export const OPEN_SEARCH_EVENT = 'ai-pulse:open-search';
export type Position = { x: number; y: number };
export type PanelPreferences = {
  mode: 'expanded' | 'minimized' | 'hidden';
  position: Position | null;
  recent: string[];
};
export const defaultPanelPreferences: PanelPreferences = { mode: 'expanded', position: null, recent: [] };

export function readPanelPreferences(raw: string | null): PanelPreferences {
  try {
    const data = JSON.parse(raw ?? 'null');
    if (!data || typeof data !== 'object') return defaultPanelPreferences;
    return {
      mode: ['expanded', 'minimized', 'hidden'].includes(data.mode) ? data.mode : 'expanded',
      position: Number.isFinite(data.position?.x) && Number.isFinite(data.position?.y) ? data.position : null,
      recent: Array.isArray(data.recent) ? [...new Set<string>(data.recent.filter((item: unknown) => typeof item === 'string' && item.trim()).map((item: string) => item.trim().slice(0, 160)))].slice(0, 5) : [],
    };
  } catch { return defaultPanelPreferences; }
}

/** Bounds use the visual viewport so zoom and the mobile keyboard stay usable. */
export function constrainPanel(position: Position | null, size: { width: number; height: number }, viewport: { x: number; y: number; width: number; height: number }): Position {
  const minX = viewport.x + 12;
  const minY = viewport.y + 12;
  const maxX = Math.max(minX, viewport.x + viewport.width - size.width - 12);
  const maxY = Math.max(minY, viewport.y + viewport.height - size.height - 12);
  return {
    x: Math.min(maxX, Math.max(minX, position?.x ?? viewport.x + (viewport.width - size.width) / 2)),
    y: Math.min(maxY, Math.max(minY, position?.y ?? maxY)),
  };
}

export type SearchFeedback = { query: string; status: 'loading' | 'ready' | 'error'; total?: number };
let feedback: SearchFeedback | null = null;
const listeners = new Set<() => void>();
export const getSearchFeedback = () => feedback;
export const getServerSearchFeedback = () => null;
export function subscribeSearchFeedback(listener: () => void) {
  listeners.add(listener);
  return () => { listeners.delete(listener); };
}
export function publishSearchFeedback(next: SearchFeedback) {
  feedback = next;
  listeners.forEach((listener) => listener());
}
