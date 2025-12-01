# Landing Page - Estrutura do Projeto

## 📁 Estrutura de Diretórios

```
src/
├── core/                    # Funcionalidades principais
│   ├── navigation.ts        # Navegação e menu
│   ├── pwa.ts              # PWA e Service Worker
│   └── scroll.ts           # Smooth scroll e scroll progress
│
├── features/               # Funcionalidades específicas
│   ├── animations/         # Todas as animações
│   │   ├── hero.ts        # Animações do hero (collapse, hover, tilt)
│   │   ├── scroll-effects.ts  # Chaos, horizontal scroll, timeline
│   │   └── sections.ts    # Scale, parallax, observers
│   │
│   └── interactive/       # Componentes interativos
│       ├── accordion.ts   # FAQ accordion
│       ├── buttons.ts     # Loading states e lazy loading
│       ├── carousel.ts    # Carrossel de depoimentos
│       └── modals.ts      # Exit intent popup
│
├── styles/                # Arquivos CSS
│   ├── main.css          # Estilos principais
│   ├── refinements.css   # Refinamentos visuais
│   └── titles-visible.css # Utilitários de títulos
│
├── utils/                 # Utilitários
│   ├── analytics.ts      # Sistema de tracking e analytics
│   ├── config.ts         # Configuração centralizada
│   ├── criticalCSS.ts    # Critical CSS extraction e inline
│   ├── errorBoundary.ts  # Error handling global
│   ├── featureFlags.ts   # Sistema de feature flags
│   ├── helpers.ts        # Funções auxiliares
│   ├── imageOptimizer.ts # Image optimization (WebP/AVIF, responsive)
│   ├── lazyLoader.ts     # Lazy loading de módulos/imagens
│   ├── logger.ts         # Sistema de logging estruturado
│   ├── observerPool.ts   # Pool de Intersection Observers
│   ├── performance.ts    # Web Vitals e performance monitoring
│   ├── performanceBudget.ts # Performance budget monitoring
│   ├── prefetch.ts       # Smart prefetch com múltiplas estratégias
│   ├── resourceHints.ts  # DNS prefetch, preconnect, preload
│   └── types.ts          # TypeScript types
│
└── main.ts               # Ponto de entrada principal
```

## 🎯 Organização do Código

### Core (`/core`)

Funcionalidades essenciais do sistema:

