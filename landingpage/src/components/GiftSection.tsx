import { motion } from "motion/react";
import { Gift } from "lucide-react";
import { Button } from "./ui/button";
import { ImageWithFallback } from "./figma/ImageWithFallback";

export function GiftSection() {
  return (
    <section id="presentear" className="py-32 bg-green-50">
      <div className="container mx-auto px-6">
        <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center max-w-6xl mx-auto">
          {/* Left Column - Image */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="relative"
          >
            <div className="relative rounded-2xl overflow-hidden shadow-2xl">
              <ImageWithFallback
                src="https://images.unsplash.com/photo-1759563871375-d5b140f6646e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxnaWZ0JTIwYm94JTIwZWxlZ2FudHxlbnwxfHx8fDE3NjMzNTUzMzF8MA&ixlib=rb-4.1.0&q=80&w=1080"
                alt="Gift box"
                className="w-full h-auto"
              />
            </div>
            {/* Decorative element */}
            <div className="absolute -top-4 -right-4 w-24 h-24 bg-[#D97757] rounded-full opacity-20 blur-2xl" />
          </motion.div>

          {/* Right Column - Text */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <div className="flex items-center gap-3 mb-6">
              <Gift className="w-10 h-10 text-[#D97757]" />
              <h2>O presente de chá de bebê que ninguém vai esquecer.</h2>
            </div>

            <p className="mb-6 text-muted-foreground text-lg">
              Procurando um presente de maternidade que fuja do óbvio?
            </p>

            <p className="mb-8">
              Em vez de mais uma roupinha que se perde em 3 meses, ofereça um
              espaço para guardar anos de memórias. É um presente que não sai de
              moda e só fica mais valioso com o tempo.
            </p>

            <Button
              size="lg"
              variant="outline"
              className="border-2 border-[#D97757] text-[#D97757] hover:bg-[#D97757] hover:text-white"
            >
              Quero dar o Baby Book de presente
            </Button>
          </motion.div>
        </div>
      </div>
    </section>
  );
}