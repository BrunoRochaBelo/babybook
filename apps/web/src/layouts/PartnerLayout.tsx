/**
 * Partner Portal Layout
 *
 * Layout unificado para todas as páginas do Portal do Parceiro.
 * Inclui header com navegação, notificações e menu do usuário.
 */

import { useState } from "react";
import {
  Link,
  NavLink,
  Outlet,
  useLocation,
  useNavigate,
} from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  Bell,
  ChevronRight,
  Coins,
  CreditCard,
  Home,
  Info,
  LogOut,
  Monitor,
  MoonStar,
  Package,
  Settings,
  Sun,
  HelpCircle,
  FileText,
} from "lucide-react";
import { LayoutGroup, motion } from "motion/react";
import { cn } from "@/lib/utils";
import { useLogout } from "@/hooks/api";
import { useAuthStore } from "@/store/auth";
import { useTheme } from "@/hooks/useTheme";
import {
  getPartnerProfile,
  getPartnerDashboardStats,
  getNotifications,
  type Notification,
} from "@/features/partner-portal/api";
import {
  PartnerPageHeaderContext,
  type PartnerPageHeaderBadgeTone,
  type PartnerPageHeaderConfig,
} from "@/layouts/partnerPageHeader";
import { usePartnerKeyboardShortcuts } from "@/hooks/usePartnerKeyboardShortcuts";
import { OfflineBanner } from "@/components/OfflineBanner";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerBody,
  DrawerFooter,
  DrawerTitle,
} from "@/components/ui/drawer";
import { BabyBookLogo } from "@/components/BabyBookLogo";

const NAV_LINKS = [
  { to: "/partner", label: "Dashboard", icon: Home, end: true },
  { to: "/partner/deliveries", label: "Entregas", icon: Package, end: false },
  { to: "/partner/credits", label: "Créditos", icon: CreditCard, end: false },
];

// Rotas onde a navbar flutuante DEVE aparecer
const SHOW_NAV_ROUTES = ["/partner", "/partner/deliveries", "/partner/credits"];

