import { describe, expect, it } from 'vitest';
import { constrainPanel, readPanelPreferences } from '../lib/utils/searchPanel';

describe('search panel preferences and viewport recovery', () => {
  it('recovers from corrupt or unexpected browser storage', () => {
    for (const raw of ['{', 'null', '42', '{"mode":"other","position":{"x":"20","y":2},"recent":[null,7," AI agents ","AI agents"]}']) {
      const value = readPanelPreferences(raw);
      expect(value.mode).toBe('expanded');
      expect(value.position).toBeNull();
      expect(value.recent.every(item => typeof item === 'string')).toBe(true);
    }
  });
  it('retains the hidden state and position while bounding recent history', () => {
    const value = readPanelPreferences(JSON.stringify({ mode: 'hidden', position: { x: 100, y: 200 }, recent: Array.from({length: 8}, (_, i) => `${i}`) }));
    expect(value.mode).toBe('hidden');
    expect(value.position).toEqual({x: 100, y: 200});
    expect(value.recent).toHaveLength(5);
  });
  it('recovers desktop positions on mobile and clamps all edges', () => {
    const viewport = {x: 0, y: 0, width: 320, height: 600};
    expect(constrainPanel({x: 900, y: 800}, {width: 296, height: 200}, viewport)).toEqual({x: 12, y: 388});
    expect(constrainPanel({x: -30, y: -50}, {width: 296, height: 200}, viewport)).toEqual({x: 12, y: 12});
  });
  it('resets at bottom center and respects the visual viewport when zoomed', () => {
    expect(constrainPanel(null, {width: 520, height: 200}, {x: 0, y: 0, width: 1440, height: 900})).toEqual({x: 460, y: 688});
    expect(constrainPanel({x: 0, y: 900}, {width: 250, height: 150}, {x: 100, y: 200, width: 300, height: 400})).toEqual({x: 112, y: 438});
  });
});
