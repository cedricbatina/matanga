// server/routes/robots.txt.get.js
export default defineEventHandler((event) => {
  const host = (event.node.req.headers.host || "").toLowerCase();

  // ✅ Empêcher l’indexation du domaine vercel.app
  if (host.includes("vercel.app")) {
    setHeader(event, "Content-Type", "text/plain; charset=utf-8");
    return ["User-agent: *", "Disallow: /", ""].join("\n");
  }

  const config = useRuntimeConfig(event);
  const siteUrlRaw =
    config.public?.siteUrl ||
    process.env.SITE_URL ||
    process.env.NUXT_PUBLIC_SITE_URL ||
    `https://${host || "www.madizi.com"}`;

  const siteUrl = siteUrlRaw.replace(/\/$/, "");

  const content = [
    "User-agent: *",
    "Allow: /",
    "",
    `Sitemap: ${siteUrl}/sitemap.xml`,
    "",
  ].join("\n");

  setHeader(event, "Content-Type", "text/plain; charset=utf-8");
  return content;
});
