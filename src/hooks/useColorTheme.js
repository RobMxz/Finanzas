import { useTheme } from "next-themes";

export function useColorTheme() {
  const { resolvedTheme, setTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  const toggleColorMode = () => setTheme(isDark ? "light" : "dark");

  return {
    isDark,
    toggleColorMode,

    // Fondos
    bgPage: isDark ? "#0d1117" : "#f0f4f8",
    bgCard: isDark ? "#161b22" : "#ffffff",
    bgSidebar: isDark ? "#0d1117" : "#ffffff",
    bgHover: isDark ? "#1c2128" : "#f8fafc",
    bgActiveNav: isDark ? "rgba(34,197,94,0.12)" : "rgba(34,197,94,0.08)",
    bgInput: isDark ? "#1c2128" : "#f8fafc",
    bgSubtle: isDark ? "#1c2128" : "#f1f5f9",

    // Bordes
    borderColor: isDark ? "#30363d" : "#e2e8f0",
    borderLight: isDark ? "#21262d" : "#f1f5f9",

    // Textos
    textPrimary: isDark ? "#e6edf3" : "#0f172a",
    textSecondary: isDark ? "#8b949e" : "#475569",
    textMuted: isDark ? "#484f58" : "#94a3b8",
    textActiveNav: isDark ? "#4ade80" : "#16a34a",
    textNav: isDark ? "#8b949e" : "#64748b",

    // Sombras
    shadow: isDark
      ? "0 1px 3px rgba(0,0,0,0.4), 0 1px 2px rgba(0,0,0,0.3)"
      : "0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)",
    shadowMd: isDark
      ? "0 4px 16px rgba(0,0,0,0.4)"
      : "0 4px 16px rgba(0,0,0,0.08)",
    shadowLg: isDark
      ? "0 8px 32px rgba(0,0,0,0.5)"
      : "0 8px 32px rgba(0,0,0,0.10)",
  };
}
