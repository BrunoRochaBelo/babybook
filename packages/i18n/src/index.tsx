import { PropsWithChildren, useEffect } from "react";
import { I18nextProvider } from "react-i18next";
import i18next from "i18next";
import ptBR from "./locales/pt-BR.json";

let initialized = false;

function ensureInit() {
  if (initialized) {
    return;
  }
  i18next.init({
    lng: "pt-BR",
    fallbackLng: "pt-BR",
    resources: {
      "pt-BR": {
        translation: ptBR
      }
    }
  });
  initialized = true;
}

export function I18nProvider({ children }: PropsWithChildren) {
  useEffect(() => {
    ensureInit();
  }, []);

  ensureInit();

  return <I18nextProvider i18n={i18next}>{children}</I18nextProvider>;
}
