import { useState } from "react";
import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";
import {
  BookHeart,
  Stethoscope,
  UsersRound,
  Shield,
  Bell,
  ChevronDown,
} from "lucide-react";
import { LayoutGroup, motion } from "motion/react";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/store/auth";
import { useLogout } from "@/hooks/api";
import { useSelectedChild } from "@/hooks/useSelectedChild";
import { B2CNotificationsDrawer } from "@/components/B2CNotificationsDrawer";
import { B2CMainDrawer } from "@/components/B2CMainDrawer";
import { BabyBookLogo } from "@/components/BabyBookLogo";
import { useNotifications } from "@/contexts/NotificationsContext";

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
  const navigate = useNavigate();
  const [isNotificationsOpen, setNotificationsOpen] = useState(false);
  const [isMainDrawerOpen, setMainDrawerOpen] = useState(false);

  // Contexto compartilhado de notificações
  const {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
  } = useNotifications();

  const { children: childrenList, selectedChild, setSelectedChildId } = useSelectedChild();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const user = useAuthStore((state) => state.user);
  const clearAuth = useAuthStore((state) => state.logout);
  const logoutMutation = useLogout();

  const handleNotificationClick = (notification: { id: string; link?: string }) => {
    markAsRead(notification.id);
    if (notification.link) {
      navigate(notification.link);
    }
  };

  const handleLogout = async () => {
    try {
      await logoutMutation.mutateAsync();
      clearAuth();
      navigate("/login");
    } catch (error) {
      console.error("Logout failed:", error);
      clearAuth();
      navigate("/login");
    }
  };

  return (
    <div
      className="app-b2c flex min-h-screen flex-col"
      style={{
        backgroundColor: "var(--bb-color-bg)",
        color: "var(--bb-color-ink)",
      }}
    >
      <header
        className="sticky top-0 z-40 backdrop-blur-xl"
        style={{
          backgroundColor: "var(--bb-color-bg)",
          borderBottom: "1px solid var(--bb-color-border)",
        }}
      >
        <div className="mx-auto w-full max-w-5xl px-4 py-3">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <Link
                to="/jornada"
                className="flex items-center gap-2"
              >
                <BabyBookLogo variant="b2c" size="md" />
              </Link>
            </div>
            <div className="ml-auto flex items-center gap-2">
              {/* Notifications Button */}
              <button
                type="button"
                onClick={() => {
                  setMainDrawerOpen(false);
                  setNotificationsOpen(true);
                }}
                className="relative inline-flex items-center justify-center rounded-2xl border px-3 py-1.5 transition"
                style={{
                  borderColor: "var(--bb-color-border)",
                  backgroundColor: "var(--bb-color-surface)",
                  color: "var(--bb-color-ink)",
                }}
                aria-label="Central de notificações"
              >
                <Bell className="h-4 w-4" />
                {unreadCount > 0 && (
                  <span
                    className="absolute -top-1 -right-1 inline-flex h-4 min-w-[16px] items-center justify-center rounded-full px-1 text-[10px] font-semibold"
                    style={{
                      backgroundColor: "var(--bb-color-accent)",
                      color: "var(--bb-color-surface)",
                    }}
                  >
                    {unreadCount}
                  </span>
                )}
              </button>

              {/* Main Drawer Button */}
              {isAuthenticated ? (
                <button
                  type="button"
                  onClick={() => {
                    setNotificationsOpen(false);
                    setMainDrawerOpen(true);
                  }}
                  className="inline-flex items-center gap-2 rounded-2xl border px-4 py-2 text-sm font-medium transition hover:shadow-sm"
                  style={{
                    borderColor: "var(--bb-color-border)",
                    backgroundColor: "var(--bb-color-surface)",
                    color: "var(--bb-color-ink)",
                  }}
                  aria-label="Abrir menu principal"
                >
                  <span className="font-semibold">
                    {selectedChild?.name || "Cadastre uma criança"}
                  </span>
                  <ChevronDown className="h-4 w-4 text-[var(--bb-color-ink-muted)]" />
                </button>
              ) : (
                <Link
                  to="/login"
                  className="ml-2 text-sm font-semibold"
                  style={{ color: "var(--bb-color-ink)" }}
                >
                  Entrar
                </Link>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-5xl flex-1 px-6 pb-32 pt-8">
        <Outlet />
      </main>

      {/* Floating Bottom Navigation */}
      <nav
        className="fixed bottom-4 left-1/2 z-40 flex w-full max-w-3xl -translate-x-1/2 items-center rounded-full px-2 py-2 shadow-lg"
        style={{
          backgroundColor: "var(--bb-color-nav-bg)",
          borderColor: "var(--bb-color-border)",
          border: "2px solid var(--bb-color-border)",
        }}
        aria-label="Navegação dos livros"
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
                    "relative isolate flex flex-1 items-center justify-center overflow-hidden rounded-full text-sm font-semibold transition-all duration-300 ease-out",
                    isActive ? "px-6 py-3" : "px-3 py-2"
                  )
                }
                style={({ isActive }) => ({
                  color: isActive
                    ? "var(--bb-color-surface)"
                    : "var(--bb-color-ink-muted)",
                })}
              >
                {({ isActive }) => (
                  <>
                    {isActive && (
                      <motion.span
                        layoutId="book-nav-pill"
                        initial={false}
                        className="absolute inset-0 rounded-full"
                        style={{
                          backgroundColor: "var(--bb-color-ink)",
                          boxShadow: "0 12px 26px rgba(42,42,42,0.35)",
                        }}
                        transition={{
                          type: "spring",
                          stiffness: 400,
                          damping: 30,
                        }}
                      />
                    )}
                    <span className="relative z-10 inline-flex items-center gap-2">
                      <Icon
                        className="h-5 w-5 transition-colors duration-300"
                        style={{
                          color: isActive
                            ? "var(--bb-color-surface)"
                            : "var(--bb-color-ink-muted)",
                        }}
                      />
                      {isActive && (
                        <span className="text-sm font-semibold tracking-tight">
                          {book.label}
                        </span>
                      )}
                    </span>
                  </>
                )}
              </NavLink>
            );
          })}
        </LayoutGroup>
      </nav>

      {/* Notifications Drawer */}
      <B2CNotificationsDrawer
        open={isNotificationsOpen}
        onOpenChange={setNotificationsOpen}
        notifications={notifications}
        onNotificationClick={handleNotificationClick}
        onMarkAsRead={markAsRead}
        onMarkAllAsRead={markAllAsRead}
      />

      {/* Main Drawer */}
      <B2CMainDrawer
        open={isMainDrawerOpen}
        onOpenChange={setMainDrawerOpen}
        userName={user?.name}
        userEmail={user?.email}
        children={childrenList}
        selectedChild={selectedChild}
        onSelectChild={setSelectedChildId}
        onLogout={handleLogout}
        isLoggingOut={logoutMutation.isPending}
      />
    </div>
  );
};
