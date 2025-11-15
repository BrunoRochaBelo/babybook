import { useEffect } from "react";

export function useScrollReveal() {
  useEffect(() => {
    const observerOptions = {
      threshold: 0.15,
      rootMargin: "0px 0px -100px 0px",
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("section-visible");
          entry.target.classList.remove("section-reveal");
          observer.unobserve(entry.target);
        }
      });
    }, observerOptions);

    // Observa todas as seções exceto a primeira (hero)
    const sections = Array.from(
      document.querySelectorAll("section:not(:first-child)"),
    );

    sections.forEach((section) => {
      section.classList.add("section-reveal");
      observer.observe(section);
    });

    return () => {
      sections.forEach((section) => {
        observer.unobserve(section);
        section.classList.remove("section-reveal");
        section.classList.remove("section-visible");
      });
    };
  }, []);
}
