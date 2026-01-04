import { useEffect, useState } from "react";
import {
  Link,
  NavLink,
  Outlet,
  useLocation,
  useNavigate,
} from "react-router-dom";
import {
  BookHeart,
  Stethoscope,
  UsersRound,
  Shield,
  Bell,
  ChevronDown,
} from "lucide-react";
import { AnimatePresence, LayoutGroup, motion } from "motion/react";
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
  const location = useLocation();
  const navigate = useNavigate();
  const [isNotificationsOpen, setNotificationsOpen] = useState(false);
  const [isMainDrawerOpen, setMainDrawerOpen] = useState(false);

  const isFullscreenFormRoute =
    /^\/jornada\/moment(\/|$)/.test(location.pathname) ||
    /^\/app\/novo-momento(\/|$)/.test(location.pathname) ||
    /^\/jornada\/importar-entrega(\/|$)/.test(location.pathname) ||
    /^\/perfil-usuario(\/|$)/.test(location.pathname) ||
    /^\/jornada\/(minha-conta|notificacoes|privacidade|familia|assinatura|armazenamento|ajuda|termos|perfil-crianca)(\/|$)/.test(location.pathname) ||
    /^\/termos-de-uso(\/|$)/.test(location.pathname) ||
    /^\/politica-de-privacidade(\/|$)/.test(location.pathname);

  const hideBottomNav = isFullscreenFormRoute;
  const hideHeader = isFullscreenFormRoute;

  useEffect(() => {
    if (hideHeader) {
      setNotificationsOpen(false);
      setMainDrawerOpen(false);
    }
  }, [hideHeader]);

  // Contexto compartilhado de notificações
  const { notifications, unreadCount, markAsRead, markAllAsRead } =
    useNotifications();

  const {
    children: childrenList,
    selectedChild,
    setSelectedChildId,
  } = useSelectedChild();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const user = useAuthStore((state) => state.user);
  const clearAuth = useAuthStore((state) => state.logout);
  const logoutMutation = useLogout();

  const handleNotificationClick = (notification: {
    id: string;
    link?: string;
  }) => {
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
      className="app-b2c flex min-h-screen flex-col font-sans selection:bg-pink-100 selection:text-pink-900"
      style={{
        backgroundColor: "var(--bb-color-bg)",
        color: "var(--bb-color-ink)",
      }}
    >
      {!hideHeader && (
        <header
          className="sticky top-0 z-40 transition-all duration-300 bg-white/80 dark:bg-[#1c1917]/80 backdrop-blur-xl border-b border-black/5 dark:border-white/5"
          data-tour="b2c-header"
        >
          <div className="mx-auto w-full max-w-5xl px-6 py-4">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <Link
                to="/jornada"
                className="flex items-center gap-2 transition-transform active:scale-95"
              >
                <div className="dark:hidden">
                  <BabyBookLogo variant="b2c" size="md" />
                </div>
                <div className="hidden dark:block">
                  <BabyBookLogo variant="b2c-dark" size="md" />
                </div>
              </Link>

              <div className="flex items-center gap-3">
                {/* Notifications Button */}
                <button
                  type="button"
                  onClick={() => {
                    setMainDrawerOpen(false);
                    setNotificationsOpen(true);
                  }}
                  className="group relative inline-flex items-center justify-center rounded-2xl border border-transparent bg-white/50 dark:bg-white/5 px-3 py-2 transition-all hover:bg-white dark:hover:bg-white/10 hover:shadow-sm active:scale-95"
                  aria-label="Central de notificações"
                >
                  <Bell className="h-5 w-5 text-gray-600 dark:text-gray-300 transition-colors group-hover:text-gray-900 dark:group-hover:text-white" />
                  {unreadCount > 0 && (
                    <span className="absolute top-1.5 right-1.5 h-2.5 w-2.5 rounded-full bg-red-500 shadow-sm ring-2 ring-white dark:ring-black" />
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
                    className="group inline-flex items-center gap-2 rounded-2xl border border-transparent bg-white/50 dark:bg-white/5 px-4 py-2 pl-5 text-sm font-medium text-gray-700 dark:text-gray-100 transition-all hover:bg-white dark:hover:bg-white/10 hover:text-gray-900 dark:hover:text-white hover:shadow-sm active:scale-95"
                    aria-label="Abrir menu principal"
                    data-tour="user-menu-button"
                  >
                    <span className="font-bold tracking-tight">
                      {selectedChild?.name || "Cadastre uma criança"}
                    </span>
                    <ChevronDown className="h-4 w-4 text-gray-400 dark:text-gray-500 transition-transform group-hover:rotate-180" />
                  </button>
                ) : (
                  <Link
                    to="/login"
                    className="ml-2 text-sm font-bold text-gray-700 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white"
                  >
                    Entrar
                  </Link>
                )}
              </div>
            </div>
          </div>
        </header>
      )}

      <main
        className={cn(
          "mx-auto w-full max-w-5xl flex-1 px-6 pt-6 md:pt-10",
          hideBottomNav ? "pb-10" : "pb-32",
        )}
      >
        <Outlet />
      </main>

      {/* Floating Bottom Navigation - Premium Glass */}
      {!hideBottomNav && (
        <nav
          className="fixed bottom-6 left-1/2 z-40 flex w-[calc(100%-3rem)] max-w-md -translate-x-1/2 items-center rounded-[2rem] p-1.5 shadow-[0_8px_40px_-12px_rgba(0,0,0,0.12)] dark:shadow-none ring-1 ring-black/5 dark:ring-white/10 bg-white/90 dark:bg-[#1c1917]/90 backdrop-blur-2xl"
          aria-label="Navegação dos livros"
          data-tour="bottom-nav"
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
                      "relative isolate flex flex-1 items-center justify-center overflow-hidden rounded-[1.5rem] py-3 text-sm font-medium transition-all duration-500 ease-out",
                    )
                  }
                >
                  {({ isActive }) => (
                    <>
                      {isActive && (
                        <motion.span
                          layoutId="book-nav-pill"
                          className="absolute inset-0 z-0 bg-gray-900 dark:bg-white rounded-[1.5rem]"
                          transition={{
                            type: "spring",
                            stiffness: 300,
                            damping: 30,
                          }}
                        />
                      )}
                      <span className="relative z-10 flex items-center justify-center gap-2">
                        <Icon
                          className={cn(
                            "h-5 w-5 transition-colors duration-300",
                            isActive ? "text-white dark:text-black" : "text-gray-400 dark:text-stone-500",
                          )}
                          strokeWidth={isActive ? 2.5 : 2}
                        />
                        {isActive && (
                          <motion.span
                            initial={{ opacity: 0, width: 0 }}
                            animate={{ opacity: 1, width: "auto" }}
                            exit={{ opacity: 0, width: 0 }}
                            className="hidden sm:inline-block whitespace-nowrap text-white dark:text-black"
                          >
                            {book.label}
                          </motion.span>
                        )}
                      </span>
                    </>
                  )}
                </NavLink>
              );
            })}
          </LayoutGroup>
        </nav>
      )}

      {/* Notifications Drawer */}
      {!hideHeader && (
        <B2CNotificationsDrawer
          open={isNotificationsOpen}
          onOpenChange={setNotificationsOpen}
          notifications={notifications}
          onNotificationClick={handleNotificationClick}
          onMarkAsRead={markAsRead}
          onMarkAllAsRead={markAllAsRead}
        />
      )}

      {/* Main Drawer */}
      {!hideHeader && (
        <B2CMainDrawer
          open={isMainDrawerOpen}
          onOpenChange={setMainDrawerOpen}
          userName={user?.name}
          userEmail={user?.email}
          childrenList={childrenList}
          selectedChild={selectedChild}
          onSelectChild={setSelectedChildId}
          onLogout={handleLogout}
          isLoggingOut={logoutMutation.isPending}
        />
      )}
    </div>
  );
};
