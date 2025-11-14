import {
  Cloud,
  Database,
  DownloadCloud,
  EyeOff,
  KeyRound,
  Shield,
} from "lucide-react";

const items = [
  {
    icon: Cloud,
    title: "Stack serverless",
    text: "Cloudflare Workers + Neon Postgres + Backblaze B2 + Modal. Sem servidores ociosos, custo acompanha receita.",
  },
  {
    icon: Database,
    title: "RLS e particionamento",
    text: "Saude e Cofre usam Row Level Security; guardioes veem apenas visoes derivadas liberadas pelo owner.",
  },
  {
    icon: KeyRound,
    title: "Links privados e moderacao",
    text: "Cada link tem expiracao, revogacao e assinatura criptografada. Mensagens passam por aprovacao.",
  },
  {
    icon: EyeOff,
    title: "Sem anuncios ou rastreadores",
    text: "Modelo financeiro eh o pagamento unico. Nao ha monetizacao secundaria.",
  },
  {
    icon: DownloadCloud,
    title: "Export habilitado",
    text: "ZIP completo, PoD e APIs abertas garantem que seus dados sejam sempre seus.",
  },
  {
    icon: Shield,
    title: "Observabilidade 24/7",
    text: "DevOps & Observabilidade documenta runbooks, alertas e cold storage redundante.",
  },
];

export function SecuritySection() {
  return (
    <section className="bg-white px-4 py-20">
      <div className="mx-auto max-w-5xl text-center space-y-8">
        <h2 className="font-serif text-4xl text-foreground">
          Infraestrutura de cofre, nao de rede social.
        </h2>
        <p className="text-lg text-muted-foreground">
          O documento de Arquitetura define uma pilha auditavel e sem ociosidade.
          Cada escolha eh uma defesa contra perda de dados ou invasao.
        </p>
        <div className="grid gap-6 text-left md:grid-cols-2">
          {items.map((item) => (
            <div
              key={item.title}
              className="flex items-start gap-3 rounded-2xl border border-border p-4"
            >
              <item.icon className="mt-1 h-5 w-5 text-primary" />
              <div>
                <p className="font-semibold text-foreground">{item.title}</p>
                <p className="text-sm text-muted-foreground">{item.text}</p>
              </div>
            </div>
          ))}
        </div>
        <div className="rounded-3xl border border-primary/20 bg-primary/5 p-6 text-left">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-primary">
            Garantia de 20 anos
          </p>
          <p className="mt-2 text-muted-foreground">
            Parte de cada pagamento vai para um fundo de custo de estoque.
            Quando falamos em "Acesso Perpetuo" nao eh marketing: eh um
            compromisso financeiro (documentado na Visao & Viabilidade) e
            tecnico (cold storage + export sempre habilitado).
          </p>
        </div>
      </div>
    </section>
  );
}
