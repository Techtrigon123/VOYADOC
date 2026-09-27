import { NextRequest } from "next/server";
import { listDocuments } from "@/lib/db/repo";
import { requireAgent, fail } from "@/lib/agent/server";
import { invoiceTotals, GST_TREATMENTS, type InvoiceData } from "@/lib/agent/documents";
import { toCsv, toXls, toXlsx, type Cell } from "@/lib/agent/spreadsheet";

const MODULES = { invoice: "Invoices", proforma: "Proforma Invoices", receipt: "Receipts" } as const;

/**
 * Body: { module, from?, to?, template: default|summary|accounting,
 *         decimals: 0|2, format: csv|xls|xlsx, includePii: boolean }
 */
export async function POST(req: NextRequest) {
  try {
    const { user, response } = await requireAgent();
    if (response) return response;

    const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;
    const mod = String(body?.module ?? "invoice") as keyof typeof MODULES;
    if (!(mod in MODULES)) return fail("Choose a module to export.");
    const template = String(body?.template ?? "default");
    const decimals = Number(body?.decimals) === 0 ? 0 : 2;
    const format = String(body?.format ?? "csv");
    const pii = body?.includePii === true;

    const from = body?.from ? new Date(`${body.from}T00:00:00`) : null;
    const to = body?.to ? new Date(`${body.to}T23:59:59.999`) : null;

    const docs = await listDocuments(user.id, { kinds: [mod], from: from ?? undefined, to: to ?? undefined, withData: true, order: "created_asc", limit: 5000 });
    const round = (n: number) => Number(n.toFixed(decimals));
    const hide = (v: string) => (pii ? v : "");

    let header: string[];
    if (template === "summary") header = ["Date", "Number", "Bill to", "Currency", "Total", "Paid", "Balance"];
    else if (template === "accounting")
      header = ["Date", "Number", "Bill to", "Customer GSTIN", "Place of supply", "GST treatment", "Taxable value", "CGST", "SGST", "IGST", "Round off", "Total", "Currency"];
    else
      header = ["Date", "Number", "Order number", "Bill to", "Company", "Email", "Phone", "Address", "Customer GSTIN", "Place of supply", "Items", "Sub total", "Tax", "Round off", "Total", "Paid", "Currency"];

    const rows: Cell[][] = [header];
    for (const d of docs) {
      const data = d.data as unknown as InvoiceData;
      const t = invoiceTotals(data, user.state);
      const b = data.billTo ?? ({} as InvoiceData["billTo"]);
      const paid = Number(d.paidAmount ?? 0);
      if (template === "summary") {
        rows.push([data.date, d.number ?? "", b.name, data.currency, round(t.total), round(paid), round(Math.max(0, t.total - paid))]);
      } else if (template === "accounting") {
        rows.push([
          data.date, d.number ?? "", b.name, hide(b.gstin), b.placeOfSupply,
          GST_TREATMENTS.find((g) => g.id === b.gstTreatment)?.label ?? "",
          round(t.subtotal), round(t.cgst), round(t.sgst), round(t.igst), round(t.roundOff), round(t.total), data.currency,
        ]);
      } else {
        rows.push([
          data.date, d.number ?? "", data.orderNumber ?? "", b.name, b.company, hide(b.email), hide(b.phone), hide(b.address),
          hide(b.gstin), b.placeOfSupply, data.items.map((i) => i.description).filter(Boolean).join("; "),
          round(t.subtotal), round(t.tax), round(t.roundOff), round(t.total), round(paid), data.currency,
        ]);
      }
    }

    const base = `${MODULES[mod].replace(/\s+/g, "_")}_${new Date().toISOString().slice(0, 10)}`;
    if (format === "xlsx") {
      return new Response(Buffer.from(toXlsx(rows, MODULES[mod])), {
        headers: {
          "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          "Content-Disposition": `attachment; filename="${base}.xlsx"`,
        },
      });
    }
    if (format === "xls") {
      return new Response(toXls(rows, MODULES[mod]), {
        headers: {
          "Content-Type": "application/vnd.ms-excel",
          "Content-Disposition": `attachment; filename="${base}.xls"`,
        },
      });
    }
    return new Response(toCsv(rows), {
      headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": `attachment; filename="${base}.csv"` },
    });
  } catch (error) {
    console.error("[POST /api/agent/invoices/export]", error);
    return fail("Could not export invoices. Try again.", 500);
  }
}
