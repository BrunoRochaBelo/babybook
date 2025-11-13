import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { ArrowLeft, Video, Mic, Image as ImageIcon, X, Check, Info, Repeat } from "lucide-react";
import { Badge } from "./ui/badge";
import { RecurrentMomentExplainer } from "./RecurrentMomentExplainer";
import { motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";
import { Alert, AlertDescription } from "./ui/alert";
export function MomentForm({ momentTitle, momentDescription, babyName, isRecurrent = false, existingRecordsCount = 0, onBack, onSave }) {
    const [date, setDate] = useState("");
    const [story, setStory] = useState("");
    const [uploadedFiles, setUploadedFiles] = useState([]);
    const calculateAge = (birthDate, momentDate) => {
        // Mock calculation - in real app would use actual birth date
        return `${babyName} com 10 meses e 2 dias`;
    };
    const handleSave = () => {
        if (!date) {
            toast.error("Por favor, selecione a data do momento");
            return;
        }
        toast.success("✅ Momento registrado permanentemente!", {
            description: "Guardado com segurança no seu cofre",
            duration: 3000,
        });
        setTimeout(onSave, 1000);
    };
    const handleFileUpload = (type) => {
        // Simulate file upload
        setUploadedFiles([...uploadedFiles, { type, name: `${type}-${Date.now()}` }]);
        toast.success(`${type === 'video' ? 'Vídeo' : type === 'audio' ? 'Áudio' : 'Foto'} adicionado!`);
    };
    const removeFile = (index) => {
        setUploadedFiles(uploadedFiles.filter((_, i) => i !== index));
        toast.success("Arquivo removido");
    };
    return (_jsxs("div", { className: "min-h-screen bg-background pb-24", children: [_jsx("div", { className: "sticky top-0 z-10 bg-card/95 backdrop-blur-sm border-b border-border", children: _jsxs("div", { className: "max-w-4xl mx-auto px-4 py-4", children: [_jsxs(Button, { variant: "ghost", size: "sm", onClick: onBack, className: "mb-3 -ml-2 h-9", children: [_jsx(ArrowLeft, { className: "w-4 h-4 mr-2" }), "Voltar"] }), _jsx("div", { className: "flex items-start justify-between gap-3", children: _jsxs("div", { className: "flex-1", children: [_jsxs("div", { className: "flex items-center gap-2 mb-1 flex-wrap", children: [_jsx("h1", { className: "text-xl sm:text-2xl md:text-3xl line-clamp-2", children: momentTitle }), isRecurrent && (_jsxs(Badge, { variant: "secondary", className: "text-xs", children: [_jsx(Repeat, { className: "w-3 h-3 mr-1" }), "Recorrente"] }))] }), _jsx("p", { className: "text-xs sm:text-sm text-muted-foreground", children: isRecurrent
                                            ? existingRecordsCount > 0
                                                ? `Adicione mais um registro (você já tem ${existingRecordsCount})`
                                                : 'Este momento pode ser registrado múltiplas vezes'
                                            : 'Registre este momento especial para sempre' })] }) })] }) }), _jsx("div", { className: "max-w-4xl mx-auto px-4 py-6 sm:py-8", children: _jsxs(motion.div, { initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.5 }, children: [isRecurrent && (_jsx("div", { className: "mb-6", children: _jsx(RecurrentMomentExplainer, { momentTitle: momentTitle, existingCount: existingRecordsCount }) })), _jsx(Card, { className: "p-4 sm:p-6 md:p-8", children: _jsxs("div", { className: "space-y-6", children: [_jsxs("div", { children: [_jsx(Label, { htmlFor: "moment-date", className: "text-sm sm:text-base", children: "Quando aconteceu? *" }), _jsx(Input, { id: "moment-date", type: "date", value: date, onChange: (e) => setDate(e.target.value), className: "mt-2 h-12 rounded-xl bg-input-background" }), date && (_jsxs(motion.p, { initial: { opacity: 0, y: -5 }, animate: { opacity: 1, y: 0 }, className: "text-sm text-primary mt-2 flex items-center gap-1", children: [_jsx(Check, { className: "w-4 h-4" }), calculateAge("2024-04-10", date)] }))] }), _jsxs("div", { children: [_jsx(Label, { className: "text-sm sm:text-base", children: "Adicione Mem\u00F3rias" }), _jsx("p", { className: "text-xs sm:text-sm text-muted-foreground mb-3", children: "V\u00EDdeos, \u00E1udios e fotos deste momento" }), _jsxs("div", { className: "grid grid-cols-3 gap-2 sm:gap-3", children: [_jsxs("button", { onClick: () => handleFileUpload('video'), className: "aspect-square rounded-xl border-2 border-dashed border-border hover:border-primary hover:bg-primary/5 active:scale-95 transition-all flex flex-col items-center justify-center gap-1.5 sm:gap-2 p-3 sm:p-4", children: [_jsx(Video, { className: "w-6 h-6 sm:w-8 sm:h-8 text-muted-foreground" }), _jsxs("span", { className: "text-[10px] sm:text-xs text-muted-foreground text-center leading-tight", children: ["V\u00EDdeo", _jsx("br", { className: "hidden sm:inline" }), _jsx("span", { className: "hidden sm:inline", children: "(5min)" })] })] }), _jsxs("button", { onClick: () => handleFileUpload('audio'), className: "aspect-square rounded-xl border-2 border-dashed border-border hover:border-primary hover:bg-primary/5 active:scale-95 transition-all flex flex-col items-center justify-center gap-1.5 sm:gap-2 p-3 sm:p-4", children: [_jsx(Mic, { className: "w-6 h-6 sm:w-8 sm:h-8 text-muted-foreground" }), _jsxs("span", { className: "text-[10px] sm:text-xs text-muted-foreground text-center leading-tight", children: ["\u00C1udio", _jsx("br", { className: "hidden sm:inline" }), _jsx("span", { className: "hidden sm:inline", children: "(3min)" })] })] }), _jsxs("button", { onClick: () => handleFileUpload('photo'), className: "aspect-square rounded-xl border-2 border-dashed border-border hover:border-primary hover:bg-primary/5 active:scale-95 transition-all flex flex-col items-center justify-center gap-1.5 sm:gap-2 p-3 sm:p-4", children: [_jsx(ImageIcon, { className: "w-6 h-6 sm:w-8 sm:h-8 text-muted-foreground" }), _jsx("span", { className: "text-[10px] sm:text-xs text-muted-foreground text-center leading-tight", children: "Foto" })] })] }), uploadedFiles.length > 0 && (_jsx("div", { className: "mt-4 space-y-2", children: uploadedFiles.map((file, index) => (_jsxs(motion.div, { initial: { opacity: 0, scale: 0.95 }, animate: { opacity: 1, scale: 1 }, className: "flex items-center gap-3 p-3 bg-muted rounded-xl", children: [_jsxs("div", { className: "w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0", children: [file.type === 'video' && _jsx(Video, { className: "w-5 h-5 text-primary" }), file.type === 'audio' && _jsx(Mic, { className: "w-5 h-5 text-primary" }), file.type === 'photo' && _jsx(ImageIcon, { className: "w-5 h-5 text-primary" })] }), _jsxs("div", { className: "flex-1 min-w-0", children: [_jsxs("p", { className: "text-sm capitalize truncate", children: [file.type, " enviado"] }), _jsx("p", { className: "text-xs text-muted-foreground", children: "Pronto para salvar" })] }), _jsx(Button, { variant: "ghost", size: "icon", className: "rounded-full h-8 w-8 flex-shrink-0", onClick: () => removeFile(index), children: _jsx(X, { className: "w-4 h-4" }) })] }, index))) }))] }), _jsxs("div", { children: [_jsx(Label, { htmlFor: "story", className: "text-sm sm:text-base", children: "Conte a hist\u00F3ria (opcional)" }), _jsx("p", { className: "text-xs sm:text-sm text-muted-foreground mb-2", children: "Descreva o que tornou este momento especial" }), _jsx(Textarea, { id: "story", value: story, onChange: (e) => setStory(e.target.value), placeholder: "Era uma tarde ensolarada quando...", className: "mt-2 min-h-28 sm:min-h-32 rounded-xl bg-input-background resize-none" })] }), _jsxs(Alert, { className: "bg-secondary/20 border-secondary/30", children: [_jsx(Info, { className: "h-4 w-4 text-secondary-foreground" }), _jsxs(AlertDescription, { className: "text-xs sm:text-sm", children: [_jsx("strong", { children: "Dica:" }), " Voc\u00EA pode adicionar mais detalhes depois. O importante \u00E9 registrar o momento enquanto est\u00E1 fresco na mem\u00F3ria."] })] })] }) })] }) }), _jsx("div", { className: "fixed bottom-0 left-0 right-0 bg-card/95 backdrop-blur-sm border-t border-border shadow-lg safe-area-inset-bottom", children: _jsxs("div", { className: "max-w-4xl mx-auto px-4 py-3 sm:py-4", children: [_jsxs(Button, { onClick: handleSave, disabled: !date, className: "w-full h-12 sm:h-14 rounded-2xl bg-primary hover:bg-primary/90 transition-smooth disabled:opacity-50", children: [_jsx(Check, { className: "w-5 h-5 mr-2" }), _jsx("span", { className: "text-sm sm:text-base", children: "Salvar Momento Permanentemente" })] }), !date && (_jsx("p", { className: "text-xs text-center text-muted-foreground mt-2", children: "Selecione a data para continuar" }))] }) })] }));
}
