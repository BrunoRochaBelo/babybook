import { motion } from "motion/react";
import { Book, BookOpen, Sparkles, FileText, Activity } from "lucide-react";

const steps = [
  {
    number: "1",
    title: "Os Livros",
    subtitle: "Os 4 pilares da memória",
    description:
      'Uma estrutura pensada para poupar seu tempo. Você não precisa pensar "por onde começo?". Nós já fizemos o trabalho pesado. A estrutura está pronta, separada em 4 "Livros" para você apenas preencher com afeto:',
    items: [
      "Jornada: O livro da história afetiva, das grandes conquistas e do dia a dia.",
      "Saúde: O livro prático e privado (vacinas, consultas, crescimento).",
      "Visitas: O livro de recados carinhosos da família e amigos.",
      "Cofre: O lugar seguro para documentos (certidão, exames).",
    ],
  },
  {
    number: "2",
    title: "Os Capítulos",
    subtitle: "Onde a Jornada acontece",
    description:
      "Dentro do livro Jornada, a história é contada em Capítulos. Eles já vêm prontos, servindo como guias para os marcos mais importantes:",
    items: [
      'Capítulo "A Descoberta"',
      'Capítulo "Chegamos em Casa"',
      'Capítulo "Primeiro Banho"',
      'Capítulo "Primeiros Passos"',
      "E mais 40+ momentos guiados...",
    ],
  },
  {
    number: "3",
    title: "Os Momentos",
    subtitle: 'A nossa "curadoria saudável"',
    description:
      "E o que vai dentro de um capítulo? Um Momento. É aqui que a nossa curadoria brilha. Em vez de permitir 100 fotos iguais, cada Momento tem espaço limitado de propósito:",
    items: [
      "Algumas fotos (as melhores)",
      "Um vídeo curto (o essencial)",
      "Um áudio (a risada ou o 'mamãe')",
      "Um pequeno relato (a história por trás)",
    ],
    conclusion: "Isso guia você a escolher o que realmente importa, criando uma história emocionante, em vez de um novo depósito.",
  },
  {
    number: "4",
    title: "O Prático",
    subtitle: "Contínuo",
    description:
      "Já os livros práticos, como Saúde ou Cofre, são listas contínuas. Você apenas adiciona os registros, um após o outro.",
    items: [],
  },
];

