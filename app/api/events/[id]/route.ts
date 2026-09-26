import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { connectDB } from "@/lib/db/mongoose";
import Event from "@/models/Event";
import Attendee from "@/models/Attendee";
import { withAuth } from "@/lib/auth/middleware";

type RouteContext = { params: Promise<{ id: string }> };

const updateEventSchema = z.object({
  title: z.string().min(3).max(200).optional(),
  description: z.string().min(10).max(5000).optional(),
  status: z.enum(["draft", "published", "ongoing", "completed", "cancelled"]).optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  venue: z
    .object({
      name: z.string().min(1),
      address: z.string().min(1),
      city: z.string().min(1),
      state: z.string().min(1),
      pincode: z.string().optional(),
    })
    .optional(),
  totalCapacity: z.number().int().min(1).optional(),
  certificateEnabled: z.boolean().optional(),
});

// GET /api/events/[id]
export const GET = withAuth(async (req, { session }) => {
  const { id } = await (req as unknown as { [Symbol.iterator]: unknown } & RouteContext).params || {};
  // Extract params from URL
  const urlParts = req.url.split("/");
  const eventId = urlParts[urlParts.length - 1];

  try {
    await connectDB();
    const event = await Event.findOne({
      _id: eventId,
      organizerId: session.userId,
    }).lean();

    if (!event) {
      return NextResponse.json(
        { success: false, error: "Event not found." },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: event });
  } catch (error) {
    console.error("[GET /api/events/[id]]", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch event." },
      { status: 500 }
    );
  }
});

// PATCH /api/events/[id]
export const PATCH = withAuth(async (req, { session }) => {
  const urlParts = req.url.split("/");
  const eventId = urlParts[urlParts.length - 1];

  try {
    const body = await req.json();
    const parsed = updateEventSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    await connectDB();
    const event = await Event.findOneAndUpdate(
      { _id: eventId, organizerId: session.userId },
      { $set: parsed.data },
      { new: true, runValidators: true }
    );

    if (!event) {
      return NextResponse.json(
        { success: false, error: "Event not found." },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: event });
  } catch (error) {
    console.error("[PATCH /api/events/[id]]", error);
    return NextResponse.json(
      { success: false, error: "Failed to update event." },
      { status: 500 }
    );
  }
});

// DELETE /api/events/[id]
export const DELETE = withAuth(async (req, { session }) => {
  const urlParts = req.url.split("/");
  const eventId = urlParts[urlParts.length - 1];

  try {
    await connectDB();

    const event = await Event.findOne({
      _id: eventId,
      organizerId: session.userId,
    });

    if (!event) {
      return NextResponse.json(
        { success: false, error: "Event not found." },
        { status: 404 }
      );
    }

    // Delete related attendees
    await Attendee.deleteMany({ eventId });
    await Event.deleteOne({ _id: eventId });

    return NextResponse.json({ success: true, message: "Event deleted." });
  } catch (error) {
    console.error("[DELETE /api/events/[id]]", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete event." },
      { status: 500 }
    );
  }
});
