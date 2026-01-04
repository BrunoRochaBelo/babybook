import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { LayoutDashboard, TrendingUp, DollarSign, ExternalLink, Copy, Check, ArrowRight } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { formatBRLFromCents, percent } from "@/lib/money";
import { useAffiliateMe } from "@/queries/useAffiliateMe";

function PremiumCard({ 
  title, 
  value, 
  subtitle, 
  icon: Icon, 
  accent = "indigo" 
}: { 
  title: string; 
  value: string; 
  subtitle?: string; 
  icon: any; 
  accent?: "indigo" | "emerald" | "amber" 
}) {
  const accentClasses = {
    indigo: "text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/30 shadow-indigo-500/10",
    emerald: "text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/30 shadow-emerald-500/10",
    amber: "text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/30 shadow-amber-500/10",
  };

  return (
    <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-[2rem] md:rounded-[2.5rem] p-6 md:p-8 border border-white/50 dark:border-gray-700/50 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-black/20 group hover:-translate-y-1 transition-all duration-500">
      <div className="flex items-start justify-between mb-4 md:mb-6">
        <div className={`p-3 md:p-4 rounded-2xl ${accentClasses[accent]} group-hover:scale-110 group-hover:rotate-3 transition-transform duration-500`}>
          <Icon className="w-5 h-5 md:w-6 md:h-6" />
        </div>
      </div>
      <div>
        <p className="text-[10px] md:text-xs font-bold uppercase tracking-widest text-ink-muted mb-1 opacity-80">
          {title}
        </p>
        <h3 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white tabular-nums tracking-tighter">
          {value}
        </h3>
        {subtitle && (
          <p className="text-[11px] md:text-xs font-medium text-ink-secondary mt-2 flex items-center gap-1.5 opacity-90">
            <TrendingUp className="w-3 h-3 text-emerald-500" />
            {subtitle}
          </p>
        )}
      </div>
    </div>
  );
}

