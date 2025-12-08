// composables/useDateUtils.js
export function useDateUtils() {
  const safeDate = (dateStr) => {
    if (!dateStr) return null;
    const d = new Date(dateStr);
    return Number.isNaN(d.getTime()) ? null : d;
  };

  const formatDate = (dateStr) => {
    const d = safeDate(dateStr);
    if (!d) return "";
    const options = { day: "2-digit", month: "long", year: "numeric" };
    return d.toLocaleDateString("fr-FR", options);
  };

  const formattedDate = (dateStr) => {
    const d = safeDate(dateStr);
    if (!d) return "";
    const options = {
      day: "2-digit",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    };
    return d.toLocaleString("fr-FR", options);
  };

  const formattedDateTimeWithSeconds = (dateStr) => {
    const d = safeDate(dateStr);
    if (!d) return "";
    const dateOptions = { day: "2-digit", month: "long", year: "numeric" };
    const timeOptions = {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    };
    const datePart = d.toLocaleDateString("fr-FR", dateOptions);
    const timePart = d.toLocaleTimeString("fr-FR", timeOptions);
    return `${datePart} à ${timePart}`;
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
    return d.toLocaleTimeString("fr-FR", {
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
    return d.toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "2-digit",
      year: "2-digit",
    });
  };

  // 🔹 Helpers pour les champs <input type="date"> et <input type="datetime-local">

  /**
   * Normalise une valeur de date (ISO, string, Date…) vers "YYYY-MM-DD"
   * pour <input type="date">
   */
  const toDateInput = (value) => {
    if (!value) return "";
    // Déjà au bon format
    if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
      return value;
    }

    const d = safeDate(value);
    if (!d) {
      // Fallback : on prend les 10 premiers caractères si c'est une string
      return String(value).slice(0, 10);
    }

    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
  };

  /**
   * Transforme une valeur de backend vers "YYYY-MM-DDTHH:mm"
   * pour <input type="datetime-local">, en utilisant l'heure locale.
   * Gère :
   *  - ISO "2025-01-06T13:30:00.000Z"
   *  - "2025-01-06 13:30:00"
   */
  const toDateTimeLocalInput = (value) => {
    if (!value) return "";

    const d = safeDate(
      // on remplace " " par "T" pour les vieux formats "YYYY-MM-DD HH:mm:ss"
      typeof value === "string" ? value.replace(" ", "T") : value
    );
    if (!d) return "";

    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    const hours = String(d.getHours()).padStart(2, "0");
    const minutes = String(d.getMinutes()).padStart(2, "0");

    // 👉 Heure locale : plus de 14:30 qui redevient 13:30
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  /**
   * Transforme une valeur d'<input type="datetime-local">
   * ("YYYY-MM-DDTHH:mm" ou "YYYY-MM-DDTHH:mm:ss")
   * en string "YYYY-MM-DD HH:mm:ss" pour le backend.
   */
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

    // nouveaux helpers
    safeDate,
    toDateInput,
    toDateTimeLocalInput,
    normalizeDateTimeLocal,
  };
}
