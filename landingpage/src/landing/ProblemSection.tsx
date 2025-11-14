import { Camera, AlertCircle } from "lucide-react";

export function ProblemSection() {
  return (
    <section className="py-20 px-4 bg-gradient-to-b from-background via-muted/10 to-background">
      <div className="container mx-auto text-center max-w-4xl">
        <h2 className="text-3xl md:text-4xl font-semibold leading-tight text-foreground">
          Você vive cada momento duas vezes
        </h2>
        <p className="max-w-2xl mx-auto mt-4 text-lg text-muted-foreground">
          Uma enquanto acontece. Outra, buscando a foto depois.
        </p>
        <div className="grid max-w-3xl grid-cols-1 gap-6 mx-auto mt-16 md:grid-cols-2">
          <div className="p-8 text-center bg-background rounded-2xl border border-border/50 shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-1">
            <Camera className="w-10 h-10 mb-4 mx-auto text-primary/60" />
            <h3 className="text-lg font-medium mb-3">
              Milhares de fotos perdidas
            </h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Aquele primeiro sorriso? Está em algum lugar entre 7.243 fotos no
              telefone.
            </p>
          </div>
          <div className="p-8 text-center bg-background rounded-2xl border border-border/50 shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-1">
            <AlertCircle className="w-10 h-10 mb-4 mx-auto text-primary/60" />
            <h3 className="text-lg font-medium mb-3">
              "Vou organizar isso um dia"
            </h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Mas esse dia nunca chega. E as memórias continuam se perdendo.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
