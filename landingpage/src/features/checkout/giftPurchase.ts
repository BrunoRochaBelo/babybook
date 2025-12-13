/**
 * Gift Purchase - Compra para presentear
 *
 * Fluxo:
 * 1. Dados do presenteador
 * 2. Dados do presenteado
 * 3. Mensagem personalizada
 * 4. Pagamento
 */

import {
  escapeHtml,
  sanitizeName,
  sanitizeEmail,
  sanitizeMessage,
  sanitizeCardNumber,
  sanitizeCvv,
  isValidEmail,
  checkRateLimit,
  clearRateLimit,
  logSecurityEvent,
} from "./security";

interface GiftPurchaseOptions {
  onSuccess: (data: {
    email: string;
    recipientEmail: string;
    orderId: string;
  }) => void;
  onBack: () => void;
  onStepChange: (step: number) => void;
}

type PaymentMethod = "card" | "pix";

interface GiftState {
  step: "info" | "recipient" | "payment";
  senderName: string;
  senderEmail: string;
  recipientName: string;
  recipientEmail: string;
  message: string;
  paymentMethod: PaymentMethod;
  loading: boolean;
}

const PRICES = {
  card: 297,
  pix: 279,
};

// Analytics helper
function track(action: string, data?: Record<string, unknown>): void {
  if (
    typeof window !== "undefined" &&
    window.location.hostname === "localhost"
  ) {
    console.log("🎁 Gift Event:", action, data);
  }
}

