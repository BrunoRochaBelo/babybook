import { CssModule, loadCssModule } from "./utils";

export async function setupBoardStyles(overrideStyles?: CssModule) {
  try {
    const styles = await loadCssModule(
      overrideStyles,
      () => import("../../styles/board.module.css"),
    );
    document
      .querySelectorAll(".board-notice")
      .forEach((el) => el.classList.add(styles.boardNotice));
    document
      .querySelectorAll(".board-notice .section-shell")
      .forEach((el) => el.classList.add(styles.boardNoticeShell));
    document
      .querySelectorAll(".sticky-note")
      .forEach((el) => el.classList.add(styles.stickyNote));
    document
      .querySelectorAll(".sticky-note-pin")
      .forEach((el) => el.classList.add(styles.stickyNotePin));
  } catch (err) {
    // non-fatal
  }
}
