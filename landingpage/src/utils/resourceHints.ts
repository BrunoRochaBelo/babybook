// === RESOURCE HINTS ===
// DNS prefetch, preconnect, preload

import { logger } from "./logger";

interface ResourceHintConfig {
  // DNS Prefetch
  dnsPrefetch?: string[];
  // Preconnect (DNS + TCP + TLS)
  preconnect?: string[];
  // Preload (high priority fetch)
  preload?: Array<{
    href: string;
    as: string;
    type?: string;
    crossorigin?: "anonymous" | "use-credentials";
  }>;
}

const DEFAULT_CONFIG: ResourceHintConfig = {
  dnsPrefetch: ["https://fonts.googleapis.com", "https://fonts.gstatic.com"],
  preconnect: ["https://fonts.googleapis.com", "https://fonts.gstatic.com"],
  preload: [
    // Adicionar fonts críticas aqui se necessário
  ],
};

class ResourceHints {
  private added: Set<string> = new Set();

  // Adiciona link tag ao head
  private addLink(
    rel: string,
    href: string,
    attrs: Record<string, string> = {},
  ): void {
    const key = `${rel}:${href}`;
    if (this.added.has(key)) {
      return;
    }

    const link = document.createElement("link");
    link.rel = rel;
    link.href = href;

    Object.entries(attrs).forEach(([key, value]) => {
      link.setAttribute(key, value);
    });

    document.head.appendChild(link);
    this.added.add(key);
    logger.debug("ResourceHints", `Added ${rel}: ${href}`);
  }

  // DNS Prefetch
  public dnsPrefetch(urls: string[]): void {
    urls.forEach((url) => {
      this.addLink("dns-prefetch", url);
    });
    logger.info("ResourceHints", `DNS prefetch for ${urls.length} origins`);
  }

  // Preconnect
  public preconnect(urls: string[], crossorigin = false): void {
    urls.forEach((url) => {
      const attrs: Record<string, string> = {};
      if (crossorigin) {
        attrs.crossorigin = "anonymous";
      }
      this.addLink("preconnect", url, attrs);
    });
    logger.info("ResourceHints", `Preconnect to ${urls.length} origins`);
  }

  // Preload
  public preload(
    href: string,
    as: string,
    options: {
      type?: string;
      crossorigin?: "anonymous" | "use-credentials";
    } = {},
  ): void {
    const attrs: Record<string, string> = { as };
    if (options.type) attrs.type = options.type;
    if (options.crossorigin) attrs.crossorigin = options.crossorigin;

    this.addLink("preload", href, attrs);
    logger.debug("ResourceHints", `Preload ${as}: ${href}`);
  }

  // Preload multiple
  public preloadMultiple(
    resources: Array<{
      href: string;
      as: string;
      type?: string;
      crossorigin?: "anonymous" | "use-credentials";
    }>,
  ): void {
    resources.forEach((resource) => {
      this.preload(resource.href, resource.as, {
        type: resource.type,
        crossorigin: resource.crossorigin,
      });
    });
    logger.info("ResourceHints", `Preloaded ${resources.length} resources`);
  }
}

export const resourceHints = new ResourceHints();

// Setup default hints
export const setupResourceHints = (
  config: ResourceHintConfig = DEFAULT_CONFIG,
) => {
  // DNS Prefetch
  if (config.dnsPrefetch?.length) {
    resourceHints.dnsPrefetch(config.dnsPrefetch);
  }

  // Preconnect
  if (config.preconnect?.length) {
    resourceHints.preconnect(config.preconnect, true);
  }

  // Preload
  if (config.preload?.length) {
    resourceHints.preloadMultiple(config.preload);
  }

  logger.info("setupResourceHints", "Initialized");
};

// Expõe globalmente para debug
if (typeof window !== "undefined") {
  (window as any).resourceHints = resourceHints;
}
