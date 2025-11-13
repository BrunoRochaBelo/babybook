import { Button } from "../ui/button";
import { Heart } from "lucide-react";
import { motion } from "motion/react";

interface HeroSectionProps {
  onGetStarted: () => void;
}

export function HeroSection({ onGetStarted }: HeroSectionProps) {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-[#FAF8F5] via-[#F5F1EC] to-[#EDE8E2] py-12 sm:py-16 md:py-20 px-4">
      <div className="max-w-6xl mx-auto">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-8 sm:mb-12"
        >
          <div className="inline-flex items-center gap-2 mb-4 sm:mb-6 text-primary">
            <Heart className="w-6 h-6 sm:w-8 sm:h-8 fill-current" />
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-7xl mb-4 sm:mb-6 text-foreground px-4">
            O cofre digital do seu bebê,<br className="hidden sm:inline" /> para sempre
          </h1>
          <p className="text-base sm:text-lg md:text-xl lg:text-2xl text-muted-foreground max-w-2xl mx-auto mb-6 sm:mb-8 px-4">
            Guarde vídeos, áudios e fotos sem culpa. Um santuário seguro para as memórias mais preciosas.
          </p>
          <Button 
            onClick={onGetStarted}
            size="lg" 
            className="h-12 sm:h-14 px-6 sm:px-8 rounded-2xl bg-primary hover:bg-primary/90 transition-smooth shadow-lg hover:shadow-xl text-sm sm:text-base w-full sm:w-auto mx-4 sm:mx-0"
          >
            <span className="hidden sm:inline">Criar meu Cofre — Pagamento Único R$ 199,00</span>
            <span className="sm:hidden">Criar meu Cofre — R$ 199,00</span>
          </Button>
          <p className="text-xs sm:text-sm text-muted-foreground mt-3 sm:mt-4 px-4">
            Acesso vitalício • 5 anos de armazenamento incluído
          </p>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="relative max-w-4xl mx-auto"
        >
          <div className="aspect-[16/10] rounded-3xl overflow-hidden shadow-2xl border border-border">
            <img 
              src="https://images.unsplash.com/photo-1761891950459-bc48f5bf026d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzbGVlcGluZyUyMGJhYnklMjBwZWFjZWZ1bHxlbnwxfHx8fDE3NjIyMzk4NTh8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral"
              alt="Cofre de Memórias Digital"
              className="w-full h-full object-cover"
            />
          </div>
        </motion.div>
      </div>
    </section>
  );
}
