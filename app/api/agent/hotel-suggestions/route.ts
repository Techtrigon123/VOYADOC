import { NextRequest } from "next/server";
import AgentDocument from "@/models/AgentDocument";
import { requireAgent, escapeRegex, ok, fail } from "@/lib/agent/server";

/** Hotels the agent has used before — typed suggestions for the voucher form. */
export async function GET(req: NextRequest) {
  try {
    const { user, response } = await requireAgent();
    if (response) return response;
    const q = (req.nextUrl.searchParams.get("q") ?? "").trim();
    if (q.length < 2) return ok([]);

    const rows = await AgentDocument.aggregate<{
      _id: string;
      hotelAddress?: string;
      city?: string;
      hotelEmail?: string;
      hotelPhone?: string;
      rooms: string[];
    }>([
      { $match: { agentId: user._id, kind: "hotel_voucher", "data.hotelName": new RegExp(escapeRegex(q), "i") } },
      { $sort: { updatedAt: -1 } },
      {
        $group: {
          _id: "$data.hotelName",
          hotelAddress: { $first: "$data.hotelAddress" },
          city: { $first: "$data.city" },
          hotelEmail: { $first: "$data.hotelEmail" },
          hotelPhone: { $first: "$data.hotelPhone" },
          rooms: { $addToSet: { $arrayElemAt: ["$data.rooms.roomName", 0] } },
        },
      },
      { $limit: 8 },
    ]);

    return ok(
      rows.map((r) => ({
        name: r._id,
        address: r.hotelAddress ?? "",
        city: r.city ?? "",
        email: r.hotelEmail ?? "",
        phone: r.hotelPhone ?? "",
        rooms: (r.rooms ?? []).filter(Boolean),
      }))
    );
  } catch (error) {
    console.error("[GET /api/agent/hotel-suggestions]", error);
    return fail("Could not load hotel list. You can still type the name manually.", 500);
  }
}
