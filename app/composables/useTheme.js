// composables/useTheme.js
import { watch } from "vue";
import { useCookie, useHead, useState } from "#imports";

export function useTheme() {
  const themeCookie = useCookie("matanga-theme", {
    sameSite: "lax",
    path: "/",
  });

  const theme = useState("matanga-theme", () => {
    const v = themeCookie.value;
    return v === "dark" || v === "light" ? v : "light";
  });

  const applyThemeToDocument = (value) => {
    if (process.client) {
      document.documentElement.dataset.theme = value;
    }
  };

  const setTheme = (value) => {
    const next = value === "dark" ? "dark" : "light";
    theme.value = next;
    themeCookie.value = next; // ✅ SSR + client
    if (process.client) localStorage.setItem("matanga-theme", next);
    applyThemeToDocument(next);
  };

  const toggleTheme = () => {
    setTheme(theme.value === "dark" ? "light" : "dark");
  };

  // ✅ SSR : injecte data-theme dans <html>
  useHead(() => ({
    htmlAttrs: {
      "data-theme": theme.value,
    },
  }));

  // ✅ Client : sync localStorage => state + dataset
  if (process.client) {
    const stored = localStorage.getItem("matanga-theme");
    if (stored === "dark" || stored === "light") {
      theme.value = stored;
      themeCookie.value = stored;
    }
    applyThemeToDocument(theme.value);
  }

  // Si on change via toggle => applique
  watch(theme, (v) => applyThemeToDocument(v), { immediate: true });

  return { theme, setTheme, toggleTheme };
}
