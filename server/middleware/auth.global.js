// server/middleware/auth.global.js
import { defineEventHandler } from "h3";
import { getAuthSession } from "../utils/authSession.js";
import { logError } from "../utils/logger.js";

export default defineEventHandler(async (event) => {
  try {
    await getAuthSession(event);
  } catch (err) {
    // On log l'erreur mais on ne bloque pas toute la requête
    logError("Auth global middleware error", {
      error: err.message,
    });
    if (!event.context) event.context = {};
    event.context.auth = null;
  }
});
