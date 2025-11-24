// === IMAGE OPTIMIZER ===
// Responsive images, WebP/AVIF support, blur-up placeholder

import { logger } from "./logger";
import { observerPool } from "./observerPool";

interface ImageConfig {
  src: string;
  srcset?: string;
  sizes?: string;
  alt: string;
  loading?: "lazy" | "eager";
  decoding?: "async" | "sync" | "auto";
  fetchpriority?: "high" | "low" | "auto";
}

interface ResponsiveImageOptions {
  widths: number[];
  formats?: ("webp" | "avif" | "jpg" | "png")[];
  quality?: number;
  blur?: boolean;
}

class ImageOptimizer {
  private supportedFormats: Set<string> = new Set();

  constructor() {
    this.detectFormatSupport();
  }

  // Detecta formatos suportados pelo navegador
  private async detectFormatSupport(): Promise<void> {
    const formats = [
      {
        format: "webp",
        data: "data:image/webp;base64,UklGRiQAAABXRUJQVlA4IBgAAAAwAQCdASoBAAEAAwA0JaQAA3AA/vuUAAA=",
      },
      {
        format: "avif",
        data: "data:image/avif;base64,AAAAIGZ0eXBhdmlmAAAAAGF2aWZtaWYxbWlhZk1BMUIAAADybWV0YQAAAAAAAAAoaGRscgAAAAAAAAAAcGljdAAAAAAAAAAAAAAAAGxpYmF2aWYAAAAADnBpdG0AAAAAAAEAAAAeaWxvYwAAAABEAAABAAEAAAABAAABGgAAAB0AAAAoaWluZgAAAAAAAQAAABppbmZlAgAAAAABAABhdjAxQ29sb3IAAAAAamlwcnAAAABLaXBjbwAAABRpc3BlAAAAAAAAAAIAAAACAAAAEHBpeGkAAAAAAwgICAAAAAxhdjFDgQ0MAAAAABNjb2xybmNseAACAAIAAYAAAAAXaXBtYQAAAAAAAAABAAEEAQKDBAAAACVtZGF0EgAKCBgANogQEAwgMg8f8D///8WfhwB8+ErK42A=",
      },
    ];

    const checks = formats.map(async ({ format, data }) => {
      try {
        const img = new Image();
        const loaded = new Promise<boolean>((resolve) => {
          img.onload = () => resolve(true);
          img.onerror = () => resolve(false);
        });
        img.src = data;
        const supported = await loaded;
        if (supported) {
          this.supportedFormats.add(format);
        }
      } catch {
        // Format not supported
      }
    });

    await Promise.all(checks);
    logger.info(
      "ImageOptimizer",
      `Supported formats: ${Array.from(this.supportedFormats).join(", ")}`,
    );
  }

  // Verifica se formato é suportado
  public isFormatSupported(format: string): boolean {
    return this.supportedFormats.has(format);
  }

  // Gera srcset para imagem responsiva
  public generateSrcset(
    basePath: string,
    widths: number[],
    format: string = "jpg",
  ): string {
    return widths
      .map((width) => {
        const url = this.getImageUrl(basePath, width, format);
        return `${url} ${width}w`;
      })
      .join(", ");
  }

  // Gera URL de imagem com parâmetros
  private getImageUrl(basePath: string, width: number, format: string): string {
    // Remove extensão do basePath
    const pathWithoutExt = basePath.replace(/\.[^.]+$/, "");
    return `${pathWithoutExt}-${width}.${format}`;
  }

  // Gera elemento <picture> com múltiplos formatos
  public createPictureElement(
    basePath: string,
    options: ResponsiveImageOptions,
    config: ImageConfig,
  ): HTMLPictureElement {
    const picture = document.createElement("picture");
    const formats = options.formats || ["webp", "jpg"];
    const widths = options.widths;

    // Source elements para cada formato
    formats.forEach((format) => {
      if (format !== "jpg" && format !== "png") {
        // Só adiciona source se formato é suportado
        if (!this.isFormatSupported(format)) return;

        const source = document.createElement("source");
        source.type = `image/${format}`;
        source.srcset = this.generateSrcset(basePath, widths, format);
        if (config.sizes) {
          source.sizes = config.sizes;
        }
        picture.appendChild(source);
      }
    });

    // Fallback img
    const img = document.createElement("img");
    img.src = config.src;
    img.alt = config.alt;
    if (config.srcset) img.srcset = config.srcset;
    if (config.sizes) img.sizes = config.sizes;
    if (config.loading) img.loading = config.loading;
    if (config.decoding) img.decoding = config.decoding;
    if (config.fetchpriority)
      img.setAttribute("fetchpriority", config.fetchpriority);

    picture.appendChild(img);
    return picture;
  }

