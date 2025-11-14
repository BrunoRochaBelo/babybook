import { Button } from "../ui/button";
import { Check } from "lucide-react";

interface PricingSectionProps {
  onGetStarted: () => void;
}

const includedFeatures = [
  "Jornada Guiada do primeiro ano",
  "Álbum digital organizado",
  "Cofre de Saúde privado",
  "Convites para a família",
  "Livro de Visitas",
  "Cápsulas do Tempo",
  "Backup e exportação",
  "Imprima como livro físico",
];

export function PricingSection({ onGetStarted }: PricingSectionProps) {
  return (
    <section
      id="pricing"
      className="py-20 bg-gradient-to-tr from-muted/25 via-primary/5 to-background px-4"
    >
      <div className="container max-w-2xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-semibold leading-tight text-foreground">
            Preço simples e justo
          </h2>
          <p className="mt-4 text-base text-muted-foreground">
            Pague uma vez. Acesso para sempre.
          </p>
        </div>

        <div className="mt-12">
          <div className="p-8 border border-border/50 rounded-2xl bg-background shadow-lg hover:shadow-2xl transition-all duration-500 hover:scale-[1.02] relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/3 via-transparent to-accent/3 opacity-0 hover:opacity-100 transition-opacity duration-700"></div>
            <div className="text-center mb-8 relative z-10">
              <div className="flex items-baseline justify-center gap-2">
                <span className="text-5xl font-bold text-foreground">
                  R$ 200
                </span>
                <span className="text-base text-muted-foreground">
                  pagamento único
                </span>
              </div>
              <p className="mt-2 text-sm text-muted-foreground">
                Sem mensalidades ou taxas escondidas
              </p>
            </div>

            <ul className="space-y-3 mb-8">
              {includedFeatures.map((feature) => (
                <li key={feature} className="flex items-center gap-3">
                  <Check className="flex-shrink-0 w-4 h-4 text-primary/60" />
                  <span className="text-sm text-foreground">{feature}</span>
                </li>
              ))}
            </ul>

            <Button size="lg" className="w-full" onClick={onGetStarted}>
              Começar gratuitamente
            </Button>
            <p className="text-center text-xs text-muted-foreground mt-3">
              Experimente antes de decidir
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
