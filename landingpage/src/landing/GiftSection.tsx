import { Button } from "../ui/button";
import { Building, Camera, Gift, HeartHandshake } from "lucide-react";

const partnerUseCases = [
  {
    icon: Camera,
    title: "Fotografas de newborn",
    text: "Incluem o Baby Book no pacote premium. Cada voucher ja chega ativado com o plano completo.",
  },
  {
    icon: Building,
    title: "Clinicas, bancos e planos",
    text: "Oferecem como presente de nascimento ou fidelidade. Relatorios mostram ativacoes e NPS.",
  },
  {
    icon: HeartHandshake,
    title: "Familia e amigos proximos",
    text: "Podem comprar um vale. O presente dura 20 anos, nao so o primeiro mesversario.",
  },
];

export function GiftSection() {
  return (
    <section className="bg-gradient-to-br from-accent/20 via-white to-primary/10 px-4 py-20">
      <div className="mx-auto max-w-5xl text-center space-y-8">
        <Gift className="mx-auto h-16 w-16 text-primary" />
        <h2 className="font-serif text-4xl text-foreground">
          Voucher B2B2C e presente premium, tudo documentado.
        </h2>
        <p className="text-lg text-muted-foreground">
          A estrategia descrita em Visao & Viabilidade depende do canal parceiro.
          Cada voucher tem custo previsivel, ativa sem cartao e mantem as mesmas
          garantias do plano direto.
        </p>
        <div className="flex flex-col justify-center gap-4 sm:flex-row">
          <Button
            size="lg"
            variant="outline"
            className="h-14 rounded-2xl px-8 font-semibold"
          >
            Resgatar voucher
          </Button>
          <Button
            size="lg"
            variant="outline"
            className="h-14 rounded-2xl px-8 font-semibold"
          >
            Quero ser parceiro
          </Button>
        </div>
        <div className="grid gap-6 md:grid-cols-3 text-left">
          {partnerUseCases.map((useCase) => (
            <div
              key={useCase.title}
              className="rounded-3xl border border-border bg-white/80 p-6 shadow-sm"
            >
              <useCase.icon className="h-8 w-8 text-primary" />
              <h3 className="mt-4 text-lg font-semibold text-foreground">
                {useCase.title}
              </h3>
              <p className="mt-2 text-sm text-muted-foreground">
                {useCase.text}
              </p>
            </div>
          ))}
        </div>
        <div className="rounded-3xl border border-border bg-white/80 p-6 text-left shadow-sm">
          <p className="text-sm uppercase tracking-[0.3em] text-primary">
            Como funciona
          </p>
          <ul className="mt-4 list-decimal space-y-2 pl-6 text-sm text-muted-foreground">
            <li>Parceiro compra lote com desconto (10+ acessos).</li>
            <li>Entregamos codigos unicos com expiracao de 12 meses.</li>
            <li>Familia ativa sem cartao, com onboarding direto para o HUD.</li>
            <li>Dashboard do parceiro mostra ativacoes e mensagens especiais.</li>
          </ul>
        </div>
      </div>
    </section>
  );
}
