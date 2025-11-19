import './main.css'

document.addEventListener('DOMContentLoaded', () => {
            
    // 1. OBSERVER GENÉRICO (Fade In Up)
    const observerOptions = { threshold: 0.1, rootMargin: "0px 0px -50px 0px" };
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);
    document.querySelectorAll('.fade-in-up').forEach(el => observer.observe(el));

    // 2. CHAOS TO ORDER (Lógica ajustada)
    const chaosSection = document.querySelector('.chaos-container');
    const photos = document.querySelectorAll('.photo-scatter');
    const text1 = document.getElementById('chaos-text-1');
    const text2 = document.getElementById('chaos-text-2');
    const highlight = document.getElementById('chaos-highlight');
    
    if (chaosSection) {
        window.addEventListener('scroll', () => {
            const rect = chaosSection.getBoundingClientRect();
            // Calcula progresso dentro da seção (0 a 1)
            const progress = Math.max(0, Math.min(1, -rect.top / (rect.height - window.innerHeight)));
            
            if (progress > 0.25) {
                // Momento da "Ordem"
                photos.forEach(p => p.classList.add('organized'));
                if (highlight) {
                    highlight.style.color = "#F2995D"; // Using accent color
                    highlight.innerText = "Só precisava caber na vida real.";
                }
                if (text1) text1.classList.add('opacity-30'); // Esmaece texto antigo
                if (text2) text2.classList.remove('opacity-30'); // Revela texto novo
            } else {
                // Momento do "Caos"
                photos.forEach(p => p.classList.remove('organized'));
                if (highlight) {
                    highlight.style.color = "#9CA3AF";
                    highlight.innerText = "Só precisava caber na vida real."; // Mantem texto, muda cor
                }
                if (text1) text1.classList.remove('opacity-30');
                if (text2) text2.classList.add('opacity-30');
            }
        });
    }

    // 3. HORIZONTAL SCROLL & VAULT UNLOCK
    const scrollSection = document.querySelector('.horizontal-scroll-section') as HTMLElement;
    const track = document.querySelector('.horizontal-track') as HTMLElement;
    const vaultCard = document.getElementById('vault-card');
    
    if (scrollSection && track && vaultCard) {
        window.addEventListener('scroll', () => {
            const rect = scrollSection.getBoundingClientRect();
            const sectionHeight = scrollSection.offsetHeight - window.innerHeight;
            let percentage = Math.max(0, Math.min(1, -rect.top / sectionHeight));
            
            // Move o trilho
            const moveAmount = percentage * (track.scrollWidth - window.innerWidth);
            track.style.transform = `translateX(-${moveAmount}px)`;

            // Lógica do Cofre: Destrancar quando chegar quase no fim (90% do scroll da seção)
            // Isso cria a sensação de "mais um scroll" para abrir
            if (percentage > 0.92) {
                vaultCard.classList.add('is-unlocked');
            } else {
                vaultCard.classList.remove('is-unlocked');
            }
        });
    }

    // 4. TIMELINE DRAW ON SCROLL (Refined)
    const timelineContainer = document.getElementById('timeline-container');
    const progressBar = document.getElementById('timeline-progress');
    const stepItems = document.querySelectorAll('.step-item');

    if (timelineContainer && progressBar) {
        window.addEventListener('scroll', () => {
            const rect = timelineContainer.getBoundingClientRect();
            const windowHeight = window.innerHeight;
            const containerHeight = rect.height;
            
            // Ponto de início: quando o topo do container atinge o meio da tela
            // Ponto de fim: quando o fundo do container atinge o meio da tela
            const startOffset = windowHeight * 0.6; 
            const scrollPos = (windowHeight - rect.top) - startOffset;
            
            // Calcula porcentagem de preenchimento (0 a 100%)
            // Ajustamos o divisor para garantir que a linha termine exatamente no último item
            let percentage = (scrollPos / (containerHeight * 0.8)) * 100;
            percentage = Math.max(0, Math.min(100, percentage));
            
            progressBar.style.height = `${percentage}%`;

            // Lógica para ativar os itens individualmente
            stepItems.forEach((item, index) => {
                // Posição relativa do item dentro do container
                const itemTop = (item as HTMLElement).offsetTop;
                // Altura atual da linha em pixels
                const currentLineHeight = (percentage / 100) * containerHeight;

                if (currentLineHeight >= itemTop - 50) { // -50 para ativar um pouco antes de chegar
                    item.classList.remove('opacity-30');
                    // Ativa a cor da borda do círculo
                    const circle = item.querySelector('div');
                    if (circle) {
                        circle.classList.remove('border-gray-200', 'text-gray-400');
                        circle.classList.add('border-indigo-600', 'text-ink'); // Note: border-indigo-600 will be mapped to accent in tailwind config
                    }
                } else {
                    // Se o usuário rolar para cima, desativa (opcional)
                        if (index > 0) { // Mantém o primeiro sempre ativo se quiser
                        item.classList.add('opacity-30');
                        const circle = item.querySelector('div');
                        if (circle) {
                            circle.classList.remove('border-indigo-600', 'text-ink');
                            circle.classList.add('border-gray-200');
                        }
                        }
                }
            });
        });
    }

    // 5. FAQ ACCORDION
    document.querySelectorAll('.accordion-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const content = btn.nextElementSibling as HTMLElement;
            const isExpanded = btn.getAttribute('aria-expanded') === 'true';
            
            // Fecha todos
            document.querySelectorAll('.accordion-btn').forEach(b => {
                b.setAttribute('aria-expanded', 'false');
                const nextEl = b.nextElementSibling as HTMLElement;
                if (nextEl) nextEl.style.maxHeight = null as any;
            });

            // Abre atual se estava fechado
            if (!isExpanded) {
                btn.setAttribute('aria-expanded', 'true');
                if (content) content.style.maxHeight = content.scrollHeight + "px";
            }
        });
    });
});
