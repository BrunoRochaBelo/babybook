import { ThemeContext, useThemeSetup } from "../hooks/useTheme";

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const themeValue = useThemeSetup();

  return (
    <ThemeContext.Provider value={themeValue}>
      {children}
    </ThemeContext.Provider>
  );
}
