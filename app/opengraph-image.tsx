import { ImageResponse } from "next/og";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "Finance — Controla tus finanzas personales y las de tu negocio";

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "#0e0f13",
          padding: 72,
        }}
      >
        <div style={{ display: "flex", fontSize: 40, color: "#eceef1", fontWeight: 700 }}>Finance</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          <div style={{ display: "flex", fontSize: 64, color: "#eceef1", fontWeight: 600, lineHeight: 1.15, letterSpacing: "-2px" }}>
            Tus finanzas y las de tu negocio, claras.
          </div>
          <div style={{ display: "flex", fontSize: 30, color: "#9ba1ab" }}>
            Gastos · Presupuestos · Deudas · Ventas · Gratis, para Colombia
          </div>
        </div>
      </div>
    ),
    size,
  );
}
