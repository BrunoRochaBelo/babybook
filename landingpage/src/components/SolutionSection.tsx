import { motion, useScroll, useTransform } from "motion/react";
import { useRef, useState, useEffect } from "react";
import { Book, BookOpen, Sparkles, FileText, Activity } from "lucide-react";
import { ImageWithFallback } from "./figma/ImageWithFallback";
import { SolutionSectionMobile } from "./SolutionSectionMobile";

const chaosPhotos = [
  "https://images.unsplash.com/photo-1722173205783-d602329f0743?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400",
  "https://images.unsplash.com/photo-1632679760635-55966a6e3d42?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400",
  "https://images.unsplash.com/photo-1714895350994-36db222ac84a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400",
  "https://images.unsplash.com/photo-1638772721920-6d9f727b0766?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400",
  "https://images.unsplash.com/photo-1618480632877-4cceb31ffe6d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400",
  "https://images.unsplash.com/photo-1759563871375-d5b140f6646e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400",
];

const steps = [
  {
    number: "1",
    title: "Os Livros",
    subtitle: "A Visão Geral",
    description:
      'Uma estrutura pensada para poupar seu tempo. Você não precisa pensar "por onde começo?". Nós já fizemos o trabalho pesado. A estrutura está pronta, separada em 4 "Livros" para você apenas preencher com afeto:',
    items: [
      "Jornada: O livro da história afetiva, das grandes conquistas e do dia a dia.",
      "Saúde: O livro prático e privado (vacinas, consultas, crescimento).",
      "Visitas: O livro de recados carinhosos da família e amigos.",
      "Cofre: O lugar seguro para documentos (certidão, exames).",
    ],
    mockupType: "books",
  },
  {
    number: "2",
    title: "Os Capítulos",
    subtitle: "O Foco na Jornada",
    description:
      "Dentro do livro Jornada, a história é contada em Capítulos. Eles já vêm prontos, servindo como guias para os marcos mais importantes:",
    items: [
      'Capítulo "A Descoberta"',
      'Capítulo "Chegamos em Casa"',
      'Capítulo "Primeiro Banho"',
      'Capítulo "Primeiros Passos"',
      "E mais 40+ momentos guiados...",
    ],
    mockupType: "chapters",
  },
  {
    number: "3",
    title: "Os Momentos",
    subtitle: "O Recheio",
    description:
      "E o que vai dentro de um capítulo? Um Momento. É aqui que a nossa curadoria brilha. Em vez de permitir 100 fotos iguais, cada Momento tem espaço limitado de propósito:",
    items: [
      "Algumas fotos (as melhores)",
      "Um vídeo curto (o essencial)",
      "Um áudio (a risada ou o 'mamãe')",
      "Um pequeno relato (a história por trás)",
    ],
    conclusion:
      "Isso guia você a escolher o que realmente importa, criando uma história emocionante, em vez de um novo depósito.",
    mockupType: "moments",
  },
  {
    number: "4",
    title: "O Prático",
    subtitle: "Contínuo",
    description:
      "Já os livros práticos, como Saúde ou Cofre, são listas contínuas. Você apenas adiciona os registros, um após o outro.",
    items: [],
    mockupType: "health",
  },
];

