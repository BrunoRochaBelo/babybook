import { logger } from "./logger";
import { trackEvent } from "./analytics";

// === ERROR BOUNDARY GLOBAL ===
export const setupGlobalErrorHandling = () => {
  // Captura erros JavaScript
  window.addEventListener("error", (event) => {
    logger.error("Global error caught", {
      message: event.message,
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno,
      error: event.error,
    });

    // Track no analytics
    trackEvent({
      category: "Error",
      action: "JavaScript Error",
      label: `${event.message} at ${event.filename}:${event.lineno}`,
    });

    // Não previne comportamento padrão (permite que erro apareça no console)
    return false;
  });

  // Captura promises não tratadas
  window.addEventListener("unhandledrejection", (event) => {
    logger.error("Unhandled promise rejection", {
      reason: event.reason,
      promise: event.promise,
    });

    // Track no analytics
    trackEvent({
      category: "Error",
      action: "Promise Rejection",
      label: String(event.reason),
    });
  });

  logger.info("Global error handling initialized");
};

// === PERFORMANCE MONITORING ===
export const measureInit = (name: string, fn: () => void): void => {
  const start = performance.now();

  try {
    fn();
    const duration = performance.now() - start;

    logger.debug(`${name} initialized in ${duration.toFixed(2)}ms`);

    // Aviso se muito lento
    if (duration > 100) {
      logger.warn(`Slow initialization: ${name} took ${duration.toFixed(2)}ms`);
    }
  } catch (error) {
    logger.error(`Failed to initialize ${name}`, error);
    throw error;
  }
};
