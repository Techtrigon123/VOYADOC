import { NextRequest } from "next/server";
import Customer from "@/models/Customer";
import { pickCustomer, serializeCustomer } from "@/lib/agent/customers";
import { requireAgent, escapeRegex, ok, fail } from "@/lib/agent/server";

export async function GET(req: NextRequest) {
  try {
    const { user, response } = await requireAgent();
    if (response) return response;
    const q = (req.nextUrl.searchParams.get("q") ?? "").trim();
    const filter: Record<string, unknown> = { agentId: user._id };
    if (q) {
      const re = new RegExp(escapeRegex(q), "i");
      filter.$or = [{ name: re }, { company: re }, { email: re }, { phone: re }];
    }
    const rows = await Customer.find(filter).sort({ updatedAt: -1 }).limit(200);
    return ok(rows.map(serializeCustomer));
  } catch (error) {
    console.error("[GET /api/agent/customers]", error);
    return fail("Could not load your saved customers.", 500);
  }
}

export async function POST(req: NextRequest) {
  try {
    const { user, response } = await requireAgent();
    if (response) return response;
    const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;
    const fields = pickCustomer(body ?? {});
    if (!fields.name && !fields.company) return fail("Add a company or person name before saving this customer.");
    const c = await Customer.create({ agentId: user._id, ...fields, name: fields.name || fields.company });
    return ok(serializeCustomer(c), { status: 201 });
  } catch (error) {
    console.error("[POST /api/agent/customers]", error);
    return fail("Could not save this customer. Try again.", 500);
  }
}
