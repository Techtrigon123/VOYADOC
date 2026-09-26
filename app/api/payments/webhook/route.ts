import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { connectDB } from "@/lib/db/mongoose";
import Payment from "@/models/Payment";
import Attendee from "@/models/Attendee";
import Event from "@/models/Event";

export async function POST(req: NextRequest) {
  try {
    const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
    if (!secret) {
      return NextResponse.json(
        { success: false, error: "Webhook secret not configured." },
        { status: 503 }
      );
    }

    const signature = req.headers.get("x-razorpay-signature");
    if (!signature) {
      return NextResponse.json(
        { success: false, error: "Missing webhook signature." },
        { status: 400 }
      );
    }

    const body = await req.text();
    const expectedSignature = crypto
      .createHmac("sha256", secret)
      .update(body)
      .digest("hex");

    if (expectedSignature !== signature) {
      return NextResponse.json(
        { success: false, error: "Invalid webhook signature." },
        { status: 400 }
      );
    }

    const event = JSON.parse(body);
    const paymentEntity = event.payload?.payment?.entity;
    const orderEntity = event.payload?.order?.entity;

    if (!paymentEntity || !orderEntity) {
      return NextResponse.json(
        { success: false, error: "Invalid webhook payload." },
        { status: 400 }
      );
    }

    await connectDB();

    const payment = await Payment.findOne({
      razorpayOrderId: orderEntity.id,
    });

    if (!payment) {
      return NextResponse.json(
        { success: false, error: "Payment record not found." },
        { status: 404 }
      );
    }

    if (event.event === "payment.captured") {
      payment.razorpayPaymentId = paymentEntity.id;
      payment.razorpaySignature = signature;
      payment.status = "paid";
      await payment.save();

      const attendee = await Attendee.findById(payment.attendeeId);
      if (attendee) {
        attendee.paymentId = payment._id;
        attendee.paymentStatus = "paid";
        attendee.amountPaid = payment.amount;
        attendee.status = "confirmed";
        await attendee.save();
      }

      await Event.updateOne(
        { _id: payment.eventId, "ticketTiers.id": payment.notes?.ticketTierId as string },
        { $inc: { "ticketTiers.$.sold": 1 } }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[POST /api/payments/webhook]", error);
    return NextResponse.json(
      { success: false, error: "Webhook processing failed." },
      { status: 500 }
    );
  }
}
