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
  Bell,
  ChevronDown,
  CreditCard,
  Home,
  LogOut,
  Package,
  Settings,
  Sparkles,
  User,
  Menu,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useLogout } from "@/hooks/api";
import { useAuthStore } from "@/store/auth";
import { getPartnerProfile } from "@/features/partner-portal/api";

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
      document.addEventListener("pointerdown", handleClickOutside);
      return () =>
        document.removeEventListener("pointerdown", handleClickOutside);
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

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            {/* Logo & Brand */}
            <div className="flex items-center gap-8">
              <Link
                to="/partner"
                className="flex items-center gap-2 text-xl font-bold text-gray-900"
              >
                <Sparkles className="w-6 h-6 text-pink-500" />
                <span>
                  Baby Book <span className="text-pink-500">PRO</span>
                </span>
              </Link>

              {/* Desktop Navigation */}
              <nav className="hidden md:flex items-center gap-1">
                {NAV_LINKS.map((link) => (
                  <NavLink
                    key={link.to}
                    to={link.to}
                    end={link.end}
                    className={({ isActive }) =>
                      cn(
                        "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors",
                        isActive
                          ? "bg-pink-50 text-pink-600"
                          : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                      )
                    }
                  >
                    <link.icon className="w-4 h-4" />
                    {link.label}
                  </NavLink>
                ))}
              </nav>
            </div>

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
                  className={cn(
                    "relative p-2 rounded-lg transition-colors",
                    isNotificationsOpen
                      ? "bg-gray-100 text-gray-900"
                      : "text-gray-500 hover:bg-gray-100 hover:text-gray-700"
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
                  <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl border border-gray-200 shadow-lg overflow-hidden z-50">
                    <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                      <h3 className="text-sm font-semibold text-gray-900">
                        Notificações
                      </h3>
                      <button className="text-xs text-pink-600 hover:text-pink-700 font-medium">
                        Marcar como lidas
                      </button>
                    </div>
                    <div className="divide-y divide-gray-100 max-h-80 overflow-y-auto">
                      {MOCK_NOTIFICATIONS.map((notification) => (
                        <div
                          key={notification.id}
                          className={cn(
                            "px-4 py-3 hover:bg-gray-50 cursor-pointer",
                            notification.unread && "bg-pink-50/50"
                          )}
                        >
                          <div className="flex items-start gap-3">
                            {notification.unread && (
                              <span className="w-2 h-2 mt-1.5 bg-pink-500 rounded-full flex-shrink-0" />
                            )}
                            <div className={notification.unread ? "" : "ml-5"}>
                              <p className="text-sm font-medium text-gray-900">
                                {notification.title}
                              </p>
                              <p className="text-xs text-gray-500 mt-0.5">
                                {notification.description}
                              </p>
                              <p className="text-[11px] text-gray-400 mt-1">
                                {notification.time}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="px-4 py-3 border-t border-gray-100">
                      <Link
                        to="/partner/notifications"
                        onClick={() => setNotificationsOpen(false)}
                        className="w-full block text-center text-sm text-pink-600 hover:text-pink-700 font-medium"
                      >
                        Ver todas as notificações
                      </Link>
                    </div>
                  </div>
                )}
              </div>

              {/* User Menu */}
              <div className="relative" ref={userMenuRef}>
                <button
                  type="button"
                  onClick={() => {
                    setNotificationsOpen(false);
                    setUserMenuOpen((prev) => !prev);
                  }}
                  className={cn(
                    "flex items-center gap-2 p-1.5 pr-3 rounded-lg transition-colors",
                    isUserMenuOpen
                      ? "bg-gray-100"
                      : "hover:bg-gray-100"
                  )}
                >
                  <div className="w-8 h-8 bg-gradient-to-br from-pink-400 to-rose-500 rounded-full flex items-center justify-center text-white text-sm font-bold">
                    {profile?.studio_name?.[0] || profile?.name?.[0] || "P"}
                  </div>
                  <span className="hidden sm:block text-sm font-medium text-gray-700 max-w-[120px] truncate">
                    {profile?.studio_name || profile?.name || "Parceiro"}
                  </span>
                  <ChevronDown className="w-4 h-4 text-gray-400" />
                </button>

                {/* User Dropdown */}
                {isUserMenuOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl border border-gray-200 shadow-lg overflow-hidden z-50">
                    {/* User Info */}
                    <div className="px-4 py-3 border-b border-gray-100">
                      <p className="text-sm font-semibold text-gray-900 truncate">
                        {profile?.studio_name || profile?.name || "Parceiro"}
                      </p>
                      <p className="text-xs text-gray-500 truncate">
                        {profile?.email}
                      </p>
                    </div>

                    {/* Menu Items */}
                    <div className="py-1">
                      <Link
                        to="/partner/settings"
                        onClick={() => setUserMenuOpen(false)}
                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                      >
                        <Settings className="w-4 h-4 text-gray-400" />
                        Configurações
                      </Link>
                    </div>

                    {/* Logout */}
                    <div className="border-t border-gray-100 py-1">
                      <button
                        onClick={handleLogout}
                        disabled={logoutMutation.isPending}
                        className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50"
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
                className="md:hidden p-2 rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-700"
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
            <nav className="md:hidden py-4 border-t border-gray-100">
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
                        ? "bg-pink-50 text-pink-600"
                        : "text-gray-600 hover:bg-gray-100"
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
      <main className="flex-1">
        <Outlet />
      </main>
    </div>
  );
}

export default PartnerLayout;