export function PartnerLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const clearAuth = useAuthStore((state) => state.logout);
  const logoutMutation = useLogout();
  const { theme, setTheme } = useTheme();

  // Enable keyboard shortcuts for the portal
  usePartnerKeyboardShortcuts();

  const [pageHeader, setPageHeader] = useState<PartnerPageHeaderConfig | null>(
    null,
  );

  const [isNotificationsOpen, setNotificationsOpen] = useState(false);
  const [isUserMenuOpen, setUserMenuOpen] = useState(false);
  const [isCreditsOpen, setCreditsOpen] = useState(false);

  // Fetch partner profile
  const { data: profile } = useQuery({
    queryKey: ["partner", "profile"],
    queryFn: getPartnerProfile,
  });

  // Fetch stats for credit balance
  const { data: stats } = useQuery({
    queryKey: ["partner", "stats"],
    queryFn: getPartnerDashboardStats,
    // Reduce stale time to ensure updates are reflected quicker,
    // or rely on invalidateQueries if we implemented the purchase flow fully.
    staleTime: 5000,
    refetchOnWindowFocus: true,
  });

  // Fetch notifications
  const { data: notifications = [] } = useQuery({
    queryKey: ["partner", "notifications"],
    queryFn: getNotifications,
  });

  const availableCredits = stats?.voucher_balance ?? 0;
  const hasLowCredits = availableCredits <= 2;
  const hasNoCredits = availableCredits === 0;

  const handleMarkAllAsRead = () => {
    queryClient.setQueryData<Notification[]>(
      ["partner", "notifications"],
      (old) => old?.map((n) => ({ ...n, unread: false })) ?? [],
    );
  };

  const handleMarkAsRead = (id: string) => {
    queryClient.setQueryData<Notification[]>(
      ["partner", "notifications"],
      (old) =>
        old?.map((n) => (n.id === id ? { ...n, unread: false } : n)) ?? [],
    );
  };

  const handleNotificationClick = (notification: Notification) => {
    handleMarkAsRead(notification.id);
    setNotificationsOpen(false);
    navigate(notification.link || "/partner/notifications");
  };

  const handleLogout = async () => {
    try {
      await logoutMutation.mutateAsync();
      clearAuth();
      navigate("/pro/login");
    } catch (error) {
      console.error("Logout failed:", error);
      // Even if API fails, clear local auth
      clearAuth();
      navigate("/pro/login");
    }
  };

  const unreadCount = notifications.filter((n) => n.unread).length;

  const badgeToneClass = (tone?: PartnerPageHeaderBadgeTone) => {
    switch (tone) {
      case "success":
        return "bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300";
      case "warning":
        return "bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300";
      case "info":
        return "bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300";
      case "purple":
        return "bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300";
      case "neutral":
      default:
        return "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300";
    }
  };

  // Helper to check if nav should show
  const shouldShowNav = SHOW_NAV_ROUTES.includes(location.pathname.replace(/\/$/, ""));

  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))] from-gray-50 via-white to-pink-50/20 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800 flex flex-col transition-colors duration-500">
      {/* Decorative background blob */}
      <div className="fixed top-0 left-0 w-full h-96 bg-gradient-to-br from-pink-100/40 to-transparent dark:from-pink-900/10 dark:to-transparent pointer-events-none blur-3xl opacity-60" />

      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/70 dark:bg-gray-900/70 backdrop-blur-xl border-b border-white/20 dark:border-white/5 shadow-[0_2px_8px_-2px_rgba(0,0,0,0.05)] dark:shadow-none supports-[backdrop-filter]:bg-white/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 relative">
            {/* Logo & Brand */}
            <div className="flex items-center">
              <Link to="/partner" className="flex items-center gap-2 group">
                <BabyBookLogo variant="b2b" size="md" />
              </Link>
            </div>

            {/* Right Side Actions */}
            <div className="flex items-center gap-3">
              {/* Credit Balance Badge */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => {
                    setUserMenuOpen(false);
                    setNotificationsOpen(false);
                    setCreditsOpen(true);
                  }}
                  title={`${availableCredits} créditos disponíveis. Clique para gerenciar.`}
                  className={cn(
                    "inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-semibold transition-all duration-300 hover:scale-105 active:scale-95 border",
                    hasNoCredits
                      ? "bg-red-50/80 dark:bg-red-900/20 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800"
                      : hasLowCredits
                        ? "bg-amber-50/80 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800"
                        : "bg-emerald-50/80 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800",
                  )}
                >
                  <Coins className="w-4 h-4" />
                  <span>{availableCredits}</span>
                </button>

                {/* Credits Drawer */}
                <Drawer
                  open={isCreditsOpen}
                  onOpenChange={setCreditsOpen}
                  direction="right"
                >
                  <DrawerContent className="h-full w-full sm:max-w-sm border-l border-gray-100 dark:border-gray-800 shadow-2xl">
                    <DrawerHeader className="border-b border-gray-100 dark:border-gray-800 px-6 py-5 bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-2xl rotate-3 flex items-center justify-center text-white shadow-xl shadow-emerald-500/20 ring-4 ring-white dark:ring-gray-800">
                          <Coins className="w-6 h-6" />
                        </div>
                        <div>
                          <DrawerTitle className="text-lg font-bold text-gray-900 dark:text-white">
                            Saldo e Créditos
                          </DrawerTitle>
                          <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">
                            Gerencie seus vouchers
                          </p>
                        </div>
                      </div>
                    </DrawerHeader>

                    <DrawerBody className="p-6 space-y-8 overflow-y-auto">
                      {/* Balance Card "Mostrador" */}
                      <div className="rounded-[2rem] bg-gradient-to-br from-gray-900 to-gray-800 text-white p-6 shadow-2xl shadow-gray-200/50 dark:shadow-none border border-gray-100/10 relative overflow-hidden group transform hover:scale-[1.02] transition-transform duration-500">
                        {/* Abstract shapes for "digital" feel */}
                        <div className="absolute top-0 right-0 w-48 h-48 bg-emerald-500/20 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />
                        <div className="absolute bottom-0 left-0 w-32 h-32 bg-blue-500/20 rounded-full blur-2xl -ml-12 -mb-12 pointer-events-none" />

                        <p className="text-emerald-400 text-xs font-bold uppercase tracking-widest mb-2 relative z-10">
                          Saldo Disponível
                        </p>
                        <div className="flex items-baseline gap-2 relative z-10">
                          <span className="text-6xl font-bold tracking-tighter">
                            {availableCredits}
                          </span>
                          <span className="text-xl text-gray-400 font-medium leading-none">
                            créditos
                          </span>
                        </div>

                        {hasLowCredits && (
                          <div className="mt-6 inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-red-500/20 border border-red-500/30 text-red-200 text-xs font-semibold relative z-10 animate-pulse">
                            <Info className="w-3.5 h-3.5" />
                            Saldo baixo
                          </div>
                        )}

                        <div className="mt-8 pt-6 border-t border-white/10 flex items-center justify-between relative z-10">
                          <span className="text-gray-400 text-sm font-medium">
                            Reservados
                          </span>
                          <span className="text-white font-bold text-lg">
                            {stats?.reserved_credits ?? 0}
                          </span>
                        </div>
                      </div>

                      {/* How it works */}
                      <div>
                        <p className="text-xs font-bold text-gray-400 dark:text-gray-500 mb-6 uppercase tracking-wider pl-1">
                          Como funciona
                        </p>
                        <div className="space-y-6 relative">
                          {/* Line */}
                          <div className="absolute left-4 top-2 bottom-2 w-0.5 bg-gray-100 dark:bg-gray-800" />

                          <div className="flex gap-4 relative">
                            <div className="w-8 h-8 rounded-full bg-white dark:bg-gray-900 border-2 border-emerald-100 dark:border-emerald-900/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center text-sm font-bold flex-shrink-0 z-10 shadow-sm">
                              1
                            </div>
                            <div className="pt-1">
                              <h4 className="text-sm font-bold text-gray-900 dark:text-white mb-1">
                                Compre créditos
                              </h4>
                              <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
                                Adquira pacotes de créditos para usar os recursos PRO do BabyBook.
                              </p>
                            </div>
                          </div>

                          <div className="flex gap-4 relative">
                            <div className="w-8 h-8 rounded-full bg-white dark:bg-gray-900 border-2 border-emerald-100 dark:border-emerald-900/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center text-sm font-bold flex-shrink-0 z-10 shadow-sm">
                              2
                            </div>
                            <div className="pt-1">
                              <h4 className="text-sm font-bold text-gray-900 dark:text-white mb-1">
                                Use em entregas
                              </h4>
                              <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
                                Cada novo álbum ou funcionalidade consome uma quantidade específica.
                              </p>
                            </div>
                          </div>

                          <div className="flex gap-4 relative">
                            <div className="w-8 h-8 rounded-full bg-white dark:bg-gray-900 border-2 border-emerald-100 dark:border-emerald-900/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center text-sm font-bold flex-shrink-0 z-10 shadow-sm">
                              3
                            </div>
                            <div className="pt-1">
                              <h4 className="text-sm font-bold text-gray-900 dark:text-white mb-1">
                                Expiração de 12 meses
                              </h4>
                              <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
                                Seus créditos são válidos por um ano a partir da data da compra.
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </DrawerBody>

                    <DrawerFooter className="border-t border-gray-100 dark:border-gray-800 p-6 bg-gray-50/50 dark:bg-gray-900/20">
                      <Link
                        to="/partner/credits"
                        onClick={() => setCreditsOpen(false)}
                        className="w-full flex items-center justify-center gap-2 bg-gray-900 dark:bg-white text-white dark:text-gray-900 dark:hover:bg-gray-100 hover:bg-gray-800 py-3.5 rounded-xl font-bold shadow-lg shadow-gray-900/10 dark:shadow-white/5 transition-all active:scale-[0.98]"
                      >
                        <Coins className="w-4 h-4" />
                        Comprar Créditos
                      </Link>
                    </DrawerFooter>
                  </DrawerContent>
                </Drawer>
              </div>

              {/* Notifications */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => {
                    setUserMenuOpen(false);
                    setNotificationsOpen((prev) => !prev);
                  }}
                  data-tour="notifications-button"
                  className={cn(
                    "relative w-10 h-10 rounded-full flex items-center justify-center transition-all",
                    isNotificationsOpen
                      ? "bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white"
                      : "text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-700 dark:hover:text-white",
                  )}
                  aria-label="Notificações"
                >
                  <Bell className="w-5 h-5" />
                  {unreadCount > 0 && (
                    <span className="absolute top-2 right-2.5 w-2.5 h-2.5 bg-pink-500 border-2 border-white dark:border-gray-900 rounded-full" />
                  )}
                </button>

                {/* Notifications Drawer */}
                <Drawer
                  open={isNotificationsOpen}
                  onOpenChange={setNotificationsOpen}
                  direction="right"
                >
                  <DrawerContent className="h-full w-full sm:max-w-sm border-l border-gray-100 dark:border-gray-800 shadow-2xl">
                    <DrawerHeader className="border-b border-gray-100 dark:border-gray-800 px-6 py-5 bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm">
                      <div className="flex items-center justify-between">
                        <DrawerTitle className="text-lg font-bold text-gray-900 dark:text-white">
                          Notificações
                        </DrawerTitle>
                        {unreadCount > 0 && (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-pink-50 dark:bg-pink-900/30 text-pink-700 dark:text-pink-300 text-xs font-bold">
                            {unreadCount} nova{unreadCount > 1 ? "s" : ""}
                          </span>
                        )}
                      </div>
                    </DrawerHeader>
                    <DrawerBody className="p-0 bg-white dark:bg-gray-900">
                      {/* Action Bar */}
                      <div className="flex items-center justify-between px-6 py-3 border-b border-gray-50 dark:border-gray-800/50 bg-gray-50/50 dark:bg-gray-800/20">
                        <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                          Recentes
                        </p>
                        <button
                          onClick={handleMarkAllAsRead}
                          className="text-xs font-bold text-pink-600 hover:text-pink-700 dark:text-pink-400 dark:hover:text-pink-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          disabled={unreadCount === 0}
                        >
                          Marcar lidas
                        </button>
                      </div>

                      <div className="divide-y divide-gray-50 dark:divide-gray-800/50">
                        {notifications.map((notification) => (
                          <div
                            key={notification.id}
                            onClick={() =>
                              handleNotificationClick(notification)
                            }
                            className={cn(
                              "relative px-6 py-5 hover:bg-gray-50 dark:hover:bg-gray-800/50 cursor-pointer transition-colors group",
                              notification.unread
                                ? "bg-white dark:bg-gray-900"
                                : "bg-gray-50/30 dark:bg-gray-900/30",
                            )}
                          >
                            <div className="flex gap-4">
                              <div
                                className={cn(
                                  "flex-shrink-0 w-12 h-12 rounded-2xl flex items-center justify-center shadow-sm transition-transform group-hover:scale-105 border border-transparent",
                                  notification.unread
                                    ? "bg-pink-50 text-pink-600 dark:bg-pink-900/20 dark:text-pink-400 border-pink-100 dark:border-pink-900/30"
                                    : "bg-white text-gray-400 dark:bg-gray-800 dark:text-gray-500 border-gray-100 dark:border-gray-700",
                                )}
                              >
                                <Bell className="w-5 h-5" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-start justify-between gap-2 mb-1">
                                  <p
                                    className={cn(
                                      "text-sm font-bold truncate pr-2",
                                      notification.unread
                                        ? "text-gray-900 dark:text-white"
                                        : "text-gray-600 dark:text-gray-300",
                                    )}
                                  >
                                    {notification.title}
                                  </p>
                                  <span className="text-[10px] text-gray-400 whitespace-nowrap font-medium">
                                    {notification.time}
                                  </span>
                                </div>
                                <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2 leading-relaxed">
                                  {notification.description}
                                </p>
                              </div>
                              {notification.unread && (
                                <div className="absolute right-6 top-1/2 -translate-y-1/2">
                                  <span className="block w-2.5 h-2.5 bg-pink-500 border-2 border-white dark:border-gray-900 rounded-full shadow-sm" />
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                        {notifications.length === 0 && (
                          <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
                            <div className="w-20 h-20 bg-gray-50 dark:bg-gray-800/50 rounded-full flex items-center justify-center mb-6">
                              <Bell className="w-8 h-8 text-gray-300 dark:text-gray-600" />
                            </div>
                            <h3 className="text-base font-bold text-gray-900 dark:text-white mb-2">
                              Tudo limpo por aqui
                            </h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400 max-w-[200px]">
                              Você não tem novas notificações no momento.
                            </p>
                          </div>
                        )}
                      </div>
                    </DrawerBody>
                    <DrawerFooter className="border-t border-gray-100 dark:border-gray-800 p-6 bg-gray-50/50 dark:bg-gray-800/20">
                      <Link
                        to="/partner/notifications"
                        onClick={() => setNotificationsOpen(false)}
                        className="w-full block text-center text-sm text-pink-600 dark:text-pink-400 hover:text-pink-700 dark:hover:text-pink-300 font-bold"
                      >
                        Ver todas as notificações
                      </Link>
                    </DrawerFooter>
                  </DrawerContent>
                </Drawer>
              </div>

              {/* User Menu */}
              <div className="relative" data-tour="user-menu">
                <button
                  type="button"
                  onClick={() => {
                    setNotificationsOpen(false);
                    setUserMenuOpen((prev) => !prev);
                  }}
                  className={cn(
                    "flex items-center gap-2 p-1 pl-1.5 pr-2.5 rounded-full transition-all border border-transparent shadow-sm",
                    isUserMenuOpen
                      ? "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700"
                      : "bg-white/50 dark:bg-gray-800/50 hover:bg-white dark:hover:bg-gray-800 border-gray-100/50 dark:border-gray-700/50",
                  )}
                >
                  <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-600 rounded-full flex items-center justify-center text-white text-xs font-bold ring-2 ring-white dark:ring-gray-900">
                    {profile?.studio_name?.[0] || profile?.name?.[0] || "P"}
                  </div>
                  <span className="hidden sm:block text-xs font-bold text-gray-700 dark:text-gray-200 max-w-[100px] truncate">
                    {profile?.studio_name || profile?.name || "Parceiro"}
                  </span>
                </button>

                {/* User Drawer */}
                <Drawer
                  open={isUserMenuOpen}
                  onOpenChange={setUserMenuOpen}
                  direction="right"
                >
                  <DrawerContent className="h-full w-full sm:max-w-sm border-l border-gray-100 dark:border-gray-800 shadow-2xl">
                    <DrawerHeader className="border-b border-gray-100 dark:border-gray-800 px-6 py-8 bg-gradient-to-br from-pink-50/50 to-purple-50/50 dark:from-pink-900/10 dark:to-purple-900/10">
                      <div className="flex flex-col items-center text-center gap-4">
                        <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-pink-600 rounded-[2rem] flex items-center justify-center text-white font-bold text-3xl shadow-xl shadow-pink-500/20 ring-4 ring-white dark:ring-gray-800 rotate-3">
                          {profile?.studio_name?.[0] ||
                            profile?.name?.[0] ||
                            "P"}
                        </div>
                        <div className="min-w-0">
                          <DrawerTitle className="text-xl font-bold text-gray-900 dark:text-white truncate">
                            {profile?.studio_name ||
                              profile?.name ||
                              "Parceiro"}
                          </DrawerTitle>
                          <p className="text-sm text-gray-500 dark:text-gray-400 truncate mt-1">
                            {profile?.email}
                          </p>
                        </div>
                      </div>
                    </DrawerHeader>

                    <DrawerBody className="p-6 space-y-8 overflow-y-auto">
                      {/* Theme Selector */}
                      <div>
                        <p className="text-xs font-bold text-gray-400 dark:text-gray-500 mb-4 uppercase tracking-wider pl-1">
                          Aparência
                        </p>
                        <div className="flex gap-2 p-1.5 rounded-2xl bg-gray-100/80 dark:bg-gray-900/50 border border-gray-200/50 dark:border-gray-800">
                          <button
                            type="button"
                            onClick={() => setTheme("light")}
                            className={cn(
                              "flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-xs font-bold transition-all duration-300",
                              theme === "light"
                                ? "bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm ring-1 ring-black/5 dark:ring-white/10 scale-[1.02]"
                                : "text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-white/50 dark:hover:bg-gray-800/50",
                            )}
                          >
                            <Sun className="w-4 h-4" />
                            <span className="hidden sm:inline">Claro</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setTheme("dark")}
                            className={cn(
                              "flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-xs font-bold transition-all duration-300",
                              theme === "dark"
                                ? "bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm ring-1 ring-black/5 dark:ring-white/10 scale-[1.02]"
                                : "text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-white/50 dark:hover:bg-gray-800/50",
                            )}
                          >
                            <MoonStar className="w-4 h-4" />
                            <span className="hidden sm:inline">Escuro</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setTheme("system")}
                            className={cn(
                              "flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-xs font-bold transition-all duration-300",
                              theme === "system"
                                ? "bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm ring-1 ring-black/5 dark:ring-white/10 scale-[1.02]"
                                : "text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-white/50 dark:hover:bg-gray-800/50",
                            )}
                          >
                            <Monitor className="w-4 h-4" />
                            <span className="hidden sm:inline">Auto</span>
                          </button>
                        </div>
                      </div>

                      {/* Menu Links */}
                      <div>
                        <p className="text-xs font-bold text-gray-400 dark:text-gray-500 mb-4 uppercase tracking-wider pl-1">
                          Conta
                        </p>
                        <nav className="space-y-3">
                          <Link
                            to="/partner/settings"
                            onClick={() => setUserMenuOpen(false)}
                            className="flex items-center gap-4 p-3.5 rounded-2xl bg-white dark:bg-gray-800/40 hover:bg-gray-50 dark:hover:bg-gray-800 border border-gray-100 dark:border-gray-700/50 hover:border-gray-200 dark:hover:border-gray-700 hover:shadow-md transition-all group active:scale-[0.99]"
                          >
                            <div className="w-10 h-10 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700 flex items-center justify-center text-gray-500 dark:text-gray-400 group-hover:text-pink-600 dark:group-hover:text-pink-400 group-hover:bg-pink-50 dark:group-hover:bg-pink-900/20 group-hover:border-pink-100 dark:group-hover:border-pink-900/30 transition-all">
                              <Settings className="w-5 h-5" />
                            </div>
                            <div className="flex-1">
                              <p className="text-sm font-bold text-gray-900 dark:text-white group-hover:text-pink-600 dark:group-hover:text-pink-400 transition-colors">
                                Configurações
                              </p>
                              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                                Gerencie seus dados
                              </p>
                            </div>
                            <div className="text-gray-300 group-hover:text-pink-400 group-hover:translate-x-1 transition-all">
                              <ChevronRight className="w-5 h-5" />
                            </div>
                          </Link>
                        </nav>
                      </div>

                      {/* Support Links */}
                      <div>
                        <p className="text-xs font-bold text-gray-400 dark:text-gray-500 mb-4 uppercase tracking-wider pl-1">
                          Suporte
                        </p>
                        <nav className="space-y-3">
                          <Link
                            to="/partner/help"
                            onClick={() => setUserMenuOpen(false)}
                            className="flex items-center gap-4 p-3.5 rounded-2xl bg-white dark:bg-gray-800/40 hover:bg-gray-50 dark:hover:bg-gray-800 border border-gray-100 dark:border-gray-700/50 hover:border-gray-200 dark:hover:border-gray-700 hover:shadow-md transition-all group active:scale-[0.99]"
                          >
                            <div className="w-10 h-10 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700 flex items-center justify-center text-gray-500 dark:text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 group-hover:bg-blue-50 dark:group-hover:bg-blue-900/20 group-hover:border-blue-100 dark:group-hover:border-blue-900/30 transition-all">
                              <HelpCircle className="w-5 h-5" />
                            </div>
                            <div className="flex-1">
                              <p className="text-sm font-bold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                                Central de Ajuda
                              </p>
                              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                                Tire suas dúvidas
                              </p>
                            </div>
                            <div className="text-gray-300 group-hover:text-blue-400 group-hover:translate-x-1 transition-all">
                              <ChevronRight className="w-5 h-5" />
                            </div>
                          </Link>

                          <Link
                            to="/partner/terms"
                            onClick={() => setUserMenuOpen(false)}
                            className="flex items-center gap-4 p-3.5 rounded-2xl bg-white dark:bg-gray-800/40 hover:bg-gray-50 dark:hover:bg-gray-800 border border-gray-100 dark:border-gray-700/50 hover:border-gray-200 dark:hover:border-gray-700 hover:shadow-md transition-all group active:scale-[0.99]"
                          >
                            <div className="w-10 h-10 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700 flex items-center justify-center text-gray-500 dark:text-gray-400 group-hover:text-amber-600 dark:group-hover:text-amber-400 group-hover:bg-amber-50 dark:group-hover:bg-amber-900/20 group-hover:border-amber-100 dark:group-hover:border-amber-900/30 transition-all">
                              <FileText className="w-5 h-5" />
                            </div>
                            <div className="flex-1">
                              <p className="text-sm font-bold text-gray-900 dark:text-white group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                                Termos e Políticas
                              </p>
                              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                                Informações legais
                              </p>
                            </div>
                            <div className="text-gray-300 group-hover:text-amber-400 group-hover:translate-x-1 transition-all">
                              <ChevronRight className="w-5 h-5" />
                            </div>
                          </Link>
                        </nav>
                      </div>
                    </DrawerBody>

                    <DrawerFooter className="border-t border-gray-100 dark:border-gray-800 p-6 bg-gray-50/50 dark:bg-gray-800/20">
                      <button
                        onClick={handleLogout}
                        disabled={logoutMutation.isPending}
                        className="flex items-center justify-center gap-2 w-full px-4 py-3.5 text-sm font-bold text-red-600 bg-red-50 hover:bg-red-100 dark:bg-red-900/20 dark:hover:bg-red-900/30 dark:text-red-300 rounded-xl border border-red-100 dark:border-red-900/50 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed group"
                      >
                        <LogOut className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
                        {logoutMutation.isPending
                          ? "Saindo..."
                          : "Sair da conta"}
                      </button>
                    </DrawerFooter>
                  </DrawerContent>
                </Drawer>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <PartnerPageHeaderContext.Provider value={{ setHeader: setPageHeader }}>
        <main className="flex-1 pb-28">
          {/* Page header (mobile sticky) */}
          {pageHeader ? (
            <div className="md:hidden sticky top-16 z-30 border-b border-gray-200/60 dark:border-gray-800 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md">
              <div className="max-w-7xl mx-auto px-4 py-3 flex items-center gap-3">
                {pageHeader.backTo ? (
                  <Link
                    to={pageHeader.backTo}
                    aria-label={pageHeader.backLabel || "Voltar"}
                    className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-gray-100/50 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:text-pink-600 dark:hover:text-pink-400 hover:bg-pink-50 dark:hover:bg-pink-900/20 transition-all duration-200 active:scale-95"
                  >
                    <ArrowLeft className="w-4 h-4" />
                  </Link>
                ) : null}

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 min-w-0">
                    <p className="text-base font-bold text-gray-900 dark:text-white truncate">
                      {pageHeader.title}
                    </p>
                    {pageHeader.badge?.text ? (
                      <span
                        className={cn(
                          "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold uppercase tracking-wide flex-shrink-0",
                          badgeToneClass(pageHeader.badge.tone),
                        )}
                      >
                        {pageHeader.badge.text}
                      </span>
                    ) : null}
                  </div>
                </div>

                {pageHeader.actions ? (
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {pageHeader.actions}
                  </div>
                ) : null}
              </div>
            </div>
          ) : null}

          <Outlet />
        </main>
      </PartnerPageHeaderContext.Provider>

      {/* Floating Bottom Navigation - Show only on main routes */}
      {shouldShowNav && (
        <div className="fixed bottom-6 inset-x-0 z-50 flex justify-center pointer-events-none">
          <nav
            className="flex items-center gap-1 p-1.5 rounded-full border border-white/20 dark:border-gray-700/50 bg-white/70 dark:bg-gray-900/70 shadow-[0_8px_32px_rgba(0,0,0,0.12)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.4)] backdrop-blur-xl ring-1 ring-black/5 dark:ring-white/5 pointer-events-auto transform transition-all duration-500 hover:scale-[1.02]"
            aria-label="Navegação principal"
          >
            <LayoutGroup id="partner-nav">
              {NAV_LINKS.map((link) => {
                const Icon = link.icon;
                return (
                  <NavLink
                    key={link.to}
                    to={link.to}
                    end={link.end}
                    className={({ isActive }) =>
                      cn(
                        "relative flex items-center gap-2 px-5 py-3 rounded-full text-sm font-bold transition-all duration-300 isolate",
                        isActive
                          ? "text-white"
                          : "text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100/50 dark:hover:bg-gray-800/50",
                      )
                    }
                  >
                    {({ isActive }) => (
                      <>
                        {isActive && (
                          <motion.div
                            layoutId="partner-nav-pill"
                            className="absolute inset-0 bg-gray-900 dark:bg-white rounded-full z-[-1] shadow-lg"
                            transition={{
                              type: "spring",
                              stiffness: 400,
                              damping: 30,
                            }}
                          />
                        )}
                        <Icon
                          className={cn(
                            "w-5 h-5 transition-transform duration-300",
                            isActive ? "text-white dark:text-gray-900 scale-110" : "",
                          )}
                        />
                        {isActive && (
                          <motion.span
                            initial={{ opacity: 0, width: 0 }}
                            animate={{ opacity: 1, width: "auto" }}
                            exit={{ opacity: 0, width: 0 }}
                            className="whitespace-nowrap overflow-hidden text-white dark:text-gray-900"
                          >
                            {link.label}
                          </motion.span>
                        )}
                      </>
                    )}
                  </NavLink>
                );
              })}
            </LayoutGroup>
          </nav>
        </div>
      )}

      {/* Offline Banner */}
      <OfflineBanner />
    </div>
  );
}

export default PartnerLayout;
