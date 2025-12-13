/**
 * Payment Form - Formulário de pagamento direto
 *
 * Suporta:
 * - Cartão de crédito (R$297)
 * - PIX (R$279 - desconto)
 */

import {
  sanitizeName,
  sanitizeEmail,
  sanitizeCardNumber,
  sanitizeCvv,
  isValidEmail,
  checkRateLimit,
  clearRateLimit,
  logSecurityEvent,
} from "./security";

// Analytics helper
function track(action: string, data?: Record<string, unknown>): void {
  if (
    typeof window !== "undefined" &&
    window.location.hostname === "localhost"
  ) {
    console.log("💳 Payment Event:", action, data);
  }
}

interface PaymentFormOptions {
  onSuccess: (data: { email: string; orderId: string }) => void;
  onBack: () => void;
  onStepChange: (step: number) => void;
}

type PaymentMethod = "card" | "pix";

interface PaymentState {
  method: PaymentMethod;
  email: string;
  name: string;
  loading: boolean;
}

const PRICES = {
  card: 297,
  pix: 279,
};

export function setupPaymentForm(
  container: HTMLElement,
  options: PaymentFormOptions,
): () => void {
  const state: PaymentState = {
    method: "pix",
    email: "",
    name: "",
    loading: false,
  };

  // Render form
  container.innerHTML = createPaymentFormTemplate();

  // Get elements
  const form = container.querySelector("#payment-form") as HTMLFormElement;
  const methodButtons = container.querySelectorAll("[data-payment-method]");
  const backButton = container.querySelector("[data-back]");
  const submitButton = container.querySelector(
    "[data-submit]",
  ) as HTMLButtonElement;
  const cardFields = container.querySelector(".card-fields");
  const pixInfo = container.querySelector(".pix-info");
  const priceDisplay = container.querySelector(".price-display");
  const emailInput = container.querySelector(
    "#payment-email",
  ) as HTMLInputElement;
  const nameInput = container.querySelector(
    "#payment-name",
  ) as HTMLInputElement;

  // Method selection
  function updateMethod(method: PaymentMethod): void {
    state.method = method;

    methodButtons.forEach((btn) => {
      const btnMethod = btn.getAttribute("data-payment-method");
      if (btnMethod === method) {
        btn.classList.add("border-indigo-500", "bg-indigo-50");
        btn.classList.remove("border-gray-200");
      } else {
        btn.classList.remove("border-indigo-500", "bg-indigo-50");
        btn.classList.add("border-gray-200");
      }
    });

    // Show/hide card fields
    if (method === "card") {
      cardFields?.classList.remove("hidden");
      pixInfo?.classList.add("hidden");
    } else {
      cardFields?.classList.add("hidden");
      pixInfo?.classList.remove("hidden");
    }

    // Update price
    if (priceDisplay) {
      priceDisplay.textContent = `R$ ${PRICES[method]}`;
    }

    // Update button text
    if (submitButton) {
      submitButton.querySelector(".btn-text")!.textContent =
        method === "pix" ? "Gerar código PIX" : "Pagar com cartão";
    }

    track("payment_method_selected", { method });
  }

  // Validate form
  function validateForm(): boolean {
    const email = emailInput?.value.trim();
    const name = nameInput?.value.trim();

    if (!email || !isValidEmail(email)) {
      showError(emailInput, "Digite um e-mail válido");
      return false;
    }

    if (!name || name.length < 3) {
      showError(nameInput, "Digite seu nome completo");
      return false;
    }

    if (state.method === "card") {
      // Validate card fields
      const cardNumber = container.querySelector(
        "#card-number",
      ) as HTMLInputElement;
      const cardExpiry = container.querySelector(
        "#card-expiry",
      ) as HTMLInputElement;
      const cardCvv = container.querySelector("#card-cvv") as HTMLInputElement;

      const cleanCardNumber = sanitizeCardNumber(cardNumber?.value || "");
      if (cleanCardNumber.length < 16) {
        showError(cardNumber, "Número do cartão inválido");
        return false;
      }

      if (!cardExpiry?.value || !cardExpiry.value.includes("/")) {
        showError(cardExpiry, "Data inválida");
        return false;
      }

      const cleanCvv = sanitizeCvv(cardCvv?.value || "");
      if (cleanCvv.length < 3) {
        showError(cardCvv, "CVV inválido");
        return false;
      }
    }

    return true;
  }

  function showError(input: HTMLInputElement | null, message: string): void {
    if (!input) return;

    input.classList.add("border-red-500");

    // Remove existing error
    const existingError = input.parentElement?.querySelector(".error-message");
    existingError?.remove();

    // Add error message
    const error = document.createElement("p");
    error.className = "error-message text-red-500 text-xs mt-1";
    error.textContent = message;
    input.parentElement?.appendChild(error);

    // Focus input
    input.focus();

    // Remove error on input
    input.addEventListener(
      "input",
      () => {
        input.classList.remove("border-red-500");
        error.remove();
      },
      { once: true },
    );
  }

  // Handle submit
  async function handleSubmit(e: Event): Promise<void> {
    e.preventDefault();

    // Rate limiting - prevent spam
    if (!checkRateLimit("payment-form", 5, 60000)) {
      logSecurityEvent("rate_limit_exceeded", { form: "payment-form" });
      alert("Muitas tentativas. Aguarde um minuto e tente novamente.");
      return;
    }

    if (!validateForm()) return;

    state.loading = true;
    // Sanitize user input before storing
    state.email = sanitizeEmail(emailInput.value);
    state.name = sanitizeName(nameInput.value);

    // Update UI
    submitButton.disabled = true;
    submitButton.innerHTML = `
      <svg class="animate-spin h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24">
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
      </svg>
      Processando...
    `;

    options.onStepChange(2);

    track("payment_started", {
      method: state.method,
      amount: PRICES[state.method],
    });

    try {
      if (state.method === "pix") {
        await processPixPayment();
      } else {
        await processCardPayment();
      }
      // Clear rate limit on success
      clearRateLimit("payment-form");
    } catch (error) {
      state.loading = false;
      submitButton.disabled = false;
      submitButton.innerHTML = `<span class="btn-text">${state.method === "pix" ? "Gerar código PIX" : "Pagar com cartão"}</span>`;

      // Show error
      alert("Erro ao processar pagamento. Tente novamente.");
      track("payment_error", { method: state.method, error: String(error) });
    }
  }

  async function processPixPayment(): Promise<void> {
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1500));

    // Show PIX code
    options.onStepChange(3);

    const pixCode =
      "PIX" + Math.random().toString(36).substring(2, 15).toUpperCase();

    container.innerHTML = `
      <div class="text-center">
        <button type="button" class="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6" data-back>
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/>
          </svg>
          Voltar
        </button>
        
        <div class="bg-gradient-to-br from-indigo-50 to-white p-6 rounded-2xl border border-indigo-100 mb-6">
          <div class="w-48 h-48 mx-auto mb-4 bg-white rounded-xl flex items-center justify-center border-2 border-dashed border-gray-300">
            <div class="text-center text-gray-400">
              <svg class="w-16 h-16 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z"/>
              </svg>
              QR Code
            </div>
          </div>
          
          <p class="text-2xl font-bold text-indigo-600 mb-2">R$ ${PRICES.pix}</p>
          <p class="text-sm text-gray-600 mb-4">Pague em até 30 minutos</p>
          
          <div class="relative">
            <input 
              type="text" 
              value="${pixCode}"
              readonly
              class="w-full py-3 px-4 pr-20 bg-gray-50 border border-gray-200 rounded-xl text-sm font-mono text-center"
            />
            <button 
              type="button"
              class="absolute right-2 top-1/2 -translate-y-1/2 px-3 py-1.5 bg-indigo-600 text-white text-xs font-semibold rounded-lg hover:bg-indigo-700"
              onclick="navigator.clipboard.writeText('${pixCode}'); this.textContent = 'Copiado!'; setTimeout(() => this.textContent = 'Copiar', 2000)"
            >
              Copiar
            </button>
          </div>
        </div>
        
        <p class="text-sm text-gray-500 mb-6">
          Após o pagamento, enviaremos o acesso para<br>
          <strong>${state.email}</strong>
        </p>
        
        <div class="space-y-3">
          <button 
            type="button"
            class="w-full py-4 px-6 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-colors"
            id="confirm-pix-btn"
          >
            Já paguei
          </button>
          <p class="text-xs text-gray-400">
            Aguardando confirmação do pagamento...
          </p>
        </div>
      </div>
    `;

    // Re-attach back listener
    container
      .querySelector("[data-back]")
      ?.addEventListener("click", options.onBack);

    // Simulate payment confirmation
    container
      .querySelector("#confirm-pix-btn")
      ?.addEventListener("click", async () => {
        const btn = container.querySelector(
          "#confirm-pix-btn",
        ) as HTMLButtonElement;
        btn.disabled = true;
        btn.innerHTML = `
        <svg class="animate-spin h-5 w-5 mx-auto" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      `;

        await new Promise((resolve) => setTimeout(resolve, 2000));

        options.onSuccess({
          email: state.email,
          orderId: "ORD-" + Date.now(),
        });
      });
  }

  async function processCardPayment(): Promise<void> {
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 2000));

    options.onStepChange(3);

    // Success
    options.onSuccess({
      email: state.email,
      orderId: "ORD-" + Date.now(),
    });
  }

  // Event listeners
  methodButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      const method = btn.getAttribute("data-payment-method") as PaymentMethod;
      updateMethod(method);
    });
  });

  backButton?.addEventListener("click", options.onBack);
  form?.addEventListener("submit", handleSubmit);

  // Card number formatting
  const cardNumber = container.querySelector(
    "#card-number",
  ) as HTMLInputElement;
  cardNumber?.addEventListener("input", (e) => {
    const target = e.target as HTMLInputElement;
    let value = target.value.replace(/\D/g, "");
    value = value.replace(/(\d{4})/g, "$1 ").trim();
    target.value = value.substring(0, 19);
  });

  // Expiry formatting
  const cardExpiry = container.querySelector(
    "#card-expiry",
  ) as HTMLInputElement;
  cardExpiry?.addEventListener("input", (e) => {
    const target = e.target as HTMLInputElement;
    let value = target.value.replace(/\D/g, "");
    if (value.length >= 2) {
      value = value.substring(0, 2) + "/" + value.substring(2, 4);
    }
    target.value = value;
  });

  // Initialize with PIX selected
  updateMethod("pix");
  options.onStepChange(1);

  return () => {
    // Cleanup
  };
}

