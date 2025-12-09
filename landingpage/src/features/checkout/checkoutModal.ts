/**
 * Checkout Modal - Fluxo completo de compra
 *
 * Suporta 3 modos:
 * 1. Compra Direta (para si)
 * 2. Resgate de Voucher (fotógrafo ou presente)
 * 3. Comprar para Presentear
 */

import { setupPaymentForm } from "./paymentForm";
import { setupVoucherRedemption } from "./voucherRedemption";
import { setupGiftPurchase } from "./giftPurchase";
// Analytics helper - wrapper para trackEvent
function track(action: string, data?: Record<string, unknown>): void {
  if (
    typeof window !== "undefined" &&
    window.location.hostname === "localhost"
  ) {
    console.log("📊 Checkout Event:", action, data);
  }
  // Integrar com analytics real quando disponível
}

type CheckoutMode = "select" | "direct" | "voucher" | "gift";

interface CheckoutState {
  mode: CheckoutMode;
  isOpen: boolean;
  step: number;
}

let state: CheckoutState = {
  mode: "select",
  isOpen: false,
  step: 1,
};

let modalElement: HTMLElement | null = null;
let cleanupFunctions: Array<() => void> = [];

/**
 * Template do Modal de Checkout
 */
function createModalTemplate(): string {
  return `
    <div id="checkout-modal" class="checkout-modal fixed inset-0 z-[9999] hidden" role="dialog" aria-modal="true" aria-labelledby="checkout-title">
      <!-- Backdrop -->
      <div class="checkout-backdrop fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300 opacity-0" data-checkout-close></div>
      
      <!-- Modal Container -->
      <div class="checkout-container fixed inset-0 flex items-center justify-center p-4 pointer-events-none">
        <div class="checkout-panel bg-white rounded-3xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-hidden pointer-events-auto transform transition-all duration-300 scale-95 opacity-0">
          
          <!-- Header -->
          <div class="checkout-header relative bg-gradient-to-br from-indigo-600 to-indigo-700 text-white p-6 pb-8">
            <button 
              type="button" 
              class="absolute top-4 right-4 w-10 h-10 flex items-center justify-center rounded-full bg-white/20 hover:bg-white/30 transition-colors"
              data-checkout-close
              aria-label="Fechar"
            >
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
              </svg>
            </button>
            
            <div class="checkout-header-content">
              <h2 id="checkout-title" class="font-serif text-2xl font-bold mb-1">Começar nossa história</h2>
              <p class="text-indigo-200 text-sm">Escolha como você quer continuar</p>
            </div>
            
            <!-- Progress Steps (hidden on select mode) -->
            <div class="checkout-progress hidden mt-6">
              <div class="flex items-center justify-center gap-2">
                <div class="checkout-step-dot w-2.5 h-2.5 rounded-full bg-white" data-step="1"></div>
                <div class="checkout-step-line w-8 h-0.5 bg-white/30"></div>
                <div class="checkout-step-dot w-2.5 h-2.5 rounded-full bg-white/30" data-step="2"></div>
                <div class="checkout-step-line w-8 h-0.5 bg-white/30"></div>
                <div class="checkout-step-dot w-2.5 h-2.5 rounded-full bg-white/30" data-step="3"></div>
              </div>
            </div>
          </div>
          
          <!-- Content -->
          <div class="checkout-content p-6 overflow-y-auto" style="max-height: calc(90vh - 200px);">
            
            <!-- Mode Selection (default view) -->
            <div class="checkout-mode-select" data-checkout-view="select">
              <div class="space-y-4">
                
                <!-- Option: Compra Direta -->
                <button 
                  type="button"
                  class="checkout-option group w-full p-5 rounded-2xl border-2 border-gray-200 hover:border-indigo-500 hover:bg-indigo-50/50 transition-all text-left"
                  data-checkout-mode="direct"
                >
                  <div class="flex items-start gap-4">
                    <div class="w-12 h-12 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                      <svg class="w-6 h-6 text-indigo-600 group-hover:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"/>
                      </svg>
                    </div>
                    <div class="flex-1">
                      <h3 class="font-bold text-gray-900 mb-1">Quero para mim</h3>
                      <p class="text-sm text-gray-600 mb-2">Compre agora e comece a criar a história do seu filho</p>
                      <div class="flex items-center gap-2">
                        <span class="text-lg font-bold text-indigo-600">R$ 297</span>
                        <span class="text-xs text-gray-500">ou R$ 279 no PIX</span>
                      </div>
                    </div>
                    <svg class="w-5 h-5 text-gray-400 group-hover:text-indigo-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
                    </svg>
                  </div>
                </button>
                
                <!-- Option: Resgate de Voucher -->
                <button 
                  type="button"
                  class="checkout-option group w-full p-5 rounded-2xl border-2 border-gray-200 hover:border-emerald-500 hover:bg-emerald-50/50 transition-all text-left"
                  data-checkout-mode="voucher"
                >
                  <div class="flex items-start gap-4">
                    <div class="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center flex-shrink-0 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                      <svg class="w-6 h-6 text-emerald-600 group-hover:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z"/>
                      </svg>
                    </div>
                    <div class="flex-1">
                      <h3 class="font-bold text-gray-900 mb-1">Tenho um código</h3>
                      <p class="text-sm text-gray-600">Recebi um voucher do fotógrafo ou de presente</p>
                    </div>
                    <svg class="w-5 h-5 text-gray-400 group-hover:text-emerald-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
                    </svg>
                  </div>
                </button>
                
                <!-- Option: Presentear -->
                <button 
                  type="button"
                  class="checkout-option group w-full p-5 rounded-2xl border-2 border-gray-200 hover:border-rose-500 hover:bg-rose-50/50 transition-all text-left"
                  data-checkout-mode="gift"
                >
                  <div class="flex items-start gap-4">
                    <div class="w-12 h-12 rounded-xl bg-rose-100 flex items-center justify-center flex-shrink-0 group-hover:bg-rose-600 group-hover:text-white transition-colors">
                      <svg class="w-6 h-6 text-rose-600 group-hover:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7"/>
                      </svg>
                    </div>
                    <div class="flex-1">
                      <h3 class="font-bold text-gray-900 mb-1">Quero presentear</h3>
                      <p class="text-sm text-gray-600 mb-2">Dê o presente que vira legado para outra família</p>
                      <div class="flex items-center gap-2">
                        <span class="text-lg font-bold text-rose-600">R$ 297</span>
                        <span class="text-xs text-gray-500">ou R$ 279 no PIX</span>
                      </div>
                    </div>
                    <svg class="w-5 h-5 text-gray-400 group-hover:text-rose-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
                    </svg>
                  </div>
                </button>
                
              </div>
              
              <!-- Trust badges -->
              <div class="mt-8 pt-6 border-t border-gray-100">
                <div class="flex items-center justify-center gap-6 text-xs text-gray-500">
                  <div class="flex items-center gap-1.5">
                    <svg class="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/>
                    </svg>
                    <span>Compra segura</span>
                  </div>
                  <div class="flex items-center gap-1.5">
                    <svg class="w-4 h-4 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
                    </svg>
                    <span>Acesso vitalício</span>
                  </div>
                  <div class="flex items-center gap-1.5">
                    <svg class="w-4 h-4 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"/>
                    </svg>
                    <span>Feito com amor</span>
                  </div>
                </div>
              </div>
            </div>
            
            <!-- Direct Purchase View -->
            <div class="checkout-direct hidden" data-checkout-view="direct">
              <!-- Content injected by paymentForm.ts -->
            </div>
            
            <!-- Voucher Redemption View -->
            <div class="checkout-voucher hidden" data-checkout-view="voucher">
              <!-- Content injected by voucherRedemption.ts -->
            </div>
            
            <!-- Gift Purchase View -->
            <div class="checkout-gift hidden" data-checkout-view="gift">
              <!-- Content injected by giftPurchase.ts -->
            </div>
            
          </div>
        </div>
      </div>
    </div>
  `;
}

