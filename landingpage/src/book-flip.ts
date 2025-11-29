// Book 3D Flip Functionality
// Adiciona interatividade de flip 3D aos cards de livros

document.addEventListener('DOMContentLoaded', () => {
  // Selecionar todos os cards de livros (exceto o cofre que tem comportamento especial)
  const bookCards = document.querySelectorAll<HTMLElement>('.book-card:not(#vault-card)');
  
  bookCards.forEach((card, index) => {
    // Criar estrutura 3D
    const bookNumber = String(index + 1).padStart(2, '0');
    const emojiEl = card.querySelector('.text-4xl');
    const titleEl = card.querySelector('h3');
    const descEl = card.querySelector('p');
    
    if (!emojiEl?.textContent || !titleEl?.textContent || !descEl?.textContent) return;
    
    const emoji = emojiEl.textContent.trim();
    const title = titleEl.textContent.trim();
    const description = descEl.textContent.trim();
    
    // Criar nova estrutura com flip
    card.innerHTML = `
      <div class="book-3d-container" data-book="${index + 1}">
        <div class="book-3d-wrapper">
          <!-- Capa (Frente) -->
          <div class="book-face book-cover">
            <div class="book-spine"></div>
            <div class="book-cover-number">${bookNumber}</div>
            <div class="book-cover-content">
              <span class="book-cover-emoji" role="img">${emoji}</span>
              <h3 class="book-cover-title">${title}</h3>
            </div>
            <div class="book-interaction-hint">Clique para abrir</div>
          </div>
          
          <!-- Interior (Verso) -->
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
    
    // Adicionar event listeners
    const container = card.querySelector<HTMLElement>('.book-3d-container');
    const closeBtn = card.querySelector<HTMLButtonElement>('.book-close-btn');
    const cover = card.querySelector<HTMLElement>('.book-cover');
    
    if (!container || !closeBtn || !cover) return;
    
    // Toggle flip ao clicar na capa
    cover.addEventListener('click', (e) => {
      e.stopPropagation();
      container.classList.add('flipped');
    });
    
    // Fechar ao clicar no botão de fechar
    closeBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      container.classList.remove('flipped');
    });
    
    // Fechar ao clicar fora (opcional)
    document.addEventListener('click', (e) => {
      const target = e.target as Node;
      if (container.classList.contains('flipped') && !container.contains(target)) {
        container.classList.remove('flipped');
      }
    });
  });
  
  // Tratamento especial para o card do Cofre (mantém comportamento existente)
  const vaultCard = document.querySelector('#vault-card');
  if (vaultCard) {
    const vaultContainer = vaultCard.querySelector<HTMLElement>('.vault-content');
    if (vaultContainer) {
      // Criar estrutura 3D dentro do vault-content
      vaultContainer.innerHTML = `
        <div class="book-3d-container h-full" data-book="4">
          <div class="book-3d-wrapper">
            <!-- Capa (Frente) -->
            <div class="book-face book-cover">
              <div class="book-spine"></div>
              <div class="book-cover-number">04</div>
              <div class="book-cover-content">
                <span class="book-cover-emoji" role="img">🔓</span>
                <h3 class="book-cover-title">Cofre</h3>
              </div>
              <div class="book-interaction-hint">Clique para abrir</div>
            </div>
            
            <!-- Interior (Verso) -->
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
      
      const vaultBookContainer = vaultContainer.querySelector<HTMLElement>('.book-3d-container');
      const vaultCloseBtn = vaultContainer.querySelector<HTMLButtonElement>('.book-close-btn');
      const vaultCover = vaultContainer.querySelector<HTMLElement>('.book-cover');
      
      if (!vaultBookContainer || !vaultCloseBtn || !vaultCover) return;
      
      vaultCover.addEventListener('click', (e) => {
        e.stopPropagation();
        vaultBookContainer.classList.add('flipped');
      });
      
      vaultCloseBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        vaultBookContainer.classList.remove('flipped');
      });
    }
  }
});
