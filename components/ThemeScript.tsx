/**
 * Applies the stored theme before first paint so the page never flashes the
 * wrong palette. Runs as a blocking inline script; it touches only
 * document.documentElement and localStorage.
 */
const script = `(function(){try{var s=localStorage.getItem('ai-pulse-theme');var d=s?s==='dark':window.matchMedia('(prefers-color-scheme: dark)').matches;document.documentElement.classList.toggle('dark',d);}catch(e){}})();`;

export function ThemeScript() {
  return <script dangerouslySetInnerHTML={{ __html: script }} />;
}
