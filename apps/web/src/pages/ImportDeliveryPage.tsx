import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { ArrowRight, Loader2, PackageOpen } from "lucide-react";

import {
  useChildren,
  useImportDirectDelivery,
  usePendingDirectDeliveries,
} from "@/hooks/api";
import { ApiError } from "@/lib/api-client";

export function ImportDeliveryPage() {
  const { deliveryId } = useParams<{ deliveryId: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const childIdHint = useMemo(() => {
    const v = searchParams.get("childId");
    return v && v.trim() ? v.trim() : null;
  }, [searchParams]);

  const pendingQuery = usePendingDirectDeliveries({
    enabled: Boolean(deliveryId),
  });
  const childrenQuery = useChildren({ enabled: true });
  const importMutation = useImportDirectDelivery();

  const delivery = useMemo(() => {
    const items = pendingQuery.data?.items ?? [];
    return items.find((d) => d.deliveryId === deliveryId) ?? null;
  }, [pendingQuery.data?.items, deliveryId]);

  const children = childrenQuery.data ?? [];

  const [mode, setMode] = useState<"existing" | "new">(
    children.length ? "existing" : "new",
  );
  const [selectedChildId, setSelectedChildId] = useState<string | "">(
    children[0]?.id ?? "",
  );
  const [newChildName, setNewChildName] = useState<string>("");
  const [error, setError] = useState<string | null>(null);

  const isBusy = pendingQuery.isLoading || childrenQuery.isLoading;

  // Se o link veio com childId, tentamos pré-selecionar (multi-filho).
  useEffect(() => {
    if (!childrenQuery.isSuccess) return;

    if (!children.length) {
      setMode("new");
      setSelectedChildId("");
      return;
    }

    if (childIdHint && children.some((c) => c.id === childIdHint)) {
      setMode("existing");
      setSelectedChildId(childIdHint);
      return;
    }

    // Fallback: mantém comportamento atual (primeiro da lista)
    setMode((prev) => (prev === "new" ? "existing" : prev));
    setSelectedChildId((prev) => prev || children[0]?.id || "");
  }, [childIdHint, children, childrenQuery.isSuccess]);

  const onSubmit = async () => {
    if (!deliveryId) return;
    setError(null);

    try {
      if (mode === "existing") {
        if (!selectedChildId) {
          setError("Selecione um bebê (Livro) para importar.");
          return;
        }

        const result = await importMutation.mutateAsync({
          deliveryId,
          action: { type: "EXISTING_CHILD", childId: selectedChildId },
        });
        navigate(`/momentos/${result.momentId}`);
        return;
      }

      const result = await importMutation.mutateAsync({
        deliveryId,
        action: {
          type: "NEW_CHILD",
          childName: newChildName.trim() ? newChildName.trim() : undefined,
        },
      });
      navigate(`/momentos/${result.momentId}`);
    } catch (e) {
      if (e instanceof ApiError && e.code === "delivery.email_mismatch") {
        const masked =
          typeof e.details?.target_email_masked === "string"
            ? e.details.target_email_masked
            : null;
        setError(
          masked
            ? `Esta entrega foi enviada para outro e-mail. Faça login com ${masked} para resgatar.`
            : e.message,
        );
        return;
      }
      setError(
        e instanceof Error
          ? e.message
          : "Falha ao importar entrega. Tente novamente.",
      );
    }
  };

  if (!deliveryId) {
    return (
      <div className="p-6">
        <h1 className="text-xl font-semibold">Importar entrega</h1>
        <p className="text-gray-600 mt-2">Link inválido.</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-start gap-3">
          <div className="w-12 h-12 rounded-xl bg-rose-50 flex items-center justify-center">
            <PackageOpen className="w-6 h-6 text-rose-600" />
          </div>
          <div className="flex-1">
            <h1 className="text-xl font-semibold">Importar entrega</h1>
            <p className="text-gray-600 mt-1">
              Selecione em qual Livro você quer importar essas fotos.
            </p>
          </div>
        </div>

        {isBusy && (
          <div className="mt-6 flex items-center gap-2 text-gray-600">
            <Loader2 className="w-4 h-4 animate-spin" />
            Carregando…
          </div>
        )}

        {!isBusy && !delivery && (
          <div className="mt-6 text-gray-700">
            <p>
              Não encontrei essa entrega na sua conta. Se você acabou de receber
              o link, tente atualizar a página.
            </p>
            <p className="mt-2 text-sm text-gray-600">
              Dica: confirme se você está logado(a) com o mesmo e-mail para o
              qual o fotógrafo enviou a entrega.
            </p>
          </div>
        )}

        {!isBusy && delivery && (
          <div className="mt-6 space-y-4">
            <div className="rounded-xl bg-gray-50 border border-gray-100 p-4">
              <div className="text-sm text-gray-600">Entrega</div>
              <div className="font-medium text-gray-900">{delivery.title}</div>
              <div className="text-sm text-gray-600 mt-1">
                {delivery.partnerName ? `De ${delivery.partnerName} • ` : ""}
                {delivery.assetsCount} arquivo(s)
              </div>
              {delivery.targetEmailMasked && (
                <div className="text-sm text-gray-600 mt-1">
                  Enviado para {delivery.targetEmailMasked}
                </div>
              )}
            </div>

            <div className="space-y-3">
              <label className="flex items-start gap-3 p-3 rounded-xl border border-gray-200 cursor-pointer">
                <input
                  type="radio"
                  className="mt-1"
                  checked={mode === "existing"}
                  onChange={() => setMode("existing")}
                  disabled={!children.length}
                />
                <div>
                  <div className="font-medium">
                    Importar em um Livro existente
                  </div>
                  <div className="text-sm text-gray-600">
                    Grátis para este Livro.
                  </div>
                </div>
              </label>

              {mode === "existing" && (
                <div>
                  <select
                    className="w-full mt-2 rounded-xl border border-gray-200 p-3"
                    value={selectedChildId}
                    onChange={(e) => setSelectedChildId(e.target.value)}
                    disabled={!children.length}
                  >
                    {children.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                  {!children.length && (
                    <p className="text-sm text-gray-600 mt-2">
                      Você ainda não tem nenhum Livro. Selecione “novo Livro”.
                    </p>
                  )}
                </div>
              )}

              <label className="flex items-start gap-3 p-3 rounded-xl border border-gray-200 cursor-pointer">
                <input
                  type="radio"
                  className="mt-1"
                  checked={mode === "new"}
                  onChange={() => setMode("new")}
                />
                <div>
                  <div className="font-medium">Criar um novo Livro</div>
                  <div className="text-sm text-gray-600">
                    Pode consumir 1 crédito do fotógrafo.
                  </div>
                </div>
              </label>

              {mode === "new" && (
                <div>
                  <input
                    className="w-full mt-2 rounded-xl border border-gray-200 p-3"
                    placeholder="Nome do bebê (opcional)"
                    value={newChildName}
                    onChange={(e) => setNewChildName(e.target.value)}
                  />
                </div>
              )}
            </div>

            {error && (
              <div className="rounded-xl border border-red-200 bg-red-50 text-red-700 p-3 text-sm">
                {error}
              </div>
            )}

            <button
              type="button"
              className="w-full mt-2 inline-flex items-center justify-center gap-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white px-4 py-3 disabled:opacity-60"
              disabled={importMutation.isPending || !delivery}
              onClick={() => void onSubmit()}
            >
              {importMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Importando…
                </>
              ) : (
                <>
                  Importar agora <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
