import { motion } from "motion/react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "./ui/accordion";

const faqs = [
  {
    question:
      "Minhas memórias estão seguras a longo prazo? E se eu não usar o app por um tempo?",
    answer:
      "Sim. Seu acesso é vitalício. O produto foi pensado para sobreviver ao tempo, não para te prender em assinatura.",
  },
  {
    question: "E se um dia o Baby Book deixar de existir?",
    answer:
      "Levamos esse medo a sério. A arquitetura é pensada para que suas memórias possam ser exportadas. Nosso compromisso é que a história é sua. Você sempre terá um caminho para levá-la com você.",
  },
  {
    question: "Como funciona a privacidade? (LGPD, quem é dono dos dados)",
    answer:
      "As memórias são da sua família. Ponto. Nada é público por padrão, ninguém 'passeia' pelas suas fotos e o produto já nasce 100% alinhado à LGPD. (Haverá uma página detalhada de Política de Privacidade).",
  },
  {
    question: "Preciso ser organizado pra usar?",
    answer:
      "Não. Na verdade, é o contrário: o Baby Book existe exatamente pra quem não tem tempo nem cabeça pra organizar nada. Nós fazemos o trabalho pesado por você.",
  },
  {
    question: "Posso usar para mais de um filho?",
    answer:
      "Sim. Você pode criar um álbum para cada criança dentro da mesma conta, sem misturar as memórias.",
  },
  {
    question: "Tem limite de fotos e vídeos?",
    answer:
      "Sim, e isso é de propósito. Chamamos de 'curadoria saudável'. Cada momento tem um número pequeno de espaços para guiar você a escolher só o que realmente importa. Isso reduz a ansiedade e deixa a história mais bonita.",
  },
  {
    question: "Minha família precisa instalar o app também?",
    answer:
      "Não obrigatoriamente. Você pode compartilhar momentos por links privados. Para interagir (como no Livro de Visitas), você convida como 'guardião', mas sempre sob seu controle.",
  },
  {
    question: "Posso começar agora e ir completando aos poucos?",
    answer:
      "Sim, essa é justamente a ideia. O Baby Book funciona em pequenas doses: hoje você registra um capítulo, daqui a duas semanas registra outro. Sem pressão e no seu tempo.",
  },
];

export function FAQSection() {
  return (
    <section className="py-32 bg-white">
      <div className="container mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="mb-4">Perguntas Frequentes</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Tire suas dúvidas sobre o Baby Book
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          viewport={{ once: true }}
          className="max-w-3xl mx-auto"
        >
          <Accordion type="single" collapsible className="w-full">
            {faqs.map((faq, index) => (
              <AccordionItem key={index} value={`item-${index}`}>
                <AccordionTrigger className="text-left">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </motion.div>
      </div>
    </section>
  );
}
