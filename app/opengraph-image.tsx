import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import { SITE } from "@/lib/site";

export const alt = `${SITE.name} — ${SITE.tagline}`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const DOCS = ["Hotel vouchers", "Air tickets", "Pickup vouchers", "Welcome placards", "GST invoices", "Receipts"];

export default async function OpengraphImage() {
  const mark = `data:image/svg+xml;base64,${(await readFile(join(process.cwd(), "public/brand/vouchlio-mark-light.svg"))).toString("base64")}`;
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: 72,
          background: "#e63946",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={mark} width={72} height={72} alt="" />
          <div style={{ display: "flex", fontSize: 36, fontWeight: 800, color: "#000000" }}>
            Vouchlio
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div style={{ fontSize: 66, fontWeight: 800, color: "#000000", lineHeight: 1.1, maxWidth: 980 }}>
            Branded travel documents in minutes
          </div>
          <div style={{ fontSize: 30, color: "#000000", opacity: 0.85, maxWidth: 940 }}>
            Built for Indian travel agents, tour operators and DMCs.
          </div>
        </div>

        <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
          {DOCS.map((d) => (
            <div
              key={d}
              style={{
                display: "flex",
                padding: "10px 20px",
                borderRadius: 999,
                background: "white",
                border: "2px solid #ffffff",
                color: "#000000",
                fontSize: 24,
                fontWeight: 600,
              }}
            >
              {d}
            </div>
          ))}
        </div>
      </div>
    ),
    size,
  );
}
