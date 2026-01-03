import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Card } from "@babybook/ui";
import { apiFetch } from "@/lib/api";
import { formatBRLFromCents, percent } from "@/lib/money";
import { useAffiliateMe } from "@/queries/useAffiliateMe";

export function AffiliateDashboardPage() {
  const qc = useQueryClient();
  const { data, isLoading } = useAffiliateMe();
  const [requesting, setRequesting] = useState(false);

  const referralBaseUrlRaw =
    (import.meta.env.VITE_REFERRAL_LINK_BASE_URL as string | undefined) ??
    (import.meta.env.VITE_LANDINGPAGE_URL as string | undefined) ??
    undefined;

  const referralBaseUrl = (() => {
    if (referralBaseUrlRaw && referralBaseUrlRaw.trim().length > 0) {
      return referralBaseUrlRaw.trim().replace(/\/$/, "");
    }
    // Fallback: útil em dev, mas em produção prefira configurar a env.
    if (typeof window !== "undefined" && window.location?.origin) {
      return window.location.origin;
    }
    return "";
  })();

  const referralLink = data?.affiliate?.code
    ? `${referralBaseUrl}/?ref=${encodeURIComponent(data.affiliate.code)}`
    : "";

  async function requestPayout() {
    setRequesting(true);
    try {
      await apiFetch("/affiliate/payouts/request", { method: "POST" });
      toast.success("Solicitação enviada");
      await qc.invalidateQueries({ queryKey: ["affiliate", "me"] });
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Falha ao solicitar payout",
      );
    } finally {
      setRequesting(false);
    }
  }

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold">Dashboard do Afiliado</h1>
        <p className="text-ink-muted">Acompanhe seu link, vendas e repasses.</p>
      </header>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card
          title={isLoading ? "…" : (data?.affiliate.name ?? "—")}
          description="Afiliado"
        >
          <p className="text-sm text-ink-muted">
            Comissão: {data ? percent(data.affiliate.commissionRate) : "—"}
          </p>
        </Card>
        <Card
          title={isLoading ? "…" : formatBRLFromCents(data?.balanceCents ?? 0)}
          description="Saldo disponível"
        >
          <p className="text-sm text-ink-muted">
            Mínimo para saque:{" "}
            {data ? formatBRLFromCents(data.program.minimumPayoutCents) : "—"}
          </p>
        </Card>
        <Card
          title={isLoading ? "…" : String((data?.sales ?? []).length)}
          description="Vendas (mock)"
        >
          <p className="text-sm text-ink-muted">Aprove para liberar comissão</p>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card title="Seu link" description="Use para divulgar">
          <div className="flex flex-col gap-2">
            <input
              readOnly
              className="w-full rounded-lg border border-border bg-surface px-3 py-2 font-mono text-xs"
              value={referralLink}
            />
            <button
              className="rounded-lg border border-border bg-background px-3 py-2 text-sm font-medium hover:bg-accent-soft"
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText(referralLink);
                  toast.success("Link copiado");
                } catch {
                  toast.message("Copie manualmente");
                }
              }}
              disabled={!referralLink}
            >
              Copiar link
            </button>
          </div>
        </Card>

        <Card title="Pagamentos" description="Solicitar repasse">
          <button
            className="rounded-lg bg-accent px-4 py-2 font-medium text-white disabled:opacity-60"
            onClick={requestPayout}
            disabled={
              requesting ||
              !data ||
              data.balanceCents < data.program.minimumPayoutCents
            }
          >
            {requesting ? "Enviando…" : "Solicitar pagamento"}
          </button>
          {!data ? null : data.balanceCents <
            data.program.minimumPayoutCents ? (
            <p className="mt-2 text-sm text-ink-muted">
              Você precisa acumular pelo menos{" "}
              {formatBRLFromCents(data.program.minimumPayoutCents)} para
              solicitar.
            </p>
          ) : null}
        </Card>
      </div>

      <div className="rounded-xl border border-border bg-surface">
        <div className="border-b border-border px-4 py-3">
          <h2 className="text-lg font-semibold">Vendas recentes</h2>
        </div>
        <div className="p-4">
          {(data?.sales ?? []).length === 0 ? (
            <p className="text-sm text-ink-muted">
              Sem vendas registradas ainda.
            </p>
          ) : (
            <div className="space-y-2">
              {data?.sales.slice(0, 8).map((s) => (
                <div
                  key={s.id}
                  className="flex items-center justify-between rounded-lg border border-border bg-background px-3 py-2"
                >
                  <div>
                    <div className="text-sm font-medium text-ink">
                      {s.orderId}
                    </div>
                    <div className="text-xs text-ink-muted">
                      {new Date(s.occurredAt).toLocaleString("pt-BR")}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium">
                      {formatBRLFromCents(s.amountCents)}
                    </div>
                    <div className="text-xs text-ink-muted">
                      comissão {formatBRLFromCents(s.commissionCents)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