export function AffiliateDashboardPage() {
  const qc = useQueryClient();
  const { data, isLoading } = useAffiliateMe();
  const [requesting, setRequesting] = useState(false);
  const [copied, setCopied] = useState(false);

  const referralBaseUrlRaw =
    (import.meta.env.VITE_REFERRAL_LINK_BASE_URL as string | undefined) ??
    (import.meta.env.VITE_LANDINGPAGE_URL as string | undefined) ??
    undefined;

  const referralBaseUrl = (() => {
    if (referralBaseUrlRaw && referralBaseUrlRaw.trim().length > 0) {
      return referralBaseUrlRaw.trim().replace(/\/$/, "");
    }
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

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(referralLink);
      setCopied(true);
      toast.success("Link copiado");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Copie manualmente");
    }
  };

  return (
    <div className="space-y-8 md:space-y-10">
      <header className="animate-in fade-in slide-in-from-top-4 duration-700 px-1 md:px-0">
        <h1 className="text-3xl md:text-4xl font-serif font-bold text-gray-900 dark:text-white mb-2">
          Dashboard
        </h1>
        <p className="text-base md:text-lg text-ink-secondary">
          Olá, <span className="text-indigo-600 dark:text-indigo-400 font-bold">{data?.affiliate.name || "Afiliado"}</span>.
        </p>
      </header>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 gap-4 md:gap-6 md:grid-cols-2 lg:grid-cols-3">
        <PremiumCard
          title="Saldo Disponível"
          value={isLoading ? "…" : formatBRLFromCents(data?.balanceCents ?? 0)}
          subtitle={data ? `Min: ${formatBRLFromCents(data.program.minimumPayoutCents)}` : "—"}
          icon={DollarSign}
          accent="emerald"
        />
        <PremiumCard
          title="Taxa de Comissão"
          value={isLoading ? "…" : percent(data?.affiliate.commissionRate ?? 0)}
          subtitle="Ganhos por indicação"
          icon={TrendingUp}
          accent="indigo"
        />
        <PremiumCard
          title="Vendas Realizadas"
          value={isLoading ? "…" : String((data?.sales ?? []).length)}
          subtitle="Total de conversões"
          icon={LayoutDashboard}
          accent="amber"
        />
      </div>

      <div className="grid grid-cols-1 gap-6 md:gap-8 lg:grid-cols-2">
        {/* Referral Link Card */}
        <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-[2rem] md:rounded-[2.5rem] border border-white/50 dark:border-gray-700/50 p-6 md:p-8 shadow-xl shadow-indigo-500/5">
          <div className="flex items-center gap-3 mb-4 md:mb-6">
            <div className="p-2.5 md:p-3 bg-indigo-50 dark:bg-indigo-900/30 rounded-xl text-indigo-600 dark:text-indigo-400">
              <ExternalLink className="w-5 h-5" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Divulgação</h2>
          </div>
          
          <p className="text-sm text-ink-secondary mb-6 opacity-90">
            Use seu link exclusivo para indicar novos clientes.
          </p>

          <div className="space-y-4">
            <div className="relative group">
              <input
                readOnly
                className="w-full bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-2xl px-4 py-4 md:px-5 font-mono text-xs md:text-sm text-ink select-all focus:ring-2 focus:ring-indigo-500 transition-all pr-12"
                value={referralLink}
              />
              <button 
                onClick={handleCopy}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-2 text-ink-muted hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
              >
                {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
              </button>
            </div>
            
            <button
              onClick={handleCopy}
              className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-bold shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 hover:-translate-y-0.5 active:scale-95 transition-all inline-flex items-center justify-center gap-2"
            >
              <Copy className="w-4 h-4" />
              Copiar Link de Afiliado
            </button>
          </div>
        </div>

        {/* Payout Card */}
        <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-[2rem] md:rounded-[2.5rem] border border-white/50 dark:border-gray-700/50 p-6 md:p-8 shadow-xl shadow-indigo-500/5">
          <div className="flex items-center gap-3 mb-4 md:mb-6">
            <div className="p-2.5 md:p-3 bg-emerald-50 dark:bg-emerald-900/30 rounded-xl text-emerald-600 dark:text-emerald-400">
              <DollarSign className="w-5 h-5" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Pagamentos</h2>
          </div>

          <p className="text-sm text-ink-secondary mb-8 opacity-90">
            Solicite o repasse das suas comissões acumuladas.
          </p>

          <div className="p-5 md:p-6 bg-gray-50 dark:bg-gray-900/50 rounded-[1.5rem] md:rounded-3xl border border-gray-100 dark:border-gray-700/50 mb-6">
            <div className="flex items-center justify-between mb-2 px-0.5">
              <span className="text-[10px] md:text-xs font-bold uppercase tracking-widest text-ink-muted">Progresso para saque</span>
              <span className="text-sm font-bold text-indigo-600 dark:text-indigo-400">
                {isLoading ? "…" : Math.min(100, Math.round(((data?.balanceCents ?? 0) / (data?.program.minimumPayoutCents ?? 1)) * 100))}%
              </span>
            </div>
            <div className="h-2 w-full bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-indigo-500 to-indigo-400 transition-all duration-1000"
                style={{ width: `${Math.min(100, Math.round(((data?.balanceCents ?? 0) / (data?.program.minimumPayoutCents ?? 1)) * 100))}%` }}
              />
            </div>
          </div>

          <button
            className="w-full py-4 bg-emerald-600 text-white rounded-2xl font-bold shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 hover:-translate-y-0.5 active:scale-95 transition-all inline-flex items-center justify-center gap-2 disabled:opacity-50 disabled:hover:translate-y-0 disabled:shadow-none"
            onClick={requestPayout}
            disabled={
              requesting ||
              !data ||
              data.balanceCents < data.program.minimumPayoutCents
            }
          >
            {requesting ? "Enviando…" : "Solicitar Pagamento"}
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Recent Sales Table */}
      <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-[2rem] md:rounded-[2.5rem] border border-white/50 dark:border-gray-700/50 shadow-xl shadow-indigo-500/5 overflow-hidden">
        <div className="border-b border-gray-100 dark:border-gray-700/50 p-6 md:p-8">
          <h2 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white">Vendas Recentes</h2>
        </div>
        <div className="p-4 md:p-8">
          {(data?.sales ?? []).length === 0 ? (
            <div className="py-12 text-center">
              <p className="text-ink-secondary">Sem vendas registradas ainda.</p>
            </div>
          ) : (
            <div className="space-y-3 md:space-y-4">
              {data?.sales.slice(0, 8).map((s) => (
                <div
                  key={s.id}
                  className="flex items-center justify-between p-4 md:p-5 rounded-3xl border border-gray-100 dark:border-gray-700/50 bg-gray-50/50 dark:bg-gray-900/30 hover:border-indigo-200 dark:hover:border-indigo-900/50 transition-colors"
                >
                  <div className="flex items-center gap-3 md:gap-4">
                    <div className="w-10 h-10 md:w-12 md:h-12 rounded-2xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                      <DollarSign className="w-4 h-4 md:w-5 md:h-5" />
                    </div>
                    <div>
                      <div className="text-xs md:text-sm font-bold text-gray-900 dark:text-white">
                        {s.orderId}
                      </div>
                      <div className="text-[10px] md:text-xs text-ink-muted">
                        {new Date(s.occurredAt).toLocaleString("pt-BR")}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs md:text-sm font-bold text-gray-900 dark:text-white">
                      {formatBRLFromCents(s.amountCents)}
                    </div>
                    <div className="text-[10px] md:text-xs font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/30 px-2 py-0.5 rounded-full inline-block mt-1">
                      +{formatBRLFromCents(s.commissionCents)}
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
