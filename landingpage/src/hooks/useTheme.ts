import { createContext, useContext, useEffect, useState } from 'react';

/**
 * Defines the available colour themes.  
 * The landing page supports both light and dark modes.
 */
export type Theme = 'light' | 'dark';

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
}

// Create a React context for the theme.  The value will be provided by the ThemeProvider.
export const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

/**
 * Hook encapsulating theme state and side effects.  
 * It persists the user’s preference in localStorage and applies the appropriate class to the document root.
 */
export function useThemeSetup() {
  const [theme, setTheme] = useState<Theme>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('theme') as Theme | null;
      if (stored) return stored;
      // Detect system preference on first load
      if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
        return 'dark';
      }
    }
    return 'light';
  });

  // Synchronise document class and localStorage when theme changes
  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');
    root.classList.add(theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => (prev === 'light' ? 'dark' : 'light'));
  };

  return { theme, toggleTheme };
}

/**
 * Hook for consuming the theme context.  
 * Throws an error if used outside of a ThemeProvider.
 */
export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}