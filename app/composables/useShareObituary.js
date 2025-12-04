// composables/useShareObituary.js
import { computed } from "vue";
import { useRuntimeConfig, useI18n } from "#imports";

export function useShareObituary() {
  const runtimeConfig = useRuntimeConfig();
  const { t } = useI18n();

  // URL de base du site (config / fallback window.location.origin)
  const baseUrl = computed(() => {
    const configured = runtimeConfig.public?.siteUrl;
    if (configured) {
      return configured.replace(/\/+$/, "");
    }
    if (process.client && typeof window !== "undefined") {
      return window.location.origin;
    }
    return "";
  });

  const buildUrl = (slug) => {
    const base = baseUrl.value || "";
    return `${base}/obituary/${slug}`;
  };

  // Payload de base (titre + texte + url)
  const buildSharePayload = (obituary) => {
    if (!obituary) {
      return {
        title: "",
        text: "",
        url: "",
      };
    }

    const name = obituary.deceased?.fullName || obituary.content?.title || "";

    const url = buildUrl(obituary.slug);

    const title = t("share.obituary.titlePattern", {
      name: name || t("share.obituary.defaultName"),
    });

    const text = t("share.obituary.textPattern", {
      name: name || t("share.obituary.defaultName"),
    });

    return { title, text, url };
  };

  // Web Share API dispo ?
  const canNativeShare = computed(() => {
    return (
      process.client &&
      typeof navigator !== "undefined" &&
      typeof navigator.share === "function"
    );
  });

  // Partage "intégré" (mobile, PWA, etc.) + fallback clipboard
  const shareObituary = async (obituary) => {
    const payload = buildSharePayload(obituary);

    // 1) Web Share API (mobile / PWA)
    if (canNativeShare.value) {
      try {
        await navigator.share({
          title: payload.title,
          text: payload.text,
          url: payload.url,
        });
        return { ok: true, method: "native" };
      } catch (err) {
        if (err && err.name === "AbortError") {
          // Annulé par l’utilisateur
          return { ok: false, cancelled: true };
        }

        console.warn("native share failed", err);
        return {
          ok: false,
          error: err,
          method: "native",
        };
      }
    }

    // 2) Fallback : copie dans le presse-papiers
    if (
      process.client &&
      navigator.clipboard &&
      typeof navigator.clipboard.writeText === "function"
    ) {
      try {
        await navigator.clipboard.writeText(payload.url);
        return { ok: true, method: "clipboard", url: payload.url };
      } catch (err) {
        console.warn("clipboard share failed", err);
        return {
          ok: false,
          error: err,
          method: "clipboard",
          url: payload.url,
        };
      }
    }

    // 3) Rien de dispo : on renvoie juste le payload
    return {
      ok: false,
      method: "none",
      payload,
    };
  };

  // URLs pour les différents réseaux sociaux
  const buildShareUrls = (obituary) => {
    const payload = buildSharePayload(obituary);
    if (!payload.url) return null;

    const encodedUrl = encodeURIComponent(payload.url);
    const encodedText = encodeURIComponent(payload.text);
    const fullText = `${payload.title}\n\n${payload.text}\n\n${payload.url}`;
    const encodedFullText = encodeURIComponent(fullText);

    return {
      directUrl: payload.url,
      whatsapp: `https://wa.me/?text=${encodedFullText}`,
      email: `mailto:?subject=${encodeURIComponent(
        payload.title
      )}&body=${encodedFullText}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
      x: `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedText}`,
      linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
      telegram: `https://t.me/share/url?url=${encodedUrl}&text=${encodedText}`,
    };
  };

  return {
    baseUrl,
    canNativeShare,
    buildUrl,
    buildSharePayload,
    shareObituary,
    buildShareUrls,
  };
}
