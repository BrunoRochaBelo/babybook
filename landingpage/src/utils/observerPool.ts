// === INTERSECTION OBSERVER POOL ===
// Reutiliza observers para melhor performance

interface ObserverConfig {
  threshold?: number | number[];
  rootMargin?: string;
  root?: Element | null;
}

type ObserverCallback = (
  entries: IntersectionObserverEntry[],
  observer: IntersectionObserver,
) => void;

interface ObserverEntry {
  observer: IntersectionObserver;
  callbacks: Map<Element, ObserverCallback>;
  config: ObserverConfig;
}

class IntersectionObserverPool {
  private observers: Map<string, ObserverEntry> = new Map();

  // Gera key única para configuração
  private getConfigKey(config: ObserverConfig): string {
    return JSON.stringify({
      threshold: config.threshold ?? 0,
      rootMargin: config.rootMargin ?? "0px",
      root: config.root ?? null,
    });
  }

  // Obtém ou cria observer para a configuração
  private getOrCreateObserver(config: ObserverConfig): ObserverEntry {
    const key = this.getConfigKey(config);

    if (!this.observers.has(key)) {
      const callbacks = new Map<Element, ObserverCallback>();

      const observer = new IntersectionObserver((entries, obs) => {
        entries.forEach((entry) => {
          const callback = callbacks.get(entry.target);
          if (callback) {
            callback([entry], obs);
          }
        });
      }, config);

      this.observers.set(key, { observer, callbacks, config });
    }

    return this.observers.get(key)!;
  }

  // Observa elemento com callback
  observe(
    element: Element,
    callback: ObserverCallback,
    config: ObserverConfig = {},
  ): void {
    const entry = this.getOrCreateObserver(config);
    entry.callbacks.set(element, callback);
    entry.observer.observe(element);
  }

  // Para de observar elemento
  unobserve(element: Element, config: ObserverConfig = {}): void {
    const key = this.getConfigKey(config);
    const entry = this.observers.get(key);

    if (entry) {
      entry.callbacks.delete(element);
      entry.observer.unobserve(element);

      // Remove observer se não tem mais callbacks
      if (entry.callbacks.size === 0) {
        entry.observer.disconnect();
        this.observers.delete(key);
      }
    }
  }

  // Desconecta todos os observers
  disconnectAll(): void {
    this.observers.forEach((entry) => {
      entry.observer.disconnect();
      entry.callbacks.clear();
    });
    this.observers.clear();
  }

  // Status para debug
  getStats() {
    const stats: Array<{
      config: ObserverConfig;
      elementsObserved: number;
    }> = [];

    this.observers.forEach((entry) => {
      stats.push({
        config: entry.config,
        elementsObserved: entry.callbacks.size,
      });
    });

    return stats;
  }
}

export const observerPool = new IntersectionObserverPool();

// Helper functions para uso comum
export const observeElement = (
  selector: string,
  callback: ObserverCallback,
  config?: ObserverConfig,
): void => {
  const elements = document.querySelectorAll(selector);
  elements.forEach((el) => {
    observerPool.observe(el, callback, config);
  });
};

export const observeOnce = (
  element: Element,
  callback: (entry: IntersectionObserverEntry) => void,
  config: ObserverConfig = {},
): void => {
  observerPool.observe(
    element,
    ([entry]) => {
      if (entry.isIntersecting) {
        callback(entry);
        observerPool.unobserve(element, config);
      }
    },
    config,
  );
};

// Expõe globalmente para debug
if (typeof window !== "undefined") {
  (window as any).observerPool = observerPool;
}
