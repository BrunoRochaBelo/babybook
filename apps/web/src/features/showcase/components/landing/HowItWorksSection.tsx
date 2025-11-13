import { Card } from "../ui/card";
import { BookHeart, Camera, Lock } from "lucide-react";
import { motion } from "motion/react";

const steps = [
  {
    icon: BookHeart,
    title: "Crie o Livro",
    description: "Configure o livro do seu bebê com nome, data de nascimento e personalize a experiência."
  },
  {
    icon: Camera,
    title: "Registre Momentos",
    description: "Capture vídeos, áudios e fotos organizados por capítulos: primeiras vezes, marcos, descobertas."
  },
  {
    icon: Lock,
    title: "Guarde para Sempre",
    description: "Seus dados seguros, acessíveis quando quiser. Exporte tudo ao final de 5 anos."
  }
];

export function HowItWorksSection() {
  return (
    <section className="py-20 px-4 bg-white">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-4xl text-center mb-16">Como funciona?</h2>
        <div className="grid md:grid-cols-3 gap-8">
          {steps.map((item, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              viewport={{ once: true }}
            >
              <Card className="p-8 text-center hover:shadow-lg transition-smooth border-border">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-secondary/30 mb-6">
                  <item.icon className="w-8 h-8 text-primary" />
                </div>
                <h3 className="mb-4">{item.title}</h3>
                <p className="text-muted-foreground">{item.description}</p>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
