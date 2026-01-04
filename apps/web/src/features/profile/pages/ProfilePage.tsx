import React from "react";
import { User, Mail, Key, Baby, ChevronLeft } from "lucide-react";
import { useProfile } from "../hooks/useProfile";
import { B2CButton } from "@/components/B2CButton";
import { B2CSkeleton } from "@/components/skeletons/B2CSkeleton";
import { useNavigate } from "react-router-dom";
import { motion } from "motion/react";

export const ProfilePage = () => {
  const { data: profile, isLoading } = useProfile();
  const navigate = useNavigate();

  const handleBack = () => {
    navigate("/jornada");
  };

  if (isLoading || !profile) {
    return (
      <div className="max-w-2xl mx-auto p-4 space-y-6">
         {/* Fake Header for Skeleton */}
        <div className="flex items-center gap-2 mb-6 opacity-50">
           <div className="w-8 h-8 rounded-lg bg-[var(--bb-color-surface)]" />
           <div className="w-24 h-4 rounded bg-[var(--bb-color-surface)]" />
        </div>

        <div className="flex items-center gap-4 mb-8">
            <B2CSkeleton className="w-20 h-20 rounded-full" />
            <div className="space-y-2">
                <B2CSkeleton className="h-8 w-48 rounded-lg" />
                <B2CSkeleton className="h-4 w-32 rounded-lg" />
            </div>
        </div>
        <B2CSkeleton className="h-32 w-full rounded-2xl" />
        <B2CSkeleton className="h-32 w-full rounded-2xl" />
      </div>
    );
  }

  return (
    <motion.div
      className="max-w-2xl mx-auto p-4"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      {/* Header with Back Button */}
      <div className="flex items-center mb-8">
        <button
          onClick={handleBack}
          className="flex items-center gap-2 p-2 -ml-2 rounded-xl transition-colors hover:bg-[var(--bb-color-surface)]"
          style={{ color: "var(--bb-color-ink-muted)" }}
        >
          <ChevronLeft className="w-5 h-5" />
          <span className="font-semibold text-sm">Voltar</span>
        </button>
      </div>

      <div className="flex items-center gap-4 mb-8">
        <div 
            className="w-20 h-20 rounded-full flex items-center justify-center border shadow-sm"
            style={{ 
                backgroundColor: "var(--bb-color-surface)", 
                borderColor: "var(--bb-color-border)",
                color: "var(--bb-color-ink-muted)"
            }}
        >
          <User className="w-10 h-10" />
        </div>
        <div>
          <h1 className="text-3xl font-bold">{profile.name}</h1>
          <p style={{ color: "var(--bb-color-ink-muted)" }}>{profile.email}</p>
        </div>
      </div>

      <div className="space-y-8">
        <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
        >
          <h2 className="text-lg font-semibold mb-4" style={{ color: "var(--bb-color-ink)" }}>Minha Conta</h2>
          <div 
            className="rounded-2xl border p-4 space-y-4 shadow-sm"
            style={{ 
                backgroundColor: "var(--bb-color-surface)", 
                borderColor: "var(--bb-color-border)" 
            }}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Mail className="w-5 h-5" style={{ color: "var(--bb-color-ink-muted)" }} />
                <span style={{ color: "var(--bb-color-ink)" }}>{profile.email}</span>
              </div>
              <B2CButton variant="secondary" size="sm" disabled>Alterar E-mail</B2CButton>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Key className="w-5 h-5" style={{ color: "var(--bb-color-ink-muted)" }} />
                <span style={{ color: "var(--bb-color-ink)" }}>••••••••</span>
              </div>
              <B2CButton variant="secondary" size="sm">Alterar Senha</B2CButton>
            </div>
          </div>
        </motion.div>

        <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
        >
          <h2 className="text-lg font-semibold mb-4" style={{ color: "var(--bb-color-ink)" }}>Crianças</h2>
          <div 
            className="rounded-2xl border p-4 space-y-4 shadow-sm"
            style={{ 
                backgroundColor: "var(--bb-color-surface)", 
                borderColor: "var(--bb-color-border)" 
            }}
          >
            {profile.children.map(child => (
              <div key={child.id} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Baby className="w-5 h-5" style={{ color: "var(--bb-color-accent)" }} />
                  <span style={{ color: "var(--bb-color-ink)" }}>{child.name}</span>
                </div>
                <B2CButton variant="ghost" size="sm">Gerenciar</B2CButton>
              </div>
            ))}
             <B2CButton variant="secondary" className="w-full">Adicionar Criança</B2CButton>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
};
