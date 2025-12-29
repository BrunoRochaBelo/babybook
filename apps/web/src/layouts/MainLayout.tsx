import { useState } from "react";
import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";
import {
  BookHeart,
  Stethoscope,
  UsersRound,
  Shield,
  Bell,
  Sparkles,
  User,
} from "lucide-react";
import { LayoutGroup, motion } from "motion/react";
import { cn } from "@/lib/utils";
import { BBChildSwitcher } from "@/components/bb/ChildSwitcher";
import { useAuthStore } from "@/store/auth";
import { useLogout } from "@/hooks/api";
import {
  B2CNotificationsDrawer,
  type B2CNotification,
} from "@/components/B2CNotificationsDrawer";
import { B2CUserDrawer } from "@/components/B2CUserDrawer";

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

// Notificações de exemplo - em produção viriam de uma API
const INITIAL_NOTIFICATIONS: B2CNotification[] = [
  {
    id: "notif-1",
    title: "Momento aprovado",
    description: "Primeiro sorriso agora está visível para a família.",
    time: "Há 2 horas",
    unread: true,
  },
  {
    id: "notif-2",
    title: "Convite aceito",
    description: "Helena entrou como Madrinha no Livro de Visitas.",
    time: "Ontem",
    unread: true,
  },
  {
    id: "notif-3",
    title: "Novo marco alcançado",
    description: "Seu bebê completou 6 meses! Que tal registrar esse momento?",
    time: "2 dias atrás",
    unread: false,
  },
];

export const MainLayout = () => {
  const navigate = useNavigate();
  const [isNotificationsOpen, setNotificationsOpen] = useState(false);
  const [isUserMenuOpen, setUserMenuOpen] = useState(false);
  const [isChildSwitcherOpen, setChildSwitcherOpen] = useState(false);
  const [notifications, setNotifications] =
    useState<B2CNotification[]>(INITIAL_NOTIFICATIONS);

  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const user = useAuthStore((state) => state.user);
  const clearAuth = useAuthStore((state) => state.logout);
  const logoutMutation = useLogout();

  const unreadCount = notifications.filter((n) => n.unread).length;

  const handleMarkAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, unread: false })));
  };

  const handleNotificationClick = (notification: B2CNotification) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === notification.id ? { ...n, unread: false } : n))
    );
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
          backgroundColor: "color-mix(in srgb, var(--bb-color-bg) 95%, transparent)",
          borderBottom: "1px solid var(--bb-color-border)",
        }}
      >
        <div className="mx-auto w-full max-w-5xl px-4 py-3">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <Link
                to="/jornada"
                className="flex items-center gap-2 text-2xl font-serif"
                style={{ color: "var(--bb-color-ink)" }}
              >
                <Sparkles className="h-5 w-5" style={{ color: "var(--bb-color-accent)" }} />
                BabyBook
              </Link>
              <p
                className="hidden text-xs uppercase tracking-[0.4em] sm:inline"
                style={{ color: "var(--bb-color-ink-muted)" }}
              >
                Memórias privadas
              </p>
            </div>
            <div className="ml-auto flex items-center gap-2">
              {/* Notifications Button */}
              <button
                type="button"
                onClick={() => {
                  setChildSwitcherOpen(false);
                  setUserMenuOpen(false);
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

              {/* Child Switcher */}
              <BBChildSwitcher
                isOpen={isChildSwitcherOpen}
                onOpenChange={(open) => {
                  setChildSwitcherOpen(open);
                  if (open) {
                    setNotificationsOpen(false);
                    setUserMenuOpen(false);
                  }
                }}
              />

              {/* User Menu Button */}
              {isAuthenticated ? (
                <button
                  type="button"
                  onClick={() => {
                    setChildSwitcherOpen(false);
                    setNotificationsOpen(false);
                    setUserMenuOpen(true);
                  }}
                  className="inline-flex items-center justify-center rounded-2xl border px-3 py-1.5 transition"
                  style={{
                    borderColor: "var(--bb-color-border)",
                    backgroundColor: "var(--bb-color-surface)",
                    color: "var(--bb-color-ink)",
                  }}
                  aria-label="Menu do usuário"
                >
                  <User className="h-4 w-4" />
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
          backgroundColor: "color-mix(in srgb, var(--bb-color-surface) 95%, transparent)",
          borderColor: "var(--bb-color-border)",
          border: "1px solid var(--bb-color-border)",
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
                    "relative isolate flex flex-1 items-center justify-center overflow-hidden rounded-full text-sm font-semibold transition-colors duration-300",
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
                        className="absolute inset-0 rounded-full"
                        style={{
                          backgroundColor: "var(--bb-color-ink)",
                          boxShadow: "0 12px 26px rgba(42,42,42,0.35)",
                        }}
                        transition={{
                          type: "spring",
                          stiffness: 360,
                          damping: 28,
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
                      <span
                        className={cn(
                          "text-sm font-semibold tracking-tight transition-[opacity,transform] duration-300",
                          isActive
                            ? "translate-x-0 opacity-100"
                            : "translate-x-2 opacity-0"
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

      {/* Notifications Drawer */}
      <B2CNotificationsDrawer
        open={isNotificationsOpen}
        onOpenChange={setNotificationsOpen}
        notifications={notifications}
        onNotificationClick={handleNotificationClick}
        onMarkAllAsRead={handleMarkAllAsRead}
      />

      {/* User Menu Drawer */}
      <B2CUserDrawer
        open={isUserMenuOpen}
        onOpenChange={setUserMenuOpen}
        userName={user?.name}
        userEmail={user?.email}
        onLogout={handleLogout}
        isLoggingOut={logoutMutation.isPending}
      />
    </div>
  );
};
