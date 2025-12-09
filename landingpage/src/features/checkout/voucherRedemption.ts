/**
 * Voucher Redemption - Resgate de código de voucher
 *
 * Suporta:
 * - Voucher do fotógrafo parceiro
 * - Voucher de presente
 */

import {
  escapeHtml,
  sanitizeVoucherCode,
  sanitizeEmail,
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
    console.log("🎫 Voucher Event:", action, data);
  }
}

interface VoucherRedemptionOptions {
  onSuccess: (data: { email: string; voucherCode: string }) => void;
  onBack: () => void;
  onStepChange: (step: number) => void;
}

interface VoucherState {
  code: string;
  email: string;
  loading: boolean;
  verified: boolean;
  voucherData: VoucherData | null;
}

interface VoucherData {
  type: "photographer" | "gift";
  photographerName?: string;
  senderName?: string;
  message?: string;
  expiresAt?: string;
}

export function setupVoucherRedemption(
  container: HTMLElement,
  options: VoucherRedemptionOptions,
): () => void {
  const state: VoucherState = {
    code: "",
    email: "",
    loading: false,
    verified: false,
    voucherData: null,
  };

  // Render form
  container.innerHTML = createVoucherFormTemplate();

  // Get elements
  const form = container.querySelector("#voucher-form") as HTMLFormElement;
  const codeInput = container.querySelector(
    "#voucher-code",
  ) as HTMLInputElement;
  const backButton = container.querySelector("[data-back]");
  const verifyButton = container.querySelector(
    "[data-verify]",
  ) as HTMLButtonElement;

  // Handle code verification
  async function handleVerify(e: Event): Promise<void> {
    e.preventDefault();

    // Rate limiting - prevent brute force
    if (!checkRateLimit("voucher-verify", 5, 60000)) {
      logSecurityEvent("rate_limit_exceeded", { form: "voucher-verify" });
      alert("Muitas tentativas. Aguarde um minuto e tente novamente.");
      return;
    }

    // Sanitize voucher code
    const code = sanitizeVoucherCode(codeInput.value);

    if (!code || code.length < 6) {
      showError(codeInput, "Digite um código válido");
      return;
    }

    state.loading = true;
    state.code = code;

    verifyButton.disabled = true;
    verifyButton.innerHTML = `
      <svg class="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
      </svg>
    `;

    track("voucher_verification_started", { code });

    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1500));

      // Mock voucher data based on code prefix
      const isGift = code.startsWith("GIFT") || code.startsWith("PRES");
      const isPhotographer = code.startsWith("FOTO") || code.startsWith("PHO");

      if (!isGift && !isPhotographer && !code.startsWith("BB")) {
        throw new Error("Código inválido");
      }

      state.verified = true;
      state.voucherData = {
        type: isPhotographer ? "photographer" : "gift",
        photographerName: isPhotographer ? "Estúdio Amor Eterno" : undefined,
        senderName: isGift ? "Vovó Maria" : undefined,
        message: isGift
          ? "Para eternizar os momentos mais especiais do nosso netinho! Com amor, Vovó Maria ❤️"
          : undefined,
        expiresAt: new Date(
          Date.now() + 365 * 24 * 60 * 60 * 1000,
        ).toISOString(),
      };

      options.onStepChange(2);
      showVoucherConfirmation();

      track("voucher_verified", { code, type: state.voucherData.type });
    } catch (error) {
      state.loading = false;
      verifyButton.disabled = false;
      verifyButton.innerHTML = '<span class="btn-text">Verificar código</span>';
      showError(codeInput, "Código inválido ou expirado");

      track("voucher_verification_failed", { code, error: String(error) });
    }
  }

  function showError(input: HTMLInputElement | null, message: string): void {
    if (!input) return;

    input.classList.add("border-red-500", "shake");

    const existingError = input.parentElement?.querySelector(".error-message");
    existingError?.remove();

    const error = document.createElement("p");
    error.className = "error-message text-red-500 text-xs mt-1";
    error.textContent = message;
    input.parentElement?.appendChild(error);

    setTimeout(() => input.classList.remove("shake"), 500);

    input.addEventListener(
      "input",
      () => {
        input.classList.remove("border-red-500");
        error.remove();
      },
      { once: true },
    );
  }

  function showVoucherConfirmation(): void {
    const data = state.voucherData!;
    const isGift = data.type === "gift";

    // Escape all user-generated data to prevent XSS
    const safeSenderName = data.senderName ? escapeHtml(data.senderName) : "";
    const safeMessage = data.message ? escapeHtml(data.message) : "";
    const safePhotographerName = data.photographerName
      ? escapeHtml(data.photographerName)
      : "";
    const safeCode = escapeHtml(state.code);

    container.innerHTML = `
      <div>
        <button type="button" class="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6" data-back>
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/>
          </svg>
          Voltar
        </button>
        
        <!-- Voucher Card -->
        <div class="bg-gradient-to-br ${isGift ? "from-rose-50 to-pink-50 border-rose-200" : "from-emerald-50 to-teal-50 border-emerald-200"} p-6 rounded-2xl border mb-6">
          
          <!-- Success Badge -->
          <div class="flex items-center justify-center mb-4">
            <div class="w-16 h-16 rounded-full ${isGift ? "bg-rose-100" : "bg-emerald-100"} flex items-center justify-center">
              <svg class="w-8 h-8 ${isGift ? "text-rose-600" : "text-emerald-600"}" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
              </svg>
            </div>
          </div>
          
          <h3 class="text-xl font-bold text-center ${isGift ? "text-rose-900" : "text-emerald-900"} mb-2">
            ${isGift ? "🎁 Presente validado!" : "📷 Voucher do fotógrafo"}
          </h3>
          
          <p class="text-center ${isGift ? "text-rose-700" : "text-emerald-700"} mb-4">
            <strong>${safeCode}</strong>
          </p>
          
          ${
            isGift && safeSenderName
              ? `
            <div class="bg-white/70 rounded-xl p-4 mb-4">
              <p class="text-sm text-gray-600 mb-2">De: <strong>${safeSenderName}</strong></p>
              ${safeMessage ? `<p class="text-gray-700 italic">"${safeMessage}"</p>` : ""}
            </div>
          `
              : ""
          }
          
          ${
            safePhotographerName
              ? `
            <div class="bg-white/70 rounded-xl p-4 mb-4">
              <p class="text-sm text-gray-600">Cortesia de</p>
              <p class="font-bold text-gray-900">${safePhotographerName}</p>
            </div>
          `
              : ""
          }
          
          <div class="text-center">
            <p class="text-sm ${isGift ? "text-rose-600" : "text-emerald-600"}">
              ✓ Acesso vitalício ao Baby Book
            </p>
          </div>
        </div>
        
        <!-- Email Form -->
        <form id="voucher-email-form" class="space-y-4">
          <div>
            <label for="voucher-email" class="block text-sm font-medium text-gray-700 mb-1">
              Para qual e-mail devemos enviar o acesso?
            </label>
            <input 
              type="email" 
              id="voucher-email"
              class="w-full py-3 px-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
              placeholder="seu@email.com"
              required
            />
          </div>
          
          <button 
            type="submit"
            class="w-full py-4 px-6 ${isGift ? "bg-rose-600 hover:bg-rose-700" : "bg-emerald-600 hover:bg-emerald-700"} text-white rounded-xl font-bold transition-colors flex items-center justify-center"
          >
            <span class="btn-text">Ativar meu Baby Book</span>
          </button>
        </form>
      </div>
    `;

    // Re-attach listeners
    container
      .querySelector("[data-back]")
      ?.addEventListener("click", options.onBack);

    const emailForm = container.querySelector(
      "#voucher-email-form",
    ) as HTMLFormElement;
    const emailInput = container.querySelector(
      "#voucher-email",
    ) as HTMLInputElement;

    emailForm?.addEventListener("submit", async (e) => {
      e.preventDefault();

      const email = emailInput.value.trim();
      if (!email || !isValidEmail(email)) {
        showError(emailInput, "Digite um e-mail válido");
        return;
      }

      // Sanitize email before storing
      state.email = sanitizeEmail(email);

      const submitBtn = emailForm.querySelector(
        'button[type="submit"]',
      ) as HTMLButtonElement;
      submitBtn.disabled = true;
      submitBtn.innerHTML = `
        <svg class="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      `;

      options.onStepChange(3);

      // Simulate activation
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Clear rate limit on success
      clearRateLimit("voucher-verify");

      options.onSuccess({
        email: state.email,
        voucherCode: state.code,
      });
    });
  }

  // Format code input (uppercase, no spaces except formatted)
  codeInput?.addEventListener("input", (e) => {
    const target = e.target as HTMLInputElement;
    target.value = target.value.toUpperCase().replace(/[^A-Z0-9-]/g, "");
  });

  // Event listeners
  backButton?.addEventListener("click", options.onBack);
  form?.addEventListener("submit", handleVerify);

  options.onStepChange(1);

  return () => {
    // Cleanup
  };
}

