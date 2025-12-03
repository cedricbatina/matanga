// server/utils/ensureUniqueSlugForObituary.js
import { query } from "./db.js";
import { logDebug, logError } from "./logger.js";

/**
 * Transforme une chaîne en slug URL-friendly.
 * - enlève les accents
 * - met en minuscule
 * - remplace les espaces et séparateurs par des "-"
 * - supprime les "-" en trop au début/fin
 */
export function toSlug(value) {
  if (!value || typeof value !== "string") {
    return "";
  }

  return value
    .normalize("NFD") // décomposition accents
    .replace(/[\u0300-\u036f]/g, "") // suppression accents
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-") // tout ce qui n'est pas alphanum -> "-"
    .replace(/^-+|-+$/g, "") // trim des "-"
    .replace(/-{2,}/g, "-"); // pas de "--"
}

/**
 * Génère un slug base à partir des infos du défunt.
 * Tu pourras adapter la stratégie ici facilement plus tard.
 *
 * Exemple d'entrée : {
 *   deceasedFullName: "Jean K. MABIALA",
 *   city: "Brazzaville",
 *   dateOfDeath: "2025-05-12"
 * }
 *
 * Exemple de slug base : "jean-k-mabiala-2025-brazzaville"
 */
export function buildObituaryBaseSlug({ deceasedFullName, city, dateOfDeath }) {
  const parts = [];

  if (deceasedFullName) {
    parts.push(deceasedFullName);
  }

  if (dateOfDeath) {
    try {
      const year = new Date(dateOfDeath).getFullYear();
      if (!Number.isNaN(year)) {
        parts.push(String(year));
      }
    } catch {
      // ignore
    }
  }

  if (city) {
    parts.push(city);
  }

  const joined = parts.join(" ");
  const base = toSlug(joined);

  return base || "obituary";
}

/**
 * Assure l'unicité d'un slug dans la table `obituaries`.
 *
 * - baseString: string déjà préparée (ex: "jean-k-mabiala-2025-brazzaville")
 * - options:
 *    - excludeId: id de l'obituary à exclure (utile en update)
 *    - maxLength: longueur max du slug (par défaut 120)
 *    - requestId: pour les logs
 *
 * Retourne une string slug unique.
 */
export async function ensureUniqueSlugForObituary(baseString, options = {}) {
  const { excludeId = null, maxLength = 120, requestId = null } = options;

  let baseSlug = toSlug(baseString).slice(0, maxLength);

  if (!baseSlug) {
    baseSlug = "obituary";
  }

  let candidate = baseSlug;
  let suffix = 1;

  logDebug("Slug generation for obituary", {
    baseString,
    baseSlug,
    excludeId,
    requestId,
  });

  // On boucle raisonnablement, si on dépasse 1000 c'est qu'il y a un gros souci
  const MAX_ATTEMPTS = 1000;

  while (suffix <= MAX_ATTEMPTS) {
    const params = [candidate];
    let sql = "SELECT id FROM obituaries WHERE slug = ?";

    if (excludeId) {
      sql += " AND id != ?";
      params.push(excludeId);
    }

    const rows = await query(sql + " LIMIT 1", params, {
      requestId,
    });

    if (rows.length === 0) {
      // slug libre
      logDebug("Slug available for obituary", {
        slug: candidate,
        requestId,
      });
      return candidate;
    }

    // slug déjà pris → on tente avec suffix
    suffix += 1;

    const withSuffix = `${baseSlug}-${suffix}`;

    // On s'assure de ne pas exploser maxLength
    candidate = withSuffix.slice(0, maxLength);
  }

  // Si on arrive ici, c'est vraiment anormal
  const fallback = `${baseSlug}-${Date.now()}`.slice(0, maxLength);

  logError("Too many slug collisions for obituary, using fallback", {
    baseSlug,
    fallback,
    excludeId,
    requestId,
  });

  return fallback;
}
