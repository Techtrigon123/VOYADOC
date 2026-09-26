import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db/mongoose";
import Event from "@/models/Event";
import Attendee from "@/models/Attendee";
import { withAuth } from "@/lib/auth/middleware";
import { generateId, parseCSVRow } from "@/lib/utils";
import Papa from "papaparse";

function getEventId(req: NextRequest): string {
  const urlParts = req.url.split("/");
  const importIndex = urlParts.indexOf("import");
  return urlParts[importIndex - 1];
}

// POST /api/events/[id]/import — bulk import attendees from CSV
export const POST = withAuth(async (req, { session }) => {
  const eventId = getEventId(req);

  try {
    await connectDB();

    const event = await Event.findOne({ _id: eventId, organizerId: session.userId });
    if (!event) {
      return NextResponse.json({ success: false, error: "Event not found." }, { status: 404 });
    }

    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json(
        { success: false, error: "No file provided." },
        { status: 400 }
      );
    }

    // Validate file type
    if (!file.name.endsWith(".csv") && !file.type.includes("csv")) {
      return NextResponse.json(
        { success: false, error: "Only CSV files are supported." },
        { status: 400 }
      );
    }

    // Size limit: 5MB
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { success: false, error: "File size must be under 5MB." },
        { status: 400 }
      );
    }

    const text = await file.text();

    const parsed = Papa.parse<Record<string, string>>(text, {
      header: true,
      skipEmptyLines: true,
    });

    if (parsed.errors.length > 0 && parsed.data.length === 0) {
      return NextResponse.json(
        { success: false, error: "Failed to parse CSV file." },
        { status: 400 }
      );
    }

    const rows = parsed.data;
    if (rows.length === 0) {
      return NextResponse.json(
        { success: false, error: "CSV file is empty." },
        { status: 400 }
      );
    }

    // Limit batch size
    if (rows.length > 2000) {
      return NextResponse.json(
        { success: false, error: "Maximum 2,000 attendees per import." },
        { status: 400 }
      );
    }

    // Check capacity
    const remainingCapacity = event.totalCapacity - event.totalRegistrations;
    if (rows.length > remainingCapacity) {
      return NextResponse.json(
        {
          success: false,
          error: `Only ${remainingCapacity} spots remaining. Cannot import ${rows.length} attendees.`,
        },
        { status: 409 }
      );
    }

    // Get existing emails for this event to skip duplicates
    const existingEmails = new Set(
      (await Attendee.find({ eventId }, "email").lean()).map((a) => a.email)
    );

    const toInsert = [];
    const skipped: string[] = [];
    const errors: string[] = [];

    for (let i = 0; i < rows.length; i++) {
      const row = parseCSVRow(rows[i]);

      if (!row.name) {
        errors.push(`Row ${i + 2}: Name is required`);
        continue;
      }
      if (!row.email || !/^\S+@\S+\.\S+$/.test(row.email)) {
        errors.push(`Row ${i + 2}: Valid email is required`);
        continue;
      }
      if (existingEmails.has(row.email)) {
        skipped.push(row.email);
        continue;
      }

      existingEmails.add(row.email);
      toInsert.push({
        eventId,
        name: row.name,
        email: row.email,
        phone: row.phone || undefined,
        organization: row.organization || undefined,
        registrationId: `REG-${generateId(8)}`,
        qrCode: `QR-${eventId}-${generateId(12)}`,
        status: "registered",
      });
    }

    if (toInsert.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: "No valid attendees to import.",
          details: { errors, skipped },
        },
        { status: 400 }
      );
    }

    await Attendee.insertMany(toInsert, { ordered: false });
    await Event.findByIdAndUpdate(eventId, {
      $inc: { totalRegistrations: toInsert.length },
    });

    return NextResponse.json({
      success: true,
      imported: toInsert.length,
      skipped: skipped.length,
      errors: errors.length,
      details: { skipped: skipped.slice(0, 10), errors: errors.slice(0, 10) },
    });
  } catch (error) {
    console.error("[POST /api/events/[id]/import]", error);
    return NextResponse.json(
      { success: false, error: "Import failed. Please try again." },
      { status: 500 }
    );
  }
});
