import { Card } from "../ui/card";
import {
  BookMarked,
  MessageCircleHeart,
  Share2,
  Sparkles,
} from "lucide-react";

const story = [
  {
    icon: Sparkles,
    title: 'HUD sugere "Primeiro Sorriso"',
    text: "Ana recebe o convite as 22h. Em 5 minutos ela seleciona video, descreve a careta e salva.",
    quote:
      '"Eu so sigo o roteiro. Parece que tenho uma curadora sentada do meu lado."',
  },
  {
    icon: Share2,
    title: "Link privado enviado",
    text: "Ela toca em Compartilhar e escolhe apenas os avos. O link expira apos sete dias se nao for aberto.",
    quote:
      '"Sem feed, sem todo mundo vendo. Eu escolho exatamente quem participa."',
  },
  {
    icon: MessageCircleHeart,
    title: "Guestbook gera o momento aha",
    text: "Sergio abre no WhatsApp, assiste sem login e deixa um recado de voz.",
    quote:
      '"Que orgulho, campeao! Vovo te ama. Parecia que eu estava no sofa da casa deles."',
  },
  {
    icon: BookMarked,
    title: "A memoria cresce em camadas",
    text: "O comentario aparece dentro do capitulo. Ana aprova e a timeline marca mais um capitulo completo.",
    quote:
      '"O valor nao eh so a midia, eh a reacao da familia guardada para sempre."',
  },
];

export function TestimonialSection() {
  return (
    <section className="bg-gradient-to-br from-secondary/10 via-white to-accent/10 px-4 py-20">
      <div className="mx-auto max-w-6xl space-y-10">
        <div className="text-center space-y-4">
          <h2 className="font-serif text-4xl text-foreground">
            O momento aha descrito na Modelagem de Produto.
          </h2>
          <p className="text-lg text-muted-foreground">
            Quando o Guestbook entra em cena, a memoria dobra de valor. Abaixo
            esta o fluxo completo dessa emocao.
          </p>
        </div>
        <div className="grid gap-6 md:grid-cols-2">
          {story.map((step) => (
            <Card key={step.title} className="p-6 space-y-4">
              <div className="flex items-center gap-3">
                <step.icon className="h-8 w-8 text-primary" />
                <h3 className="text-lg font-semibold text-foreground">
                  {step.title}
                </h3>
              </div>
              <p className="text-sm text-muted-foreground">{step.text}</p>
              <p className="text-sm font-serif text-foreground italic">
                {step.quote}
              </p>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
