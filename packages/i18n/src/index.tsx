import {
  PropsWithChildren,
  useEffect,
  useCallback,
  createContext,
  useContext,
  useState,
} from "react";
import {
  I18nextProvider,
  useTranslation as useI18nextTranslation,
} from "react-i18next";
import i18next from "i18next";
import { initReactI18next } from "react-i18next";
import ptBR from "./locales/pt-BR.json";
import enUS from "./locales/en-US.json";

// Tipos
export type SupportedLanguage = "pt-BR" | "en-US";
export type LanguageOption = {
  code: SupportedLanguage;
  name: string;
  flag: string;
};

// Idiomas suportados
export const SUPPORTED_LANGUAGES: LanguageOption[] = [
  { code: "pt-BR", name: "Português (BR)", flag: "🇧🇷" },
  { code: "en-US", name: "English (US)", flag: "🇺🇸" },
];

// Chave do localStorage
const LANGUAGE_STORAGE_KEY = "babybook-language";

// Detectar idioma do navegador
function detectBrowserLanguage(): SupportedLanguage {
  if (typeof window === "undefined") return "pt-BR";

  // Verificar localStorage primeiro
  const stored = localStorage.getItem(LANGUAGE_STORAGE_KEY);
  if (stored && (stored === "pt-BR" || stored === "en-US")) {
    return stored;
  }

  // Detectar do navegador
  // Alguns navegadores/ambientes legados expõem `userLanguage`.
  // Tipamos de forma segura para evitar `any`.
  const nav = navigator as Navigator & { userLanguage?: string };
  const browserLang = navigator.language || nav.userLanguage;

  if (browserLang?.startsWith("pt")) {
    return "pt-BR";
  }
  if (browserLang?.startsWith("en")) {
    return "en-US";
  }

  // Fallback para português
  return "pt-BR";
}

// Inicialização
let initialized = false;

function ensureInit() {
  if (initialized) {
    return;
  }

  const detectedLanguage = detectBrowserLanguage();

  i18next.use(initReactI18next).init({
    lng: detectedLanguage,
    fallbackLng: "pt-BR",
    resources: {
      "pt-BR": {
        translation: ptBR,
      },
      "en-US": {
        translation: enUS,
      },
    },
    interpolation: {
      escapeValue: false, // React já escapa por padrão
    },
    react: {
      useSuspense: false,
    },
  });

  initialized = true;
}

// Context para gerenciamento de idioma
interface LanguageContextValue {
  language: SupportedLanguage;
  setLanguage: (lang: SupportedLanguage) => void;
  languages: LanguageOption[];
}

const LanguageContext = createContext<LanguageContextValue | null>(null);

// Provider principal
export function I18nProvider({ children }: PropsWithChildren) {
  // Garantir inicialização síncrona para evitar que children tentem usar 't' antes do init
  if (!initialized) {
    ensureInit();
  }

  const [language, setLanguageState] = useState<SupportedLanguage>(() =>
    detectBrowserLanguage(),
  );

  // useEffect(() => {
  //   ensureInit();
  // }, []);

  const setLanguage = useCallback((lang: SupportedLanguage) => {
    i18next.changeLanguage(lang);
    localStorage.setItem(LANGUAGE_STORAGE_KEY, lang);
    setLanguageState(lang);
    // Atualizar atributo lang do HTML
    document.documentElement.lang = lang;
  }, []);

  // Sincronizar idioma inicial
  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  const contextValue: LanguageContextValue = {
    language,
    setLanguage,
    languages: SUPPORTED_LANGUAGES,
  };

  return (
    <LanguageContext.Provider value={contextValue}>
      <I18nextProvider i18n={i18next}>{children}</I18nextProvider>
    </LanguageContext.Provider>
  );
}

// Hook para acessar gerenciamento de idioma
export function useLanguage(): LanguageContextValue {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within an I18nProvider");
  }
  return context;
}

// Re-exportar o hook useTranslation do react-i18next
export const useTranslation = useI18nextTranslation;

// Exportar instância i18next para uso direto (quando necessário)
export { i18next };

// Função t para uso fora de componentes React
export function t(key: string, options?: Record<string, unknown>): string {
  ensureInit();
  return i18next.t(key, options);
}
