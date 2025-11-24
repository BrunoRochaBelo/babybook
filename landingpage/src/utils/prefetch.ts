// === SMART PREFETCH ===
// Predictive prefetching baseado em comportamento do usuário

import { logger } from "./logger";
import { performanceMonitor } from "./performance";

interface PrefetchConfig {
  enabled: boolean;
  maxConcurrent: number;
  connectionThreshold: string; // '4g', '3g', '2g'
  idleTimeout: number; // ms
}

const CONFIG: PrefetchConfig = {
  enabled: true,
  maxConcurrent: 3,
  connectionThreshold: "3g",
  idleTimeout: 2000,
};

class SmartPrefetcher {
  private prefetched: Set<string> = new Set();
  private prefetching: Set<string> = new Set();
  private queue: string[] = [];

  // Verifica se deve fazer prefetch (connection-aware)
  private shouldPrefetch(): boolean {
    if (!CONFIG.enabled) return false;

    // Check network connection
    const connection = (navigator as any).connection;
    if (connection) {
      // Save data mode
      if (connection.saveData) {
        logger.info("SmartPrefetcher", "Save data mode - skipping prefetch");
        return false;
      }

      // Check effective type
      const effectiveType = connection.effectiveType || "4g";
      if (effectiveType === "slow-2g" || effectiveType === "2g") {
        logger.info(
          "SmartPrefetcher",
          `Slow connection (${effectiveType}) - skipping prefetch`,
        );
        return false;
      }
    }

    return true;
  }

  // Prefetch URL
  private async prefetchUrl(url: string): Promise<void> {
    if (this.prefetched.has(url) || this.prefetching.has(url)) {
      return;
    }

    this.prefetching.add(url);
    performanceMonitor.mark(`prefetch-${url}-start`);

    try {
      const link = document.createElement("link");
      link.rel = "prefetch";
      link.as = "document";
      link.href = url;

      await new Promise<void>((resolve, reject) => {
        link.onload = () => {
          this.prefetched.add(url);
          this.prefetching.delete(url);
          performanceMonitor.mark(`prefetch-${url}-end`);
          logger.info("SmartPrefetcher", `Prefetched: ${url}`);
          resolve();
        };

        link.onerror = () => {
          this.prefetching.delete(url);
          logger.error("SmartPrefetcher", `Failed to prefetch: ${url}`);
          reject();
        };

        document.head.appendChild(link);
      });
    } catch (error) {
      this.prefetching.delete(url);
      logger.error("SmartPrefetcher", `Error prefetching ${url}: ${error}`);
    }
  }

  // Processa fila de prefetch
  private async processQueue(): Promise<void> {
    if (!this.shouldPrefetch()) return;

    while (
      this.queue.length > 0 &&
      this.prefetching.size < CONFIG.maxConcurrent
    ) {
      const url = this.queue.shift();
      if (url) {
        this.prefetchUrl(url).catch(() => {
          // Ignora erros individuais
        });
      }
    }
  }

  // Adiciona URL à fila
  public prefetch(url: string, priority: "high" | "low" = "low"): void {
    if (this.prefetched.has(url) || this.prefetching.has(url)) {
      return;
    }

    if (priority === "high") {
      this.queue.unshift(url);
    } else {
      this.queue.push(url);
    }

    this.processQueue();
  }

  // Prefetch em idle
  public prefetchOnIdle(url: string): void {
    if ("requestIdleCallback" in window) {
      requestIdleCallback(
        () => {
          this.prefetch(url);
        },
        { timeout: CONFIG.idleTimeout },
      );
    } else {
      setTimeout(() => {
        this.prefetch(url);
      }, CONFIG.idleTimeout);
    }
  }

  // Status
  public getStatus() {
    return {
      prefetched: Array.from(this.prefetched),
      prefetching: Array.from(this.prefetching),
      queued: this.queue.length,
    };
  }
}

export const prefetcher = new SmartPrefetcher();

// === SETUP FUNCTIONS ===

// Prefetch on hover (checkout page)
export const setupHoverPrefetch = () => {
  const checkoutLinks = document.querySelectorAll<HTMLAnchorElement>(
    'a[href*="/checkout"], a[href*="checkout"], .cta-button',
  );

  if (!checkoutLinks.length) {
    logger.info("setupHoverPrefetch", "No checkout links found");
    return;
  }

  logger.info(
    "setupHoverPrefetch",
    `Initialized for ${checkoutLinks.length} links`,
  );

  checkoutLinks.forEach((link) => {
    let timeout: number;

    link.addEventListener("mouseenter", () => {
      // Delay para evitar prefetch acidental
      timeout = window.setTimeout(() => {
        const href = link.getAttribute("href");
        if (href) {
          prefetcher.prefetch(href, "high");
        }
      }, 200);
    });

    link.addEventListener("mouseleave", () => {
      clearTimeout(timeout);
    });
  });
};

// Prefetch on scroll (quando usuário está engajado)
export const setupScrollPrefetch = () => {
  let scrollDepth = 0;
  const checkoutUrl = "/checkout"; // Ajustar conforme necessário

  const handleScroll = () => {
    const totalHeight =
      document.documentElement.scrollHeight - window.innerHeight;
    const currentScroll = window.scrollY;
    const newDepth = Math.round((currentScroll / totalHeight) * 100);

    // Prefetch aos 50% de scroll
    if (newDepth >= 50 && scrollDepth < 50) {
      logger.info(
        "setupScrollPrefetch",
        "50% scroll reached - prefetching checkout",
      );
      prefetcher.prefetchOnIdle(checkoutUrl);
    }

    // Prefetch aos 75% de scroll
    if (newDepth >= 75 && scrollDepth < 75) {
      logger.info(
        "setupScrollPrefetch",
        "75% scroll reached - prefetching checkout",
      );
      prefetcher.prefetch(checkoutUrl, "high");
    }

    scrollDepth = newDepth;
  };

  let ticking = false;
  window.addEventListener(
    "scroll",
    () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          handleScroll();
          ticking = false;
        });
        ticking = true;
      }
    },
    { passive: true },
  );

  logger.info("setupScrollPrefetch", "Initialized");
};

// Prefetch on exit intent
export const setupExitIntentPrefetch = () => {
  let prefetched = false;

  document.addEventListener("mouseleave", (e) => {
    if (!prefetched && e.clientY <= 0) {
      prefetched = true;
      logger.info(
        "setupExitIntentPrefetch",
        "Exit intent detected - prefetching",
      );
      prefetcher.prefetch("/checkout", "high");
    }
  });

  logger.info("setupExitIntentPrefetch", "Initialized");
};

// Prefetch on visibility change (usuário voltou para tab)
export const setupVisibilityPrefetch = () => {
  let wasHidden = false;

  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      wasHidden = true;
    } else if (wasHidden) {
      // Usuário voltou - provavelmente está interessado
      logger.info("setupVisibilityPrefetch", "Tab visible again - prefetching");
      prefetcher.prefetchOnIdle("/checkout");
      wasHidden = false;
    }
  });

  logger.info("setupVisibilityPrefetch", "Initialized");
};

// Setup all prefetch strategies
export const setupSmartPrefetch = () => {
  setupHoverPrefetch();
  setupScrollPrefetch();
  setupExitIntentPrefetch();
  setupVisibilityPrefetch();

  logger.info("setupSmartPrefetch", "All strategies initialized");
};

// Expõe globalmente para debug
if (typeof window !== "undefined") {
  (window as any).prefetcher = prefetcher;
}
