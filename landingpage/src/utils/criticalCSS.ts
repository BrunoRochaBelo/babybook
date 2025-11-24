// === CRITICAL CSS EXTRACTOR ===
// Extrai e inline CSS crítico above-the-fold

import { logger } from "./logger";

interface CriticalCSSOptions {
  viewport: {
    width: number;
    height: number;
  };
  inline: boolean;
  minify: boolean;
}

const DEFAULT_OPTIONS: CriticalCSSOptions = {
  viewport: {
    width: 1280,
    height: 720,
  },
  inline: true,
  minify: true,
};

class CriticalCSSExtractor {
  private criticalSelectors: Set<string> = new Set();
  private aboveFoldElements: Set<Element> = new Set();

  // Identifica elementos above-the-fold
  private identifyAboveFoldElements(viewportHeight: number): void {
    const elements = document.querySelectorAll("*");

    elements.forEach((element) => {
      const rect = element.getBoundingClientRect();
      if (rect.top < viewportHeight && rect.bottom > 0) {
        this.aboveFoldElements.add(element);
      }
    });

    logger.info(
      "CriticalCSS",
      `Found ${this.aboveFoldElements.size} above-fold elements`,
    );
  }

  // Extrai seletores usados nos elementos above-fold
  private extractUsedSelectors(): void {
    this.aboveFoldElements.forEach((element) => {
      // Classes
      element.classList.forEach((className) => {
        this.criticalSelectors.add(`.${className}`);
      });

      // ID
      if (element.id) {
        this.criticalSelectors.add(`#${element.id}`);
      }

      // Tag
      this.criticalSelectors.add(element.tagName.toLowerCase());
    });

    logger.info(
      "CriticalCSS",
      `Extracted ${this.criticalSelectors.size} selectors`,
    );
  }

  // Extrai regras CSS críticas
  private extractCriticalRules(): string[] {
    const criticalRules: string[] = [];

    Array.from(document.styleSheets).forEach((sheet) => {
      try {
        const rules = Array.from(sheet.cssRules || []);

        rules.forEach((rule) => {
          if (rule instanceof CSSStyleRule) {
            // Verifica se regra é usada nos elementos críticos
            const selectorText = rule.selectorText;
            const selectors = selectorText.split(",").map((s) => s.trim());

            const isCritical = selectors.some((selector) => {
              // Remove pseudo-classes/elementos para comparação
              const baseSelector = selector.split(":")[0].split("::")[0].trim();
              return this.criticalSelectors.has(baseSelector);
            });

            if (isCritical) {
              criticalRules.push(rule.cssText);
            }
          } else if (rule instanceof CSSMediaRule) {
            // Processa media queries
            criticalRules.push(rule.cssText);
          } else if (rule instanceof CSSFontFaceRule) {
            // Inclui font-face
            criticalRules.push(rule.cssText);
          }
        });
      } catch (error) {
        // Cross-origin stylesheet
        logger.warn("CriticalCSS", `Cannot access stylesheet: ${sheet.href}`);
      }
    });

    return criticalRules;
  }

  // Minifica CSS
  private minifyCSS(css: string): string {
    return css
      .replace(/\/\*[\s\S]*?\*\//g, "") // Remove comentários
      .replace(/\s+/g, " ") // Normaliza espaços
      .replace(/\s*{\s*/g, "{") // Remove espaços antes/depois de {
      .replace(/\s*}\s*/g, "}") // Remove espaços antes/depois de }
      .replace(/\s*:\s*/g, ":") // Remove espaços ao redor de :
      .replace(/\s*;\s*/g, ";") // Remove espaços ao redor de ;
      .replace(/;}/g, "}") // Remove último ; antes de }
      .trim();
  }

  // Extrai CSS crítico
  public extract(options: Partial<CriticalCSSOptions> = {}): string {
    const opts = { ...DEFAULT_OPTIONS, ...options };

    logger.info("CriticalCSS", "Extracting critical CSS...");

    // Identifica elementos above-fold
    this.identifyAboveFoldElements(opts.viewport.height);

    // Extrai seletores
    this.extractUsedSelectors();

    // Extrai regras
    const criticalRules = this.extractCriticalRules();
    let criticalCSS = criticalRules.join("\n");

    // Minifica
    if (opts.minify) {
      criticalCSS = this.minifyCSS(criticalCSS);
    }

    logger.info(
      "CriticalCSS",
      `Extracted ${criticalCSS.length} characters of critical CSS`,
    );

    return criticalCSS;
  }

  // Inline critical CSS no head
  public inline(css: string): void {
    const style = document.createElement("style");
    style.textContent = css;
    style.setAttribute("data-critical", "true");
    document.head.insertBefore(style, document.head.firstChild);

    logger.info("CriticalCSS", "Critical CSS inlined");
  }

  // Defer non-critical CSS
  public deferNonCritical(): void {
    const links = document.querySelectorAll<HTMLLinkElement>(
      'link[rel="stylesheet"]',
    );

    links.forEach((link) => {
      // Carrega CSS de forma assíncrona
      const href = link.href;
      link.rel = "preload";
      link.as = "style";
      link.onload = function () {
        (this as HTMLLinkElement).rel = "stylesheet";
      };

      // Fallback para navegadores antigos
      const noscript = document.createElement("noscript");
      const fallbackLink = document.createElement("link");
      fallbackLink.rel = "stylesheet";
      fallbackLink.href = href;
      noscript.appendChild(fallbackLink);
      link.parentNode?.insertBefore(noscript, link.nextSibling);
    });

    logger.info("CriticalCSS", `Deferred ${links.length} stylesheets`);
  }
}

export const criticalCSS = new CriticalCSSExtractor();

// === SETUP FUNCTIONS ===

// Extrai e inline critical CSS (executar no build)
export const extractAndInlineCriticalCSS = (
  options: Partial<CriticalCSSOptions> = {},
) => {
  const css = criticalCSS.extract(options);
  criticalCSS.inline(css);
  criticalCSS.deferNonCritical();

  logger.info("extractAndInlineCriticalCSS", "Complete");
};

// Defer CSS (mais simples, sem extração)
export const deferCSS = () => {
  criticalCSS.deferNonCritical();
  logger.info("deferCSS", "Non-critical CSS deferred");
};

// Expõe globalmente para debug/build tools
if (typeof window !== "undefined") {
  (window as any).criticalCSS = criticalCSS;
}
