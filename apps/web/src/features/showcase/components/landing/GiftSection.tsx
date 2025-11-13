import { Button } from "../ui/button";
import { Gift } from "lucide-react";

export function GiftSection() {
  return (
    <section className="py-20 px-4 bg-gradient-to-br from-accent/20 to-primary/10">
      <div className="max-w-4xl mx-auto text-center">
        <Gift className="w-16 h-16 text-primary mx-auto mb-6" />
        <h2 className="text-4xl mb-6">O presente perfeito</h2>
        <p className="text-xl text-muted-foreground mb-8">
          Vale-presente disponível para chás de bebê, aniversários e momentos especiais.
        </p>
        <Button size="lg" variant="outline" className="h-14 px-8 rounded-2xl">
          Comprar Vale-Presente
        </Button>
      </div>
    </section>
  );
}
