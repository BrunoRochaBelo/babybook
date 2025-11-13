import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "./ui/dialog";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { Badge } from "./ui/badge";
import { Heart, Plus, Check } from "lucide-react";
import { motion } from "motion/react";
export function ChildSwitcherDialog({ open, onOpenChange, currentChild, children, onSelectChild, onAddChild }) {
    return (_jsx(Dialog, { open: open, onOpenChange: onOpenChange, children: _jsxs(DialogContent, { className: "max-w-md rounded-3xl", children: [_jsxs(DialogHeader, { children: [_jsx(DialogTitle, { className: "text-2xl", children: "Trocar de Filho" }), _jsx(DialogDescription, { children: "Selecione qual filho voc\u00EA deseja visualizar" })] }), _jsxs("div", { className: "space-y-3 mt-4", children: [children.map((child, index) => (_jsx(motion.div, { initial: { opacity: 0, x: -20 }, animate: { opacity: 1, x: 0 }, transition: { duration: 0.3, delay: index * 0.05 }, children: _jsx(Card, { className: `p-4 cursor-pointer transition-all duration-200 ${child.isActive
                                    ? 'border-primary/50 bg-primary/5 shadow-md'
                                    : 'hover:border-primary/30 hover:shadow-md active:scale-[0.98]'}`, onClick: () => {
                                    onSelectChild(child.id);
                                    onOpenChange(false);
                                }, children: _jsxs("div", { className: "flex items-center gap-4", children: [_jsx("div", { className: `w-12 h-12 rounded-full flex items-center justify-center ${child.isActive ? 'bg-primary/20' : 'bg-muted'}`, children: _jsx(Heart, { className: `w-6 h-6 ${child.isActive ? 'text-primary fill-current' : 'text-muted-foreground'}` }) }), _jsxs("div", { className: "flex-1", children: [_jsxs("div", { className: "flex items-center gap-2 mb-1", children: [_jsx("h4", { className: "text-base", children: child.name }), child.isActive && (_jsx(Badge, { variant: "default", className: "text-xs", children: "Atual" }))] }), _jsxs("p", { className: "text-sm text-muted-foreground", children: [child.age, " \u2022 ", child.momentCount, " momentos"] })] }), child.isActive && (_jsx(Check, { className: "w-5 h-5 text-primary" }))] }) }) }, child.id))), _jsx(motion.div, { initial: { opacity: 0, y: 10 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.3, delay: children.length * 0.05 }, children: _jsxs(Button, { variant: "outline", className: "w-full h-14 rounded-2xl border-dashed hover:border-primary hover:bg-primary/5", onClick: () => {
                                    onAddChild();
                                    onOpenChange(false);
                                }, children: [_jsx(Plus, { className: "w-5 h-5 mr-2" }), "Adicionar Outro Filho"] }) })] })] }) }));
}
