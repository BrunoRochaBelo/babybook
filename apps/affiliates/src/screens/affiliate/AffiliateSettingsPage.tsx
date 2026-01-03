import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Card } from "@babybook/ui";
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
    <div className="space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold">Configurações</h1>
        <p className="text-ink-muted">
          Dados de pagamento e perfil do afiliado.
        </p>
      </header>

      <Card title="Pagamento" description="PIX (mock)">
        <form className="space-y-3" onSubmit={save}>
          <label className="block">
            <span className="text-sm font-medium text-ink">Chave PIX</span>
            <input
              className="mt-1 w-full rounded-lg border border-border bg-surface px-3 py-2"
              value={pixKey}
              onChange={(e) => setPixKey(e.target.value)}
              placeholder="email/telefone/cpf/cnpj/chave aleatória"
            />
          </label>
          <button
            className="rounded-lg bg-accent px-4 py-2 font-medium text-white disabled:opacity-60"
            type="submit"
            disabled={saving}
          >
            {saving ? "Salvando…" : "Salvar"}
          </button>
          {data?.affiliate.payoutMethod?.pixKey ? (
            <p className="text-xs text-ink-muted">
              Atual: {data.affiliate.payoutMethod.pixKey}
            </p>
          ) : null}
        </form>
      </Card>
    </div>
  );
}
