export function SolutionSection() {
  return (
    <section className="py-20 bg-gradient-to-br from-primary/5 via-muted/20 to-accent/5 px-4">
      <div className="container mx-auto text-center max-w-3xl">
        <h2 className="text-3xl md:text-4xl font-semibold leading-tight text-foreground">
          Um lugar seguro para suas memórias
        </h2>
        <p className="max-w-2xl mx-auto mt-6 text-lg text-muted-foreground leading-relaxed">
          Organize, proteja e compartilhe os momentos mais importantes da sua
          família. Simples, bonito e feito com carinho.
        </p>
        <div className="max-w-xl mx-auto mt-12">
          <div className="p-8 bg-background/60 rounded-2xl border border-border/50 backdrop-blur-sm shadow-lg hover:shadow-xl transition-all duration-300 relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            <p className="text-lg text-foreground/80 leading-relaxed italic relative z-10">
              "Um dia, seu filho vai perguntar como foi o começo. Você terá
              todas as respostas guardadas com amor."
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
