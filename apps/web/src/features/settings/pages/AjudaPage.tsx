/**
 * Central de Ajuda Page - B2C
 *
 * Página com FAQs e informações de suporte.
 */

import { useState } from "react";
import { Link } from "react-router-dom";
import {
  ChevronLeft,
  ChevronDown,
  MessageCircle,
  Mail,
  Book,
  Heart,
} from "lucide-react";

interface FAQ {
  id: string;
  question: string;
  answer: string;
}

const FAQS: FAQ[] = [
  {
    id: "1",
    question: "Como adiciono uma nova criança?",
    answer:
      "No menu lateral, clique no botão 'Cadastrar criança' ou acesse 'Perfil da criança' > 'Adicionar'. Você pode cadastrar múltiplas crianças e alternar entre elas facilmente.",
  },
  {
    id: "2",
    question: "Como compartilho momentos com a família?",
    answer:
      "Em cada momento, clique no ícone de compartilhar. Você pode gerar um link único para compartilhar ou convidar guardiões diretamente pelo e-mail.",
  },
  {
    id: "3",
    question: "Os dados do meu bebê estão seguros?",
    answer:
      "Sim! Utilizamos criptografia de ponta a ponta e armazenamento seguro na nuvem. Apenas você e as pessoas que você autorizar podem ver as memórias.",
  },
  {
    id: "4",
    question: "Como funciona o Livro de Visitas?",
    answer:
      "O Livro de Visitas permite que familiares e amigos deixem mensagens carinhosas. Você controla se as mensagens precisam de aprovação antes de aparecer.",
  },
  {
    id: "5",
    question: "Posso exportar minhas fotos?",
    answer:
      "Sim! No Cofre, você pode baixar todas as suas fotos e documentos a qualquer momento. Seus dados pertencem a você.",
  },
];

export const AjudaPage = () => {
  const [expandedId, setExpandedId] = useState<string | null>(null);

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
          Central de Ajuda
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
            E-mail
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
            Chat
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
            Perguntas Frequentes
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
          Feito com amor para registrar os momentos mais preciosos da vida.
        </p>
      </div>
    </div>
  );
};
