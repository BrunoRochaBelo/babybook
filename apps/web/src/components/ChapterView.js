import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { ArrowLeft, Camera } from "lucide-react";
import { motion } from "motion/react";
import { getMomentsByChapter } from "../lib/chaptersData";
export function ChapterView({ chapterId, chapterTitle, babyName, onBack, onAddMoment, }) {
    const momentTemplates = getMomentsByChapter(chapterId);
    const mockCompleted = ["first-photo", "going-home"];
    const mockRecurrent = ["visitors"];
    const moments = momentTemplates.map((template) => {
        if (mockCompleted.includes(template.id)) {
            return {
                ...template,
                status: "completed",
                date: "10/02/2024",
            };
        }
        else if (mockRecurrent.includes(template.id)) {
            return {
                ...template,
                status: "recurrent",
                count: 3,
            };
        }
        else {
            return { ...template, status: "pending" };
        }
    });
    const completedCount = moments.filter((m) => m.status === "completed").length;
    const handleMomentClick = (moment) => {
        if (moment.status === "pending") {
            onAddMoment(moment.id);
        }
    };
    return (_jsxs("div", { className: "min-h-screen bg-background pb-20", children: [_jsx("div", { className: "sticky top-0 z-10 bg-card/95 backdrop-blur-sm border-b border-border", children: _jsxs("div", { className: "max-w-4xl mx-auto px-4 py-4 sm:py-6", children: [_jsxs("button", { onClick: onBack, className: "mb-3 -ml-2 h-9 flex items-center gap-2 text-sm hover:opacity-70", children: [_jsx(ArrowLeft, { className: "w-4 h-4" }), "Voltar"] }), _jsx("h1", { className: "text-2xl sm:text-3xl font-serif mb-2", children: chapterTitle }), _jsxs("p", { className: "text-sm sm:text-base text-muted-foreground", children: [completedCount, " de ", moments.length, " momentos registrados"] })] }) }), _jsx("div", { className: "max-w-4xl mx-auto px-4 py-8", children: _jsx("div", { className: "space-y-4", children: moments.map((moment, index) => (_jsx(motion.div, { initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.3, delay: index * 0.05 }, className: "p-5 sm:p-6 rounded-3xl border border-border/50 bg-card/50 cursor-pointer hover:shadow-xl hover:scale-[1.01] active:scale-[0.99] transition-all", onClick: () => handleMomentClick(moment), children: _jsxs("div", { className: "flex items-start gap-4", children: [_jsx("div", { className: `flex-shrink-0 w-14 h-14 sm:w-16 sm:h-16 rounded-2xl flex items-center justify-center shadow-sm ${moment.status === "pending"
                                        ? "bg-muted/50"
                                        : "bg-primary/10"}`, children: _jsx(Camera, { className: "w-7 h-7 sm:w-8 sm:h-8 text-primary" }) }), _jsxs("div", { className: "flex-1 min-w-0", children: [_jsx("h3", { className: "mb-1.5 text-base sm:text-lg font-serif", children: moment.title }), _jsx("p", { className: "text-sm text-muted-foreground mb-3 line-clamp-1", children: moment.description }), moment.status === "pending" && (_jsxs("div", { className: "text-sm text-primary flex items-center gap-1.5", children: [_jsx(Camera, { className: "w-4 h-4" }), "Registrar agora"] })), moment.status === "completed" && (_jsxs("div", { className: "text-sm text-muted-foreground", children: ["Registrado em ", moment.date] })), moment.status === "recurrent" && (_jsxs("div", { className: "text-sm text-accent", children: [moment.count, " registros"] }))] })] }) }, moment.id))) }) })] }));
}
