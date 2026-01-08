// composables/useDateUtils.js
import { useI18n } from "vue-i18n";

export function useDateUtils() {
  // ✅ locale dynamique (en/fr/...)
  let i18n = null;
  try {
    i18n = useI18n();
  } catch {
    i18n = null;
  }

  const getLocale = () => i18n?.locale?.value || "fr";

  const safeDate = (dateStr) => {
    if (!dateStr) return null;
    const d = new Date(dateStr);
    return Number.isNaN(d.getTime()) ? null : d;
  };

  const formatDate = (dateStr) => {
    const d = safeDate(dateStr);
    if (!d) return "";
    return d.toLocaleDateString(getLocale(), {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  };

  const formattedDate = (dateStr) => {
    const d = safeDate(dateStr);
    if (!d) return "";
    return d.toLocaleString(getLocale(), {
      day: "2-digit",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formattedDateTimeWithSeconds = (dateStr) => {
    const d = safeDate(dateStr);
    if (!d) return "";
    // ✅ en-US => “January 8, 2026 at …”
    // ✅ fr => “8 janvier 2026 à …”
    return d.toLocaleString(getLocale(), {
      day: "2-digit",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  const formatDateISO = (date) => {
    if (!date) return "2025-01-01T00:00:00Z";
    try {
      return new Date(date).toISOString();
    } catch {
      return "2025-01-01T00:00:00Z";
    }
  };

  const formattedHourMinute = (dateStr) => {
    const d = safeDate(dateStr);
    if (!d) return "";
    return d.toLocaleTimeString(getLocale(), {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getCountdownString = (date) => {
    const d = safeDate(date);
    if (!d) return "Date non définie";
    const now = new Date();
    const distance = d - now;
    if (distance < 0) return "Session commencée";

    const days = Math.floor(distance / (1000 * 60 * 60 * 24));
    const hours = Math.floor((distance / (1000 * 60 * 60)) % 24);
    const minutes = Math.floor((distance / (1000 * 60)) % 60);
    const seconds = Math.floor((distance / 1000) % 60);
    return `${days} jours ${hours}h ${minutes}min ${seconds}s`;
  };

  const timeAgo = (inputDate) => {
    const d = safeDate(inputDate);
    if (!d) return "";
    const now = new Date();
    const diff = (now - d) / 1000;

    if (diff < 60) return "il y a quelques secondes";
    if (diff < 3600) return `il y a ${Math.floor(diff / 60)} mn`;
    if (diff < 86400) return `il y a ${Math.floor(diff / 3600)} h`;
    if (diff < 2592000) return `il y a ${Math.floor(diff / 86400)} jours`;
    if (diff < 31536000) return `il y a ${Math.floor(diff / 2592000)} mois`;
    return `${Math.floor(diff / 31536000)} ans`;
  };

  const shortDate = (dateStr) => {
    const d = safeDate(dateStr);
    if (!d) return "";
    return d.toLocaleDateString(getLocale(), {
      day: "2-digit",
      month: "2-digit",
      year: "2-digit",
    });
  };

  // tes helpers input/date restent OK
  const toDateInput = (value) => {
    if (!value) return "";
    if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;

    const d = safeDate(value);
    if (!d) return String(value).slice(0, 10);

    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const toDateTimeLocalInput = (value) => {
    if (!value) return "";

    const d = safeDate(
      typeof value === "string" ? value.replace(" ", "T") : value
    );
    if (!d) return "";

    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    const hours = String(d.getHours()).padStart(2, "0");
    const minutes = String(d.getMinutes()).padStart(2, "0");
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  const normalizeDateTimeLocal = (value) => {
    if (!value) return null;
    const [date, time] = value.split("T");
    if (!date || !time) return value;
    const tPart = time.length === 5 ? `${time}:00` : time;
    return `${date} ${tPart}`;
  };

  return {
    timeAgo,
    shortDate,
    formatDate,
    formattedDate,
    formatDateISO,
    getCountdownString,
    formattedHourMinute,
    formattedDateTimeWithSeconds,
    safeDate,
    toDateInput,
    toDateTimeLocalInput,
    normalizeDateTimeLocal,
  };
}
