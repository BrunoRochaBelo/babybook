import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from "react";
import { Heart, Settings, ChevronDown, Camera, Moon, Sun } from "lucide-react";
import { motion } from "motion/react";
import { FloatingNav } from "../../components/FloatingNav";
import { ChildSwitcherDialog } from "../../components/ChildSwitcherDialog";
import { NotificationCenter } from "../../components/NotificationCenter";
import { chapters, getMomentsByChapter } from "../../lib/chaptersData";
import { useTheme } from "../../hooks/useTheme";
export function Dashboard({ babyName, activeSection = "memories", onSelectChapter, onNavigate, onSettings, }) {
    const { theme, toggleTheme } = useTheme();
    const [childSwitcherOpen, setChildSwitcherOpen] = useState(false);
    // Mock data - em produção viria do backend
    const children = [
        {
            id: "1",
            name: babyName,
            age: "10 meses",
            momentCount: 10,
            isActive: true,
        },
        { id: "2", name: "João", age: "3 anos", momentCount: 45, isActive: false },
    ];
    const notifications = [
        {
            id: "1",
            type: "vaccine",
            title: "Vacina Próxima",
            message: "Pentavalente (2ª dose) prevista para 15/11/2025",
            time: "2 dias atrás",
            isRead: false,
            action: {
                label: "Ver detalhes",
                onClick: () => onNavigate("memories"),
            },
        },
        {
            id: "2",
            type: "milestone",
            title: "Marco de Desenvolvimento",
            message: `${babyName} está na idade de começar a engatinhar. Que tal registrar esse momento?`,
            time: "1 semana atrás",
            isRead: false,
        },
        {
            id: "3",
            type: "celebration",
            title: "Mesversário Chegando",
            message: "Faltam 5 dias para o 11º mês de vida!",
            time: "1 semana atrás",
            isRead: true,
        },
    ];
    const [notificationList, setNotificationList] = useState(notifications);
    const handleMarkAsRead = (notificationId) => {
        setNotificationList((prev) => prev.map((n) => (n.id === notificationId ? { ...n, isRead: true } : n)));
    };
    const handleMarkAllAsRead = () => {
        setNotificationList((prev) => prev.map((n) => ({ ...n, isRead: true })));
    };
    // Calculate progress based on actual chapter data
    const chaptersWithProgress = chapters.map((chapter) => {
        const moments = getMomentsByChapter(chapter.id);
        return {
            ...chapter,
            progress: 0, // Em produção, viria do backend com momentos completados
            total: moments.length,
        };
    });
    const completedMoments = chaptersWithProgress.reduce((acc, ch) => acc + ch.progress, 0);
    const totalMoments = chaptersWithProgress.reduce((acc, ch) => acc + ch.total, 0);
    return (_jsxs("div", { className: "min-h-screen bg-background pb-32", children: [_jsx("div", { className: "sticky top-0 z-10 bg-card/80 backdrop-blur-xl border-b border-border/50 shadow-sm", children: _jsx("div", { className: "max-w-4xl mx-auto px-4 py-4", children: _jsxs("div", { className: "flex items-center justify-between gap-3", children: [_jsxs("button", { className: "h-auto p-0 hover:opacity-80 transition-opacity -ml-2 flex items-center gap-3 cursor-pointer", onClick: () => setChildSwitcherOpen(true), children: [_jsx(motion.div, { className: "w-12 h-12 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center flex-shrink-0 shadow-sm", whileHover: { scale: 1.05 }, whileTap: { scale: 0.95 }, children: _jsx(Heart, { className: "w-6 h-6 text-primary fill-current" }) }), _jsxs("div", { className: "text-left", children: [_jsxs("div", { className: "flex items-center gap-1.5", children: [_jsx("span", { className: "text-lg", children: babyName }), _jsx(ChevronDown, { className: "w-4 h-4 text-muted-foreground" })] }), _jsxs("span", { className: "text-xs text-muted-foreground", children: ["10 meses \u2022 ", completedMoments, "/", totalMoments, " momentos"] })] })] }), _jsxs("div", { className: "flex items-center gap-1.5", children: [_jsx(NotificationCenter, { notifications: notificationList, onMarkAsRead: handleMarkAsRead, onMarkAllAsRead: handleMarkAllAsRead }), _jsx("button", { onClick: toggleTheme, className: "rounded-full h-10 w-10 hover:bg-muted flex items-center justify-center cursor-pointer transition-colors", children: theme === "light" ? (_jsx(Moon, { className: "w-5 h-5" })) : (_jsx(Sun, { className: "w-5 h-5" })) }), _jsx("button", { onClick: onSettings, className: "rounded-full h-10 w-10 hover:bg-muted flex items-center justify-center cursor-pointer transition-colors", children: _jsx(Settings, { className: "w-5 h-5" }) })] })] }) }) }), _jsx(ChildSwitcherDialog, { open: childSwitcherOpen, onOpenChange: setChildSwitcherOpen, currentChild: children[0], children: children, onSelectChild: (childId) => {
                    console.log("Selected child:", childId);
                    // Em produção, mudaria o filho ativo
                }, onAddChild: () => {
                    console.log("Add new child");
                    // Em produção, abriria wizard de novo filho
                } }), _jsx("div", { className: "max-w-4xl mx-auto px-4 py-6 sm:py-8", children: _jsxs(motion.div, { initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.5 }, children: [_jsxs("div", { className: "mb-6 sm:mb-8", children: [_jsxs("h2", { className: "text-3xl sm:text-4xl font-serif mb-2", children: ["Santu\u00E1rio de ", babyName] }), _jsx("p", { className: "text-sm sm:text-base text-muted-foreground", children: "Cada momento guardado aqui fica seguro para sempre" })] }), _jsx(motion.div, { initial: { opacity: 0, y: 10 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.5, delay: 0.1 }, className: "mb-6 p-5 sm:p-6 bg-gradient-to-r from-accent/10 to-primary/10 border border-accent/30 rounded-2xl", children: _jsxs("div", { className: "flex items-start justify-between gap-4", children: [_jsxs("div", { className: "flex-1", children: [_jsx("p", { className: "text-xs sm:text-sm text-muted-foreground mb-1 font-medium", children: "Pr\u00F3xima sugest\u00E3o" }), _jsx("h3", { className: "text-lg sm:text-xl font-serif text-foreground mb-2", children: "O Primeiro Sorriso" }), _jsxs("p", { className: "text-sm text-muted-foreground mb-4", children: [babyName, " est\u00E1 na idade perfeita para aquele sorriso intencionado. Que tal registrar?"] }), _jsxs("button", { onClick: () => onSelectChapter("first-smile"), className: "inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-accent hover:bg-accent/90 text-white text-sm font-medium transition-colors", children: [_jsx(Camera, { className: "w-4 h-4" }), "Registrar agora"] })] }), _jsx(motion.div, { className: "w-12 h-12 rounded-full bg-accent/20 flex items-center justify-center flex-shrink-0", animate: { scale: [1, 1.1, 1] }, transition: { duration: 2, repeat: Infinity }, children: _jsx(Heart, { className: "w-6 h-6 text-accent" }) })] }) }), _jsxs("div", { className: "p-4 sm:p-6 mb-6 bg-gradient-to-br from-primary/5 to-accent/5 border border-primary/20 rounded-2xl", children: [_jsxs("div", { className: "flex items-center justify-between mb-3", children: [_jsxs("div", { children: [_jsx("h3", { className: "text-base sm:text-lg font-serif mb-1", children: "Progresso Geral" }), _jsxs("p", { className: "text-sm text-muted-foreground", children: [completedMoments, " de ", totalMoments, " momentos guardados"] })] }), _jsx("div", { className: "text-right", children: _jsxs("div", { className: "text-xl sm:text-2xl text-primary font-semibold", children: [Math.round((completedMoments / totalMoments) * 100), "%"] }) })] }), _jsx("div", { className: "w-full bg-muted rounded-full h-2 sm:h-3 overflow-hidden", children: _jsx("div", { className: "bg-primary h-full transition-all duration-500", style: {
                                            width: `${totalMoments > 0 ? (completedMoments / totalMoments) * 100 : 0}%`,
                                        } }) })] }), _jsx("div", { className: "space-y-4", children: chaptersWithProgress.map((chapter, index) => (_jsx(motion.div, { initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.3, delay: index * 0.05 }, children: _jsx("div", { className: "p-5 sm:p-6 cursor-pointer hover:shadow-xl hover:scale-[1.01] active:scale-[0.99] transition-all duration-300 border border-border/50 rounded-3xl bg-card/50 backdrop-blur-sm", onClick: () => onSelectChapter(chapter.id), children: _jsxs("div", { className: "flex items-start gap-4", children: [_jsx(motion.div, { className: `flex-shrink-0 w-14 h-14 sm:w-16 sm:h-16 rounded-2xl ${chapter.color} flex items-center justify-center shadow-sm`, whileHover: { scale: 1.05, rotate: 3 }, transition: {
                                                    type: "spring",
                                                    stiffness: 400,
                                                    damping: 10,
                                                }, children: _jsx(chapter.icon, { className: "w-7 h-7 sm:w-8 sm:h-8" }) }), _jsxs("div", { className: "flex-1 min-w-0", children: [_jsx("h3", { className: "mb-1.5 text-base sm:text-lg font-serif", children: chapter.title }), _jsx("p", { className: "text-sm text-muted-foreground mb-4 line-clamp-1", children: chapter.description }), _jsxs("div", { className: "flex items-center gap-3", children: [_jsx("div", { className: "flex-1 bg-muted rounded-full h-2.5 overflow-hidden", children: _jsx("div", { className: "bg-primary h-full transition-all duration-500", style: {
                                                                        width: `${chapter.total > 0 ? (chapter.progress / chapter.total) * 100 : 0}%`,
                                                                    } }) }), _jsxs("span", { className: "text-sm text-muted-foreground whitespace-nowrap font-medium", children: [chapter.progress, "/", chapter.total] })] }), chapter.progress === 0 && (_jsxs(motion.div, { initial: { opacity: 0 }, animate: { opacity: 1 }, transition: { delay: 0.3 }, className: "mt-3 text-sm text-accent flex items-center gap-1.5", children: [_jsx(Camera, { className: "w-4 h-4" }), "Vamos registrar este momento?"] }))] })] }) }) }, chapter.id))) }), chaptersWithProgress.every((c) => c.progress === 0) && (_jsx(motion.div, { initial: { opacity: 0 }, animate: { opacity: 1 }, transition: { delay: 0.6 }, className: "mt-6 sm:mt-8", children: _jsxs("div", { className: "p-6 sm:p-8 bg-gradient-to-br from-primary/5 to-accent/5 border border-primary/20 rounded-2xl text-center", children: [_jsx(motion.div, { animate: { y: [0, -4, 0] }, transition: { duration: 2, repeat: Infinity }, className: "mb-4", children: _jsx(Camera, { className: "w-12 h-12 text-primary mx-auto" }) }), _jsx("h3", { className: "text-xl sm:text-2xl font-serif mb-3", children: "Seu santu\u00E1rio est\u00E1 pronto" }), _jsxs("p", { className: "text-sm sm:text-base text-muted-foreground mb-6 max-w-md mx-auto", children: ["Vamos come\u00E7ar com \"O Grande Dia\" \u2014 o nascimento de ", babyName, ". Este \u00E9 o primeiro cap\u00EDtulo de uma hist\u00F3ria muito especial."] }), _jsxs("button", { onClick: () => onSelectChapter("great-day"), className: "inline-flex h-12 px-6 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-medium items-center justify-center gap-2 transition-colors", children: [_jsx(Camera, { className: "w-5 h-5" }), "Registrar o Grande Dia"] })] }) }))] }) }), _jsx(FloatingNav, { activeSection: activeSection, onNavigate: onNavigate })] }));
}
