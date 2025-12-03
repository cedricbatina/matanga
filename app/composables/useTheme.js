// composables/useTheme.js
export function useTheme() {
  const theme = useState("matanga-theme", () => "light");

  const applyThemeToDocument = (value) => {
    if (process.client) {
      const root = document.documentElement;
      root.dataset.theme = value;
    }
  };

  const setTheme = (value) => {
    theme.value = value;
    if (process.client) {
      localStorage.setItem("matanga-theme", value);
    }
    applyThemeToDocument(value);
  };

  const toggleTheme = () => {
    setTheme(theme.value === "dark" ? "light" : "dark");
  };

  onMounted(() => {
    if (!process.client) return;

    // 1. LocalStorage
    const stored = localStorage.getItem("matanga-theme");
    if (stored === "light" || stored === "dark") {
      theme.value = stored;
      applyThemeToDocument(stored);
      return;
    }

    // 2. Sinon, préférence système
    const prefersDark =
      window.matchMedia &&
      window.matchMedia("(prefers-color-scheme: dark)").matches;

    const initial = prefersDark ? "dark" : "light";
    theme.value = initial;
    applyThemeToDocument(initial);
  });

  return {
    theme,
    setTheme,
    toggleTheme,
  };
}
