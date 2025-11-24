import { trackEvent } from "../utils/analytics";

// === SERVICE WORKER REGISTRATION ===
export const registerServiceWorker = () => {
  // Service Worker só funciona em produção (https ou localhost em build)
  if ("serviceWorker" in navigator && import.meta.env.PROD) {
    window.addEventListener("load", () => {
      navigator.serviceWorker
        .register("/sw.js")
        .then((registration) => {
          console.log("✅ Service Worker registrado:", registration.scope);
          if (registration.waiting) {
            showUpdatePrompt(registration.waiting);
          }

          registration.addEventListener("updatefound", () => {
            const newWorker = registration.installing;
            if (newWorker) {
              newWorker.addEventListener("statechange", () => {
                if (
                  newWorker.state === "installed" &&
                  navigator.serviceWorker.controller
                ) {
                  console.log(
                    "🔄 Nova versão disponível! Recarregue a página.",
                  );
                  // Show update UI
                  showUpdatePrompt(newWorker);
                }
              });
            }
          });
        })
        .catch((error) => {
          console.warn("⚠️ Service Worker não registrado:", error.message);
        });
    });
  } else if ("serviceWorker" in navigator) {
    console.log("ℹ️ Service Worker desabilitado em desenvolvimento");
  }
};

// UI for Service Worker update prompt
function showUpdatePrompt(worker: ServiceWorker | null) {
  const existing = document.getElementById("sw-update-prompt");
  if (existing) return;

  const html = `
      <div id="sw-update-prompt" class="sw-update-prompt" role="alert">
        <div class="sw-update-body">Nova versão disponível</div>
        <div class="sw-update-actions">
          <button id="sw-update-refresh" class="sw-update-btn">Atualizar</button>
          <button id="sw-update-dismiss" class="sw-update-btn">Fechar</button>
        </div>
      </div>
    `;
  document.body.insertAdjacentHTML("beforeend", html);
  const prompt = document.getElementById("sw-update-prompt");
  const refresh = document.getElementById("sw-update-refresh");
  const dismiss = document.getElementById("sw-update-dismiss");

  refresh?.addEventListener("click", () => {
    if (worker) {
      // Send message to SW to skipWaiting
      worker.postMessage({ action: "skipWaiting" });
    }
    prompt?.remove();
    trackEvent({ category: "PWA", action: "update_prompt", label: "update" });
  });
  dismiss?.addEventListener("click", () => {
    prompt?.remove();
    trackEvent({ category: "PWA", action: "update_prompt", label: "dismiss" });
  });

  // When controller changes, reload the page to activate new SW
  navigator.serviceWorker.addEventListener("controllerchange", () => {
    window.location.reload();
  });
}
// === PWA INSTALL PROMPT ===
export const setupPWAInstall = () => {
  let deferredPrompt: any;
  const pwaPromptShown = localStorage.getItem("pwaPromptShown");
  // track dismissed update prompt handled earlier

  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();
    deferredPrompt = e;

    if (!pwaPromptShown) {
      setTimeout(showPWAPrompt, 10000);
    }
  });

  function showPWAPrompt() {
    if (!deferredPrompt) return;

    const promptHTML = `
      <div class="pwa-install-prompt" id="pwa-prompt">
        <div class="pwa-prompt-content">
          <div class="pwa-prompt-icon">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path>
            </svg>
          </div>
          <div class="pwa-prompt-text">
            <h4>Instalar Baby Book</h4>
            <p>Acesse offline e tenha uma experiência melhor</p>
          </div>
        </div>
        <div class="pwa-prompt-actions">
          <button class="pwa-prompt-btn pwa-prompt-dismiss" id="pwa-dismiss">Agora Não</button>
          <button class="pwa-prompt-btn pwa-prompt-install" id="pwa-install">Instalar</button>
        </div>
      </div>
    `;

    document.body.insertAdjacentHTML("beforeend", promptHTML);

    const prompt = document.getElementById("pwa-prompt");
    setTimeout(() => prompt?.classList.add("show"), 100);

    document
      .getElementById("pwa-install")
      ?.addEventListener("click", async () => {
        if (!deferredPrompt) return;

        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;

        console.log(`PWA install prompt: ${outcome}`);
        trackEvent({
          category: "PWA",
          action: "install_prompt",
          label: outcome,
        });

        deferredPrompt = null;
        prompt?.remove();
        localStorage.setItem("pwaPromptShown", "true");
      });

    document.getElementById("pwa-dismiss")?.addEventListener("click", () => {
      prompt?.remove();
      localStorage.setItem("pwaPromptShown", "true");
      trackEvent({ category: "PWA", action: "dismiss_prompt" });
    });
  }
};
