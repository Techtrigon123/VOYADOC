import { NextRequest } from "next/server";
import { pickCustomer, serializeCustomer } from "@/lib/agent/customers";
import { requireAgent, ok, fail } from "@/lib/agent/server";
import { createCustomer, listCustomers } from "@/lib/db/repo";

export async function GET(req: NextRequest) {
  try {
    const { user, response } = await requireAgent();
    if (response) return response;
    const rows = await listCustomers(user.id, req.nextUrl.searchParams.get("q") ?? undefined);
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
    const c = await createCustomer(user.id, { ...fields, name: fields.name || fields.company });
    return ok(serializeCustomer(c), { status: 201 });
  } catch (error) {
    console.error("[POST /api/agent/customers]", error);
    return fail("Could not save this customer. Try again.", 500);
  }
}
