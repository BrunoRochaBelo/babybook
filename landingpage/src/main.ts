import './main.css'
import Lenis from 'lenis'

// Initialize Lenis for smooth scrolling
const lenis = new Lenis({
    duration: 1.2,
    easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    orientation: 'vertical',
    gestureOrientation: 'vertical',
    smoothWheel: true,
    wheelMultiplier: 1,
    touchMultiplier: 2,
})

function raf(time: number) {
    lenis.raf(time)
    requestAnimationFrame(raf)
}

requestAnimationFrame(raf)

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
            
            // FASE 1: Texto (0.3)
            if (progress > 0.3) {
                if (highlight) {
                    highlight.style.color = "#F2995D"; // Using accent color
                    highlight.innerText = "Só precisava caber na vida real.";
                }
                if (text1) text1.classList.add('opacity-30'); // Esmaece texto antigo
                if (text2) text2.classList.remove('opacity-30'); // Revela texto novo
            } else {
                if (highlight) {
                    highlight.style.color = "#9CA3AF";
                    highlight.innerText = "Só precisava caber na vida real."; // Mantem texto, muda cor
                }
                if (text1) text1.classList.remove('opacity-30');
                if (text2) text2.classList.add('opacity-30');
            }

            // FASE 2: Fotos (0.6) - Só acontece DEPOIS do texto
            if (progress > 0.6) {
                photos.forEach(p => p.classList.add('organized'));
            } else {
                photos.forEach(p => p.classList.remove('organized'));
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
            const rawPercentage = Math.max(0, Math.min(1, -rect.top / sectionHeight));
            
            // FASES DA ANIMAÇÃO (Ajustado com feedback v4 - Resistência)
            // 0% - 60%: Scroll Horizontal (Move o trilho de 0 a 100%)
            // 60% - 90%: Destrancar Cofre (Trilho parado, "dead zone" MUITO longa, tensão visual)
            // 90% - 100%: Abrir Cofre (Trilho parado, conteúdo revela)

            let movePercentage = 0;
            
            if (rawPercentage < 0.60) {
                // Normalizando 0-0.60 para 0-1
                movePercentage = rawPercentage / 0.60;
            } else {
                // Travado no fim do trilho a partir de 60%
                movePercentage = 1;
            }

            // Move o trilho
            const moveAmount = movePercentage * (track.scrollWidth - window.innerWidth);
            track.style.transform = `translateX(-${moveAmount}px)`;

            // Lógica do Cofre
            const lockIcon = vaultCard.querySelector('.vault-locked .text-5xl') as HTMLElement; // Seleciona o ícone do cadeado

            // Fase 2: Destrancar (60% a 90%)
            // Resistência: O usuário precisa rolar bastante. Adicionamos tensão visual.
            if (rawPercentage > 0.60 && rawPercentage <= 0.90) {
                // REMOVIDO: vaultCard.classList.add('is-unlocked'); -> Isso abria o cofre visualmente!
                if (lockIcon) lockIcon.classList.remove('animate-bounce'); // Remove animação padrão para não conflitar
                
                // Calcula tensão de 0 a 1 dentro da fase de travamento
                const tension = (rawPercentage - 0.60) / 0.30;
                
                // Aplica efeito de "tremor" ou "pressão" baseado na tensão
                // Tremor aleatório aumenta com a tensão
                const shake = tension * 5; // Max 5px shake
                const randomX = (Math.random() - 0.5) * shake;
                const randomY = (Math.random() - 0.5) * shake;
                const scale = 1 - (tension * 0.1); // Encolhe levemente (pressão)

                if (lockIcon) {
                    lockIcon.style.transform = `translate(${randomX}px, ${randomY}px) scale(${scale})`;
                }

            } else if (rawPercentage <= 0.60) {
                vaultCard.classList.remove('is-unlocked');
                if (lockIcon) {
                    lockIcon.style.transform = 'none'; // Reseta
                    lockIcon.classList.add('animate-bounce'); // Devolve a animação se voltar
                }
            }

            // Fase 3: Abrir (90% a 100%)
            if (rawPercentage > 0.90) {
                vaultCard.classList.add('is-open');
                const lockedState = vaultCard.querySelector('.vault-locked') as HTMLElement;
                if (lockedState) lockedState.style.opacity = '0';
                if (lockIcon) lockIcon.style.transform = 'scale(1.2)'; // Pop final ao abrir (opcional, mas já está sumindo com opacity)
            } else {
                vaultCard.classList.remove('is-open');
                const lockedState = vaultCard.querySelector('.vault-locked') as HTMLElement;
                if (lockedState) lockedState.style.opacity = '1';
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
