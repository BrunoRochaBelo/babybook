// === LOGGER & ERROR HANDLING ===

type LogLevel = "info" | "warn" | "error" | "debug";

class Logger {
  private isDev: boolean;

  constructor() {
    this.isDev =
      window.location.hostname === "localhost" ||
      window.location.hostname === "127.0.0.1";
  }

  private log(level: LogLevel, message: string, data?: any) {
    if (!this.isDev && level === "debug") return;

    const emoji = {
      info: "ℹ️",
      warn: "⚠️",
      error: "❌",
      debug: "🔍",
    };

    const style = {
      info: "color: #3b82f6",
      warn: "color: #f59e0b",
      error: "color: #ef4444",
      debug: "color: #8b5cf6",
    };

    if (data) {
      console[level === "error" ? "error" : "log"](
        `%c${emoji[level]} [Landing] ${message}`,
        style[level],
        data,
      );
    } else {
      console[level === "error" ? "error" : "log"](
        `%c${emoji[level]} [Landing] ${message}`,
        style[level],
      );
    }
  }

  info(message: string, data?: any) {
    this.log("info", message, data);
  }

  warn(message: string, data?: any) {
    this.log("warn", message, data);
  }

  error(message: string, error?: any) {
    this.log("error", message, error);
  }

  debug(message: string, data?: any) {
    this.log("debug", message, data);
  }
}

export const logger = new Logger();

// Error Handler wrapper para features
// Registry for disposers returned by initializers
const __disposers: Array<() => void> = [];

// Error Handler wrapper para features
export const safeInit = (
  name: string,
  initFn: () => void | Promise<any> | (() => void) | null | undefined,
  required: boolean = false,
): void => {
  try {
    const ret = initFn();
    if (typeof ret === "function") {
      __disposers.push(ret as () => void);
    } else if (ret && typeof (ret as Promise<any>).then === "function") {
      (ret as Promise<any>)
        .then((resolved) => {
          if (typeof resolved === "function") {
            __disposers.push(resolved as () => void);
          }
        })
        .catch((err) => {
          logger.error(`Failed to initialize ${name}`, err);
          if (required) throw err;
        });
    }
    logger.debug(`✓ ${name} initialized`);
  } catch (error) {
    logger.error(`Failed to initialize ${name}`, error);
    if (required) {
      throw error;
    }
  }
};

// Unmount all registered disposers (reverse order)
export const unmountAll = () => {
  while (__disposers.length) {
    const fn = __disposers.pop();
    try {
      fn && fn();
    } catch (err) {
      logger.warn("unmountAll", `disposer threw: ${err}`);
    }
  }
};

// Verificar se elemento existe antes de operar
export const withElement = <T>(
  selector: string,
  callback: (element: HTMLElement) => T,
  errorMsg?: string,
): T | null => {
  const element = document.querySelector<HTMLElement>(selector);
  if (!element) {
    if (errorMsg) {
      logger.warn(errorMsg);
    }
    return null;
  }
  return callback(element);
};

// Verificar múltiplos elementos
export const withElements = <T>(
  selector: string,
  callback: (elements: NodeListOf<HTMLElement>) => T,
  minRequired: number = 1,
): T | null => {
  const elements = document.querySelectorAll<HTMLElement>(selector);
  if (elements.length < minRequired) {
    logger.debug(
      `Expected at least ${minRequired} elements for "${selector}", found ${elements.length}`,
    );
    return null;
  }
  return callback(elements);
};
