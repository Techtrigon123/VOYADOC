import "server-only";
import { countNewDocumentsSince, type UserRecord } from "@/lib/db/repo";
import {
  effectivePlan,
  FREE_MONTHLY_DOCUMENTS,
  freePeriodStart,
  lowestPlanFor,
  nextFreeReset,
  planIncludes,
  planName,
  SERVICE_LABELS,
} from "./plans";
import type { DocumentAccess, DocumentKind } from "./types";

/**
 * Server-side plan enforcement. Every route that creates, edits or downloads a document
 * calls these, so plan rules hold even if someone bypasses the screens.
 */

export interface Block {
  message: string;
  status: number;
  code: "PLAN_REQUIRED" | "FREE_LIMIT";
  requiredPlan?: string;
}

const upgradeMessage = (kind: DocumentKind) => {
  const need = lowestPlanFor(kind);
  const plans = need === "gold" ? "Gold or Platinum" : "Platinum";
  return `${SERVICE_LABELS[kind]} are included in the ${plans} plan${need === "gold" ? "s" : ""}. Upgrade or renew to use them.`;
};

/** Is this document type open on the account's current plan? */
export function serviceBlock(user: UserRecord, kind: DocumentKind): Block | null {
  if (planIncludes(effectivePlan(user), kind)) return null;
  return { message: upgradeMessage(kind), status: 402, code: "PLAN_REQUIRED", requiredPlan: lowestPlanFor(kind) };
}

/** Silver's monthly allowance of new documents. */
export async function freeUsage(user: UserRecord): Promise<{ used: number; limit: number; resetsAt: string } | null> {
  if (effectivePlan(user) !== "silver") return null;
  const used = await countNewDocumentsSince(user.id, freePeriodStart());
  return { used, limit: FREE_MONTHLY_DOCUMENTS, resetsAt: nextFreeReset().toISOString() };
}

/**
 * May the account create a document of this kind? New versions of an existing document
 * don't count toward Silver's monthly allowance, but still need the service to be open.
 */
export async function creationBlock(user: UserRecord, kind: DocumentKind, opts: { newVersion?: boolean } = {}): Promise<Block | null> {
  const service = serviceBlock(user, kind);
  if (service) return service;
  if (opts.newVersion) return null;
  const usage = await freeUsage(user);
  if (usage && usage.used >= usage.limit) {
    const resets = new Date(usage.resetsAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", timeZone: "Asia/Kolkata" });
    return {
      message: `You've used all ${usage.limit} free documents for this month. Upgrade to ${planName("gold")} or ${planName("platinum")} for unlimited documents, or wait until ${resets}.`,
      status: 402,
      code: "FREE_LIMIT",
    };
  }
  return null;
}

/** Why a saved document can't be opened, as an API error (message, status, code). */
export function lockedDocument(access: DocumentAccess, kind: DocumentKind): { message: string; status: number; code: string } {
  if (access.reason === "plan") return { message: upgradeMessage(kind), status: 402, code: "PLAN_REQUIRED" };
  return {
    message: "Locked — Silver keeps documents open for 30 days from creation. Upgrade to Gold or Platinum to open this again.",
    status: 403,
    code: "HISTORY_LOCKED",
  };
}