function createPaymentFormTemplate(): string {
  return `
    <div>
      <button type="button" class="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6" data-back>
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/>
        </svg>
        Voltar
      </button>
      
      <form id="payment-form" class="space-y-6">
        <!-- Payment Method Selection -->
        <div class="grid grid-cols-2 gap-3">
          <button 
            type="button"
            class="payment-method-btn p-4 rounded-xl border-2 border-gray-200 hover:border-indigo-500 transition-all text-center"
            data-payment-method="pix"
          >
            <div class="text-2xl mb-1">🏦</div>
            <div class="font-bold text-gray-900">PIX</div>
            <div class="text-sm text-green-600 font-semibold">R$ 279</div>
            <div class="text-xs text-gray-500">6% off</div>
          </button>
          
          <button 
            type="button"
            class="payment-method-btn p-4 rounded-xl border-2 border-gray-200 hover:border-indigo-500 transition-all text-center"
            data-payment-method="card"
          >
            <div class="text-2xl mb-1">💳</div>
            <div class="font-bold text-gray-900">Cartão</div>
            <div class="text-sm text-gray-600">R$ 297</div>
            <div class="text-xs text-gray-500">até 3x</div>
          </button>
        </div>
        
        <!-- Personal Info -->
        <div class="space-y-4">
          <div>
            <label for="payment-name" class="block text-sm font-medium text-gray-700 mb-1">Seu nome</label>
            <input 
              type="text" 
              id="payment-name"
              class="w-full py-3 px-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
              placeholder="Nome completo"
              required
            />
          </div>
          
          <div>
            <label for="payment-email" class="block text-sm font-medium text-gray-700 mb-1">E-mail</label>
            <input 
              type="email" 
              id="payment-email"
              class="w-full py-3 px-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
              placeholder="seu@email.com"
              required
            />
            <p class="text-xs text-gray-500 mt-1">O acesso será enviado para este e-mail</p>
          </div>
        </div>
        
        <!-- Card Fields -->
        <div class="card-fields space-y-4 hidden">
          <div>
            <label for="card-number" class="block text-sm font-medium text-gray-700 mb-1">Número do cartão</label>
            <input 
              type="text" 
              id="card-number"
              class="w-full py-3 px-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
              placeholder="0000 0000 0000 0000"
              maxlength="19"
            />
          </div>
          
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label for="card-expiry" class="block text-sm font-medium text-gray-700 mb-1">Validade</label>
              <input 
                type="text" 
                id="card-expiry"
                class="w-full py-3 px-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                placeholder="MM/AA"
                maxlength="5"
              />
            </div>
            
            <div>
              <label for="card-cvv" class="block text-sm font-medium text-gray-700 mb-1">CVV</label>
              <input 
                type="text" 
                id="card-cvv"
                class="w-full py-3 px-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                placeholder="123"
                maxlength="4"
              />
            </div>
          </div>
        </div>
        
        <!-- PIX Info -->
        <div class="pix-info bg-green-50 p-4 rounded-xl border border-green-200">
          <div class="flex items-start gap-3">
            <div class="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <svg class="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"/>
              </svg>
            </div>
            <div>
              <p class="font-semibold text-green-800">Pagamento instantâneo</p>
              <p class="text-sm text-green-700">Após confirmar, você receberá o código PIX para copiar e pagar no app do seu banco.</p>
            </div>
          </div>
        </div>
        
        <!-- Submit -->
        <button 
          type="submit"
          class="w-full py-4 px-6 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-colors flex items-center justify-center"
          data-submit
        >
          <span class="btn-text">Gerar código PIX</span>
        </button>
        
        <!-- Total -->
        <div class="text-center pt-4 border-t border-gray-100">
          <p class="text-sm text-gray-500">Total a pagar</p>
          <p class="text-3xl font-bold text-gray-900 price-display">R$ 279</p>
        </div>
        
        <!-- Security Badge -->
        <div class="flex items-center justify-center gap-2 text-xs text-gray-500">
          <svg class="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
          </svg>
          Pagamento 100% seguro
        </div>
      </form>
    </div>
  `;
}
