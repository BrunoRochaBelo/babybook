import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Button } from "../ui/button";
import { Gift } from "lucide-react";
export function GiftSection() {
    return (_jsx("section", { className: "py-20 px-4 bg-gradient-to-br from-accent/20 to-primary/10", children: _jsxs("div", { className: "max-w-4xl mx-auto text-center", children: [_jsx(Gift, { className: "w-16 h-16 text-primary mx-auto mb-6" }), _jsx("h2", { className: "text-4xl mb-6", children: "O presente perfeito" }), _jsx("p", { className: "text-xl text-muted-foreground mb-8", children: "Vale-presente dispon\u00EDvel para ch\u00E1s de beb\u00EA, anivers\u00E1rios e momentos especiais." }), _jsx(Button, { size: "lg", variant: "outline", className: "h-14 px-8 rounded-2xl", children: "Comprar Vale-Presente" })] }) }));
}
