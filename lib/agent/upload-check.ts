import { PDFDocument } from "pdf-lib";

/** Checks run on an uploaded file before it is sent to the paid AI API. */

/** The file's first bytes must match its declared type (a renamed file is rejected before it reaches the paid API). */
export function contentMatchesType(bytes: Uint8Array, type: string): boolean {
  const starts = (...sig: number[]) => sig.every((b, i) => bytes[i] === b);
  const ascii = (from: number, text: string) => [...text].every((c, i) => bytes[from + i] === c.charCodeAt(0));
  switch (type) {
    case "application/pdf": return ascii(0, "%PDF-");
    case "image/png": return starts(0x89, 0x50, 0x4e, 0x47);
    case "image/jpeg": return starts(0xff, 0xd8, 0xff);
    case "image/gif": return ascii(0, "GIF8");
    case "image/webp": return ascii(0, "RIFF") && ascii(8, "WEBP");
    default: return false;
  }
}

/** Page count of a PDF, or null when it can't be opened. */
export async function pdfPageCount(bytes: Uint8Array): Promise<number | null> {
  try {
    const pdf = await PDFDocument.load(bytes, { ignoreEncryption: true, updateMetadata: false });
    return pdf.getPageCount();
  } catch {
    return null;
  }
}
