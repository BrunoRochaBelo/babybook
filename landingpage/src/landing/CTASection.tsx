import { Button } from "../ui/button";
import { Clock, Sparkles } from "lucide-react";

interface CTASectionProps {
  onGetStarted: () => void;
}

export function CTASection({ onGetStarted }: CTASectionProps) {
  return (
    <section className="bg-gradient-to-r from-primary to-primary/80 px-4 py-20 text-white">
      <div className="mx-auto max-w-5xl text-center space-y-6">
        <Sparkles className="mx-auto h-12 w-12 text-white/80" />
        <h2 className="font-serif text-4xl">
          Seu bebe tera apenas um primeiro ano. Garanta o registro guiado.
        </h2>
        <p className="text-lg text-white/80">
          Em cinco minutos por ritual voce preenche os 60+ roteiros,
          convida a familia e sela o legado com uma capsula do tempo. O modelo
          financeiro e tecnico ja esta pronto para manter tudo vivo por 20 anos.
        </p>
        <Button
          onClick={onGetStarted}
          size="lg"
          variant="secondary"
          className="mx-auto h-14 rounded-2xl px-10 font-semibold text-primary shadow-lg hover:shadow-xl"
        >
          Garantir meu Acesso Perpetuo - R$ 200
        </Button>
        <div className="rounded-3xl border border-white/20 bg-white/10 p-6 text-left">
          <p className="text-sm uppercase tracking-[0.4em] text-white/70">
            Incluso no valor
          </p>
          <div className="mt-4 grid gap-4 text-sm text-white/80 sm:grid-cols-3">
            <div>
              <span className="font-semibold text-white">Curadoria completa</span>
              <p>HUD com 60 momentos + 5 entradas para recorrencias.</p>
            </div>
            <div>
              <span className="font-semibold text-white">Export garantido</span>
              <p>ZIP, PoD e capsula do tempo sempre habilitados.</p>
            </div>
            <div>
              <span className="font-semibold text-white">Garantia financeira</span>
              <p>Provisionamento de 20 anos documentado em Visao & Viabilidade.</p>
            </div>
          </div>
        </div>
        <div className="flex items-center justify-center gap-3 text-sm text-white/80">
          <Clock className="h-5 w-5" />
          <span>Meta publica: 30% das familias chegam ao capitulo "Primeiro aniversario". Vamos juntos?</span>
        </div>
      </div>
    </section>
  );
}
