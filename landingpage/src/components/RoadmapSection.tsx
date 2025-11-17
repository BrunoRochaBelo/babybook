import { motion } from "motion/react";
import { BookImage, Mail, Package } from "lucide-react";

const futureFeatures = [
  {
    icon: BookImage,
    title: "Fotolivro impresso",
    description: "A partir da sua Jornada",
    status: "Em breve",
  },
  {
    icon: Mail,
    title: "Cápsulas do tempo",
    description: "Com cartas para o futuro",
    status: "Em breve",
  },
  {
    icon: Package,
    title: "Novos pacotes de capítulos",
    description: "Conforme seu filho cresce",
    status: "Em breve",
  },
];

export function RoadmapSection() {
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
          <h2 className="mb-6">Uma plataforma que cresce com vocês.</h2>
          <p className="text-muted-foreground max-w-3xl mx-auto">
            O acesso vitalício garante o app para sempre. No futuro, você poderá (opcionalmente) transformar sua história em novos produtos:
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {futureFeatures.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.2 }}
              viewport={{ once: true }}
              className="bg-white p-6 md:p-8 rounded-xl border border-gray-200 text-center relative overflow-hidden"
            >
              {/* Status Badge */}
              <div className="absolute top-4 right-4">
                <span className="text-xs px-3 py-1 bg-blue-100 text-blue-700 rounded-full">
                  {feature.status}
                </span>
              </div>

              <feature.icon className="w-12 h-12 text-[#D97757] mx-auto mb-4" />
              <h3 className="mb-2 text-lg">{feature.title}</h3>
              <p className="text-sm text-muted-foreground">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}