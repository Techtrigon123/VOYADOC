import { NextRequest } from "next/server";
import { requireAgent, ok, fail } from "@/lib/agent/server";
import { listDocuments, updateUser, type UserRecord } from "@/lib/db/repo";

type Kind = "invoice" | "proforma" | "receipt";
const KINDS: Kind[] = ["invoice", "proforma", "receipt"];

const escapeRegex = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

function settingsOf(user: UserRecord) {
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
async function suggestions(user: UserRecord) {
  const settings = settingsOf(user);
  const out: Record<Kind, { next: string; saved: string[] }> = {} as never;
  for (const kind of KINDS) {
    const prefix = prefixFor(settings, kind);
    const saved = (await listDocuments(user.id, { kinds: [kind], limit: 200 }))
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
    const updated = await updateUser(user.id, {
      documentNumberSettings: {
        invoicePrefix: clean(body?.invoicePrefix, "INV-"),
        proformaPrefix: clean(body?.proformaPrefix, "PI-"),
        receiptPrefix: clean(body?.receiptPrefix, "RCPT-"),
        digits,
      },
    });
    return ok(await suggestions(updated), {
      message: 'Number format saved to your account. Use "Use next suggested number" or type any custom reference you prefer.',
    });
  } catch (error) {
    console.error("[PUT /api/agent/invoice-numbers]", error);
    return fail("Could not save number format. Check your connection and try again.", 500);
  }
}
