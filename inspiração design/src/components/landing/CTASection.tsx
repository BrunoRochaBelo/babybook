import { Button } from "../ui/button";

interface CTASectionProps {
  onGetStarted: () => void;
}

export function CTASection({ onGetStarted }: CTASectionProps) {
  return (
    <section className="py-20 px-4 bg-primary text-white">
      <div className="max-w-4xl mx-auto text-center">
        <h2 className="text-4xl mb-6 text-white">Comece hoje a preservar memórias</h2>
        <p className="text-xl mb-8 text-white/90">
          Pagamento único de R$ 199,00 • Acesso vitalício • 5 anos de armazenamento
        </p>
        <Button 
          onClick={onGetStarted}
          size="lg" 
          variant="secondary"
          className="h-14 px-8 rounded-2xl shadow-lg hover:shadow-xl transition-smooth"
        >
          Criar Meu Cofre Agora
        </Button>
      </div>
    </section>
  );
}
