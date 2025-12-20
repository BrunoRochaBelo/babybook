import React, { useEffect, useRef, useState } from "react";
import { Link, NavLink, Outlet } from "react-router-dom";
import {
  BookHeart,
  Stethoscope,
  UsersRound,
  Shield,
  Bell,
  Sparkles,
} from "lucide-react";
import { LayoutGroup, motion } from "motion/react";
import { cn } from "@/lib/utils";
import { BBChildSwitcher } from "@/components/bb/ChildSwitcher";
import { useAuthStore } from "@/store/auth";

const BOOKS_NAV = [
  {
    id: "jornada",
    label: "Jornada",
    to: "/jornada",
    icon: BookHeart,
  },
  {
    id: "saude",
    label: "Saúde",
    to: "/saude",
    icon: Stethoscope,
  },
  {
    id: "visitas",
    label: "Visitas",
    to: "/visitas",
    icon: UsersRound,
  },
  {
    id: "cofre",
    label: "Cofre",
    to: "/cofre",
    icon: Shield,
  },
];

const FEATURED_NOTIFICATIONS = [
  {
    id: "notif-1",
    title: "Momento aprovado",
    description: "“Primeiro sorriso” agora está visível para a família.",
    time: "Há 2 horas",
  },
  {
    id: "notif-2",
    title: "Convite aceito",
    description: "Helena entrou como Madrinha no Livro de Visitas.",
    time: "Ontem",
  },
];

export const MainLayout = () => {
  const [isNotificationsOpen, setNotificationsOpen] = useState(false);
  const [isChildSwitcherOpen, setChildSwitcherOpen] = useState(false);
  const notificationsRef = useRef<HTMLDivElement | null>(null);
  const headerRef = useRef<HTMLDivElement | null>(null);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  useEffect(() => {
    if (!isNotificationsOpen) {
      return;
    }
    const handleClickOutside = (event: MouseEvent) => {
      if (
        notificationsRef.current &&
        event.target instanceof Node &&
        !notificationsRef.current.contains(event.target)
      ) {
        setNotificationsOpen(false);
      }
    };
    document.addEventListener("pointerdown", handleClickOutside);
    return () =>
      document.removeEventListener("pointerdown", handleClickOutside);
  }, [isNotificationsOpen]);

  return (
    <div className="flex min-h-screen flex-col bg-background text-ink">
      <header
        className="sticky top-0 z-40 border-b border-border/60 bg-background/95 backdrop-blur-xl"
        ref={headerRef}
      >
        <div className="mx-auto w-full max-w-5xl px-4 py-3">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <Link
                to="/jornada"
                className="flex items-center gap-2 text-2xl font-serif text-ink"
              >
                <Sparkles className="h-5 w-5 text-primary" />
                BabyBook
              </Link>
              <p className="hidden text-xs uppercase tracking-[0.4em] text-ink-muted sm:inline">
                Memórias privadas
              </p>
            </div>
            <div className="ml-auto flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setChildSwitcherOpen(false);
                  setNotificationsOpen((state) => !state);
                }}
                className={cn(
                  "relative inline-flex items-center justify-center rounded-2xl border px-3 py-1.5 transition",
                  isNotificationsOpen
                    ? "border-ink bg-ink text-surface"
                    : "border-border bg-surface hover:border-ink/60",
                )}
                aria-label="Central de notificações"
                aria-expanded={isNotificationsOpen}
                aria-controls="notification-panel"
              >
                <Bell className="h-4 w-4" />
                <span className="absolute -top-1 -right-1 inline-flex h-4 min-w-[16px] items-center justify-center rounded-full bg-primary px-1 text-[10px] font-semibold text-primary-foreground">
                  2
                </span>
              </button>
              <BBChildSwitcher
                isOpen={isChildSwitcherOpen}
                onOpenChange={(open) => {
                  setChildSwitcherOpen(open);
                  if (open) {
                    setNotificationsOpen(false);
                  }
                }}
              />
              {!isAuthenticated && (
                <Link to="/login" className="ml-2 text-sm font-semibold">
                  Entrar
                </Link>
              )}
            </div>
          </div>
          <div className="relative mt-3" ref={notificationsRef}>
            {isNotificationsOpen && (
              <div
                id="notification-panel"
                className="absolute right-0 z-30 w-full max-w-sm rounded-[28px] border border-border bg-surface shadow-2xl"
              >
                <div className="flex items-center justify-between border-b border-border/60 px-4 py-3">
                  <p className="text-xs uppercase tracking-[0.3em] text-ink-muted">
                    Notificações
                  </p>
                  <button
                    type="button"
                    className="text-xs font-semibold uppercase tracking-[0.3em] text-ink-muted transition hover:text-ink"
                  >
                    Ver tudo
                  </button>
                </div>
                <div className="divide-y divide-border/60">
                  {FEATURED_NOTIFICATIONS.map((notification) => (
                    <div key={notification.id} className="px-4 py-3 text-sm">
                      <p className="font-semibold text-ink">
                        {notification.title}
                      </p>
                      <p className="text-xs text-ink-muted">
                        {notification.description}
                      </p>
                      <p className="mt-2 text-[11px] uppercase tracking-[0.3em] text-ink-muted">
                        {notification.time}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </header>
      <main className="mx-auto w-full max-w-5xl flex-1 px-6 pb-32 pt-8">
        <Outlet />
      </main>
      <nav
        className="fixed bottom-4 left-1/2 z-40 flex w-full max-w-3xl -translate-x-1/2 items-center rounded-full border border-border bg-surface/95 px-2 py-2 shadow-lg"
        aria-label="Navega\u00e7\u00e3o dos livros"
      >
        <LayoutGroup id="book-nav">
          {BOOKS_NAV.map((book) => {
            const Icon = book.icon;
            return (
              <NavLink
                key={book.id}
                to={book.to}
                className={({ isActive }) =>
                  cn(
                    "relative isolate flex flex-1 items-center justify-center overflow-hidden rounded-full text-sm font-semibold transition-colors duration-300",
                    isActive
                      ? "px-6 py-3 text-surface"
                      : "px-3 py-2 text-ink-muted hover:text-ink",
                  )
                }
              >
                {({ isActive }) => (
                  <>
                    {isActive && (
                      <motion.span
                        layoutId="book-nav-pill"
                        className="absolute inset-0 rounded-full bg-ink shadow-[0_12px_26px_rgba(42,42,42,0.35)]"
                        transition={{
                          type: "spring",
                          stiffness: 360,
                          damping: 28,
                        }}
                      />
                    )}
                    <span className="relative z-10 inline-flex items-center gap-2">
                      <Icon
                        className={cn(
                          "h-5 w-5 transition-colors duration-300",
                          isActive ? "text-surface" : "text-ink-muted",
                        )}
                      />
                      <span
                        className={cn(
                          "text-sm font-semibold tracking-tight transition-[opacity,transform] duration-300",
                          isActive
                            ? "translate-x-0 opacity-100"
                            : "translate-x-2 opacity-0",
                        )}
                      >
                        {book.label}
                      </span>
                    </span>
                  </>
                )}
              </NavLink>
            );
          })}
        </LayoutGroup>
      </nav>
    </div>
  );
};
