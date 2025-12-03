// server/api/auth/me.get.js
import { defineEventHandler } from "h3";
import { getAuthSession } from "../../utils/authSession.js";

export default defineEventHandler(async (event) => {
  const session = await getAuthSession(event);

  // Pas d'erreur si non connecté : on renvoie juste user: null
  return {
    ok: true,
    user: session, // null ou { userId, email, accountType, roles, city, country, locale }
  };
});
