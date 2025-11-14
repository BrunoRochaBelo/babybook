export function FamilySection() {
  return (
    <section className="py-20 px-4 bg-gradient-to-bl from-muted/20 via-background to-primary/5">
      <div className="container grid items-center grid-cols-1 gap-12 mx-auto max-w-5xl md:grid-cols-2">
        <div className="flex justify-center">
          <img
            src="/icon-512.png"
            alt="Family sharing illustration"
            className="w-48 h-48 md:w-56 md:h-56"
          />
        </div>
        <div className="text-left space-y-4">
          <h2 className="text-3xl md:text-4xl font-semibold leading-tight text-foreground">
            Compartilhe com quem importa
          </h2>
          <p className="text-base text-muted-foreground leading-relaxed">
            Convide avós, padrinhos e família para acompanhar e deixar mensagens
            carinhosas. Tudo privado, sem redes sociais.
          </p>
          <div className="bg-muted/30 rounded-2xl p-5 border border-border/30">
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>✓ Você escolhe quem tem acesso</li>
              <li>✓ Mensagens que ficam para sempre</li>
              <li>✓ Sem anúncios, sem algoritmos</li>
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
