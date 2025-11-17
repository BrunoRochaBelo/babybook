import { motion } from "motion/react";
import { Lock, UserCheck, Link as LinkIcon, Shield } from "lucide-react";

const features = [
  {
    icon: Lock,
    text: "Crie o Livro de Visitas para que a família deixe recados (você aprova).",
  },
  {
    icon: LinkIcon,
    text: "Compartilhe capítulos específicos por links privados.",
  },
  {
    icon: UserCheck,
    text: 'Convide "guardiões" para participar de perto da jornada.',
  },
  {
    icon: Shield,
    text: "Você sempre decide quem vê o quê.",
  },
];

export function PrivacySection() {
  return (
    <section className="py-32 bg-white">
      <div className="container mx-auto px-6">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Left Column - Text */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <h2 className="mb-6">Para a família, com privacidade total.</h2>
            <p className="mb-8 text-muted-foreground">
              Chame os avós, padrinhos e a família para acompanhar e deixar
              recados carinhosos no Livro de Visitas. Tudo 100% privado, sem a
              exposição (e os palpites) de uma rede social.
            </p>

            <div className="space-y-4">
              {features.map((feature, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  viewport={{ once: true }}
                  className="flex items-start gap-4"
                >
                  <div className="w-10 h-10 rounded-full bg-[#D97757]/10 flex items-center justify-center flex-shrink-0">
                    <feature.icon className="w-5 h-5 text-[#D97757]" />
                  </div>
                  <p className="text-sm pt-2">{feature.text}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Right Column - Visual Mockup */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="bg-gradient-to-br from-gray-50 to-gray-100 p-8 rounded-2xl"
          >
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-full bg-[#D97757]/10 flex items-center justify-center">
                  <Lock className="w-5 h-5 text-[#D97757]" />
                </div>
                <h3 className="text-lg">Livro de Visitas</h3>
              </div>

              <div className="space-y-4">
                {/* Mock visitor message */}
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-8 h-8 rounded-full bg-[#D97757] text-white flex items-center justify-center text-xs">
                      VV
                    </div>
                    <div>
                      <p className="text-xs">Vovó Vitória</p>
                      <p className="text-xs text-muted-foreground">2 dias atrás</p>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    "Que momento especial! Mal posso esperar para ver mais
                    fotos do meu netinho. ❤️"
                  </p>
                  <div className="mt-3 flex gap-2">
                    <button className="text-xs px-3 py-1 bg-green-500 text-white rounded">
                      Aprovar
                    </button>
                    <button className="text-xs px-3 py-1 bg-gray-300 rounded">
                      Revisar
                    </button>
                  </div>
                </div>

                {/* Mock approved message */}
                <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-8 h-8 rounded-full bg-[#D97757] text-white flex items-center justify-center text-xs">
                      TL
                    </div>
                    <div>
                      <p className="text-xs">Tio Lucas</p>
                      <p className="text-xs text-muted-foreground">5 dias atrás</p>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    "Parabéns pelo novo membro da família! Lindo demais! 🎉"
                  </p>
                  <p className="text-xs text-green-600 mt-2">✓ Aprovado</p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}