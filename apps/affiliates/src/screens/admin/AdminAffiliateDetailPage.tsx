import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Card } from "@babybook/ui";
import { apiFetch } from "@/lib/api";
import { formatBRLFromCents, percent } from "@/lib/money";
import { useAdminAffiliateDetail } from "@/queries/useAdminAffiliateDetail";

export function AdminAffiliateDetailPage() {
  const { affiliateId } = useParams<{ affiliateId: string }>();
  const qc = useQueryClient();
  const [saving, setSaving] = useState(false);
  const [saleAmount, setSaleAmount] = useState("199.90");

  const { data, isLoading } = useAdminAffiliateDetail(affiliateId ?? "");

  async function toggleStatus() {
    if (!data) return;
    setSaving(true);
    try {
      if (!affiliateId) throw new Error("Afiliado inválido");
      const next = data.affiliate.status === "active" ? "paused" : "active";
      await apiFetch(`/admin/affiliates/${affiliateId}`, {
        method: "PATCH",
        body: { status: next },
      });
      toast.success(
        next === "active" ? "Afiliado ativado" : "Afiliado pausado",
      );
      await qc.invalidateQueries({ queryKey: ["admin", "affiliates"] });
      await qc.invalidateQueries({
        queryKey: ["admin", "affiliate", affiliateId],
      });
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Falha ao atualizar status",
      );
    } finally {
      setSaving(false);
    }
  }

  async function deleteAffiliate() {
    if (!confirm("Excluir afiliado? (mock: remove do localStorage)")) return;
    setSaving(true);
    try {
      if (!affiliateId) throw new Error("Afiliado inválido");
      await apiFetch(`/admin/affiliates/${affiliateId}`, { method: "DELETE" });
      toast.success("Afiliado excluído");
      await qc.invalidateQueries({ queryKey: ["admin", "affiliates"] });
      window.location.href = "/admin/affiliates";
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Falha ao excluir afiliado",
      );
    } finally {
      setSaving(false);
    }
  }

  async function registerSale(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      if (!affiliateId) throw new Error("Afiliado inválido");
      const normalized = saleAmount.replace(",", ".");
      const amountCents = Math.round(Number(normalized) * 100);
      if (!Number.isFinite(amountCents) || amountCents <= 0) {
        throw new Error("Valor inválido");
      }
      await apiFetch("/admin/sales", {
        method: "POST",
        body: { affiliate_id: affiliateId, amount_cents: amountCents },
      });
      toast.success("Venda registrada (mock)");
      await qc.invalidateQueries({
        queryKey: ["admin", "affiliate", affiliateId],
      });
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Falha ao registrar venda",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="space-y-1">
          <Link
            className="text-sm text-ink-muted hover:underline"
            to="/admin/affiliates"
          >
            ← Voltar
          </Link>
          <h1 className="text-2xl font-semibold">
            {!affiliateId
              ? "Afiliado inválido"
              : isLoading
                ? "Carregando…"
                : data?.affiliate.name}
          </h1>
          {data?.affiliate ? (
            <p className="text-ink-muted">
              {data.affiliate.email} · código{" "}
              <span className="font-mono">{data.affiliate.code}</span> ·
              comissão {percent(data.affiliate.commissionRate)}
            </p>
          ) : null}
        </div>
        <div className="flex gap-2">
          <button
            className="rounded-lg border border-border bg-surface px-3 py-2 text-sm font-medium hover:bg-accent-soft disabled:opacity-60"
            onClick={toggleStatus}
            disabled={saving || !data}
          >
            {data?.affiliate.status === "active" ? "Pausar" : "Ativar"}
          </button>
          <button
            className="rounded-lg border border-border bg-surface px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-500/10 disabled:opacity-60"
            onClick={deleteAffiliate}
            disabled={saving}
          >
            Excluir
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card
          title="Registrar venda"
          description="Dev/mock: simula uma compra B2C"
        >
          <form className="flex gap-2" onSubmit={registerSale}>
            <input
              className="w-full rounded-lg border border-border bg-surface px-3 py-2"
              value={saleAmount}
              onChange={(e) => setSaleAmount(e.target.value)}
              placeholder="199.90"
            />
            <button
              className="rounded-lg bg-accent px-4 py-2 font-medium text-white disabled:opacity-60"
              disabled={saving}
              type="submit"
            >
              Adicionar
            </button>
          </form>
        </Card>

        <Card title="Vendas" description="Últimas vendas (mock)">
          <div className="space-y-2">
            {(data?.sales ?? []).slice(0, 6).map((s) => (
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
            {(data?.sales ?? []).length === 0 ? (
              <p className="text-sm text-ink-muted">Sem vendas ainda.</p>
            ) : null}
          </div>
        </Card>
      </div>
    </div>
  );
}