/**
 * Abre o modal de checkout
 */
export function openCheckoutModal(initialMode: CheckoutMode = "select"): void {
  if (!modalElement) {
    document.body.insertAdjacentHTML("beforeend", createModalTemplate());
    modalElement = document.getElementById("checkout-modal");
    setupModalListeners();
  }

  state.mode = initialMode;
  state.isOpen = true;
  state.step = 1;

  if (modalElement) {
    modalElement.classList.remove("hidden");
    document.body.style.overflow = "hidden";

    // Animate in
    requestAnimationFrame(() => {
      const backdrop = modalElement!.querySelector(".checkout-backdrop");
      const panel = modalElement!.querySelector(".checkout-panel");
      backdrop?.classList.add("opacity-100");
      panel?.classList.remove("scale-95", "opacity-0");
      panel?.classList.add("scale-100", "opacity-100");
    });

    // Show correct view
    switchView(initialMode);

    // Track
    track("checkout_opened", { mode: initialMode });
  }
}

/**
 * Fecha o modal de checkout
 */
export function closeCheckoutModal(): void {
  if (!modalElement) return;

  const backdrop = modalElement.querySelector(".checkout-backdrop");
  const panel = modalElement.querySelector(".checkout-panel");

  backdrop?.classList.remove("opacity-100");
  panel?.classList.remove("scale-100", "opacity-100");
  panel?.classList.add("scale-95", "opacity-0");

  setTimeout(() => {
    modalElement?.classList.add("hidden");
    document.body.style.overflow = "";
    state.isOpen = false;

    // Reset to select view
    switchView("select");
  }, 300);

  track("checkout_closed", { mode: state.mode, step: state.step });
}

