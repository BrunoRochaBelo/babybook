/**
 * Image Usage Examples - vite-imagetools Integration
 *
 * Este arquivo demonstra como importar e usar imagens otimizadas
 * com vite-imagetools no projeto.
 */

// ============================================================================
// EXEMPLO 1: Import simples com formatos múltiplos (padrão configurado)
// ============================================================================

// O vite.config.ts está configurado para gerar automaticamente AVIF, WebP e JPG
// quando você importa uma imagem sem query params específicos

// import heroImage from './assets/images/hero.jpg';
// Resultado: { avif: [...], webp: [...], jpg: [...] }

// ============================================================================
// EXEMPLO 2: Responsive images com múltiplos tamanhos
// ============================================================================

// Gerar 3 tamanhos diferentes (mobile, tablet, desktop)
// import productImage from './assets/images/product.jpg?w=400;800;1200&format=avif;webp;jpg';
// Resultado: Array de objetos { src, width, height, format }

// ============================================================================
// EXEMPLO 3: Imagem única com formato específico
// ============================================================================

// Para casos onde você precisa apenas de um formato específico
// import thumbnailAvif from './assets/images/thumb.jpg?format=avif&w=200&quality=75';
// import thumbnailWebp from './assets/images/thumb.jpg?format=webp&w=200&quality=80';

// ============================================================================
// EXEMPLO 4: Uso em TypeScript com type hints
// ============================================================================

/**
 * Para TypeScript, declare tipos globais para imports de imagem:
 *
 * // vite-env.d.ts ou types/images.d.ts
 * declare module '*.jpg?*' {
 *   const value: Array<{ src: string; width: number; height: number; format: string }>;
 *   export default value;
 * }
 */

// ============================================================================
// EXEMPLO 5: Criando elemento <picture> programaticamente
// ============================================================================

/*
import heroImages from './assets/images/hero.jpg?w=400;800;1200&format=avif;webp;jpg';
import { createPictureElement } from './utils/optimizedImages';

// Cria <picture> com todas as sources otimizadas
const picture = createPictureElement(
  heroImages,
  'Hero image',
  'w-full h-auto',
  'eager' // loading strategy
);

// Adiciona ao DOM
document.querySelector('.hero-container')?.appendChild(picture);
*/

// ============================================================================
// EXEMPLO 6: HTML direto com <picture> (abordagem manual)
// ============================================================================

/**
 * No HTML, use a seguinte estrutura para imagens otimizadas:
 *
 * <picture>
 *   <!-- AVIF: melhor compressão (70% menor que JPG) -->
 *   <source type="image/avif"
 *           srcset="/assets/hero-400.avif 400w,
 *                   /assets/hero-800.avif 800w,
 *                   /assets/hero-1200.avif 1200w"
 *           sizes="(max-width: 640px) 400px,
 *                  (max-width: 1024px) 800px,
 *                  1200px">
 *
 *   <!-- WebP: boa compressão (30% menor que JPG) -->
 *   <source type="image/webp"
 *           srcset="/assets/hero-400.webp 400w,
 *                   /assets/hero-800.webp 800w,
 *                   /assets/hero-1200.webp 1200w"
 *           sizes="(max-width: 640px) 400px,
 *                  (max-width: 1024px) 800px,
 *                  1200px">
 *
 *   <!-- JPG: fallback universal -->
 *   <img src="/assets/hero-800.jpg"
 *        srcset="/assets/hero-400.jpg 400w,
 *                /assets/hero-800.jpg 800w,
 *                /assets/hero-1200.jpg 1200w"
 *        sizes="(max-width: 640px) 400px,
 *               (max-width: 1024px) 800px,
 *               1200px"
 *        alt="Hero image"
 *        loading="lazy"
 *        class="w-full h-auto">
 * </picture>
 */

// ============================================================================
// EXEMPLO 7: Imagens externas (CDN, Unsplash)
// ============================================================================

/*
import { getOptimizedExternalUrl } from './utils/optimizedImages';

// Para imagens de CDNs externos, use os parâmetros do serviço
const unsplashAvif = getOptimizedExternalUrl(
  'https://images.unsplash.com/photo-123?auto=format',
  800,  // width
  80    // quality
);

// Resultado: URL com &fm=avif&w=800&q=80 adicionado

// Use em <picture>:
<picture>
  <source type="image/avif" srcset="${unsplashUrl}&fm=avif">
  <source type="image/webp" srcset="${unsplashUrl}&fm=webp">
  <img src="${unsplashUrl}" alt="...">
</picture>
*/

// ============================================================================
// BOAS PRÁTICAS
// ============================================================================

/**
 * 1. FORMATOS: Sempre forneça AVIF → WebP → JPG (nesta ordem)
 *    - AVIF: ~70% menor que JPG, suporte crescente
 *    - WebP: ~30% menor que JPG, suporte universal moderno
 *    - JPG: fallback para navegadores antigos
 *
 * 2. TAMANHOS: Gere 3-4 breakpoints principais
 *    - Mobile: 400-640px
 *    - Tablet: 768-1024px
 *    - Desktop: 1200-1920px
 *    - Retina: 2x dos valores acima (opcional)
 *
 * 3. LAZY LOADING:
 *    - Use loading="lazy" para imagens below-the-fold
 *    - Use loading="eager" apenas para hero/LCP images
 *    - Adicione placeholder/blur-up para melhor UX
 *
 * 4. PERFORMANCE:
 *    - Priorize AVIF quando possível (economiza ~70% bandwidth)
 *    - Use quality=80 para AVIF, quality=85 para WebP
 *    - Sempre forneça width/height para evitar layout shift
 *
 * 5. ACESSIBILIDADE:
 *    - Sempre inclua alt text descritivo
 *    - Use alt="" para imagens decorativas
 *    - Mantenha descrições concisas mas informativas
 */

export {};
