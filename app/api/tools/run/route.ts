import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const bodySchema = z.object({
  tool: z.enum([
    "hotel-voucher",
    "proforma-invoice",
    "gst-invoice",
    "payment-receipt",
    "travel-quotation",
    "document-polish",
    "pdf-export",
  ]),
  text: z.string().min(5),
  options: z
    .object({
      modelFocus: z.string().optional(),
      tone: z.string().optional(),
      brandSafe: z.boolean().optional(),
    })
    .optional()
    .default({}),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    const parsed = bodySchema.safeParse(body);

    if (!parsed.success) {
      const message = parsed.error.issues?.[0]?.message || "Invalid request.";
      return NextResponse.json(
        { success: false, error: message },
        { status: 400 }
      );
    }

    const { tool, text, options } = parsed.data;

    const truncated = text.length > 4000 ? text.slice(0, 4000) : text;

    const mockResult = {
      "hotel-voucher": {
        documentType: "Hotel Voucher",
        status: "ready",
        preview: `${truncated}\n\n[Hotel voucher preview would render here in production.]`,
        fields: ["guestName", "hotelName", "checkIn", "checkOut", "roomType", "bookingReference"],
      },
      "proforma-invoice": {
        documentType: "Proforma Invoice",
        status: "ready",
        preview: `${truncated}\n\n[Proforma invoice preview would render here in production.]`,
        fields: ["customer", "services", "amount", "tax", "total"],
      },
      "gst-invoice": {
        documentType: "GST Invoice",
        status: "ready",
        preview: `${truncated}\n\n[GST invoice preview would render here in production.]`,
        fields: ["business", "customer", "invoiceNumber", "date", "tax", "total"],
      },
      "payment-receipt": {
        documentType: "Payment Receipt",
        status: "ready",
        preview: `${truncated}\n\n[Payment receipt preview would render here in production.]`,
        fields: ["customer", "amount", "date", "paymentMode", "referenceNumber"],
      },
      "travel-quotation": {
        documentType: "Travel Quotation",
        status: "ready",
        preview: `${truncated}\n\n[Travel quotation preview would render here in production.]`,
        fields: ["customer", "destination", "dates", "services", "totalEstimate"],
      },
      "document-polish": {
        polished: `${truncated}\n\n[Polished document text would appear here in production.]`,
        readabilityScore: 74,
        changedRatio: "28%",
      },
      "pdf-export": {
        documentType: "PDF",
        status: "ready",
        downloadUrl: "#",
        preview: `${truncated}\n\n[PDF export preview would render here in production.]`,
      },
    }[tool];

    return NextResponse.json({
      success: true,
      data: {
        tool,
        inputLength: text.length,
        options,
        result: mockResult,
      },
    });
  } catch (error) {
    console.error("[POST /api/tools/run]", error);
    return NextResponse.json(
      { success: false, error: "Tool execution failed." },
      { status: 500 }
    );
  }
}