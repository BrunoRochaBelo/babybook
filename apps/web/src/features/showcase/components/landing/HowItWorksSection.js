import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Card } from "../ui/card";
import { BookHeart, Camera, Lock } from "lucide-react";
import { motion } from "motion/react";
const steps = [
    {
        icon: BookHeart,
        title: "Crie o Livro",
        description: "Configure o livro do seu bebê com nome, data de nascimento e personalize a experiência."
    },
    {
        icon: Camera,
        title: "Registre Momentos",
        description: "Capture vídeos, áudios e fotos organizados por capítulos: primeiras vezes, marcos, descobertas."
    },
    {
        icon: Lock,
        title: "Guarde para Sempre",
        description: "Seus dados seguros, acessíveis quando quiser. Exporte tudo ao final de 5 anos."
    }
];
export function HowItWorksSection() {
    return (_jsx("section", { className: "py-20 px-4 bg-white", children: _jsxs("div", { className: "max-w-6xl mx-auto", children: [_jsx("h2", { className: "text-4xl text-center mb-16", children: "Como funciona?" }), _jsx("div", { className: "grid md:grid-cols-3 gap-8", children: steps.map((item, i) => (_jsx(motion.div, { initial: { opacity: 0, y: 20 }, whileInView: { opacity: 1, y: 0 }, transition: { duration: 0.5, delay: i * 0.1 }, viewport: { once: true }, children: _jsxs(Card, { className: "p-8 text-center hover:shadow-lg transition-smooth border-border", children: [_jsx("div", { className: "inline-flex items-center justify-center w-16 h-16 rounded-full bg-secondary/30 mb-6", children: _jsx(item.icon, { className: "w-8 h-8 text-primary" }) }), _jsx("h3", { className: "mb-4", children: item.title }), _jsx("p", { className: "text-muted-foreground", children: item.description })] }) }, i))) })] }) }));
}