/**
 * Alterna entre as views do checkout
 */
function switchView(mode: CheckoutMode): void {
  if (!modalElement) return;

  state.mode = mode;

  // Hide all views
  const views = modalElement.querySelectorAll("[data-checkout-view]");
  views.forEach((view) => {
    view.classList.add("hidden");
  });

  // Show target view
  const targetView = modalElement.querySelector(
    `[data-checkout-view="${mode}"]`,
  );
  targetView?.classList.remove("hidden");

  // Update header
  updateHeader(mode);

  // Initialize view if needed
  initializeView(mode);

  // Show/hide progress
  const progress = modalElement.querySelector(".checkout-progress");
  if (mode === "select") {
    progress?.classList.add("hidden");
  } else {
    progress?.classList.remove("hidden");
    updateProgress(1);
  }

  track("checkout_view_changed", { mode });
}

/**
 * Atualiza o header baseado no modo
 */
function updateHeader(mode: CheckoutMode): void {
  const title = modalElement?.querySelector("#checkout-title");
  const subtitle = modalElement?.querySelector(".checkout-header-content p");

  const headers: Record<CheckoutMode, { title: string; subtitle: string }> = {
    select: {
      title: "Começar nossa história",
      subtitle: "Escolha como você quer continuar",
    },
    direct: {
      title: "Garantir meu acesso",
      subtitle: "Complete sua compra em poucos passos",
    },
    voucher: {
      title: "Resgatar meu código",
      subtitle: "Ative seu acesso com o voucher recebido",
    },
    gift: {
      title: "Presentear com carinho",
      subtitle: "Dê o presente que vira memória eterna",
    },
  };

  if (title) title.textContent = headers[mode].title;
  if (subtitle) subtitle.textContent = headers[mode].subtitle;
}

/**
 * Inicializa a view específica
 */
