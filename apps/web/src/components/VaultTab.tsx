import { useMemo } from "react";
import { IdCard, ShieldCheck, Upload } from "lucide-react";
import { cn } from "@/lib/utils";
import { useVaultDocuments } from "@/hooks/api";
import type { VaultDocument, VaultDocumentKind } from "@babybook/contracts";

interface VaultTabProps {
  childId: string;
}

type DocumentSlot = {
  id: VaultDocumentKind;
  label: string;
  helper: string;
};

const DOCUMENT_SLOTS: DocumentSlot[] = [
  {
    id: "certidao",
    label: "Certidao de nascimento",
    helper: "Escaneie o documento original",
  },
  {
    id: "cpf_rg",
    label: "CPF ou RG",
    helper: "Anexe a via digital ou comprovante",
  },
  {
    id: "sus_plano",
    label: "Cartao SUS / Plano",
    helper: "Foto legivel do cartao oficial",
  },
  {
    id: "outro",
    label: "Outros arquivos",
    helper: "Receitas, comprovantes e laudos",
  },
];

const formatDate = (value: string) =>
  new Date(value).toLocaleDateString("pt-BR", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

export const VaultTab = ({ childId }: VaultTabProps) => {
  const { data: documents = [], isLoading } = useVaultDocuments(childId);
  const documentsByKind = useMemo(() => {
    const map = new Map<VaultDocumentKind, VaultDocument>();
    documents.forEach((doc) => map.set(doc.kind, doc));
    return map;
  }, [documents]);

  return (
    <section className="space-y-6">
      <div className="rounded-[32px] border border-border bg-surface p-6 shadow-sm">
        <div className="flex flex-wrap items-start gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-ink text-surface">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div className="flex-1">
            <p className="text-xs uppercase tracking-[0.3em] text-ink-muted">
              Cofre de documentos
            </p>
            <h2 className="mt-1 font-serif text-2xl text-ink">
              Guardamos somente o essencial
            </h2>
            <p className="mt-2 text-sm text-ink-muted">
              Estes arquivos permanecem privados e nunca entram nos fotolivros
              impressos. Use o cofre para manter os dados da crianca seguros em
              um unico lugar.
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {DOCUMENT_SLOTS.map((slot) => {
          const existing = documentsByKind.get(slot.id);
          return (
            <div
              key={slot.id}
              className={cn(
                "rounded-[28px] border-2 bg-surface p-5 text-center transition",
                existing ? "border-ink" : "border-dashed border-border hover:border-ink",
              )}
            >
              <IdCard className="mx-auto h-8 w-8 text-ink" />
              <h3 className="mt-3 font-semibold text-ink">{slot.label}</h3>
              {existing ? (
                <>
                  <p className="mt-1 text-xs text-ink-muted">
                    Registrado em {formatDate(existing.createdAt)}
                  </p>
                  {existing.note && (
                    <p className="mt-2 text-xs text-ink-muted">{existing.note}</p>
                  )}
                </>
              ) : (
                <>
                  <p className="mt-1 text-xs text-ink-muted">{slot.helper}</p>
                  <button
                    type="button"
                    disabled
                    className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-primary/60 px-4 py-2 text-sm font-semibold text-primary-foreground opacity-70"
                    title="Upload disponivel em breve"
                  >
                    <Upload className="h-4 w-4" />
                    Fazer upload
                  </button>
                </>
              )}
            </div>
          );
        })}
      </div>

      <div className="rounded-[28px] border border-border bg-surface p-5 shadow-sm">
        <p className="text-xs uppercase tracking-[0.3em] text-ink-muted">
          Historico do cofre
        </p>
        {isLoading ? (
          <p className="mt-2 text-sm text-ink-muted">Carregando documentos...</p>
        ) : documents.length === 0 ? (
          <p className="mt-2 text-sm text-ink-muted">
            Nenhum documento enviado ainda. Assim que fizer upload de um arquivo,
            ele aparece aqui.
          </p>
        ) : (
          <ul className="mt-3 space-y-2 text-sm text-ink">
            {documents.map((doc) => (
              <li
                key={doc.id}
                className="rounded-2xl border border-border px-4 py-2 text-left"
              >
                <p className="font-semibold text-ink">
                  {DOCUMENT_SLOTS.find((slot) => slot.id === doc.kind)?.label ??
                    doc.kind}
                </p>
                <p className="text-xs text-ink-muted">
                  Registrado em {formatDate(doc.createdAt)}
                </p>
                {doc.note && (
                  <p className="mt-1 text-xs text-ink-muted">{doc.note}</p>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="rounded-[28px] border border-border bg-surface-muted/60 p-5 text-sm text-ink">
        <p>
          <strong>Seguranca reforcada:</strong> apos 5 minutos sem interacao,
          esta aba exige nova autenticacao (senha, PIN ou biometria). Caso
          esteja em um dispositivo compartilhado, finalize a sessao depois de
          gerenciar novos documentos.
        </p>
      </div>
    </section>
  );
};
