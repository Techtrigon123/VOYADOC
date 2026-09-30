/**
 * Timing for the auto-opening nudges: first appearance after 15 s,
 * "Remind me later" (or closing) snoozes for 10 minutes unless a prompt asks for a different
 * interval. Per browser tab session.
 */
export const FIRST_DELAY_MS = 15_000;
export const SNOOZE_MS = 10 * 60 * 1000;

function read(key: string): number {
  try {
    const n = Number(sessionStorage.getItem(key));
    return Number.isFinite(n) ? n : 0;
  } catch {
    return 0;
  }
}

export function snooze(key: string, ms = SNOOZE_MS, now = Date.now()) {
  try {
    sessionStorage.setItem(`${key}_dismissed`, "1");
    sessionStorage.setItem(`${key}_snooze_until`, String(now + ms));
  } catch {
    /* storage unavailable — prompt simply reappears sooner */
  }
}

/** Milliseconds to wait before the prompt may open on its own. */
export function delayFor(key: string, now = Date.now()): number {
  const until = read(`${key}_snooze_until`);
  if (until > now) return until - now;
  let dismissed = false;
  try {
    dismissed = sessionStorage.getItem(`${key}_dismissed`) === "1";
  } catch {
    /* ignore */
  }
  return dismissed ? 0 : FIRST_DELAY_MS;
}

/** True if the user pressed a key or typed in the last few seconds — used to avoid popping up mid-word. */
let lastTypedAt = 0;
if (typeof window !== "undefined") {
  const mark = () => {
    lastTypedAt = Date.now();
  };
  window.addEventListener("keydown", mark, { capture: true, passive: true });
  window.addEventListener("input", mark, { capture: true, passive: true });
}
export const TYPING_PAUSE_MS = 4_000;
export function isTyping(now = Date.now()): boolean {
  return now - lastTypedAt < TYPING_PAUSE_MS;
}
