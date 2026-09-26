import Anthropic from "@anthropic-ai/sdk";
import { betaZodOutputFormat } from "@anthropic-ai/sdk/helpers/beta/zod";
import { z } from "zod";

/**
 * Upload auto-fill: read a hotel voucher or airline e-ticket (PDF or photo)
 * and return form fields. Requires ANTHROPIC_API_KEY (or another credential
 * source the SDK resolves) on the server.
 */

const MODEL = "claude-opus-5";

export const extractAvailable = () =>
  !!(process.env.ANTHROPIC_API_KEY || process.env.ANTHROPIC_AUTH_TOKEN);

const optional = z.string().describe("Empty string when not present on the document");

const VoucherSchema = z.object({
  hotelName: optional,
  hotelAddress: optional,
  city: optional,
  hotelEmail: optional,
  hotelPhone: optional,
  bookingRef: optional.describe("Booking / reference ID"),
  hcn: optional.describe("Hotel confirmation number (HCN) or voucher number"),
  checkIn: optional.describe("YYYY-MM-DD"),
  checkOut: optional.describe("YYYY-MM-DD"),
  checkInTime: optional.describe("HH:MM 24h"),
  checkOutTime: optional.describe("HH:MM 24h"),
  roomName: optional,
  rooms: z.number().describe("Number of rooms, 0 if unknown"),
  adultsPerRoom: z.number().describe("0 if unknown"),
  childrenPerRoom: z.number().describe("0 if unknown"),
  mealPlan: optional.describe("One of: Room Only, Breakfast, Breakfast & Dinner, Breakfast, Lunch & Dinner, As per booking"),
  guestTitle: optional.describe("Mr., Mrs., Ms. or Miss"),
  guestFirstName: optional,
  guestLastName: optional,
  specialRequests: optional,
  cancellationPolicy: optional,
  currency: optional.describe("ISO 4217 code"),
  totalAmount: z.number().describe("0 if no price is shown"),
});

const TicketSchema = z.object({
  crsPnr: optional,
  airlinePnr: optional,
  segments: z.array(
    z.object({
      airlineCode: optional.describe("2-character IATA airline code"),
      airlineName: optional,
      flightNumber: optional.describe("e.g. AI2871"),
      from: optional.describe("3-letter IATA airport code"),
      to: optional.describe("3-letter IATA airport code"),
      departure: optional.describe("YYYY-MM-DDTHH:MM local time"),
      arrival: optional.describe("YYYY-MM-DDTHH:MM local time"),
      depTerminal: optional,
      arrTerminal: optional,
      travelClass: optional.describe("Economy, Premium Economy, Business or First"),
      bookingClass: optional.describe("Single-letter fare / booking class"),
    })
  ),
  passengers: z.array(
    z.object({
      title: optional.describe("Mr, Mrs, Ms, Miss or Mstr"),
      type: z.enum(["ADULT", "CHILD", "INFANT"]),
      firstName: optional,
      lastName: optional,
      ticketNumber: optional,
      seat: optional,
      meal: optional,
      cabinBaggage: optional,
      checkedBaggage: optional,
    })
  ),
  currency: optional,
  baseFare: z.number(),
  taxes: z.number(),
  grandTotal: z.number(),
});

export type ExtractedVoucher = z.infer<typeof VoucherSchema>;
export type ExtractedTicket = z.infer<typeof TicketSchema>;

export class ExtractError extends Error {
  constructor(public code: "EXTRACT_FAILED" | "EXTRACT_TEMPORARY" | "EXTRACT_UNAVAILABLE", message: string) {
    super(message);
  }
}

const PROMPTS = {
  voucher:
    "This file is a hotel booking voucher or confirmation. Extract the booking details into the schema. Use empty strings or 0 for anything not on the document — never guess.",
  ticket:
    "This file is an airline e-ticket or itinerary. Extract every flight segment and every passenger into the schema. Use empty strings or 0 for anything not on the document — never guess.",
};

type Media = "application/pdf" | "image/png" | "image/jpeg" | "image/webp" | "image/gif";

export async function extractFromFile(
  kind: "voucher" | "ticket",
  file: { base64: string; mediaType: Media }
): Promise<ExtractedVoucher | ExtractedTicket> {
  if (!extractAvailable()) throw new ExtractError("EXTRACT_UNAVAILABLE", "Upload auto-fill is not available right now.");
  const client = new Anthropic();
  const source: Anthropic.Beta.BetaContentBlockParam =
    file.mediaType === "application/pdf"
      ? { type: "document", source: { type: "base64", media_type: "application/pdf", data: file.base64 } }
      : { type: "image", source: { type: "base64", media_type: file.mediaType, data: file.base64 } };

  try {
    const response = await client.beta.messages.parse({
      model: MODEL,
      max_tokens: 16000,
      betas: ["server-side-fallback-2026-07-01"],
      fallbacks: "default",
      thinking: { type: "adaptive" },
      output_config: {
        effort: "low",
        format: betaZodOutputFormat(kind === "voucher" ? VoucherSchema : TicketSchema),
      },
      messages: [{ role: "user", content: [source, { type: "text", text: PROMPTS[kind] }] }],
    });
    if (response.stop_reason === "refusal" || !response.parsed_output) {
      throw new ExtractError("EXTRACT_FAILED", "Could not read this file.");
    }
    return response.parsed_output as ExtractedVoucher | ExtractedTicket;
  } catch (error) {
    if (error instanceof ExtractError) throw error;
    if (error instanceof Anthropic.RateLimitError || error instanceof Anthropic.InternalServerError) {
      throw new ExtractError("EXTRACT_TEMPORARY", "The reader is busy. Please try again in a minute.");
    }
    if (error instanceof Anthropic.AuthenticationError || error instanceof Anthropic.PermissionDeniedError) {
      throw new ExtractError("EXTRACT_UNAVAILABLE", "Upload auto-fill is not available right now.");
    }
    if (error instanceof Anthropic.APIError) {
      throw new ExtractError("EXTRACT_FAILED", "Could not read this file.");
    }
    throw error;
  }
}