function initializeView(mode: CheckoutMode): void {
  // Cleanup previous
  cleanupFunctions.forEach((fn) => fn());
  cleanupFunctions = [];

  const container = modalElement?.querySelector(
    `[data-checkout-view="${mode}"]`,
  );
  if (!container) return;

  switch (mode) {
    case "direct":
      const paymentCleanup = setupPaymentForm(container as HTMLElement, {
        onSuccess: handlePurchaseSuccess,
        onBack: () => switchView("select"),
        onStepChange: updateProgress,
      });
      cleanupFunctions.push(paymentCleanup);
      break;

    case "voucher":
      const voucherCleanup = setupVoucherRedemption(container as HTMLElement, {
        onSuccess: handleVoucherSuccess,
        onBack: () => switchView("select"),
        onStepChange: updateProgress,
      });
      cleanupFunctions.push(voucherCleanup);
      break;

    case "gift":
      const giftCleanup = setupGiftPurchase(container as HTMLElement, {
        onSuccess: handleGiftSuccess,
        onBack: () => switchView("select"),
        onStepChange: updateProgress,
      });
      cleanupFunctions.push(giftCleanup);
      break;
  }
}

/**
 * Atualiza indicadores de progresso
 */
function updateProgress(step: number): void {
  state.step = step;

  const dots = modalElement?.querySelectorAll(".checkout-step-dot");
  const lines = modalElement?.querySelectorAll(".checkout-step-line");

  dots?.forEach((dot, index) => {
    if (index + 1 <= step) {
      dot.classList.remove("bg-white/30");
      dot.classList.add("bg-white");
    } else {
      dot.classList.remove("bg-white");
      dot.classList.add("bg-white/30");
    }
  });

  lines?.forEach((line, index) => {
    if (index + 1 < step) {
      line.classList.remove("bg-white/30");
      line.classList.add("bg-white");
    } else {
      line.classList.remove("bg-white");
      line.classList.add("bg-white/30");
    }
  });
}

/**
 * Handlers de sucesso
 */
function handlePurchaseSuccess(data: { email: string; orderId: string }): void {
  track("purchase_completed", { type: "direct", orderId: data.orderId });
  showSuccessAndRedirect(data.email, "Compra realizada com sucesso!");
}

function handleVoucherSuccess(data: {
  email: string;
  voucherCode: string;
}): void {
  track("voucher_redeemed", { code: data.voucherCode });
  showSuccessAndRedirect(data.email, "Código resgatado com sucesso!");
}

function handleGiftSuccess(data: {
  email: string;
  recipientEmail: string;
  orderId: string;
}): void {
  track("gift_purchased", { orderId: data.orderId });
  showGiftSuccess(data);
}

/**
 * Mostra sucesso e redireciona para o app
 */
function showSuccessAndRedirect(email: string, message: string): void {
  const content = modalElement?.querySelector(".checkout-content");
  if (!content) return;

  content.innerHTML = `
    <div class="text-center py-8">
      <div class="w-20 h-20 mx-auto mb-6 bg-green-100 rounded-full flex items-center justify-center">
        <svg class="w-10 h-10 text-green-600 animate-bounce" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
        </svg>
      </div>
      <h3 class="text-2xl font-bold text-gray-900 mb-2">${message}</h3>
      <p class="text-gray-600 mb-8">Enviamos um link de acesso para<br><strong>${email}</strong></p>
      <a 
        href="/app" 
        class="inline-flex items-center justify-center w-full py-4 px-6 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-colors"
      >
        Começar agora
        <svg class="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7l5 5m0 0l-5 5m5-5H6"/>
        </svg>
      </a>
    </div>
  `;
}

/**
 * Mostra sucesso de presente
 */
