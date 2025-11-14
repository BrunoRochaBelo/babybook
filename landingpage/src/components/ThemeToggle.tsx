import { Moon, Sun } from "lucide-react";
import { useTheme } from "../hooks/useTheme";

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className="inline-flex items-center gap-2 rounded-full border border-border bg-card/70 px-4 py-2 text-sm font-semibold text-foreground shadow-sm transition hover:bg-card"
      aria-label="Alternar tema claro/escuro"
    >
      {theme === "light" ? (
        <>
          <Moon className="h-4 w-4" /> modo escuro
        </>
      ) : (
        <>
          <Sun className="h-4 w-4" /> modo claro
        </>
      )}
    </button>
  );
}
