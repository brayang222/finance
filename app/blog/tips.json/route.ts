import { posts, SITE_URL } from "@/content/posts";

// Tips condensados para el "Tip del día" del app móvil.
// Público y cacheable: el contenido cambia solo cuando se agregan posts.
export function GET() {
  const tips = posts.map((p) => ({
    title: p.title,
    tip: p.description,
    url: `${SITE_URL}/blog/${p.slug}`,
    category: p.category,
  }));
  return Response.json(
    { tips },
    { headers: { "Cache-Control": "public, max-age=3600, s-maxage=86400" } },
  );
}
