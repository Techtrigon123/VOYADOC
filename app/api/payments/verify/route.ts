import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { z } from "zod";
import { connectDB } from "@/lib/db/mongoose";
import Event from "@/models/Event";
import Attendee from "@/models/Attendee";
import Payment from "@/models/Payment";
import { getSession } from "@/lib/auth/jwt";

const schema = z.object({
  razorpay_order_id: z.string(),
  razorpay_payment_id: z.string(),
  razorpay_signature: z.string(),
  attendeeId: z.string(),
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
        { success: false, error: "Invalid payment data." },
        { status: 400 }
      );
    }

    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      attendeeId,
    } = parsed.data;

    const secret = process.env.RAZORPAY_KEY_SECRET;
    if (!secret) {
      return NextResponse.json(
        { success: false, error: "Payment system not configured." },
        { status: 503 }
      );
    }

    // Verify signature server-side
    const expectedSignature = crypto
      .createHmac("sha256", secret)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");

    if (expectedSignature !== razorpay_signature) {
      return NextResponse.json(
        { success: false, error: "Payment verification failed. Invalid signature." },
        { status: 400 }
      );
    }

    await connectDB();

    // Update payment record
    const payment = await Payment.findOneAndUpdate(
      { razorpayOrderId: razorpay_order_id },
      {
        razorpayPaymentId: razorpay_payment_id,
        razorpaySignature: razorpay_signature,
        status: "paid",
      },
      { new: true }
    );

    if (!payment) {
      return NextResponse.json(
        { success: false, error: "Payment record not found." },
        { status: 404 }
      );
    }

    // Update attendee
    await Attendee.findByIdAndUpdate(attendeeId, {
      paymentId: payment._id,
      paymentStatus: "paid",
      amountPaid: payment.amount,
      status: "confirmed",
    });

    // Update ticket tier sold count
    await Event.updateOne(
      { _id: payment.eventId, "ticketTiers.id": payment.notes?.ticketTierId as string },
      { $inc: { "ticketTiers.$.sold": 1 } }
    );

    return NextResponse.json({
      success: true,
      message: "Payment verified successfully.",
    });
  } catch (error) {
    console.error("[POST /api/payments/verify]", error);
    return NextResponse.json(
      { success: false, error: "Payment verification failed." },
      { status: 500 }
    );
  }
}
