import "server-only";
import { createHash } from "crypto";
import type { UserPatch, UserRecord } from "@/lib/db/repo";
import { VERIFIED_FIELDS, type VerificationStatus, type VerifiedField } from "./verification-shared";

/**
 * Moves an agent through the review statuses as they edit their profile. The admin portal does the
 * check / approve / deny steps; this only handles submission and noticing later edits.
 */

export type Fingerprint = Partial<Record<VerifiedField, string>>;

const FIELDS = Object.keys(VERIFIED_FIELDS) as VerifiedField[];

/** Short per-field hashes of the reviewed details (keys match the admin portal's fingerprint). */
export function fingerprint(user: UserRecord): Fingerprint {
  const out: Fingerprint = {};
  for (const f of FIELDS) {
    const v = String((user as unknown as Record<string, unknown>)[f] ?? "").trim();
    out[f] = createHash("sha256").update(v).digest("hex").slice(0, 16);
  }
  return out;
}

function changedFields(now: Fingerprint, before: Fingerprint | null | undefined): VerifiedField[] {
  if (!before) return [];
  return FIELDS.filter((f) => (now[f] ?? "") !== (before[f] ?? ""));
}

const same = (a: Fingerprint, b: Fingerprint | null | undefined) => !!b && changedFields(a, b).length === 0;
const sameList = (a: string[], b: string[] | undefined) => a.length === (b ?? []).length && a.every((x) => (b ?? []).includes(x));

/**
 * The status change (if any) after the agent's profile was saved.
 * `complete` = the profile has every detail needed to be reviewed.
 */
export function verificationTransition(user: UserRecord, complete: boolean): UserPatch | null {
  const status = user.verificationStatus as VerificationStatus | undefined;
  if (!status) return null; // migration 0007 not run yet
  const fp = fingerprint(user);
  const decided = user.verificationFingerprint as Fingerprint | undefined;
  const checked = user.verificationCheckedFingerprint as Fingerprint | undefined;
  const submit = (s: VerificationStatus): UserPatch => ({ verificationStatus: s, verificationSubmittedAt: new Date(), verificationChanges: [] });

  switch (status) {
    case "not_submitted":
      return complete ? submit("pending") : null;

    case "pending":
      return complete ? null : { verificationStatus: "not_submitted", verificationChanges: [] };

    case "checked":
      if (!complete) return { verificationStatus: "not_submitted", verificationChanges: [] };
      // Edited after the sub-admin checked it: needs checking again.
      return same(fp, checked) ? null : { verificationStatus: "pending", verificationSubmittedAt: new Date() };

    case "denied":
      // Resubmitted once the agent changes something and the profile is complete.
      return complete && !same(fp, decided) ? { ...submit("pending"), verificationNote: undefined } : null;

    case "approved": {
      if (!decided) return { verificationFingerprint: fp }; // approved before fingerprints existed: adopt as baseline
      const diff = changedFields(fp, decided);
      return diff.length ? { verificationStatus: "changes_pending", verificationSubmittedAt: new Date(), verificationChanges: diff } : null;
    }

    case "changes_pending": {
      const diff = changedFields(fp, decided);
      if (!diff.length) return { verificationStatus: "approved", verificationChanges: [] }; // changes undone
      return sameList(diff, user.verificationChanges) ? null : { verificationChanges: diff };
    }

    case "changes_checked": {
      if (same(fp, checked)) return null;
      const diff = changedFields(fp, decided);
      return diff.length ? { verificationStatus: "changes_pending", verificationSubmittedAt: new Date(), verificationChanges: diff } : { verificationStatus: "approved", verificationChanges: [] };
    }
  }
  return null;
}
