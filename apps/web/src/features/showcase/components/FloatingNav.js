import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Button } from "./ui/button";
import { BookHeart, Stethoscope, Users } from "lucide-react";
import { motion } from "motion/react";
export function FloatingNav({ activeSection, onNavigate }) {
    return (_jsx(motion.div, { initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 }, className: "fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-4 w-full max-w-md", children: _jsxs("div", { className: "bg-card/80 backdrop-blur-xl border border-border/50 rounded-[24px] shadow-2xl p-2 flex items-center justify-around", children: [_jsxs(Button, { variant: "ghost", className: `flex flex-col items-center gap-1 h-auto py-3 px-6 rounded-[18px] transition-all duration-300 ${activeSection === 'memories'
                        ? 'bg-primary/10 text-primary'
                        : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'}`, onClick: () => onNavigate('memories'), children: [_jsx(BookHeart, { className: `w-6 h-6 transition-transform duration-300 ${activeSection === 'memories' ? 'scale-110' : ''}` }), _jsx("span", { className: "text-xs", children: "Mem\u00F3rias" })] }), _jsxs(Button, { variant: "ghost", className: `flex flex-col items-center gap-1 h-auto py-3 px-6 rounded-[18px] transition-all duration-300 ${activeSection === 'health'
                        ? 'bg-primary/10 text-primary'
                        : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'}`, onClick: () => onNavigate('health'), children: [_jsx(Stethoscope, { className: `w-6 h-6 transition-transform duration-300 ${activeSection === 'health' ? 'scale-110' : ''}` }), _jsx("span", { className: "text-xs", children: "Sa\u00FAde" })] }), _jsxs(Button, { variant: "ghost", className: `flex flex-col items-center gap-1 h-auto py-3 px-6 rounded-[18px] transition-all duration-300 ${activeSection === 'visits'
                        ? 'bg-primary/10 text-primary'
                        : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'}`, onClick: () => onNavigate('visits'), children: [_jsx(Users, { className: `w-6 h-6 transition-transform duration-300 ${activeSection === 'visits' ? 'scale-110' : ''}` }), _jsx("span", { className: "text-xs", children: "Visitas" })] })] }) }));
}
