import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { connectDB } from "@/lib/db/mongoose";
import Event from "@/models/Event";
import { withAuth } from "@/lib/auth/middleware";
import { slugify, generateId } from "@/lib/utils";

const createEventSchema = z.object({
  title: z.string().min(3).max(200),
  description: z.string().min(10).max(5000),
  category: z.enum([
    "conference","workshop","meetup","sports","concert","exhibition","corporate","other",
  ]),
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
  venue: z.object({
    name: z.string().min(1),
    address: z.string().min(1),
    city: z.string().min(1),
    state: z.string().min(1),
    pincode: z.string().optional(),
  }),
  totalCapacity: z.number().int().min(1).max(100000),
  requiresPayment: z.boolean().default(false),
  certificateEnabled: z.boolean().default(false),
  ticketTiers: z
    .array(
      z.object({
        name: z.string().min(1),
        price: z.number().min(0),
        quantity: z.number().int().min(1),
        description: z.string().optional(),
      })
    )
    .optional()
    .default([]),
});

// GET /api/events — list organizer's events
export const GET = withAuth(async (req, { session }) => {
  try {
    await connectDB();

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const limit = Math.min(50, parseInt(searchParams.get("limit") || "20"));
    const skip = (page - 1) * limit;

    const query: Record<string, unknown> = { organizerId: session.userId };
    if (status && status !== "all") query.status = status;

    const [events, total] = await Promise.all([
      Event.find(query)
        .sort({ startDate: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Event.countDocuments(query),
    ]);

    return NextResponse.json({
      success: true,
      data: events,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error("[GET /api/events]", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch events." },
      { status: 500 }
    );
  }
});

// POST /api/events — create event
export const POST = withAuth(async (req, { session }) => {
  try {
    const body = await req.json();
    const parsed = createEventSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    const data = parsed.data;

    if (new Date(data.endDate) <= new Date(data.startDate)) {
      return NextResponse.json(
        { success: false, error: "End date must be after start date." },
        { status: 400 }
      );
    }

    await connectDB();

    // Generate unique slug
    let slug = slugify(data.title);
    const existing = await Event.findOne({ slug });
    if (existing) {
      slug = `${slug}-${generateId(4).toLowerCase()}`;
    }

    const ticketTiers = (data.ticketTiers || []).map((tier) => ({
      ...tier,
      id: generateId(8),
      sold: 0,
    }));

    const event = await Event.create({
      ...data,
      slug,
      organizerId: session.userId,
      ticketTiers,
      totalRegistrations: 0,
      totalCheckedIn: 0,
    });

    return NextResponse.json(
      { success: true, data: event },
      { status: 201 }
    );
  } catch (error) {
    console.error("[POST /api/events]", error);
    return NextResponse.json(
      { success: false, error: "Failed to create event." },
      { status: 500 }
    );
  }
});
