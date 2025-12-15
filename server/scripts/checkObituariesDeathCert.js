// server/scripts/checkObituariesDeathCert.js
import { query } from "../utils/db.js";
import { logInfo, logError } from "../utils/logger.js";
import { createNotification } from "../utils/notifications.js";

export async function checkDeathCertificates(ctx = {}) {
  const requestId = ctx.requestId || Math.random().toString(36).slice(2, 10);

  try {
    // 1) Obits concernées : particuliers, publiées, âgées >= 7 jours, sans certificat
    const rows = await query(
      `
      SELECT
        o.id,
        o.slug,
        o.user_id,
        o.created_at,
        o.status,
        o.account_type
      FROM obituaries o
      WHERE
        o.account_type = 'individual'
        AND o.status = 'published'
        AND TIMESTAMPDIFF(DAY, o.created_at, NOW()) >= 7
        AND NOT EXISTS (
          SELECT 1
          FROM obituary_documents d
          WHERE
            d.obituary_id = o.id
            AND d.type = 'death_certificate'
            AND d.status IN ('uploaded', 'validated')
        )
      `,
      [],
      { requestId }
    );

    logInfo("checkDeathCertificates: candidates", {
      count: rows.length,
      requestId,
    });

    for (const row of rows) {
      // 2) On archive / rend privée l’annonce
      await query(
        `
        UPDATE obituaries
        SET
          status = 'archived',
          visibility = 'private',
          verification_status = 'pending',
          updated_at = NOW()
        WHERE id = ?
      `,
        [row.id],
        { requestId }
      );

      // 3) Notification à la famille / particulier
      await createNotification(
        {
          recipientId: row.user_id,
          type: "obituary.archived_no_certificate",
          channel: "in_app", // pour l’instant uniquement in-app
          title: "Annonce archivée en attente de certificat",
          body:
            "Votre annonce a été temporairement retirée de la liste publique car " +
            "le certificat de décès n'a pas encore été transmis. " +
            "Dès que le document sera ajouté et validé, notre équipe pourra réactiver l'annonce.",
          data: {
            obituaryId: row.id,
            slug: row.slug,
            reason: "missing_death_certificate_after_7_days",
          },
          relatedObituaryId: row.id,
        },
        { requestId }
      );
    }
  } catch (err) {
    logError("checkDeathCertificates failed", {
      error: err.message,
      stack: err.stack,
      ctx,
    });
  }
}
