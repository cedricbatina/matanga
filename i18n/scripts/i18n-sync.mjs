#!/usr/bin/env node
/**
 * i18n-sync.mjs
 *
 * Keep locale JSON files in sync with locales/fr.json (canonical).
 *
 * Usage:
 *   node scripts/i18n-sync.mjs                 # report missing/extra keys
 *   node scripts/i18n-sync.mjs --write         # write missing keys into locale files (copy FR values)
 *   node scripts/i18n-sync.mjs --write --blank # write missing keys as "" instead of copying FR values
 *   node scripts/i18n-sync.mjs --write --prune # also remove keys not present in FR
 */
import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const ROOT = process.cwd();
const LOCALES_DIR = path.join(ROOT, "locales");
const SOURCE_FILE = path.join(LOCALES_DIR, "fr.json");

const args = new Set(process.argv.slice(2));
const WRITE = args.has("--write");
const BLANK = args.has("--blank");
const PRUNE = args.has("--prune");

function readJson(file) {
  const txt = fs.readFileSync(file, "utf8");
  return JSON.parse(txt);
}

function writeJson(file, obj) {
  fs.writeFileSync(file, JSON.stringify(obj, null, 2) + "\n", "utf8");
}

function isObject(v) {
  return v && typeof v === "object" && !Array.isArray(v);
}

function walkLeaves(obj, prefix = "") {
  const out = new Map();
  if (isObject(obj)) {
    for (const [k, v] of Object.entries(obj)) {
      const p = prefix ? `${prefix}.${k}` : k;
      for (const [lp, lv] of walkLeaves(v, p)) out.set(lp, lv);
    }
  } else {
    out.set(prefix, obj);
  }
  return out;
}

/**
 * Build a new object ordered like source:
 * - Missing keys are filled (source value or "")
 * - Existing target values are kept
 * - Extra keys are kept (unless PRUNE)
 */
function mergeOrdered(source, target) {
  if (isObject(source)) {
    const out = {};
    const tgt = isObject(target) ? target : {};
    for (const [k, sv] of Object.entries(source)) {
      if (k in tgt) out[k] = mergeOrdered(sv, tgt[k]);
      else out[k] = BLANK ? "" : sv;
    }
    if (!PRUNE) {
      for (const [k, tv] of Object.entries(tgt)) {
        if (!(k in out)) out[k] = tv;
      }
    }
    return out;
  }
  // leaf
  if (target === undefined) return BLANK ? "" : source;
  return target;
}

function listLocaleFiles() {
  if (!fs.existsSync(LOCALES_DIR)) return [];
  return fs.readdirSync(LOCALES_DIR)
    .filter((f) => f.endsWith(".json") && f !== "fr.json")
    .map((f) => path.join(LOCALES_DIR, f));
}

function main() {
  if (!fs.existsSync(SOURCE_FILE)) {
    console.error(`Missing ${SOURCE_FILE}`);
    process.exit(1);
  }

  const source = readJson(SOURCE_FILE);
  const sourceLeaves = walkLeaves(source);

  const localeFiles = listLocaleFiles();
  if (!localeFiles.length) {
    console.log("No other locale files found in /locales.");
    return;
  }

  let hasIssues = false;

  for (const file of localeFiles) {
    const code = path.basename(file, ".json");
    const target = readJson(file);
    const targetLeaves = walkLeaves(target);

    const missing = [];
    for (const key of sourceLeaves.keys()) {
      if (!targetLeaves.has(key)) missing.push(key);
    }

    const extra = [];
    for (const key of targetLeaves.keys()) {
      if (!sourceLeaves.has(key)) extra.push(key);
    }

    if (missing.length || extra.length) hasIssues = true;

    console.log(`\n[${code}]`);
    console.log(`  missing: ${missing.length}`);
    if (missing.length) console.log(`   - ${missing.slice(0, 10).join("\n   - ")}${missing.length > 10 ? "\n   - ..." : ""}`);

    console.log(`  extra:   ${extra.length}`);
    if (extra.length) console.log(`   - ${extra.slice(0, 10).join("\n   - ")}${extra.length > 10 ? "\n   - ..." : ""}`);

    if (WRITE) {
      const merged = mergeOrdered(source, target);
      writeJson(file, merged);
      console.log(`  ✅ wrote ${path.relative(ROOT, file)}`);
    }
  }

  if (!WRITE) {
    console.log("\nTip: run `node scripts/i18n-sync.mjs --write --prune` to sync & prune.");
  }

  if (hasIssues && !WRITE) process.exitCode = 2;
}

main();
