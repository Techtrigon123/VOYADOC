import { NextRequest } from "next/server";
import AgentDocument from "@/models/AgentDocument";
import { requireAgent, escapeRegex, ok, fail } from "@/lib/agent/server";
import type { IUser } from "@/models/User";

type Kind = "invoice" | "proforma" | "receipt";
const KINDS: Kind[] = ["invoice", "proforma", "receipt"];

function settingsOf(user: IUser) {
  const s = user.documentNumberSettings;
  return {
    invoicePrefix: s?.invoicePrefix ?? "INV-",
    proformaPrefix: s?.proformaPrefix ?? "PI-",
    receiptPrefix: s?.receiptPrefix ?? "RCPT-",
    digits: s?.digits ?? 4,
  };
}

const prefixFor = (s: ReturnType<typeof settingsOf>, k: Kind) =>
  k === "invoice" ? s.invoicePrefix : k === "proforma" ? s.proformaPrefix : s.receiptPrefix;

/** Next number = one above the largest saved number sharing the prefix (custom IDs included). */
async function suggestions(user: IUser) {
  const settings = settingsOf(user);
  const out: Record<Kind, { next: string; saved: string[] }> = {} as never;
  for (const kind of KINDS) {
    const prefix = prefixFor(settings, kind);
    const saved = (await AgentDocument.find({ agentId: user._id, kind }).sort({ createdAt: -1 }).limit(200).select("number"))
      .map((d) => d.number ?? "")
      .filter(Boolean);
    const re = new RegExp(`^${escapeRegex(prefix)}(\\d+)$`);
    const max = saved.reduce((m, n) => {
      const hit = re.exec(n);
      return hit ? Math.max(m, parseInt(hit[1], 10)) : m;
    }, 0);
    out[kind] = { next: `${prefix}${String(max + 1).padStart(settings.digits, "0")}`, saved };
  }
  return { settings, ...out };
}

export async function GET() {
  try {
    const { user, response } = await requireAgent();
    if (response) return response;
    return ok(await suggestions(user));
  } catch (error) {
    console.error("[GET /api/agent/invoice-numbers]", error);
    return fail("Could not load number settings.", 500);
  }
}

export async function PUT(req: NextRequest) {
  try {
    const { user, response } = await requireAgent();
    if (response) return response;
    const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;
    const clean = (v: unknown, d: string) => String(v ?? d).replace(/\s/g, "").slice(0, 12) || d;
    const digits = Math.min(8, Math.max(1, parseInt(String(body?.digits ?? 4), 10) || 4));
    user.documentNumberSettings = {
      invoicePrefix: clean(body?.invoicePrefix, "INV-"),
      proformaPrefix: clean(body?.proformaPrefix, "PI-"),
      receiptPrefix: clean(body?.receiptPrefix, "RCPT-"),
      digits,
    };
    await user.save();
    return ok(await suggestions(user), {
      message: 'Number format saved to your account. Use "Use next suggested number" or type any custom reference you prefer.',
    });
  } catch (error) {
    console.error("[PUT /api/agent/invoice-numbers]", error);
    return fail("Could not save number format. Check your connection and try again.", 500);
  }
}
