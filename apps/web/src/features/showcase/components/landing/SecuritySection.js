import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
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
    return (_jsx("section", { className: "py-20 px-4 bg-white", children: _jsxs("div", { className: "max-w-4xl mx-auto text-center", children: [_jsx(Lock, { className: "w-16 h-16 text-primary mx-auto mb-6" }), _jsx("h2", { className: "text-4xl mb-6", children: "Seguro para sempre" }), _jsx("p", { className: "text-xl text-muted-foreground mb-8", children: "Seus dados criptografados, backups autom\u00E1ticos e a garantia de que as mem\u00F3rias do seu beb\u00EA estar\u00E3o sempre protegidas." }), _jsx("div", { className: "grid md:grid-cols-3 gap-6 text-left", children: securityFeatures.map((item, i) => (_jsxs("div", { className: "flex items-start gap-3", children: [_jsx(Sparkles, { className: "w-5 h-5 text-primary flex-shrink-0 mt-0.5" }), _jsx("span", { className: "text-muted-foreground", children: item })] }, i))) })] }) }));
}
