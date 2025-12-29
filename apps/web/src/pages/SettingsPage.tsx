/**
 * SettingsPage - User & Family Settings
 *
 * Comprehensive settings management with dark mode support via CSS variables.
 */

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "motion/react";
import {
  ChevronLeft,
  ChevronRight,
  Users,
  Bell,
  CreditCard,
  Shield,
  HardDrive,
  Moon,
  Sun,
  Smartphone,
  Mail,
  UserPlus,
  Crown,
  Check,
  X,
  Trash2,
  Download,
  LogOut,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useTheme } from "@/hooks/useTheme";

interface SettingSection {
  id: string;
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
  title: string;
  description: string;
  action?: () => void;
}

interface FamilyMember {
  id: string;
  name: string;
  email: string;
  role: "owner" | "guardian" | "viewer";
  status: "active" | "pending";
  avatar?: string;
}

export function SettingsPage() {
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();
  const [activeSection, setActiveSection] = useState<string | null>(null);

  // Settings state
  const [notifications, setNotifications] = useState({
    pushEnabled: true,
    emailDigest: true,
    momentReminders: true,
    familyActivity: false,
  });

  // Mock family members
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([
    {
      id: "1",
      name: "Maria Silva",
      email: "maria@example.com",
      role: "owner",
      status: "active",
    },
    {
      id: "2",
      name: "João Silva",
      email: "joao@example.com",
      role: "guardian",
      status: "active",
    },
    {
      id: "3",
      name: "Avó Rosa",
      email: "rosa@example.com",
      role: "viewer",
      status: "pending",
    },
  ]);

  const [inviteEmail, setInviteEmail] = useState("");

  const sections: SettingSection[] = [
    {
      id: "family",
      icon: Users,
      title: "Família",
      description: "Gerencie quem pode ver e contribuir",
    },
    {
      id: "notifications",
      icon: Bell,
      title: "Notificações",
      description: "Configure como receber alertas",
    },
    {
      id: "subscription",
      icon: CreditCard,
      title: "Assinatura",
      description: "Plano atual e pagamentos",
    },
    {
      id: "privacy",
      icon: Shield,
      title: "Privacidade",
      description: "Controle de dados e visibilidade",
    },
    {
      id: "storage",
      icon: HardDrive,
      title: "Armazenamento",
      description: "Espaço usado e backup",
    },
  ];

  const handleInviteMember = () => {
    if (!inviteEmail) return;

    const newMember: FamilyMember = {
      id: Date.now().toString(),
      name: inviteEmail.split("@")[0],
      email: inviteEmail,
      role: "viewer",
      status: "pending",
    };

    setFamilyMembers([...familyMembers, newMember]);
    setInviteEmail("");
  };

  const handleRemoveMember = (memberId: string) => {
    setFamilyMembers(familyMembers.filter((m) => m.id !== memberId));
  };

  const getRoleBadge = (role: FamilyMember["role"]) => {
    const config = {
      owner: { label: "Dono", bg: "var(--bb-color-accent-soft)", color: "var(--bb-color-accent)" },
      guardian: { label: "Guardião", bg: "var(--bb-color-success)", color: "var(--bb-color-surface)" },
      viewer: { label: "Visualizador", bg: "var(--bb-color-muted)", color: "var(--bb-color-ink)" },
    };
    return config[role];
  };

  // Toggle Switch Component
  const ToggleSwitch = ({ enabled, onToggle }: { enabled: boolean; onToggle: () => void }) => (
    <button
      onClick={onToggle}
      className="w-12 h-7 rounded-full transition-colors"
      style={{
        backgroundColor: enabled ? "var(--bb-color-accent)" : "var(--bb-color-muted)",
      }}
    >
      <motion.div
        animate={{ x: enabled ? 20 : 2 }}
        className="w-6 h-6 rounded-full shadow"
        style={{ backgroundColor: "var(--bb-color-surface)" }}
      />
    </button>
  );

  // Render section content
  const renderSectionContent = () => {
    const backButton = (
      <button
        onClick={() => setActiveSection(null)}
        className="p-2 rounded-full transition-colors"
        style={{ color: "var(--bb-color-ink)" }}
      >
        <ChevronLeft className="w-5 h-5" />
      </button>
    );

    switch (activeSection) {
      case "family":
        return (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-6"
          >
            <div className="flex items-center gap-4 mb-6">
              {backButton}
              <h2 className="text-xl font-serif font-bold" style={{ color: "var(--bb-color-ink)" }}>
                Família
              </h2>
            </div>

            {/* Invite Section */}
            <div
              className="rounded-2xl border p-4"
              style={{
                backgroundColor: "var(--bb-color-surface)",
                borderColor: "var(--bb-color-border)",
              }}
            >
              <h3 className="font-semibold mb-3" style={{ color: "var(--bb-color-ink)" }}>
                Convidar Membro
              </h3>
              <div className="flex gap-2">
                <input
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="email@exemplo.com"
                  className="flex-1 px-4 py-2 border rounded-xl focus:ring-2 focus:outline-none"
                  style={{
                    backgroundColor: "var(--bb-color-surface)",
                    borderColor: "var(--bb-color-border)",
                    color: "var(--bb-color-ink)",
                  }}
                />
                <button
                  onClick={handleInviteMember}
                  className="px-4 py-2 rounded-xl font-medium"
                  style={{
                    backgroundColor: "var(--bb-color-accent)",
                    color: "var(--bb-color-surface)",
                  }}
                >
                  <UserPlus className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Members List */}
            <div
              className="rounded-2xl border divide-y"
              style={{
                backgroundColor: "var(--bb-color-surface)",
                borderColor: "var(--bb-color-border)",
              }}
            >
              {familyMembers.map((member) => {
                const badge = getRoleBadge(member.role);
                return (
                  <div
                    key={member.id}
                    className="p-4 flex items-center gap-4"
                    style={{ borderColor: "var(--bb-color-border)" }}
                  >
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-pink-200 to-rose-300 flex items-center justify-center">
                      <span className="text-sm font-semibold text-white">
                        {member.name[0].toUpperCase()}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium truncate" style={{ color: "var(--bb-color-ink)" }}>
                          {member.name}
                        </p>
                        {member.role === "owner" && (
                          <Crown className="w-4 h-4" style={{ color: "var(--bb-color-accent)" }} />
                        )}
                      </div>
                      <p className="text-sm truncate" style={{ color: "var(--bb-color-ink-muted)" }}>
                        {member.email}
                      </p>
                    </div>
                    <span
                      className="px-2 py-1 rounded-full text-xs font-medium"
                      style={{ backgroundColor: badge.bg, color: badge.color }}
                    >
                      {badge.label}
                    </span>
                    {member.status === "pending" && (
                      <span
                        className="px-2 py-1 rounded-full text-xs font-medium"
                        style={{
                          backgroundColor: "var(--bb-color-accent-soft)",
                          color: "var(--bb-color-accent)",
                        }}
                      >
                        Pendente
                      </span>
                    )}
                    {member.role !== "owner" && (
                      <button
                        onClick={() => handleRemoveMember(member.id)}
                        className="p-2 rounded-full transition-colors"
                        style={{ color: "var(--bb-color-danger)" }}
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </motion.div>
        );

      case "notifications":
        return (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-6"
          >
            <div className="flex items-center gap-4 mb-6">
              {backButton}
              <h2 className="text-xl font-serif font-bold" style={{ color: "var(--bb-color-ink)" }}>
                Notificações
              </h2>
            </div>

            <div
              className="rounded-2xl border divide-y"
              style={{
                backgroundColor: "var(--bb-color-surface)",
                borderColor: "var(--bb-color-border)",
              }}
            >
              {[
                { key: "pushEnabled", icon: Smartphone, title: "Notificações Push", desc: "Receba alertas no seu dispositivo" },
                { key: "emailDigest", icon: Mail, title: "Resumo por Email", desc: "Receba um resumo semanal por email" },
                { key: "momentReminders", icon: Bell, title: "Lembretes de Momentos", desc: "Sugestões para registrar novos momentos" },
                { key: "familyActivity", icon: Users, title: "Atividade da Família", desc: "Quando outros membros adicionam momentos" },
              ].map((item) => (
                <div
                  key={item.key}
                  className="p-4 flex items-center justify-between"
                  style={{ borderColor: "var(--bb-color-border)" }}
                >
                  <div className="flex items-center gap-3">
                    <item.icon className="w-5 h-5" style={{ color: "var(--bb-color-ink-muted)" }} />
                    <div>
                      <p className="font-medium" style={{ color: "var(--bb-color-ink)" }}>
                        {item.title}
                      </p>
                      <p className="text-sm" style={{ color: "var(--bb-color-ink-muted)" }}>
                        {item.desc}
                      </p>
                    </div>
                  </div>
                  <ToggleSwitch
                    enabled={notifications[item.key as keyof typeof notifications]}
                    onToggle={() =>
                      setNotifications((prev) => ({
                        ...prev,
                        [item.key]: !prev[item.key as keyof typeof notifications],
                      }))
                    }
                  />
                </div>
              ))}
            </div>
          </motion.div>
        );

      case "subscription":
        return (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-6"
          >
            <div className="flex items-center gap-4 mb-6">
              {backButton}
              <h2 className="text-xl font-serif font-bold" style={{ color: "var(--bb-color-ink)" }}>
                Assinatura
              </h2>
            </div>

            {/* Current Plan */}
            <div
              className="rounded-2xl border p-6"
              style={{
                backgroundColor: "var(--bb-color-accent-soft)",
                borderColor: "var(--bb-color-accent)",
              }}
            >
              <div className="flex items-center gap-2 mb-2">
                <Crown className="w-5 h-5" style={{ color: "var(--bb-color-accent)" }} />
                <span
                  className="text-sm font-semibold uppercase tracking-wide"
                  style={{ color: "var(--bb-color-accent)" }}
                >
                  Plano Atual
                </span>
              </div>
              <h3 className="text-2xl font-serif font-bold mb-1" style={{ color: "var(--bb-color-ink)" }}>
                Plano Família
              </h3>
              <p className="mb-4" style={{ color: "var(--bb-color-ink-muted)" }}>
                R$ 29,90/mês • Renovação em 15 de Fevereiro
              </p>
              <div className="flex gap-3">
                <button
                  className="px-4 py-2 rounded-xl font-medium border"
                  style={{
                    backgroundColor: "var(--bb-color-surface)",
                    borderColor: "var(--bb-color-border)",
                    color: "var(--bb-color-ink)",
                  }}
                >
                  Alterar Plano
                </button>
                <button
                  className="px-4 py-2 font-medium"
                  style={{ color: "var(--bb-color-danger)" }}
                >
                  Cancelar
                </button>
              </div>
            </div>

            {/* Features */}
            <div
              className="rounded-2xl border p-4"
              style={{
                backgroundColor: "var(--bb-color-surface)",
                borderColor: "var(--bb-color-border)",
              }}
            >
              <h4 className="font-semibold mb-4" style={{ color: "var(--bb-color-ink)" }}>
                Incluído no seu plano
              </h4>
              <ul className="space-y-3">
                {[
                  "Armazenamento ilimitado de fotos e vídeos",
                  "Até 5 membros da família",
                  "Backup automático em nuvem",
                  "Cápsula do tempo programada",
                  "Exportação em alta resolução",
                  "Suporte prioritário",
                ].map((feature, i) => (
                  <li key={i} className="flex items-center gap-3" style={{ color: "var(--bb-color-ink-muted)" }}>
                    <Check className="w-5 h-5 flex-shrink-0" style={{ color: "var(--bb-color-success)" }} />
                    {feature}
                  </li>
                ))}
              </ul>
            </div>
          </motion.div>
        );

      case "privacy":
        return (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-6"
          >
            <div className="flex items-center gap-4 mb-6">
              {backButton}
              <h2 className="text-xl font-serif font-bold" style={{ color: "var(--bb-color-ink)" }}>
                Privacidade
              </h2>
            </div>

            <div
              className="rounded-2xl border divide-y"
              style={{
                backgroundColor: "var(--bb-color-surface)",
                borderColor: "var(--bb-color-border)",
              }}
            >
              {[
                { icon: Shield, title: "Visibilidade Padrão", desc: "Novos momentos serão privados por padrão" },
                { icon: Download, title: "Exportar Dados", desc: "Baixe todos os seus dados e mídias" },
              ].map((item, i) => (
                <button
                  key={i}
                  className="w-full p-4 flex items-center justify-between"
                  style={{ borderColor: "var(--bb-color-border)" }}
                >
                  <div className="flex items-center gap-3">
                    <item.icon className="w-5 h-5" style={{ color: "var(--bb-color-ink-muted)" }} />
                    <div className="text-left">
                      <p className="font-medium" style={{ color: "var(--bb-color-ink)" }}>
                        {item.title}
                      </p>
                      <p className="text-sm" style={{ color: "var(--bb-color-ink-muted)" }}>
                        {item.desc}
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5" style={{ color: "var(--bb-color-ink-muted)" }} />
                </button>
              ))}
              <button
                className="w-full p-4 flex items-center justify-between"
                style={{ borderColor: "var(--bb-color-border)" }}
              >
                <div className="flex items-center gap-3" style={{ color: "var(--bb-color-danger)" }}>
                  <Trash2 className="w-5 h-5" />
                  <div className="text-left">
                    <p className="font-medium">Excluir Conta</p>
                    <p className="text-sm" style={{ color: "var(--bb-color-danger)", opacity: 0.8 }}>
                      Remover permanentemente todos os dados
                    </p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5" style={{ color: "var(--bb-color-danger)" }} />
              </button>
            </div>
          </motion.div>
        );

      case "storage":
        return (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-6"
          >
            <div className="flex items-center gap-4 mb-6">
              {backButton}
              <h2 className="text-xl font-serif font-bold" style={{ color: "var(--bb-color-ink)" }}>
                Armazenamento
              </h2>
            </div>

            {/* Storage Usage */}
            <div
              className="rounded-2xl border p-6"
              style={{
                backgroundColor: "var(--bb-color-surface)",
                borderColor: "var(--bb-color-border)",
              }}
            >
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-semibold" style={{ color: "var(--bb-color-ink)" }}>
                  Espaço Usado
                </h3>
                <span className="text-sm" style={{ color: "var(--bb-color-ink-muted)" }}>
                  2.3 GB de Ilimitado
                </span>
              </div>
              <div
                className="h-3 rounded-full overflow-hidden"
                style={{ backgroundColor: "var(--bb-color-muted)" }}
              >
                <div
                  className="h-full rounded-full"
                  style={{
                    backgroundColor: "var(--bb-color-accent)",
                    width: "23%",
                  }}
                />
              </div>
              <div className="mt-4 grid grid-cols-3 gap-4 text-center">
                {[
                  { value: "156", label: "Fotos" },
                  { value: "12", label: "Vídeos" },
                  { value: "8", label: "Áudios" },
                ].map((stat) => (
                  <div key={stat.label}>
                    <p className="text-2xl font-bold" style={{ color: "var(--bb-color-ink)" }}>
                      {stat.value}
                    </p>
                    <p className="text-xs" style={{ color: "var(--bb-color-ink-muted)" }}>
                      {stat.label}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Backup Status */}
            <div
              className="rounded-2xl border p-4"
              style={{
                backgroundColor: "var(--bb-color-surface)",
                borderColor: "var(--bb-color-border)",
              }}
            >
              <div className="flex items-center gap-3 mb-4">
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: "var(--bb-color-success)", opacity: 0.2 }}
                >
                  <Check className="w-5 h-5" style={{ color: "var(--bb-color-success)" }} />
                </div>
                <div>
                  <p className="font-medium" style={{ color: "var(--bb-color-ink)" }}>
                    Backup Ativo
                  </p>
                  <p className="text-sm" style={{ color: "var(--bb-color-ink-muted)" }}>
                    Último backup: há 2 horas
                  </p>
                </div>
              </div>
              <button
                className="w-full py-3 rounded-xl font-medium"
                style={{
                  backgroundColor: "var(--bb-color-muted)",
                  color: "var(--bb-color-ink)",
                }}
              >
                Fazer Backup Agora
              </button>
            </div>
          </motion.div>
        );

      default:
        return null;
    }
  };

  // Main menu
  if (activeSection) {
    return (
      <div className="max-w-lg mx-auto px-4 py-6">{renderSectionContent()}</div>
    );
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-6">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <button
          onClick={() => navigate(-1)}
          className="p-2 rounded-full transition-colors"
          style={{ color: "var(--bb-color-ink)" }}
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <h1 className="text-2xl font-serif font-bold" style={{ color: "var(--bb-color-ink)" }}>
          Configurações
        </h1>
      </div>

      {/* Settings Sections */}
      <div
        className="rounded-2xl border divide-y"
        style={{
          backgroundColor: "var(--bb-color-surface)",
          borderColor: "var(--bb-color-border)",
        }}
      >
        {sections.map((section) => (
          <button
            key={section.id}
            onClick={() => setActiveSection(section.id)}
            className="w-full p-4 flex items-center gap-4 transition-colors"
            style={{ borderColor: "var(--bb-color-border)" }}
          >
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ backgroundColor: "var(--bb-color-muted)" }}
            >
              <section.icon className="w-5 h-5" style={{ color: "var(--bb-color-ink)" }} />
            </div>
            <div className="flex-1 text-left">
              <p className="font-medium" style={{ color: "var(--bb-color-ink)" }}>
                {section.title}
              </p>
              <p className="text-sm" style={{ color: "var(--bb-color-ink-muted)" }}>
                {section.description}
              </p>
            </div>
            <ChevronRight className="w-5 h-5" style={{ color: "var(--bb-color-ink-muted)" }} />
          </button>
        ))}
      </div>

      {/* Theme Toggle */}
      <div
        className="mt-6 rounded-2xl border p-4"
        style={{
          backgroundColor: "var(--bb-color-surface)",
          borderColor: "var(--bb-color-border)",
        }}
      >
        <p className="font-medium mb-3" style={{ color: "var(--bb-color-ink)" }}>
          Tema
        </p>
        <div className="flex gap-2">
          {[
            { value: "light" as const, icon: Sun, label: "Claro" },
            { value: "dark" as const, icon: Moon, label: "Escuro" },
            { value: "system" as const, icon: Smartphone, label: "Sistema" },
          ].map((option) => (
            <button
              key={option.value}
              onClick={() => setTheme(option.value)}
              className="flex-1 py-3 rounded-xl flex flex-col items-center gap-1 transition-colors border-2"
              style={{
                backgroundColor:
                  theme === option.value ? "var(--bb-color-accent-soft)" : "var(--bb-color-muted)",
                borderColor:
                  theme === option.value ? "var(--bb-color-accent)" : "transparent",
                color:
                  theme === option.value ? "var(--bb-color-accent)" : "var(--bb-color-ink)",
              }}
            >
              <option.icon className="w-5 h-5" />
              <span className="text-xs font-medium">{option.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Logout */}
      <button
        className="mt-6 w-full py-4 flex items-center justify-center gap-2 rounded-2xl transition-colors"
        style={{ color: "var(--bb-color-danger)" }}
      >
        <LogOut className="w-5 h-5" />
        <span className="font-medium">Sair da Conta</span>
      </button>

      {/* Version */}
      <p
        className="text-center text-xs mt-8"
        style={{ color: "var(--bb-color-ink-muted)" }}
      >
        Babybook v1.0.0 • Feito com 💖
      </p>
    </div>
  );
}

export default SettingsPage;
