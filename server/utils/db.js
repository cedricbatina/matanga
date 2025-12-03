// server/utils/db.js
import mysql from "mysql2/promise";
import { logInfo, logError, logDebug } from "./logger.js";

let pool = null;

// Pour éviter de recréer le pool en dev (HMR Nuxt)
if (!globalThis.__matangaDbPool) {
  globalThis.__matangaDbPool = { pool: null };
}
pool = globalThis.__matangaDbPool.pool;

// Configuration DB avec fallback
function getDbConfig(primary = true) {
  if (primary) {
    return {
      host: process.env.DB_HOST || "localhost",
      user: process.env.DB_USER || "matanga_user",
      password: process.env.DB_PASSWORD || "motdepasse",
      database: process.env.DB_NAME || "matanga",
      port: process.env.DB_PORT ? Number(process.env.DB_PORT) : 3306,
    };
  } else {
    return {
      host: process.env.DB_HOST_SECONDARY || process.env.DB_HOST || "localhost",
      user:
        process.env.DB_USER_SECONDARY || process.env.DB_USER || "matanga_user",
      password:
        process.env.DB_PASSWORD_SECONDARY ||
        process.env.DB_PASSWORD ||
        "motdepasse",
      database:
        process.env.DB_NAME_SECONDARY || process.env.DB_NAME || "matanga",
      port: process.env.DB_PORT_SECONDARY
        ? Number(process.env.DB_PORT_SECONDARY)
        : process.env.DB_PORT
        ? Number(process.env.DB_PORT)
        : 3306,
    };
  }
}

// Création du pool avec gestion erreurs
async function createPool() {
  const primaryConfig = getDbConfig(true);

  try {
    logInfo("DB: creating primary pool", {
      host: primaryConfig.host,
      db: primaryConfig.database,
    });

    const newPool = mysql.createPool({
      host: primaryConfig.host,
      user: primaryConfig.user,
      password: primaryConfig.password,
      database: primaryConfig.database,
      port: primaryConfig.port,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
      // timezone: 'Z'
    });

    // test rapide
    await newPool.query("SELECT 1");

    logInfo("DB: primary pool created and healthy");
    return newPool;
  } catch (err) {
    logError("DB: primary pool creation failed, trying secondary", {
      error: err.message,
    });

    const secondaryConfig = getDbConfig(false);

    try {
      const newPool = mysql.createPool({
        host: secondaryConfig.host,
        user: secondaryConfig.user,
        password: secondaryConfig.password,
        database: secondaryConfig.database,
        port: secondaryConfig.port,
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0,
      });

      await newPool.query("SELECT 1");

      logInfo("DB: secondary pool created and healthy", {
        host: secondaryConfig.host,
        db: secondaryConfig.database,
      });

      return newPool;
    } catch (err2) {
      logError("DB: secondary pool creation failed", {
        error: err2.message,
      });
      throw err2;
    }
  }
}

async function getPool() {
  if (!pool) {
    pool = await createPool();
    globalThis.__matangaDbPool.pool = pool;
  }
  return pool;
}

/**
 * Contexte de log optionnel :
 * { userId, role, requestId }
 */
export async function query(sql, params = [], context = {}) {
  const pool = await getPool();

  const start = Date.now();
  try {
    const [rows] = await pool.execute(sql, params);

    const duration = Date.now() - start;
    logDebug("DB QUERY OK", {
      sql: sanitizeSqlForLog(sql),
      duration_ms: duration,
      row_count: Array.isArray(rows) ? rows.length : undefined,
      ...contextMeta(context),
    });

    return rows;
  } catch (err) {
    const duration = Date.now() - start;
    logError("DB QUERY ERROR", {
      sql: sanitizeSqlForLog(sql),
      duration_ms: duration,
      error: err.message,
      code: err.code,
      ...contextMeta(context),
    });

    // Tentative de reconnexion si connexion perdue
    if (isConnectionLost(err)) {
      logWarn("DB: connection lost, destroying pool and retrying once");
      await resetPool();
      const retryPool = await getPool();
      const [rowsRetry] = await retryPool.execute(sql, params);
      return rowsRetry;
    }

    throw err;
  }
}

/**
 * Transactions simples
 */
export async function transaction(callback, context = {}) {
  const pool = await getPool();
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const result = await callback({
      query: async (sql, params = []) => {
        const start = Date.now();
        try {
          const [rows] = await connection.execute(sql, params);
          const duration = Date.now() - start;
          logDebug("DB TX QUERY OK", {
            sql: sanitizeSqlForLog(sql),
            duration_ms: duration,
            row_count: Array.isArray(rows) ? rows.length : undefined,
            ...contextMeta(context),
          });
          return rows;
        } catch (err) {
          const duration = Date.now() - start;
          logError("DB TX QUERY ERROR", {
            sql: sanitizeSqlForLog(sql),
            duration_ms: duration,
            error: err.message,
            code: err.code,
            ...contextMeta(context),
          });
          throw err;
        }
      },
    });

    await connection.commit();
    return result;
  } catch (err) {
    try {
      await connection.rollback();
    } catch (rollbackErr) {
      logError("DB TX ROLLBACK ERROR", {
        error: rollbackErr.message,
        ...contextMeta(context),
      });
    }
    throw err;
  } finally {
    connection.release();
  }
}

/**
 * Healthcheck simple pour un /api/health ou autre
 */
export async function checkDbHealth() {
  try {
    const pool = await getPool();
    await pool.query("SELECT 1");
    return { ok: true };
  } catch (err) {
    logError("DB HEALTHCHECK ERROR", { error: err.message });
    return { ok: false, error: err.message };
  }
}

/* Helpers internes */

function isConnectionLost(err) {
  if (!err || !err.code) return false;
  const lostCodes = [
    "PROTOCOL_CONNECTION_LOST",
    "ECONNRESET",
    "ECONNREFUSED",
    "ETIMEDOUT",
    "EPIPE",
  ];
  return lostCodes.includes(err.code);
}

async function resetPool() {
  if (pool) {
    try {
      await pool.end();
    } catch (e) {
      // ignore
    }
  }
  pool = null;
  globalThis.__matangaDbPool.pool = null;
}

function sanitizeSqlForLog(sql) {
  // évite de logguer des requêtes énormes ou des données sensibles
  if (!sql) return "";
  return sql.toString().substring(0, 300);
}

function contextMeta(context = {}) {
  const meta = {};
  if (context.userId) meta.userId = context.userId;
  if (context.role) meta.role = context.role;
  if (context.requestId) meta.requestId = context.requestId;
  return meta;
}
