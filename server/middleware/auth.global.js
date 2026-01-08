// server/middleware/auth.global.js
import { defineEventHandler } from "h3";
import { getAuthSession } from "../utils/authSession.js";
import { logError } from "../utils/logger.js";

export default defineEventHandler(async (event) => {
  try {
    await getAuthSession(event);
  } catch (err) {
    logError("Auth global middleware error", { error: err.message });
    event.context.auth = null;
  }
});
