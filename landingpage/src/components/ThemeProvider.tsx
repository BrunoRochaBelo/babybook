import { ThemeContext, useThemeSetup } from '../hooks/useTheme';

/**
 * Provides theme context to its children.  
 * Wrap your application with this component to enable dark/light mode toggling.
 */
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const themeValue = useThemeSetup();
  return <ThemeContext.Provider value={themeValue}>{children}</ThemeContext.Provider>;
}