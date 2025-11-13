import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Badge } from "./ui/badge";
import { Progress } from "./ui/progress";
import { ArrowLeft, Syringe, TrendingUp, Check, Clock, Calendar, Plus } from "lucide-react";
import { motion } from "motion/react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts";
import { FloatingNav } from "./FloatingNav";
export function HealthModule({ babyName, onBack, onNavigate }) {
    // Mock growth data
    const growthData = [
        { age: "Nasc", weight: 3.2, height: 49, percentileWeight: 50, percentileHeight: 50 },
        { age: "1m", weight: 4.1, height: 53, percentileWeight: 55, percentileHeight: 52 },
        { age: "2m", weight: 5.3, height: 57, percentileWeight: 60, percentileHeight: 55 },
        { age: "3m", weight: 6.2, height: 60, percentileWeight: 62, percentileHeight: 58 },
        { age: "4m", weight: 6.8, height: 63, percentileWeight: 60, percentileHeight: 60 },
        { age: "6m", weight: 7.8, height: 67, percentileWeight: 58, percentileHeight: 62 },
        { age: "9m", weight: 8.9, height: 72, percentileWeight: 55, percentileHeight: 60 },
        { age: "10m", weight: 9.2, height: 74, percentileWeight: 54, percentileHeight: 58 }
    ];
    const vaccines = [
        {
            age: "Ao nascer",
            items: [
                { name: "BCG", status: "completed", date: "10/02/2024" },
                { name: "Hepatite B", status: "completed", date: "10/02/2024" }
            ]
        },
        {
            age: "2 meses",
            items: [
                { name: "Pentavalente (1ª dose)", status: "completed", date: "10/04/2024" },
                { name: "VIP (1ª dose)", status: "completed", date: "10/04/2024" },
                { name: "Rotavírus (1ª dose)", status: "completed", date: "10/04/2024" },
                { name: "Pneumocócica (1ª dose)", status: "completed", date: "10/04/2024" }
            ]
        },
        {
            age: "3 meses",
            items: [
                { name: "Meningocócica C (1ª dose)", status: "completed", date: "10/05/2024" }
            ]
        },
        {
            age: "4 meses",
            items: [
                { name: "Pentavalente (2ª dose)", status: "completed", date: "10/06/2024" },
                { name: "VIP (2ª dose)", status: "completed", date: "10/06/2024" },
                { name: "Rotavírus (2ª dose)", status: "completed", date: "10/06/2024" },
                { name: "Pneumocócica (2ª dose)", status: "completed", date: "10/06/2024" }
            ]
        },
        {
            age: "5 meses",
            items: [
                { name: "Meningocócica C (2ª dose)", status: "scheduled", date: "10/07/2024" }
            ]
        },
        {
            age: "6 meses",
            items: [
                { name: "Pentavalente (3ª dose)", status: "pending" },
                { name: "VIP (3ª dose)", status: "pending" },
                { name: "Influenza (1ª dose)", status: "pending" }
            ]
        }
    ];
    const totalVaccines = vaccines.reduce((acc, group) => acc + group.items.length, 0);
    const completedVaccines = vaccines.reduce((acc, group) => acc + group.items.filter(v => v.status === 'completed').length, 0);
    return (_jsxs("div", { className: "min-h-screen bg-background pb-20", children: [_jsx("div", { className: "sticky top-0 z-10 bg-card/95 backdrop-blur-sm border-b border-border", children: _jsxs("div", { className: "max-w-4xl mx-auto px-4 py-4 sm:py-6", children: [_jsxs(Button, { variant: "ghost", size: "sm", onClick: onBack, className: "mb-3 -ml-2 h-9", children: [_jsx(ArrowLeft, { className: "w-4 h-4 mr-2" }), "Voltar"] }), _jsxs("h1", { className: "text-2xl sm:text-3xl mb-2", children: ["Sa\u00FAde de ", babyName] }), _jsx("p", { className: "text-sm sm:text-base text-muted-foreground", children: "Acompanhe vacinas e crescimento" })] }) }), _jsx("div", { className: "max-w-4xl mx-auto px-4 py-6 sm:py-8", children: _jsxs(Tabs, { defaultValue: "vaccines", className: "space-y-4 sm:space-y-6", children: [_jsxs(TabsList, { className: "grid w-full grid-cols-2 h-11 sm:h-12 rounded-2xl", children: [_jsxs(TabsTrigger, { value: "vaccines", className: "rounded-xl text-sm sm:text-base", children: [_jsx(Syringe, { className: "w-4 h-4 mr-1 sm:mr-2" }), _jsx("span", { className: "hidden xs:inline", children: "Vacinas" }), _jsx("span", { className: "xs:hidden", children: "Vacina" })] }), _jsxs(TabsTrigger, { value: "growth", className: "rounded-xl text-sm sm:text-base", children: [_jsx(TrendingUp, { className: "w-4 h-4 mr-1 sm:mr-2" }), "Crescimento"] })] }), _jsxs(TabsContent, { value: "vaccines", className: "space-y-6", children: [_jsxs(Card, { className: "p-6", children: [_jsxs("div", { className: "flex items-center justify-between mb-4", children: [_jsxs("div", { children: [_jsx("h3", { className: "mb-1", children: "Calend\u00E1rio de Vacina\u00E7\u00E3o" }), _jsxs("p", { className: "text-sm text-muted-foreground", children: [completedVaccines, " de ", totalVaccines, " vacinas aplicadas"] })] }), _jsxs("div", { className: "text-right", children: [_jsxs("div", { className: "text-2xl text-primary", children: [Math.round((completedVaccines / totalVaccines) * 100), "%"] }), _jsx("div", { className: "text-xs text-muted-foreground", children: "Completo" })] })] }), _jsx(Progress, { value: (completedVaccines / totalVaccines) * 100, className: "h-2" })] }), _jsx("div", { className: "space-y-4", children: vaccines.map((group, index) => (_jsx(motion.div, { initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.3, delay: index * 0.05 }, children: _jsxs(Card, { className: "p-6", children: [_jsx("h4", { className: "mb-4", children: group.age }), _jsx("div", { className: "space-y-3", children: group.items.map((vaccine, vIndex) => (_jsxs("div", { className: "flex items-center gap-3 p-3 rounded-xl bg-muted/50", children: [_jsx("div", { className: "flex-shrink-0", children: vaccine.status === 'completed' ? (_jsx("div", { className: "w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center", children: _jsx(Check, { className: "w-5 h-5 text-primary" }) })) : vaccine.status === 'scheduled' ? (_jsx("div", { className: "w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center", children: _jsx(Calendar, { className: "w-5 h-5 text-accent" }) })) : (_jsx("div", { className: "w-10 h-10 rounded-full border-2 border-dashed border-border flex items-center justify-center", children: _jsx(Clock, { className: "w-5 h-5 text-muted-foreground" }) })) }), _jsxs("div", { className: "flex-1", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx("span", { className: vaccine.status === 'completed' ? 'text-muted-foreground' : '', children: vaccine.name }), vaccine.status === 'scheduled' && (_jsx(Badge, { variant: "secondary", className: "text-xs", children: "Agendada" }))] }), vaccine.date && (_jsxs("span", { className: "text-xs text-muted-foreground", children: [vaccine.status === 'completed' ? 'Aplicada' : 'Agendada', ": ", vaccine.date] }))] }), vaccine.status === 'pending' && (_jsx(Button, { size: "sm", variant: "outline", className: "rounded-xl", children: "Marcar" }))] }, vIndex))) })] }) }, index))) }), _jsxs(Card, { className: "p-6 text-center border-dashed", children: [_jsx(Syringe, { className: "w-12 h-12 text-muted-foreground mx-auto mb-4" }), _jsx("h4", { className: "mb-2", children: "Carteirinha de Vacina\u00E7\u00E3o" }), _jsx("p", { className: "text-sm text-muted-foreground mb-4", children: "Tire uma foto da carteirinha para manter tudo organizado" }), _jsxs(Button, { variant: "outline", className: "rounded-xl", children: [_jsx(Plus, { className: "w-4 h-4 mr-2" }), "Adicionar Foto da Carteirinha"] })] })] }), _jsxs(TabsContent, { value: "growth", className: "space-y-6", children: [_jsxs("div", { className: "grid md:grid-cols-2 gap-4", children: [_jsxs(Card, { className: "p-6", children: [_jsxs("div", { className: "flex items-center justify-between mb-2", children: [_jsx("span", { className: "text-sm text-muted-foreground", children: "Peso Atual" }), _jsx(TrendingUp, { className: "w-4 h-4 text-primary" })] }), _jsx("div", { className: "text-3xl mb-1", children: "9.2 kg" }), _jsx("div", { className: "text-xs text-muted-foreground", children: "Percentil 54 (OMS)" })] }), _jsxs(Card, { className: "p-6", children: [_jsxs("div", { className: "flex items-center justify-between mb-2", children: [_jsx("span", { className: "text-sm text-muted-foreground", children: "Altura Atual" }), _jsx(TrendingUp, { className: "w-4 h-4 text-primary" })] }), _jsx("div", { className: "text-3xl mb-1", children: "74 cm" }), _jsx("div", { className: "text-xs text-muted-foreground", children: "Percentil 58 (OMS)" })] })] }), _jsxs(Card, { className: "p-6", children: [_jsx("h4", { className: "mb-4", children: "Curva de Peso" }), _jsx(ResponsiveContainer, { width: "100%", height: 300, children: _jsxs(LineChart, { data: growthData, children: [_jsx(CartesianGrid, { strokeDasharray: "3 3", stroke: "#E5E7EB" }), _jsx(XAxis, { dataKey: "age", stroke: "#9CA3AF", style: { fontSize: '12px' } }), _jsx(YAxis, { stroke: "#9CA3AF", style: { fontSize: '12px' }, label: { value: 'kg', angle: -90, position: 'insideLeft' } }), _jsx(Tooltip, { contentStyle: {
                                                            backgroundColor: '#fff',
                                                            border: '1px solid #E5E7EB',
                                                            borderRadius: '8px'
                                                        } }), _jsx(ReferenceLine, { y: 5, stroke: "#E8845C", strokeDasharray: "3 3", label: "P50" }), _jsx(Line, { type: "monotone", dataKey: "weight", stroke: "#E8845C", strokeWidth: 3, dot: { fill: '#E8845C', r: 5 } })] }) })] }), _jsxs(Card, { className: "p-6", children: [_jsx("h4", { className: "mb-4", children: "Curva de Altura" }), _jsx(ResponsiveContainer, { width: "100%", height: 300, children: _jsxs(LineChart, { data: growthData, children: [_jsx(CartesianGrid, { strokeDasharray: "3 3", stroke: "#E5E7EB" }), _jsx(XAxis, { dataKey: "age", stroke: "#9CA3AF", style: { fontSize: '12px' } }), _jsx(YAxis, { stroke: "#9CA3AF", style: { fontSize: '12px' }, label: { value: 'cm', angle: -90, position: 'insideLeft' } }), _jsx(Tooltip, { contentStyle: {
                                                            backgroundColor: '#fff',
                                                            border: '1px solid #E5E7EB',
                                                            borderRadius: '8px'
                                                        } }), _jsx(ReferenceLine, { y: 60, stroke: "#C8D5C4", strokeDasharray: "3 3", label: "P50" }), _jsx(Line, { type: "monotone", dataKey: "height", stroke: "#C8D5C4", strokeWidth: 3, dot: { fill: '#C8D5C4', r: 5 } })] }) })] }), _jsxs(Button, { className: "w-full h-14 rounded-2xl bg-primary hover:bg-primary/90", children: [_jsx(Plus, { className: "w-5 h-5 mr-2" }), "Adicionar Nova Medi\u00E7\u00E3o"] })] })] }) }), onNavigate && (_jsx(FloatingNav, { activeSection: "health", onNavigate: onNavigate }))] }));
}
