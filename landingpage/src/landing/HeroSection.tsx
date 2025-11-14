import { Button } from "../ui/button";
import { Compass, ShieldCheck, Sparkles } from "lucide-react";

const stats = [
  {
    value: "60+ roteiros",
    label: "O Catalogo de Momentos define ordem, copy e limites de midia.",
  },
  {
    value: "3 Livros integrados",
    label: "Jornada, Saude e Visitas conversam com o mesmo HUD.",
  },
  {
    value: "5 minutos por ritual",
    label: "Microtarefas guiadas aliviam a tela em branco do fim do dia.",
  },
  {
    value: "20 anos provisionados",
    label: "Pagamento unico cobre storage, compute e export desde o D0.",
  },
];

const differentiators = [
  {
    title: "Curadoria guiada",
    description:
      'O HUD traduz o Catalogo em convites: "Vamos registrar o Primeiro Sorriso?". Sem feed ou algoritmos dispersivos.',
  },
  {
    title: "Calma e privacidade",
    description:
      "Tom acolhedor, sem badges ansiosos. So links privados aprovados por voce e moderacao simples.",
  },
  {
    title: "Legado pronto",
    description:
      "Livro da Jornada, Saude, Visitas, Cofre de documentos e Capsula do Tempo, prontos para imprimir ou exportar.",
  },
];

interface HeroSectionProps {
  onGetStarted: () => void;
}

export function HeroSection({ onGetStarted }: HeroSectionProps) {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-[#FAF8F5] via-[#F5F1EC] to-[#EDE8E2] px-4 py-12 sm:py-16 md:py-20">
      <div className="mx-auto max-w-6xl space-y-12">
        <div className="text-center">
          <div className="mx-auto inline-flex items-center gap-2 rounded-full bg-white/80 px-6 py-2 text-primary shadow-sm">
            <Sparkles className="h-5 w-5 text-primary" />
            <span className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
              Curadoria guiada - Anti rede social - Cofre perpetuo
            </span>
          </div>
          <h1 className="mt-6 px-4 font-serif text-3xl leading-tight text-foreground sm:text-4xl md:text-5xl lg:text-7xl">
            Transforme o rolo caotico em uma historia calma, privada e pronta
            para o futuro.
          </h1>
          <p className="mt-6 px-4 text-base text-muted-foreground sm:text-lg md:text-xl lg:text-2xl">
            O Baby Book nasce dos documentos de Produto, Catalogo de Momentos e
            Design System: HUD com 60+ roteiros, livros tematicos, tom acolhedor
            e um modelo financeiro que garante 20 anos de armazenamento. Voce
            preenche quando o bebe dorme, convida guardioes por links privados e
            sabe que tudo ja esta pronto para exportar ou imprimir.
          </p>
          <div className="mt-8 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Button
              onClick={onGetStarted}
              size="lg"
              className="mx-4 h-12 w-full rounded-2xl bg-primary px-6 font-semibold shadow-lg transition-smooth hover:bg-primary/90 hover:shadow-xl sm:h-14 sm:w-auto sm:px-8"
            >
              Garantir Acesso Perpetuo - R$ 200
            </Button>
            <Button
              onClick={onGetStarted}
              size="lg"
              variant="outline"
              className="mx-4 h-12 w-full rounded-2xl border-border px-6 font-semibold text-primary transition-smooth hover:bg-white sm:h-14 sm:w-auto sm:px-8"
            >
              Tenho um voucher / quero ver a demo
            </Button>
          </div>
          <p className="px-4 text-xs text-muted-foreground sm:text-sm">
            KPI publico: 80% das familias completam o primeiro momento em ate
            24h apos o checkout ou resgate, respeitando o core loop descrito na
            Modelagem de Produto.
          </p>
        </div>

        <div className="grid items-center gap-6 lg:grid-cols-[3fr,2fr]">
          <div className="relative">
            <div className="aspect-[16/10] overflow-hidden rounded-3xl border border-border bg-white shadow-2xl">
              <img
                src="https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?auto=format&fit=crop&w=1200&q=80"
                alt="Interface calma do Baby Book com memorias guiadas e espaco para a familia participar"
                className="h-full w-full object-cover"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {stats.map((item) => (
              <div
                key={item.value}
                className="rounded-2xl border border-border/70 bg-white/80 p-4 shadow-sm"
              >
                <p className="font-serif text-lg text-foreground">
                  {item.value}
                </p>
                <p className="text-sm text-muted-foreground">{item.label}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="grid gap-4 rounded-3xl border border-border bg-white/90 p-6 text-left md:grid-cols-3">
          {differentiators.map((item) => (
            <div key={item.title}>
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-primary">
                {item.title}
              </p>
              <p className="mt-3 text-muted-foreground">{item.description}</p>
            </div>
          ))}
        </div>
        <div className="flex flex-wrap items-center justify-between gap-4 rounded-3xl border border-primary/30 bg-primary/5 px-6 py-4 text-left">
          <div className="flex items-center gap-3 text-primary">
            <ShieldCheck className="h-5 w-5" />
            <span className="text-xs font-semibold uppercase tracking-[0.3em]">
              Compromisso financeiro
            </span>
          </div>
          <p className="text-sm text-muted-foreground">
            Visao & Viabilidade garante custo de estoque menor ou igual a R$ 2/ano
            por conta com stack serverless (Neon + Cloudflare + Backblaze B2).
            O pagamento unico mantem o cofre vivo e auditavel por 20 anos.
          </p>
          <Compass className="h-8 w-8 text-primary/60" />
        </div>
      </div>
    </section>
  );
}
