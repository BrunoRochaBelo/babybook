import { useNavigate } from "react-router-dom";
import { useSelectedChild } from "@/hooks/useSelectedChild";
import { MomentForm } from "@/features/moments/components/MomentForm";
import { ChevronLeft } from "lucide-react";
import { useTranslation } from "@babybook/i18n";

export const MomentAvulsoPage = () => {
  const navigate = useNavigate();
  const { selectedChild } = useSelectedChild();
  const { t } = useTranslation();

  const handleBack = () => {
    if (typeof window !== "undefined" && window.history.length > 1) {
      navigate(-1);
      return;
    }
    navigate("/jornada");
  };

  if (!selectedChild) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-6">
        <div className="mb-6 flex items-center gap-4">
          <button
            onClick={handleBack}
            className="rounded-full p-2 transition"
            style={{ color: "var(--bb-color-ink)" }}
            aria-label={t("common.back")}
          >
            <ChevronLeft className="h-5 w-5" aria-hidden />
          </button>
          <h1
            className="text-lg font-semibold"
            style={{ color: "var(--bb-color-ink)" }}
          >
            {t("b2c.moments.common.newMoment")}
          </h1>
        </div>

        <div className="text-center">
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
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-6">
      {/* Header */}
      <div className="mb-6 flex items-center gap-4">
        <button
          onClick={handleBack}
          className="rounded-full p-2 transition"
          style={{ color: "var(--bb-color-ink)" }}
          aria-label={t("common.back")}
        >
          <ChevronLeft className="h-5 w-5" aria-hidden />
        </button>
        <div>
          <h1
            className="text-2xl font-serif font-bold"
            style={{ color: "var(--bb-color-ink)" }}
          >
            {t("b2c.moments.common.newMoment")}
          </h1>
          <p className="text-sm" style={{ color: "var(--bb-color-ink-muted)" }}>
            {t("b2c.moments.free.description")}
          </p>
        </div>
      </div>

      {/* Form */}
      <div
        className="rounded-2xl border p-6"
        style={{
          backgroundColor: "var(--bb-color-surface)",
          borderColor: "var(--bb-color-border)",
        }}
      >
        <MomentForm childId={selectedChild.id} />
      </div>
    </div>
  );
};
