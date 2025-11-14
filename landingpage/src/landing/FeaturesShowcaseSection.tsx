import { Milestone, Gift, BookLock, Printer } from "lucide-react";

const features = [
  {
    icon: Milestone,
    title: "Jornada Guiada",
    description:
      "Capítulos que te ajudam a registrar os momentos importantes sem esforço.",
  },
  {
    icon: Gift,
    title: "Cápsulas do Tempo",
    description: "Cartas e mensagens que seu filho vai abrir no futuro.",
  },
  {
    icon: BookLock,
    title: "Privado e Seguro",
    description:
      "Só quem você convidar tem acesso. Sem algoritmos, sem anúncios.",
  },
  {
    icon: Printer,
    title: "Imprima Quando Quiser",
    description: "Transforme seu álbum digital em um livro físico.",
  },
];

export function FeaturesShowcaseSection() {
  return (
    <section className="py-20 px-4 bg-gradient-radial from-accent/5 via-background to-primary/5">
      <div className="container mx-auto max-w-5xl">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-semibold leading-tight text-foreground">
            Feito para você
          </h2>
          <p className="max-w-xl mx-auto mt-4 text-base text-muted-foreground">
            Simples, seguro e pensado para o que realmente importa.
          </p>
        </div>
        <div className="grid grid-cols-1 gap-8 mx-auto sm:grid-cols-2 lg:grid-cols-4">
          {features.map((feature) => (
            <div key={feature.title} className="text-center group">
              <div className="flex items-center justify-center w-12 h-12 mx-auto mb-4 bg-primary/5 rounded-full group-hover:bg-primary/10 transition-all duration-300 group-hover:scale-110">
                <feature.icon className="w-5 h-5 text-primary/70" />
              </div>
              <h3 className="text-base font-medium mb-2">{feature.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
