import { NextRequest } from "next/server";
import { requireAgent, ok, fail } from "@/lib/agent/server";
import { listDocuments } from "@/lib/db/repo";

interface VoucherHotel {
  hotelName?: string;
  hotelAddress?: string;
  city?: string;
  hotelEmail?: string;
  hotelPhone?: string;
  rooms?: { roomName?: string }[];
}

/** Hotels the agent has used before — typed suggestions for the voucher form. */
export async function GET(req: NextRequest) {
  try {
    const { user, response } = await requireAgent();
    if (response) return response;
    const q = (req.nextUrl.searchParams.get("q") ?? "").trim();
    if (q.length < 2) return ok([]);

    const docs = await listDocuments(user.id, {
      kinds: ["hotel_voucher"],
      q,
      field: "hotel",
      withData: true,
      order: "updated_desc",
      limit: 200,
    });

    // Newest voucher wins for contact details; room names are collected across all of them.
    const byName = new Map<string, { name: string; address: string; city: string; email: string; phone: string; rooms: Set<string> }>();
    for (const d of docs) {
      const h = d.data as VoucherHotel;
      const name = h.hotelName?.trim();
      if (!name) continue;
      const entry =
        byName.get(name) ??
        { name, address: h.hotelAddress ?? "", city: h.city ?? "", email: h.hotelEmail ?? "", phone: h.hotelPhone ?? "", rooms: new Set<string>() };
      const room = h.rooms?.[0]?.roomName?.trim();
      if (room) entry.rooms.add(room);
      byName.set(name, entry);
    }

    return ok([...byName.values()].slice(0, 8).map((e) => ({ ...e, rooms: [...e.rooms] })));
  } catch (error) {
    console.error("[GET /api/agent/hotel-suggestions]", error);
    return fail("Could not load hotel list. You can still type the name manually.", 500);
  }
}
