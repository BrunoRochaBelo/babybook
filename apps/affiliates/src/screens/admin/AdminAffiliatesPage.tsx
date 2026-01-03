import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Card } from "@babybook/ui";
import { apiFetch } from "@/lib/api";
import { percent } from "@/lib/money";
import { useAdminAffiliates } from "@/queries/useAdminAffiliates";

export function AdminAffiliatesPage() {
  const qc = useQueryClient();
  const { data: affiliates = [], isLoading } = useAdminAffiliates();
  const [q, setQ] = useState("");
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [commissionRate, setCommissionRate] = useState("0.15");

  const filtered = useMemo(() => {
    const qq = q.trim().toLowerCase();
    if (!qq) return affiliates;
    return affiliates.filter(
      (a) =>
        a.name.toLowerCase().includes(qq) ||
        a.email.toLowerCase().includes(qq) ||
        a.code.toLowerCase().includes(qq),
    );
  }, [affiliates, q]);

  async function createAffiliate(e: React.FormEvent) {
    e.preventDefault();
    setCreating(true);
    try {
      await apiFetch("/admin/affiliates", {
        method: "POST",
        body: {
          name,
          email,
          commission_rate: Number(commissionRate),
        },
      });
      toast.success("Afiliado criado");
      setName("");
      setEmail("");
      await qc.invalidateQueries({ queryKey: ["admin", "affiliates"] });
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Falha ao criar afiliado",
      );
    } finally {
      setCreating(false);
    }
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold">Afiliados</h1>
          <p className="text-ink-muted">
            Criar, pausar e acompanhar afiliados do programa.
          </p>
        </div>
        <div className="w-full md:w-80">
          <label className="block text-sm font-medium text-ink">Buscar</label>
          <input
            className="mt-1 w-full rounded-lg border border-border bg-surface px-3 py-2"
            placeholder="nome, email ou código"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>
      </header>

      <Card
        title="Novo afiliado"
        description="Mock: os dados ficam no localStorage"
      >
        <form
          className="grid grid-cols-1 gap-3 md:grid-cols-3"
          onSubmit={createAffiliate}
        >
          <input
            className="rounded-lg border border-border bg-surface px-3 py-2"
            placeholder="Nome"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
          <input
            className="rounded-lg border border-border bg-surface px-3 py-2"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <div className="flex gap-2">
            <input
              className="w-full rounded-lg border border-border bg-surface px-3 py-2"
              placeholder="Comissão (0.15)"
              value={commissionRate}
              onChange={(e) => setCommissionRate(e.target.value)}
              required
            />
            <button
              className="shrink-0 rounded-lg bg-accent px-4 py-2 font-medium text-white disabled:opacity-60"
              disabled={creating}
              type="submit"
            >
              {creating ? "Criando…" : "Criar"}
            </button>
          </div>
        </form>
      </Card>

      <div className="overflow-hidden rounded-xl border border-border bg-surface">
        <table className="w-full text-left text-sm">
          <thead className="bg-background text-xs uppercase text-ink-muted">
            <tr>
              <th className="px-4 py-3">Afiliado</th>
              <th className="px-4 py-3">Código</th>
              <th className="px-4 py-3">Comissão</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td className="px-4 py-4" colSpan={5}>
                  Carregando…
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td className="px-4 py-4" colSpan={5}>
                  Nenhum afiliado encontrado.
                </td>
              </tr>
            ) : (
              filtered.map((a) => (
                <tr key={a.id} className="border-t border-border">
                  <td className="px-4 py-3">
                    <div className="font-medium text-ink">{a.name}</div>
                    <div className="text-ink-muted">{a.email}</div>
                  </td>
                  <td className="px-4 py-3 font-mono text-xs">{a.code}</td>
                  <td className="px-4 py-3">{percent(a.commissionRate)}</td>
                  <td className="px-4 py-3">
                    <span
                      className={
                        a.status === "active"
                          ? "rounded-full bg-green-500/10 px-2 py-1 text-xs font-medium text-green-700"
                          : "rounded-full bg-yellow-500/10 px-2 py-1 text-xs font-medium text-yellow-700"
                      }
                    >
                      {a.status === "active" ? "Ativo" : "Pausado"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      className="rounded-lg border border-border bg-background px-3 py-2 text-sm font-medium hover:bg-accent-soft"
                      to={`/admin/affiliates/${a.id}`}
                    >
                      Ver detalhes
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
