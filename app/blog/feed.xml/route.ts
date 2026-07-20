import { posts, SITE_URL } from "@/content/posts";

// RSS 2.0 del blog — descubrimiento por agregadores y lectores
export function GET() {
  const esc = (s: string) =>
    s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const items = [...posts]
    .sort((a, b) => b.date.localeCompare(a.date))
    .map(
      (p) => `  <item>
    <title>${esc(p.title)}</title>
    <link>${SITE_URL}/blog/${p.slug}</link>
    <guid>${SITE_URL}/blog/${p.slug}</guid>
    <pubDate>${new Date(p.date + "T12:00:00Z").toUTCString()}</pubDate>
    <description>${esc(p.description)}</description>
    <category>${esc(p.category)}</category>
  </item>`,
    )
    .join("\n");
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
<channel>
  <title>Blog de Finance — Finanzas personales para Colombia</title>
  <link>${SITE_URL}/blog</link>
  <description>Respuestas claras a las preguntas financieras más frecuentes de los colombianos.</description>
  <language>es-co</language>
${items}
</channel>
</rss>`;
  return new Response(xml, {
    headers: { "Content-Type": "application/rss+xml; charset=utf-8" },
  });
}
