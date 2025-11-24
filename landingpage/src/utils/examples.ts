// === EXEMPLO DE USO DOS NOVOS UTILITÁRIOS ===
// Este arquivo demonstra como usar as melhorias propostas

import { CONFIG } from "./config";
import { logger, safeInit, withElement } from "./logger";
import { createScrollThrottle } from "./helpers";

// ANTES: Código duplicado e sem error handling
export const setupFeatureOld = () => {
  const element = document.querySelector(".my-element") as HTMLElement;
  if (!element) return;

  let ticking = false;
  window.addEventListener("scroll", () => {
    if (!ticking) {
      window.requestAnimationFrame(() => {
        // lógica aqui
        ticking = false;
      });
      ticking = true;
    }
  });
};

// DEPOIS: Usando utilitários, configuração centralizada e logging
export const setupFeatureNew = () => {
  safeInit("MyFeature", () => {
    withElement(
      ".my-element",
      (element) => {
        const handleScroll = () => {
          logger.debug("Scroll event processed");
          // lógica aqui
        };

        const throttledScroll = createScrollThrottle(handleScroll);
        window.addEventListener("scroll", throttledScroll, { passive: true });

        logger.info("MyFeature initialized with element", element);
      },
      "MyFeature: Element not found",
    );
  });
};

// Exemplo com configuração
export const setupWithConfig = () => {
  const { scrollThreshold, timeThreshold } = CONFIG.exitIntent;

  logger.debug("Using config", { scrollThreshold, timeThreshold });

  // Use as configurações...
};
