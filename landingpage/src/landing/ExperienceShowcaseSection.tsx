import { Tag } from "lucide-react";

const books = [
  {
    title: "Livro da Jornada",
    description:
      "Organiza a gravidez, os primeiros dias e marcos como Sorriso, Rolamento e Primeiros Passos. Cada capitulo vem com prompt emocional.",
    highlights: [
      "Capitulo 1 - A jornada comeca",
      "Capitulo 3 - Grandes conquistas",
      "Galeria de manias e quirks",
    ],
  },
  {
    title: "Livro da Saude",
    description:
      "Coleta consultas, curva de crescimento, vacinas e documentos no Cofre. Tudo protegido por RLS, visivel apenas ao owner.",
    highlights: [
      "Consultas e peso/altura",
      "Vacinas com alerta gentil",
      "Upload de exames",
    ],
  },
  {
    title: "Livro de Visitas",
    description:
      "Links leves permitem que Sergio e madrinhas deixem cartas, audios e videos. Mensagens passam pela moderacao da Ana.",
    highlights: [
      "Livro de visitas e audios",
      "Modo visita especial",
      "Moderacao simples",
    ],
  },
  {
    title: "Extensoes de legado",
    description:
      "Arvore da familia, Capsula do Tempo e PoD (print-on-demand) mantem o ecossistema vivo por decadas.",
    highlights: [
      "Capsula para 18 anos",
      "Pedidos de fotolivro PoD",
      "Arvore familiar completa",
    ],
  },
];

const catalogTags = [
  "Primeiro sorriso social",
  "A historia do nome",
  "Visitas especiais",
  "Mesversario 6/12",
  "Primeira palavra",
  "Curva de crescimento",
  "Primeira pascoa",
  "Livro de visitas",
  "Capsula do tempo",
];

export function ExperienceShowcaseSection() {
  return (
    <section className="bg-muted/40 px-4 py-20">
      <div className="mx-auto max-w-6xl space-y-12">
        <div className="text-center">
          <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">
            Catalogo vivo
          </p>
          <h2 className="mt-2 font-serif text-4xl text-foreground">
            Tres livros e um arsenal de momentos prontos.
          </h2>
          <p className="mt-3 text-base text-muted-foreground max-w-3xl mx-auto">
            O Catalogo de Momentos define capitulos, prompts e limites de midia.
            Cada livro herdou esse roteiro para evitar improviso cansativo.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {books.map((book) => (
            <div
              key={book.title}
              className="rounded-[32px] border border-border bg-white/90 p-8 shadow-lg"
            >
              <div className="text-xs uppercase tracking-[0.3em] text-primary">
                {book.title}
              </div>
              <p className="mt-3 text-lg text-foreground">{book.description}</p>
              <ul className="mt-6 space-y-2 text-sm text-muted-foreground">
                {book.highlights.map((highlight) => (
                  <li key={highlight} className="flex items-center gap-2">
                    <Tag className="h-4 w-4 text-primary" />
                    {highlight}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="rounded-[32px] border border-dashed border-primary/40 bg-primary/5 p-8 text-center">
          <p className="text-xs uppercase tracking-[0.3em] text-primary">
            Trechos do catalogo
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            {catalogTags.map((tag) => (
              <span
                key={tag}
                className="rounded-full border border-primary/40 px-4 py-2 text-sm text-primary/80"
              >
                {tag}
              </span>
            ))}
          </div>
          <p className="mt-6 text-sm text-muted-foreground">
            Cada tag representa um template com copy pronta, campos obrigatorios
            e categoria de upsell definida no Catalogo de Momentos.
          </p>
        </div>
      </div>
    </section>
  );
}