export function SolutionSectionMobile() {
  return (
    <div className="lg:hidden py-20 space-y-16">
      {/* Step 1: Books */}
      <div className="container mx-auto px-6 space-y-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="w-full max-w-md mx-auto"
        >
          <div className="grid grid-cols-2 gap-4">
            {[
              { name: "Jornada", icon: Book },
              { name: "Saúde", icon: Activity },
              { name: "Visitas", icon: BookOpen },
              { name: "Cofre", icon: FileText },
            ].map((book, index) => (
              <div
                key={index}
                className="bg-white p-6 rounded-2xl shadow-xl border border-gray-100 flex flex-col items-center justify-center aspect-square"
              >
                <book.icon className="w-10 h-10 text-[#D97757] mb-3" />
                <p className="text-center text-sm">{book.name}</p>
              </div>
            ))}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 rounded-full bg-[#D97757] text-white flex items-center justify-center">
              1
            </div>
            <div>
              <h3>{steps[0].title}</h3>
              <p className="text-sm text-muted-foreground">{steps[0].subtitle}</p>
            </div>
          </div>
          <p className="mb-4 text-muted-foreground">{steps[0].description}</p>
          <ul className="space-y-2">
            {steps[0].items.map((item, index) => (
              <li key={index} className="flex items-start gap-3">
                <span className="text-[#D97757] mt-1">•</span>
                <span className="text-sm">{item}</span>
              </li>
            ))}
          </ul>
        </motion.div>
      </div>

      {/* Step 2: Chapters */}
      <div className="container mx-auto px-6 space-y-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="w-full max-w-md mx-auto"
        >
          <div className="bg-white p-6 rounded-2xl shadow-xl border border-gray-100">
            <h3 className="mb-4 text-lg">Livro: Jornada</h3>
            <div className="space-y-3">
              {["A Descoberta", "Chegamos em Casa", "Primeiro Banho", "Primeiros Passos"].map(
                (chapter, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg"
                  >
                    <BookOpen className="w-5 h-5 text-[#D97757]" />
                    <p className="text-sm">{chapter}</p>
                  </div>
                )
              )}
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 rounded-full bg-[#D97757] text-white flex items-center justify-center">
              2
            </div>
            <div>
              <h3>{steps[1].title}</h3>
              <p className="text-sm text-muted-foreground">{steps[1].subtitle}</p>
            </div>
          </div>
          <p className="mb-4 text-muted-foreground">{steps[1].description}</p>
          <ul className="space-y-2">
            {steps[1].items.map((item, index) => (
              <li key={index} className="flex items-start gap-3">
                <span className="text-[#D97757] mt-1">•</span>
                <span className="text-sm">{item}</span>
              </li>
            ))}
          </ul>
        </motion.div>
      </div>

      {/* Step 3: Moments */}
      <div className="container mx-auto px-6 space-y-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="w-full max-w-md mx-auto"
        >
          <div className="bg-white p-6 rounded-2xl shadow-xl border border-gray-100">
            <h3 className="mb-4 text-lg">Primeiro Banho</h3>
            <div className="space-y-3">
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                <Sparkles className="w-6 h-6 text-[#D97757] mx-auto mb-2" />
                <p className="text-xs text-muted-foreground">Adicione fotos</p>
              </div>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-3 text-center">
                <p className="text-xs text-muted-foreground">Adicione um vídeo</p>
              </div>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-3 text-center">
                <p className="text-xs text-muted-foreground">Adicione um áudio</p>
              </div>
              <textarea
                placeholder="Escreva a história deste momento..."
                className="w-full border border-gray-300 rounded-lg p-2 text-xs resize-none"
                rows={2}
                readOnly
              />
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 rounded-full bg-[#D97757] text-white flex items-center justify-center">
              3
            </div>
            <div>
              <h3>{steps[2].title}</h3>
              <p className="text-sm text-muted-foreground">{steps[2].subtitle}</p>
            </div>
          </div>
          <p className="mb-4 text-muted-foreground">{steps[2].description}</p>
          <ul className="space-y-2 mb-4">
            {steps[2].items.map((item, index) => (
              <li key={index} className="flex items-start gap-3">
                <span className="text-[#D97757] mt-1">•</span>
                <span className="text-sm">{item}</span>
              </li>
            ))}
          </ul>
          {steps[2].conclusion && (
            <p className="text-sm text-muted-foreground italic">{steps[2].conclusion}</p>
          )}
        </motion.div>
      </div>

      {/* Step 4: Health */}
      <div className="container mx-auto px-6 space-y-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="w-full max-w-md mx-auto"
        >
          <div className="bg-white p-6 rounded-2xl shadow-xl border border-gray-100">
            <h3 className="mb-4 text-lg">Livro: Saúde</h3>
            <div className="space-y-2">
              {[
                { title: "Consulta Pediatra", date: "15/03/2025" },
                { title: "Vacina BCG", date: "10/03/2025" },
                { title: "Vacina Hepatite B", date: "10/03/2025" },
                { title: "Consulta Pré-natal", date: "01/03/2025" },
              ].map((item, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div>
                    <p className="text-xs">{item.title}</p>
                    <p className="text-xs text-muted-foreground">{item.date}</p>
                  </div>
                  <Activity className="w-4 h-4 text-[#D97757]" />
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 rounded-full bg-[#D97757] text-white flex items-center justify-center">
              4
            </div>
            <div>
              <h3>{steps[3].title}</h3>
              <p className="text-sm text-muted-foreground">{steps[3].subtitle}</p>
            </div>
          </div>
          <p className="text-muted-foreground">{steps[3].description}</p>
        </motion.div>
      </div>
    </div>
  );
}
