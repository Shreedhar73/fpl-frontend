/**
 * The colour scheme choice: system, light or dark. Stored in the reader's browser only.
 *
 * Two places apply it and they must agree. An inline script in `layout.tsx` stamps
 * `data-theme` on `<html>` before first paint, so a stored choice never flashes the other scheme;
 * this module is what the toggle and any later change go through. The CSS in `globals.css`
 * honours the system scheme whenever nothing is stamped.
 */
export type Theme = 'system' | 'light' | 'dark';

export const THEME_KEY = 'theme';
const EVENT = 'fpl-advisor:theme';
const ORDER: Theme[] = ['system', 'light', 'dark'];

export function getTheme(): Theme {
  if (typeof window === 'undefined') return 'system';
  try {
    const t = window.localStorage.getItem(THEME_KEY);
    return t === 'light' || t === 'dark' ? t : 'system';
  } catch {
    return 'system';
  }
}

export function getServerTheme(): Theme {
  return 'system';
}

export function applyTheme(theme: Theme): void {
  const root = document.documentElement;
  if (theme === 'system') delete root.dataset.theme;
  else root.dataset.theme = theme;
}

export function setTheme(theme: Theme): void {
  try {
    if (theme === 'system') window.localStorage.removeItem(THEME_KEY);
    else window.localStorage.setItem(THEME_KEY, theme);
  } catch {
    // No storage: the choice lasts for this page and no longer.
  }
  applyTheme(theme);
  window.dispatchEvent(new Event(EVENT));
}

export function nextTheme(theme: Theme): Theme {
  return ORDER[(ORDER.indexOf(theme) + 1) % ORDER.length];
}

export function subscribeTheme(onChange: () => void): () => void {
  window.addEventListener(EVENT, onChange);
  window.addEventListener('storage', onChange);
  return () => {
    window.removeEventListener(EVENT, onChange);
    window.removeEventListener('storage', onChange);
  };
}

/**
 * What the inline script runs before paint. Kept here beside `getTheme` so the two cannot drift:
 * it reads the same key and accepts the same two values.
 */
export const THEME_BOOT_SCRIPT = `try{var t=localStorage.getItem(${JSON.stringify(THEME_KEY)});if(t==='light'||t==='dark'){document.documentElement.dataset.theme=t}}catch(e){}`;
