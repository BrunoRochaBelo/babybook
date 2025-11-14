import { Card } from "../ui/card";
import { Briefcase, HeartHandshake, ShieldCheck, UsersRound } from "lucide-react";

const personas = [
  {
    icon: HeartHandshake,
    title: "Ana, 32 anos - Guardia da memoria",
    pains: [
      "Rolo com 5.000 fotos e zero energia para organizar",
      "Culpa por sentir que esta atrasada",
    ],
    gains: [
      "HUD sugere um momento por vez",
      "Copy pronta ajuda a escrever duas linhas e dormir em paz",
    ],
  },
  {
    icon: UsersRound,
    title: "Sergio, 65 anos - Convidado de honra",
    pains: [
      "Detesta redes sociais poluidas",
      "Mora em outra cidade e quer proximidade real",
    ],
    gains: [
      "Recebe apenas um link leve",
      "Deixa recados no Guestbook e sente que fez parte",
    ],
  },
  {
    icon: Briefcase,
    title: "Parceiros - Fotografas, clinicas, bancos",
    pains: [
      "Querem entregar valor pos-servico",
      "Precisam de prova de uso do voucher",
    ],
    gains: [
      "Resgate instantaneo, sem cartao",
      "Dashboard mostra uso e NPS das familias",
    ],
  },
];

const controls = [
  "Owner controla livros, saude e cofres (RLS no Neon).",
  "Guardioes veem apenas o que voce libera e toda mensagem passa por moderacao.",
  "Visitantes assinam o Guestbook por link unico com expiracao.",
];

export function FamilyConnectionSection() {
  return (
    <section className="bg-white px-4 py-20">
      <div className="mx-auto max-w-6xl space-y-12">
        <div className="text-center space-y-4">
          <h2 className="font-serif text-4xl text-foreground">
            Construido para Ana, mas pensado para todo o ecossistema.
          </h2>
          <p className="text-lg text-muted-foreground">
            A Modelagem de Produto define duas personas principais e um canal
            B2B2C. Cada card abaixo mostra dor x ganho e como o produto os
            atende.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {personas.map((persona) => (
            <Card key={persona.title} className="space-y-5 p-6">
              <div className="flex items-center gap-3">
                <persona.icon className="h-8 w-8 text-primary" />
                <h3 className="text-lg font-semibold text-foreground">
                  {persona.title}
                </h3>
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.4em] text-primary">
                  Dores
                </p>
                <ul className="mt-2 space-y-2 text-sm text-muted-foreground">
                  {persona.pains.map((pain) => (
                    <li key={pain}>- {pain}</li>
                  ))}
                </ul>
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.4em] text-primary">
                  Ganhos
                </p>
                <ul className="mt-2 space-y-2 text-sm text-muted-foreground">
                  {persona.gains.map((gain) => (
                    <li key={gain}>+ {gain}</li>
                  ))}
                </ul>
              </div>
            </Card>
          ))}
        </div>

        <div className="grid gap-6 rounded-3xl bg-gradient-to-r from-accent/10 to-primary/10 p-10 text-left md:grid-cols-2">
          <div className="space-y-4">
            <p className="text-sm uppercase tracking-[0.4em] text-primary">
              Livro de Visitas e Guestbook
            </p>
            <p className="text-lg text-foreground italic">
              "Moro longe do meu neto. Recebo o link, vejo o video e deixo uma
              carta de voz. Meu neto vai saber, anos depois, que vovo estava
              presente." - Sergio
            </p>
          </div>
          <div className="rounded-2xl border border-white/60 bg-white/80 p-6 text-left shadow-sm space-y-3 text-sm text-muted-foreground">
            <div className="flex items-center gap-2 text-primary">
              <ShieldCheck className="h-5 w-5" />
              Controles de acesso
            </div>
            <ul className="space-y-2">
              {controls.map((control) => (
                <li key={control}>{control}</li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
