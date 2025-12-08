// 📁 scripts/generate-sitemap.cjs
const fs = require("fs");
const path = require("path");
const mysql = require("mysql2/promise");
require("dotenv").config();

// 🔹 Routes statiques Matanga
const staticRoutes = [
  "/", // Accueil
  "/obituaries", // Liste des annonces
  "/plans", // Page des plans
  // ajoute ici plus tard : /about, /contact, etc.
];

// 🔹 Filtres d’exclusion (au cas où)
const excludePatterns = [
  /^\/admin/,
  /^\/api/,
  /^\/login/,
  /^\/register/,
  /^\/user/,
  /^\/profil/,
];

const shouldInclude = (route) =>
  !excludePatterns.some((pattern) => pattern.test(route));

// 🔹 Connexion MySQL (on réutilise les mêmes variables que le reste du projet)
async function getDbConnection() {
  return await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT ? parseInt(process.env.DB_PORT, 10) : 3306,
  });
}

async function generateSitemapEntries() {
  const connection = await getDbConnection();
  const entries = [];

  // 1. Routes statiques
  for (const route of staticRoutes) {
    if (!shouldInclude(route)) continue;
    entries.push({
      loc: route,
      lastmod: new Date().toISOString(),
      changefreq: "weekly",
      priority: route === "/" ? 1.0 : 0.8,
    });
  }

  // 2. Routes dynamiques : annonces
  // On ne prend que les annonces publiées & publiques
  const [rows] = await connection.execute(
    `
    SELECT slug, updated_at, created_at
    FROM obituaries
    WHERE status = 'published'
      AND visibility = 'public'
    `
  );

  for (const row of rows) {
    const loc = `/obituary/${row.slug}`;
    if (!shouldInclude(loc)) continue;

    entries.push({
      loc,
      lastmod: (row.updated_at || row.created_at || new Date()).toISOString
        ? (row.updated_at || row.created_at).toISOString?.()
        : new Date().toISOString(),
      changefreq: "daily",
      priority: 0.9,
    });
  }

  await connection.end();

  return entries;
}

async function run() {
  try {
    const entries = await generateSitemapEntries();

    const outputDir = path.resolve(__dirname, "../server/data");
    const outputPath = path.join(outputDir, "sitemapRoutes.json");

    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    console.log(`📝 Nombre total d’entrées Sitemap : ${entries.length}`);
    console.log(
      "Exemple :",
      entries[0] ? JSON.stringify(entries[0], null, 2) : "aucune entrée"
    );

    fs.writeFileSync(outputPath, JSON.stringify(entries, null, 2), "utf8");

    console.log(`✅ sitemapRoutes.json généré dans ${outputPath}`);
  } catch (err) {
    console.error("❌ Erreur lors de la génération du sitemap :", err);
    process.exit(1);
  }
}

run();