  // Blur-up placeholder
  public setupBlurUp(img: HTMLImageElement, placeholderSrc: string): void {
    const placeholder = new Image();
    placeholder.src = placeholderSrc;
    placeholder.className = "blur-placeholder";
    placeholder.style.cssText = `
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      object-fit: cover;
      filter: blur(10px);
      transform: scale(1.1);
      transition: opacity 0.3s ease;
    `;

    // Insere placeholder
    if (img.parentElement) {
      const wrapper = img.parentElement;
      wrapper.style.position = "relative";
      wrapper.insertBefore(placeholder, img);
    }

    // Remove placeholder quando imagem carregar
    img.addEventListener("load", () => {
      placeholder.style.opacity = "0";
      setTimeout(() => {
        placeholder.remove();
      }, 300);
    });
  }
}

export const imageOptimizer = new ImageOptimizer();

// === SETUP RESPONSIVE IMAGES ===
export const setupResponsiveImages = () => {
  const images = document.querySelectorAll<HTMLImageElement>(
    "img[data-responsive]",
  );

  if (!images.length) {
    logger.info("setupResponsiveImages", "No responsive images found");
    return;
  }

  logger.info("setupResponsiveImages", `Processing ${images.length} images`);

  images.forEach((img) => {
    const basePath = img.dataset.responsive;
    const widths = img.dataset.widths?.split(",").map(Number) || [
      320, 640, 768, 1024, 1280, 1920,
    ];
    const formats = (img.dataset.formats?.split(",") as (
      | "webp"
      | "avif"
      | "jpg"
      | "png"
    )[]) || ["webp", "jpg"];

    if (!basePath) return;

    // Gera srcset
    const srcset = imageOptimizer.generateSrcset(basePath, widths, "jpg");
    img.srcset = srcset;

    // Adiciona sources para outros formatos se possível
    if (formats.length > 1 && img.parentElement?.tagName !== "PICTURE") {
      const picture = imageOptimizer.createPictureElement(
        basePath,
        { widths, formats },
        {
          src: img.src,
          srcset: img.srcset,
          sizes: img.sizes,
          alt: img.alt,
          loading: img.loading as "lazy" | "eager",
        },
      );

      img.parentElement?.replaceChild(picture, img);
    }
  });
};

// === BLUR-UP PLACEHOLDER ===
export const setupBlurUpPlaceholders = () => {
  const images =
    document.querySelectorAll<HTMLImageElement>("img[data-blur-src]");

  if (!images.length) {
    logger.info("setupBlurUpPlaceholders", "No blur-up images found");
    return;
  }

  logger.info("setupBlurUpPlaceholders", `Processing ${images.length} images`);

  images.forEach((img) => {
    const placeholderSrc = img.dataset.blurSrc;
    if (placeholderSrc) {
      imageOptimizer.setupBlurUp(img, placeholderSrc);
    }
  });
};

// === LAZY LOAD IMAGES WITH FADE-IN ===
export const setupLazyImagesWithFadeIn = () => {
  const images = document.querySelectorAll<HTMLImageElement>(
    "img[loading='lazy']",
  );

  if (!images.length) {
    logger.info("setupLazyImagesWithFadeIn", "No lazy images found");
    return;
  }

  logger.info(
    "setupLazyImagesWithFadeIn",
    `Processing ${images.length} images`,
  );

  images.forEach((img) => {
    img.style.opacity = "0";
    img.style.transition = "opacity 0.3s ease";

    observerPool.observe(
      img,
      ([entry]) => {
        if (entry.isIntersecting) {
          img.addEventListener("load", () => {
            img.style.opacity = "1";
          });

          // Se já carregou
          if (img.complete) {
            img.style.opacity = "1";
          }
        }
      },
      { threshold: 0.1 },
    );
  });
};

// === PRIORITY IMAGES ===
export const setupPriorityImages = () => {
  const images = document.querySelectorAll<HTMLImageElement>(
    "img[data-priority='high']",
  );

  if (!images.length) {
    logger.info("setupPriorityImages", "No priority images found");
    return;
  }

  logger.info("setupPriorityImages", `Processing ${images.length} images`);

  images.forEach((img) => {
    img.loading = "eager";
    img.decoding = "async";
    img.setAttribute("fetchpriority", "high");
  });
};

// Expõe globalmente para debug
if (typeof window !== "undefined") {
  (window as any).imageOptimizer = imageOptimizer;
}
