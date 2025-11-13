import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { motion } from "motion/react";
import { Calendar } from "lucide-react";
export function RecurrentMomentPreview({ records, maxVisible = 2 }) {
    const displayRecords = records.slice(0, maxVisible);
    const formatDate = (dateStr) => {
        const date = new Date(dateStr);
        return date.toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: 'short'
        }).replace('.', '');
    };
    return (_jsxs("div", { className: "flex gap-2 mt-2 overflow-x-auto pb-1 scrollbar-hide", children: [displayRecords.map((record, index) => (_jsxs(motion.div, { initial: { opacity: 0, scale: 0.9 }, animate: { opacity: 1, scale: 1 }, transition: { delay: index * 0.05 }, className: "flex-shrink-0 px-2 py-1.5 bg-accent/10 border border-accent/20 rounded-lg flex items-center gap-1.5", children: [_jsx(Calendar, { className: "w-3 h-3 text-accent" }), _jsx("span", { className: "text-xs text-accent", children: formatDate(record.date) }), record.mediaCount > 0 && (_jsxs("div", { className: "flex items-center gap-0.5", children: [_jsx("div", { className: "w-px h-3 bg-accent/30" }), _jsx("span", { className: "text-xs text-accent/70", children: record.mediaCount })] }))] }, record.id))), records.length > maxVisible && (_jsx("div", { className: "flex-shrink-0 px-2 py-1.5 bg-muted/50 rounded-lg flex items-center", children: _jsxs("span", { className: "text-xs text-muted-foreground", children: ["+", records.length - maxVisible] }) }))] }));
}
