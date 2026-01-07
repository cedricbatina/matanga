// server/routes/sitemap.xml.get.js
import { defineEventHandler, send } from "h3";
import fs from "fs";
import path from "path";

// ✅ IMPORTANT: import = embarqué dans le bundle Vercel
import sitemapRoutesJson from "../data/sitemapRoutes.json";

export default defineEventHandler((event) => {
  const config = useRuntimeConfig(event);

  const siteUrl =
    config.public?.siteUrl ||
    process.env.SITE_URL ||
    `https://${event.node.req.headers.host || "madizi.com"}`;

  let routes = [];

  // 1) ✅ En prod (Vercel): on prend le JSON embarqué
  const bundled = sitemapRoutesJson?.default ?? sitemapRoutesJson;
  if (Array.isArray(bundled)) routes = bundled;

  // 2) ✅ En local/dev: si le fichier existe sur disque, il override (pratique)
  const dataPath = path.resolve("server/data/sitemapRoutes.json");
  if (fs.existsSync(dataPath)) {
    try {
      const raw = fs.readFileSync(dataPath, "utf8");
      const disk = JSON.parse(raw);
      if (Array.isArray(disk)) routes = disk;
    } catch (e) {
      console.error("Erreur lecture sitemapRoutes.json :", e);
    }
  }

  const xmlItems = routes
    .map((entry) => {
      const loc = entry.loc?.startsWith("http")
        ? entry.loc
        : `${siteUrl}${entry.loc}`;
      const lastmod = entry.lastmod || new Date().toISOString();

      return `
  <url>
    <loc>${loc}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>${entry.changefreq || "weekly"}</changefreq>
    <priority>${entry.priority != null ? entry.priority : 0.8}</priority>
  </url>`;
    })
    .join("");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${xmlItems}
</urlset>`;

  event.node.res.setHeader("Content-Type", "application/xml; charset=utf-8");
  return send(event, xml);
});