- **navigation.ts**: Controla o comportamento do menu (hide/show no scroll)
- **pwa.ts**: Gerencia PWA, Service Worker e prompt de instalação
- **scroll.ts**: Smooth scrolling (Lenis) e barra de progresso
- **styles/**: Módulos que aplicam classes de CSS modules dinamicamente para seções (hero, pricing, faq etc.). São carregados via lazy loading ao invés de sobrescrever o CSS global.

### Features (`/features`)

#### Animations (`/features/animations`)

Todos os efeitos visuais e animações:

- **hero.ts**: Animações específicas do hero (collapse, pointer glow, hover magnético, tilt de cards)
- **scroll-effects.ts**: Efeitos acionados por scroll (chaos to order, horizontal scroll, timeline draw)
- **sections.ts**: Animações de seções (scale progressivo, parallax, observers)

#### Interactive (`/features/interactive`)

Componentes com interação do usuário:

- **accordion.ts**: FAQ com expand/collapse
- **buttons.ts**: Loading states em CTAs e lazy loading de imagens
- **carousel.ts**: Carrossel mobile de depoimentos com autoplay
- **modals.ts**: Exit intent popup estratégico

### Styles (`/styles`)

Todos os arquivos CSS organizados:

- **main.css**: Estilos base, hero, seções, componentes
- **refinements.css**: Melhorias tipográficas e micro-interações
- **titles-visible.css**: Força títulos a serem sempre visíveis
- **pricing.module.css**: Pricing-specific styles (CSS Module, lazy loaded)
- **future-parallax.module.css**: Future-parallax styles (CSS Module, lazy loaded)

### Utils (`/utils`)

Funções utilitárias reutilizáveis:

- **analytics.ts**: Sistema de tracking (eventos, scroll depth, visualizações)
- **config.ts**: Configuração centralizada (todos os magic numbers)
- **errorBoundary.ts**: Error handling global com performance measurement
- **featureFlags.ts**: Sistema de feature flags com persistência
- **helpers.ts**: Funções auxiliares (prefersReducedMotion, easing, throttle)
- **lazyLoader.ts**: Lazy loading de módulos, imagens e componentes
- **logger.ts**: Sistema de logging estruturado com helpers (safeInit, withElement)
- **observerPool.ts**: Pool reutilizável de Intersection Observers
- **performance.ts**: Web Vitals (LCP, FID, CLS, TTI) e performance monitoring
- **prefetch.ts**: Smart prefetch (hover, scroll, exit intent, visibility) connection-aware
- **resourceHints.ts**: Resource hints (DNS prefetch, preconnect, preload)
- **types.ts**: Definições de tipos TypeScript

## 🚀 Melhorias Implementadas

### Fase 1: Modularização e Estrutura

- ✅ Código dividido em 14 módulos focados
- ✅ Separação clara: core/, features/, styles/, utils/
- ✅ Removido código não utilizado e dependências desnecessárias
- 📄 [Ver detalhes](./IMPROVEMENTS.md)

### Fase 2: Padrões e Qualidade

- ✅ CONFIG centralizado para todos os magic numbers
- ✅ Logger estruturado com helpers (safeInit, withElement)
- ✅ Error boundary global com tracking
- ✅ Web Vitals monitoring (LCP, FID, CLS, TTI)
- ✅ TypeScript types system
- 📄 [Ver detalhes](./REFACTORING_PHASE2.md)

### Fase 3: Features Avançadas

- ✅ Feature flags system (15+ flags configuráveis)
- ✅ Intersection Observer pool (reutilização eficiente)
- ✅ Lazy loading de módulos/imagens/componentes
- ✅ Animations refatoradas com novos padrões
- ✅ Performance marks em operações críticas
- 📄 [Ver detalhes](./REFACTORING_PHASE3.md)

### Fase 4: Advanced Performance

- ✅ Service Worker com múltiplas cache strategies
- ✅ Smart prefetch (hover, scroll, exit intent, visibility)
- ✅ Resource hints (DNS prefetch, preconnect, preload)
- ✅ Connection-aware prefetching (respeita saveData, 2G)
- ✅ Cache management automático com limites por tipo
- 📄 [Ver detalhes](./REFACTORING_PHASE4.md)

### Fase 5: Image Optimization, Critical CSS & Performance Budget

- ✅ Image optimizer (WebP/AVIF support, responsive images)
- ✅ Blur-up placeholders para lazy loading progressivo
- ✅ Priority images (above-the-fold sem lazy)
- ✅ Critical CSS extraction e inline automático
- ✅ Performance budget monitoring com relatórios
- ✅ Lazy images com fade-in suave
- 📄 [Ver detalhes](./REFACTORING_PHASE5.md)

### Fase 6: Code Splitting, Tree Shaking & Bundle Analysis

- ✅ Code splitting em 6 chunks estratégicos (vendor, core, utils, features, advanced, index)

### CSS Modules & Lazy Loading

- As seções heavy (hero, pricing, future-parallax, faq, book cards, carrossel e board) foram movidas para CSS Modules, cada uma com um _binding_ em runtime localizado em `src/core/styles/`.
- Esses módulos são carregados dinamicamente apenas quando os elementos estão próximos da viewport, reduzindo o CSS inicial e mantendo o design responsivo sem duplicar arquivos.
- A estrutura atual concentra todo o mapeamento em `src/core/styles`, eliminando os arquivos duplicados que antes viviam na raiz de `src/core`.

Novos arquivos / comportamentos:

- `src/styles/hero.module.css` + `src/core/styles/heroStyles.ts` — hero e partículas carregam o binding lazily.
- `src/styles/pricing.module.css` + `src/core/styles/pricingStyles.ts` — pricing styles são aplicados quando `.pricing-shell` torna-se visível.
- `src/styles/future-parallax.module.css` + `src/core/styles/futureParallaxStyles.ts` — ativado sob demanda via feature flag `parallax`.
- `src/styles/faq.module.css` + `src/core/styles/faqStyles.ts` — FAQ recebe classes específicas quando o bloco entra na viewport.
- `src/styles/book.module.css`, `carousel.module.css`, `board.module.css` são associados a `src/core/styles/{book,carousel,board}Styles.ts`, que aplicam classes CSS Modules aos elementos existentes.

Para desenvolvedores:

- Use `lazyLoader.register("pricingStyles", loader)` and `lazyInitComponent(selector, initializer)` for new lazy-loaded modules.
- Add dynamic class names to `postcss.config.js` safelist if you add classes applied only via JS.

Regenerating icons and splash screens

- A helper script is available to re-generate icons/splash screens: `pnpm --filter @babybook/landingpage run generate:icons`.
- Use `pnpm --filter @babybook/landingpage run generate:images` to create WebP/AVIF variants in `public/images/` for static assets.
- To inline critical CSS during CI or local builds, use `pnpm --filter @babybook/landingpage run build:critical`. This runs the usual build and generates optimized images & icons. Critical CSS is automatically inlined during build via `vite-plugin-critters` with **zero duplication** (pruneSource removes inlined CSS from main bundle).

## Image Optimization Strategy

### Automatic Format Generation (vite-imagetools)

- **Local images** in `src/assets/images/` are automatically processed to generate AVIF, WebP, and JPG variants via `vite-imagetools`
- Import images with query params for custom optimization: `import img from './photo.jpg?format=avif;webp&w=400;800;1200'`
- Default configuration generates AVIF (best compression), WebP (good support), and JPG (universal fallback)
- Use `<picture>` elements with multiple `<source>` tags for optimal format selection by browser

### External Images (CDN/Unsplash)

- External images use native CDN optimization (e.g., Unsplash's `?fm=avif`, `?fm=webp`)
- `<picture>` elements provide AVIF → WebP → JPG fallback chain
- Helper utilities in `src/utils/optimizedImages.ts` for programmatic image handling

### Static Assets Script

- Run `pnpm generate:images` to batch-convert images in `public/images/` to WebP/AVIF
- Useful for marketing/hero images that don't need dynamic sizing

## Additional Performance Notes

- **CSS Modules & lazy loading**: Several heavy sections (hero, pricing, future-parallax, faq, book, carousel, board) were migrated to CSS Modules and are lazy-loaded on intersection or via the lazy loader to reduce initial CSS payload.
- **Critical CSS (zero duplication)**: `vite-plugin-critters` inlines critical CSS and removes it from the main bundle via `pruneSource: true`, eliminating duplication and reducing CSS payload.
- **PurgeCSS**: Enabled in production via PostCSS with safelist for dynamic classes. Update `postcss.config.js` if you add runtime-applied classes.
- **Service Worker & PWA**: The app uses `VitePWA` with injectManifest and a custom `src/sw.ts`. An offline fallback (`public/offline.html`) is pre-cached. The service worker shows update prompts when a new version is available and emits analytics events.
  It will produce `icon-192.png`, `icon-512.png`, `apple-touch-icon.png` and several `apple-splash-<w>x<h>.png` variants in `public/`.
- ✅ Tree shaking agressivo (sideEffects + Terser minification)
- ✅ Bundle visualizer (treemap/sunburst/network)
- ✅ Bundle size monitoring automatizado
- ✅ CI/CD integration (fail on budget violations)
- ✅ Initial load reduzido em 88.8% (19.23 kB → 2.16 kB)
- 📄 [Ver detalhes](./REFACTORING_PHASE6.md)

## 📝 Como Usar

### Adicionar Nova Animação

1. Crie arquivo em `features/animations/`
2. Exporte função de setup
3. Importe e chame no `main.ts`

### Adicionar Novo Componente Interativo

1. Crie arquivo em `features/interactive/`
2. Exporte função de setup
3. Importe e chame no `main.ts`

### Adicionar Novo Tracking

1. Adicione função em `utils/analytics.ts`
2. Use `trackEvent()` onde necessário

## 🔧 Build e Deploy

```bash
# Desenvolvimento
pnpm dev

# Build de produção
pnpm build

# Build + Bundle Analysis
pnpm build:analyze

# Build + Bundle Size Report
pnpm build:monitor

# Build + CI/CD (fail on violations)
pnpm build:ci

# Preview do build
pnpm preview
```

## 📦 Dependências

- **lenis**: Smooth scrolling
- **@babybook/config**: Design tokens e configurações

## 🎨 Design Tokens

Importados de `@babybook/config` para consistência com o resto do projeto.

## 🔄 Fluxo de Inicialização

```typescript
1. Resource Hints (DNS prefetch, preconnect) - MUITO CEDO
2. Performance Monitoring - Imediato (se habilitado)
3. Error Boundary - Imediato (se habilitado)
4. Feature Flags - Log em debug mode
5. Smooth Scrolling (Lenis) - Se habilitado
6. DOMContentLoaded:
   ├── Core Features (scroll progress, navigation)
   ├── Lazy Images (antes de animações)
   ├── Animations (sections, hero, scroll effects) - Com feature flags
   ├── Interactive Components (buttons, carousel, accordion)
   ├── Analytics (tracking) - Se habilitado
   └── Lazy Modules:
       ├── Exit Intent (carrega após 5s)
       ├── PWA (carrega após 3s)
       └── Smart Prefetch (idle, max 5s)
```

## 🛡️ Boas Práticas

- ✅ Respeita `prefers-reduced-motion`
- ✅ Usa `requestAnimationFrame` para animações
- ✅ Lazy loading de recursos (módulos, imagens, componentes)
- ✅ Intersection Observer pool (reutilização eficiente)
- ✅ Event listeners com `{ passive: true }` quando apropriado
- ✅ Throttling em scroll handlers com helper reutilizável
- ✅ Feature flags para controle granular
- ✅ Error boundary global com tracking
- ✅ Performance monitoring com Web Vitals
- ✅ Logger estruturado para debugging
- ✅ CONFIG centralizado (zero magic numbers)

## 🧩 Padrão mount / dispose (Componentização de Recursos)

Este projeto adota o padrão mount/dispose para garantir que todos os recursos (event listeners, observers, requestAnimationFrame, intervals, nodes DOM criados, etc.) sejam limpos corretamente quando um componente é desmontado ou a página é navegada. Isso evita memory leaks e ajuda nas estratégias de lazy-loading e gerenciamento de ciclo de vida.

Princípios:

- Cada feature que cria efeitos colaterais no DOM deve exportar uma função `setupX()` ou `initX()` que retorna uma função de limpeza (disposer), ou `null` se a feature não for aplicada/executável.
- Crie uma camada de montagem `mountX()` na pasta `src/components` que chame `setupX()` e retorne o disposer. As camadas de montagem são chamadas pelo `main.ts` via `safeInit()`.
- `safeInit(name, () => mountX())` garante que, se a função retornar um disposer, ele será registrado globalmente e executado durante `unmountAll()` (chamado em `pagehide`/`beforeunload`).

Exemplo mínimo:

```ts
// src/features/interactive/example.ts
export const setupExample = () => {
  const el = document.querySelector(".example");
  if (!el) return null;

  const onClick = () => {
    /* ... */
  };
  el.addEventListener("click", onClick);

  return () => {
    el.removeEventListener("click", onClick);
  };
};

