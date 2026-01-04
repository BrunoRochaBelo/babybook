/**
 * Termos e Políticas Page - B2C
 *
 * Página com termos de uso e política de privacidade.
 */

import { useMemo, useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { FileText, Shield, ExternalLink, ArrowRight, MessageCircle } from "lucide-react";
import { useTranslation } from "@babybook/i18n";
import { TextPageSkeleton } from "../components/TextPageSkeleton";
import { motion } from "motion/react";

import { B2CBackButton } from "@/components/B2CBackButton";

interface LegalDoc {
  id: string;
  title: string;
  description: string;
  icon: React.ElementType;
  lastUpdated: string;
  url: string;
}

export const TermosPage = () => {
  const { t } = useTranslation();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 800);
    return () => clearTimeout(timer);
  }, []);

  const LEGAL_DOCS = useMemo<LegalDoc[]>(() => [
    {
      id: "terms",
      title: t("b2c.terms.termsOfUse"),
      description: t("b2c.terms.termsOfUseDesc"),
      icon: FileText,
      lastUpdated: t("b2c.terms.updatedAt", { date: "01/12/2024" }),
      url: "/termos-de-uso",
    },
    {
      id: "privacy",
      title: t("b2c.terms.privacyPolicy"),
      description: t("b2c.terms.privacyPolicyDesc"),
      icon: Shield,
      lastUpdated: t("b2c.terms.updatedAt", { date: "01/12/2024" }),
      url: "/politica-de-privacidade",
    },
  ], [t]);

  if (isLoading) {
    return <TextPageSkeleton />;
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="max-w-4xl mx-auto px-4 py-6"
    >
      {/* Botão Voltar */}
      <B2CBackButton fallback="/jornada/minha-conta" />

      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <h1
          className="text-3xl font-serif font-bold leading-tight"
          style={{ color: "var(--bb-color-ink)" }}
        >
          {t("b2c.terms.title")}
        </h1>
      </div>

      {/* Documents List */}
      <div className="space-y-4 mb-8">
        {LEGAL_DOCS.map((doc) => {
          const Icon = doc.icon;
          return (
            <a
              key={doc.id}
              href={doc.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-4 p-5 rounded-2xl transition-all hover:shadow-md hover:scale-[1.01] group"
              style={{
                backgroundColor: "var(--bb-color-surface)",
                border: "1px solid var(--bb-color-border)",
              }}
            >
              <div
                className="p-3 rounded-xl transition-colors group-hover:bg-[var(--bb-color-bg)]"
                style={{
                  backgroundColor: "var(--bb-color-bg)",
                  color: "var(--bb-color-accent)",
                }}
              >
                <Icon className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <p
                  className="font-bold text-lg mb-1"
                  style={{ color: "var(--bb-color-ink)" }}
                >
                  {doc.title}
                </p>
                <p
                  className="text-sm"
                  style={{ color: "var(--bb-color-ink-muted)" }}
                >
                  {doc.description}
                </p>
                <p
                  className="text-xs mt-2 font-medium"
                  style={{ color: "var(--bb-color-ink-muted)" }}
                >
                  {doc.lastUpdated}
                </p>
              </div>
              <ExternalLink
                className="w-5 h-5 transition-transform group-hover:translate-x-1 group-hover:-translate-y-1"
                style={{ color: "var(--bb-color-ink-muted)" }}
              />
            </a>
          );
        })}
      </div>

      {/* Version Info */}
      <div
        className="mb-10 p-6 rounded-2xl text-center"
        style={{
          backgroundColor: "var(--bb-color-bg)",
          border: "1px solid var(--bb-color-border)",
        }}
      >
        <p
          className="text-base font-bold"
          style={{ color: "var(--bb-color-ink)" }}
        >
          Baby Book App
        </p>
        <p
          className="text-sm mt-1"
          style={{ color: "var(--bb-color-ink-muted)" }}
        >
          {t("b2c.terms.version")} 1.0.0
        </p>
        <p
          className="text-xs mt-3 opacity-60"
          style={{ color: "var(--bb-color-ink-muted)" }}
        >
          © 2024 Baby Book. {t("b2c.terms.rightsReserved")}
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
                <p className="text-xs" style={{ color: "var(--bb-color-ink-muted)" }}>Seus dados</p>
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
                <p className="font-semibold text-sm" style={{ color: "var(--bb-color-ink)" }}>Central de Ajuda</p>
                <p className="text-xs" style={{ color: "var(--bb-color-ink-muted)" }}>Suporte</p>
             </div>
          </div>
          <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" style={{ color: "var(--bb-color-ink-muted)" }} />
        </Link>
      </div>
    </motion.div>
  );
};
