import { Card } from "../ui/card";
import { Video, Mic, Camera, Users, Clock, BookOpen } from "lucide-react";

const features = [
  {
    icon: Camera,
    title: "Sem Decisão Paralisante",
    description:
      "A IA sugere exatamente o que registrar. Você não fica preso olhando para 10.000 fotos inúteis.",
  },
  {
    icon: BookOpen,
    title: "Uma História, Não um Depósito",
    description:
      "Cada memória tem contexto, data e significado. Virei um livro coeso que você mostra para seu filho aos 5 anos.",
  },
  {
    icon: Users,
    title: "Família Inteira Participa",
    description:
      "Avós deixam mensagens carinhosas direto na memória. O bebê cresce cercado de amor registrado.",
  },
  {
    icon: Clock,
    title: "5 Minutos de Calma por Semana",
    description:
      "Não é uma maratona. Cada momento leva 3-5 minutos. Você se sente aliviado, nunca culpado.",
  },
];

/**
 * Highlights the core benefits (emotional + practical) of the service in a grid.
 * Each feature animates into view as it enters the viewport.
 */
export function FeaturesSection() {
  return (
    <section className="py-20 px-4 bg-gradient-to-br from-secondary/20 to-accent/20">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-4xl text-center mb-4 font-serif">
            Por que pais como você confiam em nós
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Não é só um app. É paz de espírito.
          </p>
        </div>
        <div className="grid md:grid-cols-2 gap-6">
          {features.map((item, i) => (
            <div key={i}>
              <Card className="p-6 flex items-start gap-4 hover:shadow-md transition-smooth">
                <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                  <item.icon className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h4 className="mb-2 font-serif">{item.title}</h4>
                  <p className="text-muted-foreground">{item.description}</p>
                </div>
              </Card>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
