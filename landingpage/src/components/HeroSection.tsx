import { motion } from "motion/react";
import { CheckSquare, Lock, Zap, Gift, BadgeCheck } from "lucide-react";
import { Button } from "./ui/button";
import { ImageWithFallback } from "./figma/ImageWithFallback";

const highlights = [
  {
    icon: CheckSquare,
    title: "Curadoria Guiada",
    description: "Capítulos prontos, da descoberta aos primeiros passos.",
  },
  {
    icon: Lock,
    title: "100% Privado",
    description: "Seu álbum, suas regras. Sem feeds ou comparações.",
  },
  {
    icon: Zap,
    title: "Feito para a Vida Real",
    description: "Rápido, intuitivo e direto ao ponto.",
  },
  {
    icon: Gift,
    title: "O Presente que Vira Herança",
    description: "Um gesto de carinho que dura a vida inteira.",
  },
  {
    icon: BadgeCheck,
    title: "Selo de Confiança",
    description: "Preço simples e transparente: pague uma vez. Acesso para sempre.",
  },
];

export function HeroSection() {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background Image */}
      <div className="absolute inset-0 z-0">
        <ImageWithFallback
          src="https://images.unsplash.com/photo-1638772721920-6d9f727b0766?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwYXJlbnQlMjBiYWJ5JTIwaGFuZHMlMjB3cml0aW5nfGVufDF8fHx8MTc2MzM1NTMzMHww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral"
          alt="Parent and baby hands"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/30 to-black/50" />
      </div>

      {/* Content */}
      <div className="relative z-10 container mx-auto px-6 py-20">
        <div className="max-w-5xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            <h1 className="text-white mb-6">
              Tenha uma história, não apenas um arquivo.
            </h1>
            <p className="text-white/90 text-xl mb-12 max-w-3xl mx-auto">
              Transforme o caos de momentos perdidos no rolo da câmera na história real da sua família. O Baby Book é uma curadoria guiada, 100% privada e feita com afeto para pais que valorizam cada momento, mas não têm tempo a perder.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-20">
              <Button size="lg" className="bg-[#D97757] hover:bg-[#C96647] text-white px-8">
                Começar minha história
              </Button>
              <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10 px-8">
                🎁 Quero presentear uma história
              </Button>
            </div>
          </motion.div>

          {/* Highlights */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3, ease: "easeOut" }}
            className="grid grid-cols-2 lg:grid-cols-5 gap-4 lg:gap-6"
          >
            {highlights.map((highlight, index) => (
              <div
                key={index}
                className="bg-white/95 backdrop-blur-sm p-4 lg:p-6 rounded-lg"
              >
                <highlight.icon className="w-8 h-8 lg:w-10 lg:h-10 text-[#D97757] mb-3 lg:mb-4 mx-auto stroke-[1.5]" />
                <h3 className="mb-1 lg:mb-2 text-sm lg:text-lg">{highlight.title}</h3>
                <p className="text-xs lg:text-sm text-muted-foreground">
                  {highlight.description}
                </p>
              </div>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
}