import { logger, withElement } from "../utils/logger";

// === PREMIUM: Hero Particles ===
export const initHeroParticles = () => {
  return withElement(
    ".hero-section",
    (heroSection) => {
      // Cria container de partículas
      const particlesContainer = document.createElement("div");
      particlesContainer.className = "hero-particles";
      particlesContainer.setAttribute("aria-hidden", "true");

      // Cria 6 partículas
      for (let i = 0; i < 6; i++) {
        const particle = document.createElement("div");
        particle.className = "hero-particle";
        particlesContainer.appendChild(particle);
      }

      // Adiciona ao hero (antes do conteúdo principal)
      heroSection.insertBefore(particlesContainer, heroSection.firstChild);

      logger.info("Hero particles initialized");

      // Retornar função de limpeza para remover as partículas quando desmontadas
      return () => {
        try {
          particlesContainer.remove();
          logger.debug("Hero particles removed");
        } catch (err) {
          logger.warn("Failed to remove hero particles", err);
        }
      };
    },
    "Hero particles: .hero-section not found",
  );
};
