export default defineEventHandler((event) => {
  const config = useRuntimeConfig(event);
  const siteUrl =
    config.public?.siteUrl ||
    `https://${event.node.req.headers.host || "matanga.example.com"}`;

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
