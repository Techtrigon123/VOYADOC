import { NextRequest } from "next/server";
import { z } from "zod";
import { ok, fail } from "@/lib/agent/server";
import { createContactMessage } from "@/lib/db/repo";

const TOPICS = ["general", "sales", "support", "billing", "partnership"] as const;

const schema = z.object({
  name: z.string().trim().min(2, "Please enter your name.").max(120),
  email: z.string().trim().email("Please enter a valid email address.").max(200),
  phone: z.string().trim().max(30).optional().or(z.literal("")),
  company: z.string().trim().max(200).optional().or(z.literal("")),
  topic: z.enum(TOPICS).default("general"),
  message: z.string().trim().min(10, "Please write a few more words (at least 10 characters).").max(4000),
  // Honeypot: real users never see or fill this field.
  website: z.string().max(0).optional().or(z.literal("")),
});

export async function POST(req: NextRequest) {
  try {
    const parsed = schema.safeParse(await req.json().catch(() => null));
    if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Please check the form and try again.");

    const { website, phone, company, ...rest } = parsed.data;
    // Bots that fill the hidden field get a normal-looking success and nothing is stored.
    if (website) return ok(true);

    await createContactMessage({ ...rest, phone: phone || undefined, company: company || undefined });
    return ok(true, { message: "Thanks! We'll get back to you within one working day." });
  } catch (error) {
    console.error("[POST /api/contact]", error);
    return fail("Could not send your message. Please try again in a moment.", 500);
  }
}
