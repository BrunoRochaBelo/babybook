import React, { useMemo, useState } from "react";
import { ShieldCheck, Upload, FileText, Lock } from "lucide-react";
import { useVault } from "../hooks/useVault";
import { DocumentRow } from "../components/DocumentRow";
import { UploadModal } from "../components/UploadModal";
import { HudCard } from "@/components/HudCard";

const DOCUMENT_SLOTS = [
  { id: "certidao", label: "Certidão de nascimento", helper: "PDF ou foto digitalizada do cartório" },
  { id: "cpf", label: "CPF", helper: "Comprovante emitido pela Receita Federal" },
  { id: "carteira-vacinacao", label: "Carteira de vacinação", helper: "Frente e verso atualizados" },
  { id: "cartao-sus", label: "Cartão SUS", helper: "Identificação do Sistema Único de Saúde" },
  { id: "plano-saude", label: "Plano de saúde", helper: "Carteirinha do plano ou seguro" },
  { id: "rg", label: "Documento de identidade", helper: "Caso o bebê já possua RG ou passaporte" },
];

export const VaultPage = () => {
  const { data: documents = [], isLoading } = useVault();
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
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

  const storedEssentials = slotDocuments.slots.filter((slot) => Boolean(slot.document)).length;
  const essentialsPercent = Math.min(
    100,
    Math.round((storedEssentials / DOCUMENT_SLOTS.length) * 100),
  );

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-6">
      <div className="text-center">
        <ShieldCheck className="mx-auto h-10 w-10 text-primary" />
        <h1 className="mt-2 text-3xl font-serif text-gray-800">Cofre de Documentos</h1>
      </div>

      <div className="mt-6">
        <HudCard
          title={"HUD \u2022 cofre familiar"}
          value={`${storedEssentials} de ${DOCUMENT_SLOTS.length} documentos essenciais`}
          description="Tudo criptografado e visível apenas para você, o dono do álbum."
          progressPercent={essentialsPercent}
          actions={
            <button
              type="button"
              onClick={() => setIsUploadModalOpen(true)}
              className="inline-flex items-center gap-2 rounded-2xl bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground transition hover:opacity-90"
            >
              <Upload className="h-4 w-4" />
              Novo documento
            </button>
          }
        />
      </div>

      <div className="mt-4 rounded-[32px] border border-[#F2DCC8] bg-[#FBF3EC] px-5 py-4 text-sm text-[#8A624D] shadow-inner">
        <div className="flex items-start gap-3">
          <div className="rounded-xl bg-white/60 p-2 text-[#F2995D]">
            <Lock className="h-4 w-4" />
          </div>
          <p>
            Estes documentos são privados e nunca serão incluídos em álbuns impressos ou compartilhados sem consentimento explícito.
          </p>
        </div>
      </div>

      <div className="mt-6 rounded-2xl border border-gray-200 bg-white p-6">
        <h2 className="text-center text-lg font-semibold text-gray-800">
          Seus documentos privados
        </h2>
        <div className="mt-6 space-y-3">
          {isLoading ? (
            <>
              <div className="h-12 animate-pulse rounded-xl bg-gray-100" />
              <div className="h-12 animate-pulse rounded-xl bg-gray-100" />
              <div className="h-12 animate-pulse rounded-xl bg-gray-100" />
            </>
          ) : (
            <>
              {slotDocuments.slots.map((slot) =>
                slot.document ? (
                  <DocumentRow key={slot.document.id} document={slot.document} />
                ) : (
                  <div
                    key={slot.id}
                    className="flex items-center justify-between rounded-xl border border-dashed border-gray-200 bg-gray-50 px-4 py-3"
                  >
                    <div>
                      <p className="font-semibold text-gray-700">{slot.label}</p>
                      <p className="text-xs text-gray-500">{slot.helper}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsUploadModalOpen(true)}
                      className="rounded-full border border-gray-300 px-3 py-1 text-xs font-semibold text-gray-700 transition hover:border-gray-500"
                    >
                      Adicionar
                    </button>
                  </div>
                ),
              )}

              {slotDocuments.additional.map((doc) => (
                <DocumentRow key={doc.id} document={doc} />
              ))}

              {slotDocuments.slots.length === 0 && slotDocuments.additional.length === 0 && (
                <div className="rounded-xl border-2 border-dashed border-gray-200 py-16 text-center">
                  <FileText className="mx-auto mb-4 h-12 w-12 text-gray-300" />
                  <h3 className="mb-2 text-lg font-semibold text-gray-500">
                    Nenhum documento no cofre
                  </h3>
                  <p className="text-sm text-gray-400">
                    Use o botão "Novo documento" para começar.
                  </p>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      <UploadModal isOpen={isUploadModalOpen} onClose={() => setIsUploadModalOpen(false)} />
    </div>
  );
};
