import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ArrowLeft, PlusCircle, History, UserCheck, UserX, Trash2, BadgeDollarSign } from "lucide-react";
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
    <div className="space-y-8 md:space-y-10">
      <header className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between px-1 md:px-0 animate-in fade-in slide-in-from-top-4 duration-700">
        <div className="space-y-2">
          <Link
            className="inline-flex items-center gap-2 text-sm font-bold text-indigo-600 hover:text-indigo-700 transition-colors mb-2"
            to="/admin/affiliates"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar para lista
          </Link>
          <h1 className="text-3xl md:text-4xl font-serif font-bold text-gray-900 dark:text-white">
            {!affiliateId
              ? "Afiliado inválido"
              : isLoading
                ? "Carregando…"
                : data?.affiliate.name}
          </h1>
          {data?.affiliate ? (
            <p className="text-sm md:text-base text-ink-secondary flex flex-wrap items-center gap-x-3 gap-y-1">
              <span className="font-medium">{data.affiliate.email}</span>
              <span className="text-ink-muted hidden md:inline">·</span>
              <span className="bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 px-2 py-0.5 rounded-lg font-mono text-xs">
                {data.affiliate.code}
              </span>
              <span className="text-ink-muted hidden md:inline">·</span>
              <span className="font-bold text-gray-900 dark:text-white">
                Comissão {percent(data.affiliate.commissionRate)}
              </span>
            </p>
          ) : null}
        </div>
        <div className="flex gap-3">
          <button
            className={`flex-1 md:flex-none inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl font-bold transition-all active:scale-95 disabled:opacity-50 ${
              data?.affiliate.status === "active"
                ? "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 hover:bg-amber-200"
                : "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-200"
            }`}
            onClick={toggleStatus}
            disabled={saving || !data}
          >
            {data?.affiliate.status === "active" ? (
              <>
                <UserX className="w-4 h-4" /> Pausar
              </>
            ) : (
              <>
                <UserCheck className="w-4 h-4" /> Ativar
              </>
            )}
          </button>
          <button
            className="flex-1 md:flex-none inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-2xl font-bold hover:bg-red-100 transition-all active:scale-95 disabled:opacity-50"
            onClick={deleteAffiliate}
            disabled={saving}
          >
            <Trash2 className="w-4 h-4" />
            Excluir
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-[2rem] md:rounded-[2.5rem] border border-white/50 dark:border-gray-700/50 p-6 md:p-8 shadow-xl shadow-indigo-500/5 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-150 h-fit">
          <div className="flex items-center gap-3 mb-6 md:mb-8">
            <div className="p-3 bg-indigo-50 dark:bg-indigo-900/30 rounded-xl text-indigo-600 dark:text-indigo-400">
              <BadgeDollarSign className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg md:text-xl font-bold text-gray-900 dark:text-white">Registrar Venda</h2>
              <p className="text-[10px] md:text-xs text-ink-muted mt-0.5 uppercase tracking-widest">Simulador de conversão B2C</p>
            </div>
          </div>

          <form className="space-y-4" onSubmit={registerSale}>
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-widest text-ink-muted mb-1.5 ml-1">Valor do Pedido (R$)</label>
              <div className="relative group">
                <input
                  className="w-full bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-2xl px-5 py-4 text-lg font-bold tabular-nums focus:ring-2 focus:ring-indigo-500 transition-all shadow-sm"
                  value={saleAmount}
                  onChange={(e) => setSaleAmount(e.target.value)}
                  placeholder="199,90"
                />
              </div>
            </div>
            <button
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-4 rounded-2xl shadow-lg shadow-indigo-500/25 transition-all active:scale-95 disabled:opacity-50 inline-flex items-center justify-center gap-2"
              disabled={saving}
              type="submit"
            >
              <PlusCircle className="w-5 h-5" />
              Adicionar Venda Mock
            </button>
          </form>
        </div>

        <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-[2rem] md:rounded-[2.5rem] border border-white/50 dark:border-gray-700/50 p-6 md:p-8 shadow-xl shadow-indigo-500/5 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-300">
          <div className="flex items-center gap-3 mb-6 md:mb-8">
            <div className="p-3 bg-emerald-50 dark:bg-emerald-900/30 rounded-xl text-emerald-600 dark:text-emerald-400">
              <History className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg md:text-xl font-bold text-gray-900 dark:text-white">Histórico</h2>
              <p className="text-[10px] md:text-xs text-ink-muted mt-0.5 uppercase tracking-widest">Últimas 6 conversões</p>
            </div>
          </div>

          <div className="space-y-4">
            {(data?.sales ?? []).slice(0, 6).map((s) => (
              <div
                key={s.id}
                className="flex items-center justify-between p-4 rounded-2xl bg-gray-50 dark:bg-gray-900/30 border border-gray-100 dark:border-gray-800 group hover:bg-white dark:hover:bg-gray-800 hover:shadow-md transition-all"
              >
                <div className="space-y-0.5">
                  <div className="text-sm font-bold text-gray-900 dark:text-white group-hover:text-indigo-600 transition-colors">
                    {s.orderId}
                  </div>
                  <div className="text-[10px] md:text-xs font-medium text-ink-muted">
                    {new Date(s.occurredAt).toLocaleString("pt-BR")}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm md:text-base font-bold text-gray-900 dark:text-white tabular-nums">
                    {formatBRLFromCents(s.amountCents)}
                  </div>
                  <div className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-tighter">
                    +{formatBRLFromCents(s.commissionCents)} comissão
                  </div>
                </div>
              </div>
            ))}
            {(data?.sales ?? []).length === 0 && !isLoading && (
              <div className="py-10 text-center">
                <p className="text-sm text-ink-muted">Sem vendas registradas ainda.</p>
              </div>
            )}
            {isLoading && (
              <div className="py-10 text-center animate-pulse">
                <p className="text-sm text-ink-muted">Buscando histórico...</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
