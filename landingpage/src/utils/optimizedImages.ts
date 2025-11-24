/**
 * Optimized Image Imports
 *
 * Este módulo centraliza imports de imagens usando vite-imagetools
 * para gerar automaticamente versões WebP e AVIF otimizadas.
 *
 * vite-imagetools processa imagens com query strings especiais:
 * - ?format=avif;webp;jpg - Gera múltiplos formatos
 * - ?w=400;800;1200 - Gera múltiplos tamanhos
 * - ?quality=80 - Define qualidade de compressão
 *
 * O resultado é um objeto com srcset e sources para <picture> element.
 */

// Tipos para imagens processadas pelo vite-imagetools
export interface ImageOutput {
  src: string;
  width: number;
  height: number;
  format: string;
}

export interface PictureSource {
  srcset: string;
  type: string;
}

export interface OptimizedImage {
  sources: PictureSource[];
  img: {
    src: string;
    w: number;
    h: number;
  };
}

/**
 * Helper para criar elemento <picture> com sources otimizadas
 */
export function createPictureElement(
  image: OptimizedImage | ImageOutput[],
  alt: string,
  className = "",
  loading: "lazy" | "eager" = "lazy",
): HTMLPictureElement {
  const picture = document.createElement("picture");

  // Se é array de ImageOutput, organizar por formato
  if (Array.isArray(image)) {
    const byFormat = groupByFormat(image);

    // AVIF primeiro (melhor compressão)
    if (byFormat.avif) {
      const source = document.createElement("source");
      source.type = "image/avif";
      source.srcset = byFormat.avif
        .map((img) => `${img.src} ${img.width}w`)
        .join(", ");
      picture.appendChild(source);
    }

    // WebP como fallback
    if (byFormat.webp) {
      const source = document.createElement("source");
      source.type = "image/webp";
      source.srcset = byFormat.webp
        .map((img) => `${img.src} ${img.width}w`)
        .join(", ");
      picture.appendChild(source);
    }

    // JPEG/PNG como fallback final
    const fallbackFormats = ["jpg", "jpeg", "png"];
    for (const fmt of fallbackFormats) {
      if (byFormat[fmt]) {
        const source = document.createElement("source");
        source.type = `image/${fmt}`;
        source.srcset = byFormat[fmt]
          .map((img) => `${img.src} ${img.width}w`)
          .join(", ");
        picture.appendChild(source);
      }
    }

    // Fallback img
    const img = document.createElement("img");
    const fallback =
      image.find(
        (i) => i.format === "jpg" || i.format === "jpeg" || i.format === "png",
      ) || image[0];
    img.src = fallback.src;
    img.alt = alt;
    img.className = className;
    img.loading = loading;
    img.width = fallback.width;
    img.height = fallback.height;
    picture.appendChild(img);
  } else {
    // OptimizedImage já processado
    image.sources.forEach((source) => {
      const sourceEl = document.createElement("source");
      sourceEl.srcset = source.srcset;
      sourceEl.type = source.type;
      picture.appendChild(sourceEl);
    });

    const img = document.createElement("img");
    img.src = image.img.src;
    img.alt = alt;
    img.className = className;
    img.loading = loading;
    img.width = image.img.w;
    img.height = image.img.h;
    picture.appendChild(img);
  }

  return picture;
}

function groupByFormat(images: ImageOutput[]): Record<string, ImageOutput[]> {
  return images.reduce(
    (acc, img) => {
      if (!acc[img.format]) {
        acc[img.format] = [];
      }
      acc[img.format].push(img);
      return acc;
    },
    {} as Record<string, ImageOutput[]>,
  );
}

/**
 * Helper para lazy loading de imagens otimizadas
 */
export function setupOptimizedLazyImages() {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const picture = entry.target as HTMLPictureElement;
          const sources = picture.querySelectorAll("source[data-srcset]");
          const img = picture.querySelector(
            "img[data-src]",
          ) as HTMLImageElement;

          sources.forEach((source) => {
            const srcset = source.getAttribute("data-srcset");
            if (srcset) {
              source.setAttribute("srcset", srcset);
              source.removeAttribute("data-srcset");
            }
          });

          if (img && img.dataset.src) {
            img.src = img.dataset.src;
            delete img.dataset.src;
            img.classList.remove("loading");
          }

          observer.unobserve(picture);
        }
      });
    },
    { rootMargin: "50px" },
  );

  document.querySelectorAll("picture[data-lazy]").forEach((picture) => {
    observer.observe(picture);
  });
}

// Para imagens externas (Unsplash, etc), manter URL original
// mas adicionar parâmetros de otimização do serviço
export function getOptimizedExternalUrl(
  url: string,
  width?: number,
  quality = 80,
): string {
  try {
    const urlObj = new URL(url);

    // Unsplash
    if (urlObj.hostname.includes("unsplash.com")) {
      urlObj.searchParams.set("auto", "format");
      urlObj.searchParams.set("fit", "crop");
      if (width) urlObj.searchParams.set("w", width.toString());
      urlObj.searchParams.set("q", quality.toString());
      return urlObj.toString();
    }

    return url;
  } catch {
    return url;
  }
}
