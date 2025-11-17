import { motion } from "motion/react";
import { Check } from "lucide-react";
import { Button } from "./ui/button";

const features = [
  "Livro da Jornada: Com 40+ momentos guiados.",
  "Livro de Saúde: Com calendário de vacinas do SUS e consultas principais.",
  "Livro de Visitas: Com espaço para 20 recados (podendo expandir).",
  "Livro Cofre: Para documentos essenciais.",
  "Acesso vitalício: Plataforma e futuras atualizações de usabilidade.",
];

export function PricingSection() {
  return (
    <section id="preco" className="py-32 bg-white">
      <div className="container mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="mb-4">Uma única vez por uma vida inteira.</h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Sem assinatura. Sem pegadinhas. Um pagamento único pelo acesso vitalício.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          viewport={{ once: true }}
          className="max-w-2xl mx-auto"
        >
          <div className="bg-gradient-to-br from-gray-50 to-white border-2 border-[#D97757] rounded-2xl p-6 md:p-10 shadow-xl w-full mx-4 md:mx-auto">
            {/* Header */}
            <div className="text-center mb-8">
              <p className="text-sm text-muted-foreground mb-2">
                Pagamento único
              </p>
              <div className="flex items-center justify-center gap-2 mb-4">
                <span className="text-5xl">R$ 297</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Acesso Vitalício • Sem mensalidades
              </p>
            </div>

            {/* Features */}
            <div className="mb-8">
              <p className="mb-4 text-center text-sm text-muted-foreground">
                O que está incluído no acesso vitalício:
              </p>
              <ul className="space-y-3">
                {features.map((feature, index) => (
                  <motion.li
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.4, delay: index * 0.1 }}
                    viewport={{ once: true }}
                    className="flex items-start gap-3"
                  >
                    <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Check className="w-4 h-4 text-green-600" />
                    </div>
                    <span className="text-sm">{feature}</span>
                  </motion.li>
                ))}
              </ul>
            </div>

            {/* CTA */}
            <Button
              size="lg"
              className="w-full bg-[#D97757] hover:bg-[#C96647] text-white"
            >
              Garantir meu acesso vitalício
            </Button>

            <p className="text-xs text-center text-muted-foreground mt-4">
              Suas memórias são da sua família. Para sempre.
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  );
}