/**
 * Partner Portal Layout
 *
 * Layout unificado para todas as páginas do Portal do Parceiro.
 * Inclui header com navegação, notificações e menu do usuário.
 */

import { useState, useRef, useEffect } from "react";
import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  Bell,
  ChevronDown,
  CreditCard,
  Home,
  LogOut,
  Menu,
  Monitor,
  Moon,
  Package,
  Settings,
  Sparkles,
  Sun,
  User,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useLogout } from "@/hooks/api";
import { useAuthStore } from "@/store/auth";
import { useTheme } from "@/hooks/useTheme";
import { getPartnerProfile } from "@/features/partner-portal/api";
import {
  PartnerPageHeaderContext,
  type PartnerPageHeaderBadgeTone,
  type PartnerPageHeaderConfig,
} from "@/layouts/partnerPageHeader";
import { usePartnerKeyboardShortcuts } from "@/hooks/usePartnerKeyboardShortcuts";
import { OfflineBanner } from "@/components/OfflineBanner";

const NAV_LINKS = [
  { to: "/partner", label: "Dashboard", icon: Home, end: true },
  { to: "/partner/deliveries", label: "Entregas", icon: Package, end: false },
  { to: "/partner/credits", label: "Créditos", icon: CreditCard, end: false },
];

// Placeholder notifications - TODO: integrate with real API
const MOCK_NOTIFICATIONS = [
  {
    id: "1",
    title: "Voucher resgatado",
    description: "Cliente Maria resgatou o voucher #ABC123",
    time: "Há 2 horas",
    unread: true,
  },
  {
    id: "2",
    title: "Créditos adicionados",
    description: "5 créditos foram adicionados à sua conta",
    time: "Ontem",
    unread: false,
  },
];

