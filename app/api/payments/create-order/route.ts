import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import Razorpay from "razorpay";
import { connectDB } from "@/lib/db/mongoose";
import Event from "@/models/Event";
import Payment from "@/models/Payment";
import { getSession } from "@/lib/auth/jwt";

const schema = z.object({
  eventId: z.string().min(1),
  attendeeId: z.string().min(1),
  ticketTierId: z.string().min(1),
});

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const parsed = schema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    const { eventId, attendeeId, ticketTierId } = parsed.data;

    await connectDB();

    const event = await Event.findById(eventId);
    if (!event) {
      return NextResponse.json({ success: false, error: "Event not found." }, { status: 404 });
    }

    const tier = event.ticketTiers.find((t) => t.id === ticketTierId);
    if (!tier) {
      return NextResponse.json(
        { success: false, error: "Ticket tier not found." },
        { status: 404 }
      );
    }

    if (tier.sold >= tier.quantity) {
      return NextResponse.json(
        { success: false, error: "This ticket tier is sold out." },
        { status: 409 }
      );
    }

    const razorpayKeyId = process.env.RAZORPAY_KEY_ID;
    const razorpayKeySecret = process.env.RAZORPAY_KEY_SECRET;

    if (!razorpayKeyId || !razorpayKeySecret) {
      return NextResponse.json(
        { success: false, error: "Payment system is not configured." },
        { status: 503 }
      );
    }

    const razorpay = new Razorpay({
      key_id: razorpayKeyId,
      key_secret: razorpayKeySecret,
    });

    const amountInPaise = tier.price * 100;

    const order = await razorpay.orders.create({
      amount: amountInPaise,
      currency: "INR",
      notes: {
        eventId,
        attendeeId,
        ticketTierId,
        eventTitle: event.title,
      },
    });

    // Save payment record
    await Payment.create({
      eventId,
      attendeeId,
      razorpayOrderId: order.id,
      amount: tier.price,
      currency: "INR",
      status: "created",
      notes: {
        eventTitle: event.title,
        tierName: tier.name,
      },
    });

    return NextResponse.json({
      success: true,
      order: {
        id: order.id,
        amount: order.amount,
        currency: order.currency,
      },
      key: razorpayKeyId,
    });
  } catch (error) {
    console.error("[POST /api/payments/create-order]", error);
    return NextResponse.json(
      { success: false, error: "Failed to create payment order." },
      { status: 500 }
    );
  }
}
