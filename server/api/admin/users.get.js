// server/api/admin/users.get.js
import { defineEventHandler } from "h3";
import { requireAuth } from "../../utils/authSession.js";
import { query } from "../../utils/db.js";

export default defineEventHandler(async (event) => {
  const session = await requireAuth(event, { roles: ["admin"] });

  const users = await query(
    `
    SELECT id, email, account_type, status, city, country, preferred_locale
    FROM users
    ORDER BY created_at DESC
    LIMIT 50
    `,
    [],
    { userId: session.userId }
  );

  return {
    ok: true,
    users,
  };
});
