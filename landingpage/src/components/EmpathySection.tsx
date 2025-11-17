import { motion } from "motion/react";
import { Target, ClipboardCheck, Clock } from "lucide-react";

const features = [
  {
    icon: Target,
    title: "Foco no que importa",
    description:
      "Interface limpa para você não perder tempo caçando botões.",
  },
  {
    icon: ClipboardCheck,
    title: "Sem 'dever de casa'",
    description:
      "Momentos guiados para você só preencher, sem pensar na estrutura.",
  },
  {
    icon: Clock,
    title: "Respeito ao seu tempo",
    description:
      "Sem notificações de 'você está atrasado' ou metas diárias.",
  },
];

export function EmpathySection() {
  return (
    <section className="py-32 bg-[#FFFCF9]">
      <div className="container mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="mb-6">Feito para pais da vida real.</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            O Baby Book foi desenhado para o ritmo intenso dos primeiros anos.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-8 mb-12">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.2 }}
              viewport={{ once: true }}
              whileHover={{ y: -8 }}
              className="bg-white p-6 md:p-8 rounded-xl shadow-sm border border-gray-100 transition-shadow hover:shadow-lg"
            >
              <feature.icon className="w-10 h-10 md:w-12 md:h-12 text-[#D97757] mb-4" />
              <h3 className="mb-3 text-lg md:text-xl">{feature.title}</h3>
              <p className="text-sm text-muted-foreground">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          viewport={{ once: true }}
          className="text-center"
        >
          <p className="text-muted-foreground max-w-3xl mx-auto">
            Alguns minutos por momento constroem uma herança que a família vai valorizar para sempre.
          </p>
        </motion.div>
      </div>
    </section>
  );
}