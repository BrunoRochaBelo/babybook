/**
 * B2C Main Drawer
 *
 * Drawer lateral unificado para o app B2C.
 * Organizado para oferecer uma experiência "premium" e fluida.
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
  Shield,
  HelpCircle,
  FileText,
  Users,
  Cloud,
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
  childrenList: Child[];
  selectedChild: Child | null;
  onSelectChild: (childId: string) => void;
  onLogout?: () => void;
  isLoggingOut?: boolean;
}

const THEME_OPTIONS: Array<{
  value: Theme;
  label: string;
  icon: React.ElementType;
}> = [
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
  childrenList,
  selectedChild,
  onSelectChild,
  onLogout,
  isLoggingOut = false,
}: B2CMainDrawerProps) {
  const { theme, setTheme } = useTheme();

  const hasChildren = childrenList.length > 0;

  // Widget de Armazenamento Estilizado
  const StorageWidget = () => (
    <Link
      to="/jornada/armazenamento"
      onClick={() => onOpenChange(false)}
      className="group relative overflow-hidden flex flex-col gap-3 p-4 rounded-2xl border transition-all hover:shadow-md"
      style={{
        backgroundColor: "var(--bb-color-surface)",
        borderColor: "var(--bb-color-border)",
      }}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[var(--bb-color-accent)]/20 to-[var(--bb-color-accent)]/5 flex items-center justify-center text-[var(--bb-color-accent)]">
            <Cloud className="w-5 h-5" />
          </div>
          <div>
            <p className="text-sm font-bold text-[var(--bb-color-ink)] group-hover:text-[var(--bb-color-accent)] transition-colors">
              Armazenamento
            </p>
            <p className="text-xs text-[var(--bb-color-ink-muted)]">
              Gerenciar uploads
            </p>
          </div>
        </div>
        <ChevronRight className="w-5 h-5 text-[var(--bb-color-ink-muted)] group-hover:translate-x-1 transition-transform" />
      </div>

      {/* Mock Progress Bar */}
      <div className="space-y-1.5">
        <div className="flex justify-between text-[10px] font-semibold uppercase tracking-wider text-[var(--bb-color-ink-muted)]">
          <span>Uso do plano</span>
          <span>45%</span>
        </div>
        <div className="h-2 w-full rounded-full bg-[var(--bb-color-bg)] overflow-hidden">
          <div
            className="h-full rounded-full bg-[var(--bb-color-accent)] opacity-80"
            style={{ width: "45%" }}
          />
        </div>
      </div>
    </Link>
  );

  const MenuLink = ({
    to,
    icon: Icon,
    title,
    subtitle,
  }: {
    to: string;
    icon: React.ElementType;
    title: string;
    subtitle: string;
  }) => (
    <Link
      to={to}
      onClick={() => onOpenChange(false)}
      className="flex items-center gap-4 p-3 rounded-2xl bg-transparent hover:bg-[var(--bb-color-bg)] transition-all group"
    >
      <div className="w-10 h-10 rounded-xl bg-[var(--bb-color-bg)] group-hover:bg-[var(--bb-color-surface)] border border-[var(--bb-color-border)] flex items-center justify-center text-[var(--bb-color-ink-muted)] group-hover:text-[var(--bb-color-accent)] group-hover:border-[var(--bb-color-accent)]/30 transition-all shadow-sm">
        <Icon className="w-5 h-5" />
      </div>
      <div className="flex-1">
        <p className="text-sm font-semibold text-[var(--bb-color-ink)] group-hover:text-[var(--bb-color-accent)] transition-colors">
          {title}
        </p>
        <p className="text-xs text-[var(--bb-color-ink-muted)]">{subtitle}</p>
      </div>
      <div className="text-[var(--bb-color-ink-muted)] group-hover:translate-x-1 transition-transform">
        <ChevronRight className="w-5 h-5" />
      </div>
    </Link>
  );

  return (
    <Drawer open={open} onOpenChange={onOpenChange} direction="right">
      <DrawerContent
        className="h-full w-full sm:max-w-[380px] border-l outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:slide-out-to-right data-[state=open]:slide-in-from-right"
        style={{
          backgroundColor: "var(--bb-color-surface)",
          borderColor: "var(--bb-color-border)",
        }}
      >
        <DrawerHeader
          className="px-6 py-6 pb-4"
          style={{
            backgroundColor: "var(--bb-color-surface)",
          }}
        >
          <div className="flex items-center gap-4">
            {/* Avatar */}
            {userAvatar ? (
              <img
                src={userAvatar}
                alt={userName}
                className="w-14 h-14 rounded-full object-cover shadow-sm ring-2 ring-[var(--bb-color-border)]"
              />
            ) : (
              <div className="w-14 h-14 bg-gradient-to-br from-[var(--bb-color-accent)] to-[var(--bb-color-accent)]/80 rounded-full flex items-center justify-center text-white font-bold text-xl shadow-md ring-2 ring-[var(--bb-color-accent)]/20">
                {userName?.[0]?.toUpperCase() || "U"}
              </div>
            )}
            <div className="min-w-0 flex-1 text-left">
              <DrawerTitle className="text-lg font-bold text-[var(--bb-color-ink)] truncate font-serif">
                {userName}
              </DrawerTitle>
              {userEmail && (
                <p className="text-xs text-[var(--bb-color-ink-muted)] truncate mt-0.5">
                  {userEmail}
                </p>
              )}
            </div>
          </div>
        </DrawerHeader>

        <DrawerBody className="px-6 py-6 space-y-8 overflow-y-auto custom-scrollbar">
          {/* Child Selector Section */}
          <div className="space-y-4">
            <p className="text-[11px] font-bold text-[var(--bb-color-ink-muted)] uppercase tracking-wider pl-1 opacity-70">
              Álbum Atual
            </p>
            <div className="space-y-2.5">
              {hasChildren ? (
                <>
                  {childrenList.map((child) => {
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
                          "w-full flex items-center gap-3 p-2 pr-4 rounded-2xl border transition-all",
                          isSelected
                            ? "border-[var(--bb-color-accent)] bg-[var(--bb-color-accent)]/5 shadow-sm"
                            : "border-[var(--bb-color-border)] bg-[var(--bb-color-bg)] hover:border-[var(--bb-color-ink-muted)]",
                        )}
                      >
                        <div
                          className={cn(
                            "w-12 h-12 rounded-xl flex items-center justify-center text-white font-semibold text-sm shadow-sm transition-transform active:scale-95",
                            isSelected
                              ? "bg-[var(--bb-color-accent)]"
                              : "bg-[var(--bb-color-ink-muted)]",
                          )}
                        >
                          {child.avatarUrl ? (
                            <img
                              src={child.avatarUrl}
                              alt={child.name}
                              className="w-full h-full rounded-xl object-cover"
                            />
                          ) : (
                            child.name[0]?.toUpperCase() || "?"
                          )}
                        </div>
                        <span
                          className={cn(
                            "flex-1 text-left font-bold text-sm",
                            isSelected
                              ? "text-[var(--bb-color-accent)]"
                              : "text-[var(--bb-color-ink)]",
                          )}
                        >
                          {child.name}
                        </span>
                        {isSelected && (
                          <div className="bg-[var(--bb-color-accent)] text-white rounded-full p-0.5">
                            <Check className="w-3 h-3" />
                          </div>
                        )}
                      </button>
                    );
                  })}

                  <Link
                    to="/jornada/perfil-crianca"
                    onClick={() => onOpenChange(false)}
                    className="flex text-xs font-semibold text-[var(--bb-color-ink-muted)] hover:text-[var(--bb-color-accent)] items-center justify-center gap-2 py-3 transition-colors border-t border-[var(--bb-color-border)] border-dashed mt-3 pt-4"
                  >
                    <Baby className="w-3.5 h-3.5" />
                    Gerenciar ou adicionar criança
                  </Link>
                </>
              ) : (
                <div
                  className="rounded-2xl border border-dashed p-6 text-center bg-[var(--bb-color-bg)]"
                  style={{ borderColor: "var(--bb-color-border)" }}
                >
                  <UserPlus className="w-8 h-8 mx-auto mb-3 text-[var(--bb-color-ink-muted)]" />
                  <p className="text-sm mb-4 text-[var(--bb-color-ink-muted)]">
                    Cadastre uma criança para começar.
                  </p>
                  <Link
                    to="/jornada/perfil-crianca"
                    onClick={() => onOpenChange(false)}
                    className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold shadow-md transition-all hover:scale-105 active:scale-95"
                    style={{
                      backgroundColor: "var(--bb-color-accent)",
                      color: "var(--bb-color-surface)",
                    }}
                  >
                    Cadastrar
                  </Link>
                </div>
              )}
            </div>
          </div>

          {/* Appearance Section */}
          <div className="space-y-4">
            <p className="text-[11px] font-bold text-[var(--bb-color-ink-muted)] uppercase tracking-wider pl-1 opacity-70">
              Aparência
            </p>
            <div className="flex gap-2 p-1.5 rounded-2xl bg-[var(--bb-color-bg)] border border-[var(--bb-color-border)]">
              {THEME_OPTIONS.map((option) => {
                const Icon = option.icon;
                const isActive = theme === option.value;
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setTheme(option.value)}
                    className={cn(
                      "flex-1 flex items-center justify-center gap-2 px-3 py-3 rounded-xl text-xs font-semibold transition-all duration-300",
                      isActive
                        ? "bg-[var(--bb-color-surface)] text-[var(--bb-color-accent)] shadow-sm ring-1 ring-black/5 dark:ring-white/10"
                        : "text-[var(--bb-color-ink-muted)] hover:text-[var(--bb-color-ink)] hover:bg-[var(--bb-color-surface)]/50",
                    )}
                  >
                    <Icon className="w-4 h-4" />
                    <span className="hidden sm:inline">{option.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Account Section */}
          <div className="space-y-4">
            <p className="text-[11px] font-bold text-[var(--bb-color-ink-muted)] uppercase tracking-wider pl-1 opacity-70">
              Conta
            </p>

            <StorageWidget />

            <div className="space-y-1.5 mt-4">
              <MenuLink
                to="/jornada/minha-conta"
                icon={Settings}
                title="Configurações"
                subtitle="Meus dados e preferências"
              />
              <MenuLink
                to="/jornada/familia"
                icon={Users}
                title="Família"
                subtitle="Membros com acesso"
              />
              <MenuLink
                to="/jornada/privacidade"
                icon={Shield}
                title="Privacidade"
                subtitle="Seus dados e segurança"
              />
            </div>
          </div>

          {/* Support Section */}
          <div className="space-y-4">
            <p className="text-[11px] font-bold text-[var(--bb-color-ink-muted)] uppercase tracking-wider pl-1 opacity-70">
              Suporte
            </p>
            <div className="space-y-1.5">
              <MenuLink
                to="/jornada/ajuda"
                icon={HelpCircle}
                title="Central de Ajuda"
                subtitle="Tire suas dúvidas"
              />
              <MenuLink
                to="/jornada/termos"
                icon={FileText}
                title="Termos e Políticas"
                subtitle="Informações legais"
              />
            </div>
          </div>
        </DrawerBody>

        <DrawerFooter
          className="p-6 pt-6"
          style={{
            borderTop: "1px solid var(--bb-color-border)",
            backgroundColor: "var(--bb-color-bg)",
          }}
        >
          <button
            onClick={onLogout}
            disabled={isLoggingOut}
            className="flex items-center justify-center gap-2 w-full px-4 py-4 text-sm font-bold text-[var(--bb-color-danger)] bg-[var(--bb-color-surface)] hover:bg-[var(--bb-color-danger)]/5 rounded-2xl transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed border border-[var(--bb-color-border)] hover:border-[var(--bb-color-danger)]/20 shadow-sm"
          >
            <LogOut className="w-4 h-4" />
            {isLoggingOut ? "Saindo..." : "Sair da conta"}
          </button>

          <div className="text-center mt-4">
            <p className="text-[10px] text-[var(--bb-color-ink-muted)] opacity-50 font-serif">
              BabyBook v1.0.0
            </p>
          </div>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
