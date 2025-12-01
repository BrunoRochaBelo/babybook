import { CssModule, loadCssModule } from "./utils";

export async function setupFutureParallaxStyles(overrideStyles?: CssModule) {
  try {
    const styles = await loadCssModule(
      overrideStyles,
      () => import("../../styles/future-parallax.module.css"),
    );

    // Aplica a classe principal do módulo - os seletores aninhados no CSS
    // cuidarão dos elementos filhos (.group, .sectionShell, etc.)
    document
      .querySelectorAll(".future-parallax")
      .forEach((el) => el.classList.add(styles.futureParallax));

    // Aplica classes às camadas de parallax
    document
      .querySelectorAll(".future-parallax-layer")
      .forEach((el) => el.classList.add(styles.futureParallaxLayer));

    document
      .querySelectorAll(".future-parallax-gradient")
      .forEach((el) => el.classList.add(styles.futureParallaxGradient));

    document.querySelectorAll(".future-parallax-grid").forEach((el) => {
      el.classList.add(styles.futureParallaxGrid);
      // Aplica a imagem de fundo se existir no data attribute (evita duplicar)
      const imageUrl = el.getAttribute("data-layer-image");
      if (imageUrl && styles.futureParallaxGridInner) {
        // Verifica se já existe o inner element
        if (!el.querySelector(`.${styles.futureParallaxGridInner}`)) {
          const inner = document.createElement("div");
          inner.classList.add(styles.futureParallaxGridInner);
          inner.style.backgroundImage = `url(${imageUrl})`;
          el.appendChild(inner);
        }
      }
    });

    document.querySelectorAll(".future-parallax-ribbon").forEach((el) => {
      el.classList.add(styles.futureParallaxRibbon);
      // Cria o elemento interno do ribbon (evita duplicar)
      if (styles.futureParallaxRibbonInner) {
        // Verifica se já existe o inner element
        if (!el.querySelector(`.${styles.futureParallaxRibbonInner}`)) {
          const inner = document.createElement("div");
          inner.classList.add(styles.futureParallaxRibbonInner);
          // Aplica a imagem de fundo se existir no data attribute
          const imageUrl = el.getAttribute("data-layer-image");
          if (imageUrl && styles.futureParallaxRibbonImage) {
            const img = document.createElement("div");
            img.classList.add(styles.futureParallaxRibbonImage);
            img.style.backgroundImage = `url(${imageUrl})`;
            inner.appendChild(img);
          }
          el.appendChild(inner);
        }
      }
    });

    // Aplica classe aos cards da seção Futuro
    if (styles.futureCard) {
      document.querySelectorAll(".future-card").forEach((el) => {
        el.classList.add(styles.futureCard);
        // Força um fundo sólido em runtime para evitar efeitos de blend
        // que deixem os cards translúcidos. Também define z-index
        // e position para manter os cards acima das camadas parallax.
        const elh = el as HTMLElement;
        // Tenta ler a variável CSS do root com fallback
        const rootStyle = getComputedStyle(document.documentElement);
        const varColor = rootStyle
          .getPropertyValue("--brand-surface-muted")
          .trim();
        const bgColor = varColor || "#fdf9f5";
        // Só sobrescreve se não houver background-color inline já definido
        if (!elh.style.backgroundColor) {
          elh.style.backgroundColor = bgColor;
        }
        elh.style.position = elh.style.position || "relative";
        elh.style.zIndex = elh.style.zIndex || "3";
        elh.style.opacity = "1";
      });
    }
  } catch (err) {
    // non-fatal
  }
}