export function SolutionSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const painRef = useRef<HTMLDivElement>(null);
  const [activeStep, setActiveStep] = useState(0);

  const { scrollYProgress: painScrollProgress } = useScroll({
    target: painRef,
    offset: ["start end", "end start"],
  });

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end end"],
  });

  // Animation values for organizing photos
  const organizationProgress = useTransform(
    painScrollProgress,
    [0.2, 0.8],
    [0, 1],
  );

  useEffect(() => {
    const unsubscribe = scrollYProgress.on("change", (latest) => {
      const stepIndex = Math.min(
        Math.floor(latest * steps.length * 1.5),
        steps.length - 1,
      );
      setActiveStep(stepIndex);
    });

    return () => unsubscribe();
  }, [scrollYProgress]);

  return (
    <section ref={sectionRef} className="bg-white">
      {/* Header */}
      <div id="como-funciona" className="container mx-auto px-6 pt-32 pb-16">
        <h2 className="text-center max-w-3xl mx-auto">
          Do caos à história: como o Baby Book funciona.
        </h2>
      </div>

      {/* Pain Section */}
      <div ref={painRef} className="py-20 bg-gray-50">
        <div className="container mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            {/* Left Column - Text */}
            <div>
              <p className="mb-6 text-muted-foreground text-lg">
                Vamos ser honestos: a nuvem guarda tudo, mas não organiza nada.
                O rolo da câmera vira um caos de prints, fotos repetidas e
                vídeos que você nunca mais acha.
              </p>
              <p className="text-lg">
                O Baby Book resolve isso. Em vez de um depósito infinito, você
                tem um álbum vivo, com uma estrutura pronta separada em 4
                "Livros" para você apenas preencher com afeto:
              </p>
            </div>

            {/* Right Column - Animated Photo Grid */}
            <div className="relative h-[600px]">
              <div className="absolute inset-0 flex items-center justify-center">
                {chaosPhotos.map((photo, index) => {
                  // Calculate initial chaotic positions
                  const initialX = (index % 3) * 120 - 120;
                  const initialY = Math.floor(index / 3) * 150 - 150;
                  const initialRotate = Math.random() * 30 - 15;

                  return (
                    <motion.div
                      key={index}
                      className="absolute w-40 h-40 rounded-lg overflow-hidden shadow-lg"
                      style={{
                        x: useTransform(
                          organizationProgress,
                          [0, 1],
                          [initialX, 0],
                        ),
                        y: useTransform(
                          organizationProgress,
                          [0, 1],
                          [initialY, index * -10],
                        ),
                        rotate: useTransform(
                          organizationProgress,
                          [0, 1],
                          [initialRotate, 0],
                        ),
                        scale: useTransform(
                          organizationProgress,
                          [0, 1],
                          [0.9, index === 0 ? 1.2 : 0.3],
                        ),
                        opacity: useTransform(
                          organizationProgress,
                          [0, 1],
                          [0.9, index === 0 ? 1 : 0.4],
                        ),
                        zIndex: index === 0 ? 10 : 1,
                      }}
                    >
                      <ImageWithFallback
                        src={photo}
                        alt={`Memory ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </motion.div>
                  );
                })}
              </div>

              {/* Organized label that fades in */}
              <motion.div
                className="absolute bottom-0 left-1/2 -translate-x-1/2 bg-[#D97757] text-white px-6 py-3 rounded-full"
                style={{
                  opacity: useTransform(organizationProgress, [0.7, 1], [0, 1]),
                }}
              >
                <p className="text-sm">✨ Organizado e limpo</p>
              </motion.div>
            </div>
          </div>
        </div>
      </div>

      {/* Sticky Scroll Container */}
      <div
        id="como-funciona"
        className="relative bg-[#FFFCF9]"
        style={{ minHeight: `${steps.length * 100}vh` }}
      >
        {/* Desktop: Sticky Scroller */}
        <div className="hidden lg:block sticky top-0 h-screen">
          <div className="h-screen flex items-center">
            <div className="container mx-auto px-6">
              <div className="grid lg:grid-cols-2 gap-16 items-center">
                {/* Left Column - Text Content */}
                <div>
                  {steps.map((step, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0 }}
                      animate={{
                        opacity: activeStep === index ? 1 : 0,
                        y: activeStep === index ? 0 : 20,
                      }}
                      transition={{ duration: 0.5 }}
                      className={activeStep === index ? "block" : "hidden"}
                    >
                      <div className="flex items-center gap-4 mb-4">
                        <div className="w-12 h-12 rounded-full bg-[#D97757] text-white flex items-center justify-center">
                          {step.number}
                        </div>
                        <div>
                          <h3>{step.title}</h3>
                          <p className="text-sm text-muted-foreground">
                            {step.subtitle}
                          </p>
                        </div>
                      </div>

                      <p className="mb-6 text-muted-foreground">
                        {step.description}
                      </p>

                      {step.items.length > 0 && (
                        <ul className="space-y-3 mb-6">
                          {step.items.map((item, itemIndex) => (
                            <motion.li
                              key={itemIndex}
                              initial={{ opacity: 0, x: -20 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: itemIndex * 0.1 }}
                              className="flex items-start gap-3"
                            >
                              <span className="text-[#D97757] mt-1">•</span>
                              <span>{item}</span>
                            </motion.li>
                          ))}
                        </ul>
                      )}

                      {step.conclusion && (
                        <p className="text-muted-foreground italic">
                          {step.conclusion}
                        </p>
                      )}
                    </motion.div>
                  ))}
                </div>

                {/* Right Column - Mockup */}
                <div className="relative h-[600px] flex items-center justify-center">
                  <div className="relative w-full max-w-md">
                    {/* Books View */}
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{
                        opacity: activeStep === 0 ? 1 : 0,
                        scale: activeStep === 0 ? 1 : 0.9,
                      }}
                      transition={{ duration: 0.5 }}
                      className={`absolute inset-0 ${activeStep === 0 ? "pointer-events-auto" : "pointer-events-none"}`}
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
                            className="bg-white p-8 rounded-2xl shadow-xl border border-gray-100 flex flex-col items-center justify-center aspect-square"
                          >
                            <book.icon className="w-12 h-12 text-[#D97757] mb-4" />
                            <p className="text-center">{book.name}</p>
                          </div>
                        ))}
                      </div>
                    </motion.div>

                    {/* Chapters View */}
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{
                        opacity: activeStep === 1 ? 1 : 0,
                        scale: activeStep === 1 ? 1 : 0.9,
                      }}
                      transition={{ duration: 0.5 }}
                      className={`absolute inset-0 ${activeStep === 1 ? "pointer-events-auto" : "pointer-events-none"}`}
                    >
                      <div className="bg-white p-8 rounded-2xl shadow-xl border border-gray-100 h-full">
                        <h3 className="mb-6 text-xl">Livro: Jornada</h3>
                        <div className="space-y-4">
                          {[
                            "A Descoberta",
                            "Chegamos em Casa",
                            "Primeiro Banho",
                            "Primeiros Passos",
                          ].map((chapter, index) => (
                            <div
                              key={index}
                              className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg"
                            >
                              <BookOpen className="w-6 h-6 text-[#D97757]" />
                              <p className="text-sm">{chapter}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    </motion.div>

                    {/* Moments View */}
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{
                        opacity: activeStep === 2 ? 1 : 0,
                        scale: activeStep === 2 ? 1 : 0.9,
                      }}
                      transition={{ duration: 0.5 }}
                      className={`absolute inset-0 ${activeStep === 2 ? "pointer-events-auto" : "pointer-events-none"}`}
                    >
                      <div className="bg-white p-8 rounded-2xl shadow-xl border border-gray-100 h-full overflow-y-auto">
                        <h3 className="mb-4 text-xl">Primeiro Banho</h3>
                        <div className="space-y-4">
                          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                            <Sparkles className="w-8 h-8 text-[#D97757] mx-auto mb-2" />
                            <p className="text-sm text-muted-foreground">
                              Adicione fotos
                            </p>
                          </div>
                          <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                            <p className="text-sm text-muted-foreground">
                              Adicione um vídeo
                            </p>
                          </div>
                          <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                            <p className="text-sm text-muted-foreground">
                              Adicione um áudio
                            </p>
                          </div>
                          <textarea
                            placeholder="Escreva a história deste momento..."
                            className="w-full border border-gray-300 rounded-lg p-3 text-sm resize-none"
                            rows={3}
                            readOnly
                          />
                        </div>
                      </div>
                    </motion.div>

                    {/* Health/Cofre View */}
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{
                        opacity: activeStep === 3 ? 1 : 0,
                        scale: activeStep === 3 ? 1 : 0.9,
                      }}
                      transition={{ duration: 0.5 }}
                      className={`absolute inset-0 ${activeStep === 3 ? "pointer-events-auto" : "pointer-events-none"}`}
                    >
                      <div className="bg-white p-8 rounded-2xl shadow-xl border border-gray-100 h-full">
                        <h3 className="mb-6 text-xl">Livro: Saúde</h3>
                        <div className="space-y-3">
                          {[
                            { title: "Consulta Pediatra", date: "15/03/2025" },
                            { title: "Vacina BCG", date: "10/03/2025" },
                            { title: "Vacina Hepatite B", date: "10/03/2025" },
                            { title: "Consulta Pré-natal", date: "01/03/2025" },
                          ].map((item, index) => (
                            <div
                              key={index}
                              className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                            >
                              <div>
                                <p className="text-sm">{item.title}</p>
                                <p className="text-xs text-muted-foreground">
                                  {item.date}
                                </p>
                              </div>
                              <Activity className="w-5 h-5 text-[#D97757]" />
                            </div>
                          ))}
                        </div>
                      </div>
                    </motion.div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile: Scrollable Container */}
        <div className="lg:hidden">
          <SolutionSectionMobile />
        </div>
      </div>
    </section>
  );
}
