/**
 * Baby Book Pro - Landing Page B2B
 *
 * Script entry point for the Pro landing page.
 * Uses vanilla TypeScript (same pattern as main.ts).
 */

// === STYLES ===
import "./styles/main.css";
import "./styles/animations.css";

// === ANTI-FOUC ===
if (!document.documentElement.classList.contains("styles-loaded")) {
  document.body.style.visibility = "hidden";
  document.body.style.opacity = "0";
}

document.documentElement.classList.add("styles-loaded");

setTimeout(() => {
  document.body.style.visibility = "visible";
  document.body.style.opacity = "1";
  document.body.style.transition = "opacity 0.3s ease-out";
}, 50);

// === SMOOTH SCROLL ===
function initSmoothScrollForAnchors(): void {
  document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener("click", (e) => {
      e.preventDefault();
      const targetId = (anchor as HTMLAnchorElement)
        .getAttribute("href")
        ?.substring(1);
      if (targetId) {
        const target = document.getElementById(targetId);
        if (target) {
          target.scrollIntoView({
            behavior: "smooth",
            block: "start",
          });
        }
      }
    });
  });
}

// === HEADER SCROLL EFFECT ===
function initHeaderScrollEffect(): void {
  const header = document.querySelector("header");
  if (!header) return;

  window.addEventListener("scroll", () => {
    const currentScrollY = window.scrollY;

    if (currentScrollY > 100) {
      header.classList.add("shadow-md");
    } else {
      header.classList.remove("shadow-md");
    }
  });
}

// === INTERSECTION OBSERVER FOR ANIMATIONS ===
function initScrollAnimations(): void {
  const observerOptions: IntersectionObserverInit = {
    threshold: 0.1,
    rootMargin: "0px 0px -50px 0px",
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("animate-fade-in-up");
        observer.unobserve(entry.target);
      }
    });
  }, observerOptions);

  // Observe feature cards, pricing cards, and testimonials
  document.querySelectorAll("section > div > div.grid > div").forEach((el) => {
    el.classList.add("opacity-0");
    observer.observe(el);
  });

  // Observe step cards
  document
    .querySelectorAll("section#como-funciona .space-y-8 > div")
    .forEach((el) => {
      el.classList.add("opacity-0");
      observer.observe(el);
    });
}

// === APP URL CONFIGURATION ===
function getAppBaseUrl(): string {
  // In production, the app would be on a different domain/subdomain
  // For now, we use relative paths that will work with proper routing
  const hostname = window.location.hostname;

  if (hostname === "localhost" || hostname === "127.0.0.1") {
    // Development: Point to the web app dev server
    return "http://localhost:5173";
  }

  // Production: Assume app is on app.babybook.com.br or similar
  // This can be configured via environment variables
  return "https://app.babybook.com.br";
}

function updateAppLinks(): void {
  const appBaseUrl = getAppBaseUrl();

  // Update all links that point to /app/*
  document.querySelectorAll('a[href^="/app/"]').forEach((link) => {
    const anchor = link as HTMLAnchorElement;
    const path = anchor.getAttribute("href")?.replace("/app", "") || "";
    anchor.href = appBaseUrl + path;
  });
}

// === INITIALIZE ===
document.addEventListener("DOMContentLoaded", () => {
  console.log("[Baby Book Pro] Initializing landing page...");

  initSmoothScrollForAnchors();
  initHeaderScrollEffect();
  initScrollAnimations();
  updateAppLinks();

  console.log("[Baby Book Pro] Landing page ready!");
});

// === CSS ANIMATIONS (added via JS to avoid extra CSS file) ===
const style = document.createElement("style");
style.textContent = `
  @keyframes fadeInUp {
    from {
      opacity: 0;
      transform: translateY(20px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
  
  .animate-fade-in-up {
    animation: fadeInUp 0.6s ease-out forwards;
  }
  
  .opacity-0 {
    opacity: 0;
  }
`;
document.head.appendChild(style);