// src/components/exampleComponent.ts
import { setupExample } from "../features/interactive/example";

export const mountExample = () => setupExample();

// src/main.ts
safeInit("Example feature", () => mountExample());
```

Boas práticas:

- Use `withElement()` e `withElements()` do `logger` para verificar presença antes de operar no DOM.
- Prefira adicionar um único listener global (ex: `document`) quando a lógica exige e use uma versão nomeada do handler para facilitar a remoção no cleanup.
- Sempre remova observers (IntersectionObserver, PerformanceObserver), `requestAnimationFrame` loops, `setInterval`, `setTimeout` e listeners; use `cancelAnimationFrame`, `clearInterval` e `clearTimeout` quando aplicável.
- Se o setup modifica o DOM (ex.: `innerHTML`), guarde o `innerHTML` anterior e restaure-o no cleanup (para evitar alterações persistentes quando o componente é desmontado).
- Use `safeInit` em `main.ts` para registrar disposers automaticamente e garantir que `unmountAll` irá limpar recursos (ex.: `pagehide`/`beforeunload`).

## 🎛️ Feature Flags

```javascript
// Console do navegador
featureFlags.logStatus();
featureFlags.setFlag('parallax', false);

// URL parameters
?flags=debugMode
?flags=parallax=false,analytics=false

