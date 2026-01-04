/**
 * Família Page - B2C
 *
 * Página para gerenciamento de membros da família com sistema de permissões.
 */

import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ChevronLeft, UserPlus, Crown, X, Mail, ArrowRight, Shield, MessageCircle } from "lucide-react";
import { motion } from "motion/react";
import {
  listFamilyMembers,
  inviteFamilyMember,
  removeFamilyMember,
  settingsApiKeys,
  type FamilyMember,
} from "../api";
import { useTranslation } from "@babybook/i18n";
import { FamiliaSkeleton } from "../components/FamiliaSkeleton";
import { useSelectedChild } from "@/hooks/useSelectedChild";
import { useGuestbookEntries } from "@/hooks/api";
import { GuestbookFamilyTree } from "@/features/guestbook/GuestbookFamilyTree";

// Mock data para fallback em dev
const MOCK_MEMBERS: FamilyMember[] = [
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
];

export const FamiliaPage = () => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [inviteEmail, setInviteEmail] = useState("");
  const [localMembers, setLocalMembers] =
    useState<FamilyMember[]>(MOCK_MEMBERS);
  const { selectedChild } = useSelectedChild();

  const { data: guestbookEntries = [] } = useGuestbookEntries(
    selectedChild?.id,
  );

  // Busca membros da família da API
  const { data, isLoading, error } = useQuery({
    queryKey: settingsApiKeys.family,
    queryFn: listFamilyMembers,
    retry: 1,
    staleTime: 30000,
  });

  // Atualiza estado local quando dados da API chegam
  useEffect(() => {
    if (data?.members) {
      setLocalMembers(data.members);
    }
  }, [data]);

  // Mutation para convidar membro
  const inviteMutation = useMutation({
    mutationFn: (email: string) =>
      inviteFamilyMember({ email, role: "viewer" }),
    onSuccess: (newMember) => {
      setLocalMembers((prev) => [
        ...prev,
        { ...newMember, status: "pending" as const },
      ]);
      setInviteEmail("");
      queryClient.invalidateQueries({ queryKey: settingsApiKeys.family });
    },
    onError: () => {
      // Fallback: adiciona localmente mesmo com erro
      const newMember: FamilyMember = {
        id: Date.now().toString(),
        name: inviteEmail.split("@")[0],
        email: inviteEmail,
        role: "viewer",
        status: "pending",
      };
      setLocalMembers((prev) => [...prev, newMember]);
      setInviteEmail("");
    },
  });

  // Mutation para remover membro
  const removeMutation = useMutation({
    mutationFn: removeFamilyMember,
    onSuccess: (_, memberId) => {
      setLocalMembers((prev) => prev.filter((m) => m.id !== memberId));
      queryClient.invalidateQueries({ queryKey: settingsApiKeys.family });
    },
    onError: (_, memberId) => {
      // Fallback: remove localmente mesmo com erro
      setLocalMembers((prev) => prev.filter((m) => m.id !== memberId));
    },
  });

  const handleInviteMember = () => {
    if (!inviteEmail) return;
    inviteMutation.mutate(inviteEmail);
  };

  const handleRemoveMember = (memberId: string) => {
    removeMutation.mutate(memberId);
  };

  if (isLoading) {
    return <FamiliaSkeleton />;
  }

  const getRoleBadge = (role: FamilyMember["role"]) => {
    const config = {
      owner: {
        label: t("b2c.family.roles.owner"),
        bg: "var(--bb-color-accent-light, rgba(0,0,0,0.05))",
        color: "var(--bb-color-accent)",
      },
      guardian: {
        label: t("b2c.family.roles.guardian"),
        bg: "var(--bb-color-accent)",
        color: "white",
      },
      viewer: {
        label: t("b2c.family.roles.viewer"),
        bg: "var(--bb-color-bg)",
        color: "var(--bb-color-ink-muted)",
      },
    };
    return config[role];
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="max-w-4xl mx-auto px-4 py-6"
    >
      {/* Botão Voltar */}
      <Link
        to="/jornada/minha-conta"
        className="inline-flex items-center gap-2 mb-6 p-2 -ml-2 rounded-xl text-sm font-semibold transition-colors hover:bg-[var(--bb-color-bg)]"
        style={{ color: "var(--bb-color-ink-muted)" }}
      >
        <ChevronLeft className="w-5 h-5" />
        Voltar para Minha Conta
      </Link>

      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <h1
          className="text-3xl font-serif font-bold leading-tight"
          style={{ color: "var(--bb-color-ink)" }}
        >
          {t("b2c.family.title")}
        </h1>
      </div>

      {/* Descrição */}
      <p
        className="mb-8 text-lg leading-relaxed"
        style={{ color: "var(--bb-color-ink-muted)" }}
      >
        {t("b2c.family.description")}
      </p>

      {/* Fallback/aviso quando a API falha */}
      {error && (
        <div
          className="mb-6 rounded-2xl p-4 text-sm"
          style={{
            backgroundColor: "var(--bb-color-bg)",
            border: "1px solid var(--bb-color-border)",
            color: "var(--bb-color-ink-muted)",
          }}
        >
          Não foi possível carregar os membros agora. Exibindo dados locais.
        </div>
      )}

      {/* Invite Section */}
      <div
        className="rounded-2xl p-6 mb-8 shadow-sm transition-shadow hover:shadow-md"
        style={{
          backgroundColor: "var(--bb-color-surface)",
          border: "1px solid var(--bb-color-border)",
        }}
      >
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-xl bg-[var(--bb-color-bg)]">
            <UserPlus
              className="w-5 h-5"
              style={{ color: "var(--bb-color-accent)" }}
            />
          </div>
          <h3
            className="font-semibold text-lg"
            style={{ color: "var(--bb-color-ink)" }}
          >
            {t("b2c.family.inviteTitle")}
          </h3>
        </div>
        <div className="flex gap-3">
          <div className="flex-1 relative">
            <Mail
              className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4"
              style={{ color: "var(--bb-color-ink-muted)" }}
            />
            <input
              type="email"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              placeholder={t("b2c.family.invitePlaceholder")}
              className="w-full pl-10 pr-4 py-3 border rounded-xl focus:ring-2 focus:outline-none transition-all"
              style={{
                backgroundColor: "var(--bb-color-bg)",
                borderColor: "var(--bb-color-border)",
                color: "var(--bb-color-ink)",
              }}
            />
          </div>
          <button
            onClick={handleInviteMember}
            className="px-6 py-3 rounded-xl font-medium transition-all active:scale-95 hover:opacity-90"
            style={{
              backgroundColor: "var(--bb-color-accent)",
              color: "white",
            }}
          >
            {t("b2c.family.inviteSend")}
          </button>
        </div>
      </div>

      {/* Members List */}
      <div
        className="rounded-2xl overflow-hidden mb-8 shadow-sm"
        style={{
          backgroundColor: "var(--bb-color-surface)",
          border: "1px solid var(--bb-color-border)",
        }}
      >
        {localMembers.map((member, index) => {
          const badge = getRoleBadge(member.role);
          return (
            <div
              key={member.id}
              className="p-4 md:p-5 flex items-center gap-4 transition-colors hover:bg-[var(--bb-color-bg)]/50"
              style={{
                borderBottom:
                  index < localMembers.length - 1
                    ? "1px solid var(--bb-color-border)"
                    : "none",
              }}
            >
              {/* Avatar */}
              <div
                className="w-12 h-12 rounded-2xl flex items-center justify-center text-white font-bold text-lg shadow-sm"
                style={{
                  background:
                    "linear-gradient(135deg, var(--bb-color-accent), var(--bb-color-accent-dark, var(--bb-color-accent)))",
                }}
              >
                {member.name[0].toUpperCase()}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p
                    className="font-bold truncate text-base"
                    style={{ color: "var(--bb-color-ink)" }}
                  >
                    {member.name}
                  </p>
                  {member.role === "owner" && (
                    <Crown
                      className="w-4 h-4"
                      style={{ color: "var(--bb-color-accent)" }}
                    />
                  )}
                </div>
                <p
                  className="text-sm truncate"
                  style={{ color: "var(--bb-color-ink-muted)" }}
                >
                  {member.email}
                </p>
              </div>

              {/* Badges */}
              <div className="flex items-center gap-2">
                <span
                  className="px-3 py-1 rounded-lg text-xs font-bold uppercase tracking-wider"
                  style={{ backgroundColor: badge.bg, color: badge.color }}
                >
                  {badge.label}
                </span>
                {member.status === "pending" && (
                  <span
                    className="px-3 py-1 rounded-lg text-xs font-bold uppercase tracking-wider"
                    style={{
                      backgroundColor:
                        "var(--bb-color-accent-light, rgba(0,0,0,0.05))",
                      color: "var(--bb-color-accent)",
                    }}
                  >
                    {t("b2c.family.pending")}
                  </span>
                )}
              </div>

              {/* Remove Button */}
              {member.role !== "owner" && (
                <button
                  onClick={() => handleRemoveMember(member.id)}
                  className="p-2 rounded-xl transition-colors hover:bg-[var(--bb-color-bg)] hover:text-red-500"
                  style={{ color: "var(--bb-color-ink-muted)" }}
                  title={t("b2c.family.removeMember")}
                >
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* Guestbook Tree Preview */}
      <div className="mb-8">
        <div className="mb-4 flex items-end justify-between gap-3">
          <div>
            <p
              className="text-xs uppercase tracking-[0.3em] font-bold"
              style={{ color: "var(--bb-color-ink-muted)" }}
            >
              {t("b2c.guestbook.tree.hud.label")}
            </p>
            <h2
              className="mt-1 font-serif text-2xl font-bold"
              style={{ color: "var(--bb-color-ink)" }}
            >
              {t("b2c.guestbook.title")}
            </h2>
          </div>
          <div className="flex flex-col items-end gap-2">
            {selectedChild && (
              <div
                className="text-sm font-medium"
                style={{ color: "var(--bb-color-ink-muted)" }}
              >
                {t("b2c.guestbook.tree.common.child")}:{" "}
                <span style={{ color: "var(--bb-color-ink)" }}>
                  {selectedChild.name}
                </span>
              </div>
            )}
          </div>
        </div>

        {selectedChild ? (
          <div className="rounded-3xl overflow-hidden border" style={{ borderColor: 'var(--bb-color-border)' }}>
            <GuestbookFamilyTree
                childName={selectedChild.name}
                entries={guestbookEntries}
                variant="hud"
            />
          </div>
        ) : (
          <div
            className="rounded-2xl border p-8 text-center text-sm"
            style={{
              backgroundColor: "var(--bb-color-surface)",
              borderColor: "var(--bb-color-border)",
              color: "var(--bb-color-ink-muted)",
            }}
          >
            {t("b2c.guestbook.tree.selectChild")}
          </div>
        )}
      </div>

       {/* Info Box */}
       <div
        className="mb-10 p-6 rounded-2xl"
        style={{
          backgroundColor: "var(--bb-color-bg)",
          border: "1px solid var(--bb-color-border)",
        }}
      >
        <p className="text-sm leading-relaxed" style={{ color: "var(--bb-color-ink-muted)" }}>
          <strong>{t("b2c.family.aboutPermissions")}</strong>
          <br />• <strong>{t("b2c.family.roles.owner")}</strong>{" "}
          {t("b2c.family.roles.ownerDesc")}
          <br />• <strong>{t("b2c.family.roles.guardian")}</strong>{" "}
          {t("b2c.family.roles.guardianDesc")}
          <br />• <strong>{t("b2c.family.roles.viewer")}</strong>{" "}
          {t("b2c.family.roles.viewerDesc")}
        </p>
      </div>

      {/* Sugestões (Teia de Navegação) */}
      <h3 className="text-sm font-bold uppercase tracking-wider mb-4" style={{ color: "var(--bb-color-ink-muted)" }}>
        Veja também
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Link
          to="/jornada/privacidade"
          className="flex items-center justify-between p-4 rounded-2xl transition-all hover:opacity-90 active:scale-[0.99] group"
          style={{
            backgroundColor: "var(--bb-color-surface)",
            border: "1px solid var(--bb-color-border)",
          }}
        >
          <div className="flex items-center gap-3">
             <div className="w-10 h-10 rounded-xl flex items-center justify-center transition-colors group-hover:bg-[var(--bb-color-bg)]" style={{ backgroundColor: "var(--bb-color-bg)", border: "1px solid var(--bb-color-border)" }}>
                <Shield className="w-5 h-5" style={{ color: "var(--bb-color-accent)" }} />
             </div>
             <div>
                <p className="font-semibold text-sm" style={{ color: "var(--bb-color-ink)" }}>Privacidade</p>
                <p className="text-xs" style={{ color: "var(--bb-color-ink-muted)" }}>Controle quem vê o que</p>
             </div>
          </div>
          <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" style={{ color: "var(--bb-color-ink-muted)" }} />
        </Link>
        
        <Link
          to="/jornada/ajuda"
          className="flex items-center justify-between p-4 rounded-2xl transition-all hover:opacity-90 active:scale-[0.99] group"
          style={{
            backgroundColor: "var(--bb-color-surface)",
            border: "1px solid var(--bb-color-border)",
          }}
        >
          <div className="flex items-center gap-3">
             <div className="w-10 h-10 rounded-xl flex items-center justify-center transition-colors group-hover:bg-[var(--bb-color-bg)]" style={{ backgroundColor: "var(--bb-color-bg)", border: "1px solid var(--bb-color-border)" }}>
                <MessageCircle className="w-5 h-5" style={{ color: "var(--bb-color-accent)" }} />
             </div>
             <div>
                <p className="font-semibold text-sm" style={{ color: "var(--bb-color-ink)" }}>Precisa de ajuda?</p>
                <p className="text-xs" style={{ color: "var(--bb-color-ink-muted)" }}>Fale com nosso suporte</p>
             </div>
          </div>
          <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" style={{ color: "var(--bb-color-ink-muted)" }} />
        </Link>
      </div>
    </motion.div>
  );
};
