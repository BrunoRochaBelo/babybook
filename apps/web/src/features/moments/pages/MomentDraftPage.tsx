import { useNavigate, useParams } from "react-router-dom";
import { useSelectedChild } from "@/hooks/useSelectedChild";
import { useAuthStore } from "@/store/auth";
import { useMyVouchers } from "@/features/vouchers";
import { useMomentTemplate } from "../hooks/useMomentTemplate";
import { MomentForm } from "../components/MomentForm";
import { ChevronLeft } from "lucide-react";
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
        <h1
          className="text-2xl font-serif"
          style={{ color: "var(--bb-color-ink)" }}
        >
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
    <div className="mx-auto max-w-2xl py-6">
      <div className="mb-6 flex items-center gap-4">
        <button
          onClick={handleBack}
          className="rounded-full p-2 transition-colors"
          style={{
            color: "var(--bb-color-ink)",
          }}
        >
          <ChevronLeft className="h-5 w-5" aria-hidden />
        </button>
        <div>
          <h1
            className="text-2xl font-bold"
            style={{ color: "var(--bb-color-ink)" }}
          >
            {template?.title || t("b2c.moments.common.newMoment")}
          </h1>
          {template?.prompt && (
            <p
              className="text-sm"
              style={{ color: "var(--bb-color-ink-muted)" }}
            >
              {template.prompt}
            </p>
          )}
        </div>
      </div>

      <div
        className="rounded-2xl border p-6"
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
    </div>
  );
};