function showGiftSuccess(data: {
  email: string;
  recipientEmail: string;
  orderId: string;
}): void {
  const content = modalElement?.querySelector(".checkout-content");
  if (!content) return;

  content.innerHTML = `
    <div class="text-center py-8">
      <div class="w-20 h-20 mx-auto mb-6 bg-rose-100 rounded-full flex items-center justify-center">
        <svg class="w-10 h-10 text-rose-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7"/>
        </svg>
      </div>
      <h3 class="text-2xl font-bold text-gray-900 mb-2">Presente enviado! 🎉</h3>
      <p class="text-gray-600 mb-4">
        O código de resgate foi enviado para<br>
        <strong class="text-rose-600">${data.recipientEmail}</strong>
      </p>
      <p class="text-sm text-gray-500 mb-8">
        Uma cópia do comprovante foi enviada para ${data.email}
      </p>
      <div class="space-y-3">
        <button 
          type="button"
          class="w-full py-3 px-6 bg-rose-600 text-white rounded-xl font-bold hover:bg-rose-700 transition-colors"
          onclick="navigator.share ? navigator.share({title: 'Baby Book', text: 'Te presenteei com um Baby Book!', url: window.location.origin}) : null"
        >
          Compartilhar com ${data.recipientEmail.split("@")[0]}
        </button>
        <button 
          type="button"
          class="w-full py-3 px-6 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200 transition-colors"
          data-checkout-close
        >
          Fechar
        </button>
      </div>
    </div>
  `;

  // Re-attach close listener
  content
    .querySelector("[data-checkout-close]")
    ?.addEventListener("click", closeCheckoutModal);
}

/**
 * Configura listeners do modal
 */
function setupModalListeners(): void {
  if (!modalElement) return;

  // Close buttons
  modalElement.querySelectorAll("[data-checkout-close]").forEach((btn) => {
    btn.addEventListener("click", closeCheckoutModal);
  });

  // Mode selection
  modalElement.querySelectorAll("[data-checkout-mode]").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      const mode = (e.currentTarget as HTMLElement).dataset
        .checkoutMode as CheckoutMode;
      switchView(mode);
    });
  });

  // Escape key
  document.addEventListener("keydown", handleEscape);
}

function handleEscape(e: KeyboardEvent): void {
  if (e.key === "Escape" && state.isOpen) {
    closeCheckoutModal();
  }
}

/**
 * Setup inicial - conecta CTAs ao modal
 */
export function setupCheckoutTriggers(): () => void {
  // Botões de compra direta
  const buyButtons = document.querySelectorAll(".cta-primary:not([data-gift])");
  buyButtons.forEach((btn) => {
    if (
      btn.getAttribute("href")?.includes("#pricing") ||
      btn.closest("#pricing")
    ) {
      btn.addEventListener("click", (e) => {
        e.preventDefault();
        openCheckoutModal("select");
      });
    }
  });

  // Botões de presentear (incluindo data-checkout-gift)
  const giftButtons = document.querySelectorAll(
    ".cta-secondary, [data-gift], [data-checkout-gift]",
  );
  giftButtons.forEach((btn) => {
    if (
      btn.textContent?.includes("Presentear") ||
      btn.getAttribute("data-gift") ||
      btn.getAttribute("data-checkout-gift") !== null
    ) {
      btn.addEventListener("click", (e) => {
        e.preventDefault();
        openCheckoutModal("gift");
      });
    }
  });

  // Botões de voucher (incluindo data-checkout-voucher)
  const voucherButtons = document.querySelectorAll("[data-checkout-voucher]");
  voucherButtons.forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      openCheckoutModal("voucher");
    });
  });

  // Botão principal da seção de preço
  const pricingCta = document.querySelector("#pricing .cta-primary");
  if (pricingCta) {
    pricingCta.addEventListener("click", (e) => {
      e.preventDefault();
      openCheckoutModal("select");
    });
  }

  // Botão com ID específico na seção de preço
  const pricingCtaById = document.querySelector("#pricing-cta-btn");
  if (pricingCtaById) {
    pricingCtaById.addEventListener("click", (e) => {
      e.preventDefault();
      openCheckoutModal("select");
    });
  }

  return () => {
    document.removeEventListener("keydown", handleEscape);
    cleanupFunctions.forEach((fn) => fn());
  };
}

export function mountCheckout(): () => void {
  return setupCheckoutTriggers();
}
