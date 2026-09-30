import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import { betaZodOutputFormat } from "@anthropic-ai/sdk/helpers/beta/zod";
import { z } from "zod";
import { MAX_OUTPUT_TOKENS } from "@/lib/ai-budget";

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

export type TokenUsage = { input_tokens: number; output_tokens: number };

export class ExtractError extends Error {
  constructor(
    public code: "EXTRACT_FAILED" | "EXTRACT_TEMPORARY" | "EXTRACT_UNAVAILABLE",
    message: string,
    /** Token usage when the API answered (and billed) but the answer wasn't usable. */
    public usage?: TokenUsage,
    /** True when the API certainly didn't bill the call, so the user's allowance can be refunded. */
    public notBilled = false
  ) {
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
): Promise<{ fields: ExtractedVoucher | ExtractedTicket; usage: TokenUsage }> {
  if (!extractAvailable()) throw new ExtractError("EXTRACT_UNAVAILABLE", "Upload auto-fill is not available right now.", undefined, true);
  // One retry at most (each retry re-sends and re-bills the whole file) and a hard 60 s ceiling.
  const client = new Anthropic({ maxRetries: 1, timeout: 60_000 });
  const source: Anthropic.Beta.BetaContentBlockParam =
    file.mediaType === "application/pdf"
      ? { type: "document", source: { type: "base64", media_type: "application/pdf", data: file.base64 } }
      : { type: "image", source: { type: "base64", media_type: file.mediaType, data: file.base64 } };

  try {
    const response = await client.beta.messages.parse({
      model: MODEL,
      max_tokens: MAX_OUTPUT_TOKENS,
      betas: ["server-side-fallback-2026-07-01"],
      fallbacks: "default",
      thinking: { type: "adaptive" },
      output_config: {
        effort: "low",
        format: betaZodOutputFormat(kind === "voucher" ? VoucherSchema : TicketSchema),
      },
      messages: [{ role: "user", content: [source, { type: "text", text: PROMPTS[kind] }] }],
    });
    const usage = { input_tokens: response.usage.input_tokens, output_tokens: response.usage.output_tokens };
    if (response.stop_reason === "refusal" || response.stop_reason === "max_tokens" || !response.parsed_output) {
      throw new ExtractError("EXTRACT_FAILED", "Could not read this file.", usage);
    }
    return { fields: response.parsed_output as ExtractedVoucher | ExtractedTicket, usage };
  } catch (error) {
    if (error instanceof ExtractError) throw error;
    // Rejected before any tokens were processed: not billed, so the allowance is refunded.
    if (error instanceof Anthropic.RateLimitError || error instanceof Anthropic.InternalServerError) {
      throw new ExtractError("EXTRACT_TEMPORARY", "The reader is busy. Please try again in a minute.", undefined, true);
    }
    if (error instanceof Anthropic.AuthenticationError || error instanceof Anthropic.PermissionDeniedError) {
      throw new ExtractError("EXTRACT_UNAVAILABLE", "Upload auto-fill is not available right now.", undefined, true);
    }
    if (error instanceof Anthropic.BadRequestError) {
      throw new ExtractError("EXTRACT_FAILED", "Could not read this file.", undefined, true);
    }
    if (error instanceof Anthropic.APIError) {
      throw new ExtractError("EXTRACT_FAILED", "Could not read this file.");
    }
    throw error;
  }
}
