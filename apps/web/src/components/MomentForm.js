import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from "react";
import { ArrowLeft, Video, Mic, Image as ImageIcon, X, Check, } from "lucide-react";
import { motion } from "motion/react";
import { toast } from "sonner";
export function MomentForm({ momentTitle, momentDescription, babyName, isRecurrent = false, onBack, onSave, }) {
    const [date, setDate] = useState("");
    const [story, setStory] = useState("");
    const [uploadedFiles, setUploadedFiles] = useState([]);
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
        setUploadedFiles([
            ...uploadedFiles,
            { type, name: `${type}-${Date.now()}` },
        ]);
        const typeLabel = type === "video" ? "Vídeo" : type === "audio" ? "Áudio" : "Foto";
        toast.success(`${typeLabel} adicionado!`);
    };
    const removeFile = (index) => {
        setUploadedFiles(uploadedFiles.filter((_, i) => i !== index));
        toast.success("Arquivo removido");
    };
    return (_jsxs("div", { className: "min-h-screen bg-background pb-24", children: [_jsx("div", { className: "sticky top-0 z-10 bg-card/95 backdrop-blur-sm border-b border-border", children: _jsxs("div", { className: "max-w-4xl mx-auto px-4 py-4", children: [_jsxs("button", { onClick: onBack, className: "mb-3 -ml-2 h-9 flex items-center gap-2 hover:opacity-80 transition-opacity text-foreground", children: [_jsx(ArrowLeft, { className: "w-4 h-4" }), "Voltar"] }), _jsx("div", { className: "flex items-start justify-between gap-3", children: _jsxs("div", { className: "flex-1 min-w-0", children: [_jsx("h1", { className: "text-2xl sm:text-3xl mb-1 sm:mb-2 font-serif", children: momentTitle }), _jsx("p", { className: "text-xs sm:text-sm text-muted-foreground", children: momentDescription })] }) })] }) }), _jsx("div", { className: "max-w-4xl mx-auto px-4 py-6 sm:py-8", children: _jsxs(motion.div, { initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.3 }, className: "space-y-6", children: [_jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-foreground mb-2", children: "Data do Momento *" }), _jsx("input", { type: "date", value: date, onChange: (e) => setDate(e.target.value), className: "w-full px-4 py-3 rounded-2xl border border-border bg-card text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary" })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-foreground mb-2", children: "Conte a hist\u00F3ria deste momento" }), _jsx("textarea", { value: story, onChange: (e) => setStory(e.target.value), placeholder: "Descreva seus sentimentos, detalhes importantes, o que tornou este momento especial...", className: "w-full px-4 py-3 rounded-2xl border border-border bg-card text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary min-h-[150px] resize-none" })] }), _jsxs("div", { className: "space-y-4", children: [_jsx("h3", { className: "font-medium text-foreground", children: "M\u00EDdia (opcional)" }), _jsxs("div", { className: "grid grid-cols-1 sm:grid-cols-3 gap-3", children: [_jsxs("button", { onClick: () => handleFileUpload("photo"), className: "p-4 border-2 border-dashed border-primary/30 rounded-2xl hover:bg-primary/5 transition-colors flex flex-col items-center gap-2 text-foreground", children: [_jsx(ImageIcon, { className: "w-5 h-5 text-primary" }), _jsx("span", { className: "text-sm", children: "Adicionar Foto" })] }), _jsxs("button", { onClick: () => handleFileUpload("video"), className: "p-4 border-2 border-dashed border-primary/30 rounded-2xl hover:bg-primary/5 transition-colors flex flex-col items-center gap-2 text-foreground", children: [_jsx(Video, { className: "w-5 h-5 text-primary" }), _jsx("span", { className: "text-sm", children: "Adicionar V\u00EDdeo" })] }), _jsxs("button", { onClick: () => handleFileUpload("audio"), className: "p-4 border-2 border-dashed border-primary/30 rounded-2xl hover:bg-primary/5 transition-colors flex flex-col items-center gap-2 text-foreground", children: [_jsx(Mic, { className: "w-5 h-5 text-primary" }), _jsx("span", { className: "text-sm", children: "Adicionar \u00C1udio" })] })] }), uploadedFiles.length > 0 && (_jsxs("div", { className: "space-y-2", children: [_jsxs("p", { className: "text-sm text-muted-foreground", children: [uploadedFiles.length, " arquivo(s) adicionado(s)"] }), uploadedFiles.map((file, index) => (_jsxs(motion.div, { initial: { opacity: 0, x: -20 }, animate: { opacity: 1, x: 0 }, className: "flex items-center justify-between p-3 bg-primary/5 border border-primary/20 rounded-xl", children: [_jsxs("div", { className: "flex items-center gap-2", children: [file.type === "photo" && (_jsx(ImageIcon, { className: "w-4 h-4 text-primary" })), file.type === "video" && (_jsx(Video, { className: "w-4 h-4 text-primary" })), file.type === "audio" && (_jsx(Mic, { className: "w-4 h-4 text-primary" })), _jsx("span", { className: "text-sm font-medium", children: file.name })] }), _jsx("button", { onClick: () => removeFile(index), className: "p-1 hover:bg-primary/20 rounded-lg transition-colors", children: _jsx(X, { className: "w-4 h-4 text-foreground/60" }) })] }, index)))] }))] }), isRecurrent && (_jsx(motion.div, { initial: { opacity: 0 }, animate: { opacity: 1 }, className: "p-4 bg-accent/10 border border-accent/30 rounded-2xl", children: _jsx("p", { className: "text-sm text-foreground/80", children: "\u2139\uFE0F Este \u00E9 um momento recorrente. Voc\u00EA pode registr\u00E1-lo v\u00E1rias vezes ao longo do tempo." }) })), _jsxs("div", { className: "flex gap-3 pt-4", children: [_jsx("button", { onClick: onBack, className: "flex-1 px-6 py-3 border border-border text-foreground rounded-xl hover:bg-muted transition-colors font-medium", children: "Cancelar" }), _jsxs("button", { onClick: handleSave, className: "flex-1 px-6 py-3 bg-primary hover:bg-primary/90 text-white rounded-xl transition-colors font-medium flex items-center justify-center gap-2", children: [_jsx(Check, { className: "w-4 h-4" }), "Guardar Momento"] })] })] }) })] }));
}
