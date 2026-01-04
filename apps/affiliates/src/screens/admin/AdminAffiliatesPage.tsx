import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Search, UserPlus, Info, ChevronRight } from "lucide-react";
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
    <div className="space-y-8 md:space-y-10">
      <header className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between px-1 md:px-0 animate-in fade-in slide-in-from-top-4 duration-700">
        <div className="space-y-2">
          <h1 className="text-3xl md:text-4xl font-serif font-bold text-gray-900 dark:text-white">
            Afiliados
          </h1>
          <p className="text-base md:text-lg text-ink-secondary">
            Criar, pausar e acompanhar afiliados do programa.
          </p>
        </div>
        <div className="relative w-full md:w-80 group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-muted group-focus-within:text-indigo-500 transition-colors" />
          <input
            className="w-full bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm border border-gray-200 dark:border-gray-700/50 rounded-2xl pl-11 pr-4 py-3.5 text-sm transition-all focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
            placeholder="Buscar por nome, email ou código..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>
      </header>

      <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-[2rem] md:rounded-[2.5rem] border border-white/50 dark:border-gray-700/50 p-6 md:p-8 shadow-xl shadow-indigo-500/5 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-150">
        <div className="flex items-center gap-3 mb-6 md:mb-8">
          <div className="p-3 bg-indigo-50 dark:bg-indigo-900/30 rounded-xl text-indigo-600 dark:text-indigo-400">
            <UserPlus className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg md:text-xl font-bold text-gray-900 dark:text-white">Novo Afiliado</h2>
            <p className="text-[10px] md:text-xs text-ink-muted mt-0.5 uppercase tracking-widest">Mock: Dados salvos localmente</p>
          </div>
        </div>

        <form className="grid grid-cols-1 md:grid-cols-12 gap-5" onSubmit={createAffiliate}>
          <div className="md:col-span-4">
            <label className="block text-[10px] font-bold uppercase tracking-widest text-ink-muted mb-1.5 ml-1">Nome</label>
            <input
              className="w-full bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-2xl px-4 py-3.5 text-sm focus:ring-2 focus:ring-indigo-500 transition-all shadow-sm"
              placeholder="Ex: João Silva"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
          <div className="md:col-span-4">
            <label className="block text-[10px] font-bold uppercase tracking-widest text-ink-muted mb-1.5 ml-1">E-mail</label>
            <input
              className="w-full bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-2xl px-4 py-3.5 text-sm focus:ring-2 focus:ring-indigo-500 transition-all shadow-sm"
              placeholder="joao@exemplo.com"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-[10px] font-bold uppercase tracking-widest text-ink-muted mb-1.5 ml-1">Comissão</label>
            <input
              className="w-full bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-2xl px-4 py-3.5 text-sm font-mono focus:ring-2 focus:ring-indigo-500 transition-all shadow-sm"
              placeholder="0.15"
              value={commissionRate}
              onChange={(e) => setCommissionRate(e.target.value)}
              required
            />
          </div>
          <div className="md:col-span-2 flex items-end">
            <button
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3.5 rounded-2xl shadow-lg shadow-indigo-500/25 transition-all active:scale-95 disabled:opacity-50"
              disabled={creating}
              type="submit"
            >
              {creating ? "Criando…" : "Criar"}
            </button>
          </div>
        </form>
      </div>

      <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-[2rem] md:rounded-[2.5rem] border border-white/50 dark:border-gray-700/50 shadow-xl shadow-indigo-500/5 overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-700 delay-300">
        <div className="hidden md:block">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-gray-100 dark:border-gray-700/50">
                <th className="px-8 py-5 text-[10px] font-bold uppercase tracking-widest text-ink-muted">Afiliado</th>
                <th className="px-8 py-5 text-[10px] font-bold uppercase tracking-widest text-ink-muted">Código</th>
                <th className="px-8 py-5 text-[10px] font-bold uppercase tracking-widest text-ink-muted text-center">Comissão</th>
                <th className="px-8 py-5 text-[10px] font-bold uppercase tracking-widest text-ink-muted text-center">Status</th>
                <th className="px-8 py-5"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700/50">
              {isLoading ? (
                <tr>
                  <td className="px-8 py-10 text-center text-ink-secondary" colSpan={5}>Carregando…</td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td className="px-8 py-10 text-center text-ink-secondary" colSpan={5}>Nenhum afiliado encontrado.</td>
                </tr>
              ) : (
                filtered.map((a) => (
                  <tr key={a.id} className="group hover:bg-indigo-50/30 dark:hover:bg-indigo-900/10 transition-colors">
                    <td className="px-8 py-5">
                      <div className="font-bold text-gray-900 dark:text-white">{a.name}</div>
                      <div className="text-xs text-ink-muted truncate max-w-[200px]">{a.email}</div>
                    </td>
                    <td className="px-8 py-5 font-mono text-xs text-indigo-600 dark:text-indigo-400 bg-indigo-50/30 dark:bg-indigo-900/20 skew-x-[-10deg] px-3 py-1 inline-block mt-4 ml-8 rounded-lg">
                      <span className="skew-x-[10deg] inline-block">{a.code}</span>
                    </td>
                    <td className="px-8 py-5 text-center font-bold text-gray-900 dark:text-white tabular-nums">
                      {percent(a.commissionRate)}
                    </td>
                    <td className="px-8 py-5 text-center">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        a.status === "active"
                          ? "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400"
                          : "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400"
                      }`}>
                        <div className={`w-1.5 h-1.5 rounded-full ${a.status === "active" ? "bg-emerald-500" : "bg-amber-500"} animate-pulse`} />
                        {a.status === "active" ? "Ativo" : "Pausado"}
                      </span>
                    </td>
                    <td className="px-8 py-5 text-right">
                      <Link
                        className="inline-flex items-center gap-2 bg-gray-50 dark:bg-gray-900/50 hover:bg-white dark:hover:bg-gray-800 border border-gray-200 dark:border-gray-700 px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-sm hover:shadow-md hover:-translate-y-0.5 active:scale-95"
                        to={`/admin/affiliates/${a.id}`}
                      >
                        Ver Detalhes
                        <ChevronRight className="w-4 h-4" />
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile View: Mini Cards */}
        <div className="md:hidden divide-y divide-gray-100 dark:divide-gray-700/50">
          {isLoading ? (
            <div className="px-6 py-10 text-center text-ink-secondary">Carregando…</div>
          ) : filtered.length === 0 ? (
            <div className="px-6 py-10 text-center text-ink-secondary">Nenhum afiliado encontrado.</div>
          ) : (
            filtered.map((a) => (
              <Link 
                key={a.id} 
                to={`/admin/affiliates/${a.id}`}
                className="block p-6 active:bg-indigo-50 dark:active:bg-indigo-900/10 transition-colors"
              >
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <div className="font-bold text-gray-900 dark:text-white">{a.name}</div>
                    <div className="text-[10px] text-ink-muted truncate max-w-[200px]">{a.email}</div>
                  </div>
                  <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${
                    a.status === "active"
                      ? "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400"
                      : "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400"
                  }`}>
                    {a.status === "active" ? "Ativo" : "Pausado"}
                  </span>
                </div>
                <div className="flex justify-between items-center bg-gray-50 dark:bg-gray-900/30 p-3 rounded-xl">
                  <div>
                    <div className="text-[9px] font-bold uppercase tracking-widest text-ink-muted">Código</div>
                    <div className="font-mono text-xs text-indigo-600 dark:text-indigo-400">{a.code}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-[9px] font-bold uppercase tracking-widest text-ink-muted">Comissão</div>
                    <div className="font-bold text-sm tabular-nums text-gray-900 dark:text-white">{percent(a.commissionRate)}</div>
                  </div>
                </div>
              </Link>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
