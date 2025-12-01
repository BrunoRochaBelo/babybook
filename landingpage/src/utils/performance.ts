import { logger } from "./logger";
import { trackEvent } from "./analytics";

// === WEB VITALS & PERFORMANCE MARKS ===

interface PerformanceMark {
  name: string;
  timestamp: number;
}

class PerformanceMonitor {
  private marks: Map<string, PerformanceMark> = new Map();
  private metrics: {
    lcp?: number;
    fid?: number;
    cls?: number;
    ttfb?: number;
    tti?: number;
  } = {};
  private isDev: boolean;

  constructor() {
    this.isDev =
      window.location.hostname === "localhost" ||
      window.location.hostname === "127.0.0.1";
  }

  // Armazena métrica manualmente (por exemplo, a partir de observers)
  setMetric(name: string, value: number) {
    (this.metrics as any)[name] = value;
  }

  // Marca início de uma operação
  mark(name: string): void {
    if (performance.mark) {
      performance.mark(name);
    }
    this.marks.set(name, {
      name,
      timestamp: performance.now(),
    });
  }

  // Mede tempo entre duas marcas
  measure(name: string, startMark: string, endMark?: string): number {
    const start = this.marks.get(startMark);
    if (!start) {
      logger.warn(`Performance mark "${startMark}" not found`);
      return 0;
    }

    const endTime = endMark
      ? this.marks.get(endMark)?.timestamp || performance.now()
      : performance.now();

    const duration = endTime - start.timestamp;

    if (performance.measure) {
      try {
        performance.measure(name, startMark, endMark);
      } catch (e) {
        // Silently fail se marca não existir
      }
    }

    if (this.isDev) {
      logger.debug(`⏱️ ${name}: ${duration.toFixed(2)}ms`);
    }

    return duration;
  }

  // Reporta métrica importante
  report(metricName: string, value: number, unit: string = "ms"): void {
    logger.info(`📊 ${metricName}: ${value.toFixed(2)}${unit}`);

    // Envia para analytics
    trackEvent({
      category: "Performance",
      action: metricName,
      value: Math.round(value),
    });
  }

  // Limpa todas as marcas
  clear(): void {
    this.marks.clear();
    if (performance.clearMarks) {
      performance.clearMarks();
    }
    if (performance.clearMeasures) {
      performance.clearMeasures();
    }
  }

  // Retorna métricas coletadas (para performance budget)
  getMetrics(): {
    lcp?: { value: number };
    fid?: { value: number };
    cls?: { value: number };
    ttfb?: number;
    tti?: number;
  } {
    const metrics: any = {};

    // LCP
    const lcpEntry = performance.getEntriesByType(
      "largest-contentful-paint",
    )[0] as any;
    if (lcpEntry) {
      metrics.lcp = { value: lcpEntry.startTime };
    }

    // TTFB
    const navEntry = performance.getEntriesByType(
      "navigation",
    )[0] as PerformanceNavigationTiming;
    if (navEntry) {
      metrics.ttfb = navEntry.responseStart - navEntry.requestStart;
    }

    // TTI - aproximado
    if (navEntry) {
      metrics.tti = navEntry.domInteractive;
    }

    // Preferences: prefer live metrics collected by observers
    if (this.metrics.lcp) metrics.lcp = { value: this.metrics.lcp };
    if (this.metrics.fid) metrics.fid = { value: this.metrics.fid };
    if (this.metrics.cls) metrics.cls = { value: this.metrics.cls };
    if (this.metrics.ttfb) metrics.ttfb = this.metrics.ttfb;
    if (this.metrics.tti) metrics.tti = this.metrics.tti;

    return metrics;
  }
}

export const performanceMonitor = new PerformanceMonitor();

// === WEB VITALS BÁSICOS ===

// Largest Contentful Paint (LCP)
export const measureLCP = (): (() => void) | null => {
  if (!("PerformanceObserver" in window)) return null;

  try {
    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const lastEntry = entries[entries.length - 1];

      if (lastEntry) {
        const lcp = lastEntry.startTime;
        performanceMonitor.report("LCP", lcp);
        // Persist value for budgets
        performanceMonitor.setMetric("lcp", lcp);

        // Classificação
        if (lcp <= 2500) {
          logger.info("✅ LCP: Good");
        } else if (lcp <= 4000) {
          logger.warn("⚠️ LCP: Needs Improvement");
        } else {
          logger.error("❌ LCP: Poor");
        }
      }
    });

    observer.observe({ type: "largest-contentful-paint", buffered: true });

    return () => {
      try {
        observer.disconnect();
      } catch (err) {
        logger.warn("Failed to disconnect LCP observer", err);
      }
    };
  } catch (e) {
    logger.debug("LCP measurement not available");
    return null;
  }
};

