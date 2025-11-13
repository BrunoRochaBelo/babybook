import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { Badge } from "./ui/badge";
import { Alert, AlertDescription } from "./ui/alert";
import { ArrowLeft, Plus, Check, Camera, Repeat, Info, Eye } from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import { MomentViewer } from "./MomentViewer";
import { RecurrentMomentPreview } from "./RecurrentMomentPreview";
import { getMomentsByChapter, getChapterById } from "../lib/chaptersData";
export function ChapterView({ chapterId, chapterTitle, babyName, onBack, onAddMoment }) {
    const [showRecurrentInfo, setShowRecurrentInfo] = useState(false);
    const [viewingMoment, setViewingMoment] = useState(null);
    // Get moments for this specific chapter
    const momentTemplates = getMomentsByChapter(chapterId);
    const chapter = getChapterById(chapterId);
    // Mock data - in production would come from backend
    // Transform moment templates into moments with status
    const moments = momentTemplates.map(template => {
        // Mock: some moments are completed, some pending
        const mockCompleted = ['first-photo', 'going-home'];
        const mockRecurrent = ['visitors'];
        if (mockCompleted.includes(template.id)) {
            return {
                ...template,
                status: 'completed',
                thumbnail: "https://images.unsplash.com/photo-1761891950459-bc48f5bf026d?w=400",
                date: "10/02/2024",
                records: [
                    {
                        id: `${template.id}-1`,
                        date: "2024-02-10",
                        story: "Um momento especial registrado com muito carinho.",
                        media: [
                            { type: 'photo', url: '#', thumbnail: "https://images.unsplash.com/photo-1761891950459-bc48f5bf026d?w=400" }
                        ],
                        ageAtMoment: `${babyName} com poucos dias`
                    }
                ]
            };
        }
        else if (mockRecurrent.includes(template.id)) {
            return {
                ...template,
                status: 'recurrent',
                count: 3,
                records: [
                    {
                        id: `${template.id}-1`,
                        date: "2024-02-13",
                        story: "Primeira vez deste momento especial.",
                        media: [{ type: 'photo', url: '#' }],
                        ageAtMoment: `${babyName} com 3 dias`
                    },
                    {
                        id: `${template.id}-2`,
                        date: "2024-02-15",
                        story: "Segunda vez deste momento memorável.",
                        media: [{ type: 'photo', url: '#' }],
                        ageAtMoment: `${babyName} com 5 dias`
                    },
                    {
                        id: `${template.id}-3`,
                        date: "2024-02-20",
                        story: "Terceira vez, sempre especial.",
                        media: [{ type: 'photo', url: '#' }],
                        ageAtMoment: `${babyName} com 10 dias`
                    }
                ]
            };
        }
        else {
            return {
                ...template,
                status: 'pending'
            };
        }
    });
    const completedCount = moments.filter(m => m.status === 'completed').length;
    const recurrentCount = moments.filter(m => m.status === 'recurrent').length;
    const hasRecurrent = recurrentCount > 0;
    const handleMomentClick = (moment) => {
        if (moment.status === 'pending') {
            // Open form to add new moment
            onAddMoment(moment.id);
        }
        else {
            // Open viewer to see existing records
            setViewingMoment(moment);
        }
    };
    const handleViewerBack = () => {
        setViewingMoment(null);
    };
    const handleViewerAddNew = () => {
        if (viewingMoment) {
            onAddMoment(viewingMoment.id);
        }
    };
    const handleViewerEdit = (recordId) => {
        // In a real app, would pass recordId to edit specific record
        if (viewingMoment) {
            onAddMoment(viewingMoment.id);
        }
    };
    // If viewing a moment, show the viewer
    if (viewingMoment && viewingMoment.records && viewingMoment.records.length > 0) {
        return (_jsx(MomentViewer, { momentTitle: viewingMoment.title, momentDescription: viewingMoment.description, isRecurrent: viewingMoment.status === 'recurrent', records: viewingMoment.records, babyName: babyName, onBack: handleViewerBack, onEdit: handleViewerEdit, onAddNew: handleViewerAddNew }));
    }
    return (_jsxs("div", { className: "min-h-screen bg-background pb-20", children: [_jsx("div", { className: "sticky top-0 z-10 bg-card/80 backdrop-blur-xl border-b border-border/50 shadow-sm", children: _jsxs("div", { className: "max-w-4xl mx-auto px-4 py-5", children: [_jsxs(Button, { variant: "ghost", size: "sm", onClick: onBack, className: "mb-4 -ml-2 h-9 rounded-xl hover:bg-muted", children: [_jsx(ArrowLeft, { className: "w-4 h-4 mr-2" }), "Voltar"] }), chapter && (_jsxs("div", { className: "flex items-center gap-3 mb-3", children: [_jsx("div", { className: `w-12 h-12 rounded-2xl ${chapter.color} flex items-center justify-center shadow-sm`, children: _jsx(chapter.icon, { className: "w-6 h-6" }) }), _jsxs("div", { children: [_jsx("h1", { className: "text-2xl sm:text-3xl mb-1", children: chapterTitle }), _jsx("p", { className: "text-sm text-muted-foreground", children: chapter.description })] })] })), _jsxs("div", { className: "flex items-center gap-2 flex-wrap", children: [_jsxs(Badge, { variant: "outline", className: "rounded-full", children: [completedCount, " de ", moments.length, " conclu\u00EDdos"] }), hasRecurrent && (_jsxs(Badge, { variant: "secondary", className: "text-xs rounded-full", children: [_jsx(Repeat, { className: "w-3 h-3 mr-1" }), recurrentCount, " recorrente", recurrentCount > 1 ? 's' : ''] }))] })] }) }), _jsxs("div", { className: "max-w-4xl mx-auto px-4 py-6 sm:py-8", children: [hasRecurrent && !showRecurrentInfo && (_jsx(motion.div, { initial: { opacity: 0, y: -10 }, animate: { opacity: 1, y: 0 }, className: "mb-6", children: _jsxs(Alert, { className: "bg-accent/10 border-accent/30", children: [_jsx(Info, { className: "h-4 w-4 text-accent" }), _jsxs(AlertDescription, { className: "flex items-start justify-between gap-2", children: [_jsx("div", { className: "flex-1", children: _jsxs("p", { className: "text-sm", children: [_jsx("strong", { children: "Momentos Recorrentes" }), " podem ser registrados m\u00FAltiplas vezes. Ideal para eventos que se repetem!"] }) }), _jsx(Button, { variant: "ghost", size: "sm", className: "h-auto p-0 text-accent hover:text-accent hover:bg-transparent underline", onClick: () => setShowRecurrentInfo(true), children: "Entendi" })] })] }) })), _jsx("div", { className: "space-y-3", children: moments.map((moment, index) => (_jsx(motion.div, { initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.3, delay: index * 0.03 }, children: _jsx(Card, { className: `p-5 cursor-pointer transition-all duration-300 border-border/50 rounded-2xl ${moment.status === 'completed'
                                    ? 'hover:shadow-lg hover:scale-[1.01] active:scale-[0.99] bg-card/50'
                                    : 'hover:shadow-xl hover:border-primary/30 hover:scale-[1.01] active:scale-[0.99]'}`, onClick: () => handleMomentClick(moment), children: _jsxs("div", { className: "flex items-center gap-4", children: [_jsx("div", { className: "flex-shrink-0", children: moment.status === 'completed' ? (_jsx(motion.div, { className: "w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center shadow-sm", whileHover: { scale: 1.05 }, children: _jsx(Check, { className: "w-6 h-6 text-primary" }) })) : moment.status === 'recurrent' ? (_jsxs("div", { className: "relative", children: [_jsx(motion.div, { className: "w-12 h-12 rounded-2xl bg-accent/10 flex items-center justify-center shadow-sm", whileHover: { scale: 1.05 }, children: _jsx(Repeat, { className: "w-6 h-6 text-accent" }) }), moment.count && moment.count > 0 && (_jsx(motion.div, { initial: { scale: 0 }, animate: { scale: 1 }, className: "absolute -top-1 -right-1 w-5 h-5 rounded-full bg-accent text-white flex items-center justify-center text-xs shadow-md", children: moment.count }))] })) : (_jsx("div", { className: "w-12 h-12 rounded-2xl border-2 border-dashed border-border/50 flex items-center justify-center hover:border-primary/30 transition-colors", children: _jsx(Camera, { className: "w-6 h-6 text-muted-foreground" }) })) }), moment.thumbnail && (_jsx("div", { className: "flex-shrink-0 w-16 h-16 rounded-2xl overflow-hidden shadow-sm", children: _jsx("img", { src: moment.thumbnail, alt: moment.title, className: "w-full h-full object-cover" }) })), _jsxs("div", { className: "flex-1 min-w-0", children: [_jsxs("div", { className: "flex items-start gap-2 mb-1", children: [_jsx("h4", { className: `${moment.status === 'completed' ? 'text-muted-foreground' : ''} text-sm sm:text-base`, children: moment.title }), moment.status === 'recurrent' && (_jsx(Badge, { variant: "secondary", className: "text-[10px] sm:text-xs flex-shrink-0", children: "Recorrente" }))] }), _jsx("p", { className: "text-xs sm:text-sm text-muted-foreground line-clamp-1", children: moment.description }), moment.date && (_jsxs("p", { className: "text-xs text-primary mt-1", children: ["Registrado em ", moment.date] })), moment.status === 'recurrent' && (_jsx(_Fragment, { children: moment.count && moment.count > 0 ? (_jsxs(_Fragment, { children: [_jsxs("p", { className: "text-xs text-accent mt-1", children: [moment.count, " ", moment.count === 1 ? 'registro' : 'registros', " \u2022 Toque para ver", moment.count === 1 ? ' e adicionar mais' : ''] }), moment.records && moment.records.length > 0 && (_jsx(RecurrentMomentPreview, { records: moment.records.map(r => ({
                                                                    id: r.id,
                                                                    date: r.date,
                                                                    mediaCount: r.media.length,
                                                                    hasStory: !!r.story
                                                                })), maxVisible: 2 }))] })) : (_jsx("p", { className: "text-xs text-accent mt-1", children: "Momento recorrente \u2022 Toque para come\u00E7ar" })) }))] }), _jsx("div", { className: "flex-shrink-0 hidden xs:block", children: moment.status === 'completed' ? (_jsxs(Button, { variant: "ghost", size: "sm", className: "rounded-xl h-9 px-3 gap-1", onClick: (e) => {
                                                    e.stopPropagation();
                                                    handleMomentClick(moment);
                                                }, children: [_jsx(Eye, { className: "w-4 h-4" }), _jsx("span", { className: "hidden sm:inline", children: "Ver" })] })) : moment.status === 'recurrent' ? (_jsxs(Button, { variant: "outline", size: "sm", className: "rounded-xl h-9 px-3 sm:px-4 border-accent text-accent hover:bg-accent/10", onClick: (e) => {
                                                    e.stopPropagation();
                                                    handleMomentClick(moment);
                                                }, children: [_jsx(Eye, { className: "w-4 h-4 sm:mr-1" }), _jsxs("span", { className: "hidden sm:inline", children: ["Ver ", moment.count] })] })) : (_jsxs(Button, { size: "sm", className: "rounded-xl bg-primary hover:bg-primary/90 h-9 px-3 sm:px-4", onClick: (e) => {
                                                    e.stopPropagation();
                                                    handleMomentClick(moment);
                                                }, children: [_jsx(Plus, { className: "w-4 h-4 sm:mr-1" }), _jsx("span", { className: "hidden sm:inline", children: "Registrar" })] })) })] }) }) }, moment.id))) }), completedCount === 0 && (_jsx(motion.div, { initial: { opacity: 0 }, animate: { opacity: 1 }, transition: { delay: 0.5 }, className: "mt-6 sm:mt-8", children: _jsxs(Card, { className: "p-6 sm:p-8 text-center bg-gradient-to-br from-primary/5 to-accent/5 border-primary/20", children: [_jsx(Repeat, { className: "w-12 h-12 text-primary mx-auto mb-4" }), _jsx("h3", { className: "mb-2", children: "Comece registrando o primeiro momento" }), _jsx("p", { className: "text-sm sm:text-base text-muted-foreground", children: "Cada detalhe \u00E9 precioso. N\u00E3o tenha pressa, v\u00E1 no seu ritmo. \uD83D\uDC9B" })] }) })), hasRecurrent && (_jsx(motion.div, { initial: { opacity: 0 }, animate: { opacity: 1 }, transition: { delay: 0.6 }, className: "mt-6 sm:mt-8", children: _jsx(Card, { className: "p-4 sm:p-6 bg-accent/5 border-accent/20", children: _jsxs("div", { className: "flex gap-3 sm:gap-4", children: [_jsx("div", { className: "flex-shrink-0", children: _jsx("div", { className: "w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-accent/20 flex items-center justify-center", children: _jsx(Repeat, { className: "w-5 h-5 sm:w-6 sm:h-6 text-accent" }) }) }), _jsxs("div", { className: "flex-1", children: [_jsx("h4", { className: "mb-2 text-sm sm:text-base", children: "O que s\u00E3o momentos recorrentes?" }), _jsx("p", { className: "text-xs sm:text-sm text-muted-foreground mb-3", children: "Alguns momentos acontecem mais de uma vez! Por exemplo, as visitas de familiares ou amigos. Voc\u00EA pode registrar cada visita separadamente, criando uma cole\u00E7\u00E3o de mem\u00F3rias do mesmo tipo de evento." }), _jsxs("div", { className: "flex items-center gap-2 text-xs sm:text-sm text-accent", children: [_jsx(Plus, { className: "w-4 h-4" }), _jsx("span", { children: "Toque em um momento recorrente para adicionar um novo registro" })] })] })] }) }) }))] })] }));
}
