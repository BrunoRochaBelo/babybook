import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { ArrowLeft, TrendingUp, Check, Clock } from "lucide-react";
import { motion } from "motion/react";
export function HealthModule({ babyName, onBack }) {
    const growthData = [
        { age: "Nasc", weight: 3.2, height: 49, percentile: 50 },
        { age: "1m", weight: 4.1, height: 53, percentile: 55 },
        { age: "2m", weight: 5.3, height: 57, percentile: 60 },
        { age: "3m", weight: 6.2, height: 60, percentile: 62 },
        { age: "6m", weight: 7.8, height: 67, percentile: 58 },
        { age: "10m", weight: 9.2, height: 74, percentile: 54 },
    ];
    const vaccines = [
        {
            age: "Ao nascer",
            items: [
                { name: "BCG", status: "completed", date: "10/02/2024" },
                {
                    name: "Hepatite B",
                    status: "completed",
                    date: "10/02/2024",
                },
            ],
        },
        {
            age: "2 meses",
            items: [
                {
                    name: "Pentavalente (1ª dose)",
                    status: "completed",
                    date: "10/04/2024",
                },
                {
                    name: "VIP (1ª dose)",
                    status: "completed",
                    date: "10/04/2024",
                },
                {
                    name: "Rotavírus (1ª dose)",
                    status: "completed",
                    date: "10/04/2024",
                },
                {
                    name: "Pneumocócica (1ª dose)",
                    status: "completed",
                    date: "10/04/2024",
                },
            ],
        },
        {
            age: "4 meses",
            items: [
                {
                    name: "Pentavalente (2ª dose)",
                    status: "completed",
                    date: "10/06/2024",
                },
                {
                    name: "VIP (2ª dose)",
                    status: "completed",
                    date: "10/06/2024",
                },
                {
                    name: "Rotavírus (2ª dose)",
                    status: "completed",
                    date: "10/06/2024",
                },
                {
                    name: "Pneumocócica (2ª dose)",
                    status: "completed",
                    date: "10/06/2024",
                },
            ],
        },
        {
            age: "6 meses",
            items: [
                {
                    name: "Pentavalente (3ª dose)",
                    status: "scheduled",
                    date: undefined,
                },
                {
                    name: "VIP (3ª dose)",
                    status: "scheduled",
                    date: undefined,
                },
                {
                    name: "Influenza (1ª dose)",
                    status: "pending",
                    date: undefined,
                },
            ],
        },
    ];
    const totalVaccines = vaccines.reduce((acc, group) => acc + group.items.length, 0);
    const completedVaccines = vaccines.reduce((acc, group) => acc + group.items.filter((v) => v.status === "completed").length, 0);
    return (_jsxs("div", { className: "min-h-screen bg-background pb-20", children: [_jsx("div", { className: "sticky top-0 z-10 bg-card/95 backdrop-blur-sm border-b border-border", children: _jsxs("div", { className: "max-w-4xl mx-auto px-4 py-4 sm:py-6", children: [_jsxs("button", { onClick: onBack, className: "mb-3 -ml-2 h-9 flex items-center gap-2 text-sm hover:opacity-70", children: [_jsx(ArrowLeft, { className: "w-4 h-4" }), "Voltar"] }), _jsxs("h1", { className: "text-2xl sm:text-3xl font-serif mb-2", children: ["Sa\u00FAde de ", babyName] }), _jsx("p", { className: "text-sm sm:text-base text-muted-foreground", children: "Acompanhe vacinas e crescimento" })] }) }), _jsx("div", { className: "max-w-4xl mx-auto px-4 py-6 sm:py-8", children: _jsxs("div", { className: "space-y-6", children: [_jsxs(motion.div, { initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 }, className: "p-6 rounded-3xl border border-border/50 bg-gradient-to-br from-primary/5 to-accent/5", children: [_jsxs("div", { className: "flex items-center justify-between mb-4", children: [_jsxs("div", { children: [_jsx("h3", { className: "font-serif text-lg mb-1", children: "Calend\u00E1rio de Vacina\u00E7\u00E3o" }), _jsxs("p", { className: "text-sm text-muted-foreground", children: [completedVaccines, " de ", totalVaccines, " vacinas aplicadas"] })] }), _jsx("div", { className: "text-right", children: _jsxs("div", { className: "text-2xl text-primary font-semibold", children: [Math.round((completedVaccines / totalVaccines) * 100), "%"] }) })] }), _jsx("div", { className: "w-full h-2 bg-muted rounded-full overflow-hidden", children: _jsx("div", { className: "h-full bg-primary transition-all", style: {
                                            width: `${(completedVaccines / totalVaccines) * 100}%`,
                                        } }) })] }), _jsx("div", { className: "space-y-4", children: vaccines.map((group, index) => (_jsxs(motion.div, { initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.3, delay: index * 0.05 }, className: "p-6 rounded-3xl border border-border/50 bg-card/50", children: [_jsx("h4", { className: "font-serif text-lg mb-4", children: group.age }), _jsx("div", { className: "space-y-3", children: group.items.map((vaccine) => (_jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { className: "flex items-center gap-3", children: [_jsxs("div", { className: `w-5 h-5 rounded-full flex items-center justify-center ${vaccine.status === "completed"
                                                                ? "bg-primary text-white"
                                                                : vaccine.status === "scheduled"
                                                                    ? "bg-accent/20"
                                                                    : "bg-muted/20"}`, children: [vaccine.status === "completed" && (_jsx(Check, { className: "w-3 h-3" })), vaccine.status === "scheduled" && (_jsx(Clock, { className: "w-3 h-3 text-accent" }))] }), _jsxs("div", { children: [_jsx("p", { className: "text-sm", children: vaccine.name }), vaccine.date && (_jsx("p", { className: "text-xs text-muted-foreground", children: vaccine.date }))] })] }), _jsx("span", { className: `text-xs px-2 py-1 rounded-full ${vaccine.status === "completed"
                                                        ? "bg-primary/10 text-primary"
                                                        : vaccine.status === "scheduled"
                                                            ? "bg-accent/10 text-accent"
                                                            : "bg-muted/10 text-muted-foreground"}`, children: vaccine.status === "completed"
                                                        ? "Completo"
                                                        : vaccine.status === "scheduled"
                                                            ? "Agendado"
                                                            : "Pendente" })] }, vaccine.name))) })] }, index))) }), _jsxs(motion.div, { initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.3, delay: 0.3 }, className: "p-6 rounded-3xl border border-border/50 bg-card/50", children: [_jsxs("h3", { className: "font-serif text-lg mb-4 flex items-center gap-2", children: [_jsx(TrendingUp, { className: "w-5 h-5 text-primary" }), "Crescimento"] }), _jsx("div", { className: "overflow-x-auto", children: _jsxs("table", { className: "w-full text-sm", children: [_jsx("thead", { children: _jsxs("tr", { className: "border-b border-border/30", children: [_jsx("th", { className: "text-left py-2 text-muted-foreground", children: "Idade" }), _jsx("th", { className: "text-right py-2 text-muted-foreground", children: "Peso (kg)" }), _jsx("th", { className: "text-right py-2 text-muted-foreground", children: "Altura (cm)" })] }) }), _jsx("tbody", { children: growthData.map((row) => (_jsxs("tr", { className: "border-b border-border/10 hover:bg-muted/10", children: [_jsx("td", { className: "py-2", children: row.age }), _jsx("td", { className: "text-right", children: row.weight }), _jsx("td", { className: "text-right", children: row.height })] }, row.age))) })] }) })] })] }) })] }));
}
