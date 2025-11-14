import { Card } from "../ui/card";
import {
  BookOpenCheck,
  Compass,
  Layers,
  Printer,
  ShieldCheck,
  Users,
} from "lucide-react";

const principles = [
  {
    icon: Compass,
    title: "Curadoria guiada",
    description:
      "O HUD bebe direto do Catalogo de Momentos. Sao 60+ roteiros com copy, limites de midia e contexto cronologico.",
  },
  {
    icon: ShieldCheck,
    title: "Calma e privacidade",
    description:
      "Design System define tom acolhedor, sem likes, badges ansiosos ou feed. Apenas convites focados.",
  },
  {
    icon: Layers,
    title: "Tres Livros sincronizados",
    description:
      "Jornada, Saude e Visitas compartilham tokens, navegacao e telemetria. Nenhum dado fica solto.",
  },
  {
    icon: BookOpenCheck,
    title: "Modelo financeiro claro",
    description:
      "Visao & Viabilidade garante pagamento unico, custo de estoque <= R$ 2/ano e provisionamento de 20 anos.",
  },
  {
    icon: Users,
    title: "Rede de guardioes",
    description:
      "Ana, Sergio e parceiros entram com papeis diferentes. Links privados, moderacao e capsulas do tempo sao nativas.",
  },
  {
    icon: Printer,
    title: "Pronto para exportar e imprimir",
    description:
      "ZIP, PoD e pedidos futuros usam o mesmo layout serifado do app. Digital e fisico falam o mesmo idioma.",
  },
];

export function ValuePillarsSection() {
  return (
    <section className="bg-white px-4 py-20">
      <div className="mx-auto max-w-6xl space-y-12">
        <div className="text-center space-y-4">
          <p className="text-xs uppercase tracking-[0.4em] text-primary">
            Por que o produto existe
          </p>
          <h2 className="font-serif text-4xl text-foreground">
            Cada decisao nasce dos documentos de Produto, UX e Viabilidade.
          </h2>
          <p className="text-lg text-muted-foreground">
            O Baby Book nao eh um app de fotos. Eh um cofre guiado feito para
            pais exaustos, com arquitetura e copy alinhadas a uma tese clara.
          </p>
        </div>
        <div className="grid gap-6 md:grid-cols-2">
          {principles.map((principle) => (
            <Card
              key={principle.title}
              className="flex flex-col gap-4 rounded-3xl border border-border bg-secondary/10 p-6 text-left"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10">
                <principle.icon className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="font-serif text-xl text-foreground">
                  {principle.title}
                </h3>
                <p className="mt-2 text-muted-foreground">
                  {principle.description}
                </p>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
