import { useNavigate, useParams } from "react-router-dom";
import { motion } from "motion/react";
import { useSelectedChild } from "@/hooks/useSelectedChild";
import { useAuthStore } from "@/store/auth";
import { useMyVouchers } from "@/features/vouchers";
import { useMomentTemplate } from "../hooks/useMomentTemplate";
import { MomentForm } from "../components/MomentForm";
import { ChevronLeft, Sparkles } from "lucide-react";
import { useTranslation } from "@babybook/i18n";

export const MomentDraftPage = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { template_id } = useParams<{ template_id: string }>();
  const { selectedChild } = useSelectedChild();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const { data: template, isLoading } = useMomentTemplate(template_id || "");
  const vouchersQuery = useMyVouchers({ enabled: isAuthenticated });

  const handleBack = () => {
    if (typeof window !== "undefined" && window.history.length > 1) {
      navigate(-1);
      return;
    }
    navigate("/jornada");
  };

  const hasRedeemedVoucher = (vouchersQuery.data ?? []).some((v) =>
    Boolean(v.voucher?.redeemed_at),
  );

  const audience =
    template?.mediaB2B && hasRedeemedVoucher
      ? ("b2b" as const)
      : ("b2c" as const);

  if (!selectedChild) {
    return (
      <div className="mx-auto max-w-2xl py-6 text-center">
        <p className="text-sm" style={{ color: "var(--bb-color-ink-muted)" }}>
          {t("b2c.moments.draft.selectChildFirst")}
        </p>
        <button
          onClick={() => navigate("/perfil-usuario")}
          className="mt-4 rounded-2xl px-4 py-2 text-sm font-semibold transition hover:opacity-90"
          style={{
            backgroundColor: "var(--bb-color-accent)",
            color: "var(--bb-color-surface)",
          }}
        >
          {t("b2c.moments.draft.goToProfile")}
        </button>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="mx-auto max-w-2xl animate-pulse py-6">
        <div
          className="mb-6 h-12 w-2/3 rounded-2xl border"
          style={{
            backgroundColor: "var(--bb-color-surface)",
            borderColor: "var(--bb-color-border)",
          }}
        />
        <div
          className="h-96 rounded-2xl border"
          style={{
            backgroundColor: "var(--bb-color-surface)",
            borderColor: "var(--bb-color-border)",
          }}
        />
      </div>
    );
  }

  if (!template) {
    return (
      <div className="mx-auto max-w-2xl py-10 text-center">
        <h1 className="text-2xl font-bold">
          {t("b2c.moments.draft.missingTemplateTitle")}
        </h1>
        <p
          className="mt-3 text-sm"
          style={{ color: "var(--bb-color-ink-muted)" }}
        >
          {t("b2c.moments.draft.missingTemplateDescription", {
            templateId: template_id,
          })}
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <button
            onClick={handleBack}
            className="rounded-2xl border px-4 py-2 text-sm font-semibold transition hover:opacity-90"
            style={{
              borderColor: "var(--bb-color-border)",
              color: "var(--bb-color-ink)",
              backgroundColor: "transparent",
            }}
          >
            {t("b2c.moments.draft.backToJourney")}
          </button>
          <button
            onClick={() => navigate("/jornada/moment/avulso")}
            className="rounded-2xl px-4 py-2 text-sm font-semibold transition hover:opacity-90"
            style={{
              backgroundColor: "var(--bb-color-accent)",
              color: "var(--bb-color-surface)",
            }}
          >
            {t("b2c.moments.draft.useFreeMoment")}
          </button>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      className="mx-auto max-w-2xl py-6"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="mb-8 flex items-start sm:items-center gap-4 flex-col sm:flex-row">
        <button
          onClick={handleBack}
          className="flex items-center gap-2 p-2 rounded-lg transition-colors hover:bg-[var(--bb-color-bg)]"
          style={{ color: "var(--bb-color-ink)" }}
        >
          <ChevronLeft className="w-5 h-5" />
          <span className="font-semibold text-sm">Voltar</span>
        </button>
        <div className="flex-1">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-bold">
              {template?.title || t("b2c.moments.common.newMoment")}
            </h1>

            {template?.id === "marcas-crescimento" ? (
              <span
                className="inline-flex items-center gap-1 rounded-full border px-3 py-1 text-[11px] font-bold uppercase tracking-[0.25em]"
                style={{
                  borderColor: "rgba(242,153,93,0.35)",
                  background:
                    "linear-gradient(135deg, rgba(242,153,93,0.18), rgba(168,85,247,0.14))",
                  color: "var(--bb-color-ink)",
                  boxShadow: "0 0 0 1px rgba(242,153,93,0.08) inset",
                }}
                title="Este momento inclui geração por IA"
              >
                <Sparkles className="h-4 w-4" aria-hidden />
                IA
              </span>
            ) : null}
          </div>
          {template?.prompt && (
            <p
              className="text-sm mt-1"
              style={{ color: "var(--bb-color-ink-muted)" }}
            >
              {template.prompt}
            </p>
          )}

          {template?.id === "marcas-crescimento" ? (
            <p
              className="mt-1 text-xs"
              style={{ color: "var(--bb-color-ink-muted)" }}
            >
              Gere um carimbo (mão/pé) a partir da sua foto — a IA remove o
              fundo e aplica o efeito de tinta.
            </p>
          ) : null}
        </div>
      </div>

      <div
        className="rounded-2xl border p-6 mb-8"
        style={{
          backgroundColor: "var(--bb-color-surface)",
          borderColor: "var(--bb-color-border)",
        }}
      >
        <MomentForm
          childId={selectedChild.id}
          template={template}
          audience={audience}
        />
      </div>
    </motion.div>
  );
};