// LocalStorage (persiste entre sessões)
```

**Flags disponíveis:**

- Core: `smoothScrolling`, `navigation`
- Animations: `sectionScale`, `heroAnimations`, `parallax`, `chaosToOrder`, `horizontalScroll`
- Interactive: `carousel`, `exitIntent`, `lazyImages`
- PWA: `pwa`, `serviceWorker`
- Monitoring: `analytics`, `performanceMonitoring`, `errorTracking`
- Debug: `debugMode`

## 📊 Performance

### Build Output

```
Build time: 1.76s

JavaScript (7 chunks):
  vendor.js    17.62 kB → 4.97 kB gzip  (Lenis)
  advanced.js  15.74 kB → 5.59 kB gzip  (Optimization features)
  features.js  13.86 kB → 4.13 kB gzip  (Animations & interactions)
  utils.js      5.21 kB → 2.22 kB gzip  (Shared utilities)
  core.js       4.27 kB → 1.83 kB gzip  (Core functionality)
  index.js      4.88 kB → 2.16 kB gzip  (Entry point) ⚡
  modals.js     2.43 kB → 1.18 kB gzip  (Lazy loaded)

CSS:
  index.css    58.89 kB → 12.78 kB gzip
```

**Initial Load:** 2.16 kB JS + 12.78 kB CSS = **14.94 kB** 🚀  
**Total JS gzipped:** 20.88 kB (6 chunks + modals)  
**Improvement:** -88.8% initial load vs Phase 5

### Otimizações

- ⚡ **Service Worker:** 5 caches especializados com strategies diferentes
- ⚡ **Smart Prefetch:** 4 estratégias (hover, scroll, exit intent, visibility)
- ⚡ **Resource Hints:** DNS prefetch, preconnect, preload
- ⚡ **Connection-Aware:** Respeita saveData e conexão 2G
- ⚡ **Code splitting:** Automático (modals, lazy modules)
- ⚡ **Lazy loading:** Módulos pesados, imagens, componentes
- ⚡ **Observer pool:** Reduz uso de memória
- ⚡ **Performance marks:** Todas as operações críticas
- ⚡ **Web Vitals:** LCP, FID, CLS, TTI tracking
- 🖼️ **Image Optimization:** WebP/AVIF, responsive images, blur-up placeholders
- 🎨 **Critical CSS:** Inline critical, defer non-critical
- 📊 **Performance Budget:** Automated monitoring e relatórios

### Cache Strategies (Service Worker)

- **HTML:** Network First (sempre versão mais recente)
- **Fonts:** Cache First (instant load após primeira visita)
- **Images:** Stale While Revalidate (rápido + atualizado)
- **CSS/JS:** Stale While Revalidate (rápido + atualizado)
- **Videos:** Network Only (muito pesado para cache)

## 📚 Referências

- [Lenis Documentation](https://github.com/studio-freight/lenis)
- [Intersection Observer API](https://developer.mozilla.org/en-US/docs/Web/API/Intersection_Observer_API)
- [PWA Best Practices](https://web.dev/pwa/)
