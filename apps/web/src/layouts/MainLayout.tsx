import React from "react";
import { Link, NavLink, Outlet } from "react-router-dom";
import {
  BookHeart,
  Stethoscope,
  UsersRound,
  UserRound,
  Shield,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { BBChildSwitcher } from "@/components/bb/ChildSwitcher";

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

export const MainLayout = () => {
  return (
    <div className="flex min-h-screen flex-col bg-background text-ink">
      <header className="sticky top-0 z-40 border-b border-border/80 bg-background/95 backdrop-blur-xl">
        <div className="mx-auto flex w-full max-w-5xl flex-wrap items-center gap-4 px-6 py-4">
          <Link to="/jornada" className="text-2xl font-serif text-ink">
            BabyBook
          </Link>
          <div className="ml-auto flex items-center gap-3">
            <BBChildSwitcher />
            <Link
              to="/perfil-usuario"
              className="inline-flex items-center gap-2 rounded-3xl border border-border bg-surface px-4 py-2 text-sm font-medium text-ink transition hover:border-ink/60 hover:text-accent"
            >
              <UserRound className="h-4 w-4" />
              Conta
            </Link>
          </div>
        </div>
      </header>
      <main className="mx-auto w-full max-w-5xl flex-1 px-6 pb-32 pt-8">
        <Outlet />
      </main>
      <nav className="fixed bottom-4 left-1/2 z-40 flex w-full max-w-3xl -translate-x-1/2 items-center rounded-full border border-border bg-surface/95 px-2 py-2 shadow-lg">
        {BOOKS_NAV.map((book) => {
          const Icon = book.icon;
          return (
            <NavLink
              key={book.id}
              to={book.to}
              className={({ isActive }) =>
                cn(
                  "flex flex-1 items-center justify-center rounded-full px-2 py-1 text-sm font-semibold transition",
                  isActive
                    ? "bg-primary px-6 py-3.5 text-primary-foreground shadow-[0_12px_30px_rgba(242,153,93,0.35)]"
                    : "text-ink-muted hover:text-ink",
                )
              }
            >
              {({ isActive }) => (
                <>
                  <Icon
                    className={cn(
                      "h-5 w-5",
                      isActive ? "text-primary-foreground" : "text-ink-muted",
                    )}
                  />
                  <span
                    className={cn(
                      "ml-0 text-sm font-semibold transition-all duration-200",
                      isActive ? "ml-3 opacity-100" : "sr-only opacity-0",
                    )}
                  >
                    {book.label}
                  </span>
                </>
              )}
            </NavLink>
          );
        })}
      </nav>
    </div>
  );
};
