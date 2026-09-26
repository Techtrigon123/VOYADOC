import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { connectDB } from "@/lib/db/mongoose";
import Event from "@/models/Event";
import Attendee from "@/models/Attendee";
import { withAuth } from "@/lib/auth/middleware";

function getEventId(req: NextRequest): string {
  const urlParts = req.url.split("/");
  const checkinIndex = urlParts.indexOf("checkin");
  return urlParts[checkinIndex - 1];
}

const checkInSchema = z.object({
  qrCode: z.string().optional(),
  registrationId: z.string().optional(),
  method: z.enum(["qr", "manual"]).default("qr"),
}).refine((d) => d.qrCode || d.registrationId, {
  message: "Either qrCode or registrationId is required",
});

// POST /api/events/[id]/checkin — check in an attendee
export const POST = withAuth(async (req, { session }) => {
  const eventId = getEventId(req);

  try {
    const body = await req.json();
    const parsed = checkInSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    await connectDB();

    // Verify event ownership
    const event = await Event.findOne({ _id: eventId, organizerId: session.userId });
    if (!event) {
      return NextResponse.json({ success: false, error: "Event not found." }, { status: 404 });
    }

    // Find attendee
    const query: Record<string, unknown> = { eventId };
    if (parsed.data.qrCode) query.qrCode = parsed.data.qrCode;
    else if (parsed.data.registrationId) query.registrationId = parsed.data.registrationId;

    const attendee = await Attendee.findOne(query);
    if (!attendee) {
      return NextResponse.json(
        { success: false, error: "Attendee not found. QR code or registration ID is invalid." },
        { status: 404 }
      );
    }

    // Already checked in
    if (attendee.status === "checked_in") {
      return NextResponse.json(
        {
          success: false,
          error: `${attendee.name} is already checked in.`,
          alreadyCheckedIn: true,
          attendee: {
            name: attendee.name,
            email: attendee.email,
            checkedInAt: attendee.checkedInAt,
          },
        },
        { status: 409 }
      );
    }

    // Perform check-in
    const now = new Date();
    attendee.status = "checked_in";
    attendee.checkedInAt = now;
    attendee.checkedInBy = session.userId as unknown as import("mongoose").Types.ObjectId;
    await attendee.save();

    // Update event check-in count
    await Event.findByIdAndUpdate(eventId, { $inc: { totalCheckedIn: 1 } });

    return NextResponse.json({
      success: true,
      message: `${attendee.name} checked in successfully.`,
      attendee: {
        id: attendee._id.toString(),
        name: attendee.name,
        email: attendee.email,
        phone: attendee.phone,
        organization: attendee.organization,
        ticketTierName: attendee.ticketTierName,
        registrationId: attendee.registrationId,
        checkedInAt: now,
      },
    });
  } catch (error) {
    console.error("[POST /api/events/[id]/checkin]", error);
    return NextResponse.json(
      { success: false, error: "Check-in failed. Please try again." },
      { status: 500 }
    );
  }
});

// GET /api/events/[id]/checkin — get attendee list for offline use
export const GET = withAuth(async (req, { session }) => {
  const eventId = getEventId(req);

  try {
    await connectDB();

    const event = await Event.findOne({ _id: eventId, organizerId: session.userId });
    if (!event) {
      return NextResponse.json({ success: false, error: "Event not found." }, { status: 404 });
    }

    // Return lightweight attendee list for offline check-in
    const attendees = await Attendee.find(
      { eventId, status: { $ne: "cancelled" } },
      "name email phone organization registrationId qrCode status checkedInAt ticketTierName"
    ).lean();

    return NextResponse.json({
      success: true,
      data: attendees,
      event: {
        id: event._id.toString(),
        title: event.title,
        totalCheckedIn: event.totalCheckedIn,
        totalRegistrations: event.totalRegistrations,
      },
    });
  } catch (error) {
    console.error("[GET /api/events/[id]/checkin]", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch check-in data." },
      { status: 500 }
    );
  }
});
