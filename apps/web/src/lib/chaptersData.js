import { Baby, Heart, Star, Sparkles, Cake, Footprints } from "lucide-react";
export const chapters = [
    {
        id: "great-day",
        title: "O Grande Dia",
        description: "Nascimento e primeiras horas",
        icon: Baby,
        color: "bg-primary/10 text-primary",
    },
    {
        id: "first-month",
        title: "Primeiro Mês",
        description: "Adaptação e descobertas iniciais",
        icon: Heart,
        color: "bg-accent/10 text-accent",
    },
    {
        id: "milestones",
        title: "Marcos de Desenvolvimento",
        description: "Sorrisos, rolamentos, sentar...",
        icon: Star,
        color: "bg-secondary text-secondary-foreground",
    },
    {
        id: "first-times",
        title: "Primeiras Vezes",
        description: "Palavra, passo, comida sólida...",
        icon: Sparkles,
        color: "bg-primary/10 text-primary",
    },
    {
        id: "celebrations",
        title: "Celebrações",
        description: "Aniversários e marcos especiais",
        icon: Cake,
        color: "bg-accent/10 text-accent",
    },
    {
        id: "special-moments",
        title: "Momentos Especiais",
        description: "Viagens, brincadeiras, tudo mais",
        icon: Footprints,
        color: "bg-primary/10 text-primary",
    },
];
export const moments = {
    "great-day": [
        {
            id: "first-cry",
            title: "Primeiro choro",
            description: "O som que mudou tudo",
            isRecurrent: false,
            chapterId: "great-day",
        },
        {
            id: "first-hug",
            title: "Primeiro abraço",
            description: "Aquele momento mágico",
            isRecurrent: false,
            chapterId: "great-day",
        },
    ],
    "first-month": [
        {
            id: "first-smile",
            title: "Primeiro sorriso",
            description: "Que emoção!",
            isRecurrent: false,
            chapterId: "first-month",
        },
    ],
    milestones: [
        {
            id: "first-roll",
            title: "Primeiro rolamento",
            description: "Virou!",
            isRecurrent: true,
            chapterId: "milestones",
        },
        {
            id: "sit-up",
            title: "Sentou sozinho",
            description: "Já senta!",
            isRecurrent: false,
            chapterId: "milestones",
        },
    ],
    "first-times": [
        {
            id: "first-word",
            title: "Primeira palavra",
            description: "O primeiro 'papá' ou 'mamá'",
            isRecurrent: false,
            chapterId: "first-times",
        },
        {
            id: "first-step",
            title: "Primeiro passo",
            description: "Começou a andar!",
            isRecurrent: false,
            chapterId: "first-times",
        },
    ],
    celebrations: [
        {
            id: "1st-month",
            title: "Mesversário",
            description: "Celebrando cada mês",
            isRecurrent: true,
            chapterId: "celebrations",
        },
    ],
    "special-moments": [
        {
            id: "bath-time",
            title: "Hora do banho",
            description: "Momento de diversão",
            isRecurrent: true,
            chapterId: "special-moments",
        },
    ],
};
export function getMomentsByChapter(chapterId) {
    return moments[chapterId] || [];
}
