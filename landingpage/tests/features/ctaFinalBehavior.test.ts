import { initCtaFinalBehavior } from "../../src/features/ctaFinalBehavior";

describe("CTA Final Behavior - DOM wrapper fallbacks", () => {
  beforeEach(() => {
    // Clean DOM
    document.body.innerHTML = "";
  });

  test("creates wrapper and lock when missing", () => {
    const section = document.createElement("section");
    section.className = "cta-final section-shell section-surface section-surface--cta";
    document.body.appendChild(section);

    const disposer = initCtaFinalBehavior();
    // ensure wrappers created
    const wrapper = document.querySelector(".cta-final-stage");
    const lock = document.querySelector(".cta-final-lock");
    const finalSection = document.querySelector(".cta-final");

    expect(wrapper).toBeTruthy();
    expect(lock).toBeTruthy();
    expect(finalSection?.parentElement).toBe(lock);
    expect(lock?.parentElement).toBe(wrapper);

    disposer && typeof disposer === "function" ? disposer() : null;
  });

  test("unwraps merged wrapper/lock into distinct wrapper and lock", () => {
    const merged = document.createElement("div");
    merged.className = "cta-final-stage cta-final-lock";
    const section = document.createElement("section");
    section.className = "cta-final section-shell section-surface section-surface--cta";
    merged.appendChild(section);
    document.body.appendChild(merged);

    const disposer = initCtaFinalBehavior();
    const wrapper = document.querySelector(".cta-final-stage");
    const lock = document.querySelector(".cta-final-lock");

    // They must not be the same node anymore
    expect(wrapper && lock).toBeTruthy();
    expect(wrapper === lock).toBe(false);
    expect(lock?.parentElement).toBe(wrapper);

    disposer && typeof disposer === "function" ? disposer() : null;
  });
});
