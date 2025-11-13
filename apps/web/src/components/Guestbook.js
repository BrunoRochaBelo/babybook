import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from "react";
import { ArrowLeft, Share2, Users, Heart, Check, X, Image as ImageIcon, Mic, } from "lucide-react";
import { motion } from "motion/react";
import { toast } from "sonner";
export function Guestbook({ babyName, onBack }) {
    const [messages, setMessages] = useState([
        {
            id: 1,
            name: "Vovó Maria",
            message: "Minha netinha linda! Que Deus abençoe cada dia da sua vida. Vovó te ama infinitamente! 💕",
            type: "approved",
            date: "15/03/2024",
            hasAudio: true,
            hasPhoto: false,
        },
        {
            id: 2,
            name: "Tia Ana",
            message: "Helena, você trouxe tanta luz para nossa família! Mal posso esperar para ver você crescer.",
            type: "approved",
            date: "18/03/2024",
            hasPhoto: true,
            hasAudio: false,
        },
        {
            id: 3,
            name: "Tio Pedro",
            message: "Bem-vinda ao mundo, pequena! Seu tio já está planejando todas as aventuras que vamos viver juntos.",
            type: "pending",
            date: "20/03/2024",
            hasAudio: false,
            hasPhoto: false,
        },
    ]);
    const approvedMessages = messages.filter((m) => m.type === "approved");
    const pendingMessages = messages.filter((m) => m.type === "pending");
    const handleApprove = (id) => {
        setMessages(messages.map((m) => m.id === id ? { ...m, type: "approved" } : m));
        toast.success("Mensagem aprovada!");
    };
    const handleReject = (id) => {
        setMessages(messages.filter((m) => m.id !== id));
        toast.success("Mensagem removida");
    };
    return (_jsxs("div", { className: "min-h-screen bg-background pb-20", children: [_jsx("div", { className: "sticky top-0 z-10 bg-card/95 backdrop-blur-sm border-b border-border", children: _jsxs("div", { className: "max-w-4xl mx-auto px-4 py-4 sm:py-6", children: [_jsxs("button", { onClick: onBack, className: "mb-3 -ml-2 h-9 flex items-center gap-2 text-sm hover:opacity-70", children: [_jsx(ArrowLeft, { className: "w-4 h-4" }), "Voltar"] }), _jsxs("div", { className: "flex items-center justify-between gap-3", children: [_jsxs("div", { className: "flex-1 min-w-0", children: [_jsx("h1", { className: "text-2xl sm:text-3xl font-serif mb-1 sm:mb-2 truncate", children: "Livro de Visitas" }), _jsxs("p", { className: "text-xs sm:text-sm text-muted-foreground", children: [approvedMessages.length, " mensagens de amor guardadas"] })] }), _jsxs("button", { className: "h-10 sm:h-12 px-3 sm:px-4 rounded-xl bg-primary hover:bg-primary/90 text-white text-sm flex-shrink-0 flex items-center justify-center gap-2", children: [_jsx(Share2, { className: "w-4 h-4" }), _jsx("span", { className: "hidden sm:inline", children: "Convidar" })] })] })] }) }), _jsxs("div", { className: "max-w-4xl mx-auto px-4 py-8", children: [_jsxs(motion.div, { initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 }, className: "p-6 rounded-3xl border border-border/50 bg-card/50 mb-6", children: [_jsxs("div", { className: "flex items-center justify-between mb-4", children: [_jsxs("div", { children: [_jsx("h3", { className: "font-serif text-lg mb-1", children: "Mensagens Guardadas" }), _jsx("p", { className: "text-sm text-muted-foreground", children: "5 de 20 slots utilizados" })] }), _jsx("button", { className: "px-4 py-2 rounded-xl border border-border hover:bg-muted/50 text-sm transition-colors", children: "Ampliar para 50" })] }), _jsx("div", { className: "h-2 bg-muted rounded-full overflow-hidden", children: _jsx("div", { className: "h-full bg-primary", style: { width: "25%" } }) })] }), pendingMessages.length > 0 && (_jsxs("div", { className: "mb-8", children: [_jsxs("div", { className: "flex items-center gap-2 mb-4", children: [_jsx("h3", { className: "font-serif text-lg", children: "Aguardando Modera\u00E7\u00E3o" }), _jsx("span", { className: "text-xs bg-secondary/50 text-secondary-foreground px-2 py-1 rounded-full", children: pendingMessages.length })] }), _jsx("div", { className: "space-y-3", children: pendingMessages.map((message, index) => (_jsx(motion.div, { initial: { opacity: 0, x: -20 }, animate: { opacity: 1, x: 0 }, transition: { duration: 0.3, delay: index * 0.1 }, className: "p-4 rounded-3xl border-accent/50 border bg-card/50", children: _jsxs("div", { className: "flex items-start gap-4", children: [_jsx("div", { className: "w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center flex-shrink-0", children: _jsx(Users, { className: "w-6 h-6 text-accent" }) }), _jsxs("div", { className: "flex-1 min-w-0", children: [_jsxs("div", { className: "flex items-center gap-2 mb-1 flex-wrap", children: [_jsx("span", { className: "font-medium", children: message.name }), _jsxs("span", { className: "text-xs text-muted-foreground", children: ["\u2022 ", message.date] })] }), _jsx("p", { className: "text-sm text-muted-foreground mb-3", children: message.message }), _jsxs("div", { className: "flex gap-2", children: [_jsxs("button", { onClick: () => handleApprove(message.id), className: "px-4 py-2 rounded-xl bg-primary hover:bg-primary/90 text-white text-sm flex items-center gap-1", children: [_jsx(Check, { className: "w-4 h-4" }), "Aprovar"] }), _jsxs("button", { onClick: () => handleReject(message.id), className: "px-4 py-2 rounded-xl border border-border hover:bg-muted/50 text-sm flex items-center gap-1", children: [_jsx(X, { className: "w-4 h-4" }), "Rejeitar"] })] })] })] }) }, message.id))) })] })), _jsxs("div", { children: [_jsx("h3", { className: "font-serif text-lg mb-4", children: "Mensagens de Amor" }), _jsx("div", { className: "space-y-4", children: approvedMessages.map((message, index) => (_jsx(motion.div, { initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.3, delay: index * 0.1 }, className: "p-6 rounded-3xl border border-border/50 bg-card/50", children: _jsxs("div", { className: "flex items-start gap-4", children: [_jsx("div", { className: "w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0", children: _jsx(Heart, { className: "w-6 h-6 text-primary fill-current" }) }), _jsxs("div", { className: "flex-1", children: [_jsxs("div", { className: "flex items-center gap-2 mb-2", children: [_jsx("span", { className: "font-medium", children: message.name }), _jsxs("span", { className: "text-xs text-muted-foreground", children: ["\u2022 ", message.date] })] }), _jsx("p", { className: "text-muted-foreground mb-4", children: message.message }), (message.hasAudio || message.hasPhoto) && (_jsxs("div", { className: "flex gap-2", children: [message.hasAudio && (_jsxs("div", { className: "flex items-center gap-2 text-sm text-primary", children: [_jsx(Mic, { className: "w-4 h-4" }), _jsx("span", { children: "\u00C1udio anexado" })] })), message.hasPhoto && (_jsxs("div", { className: "flex items-center gap-2 text-sm text-primary", children: [_jsx(ImageIcon, { className: "w-4 h-4" }), _jsx("span", { children: "Foto anexada" })] }))] }))] })] }) }, message.id))) })] })] })] }));
}
