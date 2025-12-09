/**
 * SettingsPage - User & Family Settings
 *
 * Comprehensive settings management:
 * - Family members (add guardians, manage access)
 * - Notification preferences
 * - Subscription & billing
 * - Privacy settings
 * - Data management
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

interface SettingSection {
  id: string;
  icon: React.ComponentType<{ className?: string }>;
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
  const [activeSection, setActiveSection] = useState<string | null>(null);

  // Settings state
  const [notifications, setNotifications] = useState({
    pushEnabled: true,
    emailDigest: true,
    momentReminders: true,
    familyActivity: false,
  });

  const [theme, setTheme] = useState<"light" | "dark" | "system">("system");

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

  const handleChangeRole = (memberId: string, role: FamilyMember["role"]) => {
    setFamilyMembers(
      familyMembers.map((m) => (m.id === memberId ? { ...m, role } : m)),
    );
  };

  const getRoleBadge = (role: FamilyMember["role"]) => {
    const config = {
      owner: { label: "Dono", className: "bg-amber-100 text-amber-800" },
      guardian: { label: "Guardião", className: "bg-blue-100 text-blue-800" },
      viewer: { label: "Visualizador", className: "bg-gray-100 text-gray-600" },
    };
    return config[role];
  };

  // Render section content
  const renderSectionContent = () => {
    switch (activeSection) {
      case "family":
        return (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-6"
          >
            <div className="flex items-center gap-4 mb-6">
              <button
                onClick={() => setActiveSection(null)}
                className="p-2 hover:bg-gray-100 rounded-full"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <h2 className="text-xl font-serif font-bold">Família</h2>
            </div>

            {/* Invite Section */}
            <div className="bg-white rounded-2xl border border-gray-200 p-4">
              <h3 className="font-semibold text-gray-800 mb-3">
                Convidar Membro
              </h3>
              <div className="flex gap-2">
                <input
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="email@exemplo.com"
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent"
                />
                <button
                  onClick={handleInviteMember}
                  className="px-4 py-2 bg-primary text-white rounded-xl font-medium hover:bg-primary/90"
                >
                  <UserPlus className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Members List */}
            <div className="bg-white rounded-2xl border border-gray-200 divide-y divide-gray-100">
              {familyMembers.map((member) => {
                const badge = getRoleBadge(member.role);
                return (
                  <div key={member.id} className="p-4 flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-pink-200 to-rose-300 flex items-center justify-center">
                      <span className="text-sm font-semibold text-white">
                        {member.name[0].toUpperCase()}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-gray-800 truncate">
                          {member.name}
                        </p>
                        {member.role === "owner" && (
                          <Crown className="w-4 h-4 text-amber-500" />
                        )}
                      </div>
                      <p className="text-sm text-gray-500 truncate">
                        {member.email}
                      </p>
                    </div>
                    <span
                      className={cn(
                        "px-2 py-1 rounded-full text-xs font-medium",
                        badge.className,
                      )}
                    >
                      {badge.label}
                    </span>
                    {member.status === "pending" && (
                      <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-medium">
                        Pendente
                      </span>
                    )}
                    {member.role !== "owner" && (
                      <button
                        onClick={() => handleRemoveMember(member.id)}
                        className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Role Explanation */}
            <div className="bg-gray-50 rounded-2xl p-4 space-y-3">
              <h4 className="font-medium text-gray-700">Sobre os papéis</h4>
              <div className="space-y-2 text-sm text-gray-600">
                <p>
                  <strong>Dono:</strong> Controle total sobre a conta e
                  configurações
                </p>
                <p>
                  <strong>Guardião:</strong> Pode ver e adicionar momentos
                </p>
                <p>
                  <strong>Visualizador:</strong> Apenas visualização de momentos
                </p>
              </div>
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
              <button
                onClick={() => setActiveSection(null)}
                className="p-2 hover:bg-gray-100 rounded-full"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <h2 className="text-xl font-serif font-bold">Notificações</h2>
            </div>

            <div className="bg-white rounded-2xl border border-gray-200 divide-y divide-gray-100">
              {/* Push Notifications */}
              <div className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Smartphone className="w-5 h-5 text-gray-500" />
                  <div>
                    <p className="font-medium text-gray-800">
                      Notificações Push
                    </p>
                    <p className="text-sm text-gray-500">
                      Receba alertas no seu dispositivo
                    </p>
                  </div>
                </div>
                <button
                  onClick={() =>
                    setNotifications((prev) => ({
                      ...prev,
                      pushEnabled: !prev.pushEnabled,
                    }))
                  }
                  className={cn(
                    "w-12 h-7 rounded-full transition-colors",
                    notifications.pushEnabled ? "bg-primary" : "bg-gray-300",
                  )}
                >
                  <motion.div
                    animate={{ x: notifications.pushEnabled ? 20 : 2 }}
                    className="w-6 h-6 bg-white rounded-full shadow"
                  />
                </button>
              </div>

              {/* Email Digest */}
              <div className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Mail className="w-5 h-5 text-gray-500" />
                  <div>
                    <p className="font-medium text-gray-800">
                      Resumo por Email
                    </p>
                    <p className="text-sm text-gray-500">
                      Receba um resumo semanal por email
                    </p>
                  </div>
                </div>
                <button
                  onClick={() =>
                    setNotifications((prev) => ({
                      ...prev,
                      emailDigest: !prev.emailDigest,
                    }))
                  }
                  className={cn(
                    "w-12 h-7 rounded-full transition-colors",
                    notifications.emailDigest ? "bg-primary" : "bg-gray-300",
                  )}
                >
                  <motion.div
                    animate={{ x: notifications.emailDigest ? 20 : 2 }}
                    className="w-6 h-6 bg-white rounded-full shadow"
                  />
                </button>
              </div>

              {/* Moment Reminders */}
              <div className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Bell className="w-5 h-5 text-gray-500" />
                  <div>
                    <p className="font-medium text-gray-800">
                      Lembretes de Momentos
                    </p>
                    <p className="text-sm text-gray-500">
                      Sugestões para registrar novos momentos
                    </p>
                  </div>
                </div>
                <button
                  onClick={() =>
                    setNotifications((prev) => ({
                      ...prev,
                      momentReminders: !prev.momentReminders,
                    }))
                  }
                  className={cn(
                    "w-12 h-7 rounded-full transition-colors",
                    notifications.momentReminders
                      ? "bg-primary"
                      : "bg-gray-300",
                  )}
                >
                  <motion.div
                    animate={{ x: notifications.momentReminders ? 20 : 2 }}
                    className="w-6 h-6 bg-white rounded-full shadow"
                  />
                </button>
              </div>

              {/* Family Activity */}
              <div className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Users className="w-5 h-5 text-gray-500" />
                  <div>
                    <p className="font-medium text-gray-800">
                      Atividade da Família
                    </p>
                    <p className="text-sm text-gray-500">
                      Quando outros membros adicionam momentos
                    </p>
                  </div>
                </div>
                <button
                  onClick={() =>
                    setNotifications((prev) => ({
                      ...prev,
                      familyActivity: !prev.familyActivity,
                    }))
                  }
                  className={cn(
                    "w-12 h-7 rounded-full transition-colors",
                    notifications.familyActivity ? "bg-primary" : "bg-gray-300",
                  )}
                >
                  <motion.div
                    animate={{ x: notifications.familyActivity ? 20 : 2 }}
                    className="w-6 h-6 bg-white rounded-full shadow"
                  />
                </button>
              </div>
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
              <button
                onClick={() => setActiveSection(null)}
                className="p-2 hover:bg-gray-100 rounded-full"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <h2 className="text-xl font-serif font-bold">Assinatura</h2>
            </div>

            {/* Current Plan */}
            <div className="bg-gradient-to-br from-primary/10 to-pink-100 rounded-2xl border border-primary/20 p-6">
              <div className="flex items-center gap-2 mb-2">
                <Crown className="w-5 h-5 text-primary" />
                <span className="text-sm font-semibold text-primary uppercase tracking-wide">
                  Plano Atual
                </span>
              </div>
              <h3 className="text-2xl font-serif font-bold text-gray-800 mb-1">
                Plano Família
              </h3>
              <p className="text-gray-600 mb-4">
                R$ 29,90/mês • Renovação em 15 de Fevereiro
              </p>
              <div className="flex gap-3">
                <button className="px-4 py-2 bg-white text-gray-700 rounded-xl font-medium border border-gray-200 hover:bg-gray-50">
                  Alterar Plano
                </button>
                <button className="px-4 py-2 text-gray-500 hover:text-red-600 font-medium">
                  Cancelar
                </button>
              </div>
            </div>

            {/* Features */}
            <div className="bg-white rounded-2xl border border-gray-200 p-4">
              <h4 className="font-semibold text-gray-800 mb-4">
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
                  <li key={i} className="flex items-center gap-3 text-gray-600">
                    <Check className="w-5 h-5 text-green-500 flex-shrink-0" />
                    {feature}
                  </li>
                ))}
              </ul>
            </div>

            {/* Payment History */}
            <div className="bg-white rounded-2xl border border-gray-200 p-4">
              <h4 className="font-semibold text-gray-800 mb-4">
                Histórico de Pagamentos
              </h4>
              <div className="space-y-3">
                {[
                  { date: "15 Jan 2024", amount: "R$ 29,90", status: "Pago" },
                  { date: "15 Dez 2023", amount: "R$ 29,90", status: "Pago" },
                  { date: "15 Nov 2023", amount: "R$ 29,90", status: "Pago" },
                ].map((payment, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0"
                  >
                    <span className="text-gray-600">{payment.date}</span>
                    <span className="font-medium text-gray-800">
                      {payment.amount}
                    </span>
                    <span className="text-sm text-green-600 font-medium">
                      {payment.status}
                    </span>
                  </div>
                ))}
              </div>
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
              <button
                onClick={() => setActiveSection(null)}
                className="p-2 hover:bg-gray-100 rounded-full"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <h2 className="text-xl font-serif font-bold">Privacidade</h2>
            </div>

            <div className="bg-white rounded-2xl border border-gray-200 divide-y divide-gray-100">
              <button className="w-full p-4 flex items-center justify-between hover:bg-gray-50">
                <div className="flex items-center gap-3">
                  <Shield className="w-5 h-5 text-gray-500" />
                  <div className="text-left">
                    <p className="font-medium text-gray-800">
                      Visibilidade Padrão
                    </p>
                    <p className="text-sm text-gray-500">
                      Novos momentos serão privados por padrão
                    </p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-400" />
              </button>

              <button className="w-full p-4 flex items-center justify-between hover:bg-gray-50">
                <div className="flex items-center gap-3">
                  <Download className="w-5 h-5 text-gray-500" />
                  <div className="text-left">
                    <p className="font-medium text-gray-800">Exportar Dados</p>
                    <p className="text-sm text-gray-500">
                      Baixe todos os seus dados e mídias
                    </p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-400" />
              </button>

              <button className="w-full p-4 flex items-center justify-between hover:bg-gray-50">
                <div className="flex items-center gap-3 text-red-600">
                  <Trash2 className="w-5 h-5" />
                  <div className="text-left">
                    <p className="font-medium">Excluir Conta</p>
                    <p className="text-sm text-red-500">
                      Remover permanentemente todos os dados
                    </p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-red-400" />
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
              <button
                onClick={() => setActiveSection(null)}
                className="p-2 hover:bg-gray-100 rounded-full"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <h2 className="text-xl font-serif font-bold">Armazenamento</h2>
            </div>

            {/* Storage Usage */}
            <div className="bg-white rounded-2xl border border-gray-200 p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-semibold text-gray-800">Espaço Usado</h3>
                <span className="text-sm text-gray-500">
                  2.3 GB de Ilimitado
                </span>
              </div>
              <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-primary to-pink-500 rounded-full"
                  style={{ width: "23%" }}
                />
              </div>
              <div className="mt-4 grid grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-2xl font-bold text-gray-800">156</p>
                  <p className="text-xs text-gray-500">Fotos</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-800">12</p>
                  <p className="text-xs text-gray-500">Vídeos</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-800">8</p>
                  <p className="text-xs text-gray-500">Áudios</p>
                </div>
              </div>
            </div>

            {/* Backup Status */}
            <div className="bg-white rounded-2xl border border-gray-200 p-4">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                  <Check className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-800">Backup Ativo</p>
                  <p className="text-sm text-gray-500">
                    Último backup: há 2 horas
                  </p>
                </div>
              </div>
              <button className="w-full py-3 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200">
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
          className="p-2 hover:bg-gray-100 rounded-full"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <h1 className="text-2xl font-serif font-bold">Configurações</h1>
      </div>

      {/* Settings Sections */}
      <div className="bg-white rounded-2xl border border-gray-200 divide-y divide-gray-100">
        {sections.map((section) => (
          <button
            key={section.id}
            onClick={() => setActiveSection(section.id)}
            className="w-full p-4 flex items-center gap-4 hover:bg-gray-50 transition-colors"
          >
            <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center">
              <section.icon className="w-5 h-5 text-gray-600" />
            </div>
            <div className="flex-1 text-left">
              <p className="font-medium text-gray-800">{section.title}</p>
              <p className="text-sm text-gray-500">{section.description}</p>
            </div>
            <ChevronRight className="w-5 h-5 text-gray-400" />
          </button>
        ))}
      </div>

      {/* Theme Toggle */}
      <div className="mt-6 bg-white rounded-2xl border border-gray-200 p-4">
        <p className="font-medium text-gray-800 mb-3">Tema</p>
        <div className="flex gap-2">
          {[
            { value: "light" as const, icon: Sun, label: "Claro" },
            { value: "dark" as const, icon: Moon, label: "Escuro" },
            { value: "system" as const, icon: Smartphone, label: "Sistema" },
          ].map((option) => (
            <button
              key={option.value}
              onClick={() => setTheme(option.value)}
              className={cn(
                "flex-1 py-3 rounded-xl flex flex-col items-center gap-1 transition-colors",
                theme === option.value
                  ? "bg-primary/10 text-primary border-2 border-primary"
                  : "bg-gray-100 text-gray-600 border-2 border-transparent",
              )}
            >
              <option.icon className="w-5 h-5" />
              <span className="text-xs font-medium">{option.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Logout */}
      <button className="mt-6 w-full py-4 flex items-center justify-center gap-2 text-red-600 hover:bg-red-50 rounded-2xl transition-colors">
        <LogOut className="w-5 h-5" />
        <span className="font-medium">Sair da Conta</span>
      </button>

      {/* Version */}
      <p className="text-center text-xs text-gray-400 mt-8">
        Babybook v1.0.0 • Feito com 💖
      </p>
    </div>
  );
}

export default SettingsPage;
