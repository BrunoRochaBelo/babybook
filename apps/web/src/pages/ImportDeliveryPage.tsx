import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { ArrowRight, ChevronLeft, Loader2, PackageOpen } from "lucide-react";

import {
  useChildren,
  useImportDirectDelivery,
  usePendingDirectDeliveries,
} from "@/hooks/api";
import { ApiError } from "@/lib/api-client";
import { useTranslation } from "@babybook/i18n";

export function ImportDeliveryPage() {
  const { deliveryId } = useParams<{ deliveryId: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { t } = useTranslation();

  const handleBack = () => {
    if (typeof window !== "undefined" && window.history.length > 1) {
      navigate(-1);
      return;
    }
    navigate("/jornada");
  };

  const childIdHint = useMemo(() => {
    const v = searchParams.get("childId");
    return v && v.trim() ? v.trim() : null;
  }, [searchParams]);

  const pendingQuery = usePendingDirectDeliveries({
    enabled: Boolean(deliveryId),
  });
  const childrenQuery = useChildren({ enabled: true });
  const importMutation = useImportDirectDelivery();

  const delivery = useMemo(() => {
    const items = pendingQuery.data?.items ?? [];
    return items.find((d) => d.deliveryId === deliveryId) ?? null;
  }, [pendingQuery.data?.items, deliveryId]);

  const children = childrenQuery.data ?? [];

  const [mode, setMode] = useState<"existing" | "new">(
    children.length ? "existing" : "new",
  );
  const [selectedChildId, setSelectedChildId] = useState<string | "">(
    children[0]?.id ?? "",
  );
  const [newChildName, setNewChildName] = useState<string>("");
  const [error, setError] = useState<string | null>(null);

  const isBusy = pendingQuery.isLoading || childrenQuery.isLoading;

  const canSubmit =
    Boolean(delivery) &&
    !importMutation.isPending &&
    (mode === "new" || Boolean(selectedChildId));

  const submitHint = useMemo(() => {
    if (!delivery) return null;
    if (importMutation.isPending) return null;
    if (mode === "existing" && !selectedChildId)
      return t("b2c.importDelivery.errors.selectChildRequired");
    return null;
  }, [delivery, importMutation.isPending, mode, selectedChildId, t]);

  // Se o link veio com childId, tentamos pré-selecionar (multi-filho).
  useEffect(() => {
    if (!childrenQuery.isSuccess) return;

    if (!children.length) {
      setMode("new");
      setSelectedChildId("");
      return;
    }

    if (childIdHint && children.some((c) => c.id === childIdHint)) {
      setMode("existing");
      setSelectedChildId(childIdHint);
      return;
    }

    // Fallback: mantém comportamento atual (primeiro da lista)
    setMode((prev) => (prev === "new" ? "existing" : prev));
    setSelectedChildId((prev) => prev || children[0]?.id || "");
  }, [childIdHint, children, childrenQuery.isSuccess]);

  const onSubmit = async () => {
    if (!deliveryId) return;
    setError(null);

    try {
      if (mode === "existing") {
        if (!selectedChildId) {
          setError(t("b2c.importDelivery.errors.selectChildRequired"));
          return;
        }

        const result = await importMutation.mutateAsync({
          deliveryId,
          action: { type: "EXISTING_CHILD", childId: selectedChildId },
        });
        navigate(`/jornada/moment/${result.momentId}`);
        return;
      }

      const result = await importMutation.mutateAsync({
        deliveryId,
        action: {
          type: "NEW_CHILD",
          childName: newChildName.trim() ? newChildName.trim() : undefined,
        },
      });
      navigate(`/jornada/moment/${result.momentId}`);
    } catch (e) {
      if (e instanceof ApiError && e.code === "delivery.email_mismatch") {
        const masked =
          typeof e.details?.target_email_masked === "string"
            ? e.details.target_email_masked
            : null;
        setError(
          masked
            ? t("b2c.importDelivery.errors.emailMismatchMasked", {
                email: masked,
              })
            : t("b2c.importDelivery.errors.emailMismatch"),
        );
        return;
      }
      setError(
        e instanceof Error ? e.message : t("b2c.importDelivery.errors.generic"),
      );
    }
  };

  if (!deliveryId) {
    return (
      <div className="mx-auto w-full max-w-2xl px-4 py-6">
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
            {t("b2c.importDelivery.title")}
          </h1>
        </div>

        <div
          className="rounded-2xl border p-6"
          style={{
            backgroundColor: "var(--bb-color-surface)",
            borderColor: "var(--bb-color-border)",
          }}
        >
          <p className="text-sm" style={{ color: "var(--bb-color-ink-muted)" }}>
            {t("b2c.importDelivery.invalidLink")}
          </p>
        </div>
      </div>
    );
  }

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
      </div>

      <div
        className="rounded-2xl border p-6 shadow-sm"
        style={{
          backgroundColor: "var(--bb-color-surface)",
          borderColor: "var(--bb-color-border)",
        }}
      >
        <div className="flex items-start gap-3">
          <div
            className="flex h-12 w-12 items-center justify-center rounded-xl"
            style={{
              backgroundColor: "var(--bb-color-bg)",
              border: "1px solid var(--bb-color-border)",
            }}
          >
            <PackageOpen
              className="h-6 w-6"
              style={{ color: "var(--bb-color-accent)" }}
            />
          </div>
          <div className="flex-1">
            <h1
              className="text-xl font-semibold"
              style={{ color: "var(--bb-color-ink)" }}
            >
              {t("b2c.importDelivery.title")}
            </h1>
            <p
              className="mt-1 text-sm"
              style={{ color: "var(--bb-color-ink-muted)" }}
            >
              {t("b2c.importDelivery.subtitle")}
            </p>
          </div>
        </div>

        {isBusy && (
          <div
            className="mt-6 flex items-center gap-2 text-sm"
            style={{ color: "var(--bb-color-ink-muted)" }}
          >
            <Loader2 className="h-4 w-4 animate-spin" />
            {t("common.loading")}
          </div>
        )}

        {!isBusy && !delivery && (
          <div className="mt-6">
            <p className="text-sm" style={{ color: "var(--bb-color-ink)" }}>
              {t("b2c.importDelivery.notFound")}
            </p>
            <p
              className="mt-2 text-sm"
              style={{ color: "var(--bb-color-ink-muted)" }}
            >
              {t("b2c.importDelivery.notFoundTip")}
            </p>
          </div>
        )}

        {!isBusy && delivery && (
          <div className="mt-6 space-y-4">
            <div
              className="rounded-xl border p-4"
              style={{
                backgroundColor: "var(--bb-color-bg)",
                borderColor: "var(--bb-color-border)",
              }}
            >
              <div
                className="text-sm"
                style={{ color: "var(--bb-color-ink-muted)" }}
              >
                {t("b2c.importDelivery.deliveryLabel")}
              </div>
              <div
                className="font-medium"
                style={{ color: "var(--bb-color-ink)" }}
              >
                {delivery.title}
              </div>
              <div
                className="mt-1 text-sm"
                style={{ color: "var(--bb-color-ink-muted)" }}
              >
                {delivery.partnerName
                  ? `${t("b2c.importDelivery.fromPartner", {
                      name: delivery.partnerName,
                    })} • `
                  : ""}
                {t("b2c.importDelivery.assetsCount", {
                  count: delivery.assetsCount,
                })}
              </div>
              {delivery.targetEmailMasked && (
                <div
                  className="mt-1 text-sm"
                  style={{ color: "var(--bb-color-ink-muted)" }}
                >
                  {t("b2c.importDelivery.sentTo", {
                    email: delivery.targetEmailMasked,
                  })}
                </div>
              )}
            </div>

            <div className="space-y-3">
              <label
                className="flex cursor-pointer items-start gap-3 rounded-xl border p-3"
                style={{ borderColor: "var(--bb-color-border)" }}
              >
                <input
                  type="radio"
                  className="mt-1"
                  checked={mode === "existing"}
                  onChange={() => {
                    setMode("existing");
                    setError(null);
                  }}
                  disabled={!children.length}
                />
                <div>
                  <div
                    className="font-medium"
                    style={{ color: "var(--bb-color-ink)" }}
                  >
                    {t("b2c.importDelivery.options.existing.title")}
                  </div>
                  <div
                    className="text-sm"
                    style={{ color: "var(--bb-color-ink-muted)" }}
                  >
                    {t("b2c.importDelivery.options.existing.description")}
                  </div>
                </div>
              </label>

              {mode === "existing" && (
                <div>
                  <select
                    className="mt-2 w-full rounded-xl border p-3"
                    style={{
                      backgroundColor: "var(--bb-color-surface)",
                      borderColor: "var(--bb-color-border)",
                      color: "var(--bb-color-ink)",
                    }}
                    value={selectedChildId}
                    onChange={(e) => {
                      setSelectedChildId(e.target.value);
                      setError(null);
                    }}
                    disabled={!children.length}
                  >
                    {children.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                  {!children.length && (
                    <p
                      className="mt-2 text-sm"
                      style={{ color: "var(--bb-color-ink-muted)" }}
                    >
                      {t("b2c.importDelivery.noChildrenHint")}
                    </p>
                  )}
                </div>
              )}

              <label
                className="flex cursor-pointer items-start gap-3 rounded-xl border p-3"
                style={{ borderColor: "var(--bb-color-border)" }}
              >
                <input
                  type="radio"
                  className="mt-1"
                  checked={mode === "new"}
                  onChange={() => {
                    setMode("new");
                    setError(null);
                  }}
                />
                <div>
                  <div
                    className="font-medium"
                    style={{ color: "var(--bb-color-ink)" }}
                  >
                    {t("b2c.importDelivery.options.new.title")}
                  </div>
                  <div
                    className="text-sm"
                    style={{ color: "var(--bb-color-ink-muted)" }}
                  >
                    {t("b2c.importDelivery.options.new.description")}
                  </div>
                </div>
              </label>

              {mode === "new" && (
                <div>
                  <input
                    className="mt-2 w-full rounded-xl border p-3"
                    style={{
                      backgroundColor: "var(--bb-color-surface)",
                      borderColor: "var(--bb-color-border)",
                      color: "var(--bb-color-ink)",
                    }}
                    placeholder={t("b2c.importDelivery.newChildPlaceholder")}
                    value={newChildName}
                    onChange={(e) => {
                      setNewChildName(e.target.value);
                      setError(null);
                    }}
                  />
                </div>
              )}
            </div>

            {error && (
              <div
                className="rounded-xl border p-3 text-sm"
                style={{
                  borderColor: "var(--bb-color-danger)",
                  backgroundColor: "var(--bb-color-danger-soft)",
                  color: "var(--bb-color-danger)",
                }}
              >
                {error}
              </div>
            )}

            <button
              type="button"
              className="mt-2 inline-flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold transition hover:opacity-90 disabled:opacity-60"
              style={{
                backgroundColor: "var(--bb-color-accent)",
                color: "var(--bb-color-surface)",
              }}
              disabled={!canSubmit}
              title={!canSubmit && submitHint ? submitHint : undefined}
              onClick={() => void onSubmit()}
            >
              {importMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {t("b2c.importDelivery.importing")}
                </>
              ) : (
                <>
                  {t("b2c.importDelivery.cta")}{" "}
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>

            {!canSubmit && submitHint ? (
              <p
                className="text-xs"
                style={{ color: "var(--bb-color-ink-muted)" }}
                role="status"
              >
                {submitHint}
              </p>
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
}
