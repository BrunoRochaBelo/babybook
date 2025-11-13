import { Link } from "react-router-dom";
import { useQuotaUsage } from "../hooks/useQuotaUsage";
import { UpsellModal } from "@/components/UpsellModal";

export function DashboardPage() {
  const { data, isLoading } = useQuotaUsage();

  return (
    <main className="mx-auto flex max-w-5xl flex-col gap-6 px-6 py-10">
      <header className="flex flex-col gap-2">
        <p className="text-sm text-foreground/60">Olá, Ana 👋</p>
        <h1 className="text-3xl font-semibold text-foreground">
          Seu Baby Book está seguro e atualizado.
        </h1>
      </header>
      <section className="grid gap-4 md:grid-cols-3">
        <div className="rounded-3xl border border-border bg-white p-6">
          <div className="mb-4">
            <h3 className="font-semibold text-foreground">Armazenamento</h3>
            <p className="text-sm text-foreground/60">Limite base 2 GiB</p>
          </div>
          {isLoading ? (
            <span className="text-sm text-foreground/60">Carregando...</span>
          ) : (
            <strong className="text-2xl text-primary">
              {data?.storage.used ?? 0} / {data?.storage.limit ?? 0} GiB
            </strong>
          )}
        </div>
        <div className="rounded-3xl border border-border bg-white p-6">
          <div className="mb-4">
            <h3 className="font-semibold text-foreground">Momentos</h3>
            <p className="text-sm text-foreground/60">Limite base 60</p>
          </div>
          {isLoading ? (
            <span className="text-sm text-foreground/60">Carregando...</span>
          ) : (
            <strong className="text-2xl text-primary">
              {data?.moments.used ?? 0} / {data?.moments.limit ?? 0}
            </strong>
          )}
        </div>
        <div className="rounded-3xl border border-border bg-white p-6">
          <div className="mb-4">
            <h3 className="font-semibold text-foreground">Repetições</h3>
            <p className="text-sm text-foreground/60">Upsell recorrente</p>
          </div>
          <div className="flex flex-col gap-1">
            {isLoading ? (
              <span className="text-sm text-foreground/60">Carregando...</span>
            ) : (
              <strong className="text-2xl text-primary">
                {data?.recurrent.used ?? 0} / {data?.recurrent.limit ?? 0}
              </strong>
            )}
            <Link
              to="/upsell/recurrent"
              className="text-sm text-primary hover:underline"
            >
              Ver opções de upgrade
            </Link>
          </div>
        </div>
      </section>
      <UpsellModal />
    </main>
  );
}
