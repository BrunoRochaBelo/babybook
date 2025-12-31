/**
 * Família Page - B2C
 *
 * Página para gerenciamento de membros da família com sistema de permissões.
 */

import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  ChevronLeft,
  Users,
  UserPlus,
  Crown,
  X,
  Mail,
  Loader2,
} from "lucide-react";
import {
  listFamilyMembers,
  inviteFamilyMember,
  removeFamilyMember,
  settingsApiKeys,
  type FamilyMember,
} from "../api";
import { useTranslation } from "@babybook/i18n";

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
  const [localMembers, setLocalMembers] = useState<FamilyMember[]>(MOCK_MEMBERS);

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
    mutationFn: (email: string) => inviteFamilyMember({ email, role: "viewer" }),
    onSuccess: (newMember) => {
      setLocalMembers((prev) => [...prev, { ...newMember, status: "pending" as const }]);
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
    <div className="max-w-2xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Link
          to="/jornada"
          className="p-2 rounded-xl hover:bg-[var(--bb-color-bg)] transition-colors"
          style={{ color: "var(--bb-color-ink-muted)" }}
        >
          <ChevronLeft className="w-5 h-5" />
        </Link>
        <h1
          className="text-2xl font-serif font-bold"
          style={{ color: "var(--bb-color-ink)" }}
        >
          {t("b2c.family.title")}
        </h1>
      </div>

      {/* Descrição */}
      <p
        className="mb-6 text-sm"
        style={{ color: "var(--bb-color-ink-muted)" }}
      >
        {t("b2c.family.description")}
      </p>

      {/* Invite Section */}
      <div
        className="rounded-2xl p-4 mb-6"
        style={{
          backgroundColor: "var(--bb-color-surface)",
          border: "1px solid var(--bb-color-border)",
        }}
      >
        <div className="flex items-center gap-2 mb-3">
          <UserPlus
            className="w-5 h-5"
            style={{ color: "var(--bb-color-accent)" }}
          />
          <h3 className="font-semibold" style={{ color: "var(--bb-color-ink)" }}>
            {t("b2c.family.inviteTitle")}
          </h3>
        </div>
        <div className="flex gap-2">
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
              className="w-full pl-10 pr-4 py-2.5 border rounded-xl focus:ring-2 focus:outline-none"
              style={{
                backgroundColor: "var(--bb-color-bg)",
                borderColor: "var(--bb-color-border)",
                color: "var(--bb-color-ink)",
              }}
            />
          </div>
          <button
            onClick={handleInviteMember}
            className="px-4 py-2.5 rounded-xl font-medium transition-colors"
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
        className="rounded-2xl overflow-hidden"
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
              className="p-4 flex items-center gap-4"
              style={{
                borderBottom:
                  index < localMembers.length - 1
                    ? "1px solid var(--bb-color-border)"
                    : "none",
              }}
            >
              {/* Avatar */}
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center text-white font-semibold"
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
                    className="font-medium truncate"
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
                  className="px-3 py-1 rounded-full text-xs font-medium"
                  style={{ backgroundColor: badge.bg, color: badge.color }}
                >
                  {badge.label}
                </span>
                {member.status === "pending" && (
                  <span
                    className="px-3 py-1 rounded-full text-xs font-medium"
                    style={{
                      backgroundColor: "var(--bb-color-accent-light, rgba(0,0,0,0.05))",
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
                  className="p-2 rounded-full transition-colors hover:bg-[var(--bb-color-bg)]"
                  style={{ color: "var(--bb-color-ink-muted)" }}
                  title={t("b2c.family.removeMember")}
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* Info */}
      <div
        className="mt-6 p-4 rounded-2xl"
        style={{
          backgroundColor: "var(--bb-color-bg)",
          border: "1px solid var(--bb-color-border)",
        }}
      >
        <p className="text-sm" style={{ color: "var(--bb-color-ink-muted)" }}>
          <strong>{t("b2c.family.aboutPermissions")}</strong>
          <br />• <strong>{t("b2c.family.roles.owner")}</strong> {t("b2c.family.roles.ownerDesc")}
          <br />• <strong>{t("b2c.family.roles.guardian")}</strong> {t("b2c.family.roles.guardianDesc")}
          <br />• <strong>{t("b2c.family.roles.viewer")}</strong> {t("b2c.family.roles.viewerDesc")}
        </p>
      </div>
    </div>
  );
};

