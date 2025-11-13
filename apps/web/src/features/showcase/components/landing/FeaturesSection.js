import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Card } from "../ui/card";
import { Video, Mic, Camera, Heart } from "lucide-react";
import { motion } from "motion/react";
const features = [
    { icon: Video, title: "Vídeos Ilimitados", description: "Primeiras palavras, primeiros passos, momentos únicos" },
    { icon: Mic, title: "Áudios Preciosos", description: "A risada, o choro, as canções de ninar" },
    { icon: Camera, title: "Fotos Organizadas", description: "Por data, capítulo e marco de desenvolvimento" },
    { icon: Heart, title: "Livro de Visitas", description: "Mensagens e votos de amigos e familiares" }
];
export function FeaturesSection() {
    return (_jsx("section", { className: "py-20 px-4 bg-gradient-to-br from-secondary/20 to-accent/20", children: _jsxs("div", { className: "max-w-6xl mx-auto", children: [_jsx("h2", { className: "text-4xl text-center mb-6", children: "Guarde o que importa" }), _jsx("p", { className: "text-xl text-center text-muted-foreground mb-16 max-w-2xl mx-auto", children: "Organize mem\u00F3rias em cap\u00EDtulos emocionantes da jornada do seu beb\u00EA" }), _jsx("div", { className: "grid md:grid-cols-2 gap-6", children: features.map((item, i) => (_jsx(motion.div, { initial: { opacity: 0, x: i % 2 === 0 ? -20 : 20 }, whileInView: { opacity: 1, x: 0 }, transition: { duration: 0.5 }, viewport: { once: true }, children: _jsxs(Card, { className: "p-6 flex items-start gap-4 hover:shadow-md transition-smooth", children: [_jsx("div", { className: "flex-shrink-0 w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center", children: _jsx(item.icon, { className: "w-6 h-6 text-primary" }) }), _jsxs("div", { children: [_jsx("h4", { className: "mb-2", children: item.title }), _jsx("p", { className: "text-muted-foreground", children: item.description })] })] }) }, i))) })] }) }));
}
