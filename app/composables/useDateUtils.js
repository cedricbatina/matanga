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

  return {
    timeAgo,
    shortDate,
    formatDate,
    formattedDate,
    formatDateISO,
    getCountdownString,
    formattedHourMinute,
    formattedDateTimeWithSeconds,
  };
}
