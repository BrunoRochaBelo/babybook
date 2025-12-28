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
  Sparkles,
  Sun,
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

const NAV_LINKS = [
  { to: "/partner", label: "Dashboard", icon: Home, end: true },
  { to: "/partner/deliveries", label: "Entregas", icon: Package, end: false },
  { to: "/partner/credits", label: "Créditos", icon: CreditCard, end: false },
];

// Rotas onde a navbar flutuante não deve aparecer
const HIDE_NAV_ROUTES = ["/partner/settings", "/partner/notifications"];

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

  // Notifications State (Synced via React Query)
  const { data: notifications = [] } = useQuery({
    queryKey: ["partner", "notifications"],
    queryFn: getNotifications,
    staleTime: 60 * 1000,
  });

  const handleMarkAllAsRead = () => {
    queryClient.setQueryData(
      ["partner", "notifications"],
      (old: Notification[] | undefined) =>
        old?.map((n) => ({ ...n, unread: false })) ?? []
    );
  };

  const handleMarkAsRead = (id: string) => {
    queryClient.setQueryData(
      ["partner", "notifications"],
      (old: Notification[] | undefined) =>
        old?.map((n) => (n.id === id ? { ...n, unread: false } : n)) ?? []
    );
  };

  const handleNotificationClick = (notification: Notification) => {
    handleMarkAsRead(notification.id);
    setNotificationsOpen(false);
    navigate(notification.link || "/partner/notifications");
  };

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

  const availableCredits = stats?.voucher_balance ?? 0;
  const hasLowCredits = availableCredits <= 2;
  const hasNoCredits = availableCredits === 0;

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
        return "bg-yellow-100 dark:bg-yellow-900/40 text-yellow-700 dark:text-yellow-300";
      case "info":
        return "bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300";
      case "purple":
        return "bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300";
      case "neutral":
      default:
        return "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300";
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col transition-colors duration-300">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/95 dark:bg-gray-800/95 backdrop-blur-lg border-b border-gray-200/60 dark:border-gray-700/50 shadow-[0_1px_3px_rgba(0,0,0,0.05),0_1px_2px_rgba(0,0,0,0.02)] dark:shadow-[0_1px_3px_rgba(0,0,0,0.2)]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-16 relative">
            {/* Logo & Brand */}
            <div className="flex items-center">
              <Link
                to="/partner"
                className="flex items-center gap-2 text-xl font-bold text-gray-900 dark:text-white"
              >
                <Sparkles className="w-6 h-6 text-pink-500" />
                <span>
                  Baby Book <span className="text-pink-500">PRO</span>
                </span>
              </Link>
            </div>

            {/* Right Side Actions */}
            <div className="flex items-center gap-2">
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
                    "inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-sm font-semibold transition-all hover:scale-105 active:scale-95",
                    hasNoCredits
                      ? "bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300 ring-1 ring-red-200 dark:ring-red-800"
                      : hasLowCredits
                        ? "bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 ring-1 ring-amber-200 dark:ring-amber-800"
                        : "bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300 ring-1 ring-green-200 dark:ring-green-800",
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
                  <DrawerContent className="h-full w-full sm:max-w-sm">
                    <DrawerHeader className="border-b border-gray-100 dark:border-gray-800 px-4 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center text-white shadow-lg shadow-green-500/20">
                          <Coins className="w-5 h-5" />
                        </div>
                        <div>
                          <DrawerTitle className="text-base font-bold text-gray-900 dark:text-white">
                            Saldo de Créditos
                          </DrawerTitle>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            Gerencie seus vauchers
                          </p>
                        </div>
                      </div>
                    </DrawerHeader>

                    <DrawerBody className="p-6 space-y-8">
                      {/* Balance Card "Mostrador" */}
                      {/* Balance Card "Mostrador" */}
                      <div className="rounded-3xl bg-white dark:bg-gray-950 p-6 shadow-xl shadow-gray-200/50 dark:shadow-none border border-gray-100 dark:border-gray-800 relative overflow-hidden group">
                        {/* Abstract shapes for "digital" feel */}
                        <div className="absolute top-0 right-0 w-32 h-32 bg-pink-500/10 dark:bg-white/5 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none" />
                        <div className="absolute bottom-0 left-0 w-24 h-24 bg-blue-500/10 dark:bg-pink-500/10 rounded-full blur-2xl -ml-10 -mb-10 pointer-events-none" />
                        
                        <p className="text-gray-500 dark:text-gray-400 text-xs font-semibold uppercase tracking-wider mb-2 relative z-10">
                          Saldo Disponível
                        </p>
                        <div className="flex items-baseline gap-1 relative z-10">
                          <span className="text-5xl font-bold tracking-tighter text-gray-900 dark:text-white">
                            {availableCredits}
                          </span>
                          <span className="text-lg text-gray-500 dark:text-gray-400 font-medium">
                            créditos
                          </span>
                        </div>

                        {hasLowCredits && (
                          <div className="mt-4 inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-red-50 dark:bg-red-500/10 border border-red-100 dark:border-red-500/20 text-red-600 dark:text-red-400 text-xs font-medium relative z-10">
                            <Info className="w-3.5 h-3.5" />
                            Saldo baixo
                          </div>
                        )}

                        {(stats?.reserved_credits || 0) > 0 && (
                          <div className="mt-6 pt-4 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between relative z-10">
                            <span className="text-gray-500 dark:text-gray-400 text-sm font-medium">Reservados</span>
                            <span className="text-gray-900 dark:text-white font-bold">{stats?.reserved_credits}</span>
                          </div>
                        )}
                      </div>

                      {/* How it works - Clean/Transparent */}
                      <div className="px-1">
                        <h4 className="flex items-center gap-2 font-semibold text-sm text-gray-900 dark:text-white mb-4">
                          <div className="p-1.5 rounded-md bg-pink-100 dark:bg-pink-900/30 text-pink-600 dark:text-pink-400">
                             <Info className="w-4 h-4" />
                          </div>
                          Como funciona
                        </h4>
                        <ul className="space-y-4">
                          <li className="flex gap-4 items-start">
                             <div className="w-1.5 h-1.5 mt-2 rounded-full bg-gray-300 dark:bg-gray-600 flex-shrink-0" />
                             <span className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
                               Cada <strong>1 crédito</strong> equivale a um voucher para criar um BabyBook completo.
                            </span>
                          </li>
                          <li className="flex gap-4 items-start">
                             <div className="w-1.5 h-1.5 mt-2 rounded-full bg-gray-300 dark:bg-gray-600 flex-shrink-0" />
                             <span className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
                               Os créditos <strong>não expiram</strong> enquanto sua conta estiver ativa.
                            </span>
                          </li>
                          <li className="flex gap-4 items-start">
                             <div className="w-1.5 h-1.5 mt-2 rounded-full bg-gray-300 dark:bg-gray-600 flex-shrink-0" />
                             <span className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
                               Compre pacotes maiores para obter <strong>descontos progressivos</strong>.
                            </span>
                          </li>
                        </ul>
                      </div>
                    </DrawerBody>

                    <DrawerFooter className="border-t border-gray-100 dark:border-gray-800 p-6">
                      <Link
                        to="/partner/credits"
                        onClick={() => setCreditsOpen(false)}
                        className="w-full flex items-center justify-center gap-2 bg-pink-600 hover:bg-pink-700 text-white py-4 rounded-xl font-bold transition-all active:scale-[0.98] shadow-lg shadow-pink-500/20"
                      >
                        <CreditCard className="w-4 h-4" />
                        Comprar mais créditos
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
                    "relative p-2 rounded-lg transition-colors",
                    isNotificationsOpen
                      ? "bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white"
                      : "text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-700 dark:hover:text-white",
                  )}
                  aria-label="Notificações"
                >
                  <Bell className="w-5 h-5" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-pink-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                      {unreadCount}
                    </span>
                  )}
                </button>

                {/* Notifications Drawer */}
                <Drawer
                  open={isNotificationsOpen}
                  onOpenChange={setNotificationsOpen}
                  direction="right"
                >
                  <DrawerContent className="h-full w-full sm:max-w-sm">
                    <DrawerHeader className="border-b border-gray-100 dark:border-gray-800 px-6 py-4">
                      <div className="flex items-center justify-between">
                        <DrawerTitle className="text-lg font-bold text-gray-900 dark:text-white">
                          Notificações
                        </DrawerTitle>
                        {unreadCount > 0 && (
                          <div className="px-2 py-0.5 rounded-full bg-pink-100 dark:bg-pink-900/30 text-pink-600 dark:text-pink-400 text-xs font-bold">
                            {unreadCount} nova(s)
                          </div>
                        )}
                      </div>
                    </DrawerHeader>
                    <DrawerBody className="p-0 bg-white dark:bg-gray-900">
                      {/* Action Bar */}
                      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-50 dark:border-gray-800/50">
                        <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">
                          Recentes
                        </p>
                        <button 
                          onClick={handleMarkAllAsRead}
                          className="text-xs font-semibold text-pink-600 hover:text-pink-700 dark:text-pink-400 dark:hover:text-pink-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          disabled={unreadCount === 0}
                        >
                          Marcar todas como lidas
                        </button>
                      </div>

                      <div className="divide-y divide-gray-50 dark:divide-gray-800/50">
                        {notifications.map((notification) => (
                          <div
                            key={notification.id}
                            onClick={() => handleNotificationClick(notification)}
                            className={cn(
                              "relative px-6 py-5 hover:bg-gray-50 dark:hover:bg-gray-800/50 cursor-pointer transition-colors group",
                              notification.unread ? "bg-white dark:bg-gray-900" : "bg-transparent opacity-80"
                            )}
                          >
                            <div className="flex gap-4">
                              <div className={cn(
                                "flex-shrink-0 w-12 h-12 rounded-2xl flex items-center justify-center shadow-sm transition-transform group-hover:scale-105",
                                notification.unread 
                                  ? "bg-pink-50 text-pink-600 dark:bg-pink-900/20 dark:text-pink-400 ring-2 ring-pink-100 dark:ring-pink-900/30" 
                                  : "bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400"
                              )}>
                                <Bell className="w-5 h-5" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-start justify-between gap-2 mb-1">
                                  <p className={cn(
                                    "text-sm font-semibold truncate pr-2",
                                    notification.unread ? "text-gray-900 dark:text-white" : "text-gray-600 dark:text-gray-300"
                                  )}>
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
                                  <span className="block w-2 h-2 bg-pink-500 rounded-full" />
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                        {notifications.length === 0 && (
                          <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
                            <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4">
                              <Bell className="w-6 h-6 text-gray-400" />
                            </div>
                            <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-1">
                              Tudo limpo por aqui
                            </h3>
                            <p className="text-xs text-gray-500 dark:text-gray-400 max-w-[200px]">
                              Você não tem novas notificações no momento.
                            </p>
                          </div>
                        )}
                      </div>
                    </DrawerBody>
                    <DrawerFooter className="border-t border-gray-100 dark:border-gray-800 p-6">
                      <Link
                        to="/partner/notifications"
                        onClick={() => setNotificationsOpen(false)}
                        className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-500 hover:to-rose-500 text-white py-3.5 rounded-xl font-bold shadow-lg shadow-pink-500/20 transition-all active:scale-[0.98]"
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
                    "flex items-center gap-2 p-1.5 pr-3 rounded-lg transition-colors",
                    isUserMenuOpen
                      ? "bg-gray-100 dark:bg-gray-700"
                      : "hover:bg-gray-100 dark:hover:bg-gray-700",
                  )}
                >
                  <div className="w-8 h-8 bg-gradient-to-br from-pink-400 to-rose-500 rounded-full flex items-center justify-center text-white text-sm font-bold">
                    {profile?.studio_name?.[0] || profile?.name?.[0] || "P"}
                  </div>
                  <span className="hidden sm:block text-sm font-medium text-gray-700 dark:text-gray-300 max-w-[120px] truncate">
                    {profile?.studio_name || profile?.name || "Parceiro"}
                  </span>
                </button>

                {/* User Drawer */}
                <Drawer
                  open={isUserMenuOpen}
                  onOpenChange={setUserMenuOpen}
                  direction="right"
                >
                  <DrawerContent className="h-full w-full sm:max-w-sm">
                    <DrawerHeader className="border-b border-gray-100 dark:border-gray-800 px-6 py-6">
                      <div className="flex flex-col items-center text-center gap-3">
                        <div className="w-16 h-16 bg-gradient-to-br from-pink-400 to-rose-500 rounded-2xl flex items-center justify-center text-white font-bold text-2xl shadow-lg shadow-pink-500/20 ring-4 ring-pink-50 dark:ring-pink-900/10">
                          {profile?.studio_name?.[0] ||
                            profile?.name?.[0] ||
                            "P"}
                        </div>
                        <div className="min-w-0">
                          <DrawerTitle className="text-lg font-bold text-gray-900 dark:text-white truncate">
                            {profile?.studio_name ||
                              profile?.name ||
                              "Parceiro"}
                          </DrawerTitle>
                          <p className="text-sm text-gray-500 dark:text-gray-400 truncate mt-0.5">
                            {profile?.email}
                          </p>
                        </div>
                      </div>
                    </DrawerHeader>

                    <DrawerBody className="p-6 space-y-8">
                      {/* Theme Selector */}
                      <div>
                        <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-4 uppercase tracking-wider pl-1">
                          Aparência
                        </p>
                        <div className="grid grid-cols-3 gap-3">
                          <button
                            type="button"
                            onClick={() => setTheme("light")}
                            className={cn(
                              "group flex flex-col items-center gap-2 p-3 rounded-2xl border transition-all duration-200 outline-none focus:ring-2 focus:ring-pink-500/20",
                              theme === "light"
                                ? "bg-pink-50 border-pink-200 text-pink-700 dark:bg-pink-900/10 dark:border-pink-800 dark:text-pink-300 shadow-sm"
                                : "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:border-pink-200 dark:hover:border-gray-600 hover:shadow-sm",
                            )}
                          >
                            <div className={cn(
                              "p-2 rounded-full transition-colors",
                              theme === "light" 
                                ? "bg-white dark:bg-pink-900/20" 
                                : "bg-gray-100 dark:bg-gray-700 group-hover:bg-pink-50 dark:group-hover:bg-gray-600"
                            )}>
                              <Sun className="w-5 h-5" />
                            </div>
                            <span className="text-xs font-medium">Claro</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setTheme("dark")}
                            className={cn(
                              "group flex flex-col items-center gap-2 p-3 rounded-2xl border transition-all duration-200 outline-none focus:ring-2 focus:ring-pink-500/20",
                              theme === "dark"
                                ? "bg-gray-800 border-gray-700 text-white dark:bg-gray-800 dark:border-gray-600 dark:text-white shadow-sm"
                                : "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:border-gray-300 dark:hover:border-gray-600 hover:shadow-sm",
                            )}
                          >
                             <div className={cn(
                              "p-2 rounded-full transition-colors",
                              theme === "dark" 
                                ? "bg-gray-700" 
                                : "bg-gray-100 dark:bg-gray-700 group-hover:bg-gray-200 dark:group-hover:bg-gray-600"
                            )}>
                              <MoonStar className="w-5 h-5" />
                            </div>
                            <span className="text-xs font-medium">Escuro</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setTheme("system")}
                            className={cn(
                              "group flex flex-col items-center gap-2 p-3 rounded-2xl border transition-all duration-200 outline-none focus:ring-2 focus:ring-pink-500/20",
                              theme === "system"
                                ? "bg-blue-50 border-blue-200 text-blue-700 dark:bg-blue-900/10 dark:border-blue-800 dark:text-blue-300 shadow-sm"
                                : "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:border-blue-200 dark:hover:border-gray-600 hover:shadow-sm",
                            )}
                          >
                             <div className={cn(
                              "p-2 rounded-full transition-colors",
                              theme === "system" 
                                ? "bg-white dark:bg-blue-900/20" 
                                : "bg-gray-100 dark:bg-gray-700 group-hover:bg-blue-50 dark:group-hover:bg-gray-600"
                            )}>
                              <Monitor className="w-5 h-5" />
                            </div>
                            <span className="text-xs font-medium">Auto</span>
                          </button>
                        </div>
                      </div>

                      {/* Menu Links */}
                      <div>
                        <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-4 uppercase tracking-wider pl-1">
                          Conta
                        </p>
                        <nav className="space-y-2">
                          <Link
                            to="/partner/settings"
                            onClick={() => setUserMenuOpen(false)}
                            className="flex items-center gap-4 p-3 rounded-xl bg-gray-50 dark:bg-gray-800/50 hover:bg-white dark:hover:bg-gray-800 border border-transparent hover:border-gray-200 dark:hover:border-gray-700 hover:shadow-sm transition-all group"
                          >
                            <div className="w-10 h-10 rounded-lg bg-white dark:bg-gray-800 shadow-sm border border-gray-100 dark:border-gray-700 flex items-center justify-center text-gray-500 dark:text-gray-400 group-hover:text-pink-600 dark:group-hover:text-pink-400 group-hover:border-pink-100 dark:group-hover:border-pink-900/30 transition-colors">
                              <Settings className="w-5 h-5" />
                            </div>
                            <div className="flex-1">
                              <p className="text-sm font-semibold text-gray-900 dark:text-white group-hover:text-pink-600 dark:group-hover:text-pink-400 transition-colors">
                                Configurações
                              </p>
                              <p className="text-xs text-gray-500 dark:text-gray-400">
                                Gerencie seus dados
                              </p>
                            </div>
                            <div className="text-gray-400 group-hover:translate-x-1 transition-transform">
                              <ChevronRight className="w-5 h-5" />
                            </div>
                          </Link>
                        </nav>
                      </div>
                    </DrawerBody>

                    <DrawerFooter className="border-t border-gray-100 dark:border-gray-800 p-6">
                      <button
                        onClick={handleLogout}
                        disabled={logoutMutation.isPending}
                        className="flex items-center justify-center gap-2 w-full px-4 py-3.5 text-sm font-bold text-white bg-red-600 hover:bg-red-700 rounded-xl shadow-lg shadow-red-500/20 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <LogOut className="w-4 h-4" />
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
        <main className="flex-1 pb-24">
          {/* Page header (mobile sticky) */}
          {pageHeader ? (
            <div className="md:hidden sticky top-16 z-30 border-b border-gray-200 dark:border-gray-800 bg-gray-50/95 dark:bg-gray-900/80 backdrop-blur">
              <div className="max-w-6xl mx-auto px-4 py-2.5 flex items-center gap-3">
                {pageHeader.backTo ? (
                  <Link
                    to={pageHeader.backTo}
                    aria-label={pageHeader.backLabel || "Voltar"}
                    className="inline-flex items-center justify-center w-9 h-9 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:text-pink-600 dark:hover:text-pink-400 hover:border-pink-300 dark:hover:border-pink-700 hover:bg-pink-50 dark:hover:bg-pink-900/20 transition-all duration-200"
                  >
                    <ArrowLeft className="w-4 h-4" />
                  </Link>
                ) : null}

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                      {pageHeader.title}
                    </p>
                    {pageHeader.badge?.text ? (
                      <span
                        className={cn(
                          "inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium flex-shrink-0",
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

      {/* Floating Bottom Navigation - hidden on settings/notifications */}
      {!HIDE_NAV_ROUTES.some((route) =>
        location.pathname.startsWith(route),
      ) && (
        <nav
          className="fixed bottom-4 left-1/2 z-50 flex w-[calc(100%-2rem)] max-w-md -translate-x-1/2 items-center rounded-full border border-gray-200/60 dark:border-gray-600/40 bg-white/95 dark:bg-gray-800/95 px-2 py-2 shadow-[0_4px_24px_rgba(0,0,0,0.08),0_2px_8px_rgba(0,0,0,0.04)] dark:shadow-[0_4px_24px_rgba(0,0,0,0.35),0_0_0_1px_rgba(255,255,255,0.03),0_0_30px_rgba(244,114,182,0.12)] backdrop-blur-lg ring-1 ring-black/[0.03] dark:ring-white/[0.06]"
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
                      "relative isolate flex flex-1 items-center justify-center overflow-hidden rounded-full text-sm font-semibold transition-all duration-300 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-500/40 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-gray-800",
                      isActive
                        ? "px-4 py-2.5 text-white"
                        : "px-3 py-2 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100/60 dark:hover:bg-gray-700/40",
                    )
                  }
                >
                  {({ isActive }) => (
                    <>
                      {isActive && (
                        <motion.span
                          layoutId="partner-nav-pill"
                          className="absolute inset-0 rounded-full bg-gradient-to-r from-pink-500 to-rose-500 shadow-[0_4px_16px_rgba(236,72,153,0.4),0_0_12px_rgba(244,114,182,0.3)]"
                          transition={{
                            type: "spring",
                            stiffness: 400,
                            damping: 30,
                          }}
                        />
                      )}
                      <span className="relative z-10 inline-flex items-center justify-center gap-2">
                        <Icon
                          className={cn(
                            "h-5 w-5 transition-all duration-300",
                            isActive
                              ? "text-white"
                              : "text-gray-500 dark:text-gray-400",
                          )}
                        />
                        {isActive && (
                          <span className="text-sm font-semibold tracking-tight">
                            {link.label}
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
      )}

      {/* Offline Banner */}
      <OfflineBanner />
    </div>
  );
}

export default PartnerLayout;