export function setupGiftPurchase(
  container: HTMLElement,
  options: GiftPurchaseOptions,
): () => void {
  const state: GiftState = {
    step: "info",
    senderName: "",
    senderEmail: "",
    recipientName: "",
    recipientEmail: "",
    message: "",
    paymentMethod: "pix",
    loading: false,
  };

  // Render initial step
  renderInfoStep();
  options.onStepChange(1);

  function renderInfoStep(): void {
    container.innerHTML = `
      <div>
        <button type="button" class="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6" data-back>
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/>
          </svg>
          Voltar
        </button>
        
        <!-- Gift Header -->
        <div class="text-center mb-6">
          <div class="w-16 h-16 mx-auto mb-4 bg-rose-100 rounded-full flex items-center justify-center">
            <svg class="w-8 h-8 text-rose-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7"/>
            </svg>
          </div>
          <h3 class="text-lg font-bold text-gray-900">Seus dados</h3>
          <p class="text-sm text-gray-600">Quem está presenteando?</p>
        </div>
        
        <form id="gift-info-form" class="space-y-4">
          <div>
            <label for="sender-name" class="block text-sm font-medium text-gray-700 mb-1">Seu nome</label>
            <input 
              type="text" 
              id="sender-name"
              class="w-full py-3 px-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-rose-500 focus:border-rose-500 transition-colors"
              placeholder="Como você quer ser identificado(a)"
              value="${state.senderName}"
              required
            />
          </div>
          
          <div>
            <label for="sender-email" class="block text-sm font-medium text-gray-700 mb-1">Seu e-mail</label>
            <input 
              type="email" 
              id="sender-email"
              class="w-full py-3 px-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-rose-500 focus:border-rose-500 transition-colors"
              placeholder="seu@email.com"
              value="${state.senderEmail}"
              required
            />
            <p class="text-xs text-gray-500 mt-1">Enviaremos o comprovante para você</p>
          </div>
          
          <button 
            type="submit"
            class="w-full py-4 px-6 bg-rose-600 text-white rounded-xl font-bold hover:bg-rose-700 transition-colors"
          >
            Continuar
            <svg class="w-5 h-5 inline-block ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7l5 5m0 0l-5 5m5-5H6"/>
            </svg>
          </button>
        </form>
      </div>
    `;

    // Listeners
    container
      .querySelector("[data-back]")
      ?.addEventListener("click", options.onBack);

    const form = container.querySelector("#gift-info-form") as HTMLFormElement;
    form?.addEventListener("submit", (e) => {
      e.preventDefault();

      const nameInput = container.querySelector(
        "#sender-name",
      ) as HTMLInputElement;
      const emailInput = container.querySelector(
        "#sender-email",
      ) as HTMLInputElement;

      if (!nameInput.value.trim() || nameInput.value.trim().length < 2) {
        showError(nameInput, "Digite seu nome");
        return;
      }

      if (!emailInput.value.trim() || !isValidEmail(emailInput.value)) {
        showError(emailInput, "Digite um e-mail válido");
        return;
      }

      // Sanitize inputs before storing
      state.senderName = sanitizeName(nameInput.value);
      state.senderEmail = sanitizeEmail(emailInput.value);
      state.step = "recipient";

      options.onStepChange(2);
      renderRecipientStep();

      track("gift_sender_info_completed");
    });
  }

  function renderRecipientStep(): void {
    container.innerHTML = `
      <div>
        <button type="button" class="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6" data-back-step>
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/>
          </svg>
          Voltar
        </button>
        
        <!-- Gift Header -->
        <div class="text-center mb-6">
          <div class="w-16 h-16 mx-auto mb-4 bg-rose-100 rounded-full flex items-center justify-center">
            <span class="text-3xl">💝</span>
          </div>
          <h3 class="text-lg font-bold text-gray-900">Para quem é o presente?</h3>
          <p class="text-sm text-gray-600">Quem vai receber esse carinho?</p>
        </div>
        
        <form id="gift-recipient-form" class="space-y-4">
          <div>
            <label for="recipient-name" class="block text-sm font-medium text-gray-700 mb-1">Nome de quem vai receber</label>
            <input 
              type="text" 
              id="recipient-name"
              class="w-full py-3 px-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-rose-500 focus:border-rose-500 transition-colors"
              placeholder="Nome da pessoa presenteada"
              value="${state.recipientName}"
              required
            />
          </div>
          
          <div>
            <label for="recipient-email" class="block text-sm font-medium text-gray-700 mb-1">E-mail de quem vai receber</label>
            <input 
              type="email" 
              id="recipient-email"
              class="w-full py-3 px-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-rose-500 focus:border-rose-500 transition-colors"
              placeholder="email@dapessoa.com"
              value="${state.recipientEmail}"
              required
            />
            <p class="text-xs text-gray-500 mt-1">O código de resgate será enviado para este e-mail</p>
          </div>
          
          <div>
            <label for="gift-message" class="block text-sm font-medium text-gray-700 mb-1">
              Mensagem carinhosa <span class="text-gray-400">(opcional)</span>
            </label>
            <textarea 
              id="gift-message"
              class="w-full py-3 px-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-rose-500 focus:border-rose-500 transition-colors resize-none"
              rows="3"
              placeholder="Ex: Para eternizar os momentos mais especiais do nosso netinho! Com amor, Vovó ❤️"
              maxlength="200"
            >${state.message}</textarea>
            <p class="text-xs text-gray-400 mt-1 text-right"><span id="char-count">0</span>/200</p>
          </div>
          
          <button 
            type="submit"
            class="w-full py-4 px-6 bg-rose-600 text-white rounded-xl font-bold hover:bg-rose-700 transition-colors"
          >
            Ir para pagamento
            <svg class="w-5 h-5 inline-block ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7l5 5m0 0l-5 5m5-5H6"/>
            </svg>
          </button>
        </form>
      </div>
    `;

    // Back to previous step
    container
      .querySelector("[data-back-step]")
      ?.addEventListener("click", () => {
        state.step = "info";
        options.onStepChange(1);
        renderInfoStep();
      });

    // Character count
    const messageInput = container.querySelector(
      "#gift-message",
    ) as HTMLTextAreaElement;
    const charCount = container.querySelector("#char-count");
    messageInput?.addEventListener("input", () => {
      if (charCount) charCount.textContent = String(messageInput.value.length);
    });

    const form = container.querySelector(
      "#gift-recipient-form",
    ) as HTMLFormElement;
    form?.addEventListener("submit", (e) => {
      e.preventDefault();

      const nameInput = container.querySelector(
        "#recipient-name",
      ) as HTMLInputElement;
      const emailInput = container.querySelector(
        "#recipient-email",
      ) as HTMLInputElement;

      if (!nameInput.value.trim() || nameInput.value.trim().length < 2) {
        showError(nameInput, "Digite o nome de quem vai receber");
        return;
      }

      if (!emailInput.value.trim() || !isValidEmail(emailInput.value)) {
        showError(emailInput, "Digite um e-mail válido");
        return;
      }

      // Sanitize user input before storing
      state.recipientName = sanitizeName(nameInput.value);
      state.recipientEmail = sanitizeEmail(emailInput.value);
      state.message = sanitizeMessage(messageInput?.value || "");
      state.step = "payment";

      options.onStepChange(3);
      renderPaymentStep();

      track("gift_recipient_info_completed");
    });
  }

  function renderPaymentStep(): void {
    // Escape all user data for safe HTML rendering
    const safeRecipientName = escapeHtml(state.recipientName);
    const safeRecipientEmail = escapeHtml(state.recipientEmail);
    const safeMessage = escapeHtml(state.message);
    const truncatedMessage =
      safeMessage.length > 50
        ? safeMessage.substring(0, 50) + "..."
        : safeMessage;

    container.innerHTML = `
      <div>
        <button type="button" class="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6" data-back-step>
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/>
          </svg>
          Voltar
        </button>
        
        <!-- Gift Summary -->
        <div class="bg-gradient-to-br from-rose-50 to-pink-50 p-4 rounded-2xl border border-rose-200 mb-6">
          <div class="flex items-start gap-3">
            <div class="text-2xl">🎁</div>
            <div class="flex-1">
              <p class="font-semibold text-rose-900">Presente para ${safeRecipientName}</p>
              <p class="text-sm text-rose-700">${safeRecipientEmail}</p>
              ${safeMessage ? `<p class="text-xs text-rose-600 mt-2 italic">"${truncatedMessage}"</p>` : ""}
            </div>
          </div>
        </div>
        
        <!-- Payment Method -->
        <div class="grid grid-cols-2 gap-3 mb-6">
          <button 
            type="button"
            class="payment-method-btn p-4 rounded-xl border-2 border-rose-500 bg-rose-50 transition-all text-center"
            data-payment-method="pix"
          >
            <div class="text-2xl mb-1">🏦</div>
            <div class="font-bold text-gray-900">PIX</div>
            <div class="text-sm text-green-600 font-semibold">R$ ${PRICES.pix}</div>
            <div class="text-xs text-gray-500">6% off</div>
          </button>
          
          <button 
            type="button"
            class="payment-method-btn p-4 rounded-xl border-2 border-gray-200 transition-all text-center"
            data-payment-method="card"
          >
            <div class="text-2xl mb-1">💳</div>
            <div class="font-bold text-gray-900">Cartão</div>
            <div class="text-sm text-gray-600">R$ ${PRICES.card}</div>
            <div class="text-xs text-gray-500">até 3x</div>
          </button>
        </div>
        
        <!-- Card Fields (hidden by default) -->
        <div class="card-fields hidden space-y-4 mb-6">
          <div>
            <label for="gift-card-number" class="block text-sm font-medium text-gray-700 mb-1">Número do cartão</label>
            <input 
              type="text" 
              id="gift-card-number"
              class="w-full py-3 px-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-rose-500 focus:border-rose-500 transition-colors"
              placeholder="0000 0000 0000 0000"
              maxlength="19"
            />
          </div>
          
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label for="gift-card-expiry" class="block text-sm font-medium text-gray-700 mb-1">Validade</label>
              <input 
                type="text" 
                id="gift-card-expiry"
                class="w-full py-3 px-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-rose-500 focus:border-rose-500 transition-colors"
                placeholder="MM/AA"
                maxlength="5"
              />
            </div>
            
            <div>
              <label for="gift-card-cvv" class="block text-sm font-medium text-gray-700 mb-1">CVV</label>
              <input 
                type="text" 
                id="gift-card-cvv"
                class="w-full py-3 px-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-rose-500 focus:border-rose-500 transition-colors"
                placeholder="123"
                maxlength="4"
              />
            </div>
          </div>
        </div>
        
        <!-- PIX Info -->
        <div class="pix-info bg-green-50 p-4 rounded-xl border border-green-200 mb-6">
          <div class="flex items-start gap-3">
            <div class="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <svg class="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"/>
              </svg>
            </div>
            <div>
              <p class="font-semibold text-green-800">Pagamento instantâneo</p>
              <p class="text-sm text-green-700">O presente será enviado assim que o PIX for confirmado!</p>
            </div>
          </div>
        </div>
        
        <!-- Submit -->
        <button 
          type="button"
          id="gift-pay-btn"
          class="w-full py-4 px-6 bg-rose-600 text-white rounded-xl font-bold hover:bg-rose-700 transition-colors flex items-center justify-center"
        >
          <span class="btn-text">Enviar presente</span>
        </button>
        
        <!-- Total -->
        <div class="text-center pt-4 mt-4 border-t border-gray-100">
          <p class="text-sm text-gray-500">Total a pagar</p>
          <p class="text-3xl font-bold text-gray-900 price-display">R$ ${PRICES.pix}</p>
        </div>
      </div>
    `;

    // Back to previous step
    container
      .querySelector("[data-back-step]")
      ?.addEventListener("click", () => {
        state.step = "recipient";
        options.onStepChange(2);
        renderRecipientStep();
      });

    // Payment method selection
    const methodButtons = container.querySelectorAll("[data-payment-method]");
    const cardFields = container.querySelector(".card-fields");
    const pixInfo = container.querySelector(".pix-info");
    const priceDisplay = container.querySelector(".price-display");
    const payBtn = container.querySelector("#gift-pay-btn");

    methodButtons.forEach((btn) => {
      btn.addEventListener("click", () => {
        const method = btn.getAttribute("data-payment-method") as PaymentMethod;
        state.paymentMethod = method;

        methodButtons.forEach((b) => {
          const m = b.getAttribute("data-payment-method");
          if (m === method) {
            b.classList.add("border-rose-500", "bg-rose-50");
            b.classList.remove("border-gray-200");
          } else {
            b.classList.remove("border-rose-500", "bg-rose-50");
            b.classList.add("border-gray-200");
          }
        });

        if (method === "card") {
          cardFields?.classList.remove("hidden");
          pixInfo?.classList.add("hidden");
        } else {
          cardFields?.classList.add("hidden");
          pixInfo?.classList.remove("hidden");
        }

        if (priceDisplay) {
          priceDisplay.textContent = `R$ ${PRICES[method]}`;
        }

        if (payBtn) {
          payBtn.querySelector(".btn-text")!.textContent =
            method === "pix" ? "Enviar presente" : "Pagar e enviar presente";
        }
      });
    });

    // Card number formatting
    const cardNumber = container.querySelector(
      "#gift-card-number",
    ) as HTMLInputElement;
    cardNumber?.addEventListener("input", () => {
      let value = cardNumber.value.replace(/\D/g, "");
      value = value.replace(/(\d{4})/g, "$1 ").trim();
      cardNumber.value = value.substring(0, 19);
    });

    // Expiry formatting
    const cardExpiry = container.querySelector(
      "#gift-card-expiry",
    ) as HTMLInputElement;
    cardExpiry?.addEventListener("input", () => {
      let value = cardExpiry.value.replace(/\D/g, "");
      if (value.length >= 2) {
        value = value.substring(0, 2) + "/" + value.substring(2, 4);
      }
      cardExpiry.value = value;
    });

    // Submit payment
    payBtn?.addEventListener("click", async () => {
      // Rate limiting - prevent spam
      if (!checkRateLimit("gift-payment", 3, 60000)) {
        logSecurityEvent("rate_limit_exceeded", { form: "gift-payment" });
        alert("Muitas tentativas. Aguarde um minuto e tente novamente.");
        return;
      }

      if (state.paymentMethod === "card") {
        // Validate card with sanitization
        const cardNum = container.querySelector(
          "#gift-card-number",
        ) as HTMLInputElement;
        const expiry = container.querySelector(
          "#gift-card-expiry",
        ) as HTMLInputElement;
        const cvv = container.querySelector(
          "#gift-card-cvv",
        ) as HTMLInputElement;

        const cleanCardNumber = sanitizeCardNumber(cardNum?.value || "");
        if (cleanCardNumber.length < 16) {
          showError(cardNum, "Número do cartão inválido");
          return;
        }
        if (!expiry?.value || !expiry.value.includes("/")) {
          showError(expiry, "Data inválida");
          return;
        }
        const cleanCvv = sanitizeCvv(cvv?.value || "");
        if (cleanCvv.length < 3) {
          showError(cvv, "CVV inválido");
          return;
        }
      }

      state.loading = true;
      const btn = payBtn as HTMLButtonElement;
      btn.disabled = true;
      btn.innerHTML = `
        <svg class="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        Processando...
      `;

      track("gift_payment_started", { method: state.paymentMethod });

      if (state.paymentMethod === "pix") {
        // Show PIX code
        await new Promise((resolve) => setTimeout(resolve, 1500));
        renderPixStep();
      } else {
        // Process card
        await new Promise((resolve) => setTimeout(resolve, 2000));

        // Clear rate limit on success
        clearRateLimit("gift-payment");

        options.onSuccess({
          email: state.senderEmail,
          recipientEmail: state.recipientEmail,
          orderId: "GIFT-" + Date.now(),
        });
      }
    });
  }

  function renderPixStep(): void {
    const pixCode =
      "PIX" + Math.random().toString(36).substring(2, 15).toUpperCase();

    // Escape email for safe HTML rendering
    const safeRecipientEmail = escapeHtml(state.recipientEmail);

    container.innerHTML = `
      <div class="text-center">
        <div class="bg-gradient-to-br from-rose-50 to-pink-50 p-6 rounded-2xl border border-rose-200 mb-6">
          <div class="w-48 h-48 mx-auto mb-4 bg-white rounded-xl flex items-center justify-center border-2 border-dashed border-gray-300">
            <div class="text-center text-gray-400">
              <svg class="w-16 h-16 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z"/>
              </svg>
              QR Code
            </div>
          </div>
          
          <p class="text-2xl font-bold text-rose-600 mb-2">R$ ${PRICES.pix}</p>
          <p class="text-sm text-gray-600 mb-4">Pague em até 30 minutos</p>
          
          <div class="relative">
            <input 
              type="text" 
              value="${pixCode}"
              readonly
              class="w-full py-3 px-4 pr-20 bg-white border border-gray-200 rounded-xl text-sm font-mono text-center"
            />
            <button 
              type="button"
              class="absolute right-2 top-1/2 -translate-y-1/2 px-3 py-1.5 bg-rose-600 text-white text-xs font-semibold rounded-lg hover:bg-rose-700"
              id="copy-pix-btn"
            >
              Copiar
            </button>
          </div>
        </div>
        
        <div class="bg-amber-50 p-4 rounded-xl border border-amber-200 mb-6">
          <p class="text-sm text-amber-800">
            <strong>🎁 Após o pagamento:</strong><br>
            O código de resgate será enviado automaticamente para<br>
            <strong>${safeRecipientEmail}</strong>
          </p>
        </div>
        
        <button 
          type="button"
          class="w-full py-4 px-6 bg-rose-600 text-white rounded-xl font-bold hover:bg-rose-700 transition-colors"
          id="confirm-pix-gift-btn"
        >
          Já paguei
        </button>
        <p class="text-xs text-gray-400 mt-2">
          Aguardando confirmação do pagamento...
        </p>
      </div>
    `;

    // Copy button
    container.querySelector("#copy-pix-btn")?.addEventListener("click", () => {
      navigator.clipboard.writeText(pixCode);
      const btn = container.querySelector("#copy-pix-btn");
      if (btn) {
        btn.textContent = "Copiado!";
        setTimeout(() => {
          btn.textContent = "Copiar";
        }, 2000);
      }
    });

    // Confirm payment
    container
      .querySelector("#confirm-pix-gift-btn")
      ?.addEventListener("click", async () => {
        const btn = container.querySelector(
          "#confirm-pix-gift-btn",
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
          email: state.senderEmail,
          recipientEmail: state.recipientEmail,
          orderId: "GIFT-" + Date.now(),
        });
      });
  }

  function showError(input: HTMLInputElement | null, message: string): void {
    if (!input) return;

    input.classList.add("border-red-500");

    const existingError = input.parentElement?.querySelector(".error-message");
    existingError?.remove();

    const error = document.createElement("p");
    error.className = "error-message text-red-500 text-xs mt-1";
    error.textContent = message;
    input.parentElement?.appendChild(error);

    input.focus();

    input.addEventListener(
      "input",
      () => {
        input.classList.remove("border-red-500");
        error.remove();
      },
      { once: true },
    );
  }

  return () => {
    // Cleanup
  };
}
