import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db/mongoose";
import Event from "@/models/Event";
import Attendee from "@/models/Attendee";
import { withAuth } from "@/lib/auth/middleware";
import { formatDate } from "@/lib/utils";
import { PDFDocument, rgb, StandardFonts } from "pdf-lib";

function getEventId(req: NextRequest): string {
  const urlParts = req.url.split("/");
  const certIndex = urlParts.indexOf("certificate");
  return urlParts[certIndex - 1];
}

// GET /api/events/[id]/certificate?attendeeId=xxx — generate PDF certificate
export const GET = withAuth(async (req, { session }) => {
  const eventId = getEventId(req);

  try {
    const { searchParams } = new URL(req.url);
    const attendeeId = searchParams.get("attendeeId");

    if (!attendeeId) {
      return NextResponse.json(
        { success: false, error: "attendeeId query param is required." },
        { status: 400 }
      );
    }

    await connectDB();

    const [event, attendee] = await Promise.all([
      Event.findOne({ _id: eventId, organizerId: session.userId }).lean(),
      Attendee.findOne({ _id: attendeeId, eventId }).lean(),
    ]);

    if (!event) {
      return NextResponse.json({ success: false, error: "Event not found." }, { status: 404 });
    }
    if (!attendee) {
      return NextResponse.json({ success: false, error: "Attendee not found." }, { status: 404 });
    }

    const pdfBytes = await generateCertificatePDF({
      attendeeName: attendee.name,
      eventTitle: event.title,
      eventDate: formatDate(event.startDate),
      eventVenue: `${event.venue.name}, ${event.venue.city}`,
    });

    const filename = `certificate-${attendee.registrationId}.pdf`;
    return new NextResponse(Buffer.from(pdfBytes), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error("[GET /api/events/[id]/certificate]", error);
    return NextResponse.json(
      { success: false, error: "Failed to generate certificate." },
      { status: 500 }
    );
  }
});

async function generateCertificatePDF({
  attendeeName,
  eventTitle,
  eventDate,
  eventVenue,
}: {
  attendeeName: string;
  eventTitle: string;
  eventDate: string;
  eventVenue: string;
}): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([1120, 760]);
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const borderColor = rgb(0.78, 0.78, 0.78);
  const primaryColor = rgb(0.38, 0.40, 0.95);
  const darkColor = rgb(0.06, 0.09, 0.16);
  const mutedColor = rgb(0.38, 0.44, 0.54);

  page.drawRectangle({
    x: 50,
    y: 40,
    width: 1020,
    height: 680,
    borderColor,
    borderWidth: 2,
    color: rgb(1, 1, 1),
  });

  page.drawRectangle({
    x: 50,
    y: 700,
    width: 1020,
    height: 20,
    color: primaryColor,
  });

  drawCenteredText(page, font, "CERTIFICATE OF PARTICIPATION", 640, 16, mutedColor);
  drawCenteredText(page, font, "This certifies that", 610, 14, mutedColor);
  drawCenteredText(page, boldFont, attendeeName, 570, 36, primaryColor);
  drawCenteredText(page, font, "has successfully participated in", 530, 14, darkColor);
  drawCenteredText(page, boldFont, eventTitle, 500, 20, darkColor);

  drawCenteredText(page, boldFont, `Date: ${eventDate}`, 420, 13, darkColor);
  drawCenteredText(page, boldFont, `Venue: ${eventVenue}`, 420, 13, darkColor);

  drawCenteredText(page, boldFont, "Event Organizer", 360, 12, darkColor);
  drawCenteredText(page, boldFont, "Issued On", 360, 12, darkColor);

  const issuedOn = new Date().toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

  drawCenteredText(page, font, "TravelDoc Pro", 340, 12, mutedColor);
  drawCenteredText(page, font, issuedOn, 340, 12, mutedColor);

  page.drawCircle({
    x: 530,
    y: 300,
    size: 40,
    borderColor: primaryColor,
    borderWidth: 3,
    color: rgb(1, 1, 1),
  });

  drawCenteredText(page, boldFont, "OFFICIAL", 308, 10, primaryColor);
  drawCenteredText(page, boldFont, "CERT", 294, 10, primaryColor);

  return pdfDoc.save();
}

function drawCenteredText(
  page: ReturnType<PDFDocument["addPage"]>,
  font: any,
  text: string,
  y: number,
  size: number,
  color: ReturnType<typeof rgb>
) {
  const pageWidth = page.getWidth();
  const textWidth = font.widthOfTextAtSize(text, size);
  const x = (pageWidth - textWidth) / 2;
  page.drawText(text, {
    x,
    y,
    size,
    font,
    color,
  });
}
