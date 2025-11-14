import { Button } from "../ui/button";

interface FinalCTASectionProps {
  onGetStarted: () => void;
}

export function FinalCTASection({ onGetStarted }: FinalCTASectionProps) {
  return (
    <section className="py-20 bg-gradient-to-b from-primary/8 via-accent/5 to-background px-4">
      <div className="container mx-auto text-center max-w-2xl">
        <h2 className="text-3xl md:text-4xl font-semibold leading-tight text-foreground">
          Comece hoje mesmo
        </h2>
        <p className="max-w-xl mx-auto mt-6 text-base text-muted-foreground leading-relaxed">
          Os momentos passam rápido. Comece a guardar essas memórias com
          carinho, do jeito que elas merecem.
        </p>
        <div className="mt-8">
          <Button size="lg" onClick={onGetStarted}>
            Criar meu álbum
          </Button>
          <p className="text-sm text-muted-foreground mt-3">
            Grátis para começar
          </p>
        </div>
      </div>
    </section>
  );
}
