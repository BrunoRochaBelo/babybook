import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useUpsellStore } from "@/store/upsell.store";
import { Dialog, DialogContent, DialogTitle } from "@babybook/ui";
const titles = {
    recurrent_social: "Pacote Repetições",
    storage: "Mais Armazenamento",
    premium_print: "Versão Premium Impressa"
};
export function UpsellModal() {
    const { visibleModal, closeModal } = useUpsellStore();
    return (_jsx(Dialog, { open: Boolean(visibleModal), onOpenChange: closeModal, children: _jsxs(DialogContent, { children: [_jsx(DialogTitle, { children: visibleModal ? titles[visibleModal] : "Upgrade disponível" }), _jsx("p", { className: "text-sm text-slate-600", children: "Todo upsell precisa estar alinhado com os limites definidos na API (quotas base + flags). Este modal \u00E9 apenas um placeholder para o fluxo completo." })] }) }));
}
