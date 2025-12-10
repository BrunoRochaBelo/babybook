/**
 * Access Navigation - Setup de navegação para acesso
 *
 * O botão "Entrar" agora está diretamente no HTML, não precisa mais injetar via JS.
 * Este módulo apenas configura o link "É fotógrafo?" no footer.
 */

/**
 * Setup - adiciona link "É fotógrafo?" no footer
 */
export function setupAccessModal(): () => void {
  // O botão "Entrar" já está no HTML, não precisa injetar

  // Adicionar link "É fotógrafo?" no footer
  const footerBrandSection = document.querySelector('.site-footer .footer-section');
  if (footerBrandSection && !footerBrandSection.querySelector('[data-photographer-link]')) {
    const photographerLink = document.createElement('a');
    photographerLink.href = '/pro.html';
    photographerLink.setAttribute('data-photographer-link', '');
    photographerLink.className = 'inline-flex items-center gap-1 text-sm text-pink-400 hover:text-pink-300 transition-colors mt-4';
    photographerLink.innerHTML = `
      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"/>
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"/>
      </svg>
      É fotógrafo? Conheça o Baby Book Pro →
    `;
    footerBrandSection.appendChild(photographerLink);
  }

  return () => {};
}

export function mountAccessModal(): () => void {
  return setupAccessModal();
}
