/**
 * Server-safe part of the site theme: the storage key and the inline script (run in <head> by the
 * root layout) that applies the saved light/dark choice to <html data-theme> before first paint,
 * on every page. Light is the default. Kept apart from lib/theme.ts, which uses client-only hooks.
 */
export const THEME_STORAGE_KEY = "vouchlio-theme";

export const THEME_SCRIPT = `try{var t=localStorage.getItem("${THEME_STORAGE_KEY}");document.documentElement.dataset.theme=t==="dark"?"dark":"light"}catch(e){}`;
