// === FEATURE FLAGS ===
// Sistema simples de feature flags para controle de funcionalidades

export interface FeatureFlags {
  // Core
  smoothScrolling: boolean;
  navigation: boolean;

  // Animations
  sectionScale: boolean;
  heroAnimations: boolean;
  parallax: boolean;
  chaosToOrder: boolean;
  horizontalScroll: boolean;

  // Interactive
  carousel: boolean;
  exitIntent: boolean;
  lazyImages: boolean;

  // PWA & Advanced
  pwa: boolean;
  serviceWorker: boolean;

  // Analytics & Monitoring
  analytics: boolean;
  performanceMonitoring: boolean;
  errorTracking: boolean;
  // CSS Critical inline extraction
  criticalCSS: boolean;

  // Debug
  debugMode: boolean;
}

// Flags padrão (produção)
const defaultFlags: FeatureFlags = {
  // Core
  smoothScrolling: true,
  navigation: true,

  // Animations
  sectionScale: true,
  heroAnimations: true,
  parallax: true,
  chaosToOrder: true,
  horizontalScroll: true,

  // Interactive
  carousel: true,
  exitIntent: true,
  lazyImages: true,

  // PWA & Advanced
  pwa: true,
  serviceWorker: true,

  // Analytics & Monitoring
  analytics: true,
  performanceMonitoring: true,
  errorTracking: true,
  criticalCSS: true,

  // Debug
  debugMode: false,
};

class FeatureFlagsManager {
  private flags: FeatureFlags;
  private overrides: Partial<FeatureFlags> = {};

  constructor() {
    this.flags = { ...defaultFlags };
    this.loadOverrides();
    this.applyUrlFlags();
  }

  // Carrega overrides do localStorage
  private loadOverrides(): void {
    try {
      const stored = localStorage.getItem("babybook_feature_flags");
      if (stored) {
        this.overrides = JSON.parse(stored);
        this.flags = { ...this.flags, ...this.overrides };
      }
    } catch (e) {
      console.warn("Failed to load feature flags from localStorage", e);
    }
  }

  // Permite flags via URL: ?flags=debugMode,analytics=false
  private applyUrlFlags(): void {
    const params = new URLSearchParams(window.location.search);
    const flagsParam = params.get("flags");

    if (flagsParam) {
      const flagPairs = flagsParam.split(",");
      flagPairs.forEach((pair) => {
        const [key, value] = pair.split("=");
        if (key in this.flags) {
          const flagKey = key as keyof FeatureFlags;
          this.flags[flagKey] = value === "false" ? false : true;
        }
      });
    }
  }

  // Verifica se feature está ativa
  isEnabled(feature: keyof FeatureFlags): boolean {
    return this.flags[feature];
  }

  // Ativa/desativa feature (salva no localStorage)
  setFlag(feature: keyof FeatureFlags, enabled: boolean): void {
    this.flags[feature] = enabled;
    this.overrides[feature] = enabled;

    try {
      localStorage.setItem(
        "babybook_feature_flags",
        JSON.stringify(this.overrides),
      );
    } catch (e) {
      console.warn("Failed to save feature flags", e);
    }
  }

  // Reseta todas as flags para padrão
  reset(): void {
    this.flags = { ...defaultFlags };
    this.overrides = {};
    try {
      localStorage.removeItem("babybook_feature_flags");
    } catch (e) {
      console.warn("Failed to reset feature flags", e);
    }
  }

  // Retorna todas as flags (para debug)
  getAll(): FeatureFlags {
    return { ...this.flags };
  }

  // Log das flags ativas (útil para debug)
  logStatus(): void {
    console.group("🚩 Feature Flags Status");
    Object.entries(this.flags).forEach(([key, value]) => {
      const icon = value ? "✅" : "❌";
      console.log(`${icon} ${key}: ${value}`);
    });
    console.groupEnd();
  }
}

export const featureFlags = new FeatureFlagsManager();

// Expõe globalmente para debug no console
if (typeof window !== "undefined") {
  (window as any).featureFlags = featureFlags;
}

// Helper para usar em código
export const isFeatureEnabled = (feature: keyof FeatureFlags): boolean => {
  return featureFlags.isEnabled(feature);
};
