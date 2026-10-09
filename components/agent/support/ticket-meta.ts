/** Labels and badge colours for support tickets (agent app). */

export type TicketStatus = "open" | "in_progress" | "waiting" | "resolved" | "closed";

export const STATUS_META: Record<TicketStatus, { label: string; tone: string }> = {
  open: { label: "Open", tone: "bg-sky-50 text-sky-700" },
  in_progress: { label: "In progress", tone: "bg-amber-50 text-amber-700" },
  waiting: { label: "Waiting on you", tone: "bg-violet-50 text-violet-700" },
  resolved: { label: "Resolved", tone: "bg-emerald-50 text-emerald-700" },
  closed: { label: "Closed", tone: "bg-slate-100 text-slate-500" },
};

export const CATEGORY_LABELS: Record<string, string> = {
  general: "General question",
  documents: "Documents & PDFs",
  billing: "Plans & billing",
  account: "Account & profile",
  technical: "Technical problem",
  bug: "Bug report",
};

export const PRIORITY_LABELS: Record<string, string> = { low: "Low", normal: "Normal", high: "High", urgent: "Urgent" };

export function timeAgo(iso: string): string {
  const s = Math.max(0, (Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s / 60)} min ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  if (s < 7 * 86400) return `${Math.floor(s / 86400)} day${s < 2 * 86400 ? "" : "s"} ago`;
  return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}
