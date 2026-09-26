/**
 * Timing for the auto-opening nudges: first appearance after 15 s,
 * "Remind me later" (or closing) snoozes for 10 minutes. Per browser tab session.
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

export function snooze(key: string, now = Date.now()) {
  try {
    sessionStorage.setItem(`${key}_dismissed`, "1");
    sessionStorage.setItem(`${key}_snooze_until`, String(now + SNOOZE_MS));
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