export function PartnerLayout() {
  const navigate = useNavigate();
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
  const [isMobileMenuOpen, setMobileMenuOpen] = useState(false);

  const notificationsRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);

  // Fetch partner profile
  const { data: profile } = useQuery({
    queryKey: ["partner", "profile"],
    queryFn: getPartnerProfile,
  });

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        notificationsRef.current &&
        event.target instanceof Node &&
        !notificationsRef.current.contains(event.target)
      ) {
        setNotificationsOpen(false);
      }
      if (
        userMenuRef.current &&
        event.target instanceof Node &&
        !userMenuRef.current.contains(event.target)
      ) {
        setUserMenuOpen(false);
      }
    };

    if (isNotificationsOpen || isUserMenuOpen) {
      // Use 'click' instead of 'pointerdown' to avoid race condition with onClick handlers
      document.addEventListener("click", handleClickOutside);
      return () => document.removeEventListener("click", handleClickOutside);
    }
  }, [isNotificationsOpen, isUserMenuOpen]);

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

  const unreadCount = MOCK_NOTIFICATIONS.filter((n) => n.unread).length;

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
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col transition-colors">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-sm">
        <div className="max-w-6xl mx-auto px-4">
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

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-1 absolute left-1/2 -translate-x-1/2">
              {NAV_LINKS.map((link) => (
                <NavLink
                  key={link.to}
                  to={link.to}
                  end={link.end}
                  className={({ isActive }) =>
                    cn(
                      "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors",
                      isActive
                        ? "bg-pink-50 text-pink-600 dark:bg-pink-900/30 dark:text-pink-400"
                        : "text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-700 dark:hover:text-white",
                    )
                  }
                >
                  <link.icon className="w-4 h-4" />
                  {link.label}
                </NavLink>
              ))}
            </nav>

            {/* Right Side Actions */}
            <div className="flex items-center gap-2">
              {/* Notifications */}
              <div className="relative" ref={notificationsRef}>
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

                {/* Notifications Dropdown */}
                {isNotificationsOpen && (
                  <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-lg overflow-hidden z-50">
                    <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-gray-700">
                      <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                        Notificações
                      </h3>
                      <button className="text-xs text-pink-600 dark:text-pink-400 hover:text-pink-700 dark:hover:text-pink-300 font-medium">
                        Marcar como lidas
                      </button>
                    </div>
                    <div className="divide-y divide-gray-100 dark:divide-gray-700 max-h-80 overflow-y-auto">
                      {MOCK_NOTIFICATIONS.map((notification) => (
                        <div
                          key={notification.id}
                          className={cn(
                            "px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer",
                            notification.unread &&
                              "bg-pink-50/50 dark:bg-pink-900/20",
                          )}
                        >
                          <div className="flex items-start gap-3">
                            {notification.unread && (
                              <span className="w-2 h-2 mt-1.5 bg-pink-500 rounded-full flex-shrink-0" />
                            )}
                            <div className={notification.unread ? "" : "ml-5"}>
                              <p className="text-sm font-medium text-gray-900 dark:text-white">
                                {notification.title}
                              </p>
                              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                                {notification.description}
                              </p>
                              <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-1">
                                {notification.time}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="px-4 py-3 border-t border-gray-100 dark:border-gray-700">
                      <Link
                        to="/partner/notifications"
                        onClick={() => setNotificationsOpen(false)}
                        className="w-full block text-center text-sm text-pink-600 dark:text-pink-400 hover:text-pink-700 dark:hover:text-pink-300 font-medium"
                      >
                        Ver todas as notificações
                      </Link>
                    </div>
                  </div>
                )}
              </div>

              {/* User Menu */}
              <div className="relative" ref={userMenuRef} data-tour="user-menu">
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
                  <ChevronDown className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                </button>

                {/* User Dropdown */}
                {isUserMenuOpen && (
                  <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-lg overflow-hidden z-50">
                    {/* User Info */}
                    <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700">
                      <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                        {profile?.studio_name || profile?.name || "Parceiro"}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                        {profile?.email}
                      </p>
                    </div>

                    {/* Menu Items */}
                    <div className="py-1">
                      <Link
                        to="/partner/settings"
                        onClick={() => setUserMenuOpen(false)}
                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors dark:text-gray-200 dark:hover:bg-gray-700"
                      >
                        <Settings className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                        Configurações
                      </Link>
                    </div>

                    {/* Theme Selector */}
                    <div className="border-t border-gray-100 dark:border-gray-700 py-2 px-4">
                      <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">
                        Tema
                      </p>
                      <div className="grid grid-cols-3 gap-1 bg-gray-100 dark:bg-gray-700 p-1 rounded-lg">
                        <button
                          type="button"
                          onClick={() => setTheme("light")}
                          title="Tema Claro"
                          className={cn(
                            "flex items-center justify-center gap-1 px-2 py-1.5 rounded-md text-xs font-medium transition-all",
                            theme === "light"
                              ? "bg-white dark:bg-gray-600 text-pink-600 dark:text-pink-400 shadow-sm"
                              : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white",
                          )}
                        >
                          <Sun className="w-3.5 h-3.5" />
                          <span className="hidden sm:inline">Claro</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setTheme("dark")}
                          title="Tema Escuro"
                          className={cn(
                            "flex items-center justify-center gap-1 px-2 py-1.5 rounded-md text-xs font-medium transition-all",
                            theme === "dark"
                              ? "bg-white dark:bg-gray-600 text-pink-600 dark:text-pink-400 shadow-sm"
                              : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white",
                          )}
                        >
                          <Moon className="w-3.5 h-3.5" />
                          <span className="hidden sm:inline">Escuro</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setTheme("system")}
                          title="Seguir Sistema"
                          className={cn(
                            "flex items-center justify-center gap-1 px-2 py-1.5 rounded-md text-xs font-medium transition-all",
                            theme === "system"
                              ? "bg-white dark:bg-gray-600 text-pink-600 dark:text-pink-400 shadow-sm"
                              : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white",
                          )}
                        >
                          <Monitor className="w-3.5 h-3.5" />
                          <span className="hidden sm:inline">Auto</span>
                        </button>
                      </div>
                    </div>

                    {/* Logout */}
                    <div className="border-t border-gray-100 dark:border-gray-700 py-1">
                      <button
                        onClick={handleLogout}
                        disabled={logoutMutation.isPending}
                        className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors disabled:opacity-50"
                      >
                        <LogOut className="w-4 h-4" />
                        {logoutMutation.isPending ? "Saindo..." : "Sair"}
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Mobile Menu Button */}
              <button
                type="button"
                onClick={() => setMobileMenuOpen((prev) => !prev)}
                className="md:hidden p-2 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-700 dark:hover:text-white"
                aria-label="Menu"
              >
                {isMobileMenuOpen ? (
                  <X className="w-5 h-5" />
                ) : (
                  <Menu className="w-5 h-5" />
                )}
              </button>
            </div>
          </div>

          {/* Mobile Navigation */}
          {isMobileMenuOpen && (
            <nav className="md:hidden py-4 border-t border-gray-100 dark:border-gray-700">
              {NAV_LINKS.map((link) => (
                <NavLink
                  key={link.to}
                  to={link.to}
                  end={link.end}
                  onClick={() => setMobileMenuOpen(false)}
                  className={({ isActive }) =>
                    cn(
                      "flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors",
                      isActive
                        ? "bg-pink-50 dark:bg-pink-900/30 text-pink-600 dark:text-pink-400"
                        : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700",
                    )
                  }
                >
                  <link.icon className="w-5 h-5" />
                  {link.label}
                </NavLink>
              ))}
            </nav>
          )}
        </div>
      </header>

      {/* Main Content */}
      <PartnerPageHeaderContext.Provider value={{ setHeader: setPageHeader }}>
        <main className="flex-1">
          {/* Page header (mobile sticky) */}
          {pageHeader ? (
            <div className="md:hidden sticky top-16 z-30 border-b border-gray-200 dark:border-gray-800 bg-gray-50/95 dark:bg-gray-900/80 backdrop-blur">
              <div className="max-w-6xl mx-auto px-4 py-2.5 flex items-center gap-3">
                {pageHeader.backTo ? (
                  <Link
                    to={pageHeader.backTo}
                    aria-label={pageHeader.backLabel || "Voltar"}
                    className="inline-flex items-center justify-center w-9 h-9 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200"
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

      {/* Offline Banner */}
      <OfflineBanner />
    </div>
  );
}

export default PartnerLayout;
