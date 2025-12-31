/**
 * Central de Ajuda Page - B2C
 *
 * Página com FAQs e informações de suporte.
 */

import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import {
  ChevronLeft,
  ChevronDown,
  MessageCircle,
  Mail,
  Book,
  Heart,
} from "lucide-react";
import { useTranslation } from "@babybook/i18n";

interface FAQ {
  id: string;
  question: string;
  answer: string;
}

export const AjudaPage = () => {
  const { t } = useTranslation();
  const [expandedId, setExpandedId] = useState<string | null>(null);

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
          {t("b2c.help.title")}
        </h1>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 gap-3 mb-8">
        <a
          href="mailto:suporte@babybook.app"
          className="flex flex-col items-center gap-2 p-4 rounded-2xl transition-colors"
          style={{
            backgroundColor: "var(--bb-color-surface)",
            border: "1px solid var(--bb-color-border)",
          }}
        >
          <Mail className="w-6 h-6" style={{ color: "var(--bb-color-accent)" }} />
          <span
            className="text-sm font-medium"
            style={{ color: "var(--bb-color-ink)" }}
          >
            {t("b2c.help.email")}
          </span>
        </a>
        <button
          type="button"
          className="flex flex-col items-center gap-2 p-4 rounded-2xl transition-colors"
          style={{
            backgroundColor: "var(--bb-color-surface)",
            border: "1px solid var(--bb-color-border)",
          }}
        >
          <MessageCircle
            className="w-6 h-6"
            style={{ color: "var(--bb-color-accent)" }}
          />
          <span
            className="text-sm font-medium"
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
            className="text-sm font-semibold uppercase tracking-wider"
            style={{ color: "var(--bb-color-ink-muted)" }}
          >
            {t("b2c.help.faq")}
          </h2>
        </div>

        <div
          className="rounded-2xl overflow-hidden"
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
                className="w-full flex items-center gap-4 p-4 text-left"
              >
                <span
                  className="flex-1 font-medium"
                  style={{ color: "var(--bb-color-ink)" }}
                >
                  {faq.question}
                </span>
                <ChevronDown
                  className="w-5 h-5 transition-transform"
                  style={{
                    color: "var(--bb-color-ink-muted)",
                    transform:
                      expandedId === faq.id ? "rotate(180deg)" : "rotate(0)",
                  }}
                />
              </button>
              {expandedId === faq.id && (
                <div
                  className="px-4 pb-4"
                  style={{ color: "var(--bb-color-ink-muted)" }}
                >
                  <p className="text-sm leading-relaxed">{faq.answer}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div
        className="p-4 rounded-2xl text-center"
        style={{
          backgroundColor: "var(--bb-color-accent-light, rgba(0,0,0,0.03))",
          border: "1px solid var(--bb-color-border)",
        }}
      >
        <Heart
          className="w-6 h-6 mx-auto mb-2"
          style={{ color: "var(--bb-color-accent)" }}
        />
        <p className="text-sm" style={{ color: "var(--bb-color-ink-muted)" }}>
          {t("b2c.help.footer")}
        </p>
      </div>
    </div>
  );
};
