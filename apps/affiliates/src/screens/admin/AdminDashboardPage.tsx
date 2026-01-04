import { useMemo } from "react";
import { Users, Activity, PauseCircle, TrendingUp, DollarSign } from "lucide-react";
import { useAdminAffiliates } from "@/queries/useAdminAffiliates";
import { formatBRLFromCents } from "@/lib/money";

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

export function AdminDashboardPage() {
  const { data: affiliates = [], isLoading } = useAdminAffiliates();

  const stats = useMemo(() => {
    const total = affiliates.length;
    const active = affiliates.filter((a) => a.status === "active").length;
    const paused = affiliates.filter((a) => a.status === "paused").length;
    return {
      total,
      active,
      paused,
      estimatedRevenueCents: 2_450_00,
      estimatedCommissionCents: 312_50,
    };
  }, [affiliates]);

  return (
    <div className="space-y-8 md:space-y-10">
      <header className="animate-in fade-in slide-in-from-top-4 duration-700 px-1 md:px-0">
        <h1 className="text-3xl md:text-4xl font-serif font-bold text-gray-900 dark:text-white mb-2">
          Visão Geral
        </h1>
        <p className="text-base md:text-lg text-ink-secondary">
          Indicadores rápidos do programa de afiliados.
        </p>
      </header>

      <div className="grid grid-cols-1 gap-4 md:gap-6 md:grid-cols-2 lg:grid-cols-4">
        <PremiumCard 
          title="Afiliados"
          value={isLoading ? "…" : String(stats.total)}
          subtitle="Total cadastrados"
          icon={Users}
          accent="indigo"
        />
        <PremiumCard 
          title="Ativos"
          value={isLoading ? "…" : String(stats.active)}
          subtitle="Gerando vendas"
          icon={Activity}
          accent="emerald"
        />
        <PremiumCard 
          title="Pausados"
          value={isLoading ? "…" : String(stats.paused)}
          subtitle="Sem comissão"
          icon={PauseCircle}
          accent="amber"
        />
        <PremiumCard 
          title="Comissões (Mock)"
          value={formatBRLFromCents(stats.estimatedCommissionCents)}
          subtitle={`Rev: ${formatBRLFromCents(stats.estimatedRevenueCents)}`}
          icon={DollarSign}
          accent="indigo"
        />
      </div>

      <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-[2rem] md:rounded-[2.5rem] border border-white/50 dark:border-gray-700/50 p-6 md:p-8 shadow-xl shadow-indigo-500/5 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-300">
        <h2 className="text-xl md:text-2xl font-serif font-bold text-gray-900 dark:text-white mb-4">
          Próximos Passos
        </h2>
        <ul className="space-y-4">
          {[
            "Conectar este portal ao checkout do B2C para registrar vendas automaticamente.",
            "Implementar regras de aprovação (janela de reembolso) antes de liberar comissão.",
            "Integrar payouts (PIX/transferência) e conciliação financeira."
          ].map((text, i) => (
            <li key={i} className="flex items-start gap-3 group">
              <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-indigo-500 group-hover:scale-150 transition-transform" />
              <p className="text-sm md:text-base text-ink-secondary leading-relaxed">
                {text}
              </p>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
