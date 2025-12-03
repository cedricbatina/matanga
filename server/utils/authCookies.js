// server/utils/authCookies.js
import { setCookie } from "h3";

const ACCESS_COOKIE_NAME = "matanga_at";
const REFRESH_COOKIE_NAME = "matanga_rt";

function isProd() {
  return process.env.NODE_ENV === "production";
}

export function setAuthCookies(
  event,
  accessToken,
  refreshToken,
  accessMaxAge,
  refreshMaxAge
) {
  const secure = isProd(); // secure=false en dev, true en prod

  // Access token : durée courte
  setCookie(event, ACCESS_COOKIE_NAME, accessToken, {
    httpOnly: true,
    secure,
    sameSite: "lax",
    path: "/",
    maxAge: accessMaxAge,
  });

  // Refresh token : durée longue
  setCookie(event, REFRESH_COOKIE_NAME, refreshToken, {
    httpOnly: true,
    secure,
    sameSite: "lax",
    path: "/",
    maxAge: refreshMaxAge,
  });
}

export function clearAuthCookies(event) {
  const secure = isProd();

  // On "efface" le cookie en le remplaçant par une valeur vide et maxAge=0
  setCookie(event, ACCESS_COOKIE_NAME, "", {
    httpOnly: true,
    secure,
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });

  setCookie(event, REFRESH_COOKIE_NAME, "", {
    httpOnly: true,
    secure,
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
}

export { ACCESS_COOKIE_NAME, REFRESH_COOKIE_NAME };
