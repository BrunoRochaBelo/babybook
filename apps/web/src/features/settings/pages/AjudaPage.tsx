/**
 * Central de Ajuda Page - B2C
 *
 * Página com FAQs e informações de suporte.
 */

import { useState, useMemo, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  ChevronLeft,
  ChevronDown,
  MessageCircle,
  Mail,
  Book,
  Heart,
  ArrowRight,
  Shield,
  FileText
} from "lucide-react";
import { useTranslation } from "@babybook/i18n";
import { TextPageSkeleton } from "../components/TextPageSkeleton";
import { motion } from "motion/react";

interface FAQ {
  id: string;
  question: string;
  answer: string;
}

export const AjudaPage = () => {
  const { t } = useTranslation();
  const [isLoading, setIsLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 800);
    return () => clearTimeout(timer);
  }, []);

  const FAQS = useMemo<FAQ[]>(() => [
    {
      id: "1",
      question: t("b2c.help.questions.addChild"),
      answer: t("b2c.help.questions.addChildAnswer"),
    },
    {
      id: "2",
      question: t("b2c.help.questions.shareFamily"),
      answer: t("b2c.help.questions.shareFamilyAnswer"),
    },
    {
      id: "3",
      question: t("b2c.help.questions.security"),
      answer: t("b2c.help.questions.securityAnswer"),
    },
    {
      id: "4",
      question: t("b2c.help.questions.guestbook"),
      answer: t("b2c.help.questions.guestbookAnswer"),
    },
    {
      id: "5",
      question: t("b2c.help.questions.export"),
      answer: t("b2c.help.questions.exportAnswer"),
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
          {t("b2c.help.title")}
        </h1>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 gap-4 mb-8">
        <a
          href="mailto:suporte@babybook.app"
          className="flex flex-col items-center gap-3 p-6 rounded-3xl transition-all hover:shadow-md hover:scale-[1.02]"
          style={{
            backgroundColor: "var(--bb-color-surface)",
            border: "1px solid var(--bb-color-border)",
          }}
        >
          <div className="p-3 rounded-full bg-[var(--bb-color-bg)]">
            <Mail className="w-6 h-6" style={{ color: "var(--bb-color-accent)" }} />
          </div>
          <span
            className="text-base font-bold"
            style={{ color: "var(--bb-color-ink)" }}
          >
            {t("b2c.help.email")}
          </span>
        </a>
        <button
          type="button"
          onClick={() => alert("Chat de suporte em breve!")}
          className="flex flex-col items-center gap-3 p-6 rounded-3xl transition-all hover:shadow-md hover:scale-[1.02]"
          style={{
            backgroundColor: "var(--bb-color-surface)",
            border: "1px solid var(--bb-color-border)",
          }}
        >
          <div className="p-3 rounded-full bg-[var(--bb-color-bg)]">
            <MessageCircle
              className="w-6 h-6"
              style={{ color: "var(--bb-color-accent)" }}
            />
          </div>
          <span
            className="text-base font-bold"
            style={{ color: "var(--bb-color-ink)" }}
          >
            {t("b2c.help.chat")}
          </span>
        </button>
      </div>

      {/* FAQs */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-4">
          <Book className="w-5 h-5" style={{ color: "var(--bb-color-accent)" }} />
          <h2
            className="text-sm font-bold uppercase tracking-wider"
            style={{ color: "var(--bb-color-ink-muted)" }}
          >
            {t("b2c.help.faq")}
          </h2>
        </div>

        <div
          className="rounded-3xl overflow-hidden shadow-sm"
          style={{
            backgroundColor: "var(--bb-color-surface)",
            border: "1px solid var(--bb-color-border)",
          }}
        >
          {FAQS.map((faq, index) => (
            <div
              key={faq.id}
              style={{
                borderBottom:
                  index < FAQS.length - 1
                    ? "1px solid var(--bb-color-border)"
                    : "none",
              }}
            >
              <button
                type="button"
                onClick={() =>
                  setExpandedId(expandedId === faq.id ? null : faq.id)
                }
                className="w-full flex items-center gap-4 p-5 text-left transition-colors hover:bg-[var(--bb-color-bg)]/50"
              >
                <span
                  className="flex-1 font-bold text-base"
                  style={{ color: "var(--bb-color-ink)" }}
                >
                  {faq.question}
                </span>
                <ChevronDown
                  className="w-5 h-5 transition-transform duration-300"
                  style={{
                    color: "var(--bb-color-ink-muted)",
                    transform:
                      expandedId === faq.id ? "rotate(180deg)" : "rotate(0)",
                  }}
                />
              </button>
              {expandedId === faq.id && (
                <div
                  className="px-5 pb-5 pt-0"
                  style={{ color: "var(--bb-color-ink-muted)" }}
                >
                  <motion.p 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    className="text-sm leading-relaxed"
                  >
                    {faq.answer}
                  </motion.p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div
        className="p-6 rounded-2xl text-center mb-10"
        style={{
          backgroundColor: "var(--bb-color-accent-light, rgba(0,0,0,0.03))",
          border: "1px solid var(--bb-color-border)",
        }}
      >
        <Heart
          className="w-8 h-8 mx-auto mb-3"
          style={{ color: "var(--bb-color-accent)" }}
        />
        <p className="text-base font-medium" style={{ color: "var(--bb-color-ink-muted)" }}>
          {t("b2c.help.footer")}
        </p>
      </div>

      {/* Sugestões (Teia de Navegação) */}
      <h3 className="text-sm font-bold uppercase tracking-wider mb-4" style={{ color: "var(--bb-color-ink-muted)" }}>
        Links Úteis
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Link
          to="/jornada/termos"
          className="flex items-center justify-between p-4 rounded-2xl transition-all hover:opacity-90 active:scale-[0.99] group"
          style={{
            backgroundColor: "var(--bb-color-surface)",
            border: "1px solid var(--bb-color-border)",
          }}
        >
          <div className="flex items-center gap-3">
             <div className="w-10 h-10 rounded-xl flex items-center justify-center transition-colors group-hover:bg-[var(--bb-color-bg)]" style={{ backgroundColor: "var(--bb-color-bg)", border: "1px solid var(--bb-color-border)" }}>
                <FileText className="w-5 h-5" style={{ color: "var(--bb-color-accent)" }} />
             </div>
             <div>
                <p className="font-semibold text-sm" style={{ color: "var(--bb-color-ink)" }}>Termos e Políticas</p>
                <p className="text-xs" style={{ color: "var(--bb-color-ink-muted)" }}>Informações legais</p>
             </div>
          </div>
          <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" style={{ color: "var(--bb-color-ink-muted)" }} />
        </Link>
        
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
      </div>
    </motion.div>
  );
};
