import { useLanguage, type LanguageOption } from "@babybook/i18n";
import { Globe } from "lucide-react";
import { useState, useRef, useEffect } from "react";

interface LanguageSelectorProps {
  variant?: "full" | "compact";
  className?: string;
}

export function LanguageSelector({
  variant = "full",
  className = "",
}: LanguageSelectorProps) {
  const { language, setLanguage, languages } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const currentLanguage =
    languages.find((l) => l.code === language) ?? languages[0];

  // Fechar dropdown ao clicar fora
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
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

  const handleSelect = (lang: LanguageOption) => {
    setLanguage(lang.code);
    setIsOpen(false);
  };

  if (variant === "compact") {
    return (
      <div className={`relative ${className}`} ref={dropdownRef}>
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-1.5 px-2 py-1.5 text-sm rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          aria-label="Selecionar idioma"
          aria-expanded={isOpen}
          aria-haspopup="listbox"
        >
          <Globe className="w-4 h-4 text-slate-500 dark:text-slate-400" />
          <span className="text-base">{currentLanguage.flag}</span>
        </button>

        {isOpen && (
          <div
            className="absolute right-0 top-full mt-1 py-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg z-50 min-w-[140px]"
            role="listbox"
            aria-label="Idiomas disponíveis"
          >
            {languages.map((lang) => (
              <button
                key={lang.code}
                type="button"
                role="option"
                aria-selected={lang.code === language}
                onClick={() => handleSelect(lang)}
                className={`w-full flex items-center gap-2 px-3 py-2 text-sm text-left hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors ${
                  lang.code === language
                    ? "bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400"
                    : "text-slate-700 dark:text-slate-300"
                }`}
              >
                <span className="text-base">{lang.flag}</span>
                <span>{lang.name}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div
      className={`p-1.5 rounded-2xl bg-gray-100 dark:bg-gray-900/40 border border-gray-200 dark:border-gray-800 flex gap-2 ${className}`}
    >
      {languages.map((lang) => {
        const isActive = language === lang.code;
        return (
          <button
            key={lang.code}
            type="button"
            onClick={() => handleSelect(lang)}
            className={`flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all duration-300 ${
              isActive
                ? "bg-white dark:bg-gray-800 text-pink-600 dark:text-pink-400 shadow-sm ring-1 ring-black/5 dark:ring-white/10"
                : "text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-white/50 dark:hover:bg-gray-800/50"
            }`}
          >
            <span className="text-sm">{lang.flag}</span>
            <span>{lang.name}</span>
          </button>
        );
      })}
    </div>
  );
}
