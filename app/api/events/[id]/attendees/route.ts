import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { connectDB } from "@/lib/db/mongoose";
import Event from "@/models/Event";
import Attendee from "@/models/Attendee";
import { withAuth } from "@/lib/auth/middleware";
import { generateId } from "@/lib/utils";

function getEventId(req: NextRequest): string {
  const urlParts = req.url.split("/");
  const attendeesIndex = urlParts.indexOf("attendees");
  return urlParts[attendeesIndex - 1];
}

const addAttendeeSchema = z.object({
  name: z.string().min(1).max(200),
  email: z.string().email(),
  phone: z.string().optional(),
  organization: z.string().optional(),
  ticketTierId: z.string().optional(),
});

// GET /api/events/[id]/attendees
export const GET = withAuth(async (req, { session }) => {
  const eventId = getEventId(req);

  try {
    await connectDB();

    // Verify event ownership
    const event = await Event.findOne({ _id: eventId, organizerId: session.userId });
    if (!event) {
      return NextResponse.json({ success: false, error: "Event not found." }, { status: 404 });
    }

    const { searchParams } = new URL(req.url);
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const limit = Math.min(100, parseInt(searchParams.get("limit") || "50"));
    const search = searchParams.get("search") || "";
    const status = searchParams.get("status") || "";
    const skip = (page - 1) * limit;

    const query: Record<string, unknown> = { eventId };
    if (status && status !== "all") query.status = status;
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { registrationId: { $regex: search, $options: "i" } },
      ];
    }

    const [attendees, total] = await Promise.all([
      Attendee.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      Attendee.countDocuments(query),
    ]);

    return NextResponse.json({
      success: true,
      data: attendees,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error("[GET /api/events/[id]/attendees]", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch attendees." },
      { status: 500 }
    );
  }
});

// POST /api/events/[id]/attendees — add single attendee
export const POST = withAuth(async (req, { session }) => {
  const eventId = getEventId(req);

  try {
    const body = await req.json();
    const parsed = addAttendeeSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    await connectDB();

    const event = await Event.findOne({ _id: eventId, organizerId: session.userId });
    if (!event) {
      return NextResponse.json({ success: false, error: "Event not found." }, { status: 404 });
    }

    // Check capacity
    if (event.totalRegistrations >= event.totalCapacity) {
      return NextResponse.json(
        { success: false, error: "Event is at full capacity." },
        { status: 409 }
      );
    }

    // Check duplicate email
    const duplicate = await Attendee.findOne({ eventId, email: parsed.data.email });
    if (duplicate) {
      return NextResponse.json(
        { success: false, error: "An attendee with this email is already registered." },
        { status: 409 }
      );
    }

    const registrationId = `REG-${generateId(8)}`;
    const qrCode = `QR-${eventId}-${generateId(12)}`;

    // Resolve ticket tier name
    let ticketTierName: string | undefined;
    if (parsed.data.ticketTierId) {
      const tier = event.ticketTiers.find((t) => t.id === parsed.data.ticketTierId);
      ticketTierName = tier?.name;
    }

    const attendee = await Attendee.create({
      eventId,
      ...parsed.data,
      ticketTierName,
      registrationId,
      qrCode,
      status: "registered",
    });

    // Update event count
    await Event.findByIdAndUpdate(eventId, { $inc: { totalRegistrations: 1 } });

    return NextResponse.json({ success: true, data: attendee }, { status: 201 });
  } catch (error) {
    console.error("[POST /api/events/[id]/attendees]", error);
    return NextResponse.json(
      { success: false, error: "Failed to add attendee." },
      { status: 500 }
    );
  }
});