// First Input Delay (FID)
export const measureFID = (): (() => void) | null => {
  if (!("PerformanceObserver" in window)) return null;

  try {
    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      entries.forEach((entry: any) => {
        const fid = entry.processingStart - entry.startTime;
        performanceMonitor.report("FID", fid);
        performanceMonitor.setMetric("fid", fid);

        if (fid <= 100) {
          logger.info("✅ FID: Good");
        } else if (fid <= 300) {
          logger.warn("⚠️ FID: Needs Improvement");
        } else {
          logger.error("❌ FID: Poor");
        }
      });
    });

    observer.observe({ type: "first-input", buffered: true });

    return () => {
      try {
        observer.disconnect();
      } catch (err) {
        logger.warn("Failed to disconnect FID observer", err);
      }
    };
  } catch (e) {
    logger.debug("FID measurement not available");
    return null;
  }
};

// Cumulative Layout Shift (CLS)
export const measureCLS = (): (() => void) | null => {
  if (!("PerformanceObserver" in window)) return null;

  let clsScore = 0;

  try {
    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      entries.forEach((entry: any) => {
        if (!entry.hadRecentInput) {
          clsScore += entry.value;
        }
      });
    });

    observer.observe({ type: "layout-shift", buffered: true });

    const onVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        performanceMonitor.report("CLS", clsScore, "");
        performanceMonitor.setMetric("cls", clsScore);

        if (clsScore <= 0.1) {
          logger.info("✅ CLS: Good");
        } else if (clsScore <= 0.25) {
          logger.warn("⚠️ CLS: Needs Improvement");
        } else {
          logger.error("❌ CLS: Poor");
        }
      }
    };

    window.addEventListener("visibilitychange", onVisibilityChange);

    return () => {
      try {
        observer.disconnect();
        window.removeEventListener("visibilitychange", onVisibilityChange);
      } catch (err) {
        logger.warn("Failed to cleanup CLS observer", err);
      }
    };
  } catch (e) {
    logger.debug("CLS measurement not available");
    return null;
  }
};

// Time to Interactive (aproximado)
export const measureTTI = (): (() => void) | null => {
  const onLoad = () => {
    setTimeout(() => {
      const tti = performance.now();
      performanceMonitor.report("TTI (approx)", tti);
      performanceMonitor.setMetric("tti", tti);

      if (tti <= 3800) {
        logger.info("✅ TTI: Good");
      } else if (tti <= 7300) {
        logger.warn("⚠️ TTI: Needs Improvement");
      } else {
        logger.error("❌ TTI: Poor");
      }
    }, 0);
  };

  window.addEventListener("load", onLoad);

  return () => {
    try {
      window.removeEventListener("load", onLoad);
    } catch (err) {
      logger.warn("Failed to cleanup TTI onload listener", err);
    }
  };
};

// === INICIALIZAÇÃO ===
export const setupPerformanceMonitoring = (): (() => void) | null => {
  // Marca o início
  performanceMonitor.mark("app-start");

  // Mede tempo de DOMContentLoaded
  const onDomReady = () => {
    const duration = performanceMonitor.measure("dom-ready", "app-start");
    performanceMonitor.report("DOM Ready", duration);
  };
  document.addEventListener("DOMContentLoaded", onDomReady);

  // Mede tempo total de carregamento
  const onWindowLoad = () => {
    const duration = performanceMonitor.measure("page-load", "app-start");
    performanceMonitor.report("Page Load", duration);
  };
  window.addEventListener("load", onWindowLoad);

  // Web Vitals
  const d1 = measureLCP();
  const d2 = measureFID();
  const d3 = measureCLS();
  const d4 = measureTTI();

  logger.info("Performance monitoring initialized");

  // Return disposer to cleanup event listeners & observers
  return () => {
    try {
      document.removeEventListener("DOMContentLoaded", onDomReady);
      window.removeEventListener("load", onWindowLoad);
      d1 && typeof d1 === "function" && d1();
      d2 && typeof d2 === "function" && d2();
      d3 && typeof d3 === "function" && d3();
      d4 && typeof d4 === "function" && d4();
    } catch (err) {
      logger.warn("Failed to cleanup performance monitoring", err);
    }
  };
};
