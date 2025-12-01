import { logger } from "../../utils/logger";

// === Book Flip Interactivity ===
export const setupBookFlip = () => {
  // Carousel track or book cards
  const bookCards = document.querySelectorAll<HTMLElement>(
    ".book-card:not(#vault-card)",
  );

  const disposers: Array<() => void> = [];

  if (!bookCards.length) {
    logger.info("setupBookFlip", "No book cards found");
    return null;
  }

  // Keep original innerHTML if we need to restore
  const originalHTML = new Map<HTMLElement, string>();

  // Store individual handlers for cleanup
  const handlers: Array<{
    el: HTMLElement;
    onCoverClick?: (e: MouseEvent) => void;
    onClose?: (e: MouseEvent) => void;
  }> = [];

  // Global document click to close flipped item when clicking outside
  const onDocumentClick = (e: MouseEvent) => {
    const target = e.target as Node;
    // Close any flipped container when clicked outside
    document
      .querySelectorAll<HTMLElement>(".book-3d-container.flipped")
      .forEach((container) => {
        if (!container.contains(target)) {
          container.classList.remove("flipped");
        }
      });
  };
  document.addEventListener("click", onDocumentClick);
  disposers.push(() => document.removeEventListener("click", onDocumentClick));

  // Iterate each book card and add 3d markup and handlers
  bookCards.forEach((card, index) => {
    const emojiEl = card.querySelector(".text-4xl");
    const titleEl = card.querySelector("h3");
    const descEl = card.querySelector("p");

    if (!emojiEl?.textContent || !titleEl?.textContent || !descEl?.textContent)
      return;

    const emoji = emojiEl.textContent.trim();
    const title = titleEl.textContent.trim();
    const description = descEl.textContent.trim();

    originalHTML.set(card, card.innerHTML);

    card.innerHTML = `
      <div class="book-3d-container" data-book="${index + 1}">
        <div class="book-3d-wrapper">
          <div class="book-face book-cover">
            <div class="book-spine"></div>
            <div class="book-cover-number">${String(index + 1).padStart(2, "0")}</div>
            <div class="book-cover-content">
              <span class="book-cover-emoji" role="img">${emoji}</span>
              <h3 class="book-cover-title">${title}</h3>
            </div>
            <div class="book-interaction-hint">Clique para abrir</div>
          </div>
          <div class="book-face book-interior">
            <button class="book-close-btn" aria-label="Fechar livro">×</button>
            <div class="book-interior-content">
              <span class="book-interior-emoji" role="img">${emoji}</span>
              <h3 class="book-interior-title">${title}</h3>
              <p class="book-interior-description">${description}</p>
            </div>
          </div>
        </div>
      </div>
    `;

    const container = card.querySelector<HTMLElement>(".book-3d-container");
    const cover = card.querySelector<HTMLElement>(".book-cover");
    const closeBtn = card.querySelector<HTMLButtonElement>(".book-close-btn");

    if (!container || !cover || !closeBtn) return;

    const coverClick = (e: MouseEvent) => {
      e.stopPropagation();
      if (card.classList.contains("is-center")) {
        container.classList.add("flipped");
      } else {
        (card as HTMLElement).click();
      }
    };
    cover.addEventListener("click", coverClick);

    const closeClick = (e: MouseEvent) => {
      e.stopPropagation();
      container.classList.remove("flipped");
    };
    closeBtn.addEventListener("click", closeClick);

    handlers.push({ el: card, onCoverClick: coverClick, onClose: closeClick });
  });

  // Special: Vault card
  const vaultCard = document.querySelector<HTMLElement>("#vault-card");
  if (vaultCard) {
    const vaultContainer =
      vaultCard.querySelector<HTMLElement>(".vault-content");
    if (vaultContainer) {
      const originalVaultHTML = vaultContainer.innerHTML;
      originalHTML.set(vaultContainer, originalVaultHTML);

      vaultContainer.innerHTML = `
        <div class="book-3d-container h-full" data-book="4">
          <div class="book-3d-wrapper">
            <div class="book-face book-cover">
              <div class="book-spine"></div>
              <div class="book-cover-number">04</div>
              <div class="book-cover-content">
                <span class="book-cover-emoji" role="img">🔓</span>
                <h3 class="book-cover-title">Cofre</h3>
              </div>
              <div class="book-interaction-hint">Clique para abrir</div>
            </div>
            <div class="book-face book-interior">
              <button class="book-close-btn" aria-label="Fechar livro">×</button>
              <div class="book-interior-content">
                <span class="book-interior-emoji" role="img">🔓</span>
                <h3 class="book-interior-title">Cofre</h3>
                <p class="book-interior-description">Documentos importantes protegidos. Certidão, exames, o essencial sempre à mão.</p>
              </div>
            </div>
          </div>
        </div>
      `;

      const vaultBookContainer =
        vaultContainer.querySelector<HTMLElement>(".book-3d-container");
      const vaultCloseBtn =
        vaultContainer.querySelector<HTMLButtonElement>(".book-close-btn");
      const vaultCover =
        vaultContainer.querySelector<HTMLElement>(".book-cover");

      const vaultCoverClick = (e: MouseEvent) => {
        e.stopPropagation();
        if (vaultCard.classList.contains("is-center")) {
          vaultBookContainer?.classList.add("flipped");
        } else {
          (vaultCard as HTMLElement).click();
        }
      };
      const vaultCloseClick = (e: MouseEvent) => {
        e.stopPropagation();
        vaultBookContainer?.classList.remove("flipped");
      };

      vaultCover?.addEventListener("click", vaultCoverClick);
      vaultCloseBtn?.addEventListener("click", vaultCloseClick);

      disposers.push(() => {
        vaultCover?.removeEventListener("click", vaultCoverClick);
        vaultCloseBtn?.removeEventListener("click", vaultCloseClick);
        if (originalHTML.has(vaultContainer)) {
          vaultContainer.innerHTML = originalHTML.get(vaultContainer) || "";
        }
      });
    }
  }

  // Return disposer that removes all handlers & optionally restores original HTML
  return () => {
    try {
      // Remove card handlers
      handlers.forEach(({ el, onCoverClick, onClose }) => {
        const cover = el.querySelector<HTMLElement>(".book-cover");
        const closeBtn = el.querySelector<HTMLButtonElement>(".book-close-btn");
        if (cover && onCoverClick)
          cover.removeEventListener("click", onCoverClick);
        if (closeBtn && onClose) closeBtn.removeEventListener("click", onClose);
        // Restore inner HTML
        if (originalHTML.has(el)) {
          el.innerHTML = originalHTML.get(el) || "";
        }
      });

      // Run other disposers (global doc & vault cleanup)
      disposers.forEach((d) => d());
    } catch (err) {
      logger.warn("setupBookFlip: cleanup error", err);
    }
  };
};

export default setupBookFlip;
