/**
 * Termos e Políticas Page - B2C
 *
 * Página com termos de uso e política de privacidade.
 */

import { Link } from "react-router-dom";
import { ChevronLeft, FileText, Shield, ExternalLink } from "lucide-react";

interface LegalDoc {
  id: string;
  title: string;
  description: string;
  icon: React.ElementType;
  lastUpdated: string;
  url: string;
}

const LEGAL_DOCS: LegalDoc[] = [
  {
    id: "terms",
    title: "Termos de Uso",
    description: "Condições para uso do Baby Book",
    icon: FileText,
    lastUpdated: "Atualizado em 01/12/2024",
    url: "/termos-de-uso",
  },
  {
    id: "privacy",
    title: "Política de Privacidade",
    description: "Como tratamos seus dados",
    icon: Shield,
    lastUpdated: "Atualizado em 01/12/2024",
    url: "/politica-de-privacidade",
  },
];

export const TermosPage = () => {
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
          Termos e Políticas
        </h1>
      </div>

      {/* Documents List */}
      <div className="space-y-4">
        {LEGAL_DOCS.map((doc) => {
          const Icon = doc.icon;
          return (
            <a
              key={doc.id}
              href={doc.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-4 p-4 rounded-2xl transition-all hover:shadow-sm"
              style={{
                backgroundColor: "var(--bb-color-surface)",
                border: "1px solid var(--bb-color-border)",
              }}
            >
              <div
                className="p-3 rounded-xl"
                style={{
                  backgroundColor: "var(--bb-color-bg)",
                  color: "var(--bb-color-accent)",
                }}
              >
                <Icon className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <p
                  className="font-medium"
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
                  className="text-xs mt-1"
                  style={{ color: "var(--bb-color-ink-muted)" }}
                >
                  {doc.lastUpdated}
                </p>
              </div>
              <ExternalLink
                className="w-5 h-5"
                style={{ color: "var(--bb-color-ink-muted)" }}
              />
            </a>
          );
        })}
      </div>

      {/* Version Info */}
      <div
        className="mt-8 p-4 rounded-2xl text-center"
        style={{
          backgroundColor: "var(--bb-color-bg)",
          border: "1px solid var(--bb-color-border)",
        }}
      >
        <p
          className="text-sm font-medium"
          style={{ color: "var(--bb-color-ink)" }}
        >
          Baby Book
        </p>
        <p
          className="text-xs mt-1"
          style={{ color: "var(--bb-color-ink-muted)" }}
        >
          Versão 1.0.0
        </p>
        <p
          className="text-xs mt-2"
          style={{ color: "var(--bb-color-ink-muted)" }}
        >
          © 2024 Baby Book. Todos os direitos reservados.
        </p>
      </div>

      {/* Contact */}
      <div
        className="mt-4 p-4 rounded-2xl"
        style={{
          backgroundColor: "var(--bb-color-surface)",
          border: "1px solid var(--bb-color-border)",
        }}
      >
        <p
          className="text-sm text-center"
          style={{ color: "var(--bb-color-ink-muted)" }}
        >
          Dúvidas sobre nossos termos?{" "}
          <a
            href="mailto:legal@babybook.app"
            className="font-medium underline"
            style={{ color: "var(--bb-color-accent)" }}
          >
            Entre em contato
          </a>
        </p>
      </div>
    </div>
  );
};
