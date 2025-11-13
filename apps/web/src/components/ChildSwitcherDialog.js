import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Heart, Plus, Check } from "lucide-react";
import { motion } from "motion/react";
export function ChildSwitcherDialog({ open, onOpenChange, children, onSelectChild, onAddChild, }) {
    if (!open)
        return null;
    return (_jsx("div", { className: "fixed inset-0 bg-black/50 z-40 flex items-center justify-center p-4", children: _jsxs("div", { className: "bg-card rounded-3xl max-w-md w-full", children: [_jsxs("div", { className: "p-6 border-b border-border", children: [_jsx("h2", { className: "text-2xl font-semibold mb-1", children: "Trocar de Filho" }), _jsx("p", { className: "text-sm text-muted-foreground", children: "Selecione qual filho voc\u00EA deseja visualizar" })] }), _jsxs("div", { className: "space-y-3 p-6", children: [children.map((child, index) => (_jsx(motion.div, { initial: { opacity: 0, x: -20 }, animate: { opacity: 1, x: 0 }, transition: { duration: 0.3, delay: index * 0.05 }, children: _jsxs("button", { className: `w-full p-4 rounded-2xl border-2 transition-all duration-200 flex items-center gap-3 ${child.isActive
                                    ? "border-primary/50 bg-primary/5 shadow-md"
                                    : "border-border hover:border-primary/30 hover:shadow-md active:scale-[0.98]"}`, onClick: () => {
                                    onSelectChild(child.id);
                                    onOpenChange(false);
                                }, children: [_jsx("div", { className: `w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 ${child.isActive ? "bg-primary/20" : "bg-muted"}`, children: _jsx(Heart, { className: `w-6 h-6 ${child.isActive
                                                ? "text-primary fill-current"
                                                : "text-muted-foreground"}` }) }), _jsxs("div", { className: "flex-1 text-left", children: [_jsx("p", { className: "font-medium", children: child.name }), _jsxs("p", { className: "text-sm text-muted-foreground", children: [child.age, " \u2022 ", child.momentCount, " momentos"] })] }), child.isActive && (_jsx(Check, { className: "w-5 h-5 text-primary flex-shrink-0" }))] }) }, child.id))), _jsx(motion.div, { initial: { opacity: 0, y: 10 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.3, delay: children.length * 0.05 }, children: _jsxs("button", { className: "w-full h-14 rounded-2xl border-2 border-dashed border-border hover:border-primary hover:bg-primary/5 flex items-center justify-center gap-2 text-foreground font-medium", onClick: () => {
                                    onAddChild();
                                    onOpenChange(false);
                                }, children: [_jsx(Plus, { className: "w-5 h-5" }), "Adicionar Outro Filho"] }) })] }), _jsx("div", { className: "border-t border-border p-4", children: _jsx("button", { className: "w-full py-2 text-sm text-muted-foreground hover:text-foreground", onClick: () => onOpenChange(false), children: "Fechar" }) })] }) }));
}
