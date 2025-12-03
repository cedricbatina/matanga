// server/utils/logger.js

// Simple logger centralisé, que tu pourras remplacer plus tard par pino/winston si tu veux
const LEVELS = ["debug", "info", "warn", "error"];

function formatMessage(level, message, meta = {}) {
  const timestamp = new Date().toISOString();
  const base = {
    ts: timestamp,
    level,
    msg: message,
    ...meta,
  };
  return JSON.stringify(base);
}

export function log(level, message, meta) {
  if (!LEVELS.includes(level)) level = "info";

  // Ici on utilise console, plus tard tu peux brancher sur un service externe
  if (level === "error") {
    console.error(formatMessage(level, message, meta));
  } else if (level === "warn") {
    console.warn(formatMessage(level, message, meta));
  } else if (level === "debug") {
    console.debug(formatMessage(level, message, meta));
  } else {
    console.log(formatMessage(level, message, meta));
  }
}

// Helpers pratiques
export function logInfo(message, meta) {
  log("info", message, meta);
}

export function logError(message, meta) {
  log("error", message, meta);
}

export function logWarn(message, meta) {
  log("warn", message, meta);
}

export function logDebug(message, meta) {
  log("debug", message, meta);
}
