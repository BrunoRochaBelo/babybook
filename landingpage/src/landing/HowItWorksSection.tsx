import { BookHeart, ShieldCheck, Users } from "lucide-react";

export function HowItWorksSection() {
  return (
    <section className="py-20 bg-gradient-to-t from-background via-muted/15 to-background px-4">
      <div className="container mx-auto max-w-5xl">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-semibold leading-tight text-foreground">
            Tudo organizado para você
          </h2>
          <p className="max-w-xl mx-auto mt-4 text-base text-muted-foreground">
            Cada tipo de memória tem seu lugar
          </p>
        </div>
        <div className="grid grid-cols-1 gap-6 mx-auto md:grid-cols-3">
          <div className="p-6 text-center bg-background rounded-2xl border border-border/50 shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-2 group">
            <BookHeart className="w-8 h-8 mx-auto mb-3 text-primary/60 group-hover:text-primary transition-colors duration-300 group-hover:scale-110 transform" />
            <h3 className="text-base font-medium mb-2">Livro de Memórias</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Fotos, anotações e momentos organizados em capítulos
            </p>
          </div>
          <div className="p-6 text-center bg-background rounded-2xl border border-border/50 shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-2 group">
            <ShieldCheck className="w-8 h-8 mx-auto mb-3 text-primary/60 group-hover:text-primary transition-colors duration-300 group-hover:scale-110 transform" />
            <h3 className="text-base font-medium mb-2">Cofre de Saúde</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Consultas, vacinas e documentos sempre à mão
            </p>
          </div>
          <div className="p-6 text-center bg-background rounded-2xl border border-border/50 shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-2 group">
            <Users className="w-8 h-8 mx-auto mb-3 text-primary/60 group-hover:text-primary transition-colors duration-300 group-hover:scale-110 transform" />
            <h3 className="text-base font-medium mb-2">Livro de Visitas</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Mensagens de amor da família para o futuro
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
