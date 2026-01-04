import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Wallet, Save, Info } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { useAffiliateMe } from "@/queries/useAffiliateMe";

export function AffiliateSettingsPage() {
  const qc = useQueryClient();
  const { data } = useAffiliateMe();
  const [pixKey, setPixKey] = useState(
    data?.affiliate.payoutMethod?.pixKey ?? "",
  );
  const [saving, setSaving] = useState(false);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await apiFetch("/affiliate/me", {
        method: "PATCH",
        body: { payout_method: { pix_key: pixKey.trim() || null } },
      });
      toast.success("Dados atualizados");
      await qc.invalidateQueries({ queryKey: ["affiliate", "me"] });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Falha ao salvar");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-8 md:space-y-10">
      <header className="animate-in fade-in slide-in-from-top-4 duration-700 px-1 md:px-0">
        <h1 className="text-3xl md:text-4xl font-serif font-bold text-gray-900 dark:text-white mb-2">
          Configurações
        </h1>
        <p className="text-base md:text-lg text-ink-secondary">
          Gerencie seus dados de pagamento e perfil de afiliado.
        </p>
      </header>

      <div className="max-w-2xl">
        <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-[2rem] md:rounded-[2.5rem] border border-white/50 dark:border-gray-700/50 p-6 md:p-8 shadow-xl shadow-indigo-500/5 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-150">
          <div className="flex items-center gap-3 mb-6 md:mb-8">
            <div className="p-2.5 md:p-3 bg-indigo-50 dark:bg-indigo-900/30 rounded-xl text-indigo-600 dark:text-indigo-400">
              <Wallet className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg md:text-xl font-bold text-gray-900 dark:text-white">Pagamento</h2>
              <p className="text-[10px] md:text-xs text-ink-muted mt-0.5">Defina sua chave PIX para receber repasses</p>
            </div>
          </div>

          <form className="space-y-6" onSubmit={save}>
            <div>
              <label className="block mb-2">
                <span className="text-[10px] md:text-xs font-bold uppercase tracking-[0.15em] text-ink-muted ml-1">Chave PIX</span>
                <input
                  className="mt-1 w-full bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-2xl px-4 py-4 md:px-5 font-mono text-xs md:text-sm text-ink focus:ring-2 focus:ring-indigo-500 transition-all placeholder:text-gray-400"
                  value={pixKey}
                  onChange={(e) => setPixKey(e.target.value)}
                  placeholder="E-mail, CPF, CNPJ ou Telefone"
                />
              </label>
              <div className="mt-2 flex items-start gap-2 px-1">
                <Info className="w-3.5 h-3.5 text-indigo-500 mt-0.5" />
                <p className="text-[11px] md:text-xs text-ink-secondary leading-relaxed">
                  No momento, utilizamos apenas PIX para automatizar os pagamentos.
                </p>
              </div>
            </div>

            <div className="pt-2">
              <button
                className="w-full sm:w-auto px-8 py-4 bg-indigo-600 text-white rounded-2xl font-bold shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 hover:-translate-y-0.5 active:scale-95 transition-all inline-flex items-center justify-center gap-2 disabled:opacity-50"
                type="submit"
                disabled={saving || !pixKey.trim()}
              >
                {saving ? "Salvando…" : "Salvar Alterações"}
                <Save className="w-5 h-5" />
              </button>
            </div>

            {data?.affiliate.payoutMethod?.pixKey && (
              <div className="p-4 bg-indigo-50/50 dark:bg-indigo-900/20 rounded-2xl border border-indigo-100/50 dark:border-indigo-900/30 flex items-center justify-between">
                <div>
                  <p className="text-[9px] md:text-[10px] font-bold uppercase tracking-widest text-indigo-600 dark:text-indigo-400">Chave Ativa</p>
                  <p className="text-xs md:text-sm font-mono text-gray-900 dark:text-white mt-1 break-all">{data.affiliate.payoutMethod.pixKey}</p>
                </div>
                <div className="shrink-0 w-2 h-2 rounded-full bg-indigo-500 animate-pulse shadow-[0_0_8px_rgba(99,102,241,0.5)]" />
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}
