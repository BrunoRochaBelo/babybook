import { Lock, Sparkles } from "lucide-react";

const securityFeatures = [
  "Armazenamento seguro em nuvem",
  "Backups automáticos diários",
  "Exportação completa disponível",
  "Privacidade total garantida",
  "Acesso apenas para quem você autorizar",
  "Suporte dedicado sempre disponível"
];

export function SecuritySection() {
  return (
    <section className="py-20 px-4 bg-white">
      <div className="max-w-4xl mx-auto text-center">
        <Lock className="w-16 h-16 text-primary mx-auto mb-6" />
        <h2 className="text-4xl mb-6">Seguro para sempre</h2>
        <p className="text-xl text-muted-foreground mb-8">
          Seus dados criptografados, backups automáticos e a garantia de que as memórias do seu bebê estarão sempre protegidas.
        </p>
        <div className="grid md:grid-cols-3 gap-6 text-left">
          {securityFeatures.map((item, i) => (
            <div key={i} className="flex items-start gap-3">
              <Sparkles className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
              <span className="text-muted-foreground">{item}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
