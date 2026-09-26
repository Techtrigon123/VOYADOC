import { NextRequest } from "next/server";
import { isValidObjectId } from "mongoose";
import Customer from "@/models/Customer";
import { requireAgent, ok, fail } from "@/lib/agent/server";
import { pickCustomer, serializeCustomer } from "@/lib/agent/customers";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Ctx) {
  const { id } = await params;
  const { user, response } = await requireAgent();
  if (response) return response;
  if (!isValidObjectId(id)) return fail("Could not load this customer.", 404);
  const c = await Customer.findOne({ _id: id, agentId: user._id });
  return c ? ok(serializeCustomer(c)) : fail("Could not load this customer.", 404);
}

export async function PATCH(req: NextRequest, { params }: Ctx) {
  try {
    const { id } = await params;
    const { user, response } = await requireAgent();
    if (response) return response;
    if (!isValidObjectId(id)) return fail("Could not load this customer.", 404);
    const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;
    const fields = pickCustomer(body ?? {});
    if ("name" in fields && !fields.name && !fields.company)
      return fail("Add a company or person name before saving this customer.");
    const c = await Customer.findOneAndUpdate({ _id: id, agentId: user._id }, fields, { new: true });
    return c ? ok(serializeCustomer(c)) : fail("Could not load this customer.", 404);
  } catch (error) {
    console.error("[PATCH /api/agent/customers/:id]", error);
    return fail("Could not save this customer. Try again.", 500);
  }
}

export async function DELETE(_req: NextRequest, { params }: Ctx) {
  const { id } = await params;
  const { user, response } = await requireAgent();
  if (response) return response;
  if (!isValidObjectId(id)) return fail("Customer not found.", 404);
  await Customer.deleteOne({ _id: id, agentId: user._id });
  return ok(true);
}
