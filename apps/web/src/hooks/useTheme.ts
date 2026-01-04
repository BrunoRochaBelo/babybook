/**
 * useTheme Hook
 *
 * Gerencia o tema (light/dark/system) com persistência em localStorage.
 * Aplica classe 'dark' ao elemento <html> quando necessário.
 *
 * NOTA: O tema inicial é aplicado via script inline no index.html
 * para evitar flash de conteúdo não estilizado.
 */

import { useEffect, useCallback, useSyncExternalStore } from "react";
import { useLocation } from "react-router-dom";
import { getThemeStorageKeyForPath } from "@/lib/themeStorageKey";

export type Theme = "light" | "dark" | "system";

function getSystemTheme(): "light" | "dark" {
  if (typeof window !== "undefined") {
    return window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light";
  }
  return "light";
}

function getStoredTheme(themeKey: string): Theme {
  if (typeof window === "undefined") return "system";
  const stored = localStorage.getItem(themeKey);
  if (stored === "light" || stored === "dark" || stored === "system") {
    return stored;
  }
  return "system";
}

function applyTheme(theme: Theme) {
  const root = document.documentElement;
  const effectiveTheme = theme === "system" ? getSystemTheme() : theme;

  if (effectiveTheme === "dark") {
    root.classList.add("dark");
  } else {
    root.classList.remove("dark");
  }
}

// Store global para sincronizar entre componentes.
// Importante: o B2C e o B2B (partner portal) usam chaves diferentes.
const themeListenersByKey = new Map<string, Set<() => void>>();
const currentThemeByKey: Record<string, Theme | undefined> = {};

function getOrInitTheme(themeKey: string): Theme {
  const existing = currentThemeByKey[themeKey];
  if (existing === "light" || existing === "dark" || existing === "system") {
    return existing;
  }
  const loaded = getStoredTheme(themeKey);
  currentThemeByKey[themeKey] = loaded;
  return loaded;
}

function subscribeToTheme(themeKey: string, callback: () => void) {
  const set = themeListenersByKey.get(themeKey) ?? new Set<() => void>();
  set.add(callback);
  themeListenersByKey.set(themeKey, set);
  return () => {
    const listeners = themeListenersByKey.get(themeKey);
    listeners?.delete(callback);
    if (listeners && listeners.size === 0) {
      themeListenersByKey.delete(themeKey);
    }
  };
}

function setGlobalTheme(themeKey: string, newTheme: Theme) {
  currentThemeByKey[themeKey] = newTheme;
  localStorage.setItem(themeKey, newTheme);
  applyTheme(newTheme);

  const listeners = themeListenersByKey.get(themeKey);
  listeners?.forEach((listener) => listener());
}

export function useTheme() {
  const location = useLocation();
  const themeKey = getThemeStorageKeyForPath(location.pathname);

  // Usa useSyncExternalStore para sincronizar entre componentes
  const theme = useSyncExternalStore(
    (callback) => subscribeToTheme(themeKey, callback),
    () => getOrInitTheme(themeKey),
    () => getOrInitTheme(themeKey),
  );

  // Quando troca de "portal" (B2C <-> B2B), aplica o tema armazenado daquela chave.
  useEffect(() => {
    applyTheme(theme);
  }, [themeKey, theme]);

  // Escuta mudanças na preferência do sistema
  useEffect(() => {
    if (theme !== "system") return;

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");

    const handleChange = () => {
      applyTheme("system");
    };

    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, [theme]);

  // Função para mudar o tema
  const setTheme = useCallback(
    (newTheme: Theme) => {
      setGlobalTheme(themeKey, newTheme);
    },
    [themeKey],
  );

  // Toggle simples
  const toggleTheme = useCallback(() => {
    const newTheme = theme === "dark" ? "light" : "dark";
    setTheme(newTheme);
  }, [theme, setTheme]);

  // Tema efetivo (resolvido para light/dark)
  const effectiveTheme = theme === "system" ? getSystemTheme() : theme;

  return {
    theme,
    effectiveTheme,
    setTheme,
    toggleTheme,
    isLight: effectiveTheme === "light",
    isDark: effectiveTheme === "dark",
  };
}
