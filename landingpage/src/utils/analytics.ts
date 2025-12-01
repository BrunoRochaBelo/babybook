// === SISTEMA DE ANALYTICS ===
export interface AnalyticsEvent {
  category: string;
  action: string;
  label?: string;
  value?: number;
}

export const trackEvent = (event: AnalyticsEvent) => {
  // Google Analytics 4
  if (typeof (window as any).gtag !== "undefined") {
    (window as any).gtag("event", event.action, {
      event_category: event.category,
      event_label: event.label,
      value: event.value,
    });
  }

  // Console log em desenvolvimento
  if (
    window.location.hostname === "localhost" ||
    window.location.hostname === "127.0.0.1"
  ) {
    console.log("📊 Analytics Event:", event);
  }
};

// === SCROLL DEPTH TRACKING ===
export const setupScrollDepthTracking = () => {
  const milestones = [25, 50, 75, 100];
  const tracked = new Set<number>();

  const onScroll = () => {
    const windowHeight =
      document.documentElement.scrollHeight - window.innerHeight;
    const scrolled = (window.pageYOffset / windowHeight) * 100;

    milestones.forEach((milestone) => {
      if (scrolled >= milestone && !tracked.has(milestone)) {
        tracked.add(milestone);
        trackEvent({
          category: "Scroll Depth",
          action: `Scrolled ${milestone}%`,
          label: window.location.pathname,
          value: milestone,
        });
      }
    });
  };

  window.addEventListener("scroll", onScroll, { passive: true });

  return () => {
    window.removeEventListener("scroll", onScroll);
  };
};

// === TRACK SEÇÃO VISUALIZADA ===
export const setupSectionViewTracking = () => {
  const sections = document.querySelectorAll("section[id]");
  const viewedSections = new Set<string>();

  const sectionObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const sectionId = entry.target.id;
          if (sectionId && !viewedSections.has(sectionId)) {
            viewedSections.add(sectionId);
            trackEvent({
              category: "Section View",
              action: "viewed",
              label: sectionId,
            });
          }
        }
      });
    },
    { threshold: 0.5 },
  );

  sections.forEach((section) => sectionObserver.observe(section));

  return () => {
    sectionObserver.disconnect();
  };
};
