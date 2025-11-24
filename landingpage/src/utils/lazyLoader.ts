// === LAZY MODULE LOADER ===
// Carrega módulos pesados apenas quando necessário

import { logger } from "./logger";
import { performanceMonitor } from "./performance";

type LazyModuleLoader<T> = () => Promise<T>;

interface LazyModuleEntry<T> {
  loader: LazyModuleLoader<T>;
  loaded: boolean;
  module?: T;
  loading?: Promise<T>;
}

class LazyModuleManager {
  private modules: Map<string, LazyModuleEntry<any>> = new Map();

  // Registra módulo para lazy loading
  register<T>(name: string, loader: LazyModuleLoader<T>): void {
    this.modules.set(name, {
      loader,
      loaded: false,
    });
    logger.debug("LazyModuleManager", `Registered module: ${name}`);
  }

  // Carrega módulo (retorna promise)
  async load<T>(name: string): Promise<T | null> {
    const entry = this.modules.get(name);

    if (!entry) {
      logger.warn("LazyModuleManager", `Module not registered: ${name}`);
      return null;
    }

    // Já carregado
    if (entry.loaded && entry.module) {
      logger.debug("LazyModuleManager", `Module already loaded: ${name}`);
      return entry.module;
    }

    // Já está carregando
    if (entry.loading) {
      logger.debug("LazyModuleManager", `Module already loading: ${name}`);
      return entry.loading;
    }

    // Carregar agora
    logger.info("LazyModuleManager", `Loading module: ${name}`);
    performanceMonitor.mark(`lazy-load-${name}-start`);

    entry.loading = entry
      .loader()
      .then((module) => {
        entry.loaded = true;
        entry.module = module;
        entry.loading = undefined;

        performanceMonitor.mark(`lazy-load-${name}-end`);
        performanceMonitor.measure(
          `lazy-load-${name}`,
          `lazy-load-${name}-start`,
          `lazy-load-${name}-end`,
        );

        logger.info("LazyModuleManager", `Module loaded: ${name}`);
        return module;
      })
      .catch((error) => {
        entry.loading = undefined;
        logger.error(
          "LazyModuleManager",
          `Failed to load module: ${name} - ${error}`,
        );
        return null;
      });

    return entry.loading;
  }

  // Preload em background (não espera)
  preload(name: string): void {
    this.load(name).catch(() => {
      // Ignora erros em preload
    });
  }

  // Preload múltiplos módulos
  preloadAll(names: string[]): void {
    names.forEach((name) => this.preload(name));
  }

  // Verifica se módulo está carregado
  isLoaded(name: string): boolean {
    const entry = this.modules.get(name);
    return entry?.loaded ?? false;
  }

  // Status para debug
  getStatus() {
    const status: Record<string, string> = {};
    this.modules.forEach((entry, name) => {
      if (entry.loaded) {
        status[name] = "loaded";
      } else if (entry.loading) {
        status[name] = "loading";
      } else {
        status[name] = "registered";
      }
    });
    return status;
  }
}

export const lazyLoader = new LazyModuleManager();

// Expõe globalmente para debug
if (typeof window !== "undefined") {
  (window as any).lazyLoader = lazyLoader;
}

// === LAZY IMAGE LOADER ===
// Carrega imagens com Intersection Observer

export const setupLazyImages = () => {
  const images = document.querySelectorAll<HTMLImageElement>("img[data-src]");

  if (!images.length) {
    logger.info("setupLazyImages", "No lazy images found");
    return;
  }

  logger.info("setupLazyImages", `Found ${images.length} lazy images`);

  const imageObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const img = entry.target as HTMLImageElement;
          const src = img.dataset.src;

          if (src) {
            performanceMonitor.mark(`lazy-image-${src}-start`);

            img.src = src;
            img.removeAttribute("data-src");

            img.addEventListener("load", () => {
              performanceMonitor.mark(`lazy-image-${src}-end`);
              img.classList.add("loaded");
              logger.debug("setupLazyImages", `Loaded: ${src}`);
            });

            img.addEventListener("error", () => {
              logger.error("setupLazyImages", `Failed to load: ${src}`);
            });

            imageObserver.unobserve(img);
          }
        }
      });
    },
    {
      rootMargin: "50px",
      threshold: 0.01,
    },
  );

  images.forEach((img) => imageObserver.observe(img));
};

// === LAZY COMPONENT INITIALIZER ===
// Inicializa componentes apenas quando visíveis

export const lazyInitComponent = (
  selector: string,
  initializer: (element: HTMLElement) => void,
  options: IntersectionObserverInit = {},
) => {
  const elements = document.querySelectorAll<HTMLElement>(selector);

  if (!elements.length) {
    logger.debug("lazyInitComponent", `No elements found for: ${selector}`);
    return;
  }

  logger.info(
    "lazyInitComponent",
    `Lazy init ${elements.length} elements: ${selector}`,
  );

  const componentObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const element = entry.target as HTMLElement;

          try {
            initializer(element);
            element.setAttribute("data-lazy-initialized", "true");
            logger.debug("lazyInitComponent", `Initialized: ${selector}`);
          } catch (error) {
            logger.error(
              "lazyInitComponent",
              `Failed to initialize: ${selector} - ${error}`,
            );
          }

          componentObserver.unobserve(element);
        }
      });
    },
    {
      rootMargin: "100px",
      threshold: 0.1,
      ...options,
    },
  );

  elements.forEach((el) => {
    if (!el.hasAttribute("data-lazy-initialized")) {
      componentObserver.observe(el);
    }
  });
};
