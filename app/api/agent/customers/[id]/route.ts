import { NextRequest } from "next/server";
import { requireAgent, isUuid, ok, fail } from "@/lib/agent/server";
import { pickCustomer, serializeCustomer } from "@/lib/agent/customers";
import { deleteCustomer, getCustomer, updateCustomer } from "@/lib/db/repo";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Ctx) {
  try {
    const { id } = await params;
    const { user, response } = await requireAgent();
    if (response) return response;
    if (!isUuid(id)) return fail("Could not load this customer.", 404);
    const c = await getCustomer(user.id, id);
    return c ? ok(serializeCustomer(c)) : fail("Could not load this customer.", 404);
  } catch (error) {
    console.error("[GET /api/agent/customers/:id]", error);
    return fail("Could not load this customer. Try again.", 500);
  }
}

export async function PATCH(req: NextRequest, { params }: Ctx) {
  try {
    const { id } = await params;
    const { user, response } = await requireAgent();
    if (response) return response;
    if (!isUuid(id)) return fail("Could not load this customer.", 404);
    const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;
    const fields = pickCustomer(body ?? {});
    if ("name" in fields && !fields.name && !fields.company)
      return fail("Add a company or person name before saving this customer.");
    const c = await updateCustomer(user.id, id, fields);
    return c ? ok(serializeCustomer(c)) : fail("Could not load this customer.", 404);
  } catch (error) {
    console.error("[PATCH /api/agent/customers/:id]", error);
    return fail("Could not save this customer. Try again.", 500);
  }
}

export async function DELETE(_req: NextRequest, { params }: Ctx) {
  try {
    const { id } = await params;
    const { user, response } = await requireAgent();
    if (response) return response;
    if (!isUuid(id)) return fail("Customer not found.", 404);
    await deleteCustomer(user.id, id);
    return ok(true);
  } catch (error) {
    console.error("[DELETE /api/agent/customers/:id]", error);
    return fail("Could not delete this customer. Try again.", 500);
  }
}
