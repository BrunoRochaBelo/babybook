import { Card } from "../ui/card";
import { Infinity, Layers3, ShieldCheck } from "lucide-react";

const plans = [
  {
    name: "Acesso Perpetuo",
    price: "R$ 200",
    description: "Pagamento unico no D0.",
    features: [
      "60+ momentos unicos do Catalogo",
      "5 entradas para cada momento recorrente",
      "Livro da Saude, Cofre e export ZIP inclusos",
      "Provisionamento financeiro de 20 anos",
    ],
  },
  {
    name: "Pacote Completo",
    price: "R$ 49",
    description: "Upsell contextual quando voce precisa de ilimitados.",
    features: [
      "Entradas ilimitadas para visitas, consultas e series criativas",
      "Remove o erro 402 quota.recurrent_limit.exceeded",
      "Mantem o mesmo modelo privado (sem assinatura mensal)",
      "Desbloqueia fotografos e parceiros para subirem midia extra",
    ],
  },
];

export function PeaceOfMindSection() {
  return (
    <section className="bg-gradient-to-br from-secondary/20 via-white to-accent/20 px-4 py-20">
      <div className="mx-auto max-w-6xl space-y-10">
        <div className="text-center space-y-4">
          <p className="text-xs uppercase tracking-[0.4em] text-primary">
            Modelo de negocio transparente
          </p>
          <h2 className="font-serif text-4xl text-foreground">
            Pagamento unico. Sem truques, sem assinatura escondida.
          </h2>
          <p className="text-lg text-muted-foreground">
            Visao & Viabilidade define o famoso "God SLO": custo de estoque de
            ate R$ 2/ano por conta. Por isso o produto eh 100% serverless (Neon
            + Cloudflare + Modal + B2) e provisionado desde o D0.
          </p>
        </div>
        <div className="grid gap-6 md:grid-cols-2">
          {plans.map((plan) => (
            <Card
              key={plan.name}
              className="flex flex-col gap-4 rounded-3xl border border-border bg-white/90 p-8"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.3em] text-primary">
                    {plan.name}
                  </p>
                  <p className="mt-2 text-3xl font-serif text-foreground">
                    {plan.price}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {plan.description}
                  </p>
                </div>
                {plan.name === "Pacote Completo" ? (
                  <Infinity className="h-10 w-10 text-primary" />
                ) : (
                  <ShieldCheck className="h-10 w-10 text-primary" />
                )}
              </div>
              <ul className="mt-4 space-y-3 text-sm text-muted-foreground">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2">
                    <Layers3 className="mt-1 h-4 w-4 text-primary" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </Card>
          ))}
        </div>
        <div className="rounded-3xl border border-primary/30 bg-primary/5 p-6 text-sm text-muted-foreground">
          <p>
            Sem freemium: cada conta ativa ja foi paga via checkout direto ou
            via voucher B2B2C (fotografas, maternidades, bancos parceiros). O
            parceiro absorve o custo e o usuario final entra com acesso completo
            desde o primeiro login.
          </p>
        </div>
      </div>
    </section>
  );
}
