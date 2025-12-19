import { Component, type ReactNode } from "react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  isAutoReloading: boolean;
}

/**
 * Detecta se o erro parece ser causado por HMR (Hot Module Replacement).
 * Esses erros ocorrem quando módulos são atualizados e referências ficam desatualizadas.
 */
function isHmrError(error: Error | null): boolean {
  if (!error) return false;
  
  const message = error.message.toLowerCase();
  const stack = error.stack?.toLowerCase() ?? "";
  
  // Padrões comuns de erros de HMR
  const hmrPatterns = [
    "cannot read properties of undefined",
    "cannot read properties of null",
    "is not a function",
    "is not defined",
    "failed to fetch dynamically imported module",
    "dynamically imported module",
    "unable to preload css",
    "loading chunk",
    "loading css chunk",
  ];
  
  return hmrPatterns.some(
    (pattern) => message.includes(pattern) || stack.includes(pattern)
  );
}

/**
 * Error Boundary para capturar erros de renderização React.
 * 
 * Em desenvolvimento:
 * - Erros de HMR causam auto-reload silencioso
 * - Outros erros mostram fallback amigável com botão de reload
 * 
 * Em produção:
 * - Mostra fallback amigável
 */
export class ErrorBoundary extends Component<Props, State> {
  private autoReloadTimeoutId: ReturnType<typeof setTimeout> | null = null;

  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null, isAutoReloading: false };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
    
    const isDev = import.meta.env.DEV;
    
    // Em desenvolvimento, SEMPRE fazer auto-reload silencioso
    // Isso resolve problemas de HMR, MSW não pronto, módulos desatualizados, etc.
    if (isDev) {
      console.info("[babybook] Erro detectado em desenvolvimento. Recarregando página automaticamente...");
      this.setState({ isAutoReloading: true });
      
      // Delay mínimo para mostrar feedback visual
      this.autoReloadTimeoutId = setTimeout(() => {
        this.performReload();
      }, 200);
    }
  }

  componentWillUnmount() {
    if (this.autoReloadTimeoutId) {
      clearTimeout(this.autoReloadTimeoutId);
    }
  }

  performReload = () => {
    // Limpa cache do service worker se existir
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.getRegistrations().then((registrations) => {
        registrations.forEach((registration) => registration.unregister());
      });
    }
    
    // Limpa caches
    if ("caches" in window) {
      caches.keys().then((names) => {
        names.forEach((name) => caches.delete(name));
      });
    }
    
    // Recarrega sem cache
    window.location.reload();
  };

  handleReload = () => {
    this.performReload();
  };

  handleRetry = () => {
    this.setState({ hasError: false, error: null, isAutoReloading: false });
  };

  render() {
    if (this.state.hasError) {
      // Auto-reloading: mostra apenas um indicador mínimo
      if (this.state.isAutoReloading) {
        return (
          <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
            <div className="text-center">
              <div className="inline-flex items-center gap-3 text-sm text-gray-600 dark:text-gray-300">
                <svg
                  className="w-5 h-5 animate-spin text-pink-500"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                <span>Atualizando...</span>
              </div>
            </div>
          </div>
        );
      }

      if (this.props.fallback) {
        return this.props.fallback;
      }

      const isDev = import.meta.env.DEV;

      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
          <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
              <svg
                className="w-8 h-8 text-red-600 dark:text-red-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </div>
            
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
              Ops! Algo deu errado
            </h2>
            
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              {isDev
                ? "Parece que houve um problema com o Hot Reload. Tente recarregar a página."
                : "Ocorreu um erro inesperado. Por favor, tente novamente."}
            </p>

            {isDev && this.state.error && (
              <details className="mb-4 text-left">
                <summary className="cursor-pointer text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200">
                  Ver detalhes do erro
                </summary>
                <pre className="mt-2 p-3 bg-gray-100 dark:bg-gray-900 rounded-lg text-xs text-red-600 dark:text-red-400 overflow-auto max-h-40">
                  {this.state.error.message}
                  {"\n\n"}
                  {this.state.error.stack}
                </pre>
              </details>
            )}

            <div className="flex gap-3 justify-center">
              <button
                onClick={this.handleRetry}
                className="px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                Tentar novamente
              </button>
              <button
                onClick={this.handleReload}
                className="px-4 py-2 rounded-lg bg-pink-500 text-white hover:bg-pink-600 transition-colors"
              >
                Recarregar página
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

