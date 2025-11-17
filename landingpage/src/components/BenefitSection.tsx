import { motion, useScroll, useTransform } from "motion/react";
import { useRef } from "react";
import { Heart, Calendar, Smile } from "lucide-react";
import { ImageWithFallback } from "./figma/ImageWithFallback";

const benefits = [
  {
    icon: Heart,
    text: "Reviva a chegada em casa, o primeiro cochilo no colo, o sorriso banguela.",
  },
  {
    icon: Calendar,
    text: "Veja a evolução do bebê mês a mês, com registros curtos e cheios de significado.",
  },
  {
    icon: Smile,
    text: "Sinta a emoção de cada momento, organizado e pronto para ser revivido.",
  },
];

export function BenefitSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end start"],
  });

  // Parallax effect for background (disabled on mobile)
  const y = useTransform(scrollYProgress, [0, 1], ["0%", "20%"]);

  return (
    <section ref={sectionRef} className="relative min-h-screen flex items-center overflow-hidden">
      {/* Parallax Background (desktop only) */}
      <motion.div
        className="absolute inset-0 z-0 hidden md:block"
        style={{ y }}
      >
        <ImageWithFallback
          src="https://images.unsplash.com/photo-1618480632877-4cceb31ffe6d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwYXJlbnQlMjBsb29raW5nJTIwYmFieSUyMGJvb2t8ZW58MXx8fHwxNzYzMzU1MzMyfDA&ixlib=rb-4.1.0&q=80&w=1080"
          alt="Parent looking at memories"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/50 to-black/60" />
      </motion.div>

      {/* Static Background (mobile only) */}
      <div className="absolute inset-0 z-0 md:hidden">
        <ImageWithFallback
          src="https://images.unsplash.com/photo-1618480632877-4cceb31ffe6d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwYXJlbnQlMjBsb29raW5nJTIwYmFieSUyMGJvb2t8ZW58MXx8fHwxNzYzMzU1MzMyfDA&ixlib=rb-4.1.0&q=80&w=1080"
          alt="Parent looking at memories"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/50 to-black/60" />
      </div>

      {/* Content */}
      <div className="relative z-10 container mx-auto px-6 py-32">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <h2 className="text-white mb-8">
              O prazer de reviver a história, não de caçar arquivos.
            </h2>
            <p className="text-white/90 text-xl mb-16 max-w-3xl mx-auto">
              Em vez de "lembranças de 5 anos atrás" aleatórias, o Baby Book organiza a jornada em capítulos. Você vê a evolução do bebê mês a mês, com registros curtos e cheios de significado, prontos para virar um fotolivro no futuro.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {benefits.map((benefit, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.2 }}
                viewport={{ once: true }}
                className="bg-white/95 backdrop-blur-sm p-6 md:p-8 rounded-lg"
              >
                <benefit.icon className="w-10 h-10 md:w-12 md:h-12 text-[#D97757] mb-4 mx-auto" />
                <p className="text-sm">{benefit.text}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}