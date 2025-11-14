import { useState } from "react";
import { ChevronDown } from "lucide-react";

const faqs = [
  {
    question: "Em que o Baby Book eh diferente de Google Photos ou Instagram privado?",
    answer:
      "Nao somos um deposito. O Catalogo de Momentos entrega HUD guiado, livros tematicos, Guestbook e Capsula do Tempo. Nao existem likes, feed ou importacao em massa.",
  },
  {
    question: "Por que pagamento unico e nao assinatura?",
    answer:
      "Visao & Viabilidade mostra que nosso custo de estoque eh <= R$ 2/ano usando stack serverless. Cobrar R$ 200 no D0 cobre este custo para 20 anos e evita freemium deficitario.",
  },
  {
    question: "O que o Pacote Completo destrava?",
    answer:
      "Quando voce precisa de mais de 5 registros em momentos recorrentes (Visitas, Consultas, Galeria de Arte), o upsell de R$ 49 libera ilimitado para todas as categorias.",
  },
  {
    question: "Quem enxerga Saude, Cofre e documentos?",
    answer:
      "Somente o owner. Guardioes e visitantes so veem o que voce liberar. Usamos Row Level Security e views separadas para cada papel.",
  },
  {
    question: "Recebi um voucher. O produto eh limitado?",
    answer:
      "Nao. Parceiros ja pagaram o acesso por voce. O onboarding eh o mesmo, com HUD pronto e garantia de 20 anos.",
  },
  {
    question: "Posso exportar ou imprimir quando quiser?",
    answer:
      "Sim. ZIP completo, pedidos PoD e Capsula do Tempo sao features do plano base. O controle final sempre permanece com a familia.",
  },
];

interface FAQItemProps {
  question: string;
  answer: string;
}

function FAQItem({ question, answer }: FAQItemProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="border-b border-border last:border-none">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full items-center justify-between gap-4 px-6 py-4 text-left hover:bg-secondary/20"
      >
        <span className="text-lg font-semibold text-foreground">{question}</span>
        <ChevronDown
          className={`h-6 w-6 text-primary transition-transform ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>
      {isOpen && (
        <div className="px-6 pb-4 text-muted-foreground">{answer}</div>
      )}
    </div>
  );
}

export function FAQSection() {
  return (
    <section className="bg-gradient-to-br from-secondary/10 to-accent/10 px-4 py-20">
      <div className="mx-auto max-w-4xl space-y-10">
        <div className="text-center">
          <h2 className="font-serif text-4xl text-foreground">
            Duvidas comuns respondidas com transparencia.
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Os documentos do projeto sao publicos. Aqui estao as respostas
            resumidas para decidir com calma.
          </p>
        </div>
        <div className="overflow-hidden rounded-2xl border border-border bg-white shadow-md">
          {faqs.map((faq) => (
            <FAQItem key={faq.question} question={faq.question} answer={faq.answer} />
          ))}
        </div>
        <div className="text-center text-muted-foreground">
          Ainda ficou com duvida?{" "}
          <a
            href="mailto:contato@babybook.app"
            className="font-semibold text-primary hover:underline"
          >
            contato@babybook.app
          </a>
        </div>
      </div>
    </section>
  );
}
