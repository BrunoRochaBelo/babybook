/**
 * useTheme Hook
 *
 * Gerencia o tema (light/dark/system) com persistência em localStorage.
 * Aplica classe 'dark' ao elemento <html> quando necessário.
 * 
 * NOTA: O tema inicial é aplicado via script inline no index.html
 * para evitar flash de conteúdo não estilizado.
 */

import { useState, useEffect, useCallback, useSyncExternalStore } from "react";

export type Theme = "light" | "dark" | "system";

const THEME_KEY = "babybook-theme";

function getSystemTheme(): "light" | "dark" {
  if (typeof window !== "undefined") {
    return window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light";
  }
  return "light";
}

function getStoredTheme(): Theme {
  if (typeof window === "undefined") return "system";
  const stored = localStorage.getItem(THEME_KEY);
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
  
  // Log para debug (remover em produção)
  console.log("[applyTheme] Applied:", effectiveTheme, "| From:", theme);
}

// Store global para sincronizar entre componentes
let themeListeners: Array<() => void> = [];
let currentTheme: Theme = getStoredTheme();

function subscribeToTheme(callback: () => void) {
  themeListeners.push(callback);
  return () => {
    themeListeners = themeListeners.filter((l) => l !== callback);
  };
}

function getThemeSnapshot() {
  return currentTheme;
}

function setGlobalTheme(newTheme: Theme) {
  console.log("[setGlobalTheme] Setting theme to:", newTheme);
  currentTheme = newTheme;
  localStorage.setItem(THEME_KEY, newTheme);
  applyTheme(newTheme);
  // Notifica todos os listeners
  themeListeners.forEach((listener) => listener());
}

export function useTheme() {
  // Usa useSyncExternalStore para sincronizar entre componentes
  const theme = useSyncExternalStore(subscribeToTheme, getThemeSnapshot, getThemeSnapshot);

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
  const setTheme = useCallback((newTheme: Theme) => {
    setGlobalTheme(newTheme);
  }, []);

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
