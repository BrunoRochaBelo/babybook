/**
 * B2C User Drawer
 *
 * Drawer lateral para menu do usuário no app B2C.
 * Inclui informações do usuário, seletor de tema, link para configurações e logout.
 */

import { Link } from "react-router-dom";
import { Settings, LogOut, ChevronRight, User, Sun, Moon, Monitor } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTheme, type Theme } from "@/hooks/useTheme";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerBody,
  DrawerFooter,
  DrawerTitle,
} from "@/components/ui/drawer";

interface B2CUserDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userName?: string;
  userEmail?: string;
  userAvatar?: string;
  onLogout?: () => void;
  isLoggingOut?: boolean;
}

const THEME_OPTIONS: Array<{ value: Theme; label: string; icon: React.ElementType }> = [
  { value: "light", label: "Claro", icon: Sun },
  { value: "dark", label: "Escuro", icon: Moon },
  { value: "system", label: "Sistema", icon: Monitor },
];

export function B2CUserDrawer({
  open,
  onOpenChange,
  userName = "Usuário",
  userEmail,
  userAvatar,
  onLogout,
  isLoggingOut = false,
}: B2CUserDrawerProps) {
  const { theme, setTheme } = useTheme();

  return (
    <Drawer open={open} onOpenChange={onOpenChange} direction="right">
      <DrawerContent
        className="h-full w-full sm:max-w-sm"
        style={{ backgroundColor: "var(--bb-color-surface)" }}
      >
        <DrawerHeader
          className="px-6 py-6"
          style={{
            borderBottom: "1px solid var(--bb-color-border)",
            backgroundColor: "var(--bb-color-surface)",
          }}
        >
          <div className="flex flex-col items-center text-center gap-3">
            {/* Avatar */}
            {userAvatar ? (
              <img
                src={userAvatar}
                alt={userName}
                className="w-16 h-16 rounded-2xl object-cover shadow-lg ring-4 ring-[var(--bb-color-muted)]/20"
              />
            ) : (
              <div className="w-16 h-16 bg-gradient-to-br from-[var(--bb-color-accent)] to-[var(--bb-color-accent)]/80 rounded-2xl flex items-center justify-center text-white font-bold text-2xl shadow-lg shadow-[var(--bb-color-accent)]/20 ring-4 ring-[var(--bb-color-accent)]/10">
                {userName?.[0]?.toUpperCase() || "U"}
              </div>
            )}
            <div className="min-w-0">
              <DrawerTitle className="text-lg font-bold text-[var(--bb-color-ink)] truncate font-serif">
                {userName}
              </DrawerTitle>
              {userEmail && (
                <p className="text-sm text-[var(--bb-color-ink-muted)] truncate mt-0.5">
                  {userEmail}
                </p>
              )}
            </div>
          </div>
        </DrawerHeader>

        <DrawerBody
          className="p-6 space-y-8"
          style={{ backgroundColor: "var(--bb-color-surface)" }}
        >
          {/* Theme Selector */}
          <div>
            <p className="text-xs font-semibold text-[var(--bb-color-ink-muted)] mb-4 uppercase tracking-wider pl-1">
              Tema
            </p>
            <div className="flex gap-2 p-1 rounded-2xl bg-[var(--bb-color-bg)] border border-[var(--bb-color-border)]">
              {THEME_OPTIONS.map((option) => {
                const Icon = option.icon;
                const isActive = theme === option.value;
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setTheme(option.value)}
                    className={cn(
                      "flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200",
                      isActive
                        ? "bg-[var(--bb-color-surface)] text-[var(--bb-color-accent)] shadow-sm border border-[var(--bb-color-border)]"
                        : "text-[var(--bb-color-ink-muted)] hover:text-[var(--bb-color-ink)] hover:bg-[var(--bb-color-surface)]/50"
                    )}
                    aria-pressed={isActive}
                  >
                    <Icon className="w-4 h-4" />
                    <span className="hidden sm:inline">{option.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Menu Links */}
          <div>
            <p className="text-xs font-semibold text-[var(--bb-color-ink-muted)] mb-4 uppercase tracking-wider pl-1">
              Conta
            </p>
            <nav className="space-y-2">
              {/* Perfil */}
              <Link
                to="/jornada/perfil-usuario"
                onClick={() => onOpenChange(false)}
                className="flex items-center gap-4 p-3 rounded-xl bg-[var(--bb-color-bg)] hover:bg-[var(--bb-color-surface)] border border-transparent hover:border-[var(--bb-color-border)] hover:shadow-sm transition-all group"
              >
                <div className="w-10 h-10 rounded-lg bg-[var(--bb-color-surface)] shadow-sm border border-[var(--bb-color-border)] flex items-center justify-center text-[var(--bb-color-ink-muted)] group-hover:text-[var(--bb-color-accent)] group-hover:border-[var(--bb-color-accent)]/30 transition-colors">
                  <User className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-[var(--bb-color-ink)] group-hover:text-[var(--bb-color-accent)] transition-colors">
                    Meu Perfil
                  </p>
                  <p className="text-xs text-[var(--bb-color-ink-muted)]">
                    Seus dados pessoais
                  </p>
                </div>
                <div className="text-[var(--bb-color-ink-muted)] group-hover:translate-x-1 transition-transform">
                  <ChevronRight className="w-5 h-5" />
                </div>
              </Link>

              {/* Configurações */}
              <Link
                to="/configuracoes"
                onClick={() => onOpenChange(false)}
                className="flex items-center gap-4 p-3 rounded-xl bg-[var(--bb-color-bg)] hover:bg-[var(--bb-color-surface)] border border-transparent hover:border-[var(--bb-color-border)] hover:shadow-sm transition-all group"
              >
                <div className="w-10 h-10 rounded-lg bg-[var(--bb-color-surface)] shadow-sm border border-[var(--bb-color-border)] flex items-center justify-center text-[var(--bb-color-ink-muted)] group-hover:text-[var(--bb-color-accent)] group-hover:border-[var(--bb-color-accent)]/30 transition-colors">
                  <Settings className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-[var(--bb-color-ink)] group-hover:text-[var(--bb-color-accent)] transition-colors">
                    Configurações
                  </p>
                  <p className="text-xs text-[var(--bb-color-ink-muted)]">
                    Preferências do app
                  </p>
                </div>
                <div className="text-[var(--bb-color-ink-muted)] group-hover:translate-x-1 transition-transform">
                  <ChevronRight className="w-5 h-5" />
                </div>
              </Link>
            </nav>
          </div>
        </DrawerBody>

        <DrawerFooter
          className="p-6"
          style={{
            borderTop: "1px solid var(--bb-color-border)",
            backgroundColor: "var(--bb-color-bg)",
          }}
        >
          <button
            onClick={onLogout}
            disabled={isLoggingOut}
            className="flex items-center justify-center gap-2 w-full px-4 py-3.5 text-sm font-bold text-white bg-[var(--bb-color-danger)] hover:bg-[var(--bb-color-danger)]/90 rounded-2xl shadow-lg shadow-[var(--bb-color-danger)]/20 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <LogOut className="w-4 h-4" />
            {isLoggingOut ? "Saindo..." : "Sair da conta"}
          </button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
