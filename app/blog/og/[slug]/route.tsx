import { ImageResponse } from "next/og";
import { getPost } from "@/content/posts";

// Imagen Open Graph dinámica por post (1200x630).
// Route handler en vez de opengraph-image.tsx: el archivo colocalizado
// en segmento dinámico rompe la página con Turbopack (require is not defined).
export async function GET(_req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = getPost(slug);
  const title = post?.title ?? "Blog de Finance";
  const category = post?.category ?? "Finanzas";
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
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", fontSize: 36, color: "#eceef1", fontWeight: 700 }}>Finance</div>
          <div
            style={{
              display: "flex",
              fontSize: 22,
              color: "#9ba1ab",
              border: "1px solid #262a33",
              borderRadius: 999,
              padding: "8px 22px",
              textTransform: "uppercase",
              letterSpacing: "2px",
            }}
          >
            {category}
          </div>
        </div>
        <div
          style={{
            display: "flex",
            fontSize: title.length > 55 ? 56 : 66,
            color: "#eceef1",
            fontWeight: 600,
            lineHeight: 1.15,
            letterSpacing: "-2px",
          }}
        >
          {title}
        </div>
        <div style={{ display: "flex", fontSize: 26, color: "#9ba1ab" }}>
          Respuestas claras, en pesos colombianos · financials-app.vercel.app/blog
        </div>
      </div>
    ),
    { width: 1200, height: 630 },
  );
}
