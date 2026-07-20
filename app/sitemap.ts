import type { MetadataRoute } from "next";
import { posts, SITE_URL } from "@/content/posts";
import { terms } from "@/content/glosario";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: SITE_URL, lastModified: new Date(), changeFrequency: "weekly", priority: 1 },
    { url: `${SITE_URL}/blog`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.9 },
    { url: `${SITE_URL}/help`, changeFrequency: "monthly", priority: 0.4 },
    { url: `${SITE_URL}/herramientas`, changeFrequency: "monthly", priority: 0.9 },
    { url: `${SITE_URL}/herramientas/calculadora-prima`, changeFrequency: "monthly", priority: 0.8 },
    { url: `${SITE_URL}/herramientas/calculadora-liquidacion`, changeFrequency: "monthly", priority: 0.8 },
    { url: `${SITE_URL}/herramientas/calculadora-cesantias`, changeFrequency: "monthly", priority: 0.8 },
    { url: `${SITE_URL}/herramientas/calculadora-interes-compuesto`, changeFrequency: "monthly", priority: 0.8 },
    { url: `${SITE_URL}/datos/salario-minimo-historico`, changeFrequency: "yearly", priority: 0.7 },
    { url: `${SITE_URL}/datos/uvt-historica`, changeFrequency: "yearly", priority: 0.7 },
    { url: `${SITE_URL}/app`, changeFrequency: "monthly", priority: 0.7 },
    { url: `${SITE_URL}/glosario`, changeFrequency: "monthly", priority: 0.7 },
    ...terms.map((t) => ({
      url: `${SITE_URL}/glosario/${t.slug}`,
      changeFrequency: "yearly" as const,
      priority: 0.5,
    })),
    ...posts.map((p) => ({
      url: `${SITE_URL}/blog/${p.slug}`,
      lastModified: new Date(p.date),
      changeFrequency: "monthly" as const,
      priority: 0.8,
    })),
  ];
}
