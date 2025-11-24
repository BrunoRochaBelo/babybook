export async function setupBookStyles() {
  try {
    const mod = await import("../styles/book.module.css");
    const styles = mod.default || mod;
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
