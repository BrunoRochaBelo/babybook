import { useMemo, useState } from "react";
import { FileText, Lock } from "lucide-react";
import { useVault } from "../hooks/useVault";
import { VaultCard } from "../components/VaultCard";
import { VaultEmptyCard } from "../components/VaultEmptyCard";
import { UploadModal } from "../components/UploadModal";
import { HudCard } from "@/components/HudCard";
import { VaultSkeleton } from "@/components/skeletons/VaultSkeleton";
import { B2CErrorState } from "@/layouts/b2cStates";

const DOCUMENT_SLOTS = [
  {
    id: "certidao",
    label: "Certidão de nascimento",
    helper: "PDF ou foto digitalizada do cartório",
  },
  {
    id: "cpf",
    label: "CPF",
    helper: "Comprovante emitido pela Receita Federal",
  },
  {
    id: "carteira-vacinacao",
    label: "Carteira de vacinação",
    helper: "Frente e verso atualizados",
  },
  {
    id: "cartao-sus",
    label: "Cartão SUS",
    helper: "Identificação do Sistema Único de Saúde",
  },
  {
    id: "plano-saude",
    label: "Plano de saúde",
    helper: "Carteirinha do plano ou seguro",
  },
  {
    id: "rg",
    label: "Documento de identidade",
    helper: "Caso o bebê já possua RG ou passaporte",
  },
];

export const VaultPage = () => {
  const {
    data: documents = [],
    isLoading,
    isError,
    error,
    refetch,
  } = useVault();
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const handleSlotClick = (id: string) => {
    console.log("Clicked slot", id);
    // TODO: Implement view Details
  };

  const slotDocuments = useMemo(() => {
    const used = new Set<string>();
    const slots = DOCUMENT_SLOTS.map((slot) => {
      const found = documents.find(
        (doc) => doc.name.toLowerCase().includes(slot.id) && !used.has(doc.id),
      );
      if (found) {
        used.add(found.id);
      }
      return { ...slot, document: found };
    });
    const additional = documents.filter((doc) => !used.has(doc.id));
    return { slots, additional };
  }, [documents]);

  const storedEssentials = slotDocuments.slots.filter((slot) =>
    Boolean(slot.document),
  ).length;
  const essentialsPercent = Math.min(
    100,
    Math.round((storedEssentials / DOCUMENT_SLOTS.length) * 100),
  );

  if (isLoading) {
    return <VaultSkeleton />;
  }

  if (isError) {
    return (
      <B2CErrorState
        title="Erro ao carregar cofre"
        description="Não foi possível acessar seus documentos protegidos."
        errorDetails={error?.message}
        onRetry={() => refetch()}
        skeleton={<VaultSkeleton />}
      />
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-6">
      <h1
        className="mb-6 text-center text-3xl font-serif font-bold"
        style={{ color: "var(--bb-color-ink)" }}
      >
        Cofre de Documentos
      </h1>

      <div className="mb-6">
        <HudCard
          title={"HUD \u2022 cofre familiar"}
          value={`${storedEssentials} de ${DOCUMENT_SLOTS.length} documentos essenciais`}
          description="Tudo criptografado e visível apenas para você, o dono do álbum."
          progressPercent={essentialsPercent}
        />
      </div>

      <div
        className="mt-4 rounded-[32px] border px-5 py-4 text-sm shadow-inner"
        style={{
          backgroundColor: "var(--bb-color-accent-soft)",
          borderColor: "var(--bb-color-accent)",
          color: "var(--bb-color-ink)",
        }}
      >
        <div className="flex items-start gap-3">
          <div
            className="rounded-xl p-2"
            style={{
              backgroundColor: "var(--bb-color-surface)",
              color: "var(--bb-color-accent)",
            }}
          >
            <Lock className="h-4 w-4" />
          </div>
          <p>
            Estes documentos são privados e nunca serão incluídos em álbuns
            impressos ou compartilhados sem consentimento explícito.
          </p>
        </div>
      </div>

      <div
        className="mt-6 rounded-2xl border p-6"
        style={{
          backgroundColor: "var(--bb-color-surface)",
          borderColor: "var(--bb-color-border)",
        }}
      >
        <h2
          className="text-center text-lg font-semibold"
          style={{ color: "var(--bb-color-ink)" }}
        >
          Seus documentos privados
        </h2>
        <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-2">
          {slotDocuments.slots.map((slot) =>
            slot.document ? (
              <VaultCard
                key={slot.id}
                label={slot.label}
                document={slot.document}
                onClick={() => handleSlotClick(slot.id)}
              />
            ) : (
              <VaultEmptyCard
                key={slot.id}
                label={slot.label}
                helper={slot.helper}
                onClick={() => setIsUploadModalOpen(true)}
              />
            ),
          )}

          {slotDocuments.additional.map((doc) => (
            <VaultCard
              key={doc.id}
              label={doc.name} // Additional docs use their name as label
              document={doc}
              onClick={() => handleSlotClick(doc.id)}
            />
          ))}

          {slotDocuments.slots.length === 0 &&
            slotDocuments.additional.length === 0 && (
              <div
                className="col-span-full rounded-xl border-2 border-dashed py-16 text-center"
                style={{ borderColor: "var(--bb-color-border)" }}
              >
                <FileText
                  className="mx-auto mb-4 h-12 w-12"
                  style={{ color: "var(--bb-color-muted)" }}
                />
                <h3
                  className="mb-2 text-lg font-semibold"
                  style={{ color: "var(--bb-color-ink-muted)" }}
                >
                  Nenhum documento no cofre
                </h3>
                <p
                  className="text-sm"
                  style={{ color: "var(--bb-color-ink-muted)" }}
                >
                  Use os cartões acima para enviar seus documentos.
                </p>
              </div>
            )}
        </div>
      </div>

      <UploadModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
      />
    </div>
  );
};
