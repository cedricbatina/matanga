// server/utils/jwt.js
import jwt from "jsonwebtoken";
import { logError } from "./logger.js";

const ACCESS_TTL = parseInt(process.env.JWT_ACCESS_EXPIRES_IN || "900", 10); // 15 min
const REFRESH_TTL = parseInt(
  process.env.JWT_REFRESH_EXPIRES_IN || "1209600",
  10
); // 14 jours

const ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || "dev_access_secret";
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || "dev_refresh_secret";

export function signAccessToken(payload) {
  return jwt.sign(payload, ACCESS_SECRET, {
    expiresIn: ACCESS_TTL,
  });
}

export function signRefreshToken(payload) {
  return jwt.sign(payload, REFRESH_SECRET, {
    expiresIn: REFRESH_TTL,
  });
}

export function verifyAccessToken(token) {
  try {
    return jwt.verify(token, ACCESS_SECRET);
  } catch (err) {
    logError("verifyAccessToken error", { error: err.message });
    return null;
  }
}

export function verifyRefreshToken(token) {
  try {
    return jwt.verify(token, REFRESH_SECRET);
  } catch (err) {
    logError("verifyRefreshToken error", { error: err.message });
    return null;
  }
}

export const accessTokenMaxAge = ACCESS_TTL;
export const refreshTokenMaxAge = REFRESH_TTL;
