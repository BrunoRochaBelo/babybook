/**
 * useKeyboardShortcuts Hook
 *
 * Hook para gerenciar atalhos de teclado globais no Portal do Parceiro.
 * Permite navegação rápida e ações comuns via teclado.
 */

import { useEffect, useCallback, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";

/**
 * Hook para atalhos de teclado do Portal do Parceiro.
 *
 * Atalhos disponíveis:
 * - N: Nova entrega
 * - /: Focar na busca (se existir)
 * - G + D: Ir para Dashboard
 * - G + E: Ir para Entregas
 * - G + C: Ir para Créditos
 * - G + S: Ir para Configurações
 * - Escape: Fechar modais/overlays
 */
export function usePartnerKeyboardShortcuts() {
  const navigate = useNavigate();
  const location = useLocation();

  // Verifica se estamos no portal do parceiro
  const isInPartnerPortal = location.pathname.startsWith("/partner");

  // Armazena a última tecla para combos (G + X)
  const lastKeyRef = useRef("");
  const lastKeyTimeRef = useRef(0);

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      // Ignorar se não estiver no portal do parceiro
      if (!isInPartnerPortal) return;

      // Ignorar se estiver em input, textarea ou contenteditable
      const target = event.target as HTMLElement;
      if (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable
      ) {
        // Apenas permite Escape em inputs
        if (event.key !== "Escape") return;
      }

      const key = event.key.toLowerCase();
      const now = Date.now();

      // Combos G + X (se G foi pressionado há menos de 500ms)
      if (lastKeyRef.current === "g" && now - lastKeyTimeRef.current < 500) {
        event.preventDefault();
        switch (key) {
          case "d":
            navigate("/partner");
            break;
          case "e":
            navigate("/partner/deliveries");
            break;
          case "c":
            navigate("/partner/credits");
            break;
          case "s":
            navigate("/partner/settings");
            break;
          case "n":
            navigate("/partner/notifications");
            break;
        }
        lastKeyRef.current = "";
        return;
      }

      // Armazena a tecla para combos
      if (key === "g") {
        lastKeyRef.current = "g";
        lastKeyTimeRef.current = now;
        return;
      }

      // Atalhos simples
      switch (key) {
        case "n":
          // N = Nova entrega (só funciona em páginas específicas)
          if (
            location.pathname === "/partner" ||
            location.pathname === "/partner/deliveries"
          ) {
            event.preventDefault();
            navigate("/partner/deliveries/new");
          }
          break;

        case "/": {
          // / = Focar na busca
          event.preventDefault();
          const searchInput = document.querySelector(
            '[data-search-input="true"]',
          ) as HTMLInputElement | null;
          if (searchInput) {
            searchInput.focus();
          }
          break;
        }

        case "escape":
          // Escape = Blur do input atual
          if (document.activeElement instanceof HTMLElement) {
            document.activeElement.blur();
          }
          break;
      }

      lastKeyRef.current = key;
      lastKeyTimeRef.current = now;
    },
    [isInPartnerPortal, navigate, location.pathname],
  );

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  // Retorna lista de atalhos para documentação/help
  return {
    shortcuts: [
      { key: "N", description: "Nova entrega" },
      { key: "/", description: "Focar na busca" },
      { key: "G D", description: "Ir para Dashboard" },
      { key: "G E", description: "Ir para Entregas" },
      { key: "G C", description: "Ir para Créditos" },
      { key: "G S", description: "Ir para Configurações" },
      { key: "Esc", description: "Fechar/Limpar foco" },
    ] as const,
  };
}

export default usePartnerKeyboardShortcuts;
