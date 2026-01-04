import { useMemo, useState } from "react";
import { FileText, Lock } from "lucide-react";
import { motion } from "motion/react";
import { useTranslation } from "@babybook/i18n";
import { useVault } from "../hooks/useVault";
import { VaultCard } from "../components/VaultCard";
import { VaultEmptyCard } from "../components/VaultEmptyCard";
import { UploadModal } from "../components/UploadModal";
import { HudCard } from "@/components/HudCard";
import { VaultSkeleton } from "@/components/skeletons/VaultSkeleton";
import { B2CErrorState } from "@/layouts/b2cStates";

export const VaultPage = () => {
  const { t } = useTranslation();
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
    const slotsDef = [
      {
        id: "certidao",
        label: t("b2c.vault.slots.certidao.label", "Certidão de nascimento"),
        helper: t("b2c.vault.slots.certidao.helper", "PDF ou foto digitalizada do cartório"),
      },
      {
        id: "cpf",
        label: t("b2c.vault.slots.cpf.label", "CPF"),
        helper: t("b2c.vault.slots.cpf.helper", "Comprovante emitido pela Receita Federal"),
      },
      {
        id: "carteira-vacinacao",
        label: t("b2c.vault.slots.vaccine.label", "Carteira de vacinação"),
        helper: t("b2c.vault.slots.vaccine.helper", "Frente e verso atualizados"),
      },
      {
        id: "cartao-sus",
        label: t("b2c.vault.slots.sus.label", "Cartão SUS"),
        helper: t("b2c.vault.slots.sus.helper", "Identificação do Sistema Único de Saúde"),
      },
      {
        id: "plano-saude",
        label: t("b2c.vault.slots.insurance.label", "Plano de saúde"),
        helper: t("b2c.vault.slots.insurance.helper", "Carteirinha do plano ou seguro"),
      },
      {
        id: "rg",
        label: t("b2c.vault.slots.rg.label", "Documento de identidade"),
        helper: t("b2c.vault.slots.rg.helper", "Caso o bebê já possua RG ou passaporte"),
      },
    ];

    const used = new Set<string>();
    const slots = slotsDef.map((slot) => {
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
  }, [documents, t]);
  
  // Need to fix usage of DOCUMENT_SLOTS.length below as it is no longer available
  const totalSlots = 6; // Hardcoded length or extracted from a constant ID list if preferred

  const storedEssentials = slotDocuments.slots.filter((slot) =>
    Boolean(slot.document),
  ).length;
  const essentialsPercent = Math.min(
    100,
    Math.round((storedEssentials / totalSlots) * 100),
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
    <motion.div
      className="mx-auto max-w-4xl px-4 py-6"
      initial="hidden"
      animate="visible"
      variants={{
        hidden: { opacity: 0 },
        visible: {
          opacity: 1,
          transition: {
            staggerChildren: 0.1,
            delayChildren: 0.1,
          },
        },
      }}
    >
      <motion.div
        className="mb-8 mt-2 px-2"
        variants={{
          hidden: { opacity: 0, y: 20 },
          visible: {
            opacity: 1,
            y: 0,
            transition: { type: "spring", stiffness: 300, damping: 24 },
          },
        }}
      >
        <h1 className="text-4xl md:text-5xl font-medium tracking-tight">
          Cofre de Documentos
        </h1>
        <p className="mt-2 text-lg opacity-60 font-medium max-w-lg">
          Armazene certidões, documentos e cartões de saúde com segurança.
        </p>
      </motion.div>

      <div className="mb-8">
        <HudCard
          title="Cofre Familiar"
          value={`${storedEssentials} de ${totalSlots} documentos essenciais`}
          description="Tudo criptografado e visível apenas para você, o dono do álbum."
          progressPercent={essentialsPercent}
        />
      </div>

      <div
        className="mt-4 mb-8 rounded-[32px] border px-5 py-4 text-sm shadow-inner"
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
        <h2 className="text-center text-lg font-semibold">
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


        </div>
      </div>

      <UploadModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
      />
    </motion.div>
  );
};
