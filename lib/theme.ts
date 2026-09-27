"use client";

import { useSyncExternalStore } from "react";
import { THEME_STORAGE_KEY } from "./theme-script";

/**
 * Site-wide light/dark theme. Stored in localStorage and mirrored on <html data-theme>;
 * the dark colours live in globals.css under html[data-theme="dark"].
 * The inline script that applies the saved choice before first paint lives in ./theme-script.
 */
export type Theme = "light" | "dark";

function read(): Theme {
  return document.documentElement.dataset.theme === "dark" ? "dark" : "light";
}

function subscribe(onChange: () => void) {
  const observer = new MutationObserver(onChange);
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
  return () => observer.disconnect();
}

export function setTheme(theme: Theme) {
  document.documentElement.dataset.theme = theme;
  try {
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch {
    /* private mode: the choice lasts until the tab closes */
  }
}

/** Current theme; "light" during server render. */
export function useTheme(): Theme {
  return useSyncExternalStore(subscribe, read, () => "light");
}
