
import { useTheme, type Theme } from "@/hooks/useTheme";
import { useTranslation } from "@babybook/i18n";
import { ChevronDown, Moon, Sun, Monitor } from "lucide-react";
import { useState, useRef, useEffect } from "react";

interface ThemeSelectorProps {
  className?: string;
}

export function ThemeSelector({ className = "" }: ThemeSelectorProps) {
  const { theme, setTheme } = useTheme();
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const themeOptions: { value: Theme; label: string; icon: React.ElementType }[] = [
    { value: "light", label: t("partner.settings.preferences.themeLight"), icon: Sun },
    { value: "dark", label: t("partner.settings.preferences.themeDark"), icon: Moon },
    { value: "system", label: t("partner.settings.preferences.themeSystem"), icon: Monitor },
  ];

  const currentTheme = themeOptions.find((o) => o.value === theme) ?? themeOptions[0];
  const Icon = currentTheme.icon;

  // Fechar dropdown ao clicar fora
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Fechar dropdown ao pressionar Escape
  useEffect(() => {
    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    }

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, []);

  const handleSelect = (newTheme: Theme) => {
    setTheme(newTheme);
    setIsOpen(false);
  };

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors bg-white dark:bg-slate-900 w-full sm:w-auto min-w-[140px] justify-between"
        aria-label={t("partner.settings.preferences.theme")}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
      >
        <div className="flex items-center gap-2">
          <Icon className="w-4 h-4 text-slate-500 dark:text-slate-400" />
          <span className="text-slate-700 dark:text-slate-300">{currentTheme.label}</span>
        </div>
        <ChevronDown
          className={`w-4 h-4 text-slate-500 transition-transform ${isOpen ? "rotate-180" : ""}`}
        />
      </button>

      {isOpen && (
        <div
          className="absolute left-0 top-full mt-1 py-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg z-50 min-w-[140px] w-full"
          role="listbox"
          aria-label={t("partner.settings.preferences.theme")}
        >
          {themeOptions.map((option) => (
            <button
              key={option.value}
              type="button"
              role="option"
              aria-selected={option.value === theme}
              onClick={() => handleSelect(option.value)}
              className={`w-full flex items-center gap-2 px-3 py-2 text-sm text-left hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors ${
                option.value === theme
                  ? "bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400"
                  : "text-slate-700 dark:text-slate-300"
              }`}
            >
              <option.icon className="w-4 h-4" />
              <span>{option.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