function createVoucherFormTemplate(): string {
  return `
    <div>
      <button type="button" class="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6" data-back>
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/>
        </svg>
        Voltar
      </button>
      
      <form id="voucher-form" class="space-y-6">
        <!-- Info Card -->
        <div class="bg-gradient-to-br from-emerald-50 to-teal-50 p-5 rounded-2xl border border-emerald-200">
          <div class="flex items-start gap-4">
            <div class="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center flex-shrink-0">
              <svg class="w-6 h-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z"/>
              </svg>
            </div>
            <div>
              <h3 class="font-bold text-emerald-900 mb-1">Onde encontro meu código?</h3>
              <ul class="text-sm text-emerald-700 space-y-1">
                <li>• Recebido do seu <strong>fotógrafo</strong></li>
                <li>• E-mail de <strong>presente</strong> de alguém especial</li>
                <li>• Cartão físico junto a um presente</li>
              </ul>
            </div>
          </div>
        </div>
        
        <!-- Code Input -->
        <div>
          <label for="voucher-code" class="block text-sm font-medium text-gray-700 mb-2">
            Digite seu código
          </label>
          <input 
            type="text" 
            id="voucher-code"
            class="w-full py-4 px-5 text-center text-xl font-mono tracking-widest border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors uppercase"
            placeholder="XXXX-XXXX-XXXX"
            maxlength="20"
            autocomplete="off"
            autocapitalize="characters"
            required
          />
          <p class="text-xs text-gray-500 mt-2 text-center">
            Ex: FOTO-ABC123, GIFT-XYZ789, BB-123456
          </p>
        </div>
        
        <!-- Submit -->
        <button 
          type="submit"
          class="w-full py-4 px-6 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 transition-colors flex items-center justify-center"
          data-verify
        >
          <span class="btn-text">Verificar código</span>
        </button>
        
        <!-- Help -->
        <div class="text-center">
          <p class="text-sm text-gray-500">
            Não tem um código?
            <button type="button" class="text-indigo-600 font-semibold hover:underline ml-1" data-back>
              Comprar acesso
            </button>
          </p>
        </div>
      </form>
    </div>
  `;
}
