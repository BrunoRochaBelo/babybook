import { useMemo } from "react";
import { Card } from "@babybook/ui";
import { useAdminAffiliates } from "@/queries/useAdminAffiliates";
import { formatBRLFromCents } from "@/lib/money";

export function AdminDashboardPage() {
  const { data: affiliates = [], isLoading } = useAdminAffiliates();

  const stats = useMemo(() => {
    const total = affiliates.length;
    const active = affiliates.filter((a) => a.status === "active").length;
    const paused = affiliates.filter((a) => a.status === "paused").length;
    // Em produção: estas métricas vêm do backend (vendas/payouts). Aqui exibimos placeholders.
    return {
      total,
      active,
      paused,
      estimatedRevenueCents: 2_450_00,
      estimatedCommissionCents: 312_50,
    };
  }, [affiliates]);

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold">Visão geral</h1>
        <p className="text-ink-muted">
          Indicadores rápidos do programa de afiliados.
        </p>
      </header>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card
          title={isLoading ? "…" : String(stats.total)}
          description="Afiliados"
        >
          <p className="text-sm text-ink-muted">Total cadastrados</p>
        </Card>
        <Card
          title={isLoading ? "…" : String(stats.active)}
          description="Ativos"
        >
          <p className="text-sm text-ink-muted">Gerando links/vendas</p>
        </Card>
        <Card
          title={isLoading ? "…" : String(stats.paused)}
          description="Pausados"
        >
          <p className="text-sm text-ink-muted">Sem comissionamento</p>
        </Card>
        <Card
          title={formatBRLFromCents(stats.estimatedCommissionCents)}
          description="Comissões (mock)"
        >
          <p className="text-sm text-ink-muted">
            Receita estimada: {formatBRLFromCents(stats.estimatedRevenueCents)}
          </p>
        </Card>
      </div>

      <div className="rounded-xl border border-border bg-surface p-4">
        <h2 className="text-lg font-semibold">Próximos passos</h2>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-ink-muted">
          <li>
            Conectar este portal ao checkout do B2C para registrar vendas
            automaticamente.
          </li>
          <li>
            Implementar regras de aprovação (janela de reembolso) antes de
            liberar comissão.
          </li>
          <li>
            Integrar payouts (PIX/transferência) e conciliação financeira.
          </li>
        </ul>
      </div>
    </div>
  );
}
