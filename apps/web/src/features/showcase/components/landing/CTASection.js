import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Button } from "../ui/button";
export function CTASection({ onGetStarted }) {
    return (_jsx("section", { className: "py-20 px-4 bg-primary text-white", children: _jsxs("div", { className: "max-w-4xl mx-auto text-center", children: [_jsx("h2", { className: "text-4xl mb-6 text-white", children: "Comece hoje a preservar mem\u00F3rias" }), _jsx("p", { className: "text-xl mb-8 text-white/90", children: "Pagamento \u00FAnico de R$ 199,00 \u2022 Acesso vital\u00EDcio \u2022 5 anos de armazenamento" }), _jsx(Button, { onClick: onGetStarted, size: "lg", variant: "secondary", className: "h-14 px-8 rounded-2xl shadow-lg hover:shadow-xl transition-smooth", children: "Criar Meu Cofre Agora" })] }) }));
}
