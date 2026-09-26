import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/jwt";

export async function GET(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const stats = {
      totalDocuments: 12,
      totalHotelVouchers: 5,
      totalInvoices: 4,
      totalReceipts: 2,
      totalQuotations: 1,
      recentDocuments: [
        { _id: "1", type: "hotel-voucher", title: "Sunrise Grand Hotel - Alex Morgan", createdAt: new Date().toISOString(), status: "completed" },
        { _id: "2", type: "gst-invoice", title: "GST Invoice #INV-1042", createdAt: new Date(Date.now() - 1000 * 60 * 35).toISOString(), status: "completed" },
        { _id: "3", type: "travel-quotation", title: "Dubai Package Quotation", createdAt: new Date(Date.now() - 1000 * 60 * 120).toISOString(), status: "completed" },
      ],
    };

    return NextResponse.json({ success: true, data: stats });
  } catch (error) {
    console.error("[GET /api/dashboard/stats]", error);
    return NextResponse.json(
      { success: false, error: "Internal server error." },
      { status: 500 }
    );
  }
}