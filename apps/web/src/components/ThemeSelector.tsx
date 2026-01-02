
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
    <div className={`p-1.5 rounded-2xl bg-gray-100 dark:bg-gray-900/40 border border-gray-200 dark:border-gray-800 flex gap-2 ${className}`}>
      {themeOptions.map((option) => {
        const Icon = option.icon;
        const isActive = theme === option.value;
        return (
          <button
            key={option.value}
            type="button"
            onClick={() => handleSelect(option.value)}
            className={`flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all duration-300 ${
              isActive
                ? "bg-white dark:bg-gray-800 text-pink-600 dark:text-pink-400 shadow-sm ring-1 ring-black/5 dark:ring-white/10"
                : "text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-white/50 dark:hover:bg-gray-800/50"
            }`}
          >
            <Icon className="w-4 h-4" />
            <span className="hidden sm:inline">{option.label}</span>
          </button>
        );
      })}
    </div>
  );
}
