/**
 * B2C Main Drawer
 *
 * Drawer lateral unificado para o app B2C.
 * Combina a seleção de criança/álbum com as configurações do usuário.
 */

import { Link } from "react-router-dom";
import {
  Settings,
  LogOut,
  ChevronRight,
  Sun,
  Moon,
  Monitor,
  Baby,
  Check,
  UserPlus,
  Bell,
  Shield,
  HelpCircle,
  FileText,
} from "lucide-react";
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

interface Child {
  id: string;
  name: string;
  birthday?: string | null;
  avatarUrl?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

interface B2CMainDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userName?: string;
  userEmail?: string;
  userAvatar?: string;
  children: Child[];
  selectedChild: Child | null;
  onSelectChild: (childId: string) => void;
  onLogout?: () => void;
  isLoggingOut?: boolean;
}

const THEME_OPTIONS: Array<{ value: Theme; label: string; icon: React.ElementType }> = [
  { value: "light", label: "Claro", icon: Sun },
  { value: "dark", label: "Escuro", icon: Moon },
  { value: "system", label: "Sistema", icon: Monitor },
];

export function B2CMainDrawer({
  open,
  onOpenChange,
  userName = "Usuário",
  userEmail,
  userAvatar,
  children,
  selectedChild,
  onSelectChild,
  onLogout,
  isLoggingOut = false,
}: B2CMainDrawerProps) {
  const { theme, setTheme } = useTheme();

  const hasChildren = children.length > 0;

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
          className="p-6 space-y-6 overflow-y-auto"
          style={{ backgroundColor: "var(--bb-color-surface)" }}
        >
          {/* Child Selector Section */}
          <div>
            <p className="text-xs font-semibold text-[var(--bb-color-ink-muted)] mb-3 uppercase tracking-wider pl-1">
              Álbum
            </p>
            <div className="space-y-2">
              {hasChildren ? (
                <>
                  {children.map((child) => {
                    const isSelected = selectedChild?.id === child.id;
                    return (
                      <button
                        key={child.id}
                        type="button"
                        onClick={() => {
                          onSelectChild(child.id);
                          onOpenChange(false);
                        }}
                        className={cn(
                          "w-full flex items-center gap-3 p-3 rounded-xl border transition-all",
                          isSelected
                            ? "border-[var(--bb-color-accent)] bg-[var(--bb-color-accent)]/5"
                            : "border-[var(--bb-color-border)] bg-[var(--bb-color-bg)] hover:border-[var(--bb-color-ink-muted)]"
                        )}
                      >
                        <div
                          className={cn(
                            "w-10 h-10 rounded-lg flex items-center justify-center text-white font-semibold text-sm",
                            isSelected
                              ? "bg-[var(--bb-color-accent)]"
                              : "bg-[var(--bb-color-ink-muted)]"
                          )}
                        >
                          {child.avatarUrl ? (
                            <img
                              src={child.avatarUrl}
                              alt={child.name}
                              className="w-full h-full rounded-lg object-cover"
                            />
                          ) : (
                            child.name[0]?.toUpperCase() || "?"
                          )}
                        </div>
                        <span
                          className={cn(
                            "flex-1 text-left font-medium",
                            isSelected
                              ? "text-[var(--bb-color-accent)]"
                              : "text-[var(--bb-color-ink)]"
                          )}
                        >
                          {child.name}
                        </span>
                        {isSelected && (
                          <Check className="w-5 h-5 text-[var(--bb-color-accent)]" />
                        )}
                      </button>
                    );
                  })}

                  {/* Link para perfil da criança */}
                  <Link
                    to="/jornada/perfil-crianca"
                    onClick={() => onOpenChange(false)}
                    className="flex items-center gap-3 p-3 rounded-xl bg-[var(--bb-color-bg)] hover:bg-[var(--bb-color-surface)] border border-transparent hover:border-[var(--bb-color-border)] hover:shadow-sm transition-all group"
                  >
                    <div className="w-10 h-10 rounded-lg bg-[var(--bb-color-surface)] shadow-sm border border-[var(--bb-color-border)] flex items-center justify-center text-[var(--bb-color-ink-muted)] group-hover:text-[var(--bb-color-accent)] group-hover:border-[var(--bb-color-accent)]/30 transition-colors">
                      <Baby className="w-5 h-5" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-[var(--bb-color-ink)] group-hover:text-[var(--bb-color-accent)] transition-colors">
                        Perfil da criança
                      </p>
                      <p className="text-xs text-[var(--bb-color-ink-muted)]">
                        Editar dados e foto
                      </p>
                    </div>
                    <div className="text-[var(--bb-color-ink-muted)] group-hover:translate-x-1 transition-transform">
                      <ChevronRight className="w-5 h-5" />
                    </div>
                  </Link>
                </>
              ) : (
                <div
                  className="rounded-xl border border-dashed p-4 text-center"
                  style={{
                    borderColor: "var(--bb-color-border)",
                  }}
                >
                  <UserPlus
                    className="w-8 h-8 mx-auto mb-2"
                    style={{ color: "var(--bb-color-ink-muted)" }}
                  />
                  <p
                    className="text-sm mb-3"
                    style={{ color: "var(--bb-color-ink-muted)" }}
                  >
                    Cadastre sua primeira criança para desbloquear a jornada guiada.
                  </p>
                  <Link
                    to="/jornada/perfil-crianca"
                    onClick={() => onOpenChange(false)}
                    className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all"
                    style={{
                      backgroundColor: "var(--bb-color-accent)",
                      color: "var(--bb-color-surface)",
                    }}
                  >
                    Cadastrar criança
                  </Link>
                </div>
              )}
            </div>
          </div>

          {/* Theme Selector */}
          <div>
            <p className="text-xs font-semibold text-[var(--bb-color-ink-muted)] mb-3 uppercase tracking-wider pl-1">
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

          {/* Account Menu Links */}
          <div>
            <p className="text-xs font-semibold text-[var(--bb-color-ink-muted)] mb-3 uppercase tracking-wider pl-1">
              Conta
            </p>
            <nav className="space-y-2">
              {/* Minha Conta (unificando Perfil + Configurações) */}
              <Link
                to="/jornada/minha-conta"
                onClick={() => onOpenChange(false)}
                className="flex items-center gap-4 p-3 rounded-xl bg-[var(--bb-color-bg)] hover:bg-[var(--bb-color-surface)] border border-transparent hover:border-[var(--bb-color-border)] hover:shadow-sm transition-all group"
              >
                <div className="w-10 h-10 rounded-lg bg-[var(--bb-color-surface)] shadow-sm border border-[var(--bb-color-border)] flex items-center justify-center text-[var(--bb-color-ink-muted)] group-hover:text-[var(--bb-color-accent)] group-hover:border-[var(--bb-color-accent)]/30 transition-colors">
                  <Settings className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-[var(--bb-color-ink)] group-hover:text-[var(--bb-color-accent)] transition-colors">
                    Minha Conta
                  </p>
                  <p className="text-xs text-[var(--bb-color-ink-muted)]">
                    Perfil e preferências
                  </p>
                </div>
                <div className="text-[var(--bb-color-ink-muted)] group-hover:translate-x-1 transition-transform">
                  <ChevronRight className="w-5 h-5" />
                </div>
              </Link>

              {/* Notificações */}
              <Link
                to="/jornada/notificacoes"
                onClick={() => onOpenChange(false)}
                className="flex items-center gap-4 p-3 rounded-xl bg-[var(--bb-color-bg)] hover:bg-[var(--bb-color-surface)] border border-transparent hover:border-[var(--bb-color-border)] hover:shadow-sm transition-all group"
              >
                <div className="w-10 h-10 rounded-lg bg-[var(--bb-color-surface)] shadow-sm border border-[var(--bb-color-border)] flex items-center justify-center text-[var(--bb-color-ink-muted)] group-hover:text-[var(--bb-color-accent)] group-hover:border-[var(--bb-color-accent)]/30 transition-colors">
                  <Bell className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-[var(--bb-color-ink)] group-hover:text-[var(--bb-color-accent)] transition-colors">
                    Notificações
                  </p>
                  <p className="text-xs text-[var(--bb-color-ink-muted)]">
                    Alertas e lembretes
                  </p>
                </div>
                <div className="text-[var(--bb-color-ink-muted)] group-hover:translate-x-1 transition-transform">
                  <ChevronRight className="w-5 h-5" />
                </div>
              </Link>

              {/* Privacidade e Compartilhamento */}
              <Link
                to="/jornada/privacidade"
                onClick={() => onOpenChange(false)}
                className="flex items-center gap-4 p-3 rounded-xl bg-[var(--bb-color-bg)] hover:bg-[var(--bb-color-surface)] border border-transparent hover:border-[var(--bb-color-border)] hover:shadow-sm transition-all group"
              >
                <div className="w-10 h-10 rounded-lg bg-[var(--bb-color-surface)] shadow-sm border border-[var(--bb-color-border)] flex items-center justify-center text-[var(--bb-color-ink-muted)] group-hover:text-[var(--bb-color-accent)] group-hover:border-[var(--bb-color-accent)]/30 transition-colors">
                  <Shield className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-[var(--bb-color-ink)] group-hover:text-[var(--bb-color-accent)] transition-colors">
                    Privacidade
                  </p>
                  <p className="text-xs text-[var(--bb-color-ink-muted)]">
                    Compartilhamento e permissões
                  </p>
                </div>
                <div className="text-[var(--bb-color-ink-muted)] group-hover:translate-x-1 transition-transform">
                  <ChevronRight className="w-5 h-5" />
                </div>
              </Link>
            </nav>
          </div>

          {/* Help Section */}
          <div>
            <p className="text-xs font-semibold text-[var(--bb-color-ink-muted)] mb-3 uppercase tracking-wider pl-1">
              Ajuda
            </p>
            <nav className="space-y-2">
              {/* Central de Ajuda */}
              <Link
                to="/jornada/ajuda"
                onClick={() => onOpenChange(false)}
                className="flex items-center gap-4 p-3 rounded-xl bg-[var(--bb-color-bg)] hover:bg-[var(--bb-color-surface)] border border-transparent hover:border-[var(--bb-color-border)] hover:shadow-sm transition-all group"
              >
                <div className="w-10 h-10 rounded-lg bg-[var(--bb-color-surface)] shadow-sm border border-[var(--bb-color-border)] flex items-center justify-center text-[var(--bb-color-ink-muted)] group-hover:text-[var(--bb-color-accent)] group-hover:border-[var(--bb-color-accent)]/30 transition-colors">
                  <HelpCircle className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-[var(--bb-color-ink)] group-hover:text-[var(--bb-color-accent)] transition-colors">
                    Central de Ajuda
                  </p>
                  <p className="text-xs text-[var(--bb-color-ink-muted)]">
                    Dúvidas e suporte
                  </p>
                </div>
                <div className="text-[var(--bb-color-ink-muted)] group-hover:translate-x-1 transition-transform">
                  <ChevronRight className="w-5 h-5" />
                </div>
              </Link>

              {/* Termos e Políticas */}
              <Link
                to="/jornada/termos"
                onClick={() => onOpenChange(false)}
                className="flex items-center gap-4 p-3 rounded-xl bg-[var(--bb-color-bg)] hover:bg-[var(--bb-color-surface)] border border-transparent hover:border-[var(--bb-color-border)] hover:shadow-sm transition-all group"
              >
                <div className="w-10 h-10 rounded-lg bg-[var(--bb-color-surface)] shadow-sm border border-[var(--bb-color-border)] flex items-center justify-center text-[var(--bb-color-ink-muted)] group-hover:text-[var(--bb-color-accent)] group-hover:border-[var(--bb-color-accent)]/30 transition-colors">
                  <FileText className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-[var(--bb-color-ink)] group-hover:text-[var(--bb-color-accent)] transition-colors">
                    Termos e Políticas
                  </p>
                  <p className="text-xs text-[var(--bb-color-ink-muted)]">
                    Uso e privacidade
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
