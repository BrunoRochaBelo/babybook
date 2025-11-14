import { Button } from "../ui/button";
import { useEffect, useState } from "react";

interface HeroSectionProps {
  onGetStarted: () => void;
}

export function NewHeroSection({ onGetStarted }: HeroSectionProps) {
  const [showSecondLine, setShowSecondLine] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setShowSecondLine(true), 1500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <section className="py-24 text-center px-4 section-visible">
      <div className="container mx-auto max-w-4xl">
        <h1 className="text-4xl md:text-5xl lg:text-6xl font-semibold tracking-tight leading-tight text-foreground">
          <span className="inline-block overflow-hidden border-r-4 border-primary pr-1 typewriter-line-1">
            Cada momento importa.
          </span>
          <br />
          <span
            className={`text-muted-foreground font-light inline-block overflow-hidden transition-all duration-700 ${
              showSecondLine ? "opacity-100 typewriter-line-2" : "opacity-0"
            }`}
            style={{
              borderRight: showSecondLine ? "4px solid var(--primary)" : "none",
              paddingRight: showSecondLine ? "4px" : "0",
            }}
          >
            Merece ser guardado com amor.
          </span>
        </h1>
        <p className="max-w-2xl mx-auto mt-8 text-lg text-muted-foreground leading-relaxed">
          Transforme memórias em legado. Um lugar seguro e organizado para todas
          as histórias que você quer guardar para sempre.
        </p>
        <div className="mt-12 flex flex-col items-center gap-4">
          <Button size="lg" onClick={onGetStarted} className="px-8">
            Começar gratuitamente
          </Button>
          <p className="text-sm text-muted-foreground">Sem cartão de crédito</p>
        </div>
        <div className="mt-20">
          <img
            src="/screenshot-mobile.png"
            alt="Baby Book app screenshot"
            className="max-w-xs mx-auto rounded-2xl shadow-2xl transform hover:scale-105 transition-transform duration-500"
            style={{ boxShadow: "0 20px 60px rgba(0,0,0,0.15)" }}
          />
        </div>
      </div>
    </section>
  );
}
