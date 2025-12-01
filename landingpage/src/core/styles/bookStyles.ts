import { CssModule, loadCssModule } from "./utils";

export async function setupBookStyles(overrideStyles?: CssModule) {
  try {
    const styles = await loadCssModule(
      overrideStyles,
      () => import("../../styles/book.module.css"),
    );
    document
      .querySelectorAll(".book-card")
      .forEach((el) => el.classList.add(styles.bookCard));
    // map group hover state
    document
      .querySelectorAll(".book-card.group")
      .forEach((el) => el.classList.add(styles.bookCardGroupHover));
    // apply will-change
    document
      .querySelectorAll(".book-card")
      .forEach((el) => el.classList.add(styles.bookCardWillChange));
  } catch (err) {
    // non-fatal
  }
}
