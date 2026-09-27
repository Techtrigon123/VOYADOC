import { ImageResponse } from "next/og";
import { SITE } from "@/lib/site";

export const alt = `${SITE.name} — ${SITE.tagline}`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const DOCS = ["Hotel vouchers", "Air tickets", "Pickup vouchers", "Welcome placards", "GST invoices", "Receipts"];

export default function OpengraphImage() {
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
          background: "linear-gradient(135deg, #ffffff 0%, #fff7ed 60%, #ffedd5 100%)",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: 14,
              background: "#f97316",
              color: "white",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 30,
              fontWeight: 800,
            }}
          >
            T
          </div>
          <div style={{ display: "flex", fontSize: 36, fontWeight: 800, color: "#0f172a" }}>
            TravelDoc<span style={{ color: "#f97316" }}>Pro</span>
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div style={{ fontSize: 66, fontWeight: 800, color: "#0f172a", lineHeight: 1.1, maxWidth: 980 }}>
            Branded travel documents in minutes
          </div>
          <div style={{ fontSize: 30, color: "#475569", maxWidth: 940 }}>
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
                border: "2px solid #fed7aa",
                color: "#c2410c",
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
