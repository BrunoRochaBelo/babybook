import { useState } from "react";
import {
  ArrowLeft,
  Upload,
  Video,
  Mic,
  Image as ImageIcon,
  X,
  Check,
} from "lucide-react";
import { motion } from "motion/react";
import { toast } from "sonner";

interface MomentFormProps {
  momentTitle: string;
  momentDescription?: string;
  babyName: string;
  isRecurrent?: boolean;
  onBack: () => void;
  onSave: () => void;
}

export function MomentForm({
  momentTitle,
  momentDescription,
  babyName,
  isRecurrent = false,
  onBack,
  onSave,
}: MomentFormProps) {
  const [date, setDate] = useState("");
  const [story, setStory] = useState("");
  const [uploadedFiles, setUploadedFiles] = useState<
    { type: string; name: string }[]
  >([]);

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

  const handleFileUpload = (type: string) => {
    setUploadedFiles([
      ...uploadedFiles,
      { type, name: `${type}-${Date.now()}` },
    ]);
    const typeLabel =
      type === "video" ? "Vídeo" : type === "audio" ? "Áudio" : "Foto";
    toast.success(`${typeLabel} adicionado!`);
  };

  const removeFile = (index: number) => {
    setUploadedFiles(uploadedFiles.filter((_, i) => i !== index));
    toast.success("Arquivo removido");
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header - Sticky */}
      <div className="sticky top-0 z-10 bg-card/95 backdrop-blur-sm border-b border-border">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <button
            onClick={onBack}
            className="mb-3 -ml-2 h-9 flex items-center gap-2 hover:opacity-80 transition-opacity text-foreground"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar
          </button>
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl sm:text-3xl mb-1 sm:mb-2 font-serif">
                {momentTitle}
              </h1>
              <p className="text-xs sm:text-sm text-muted-foreground">
                {momentDescription}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-6 sm:py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="space-y-6"
        >
          {/* Date Input */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Data do Momento *
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-4 py-3 rounded-2xl border border-border bg-card text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          {/* Story Textarea */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Conte a história deste momento
            </label>
            <textarea
              value={story}
              onChange={(e) => setStory(e.target.value)}
              placeholder="Descreva seus sentimentos, detalhes importantes, o que tornou este momento especial..."
              className="w-full px-4 py-3 rounded-2xl border border-border bg-card text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary min-h-[150px] resize-none"
            />
          </div>

          {/* File Upload Section */}
          <div className="space-y-4">
            <h3 className="font-medium text-foreground">Mídia (opcional)</h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <button
                onClick={() => handleFileUpload("photo")}
                className="p-4 border-2 border-dashed border-primary/30 rounded-2xl hover:bg-primary/5 transition-colors flex flex-col items-center gap-2 text-foreground"
              >
                <ImageIcon className="w-5 h-5 text-primary" />
                <span className="text-sm">Adicionar Foto</span>
              </button>

              <button
                onClick={() => handleFileUpload("video")}
                className="p-4 border-2 border-dashed border-primary/30 rounded-2xl hover:bg-primary/5 transition-colors flex flex-col items-center gap-2 text-foreground"
              >
                <Video className="w-5 h-5 text-primary" />
                <span className="text-sm">Adicionar Vídeo</span>
              </button>

              <button
                onClick={() => handleFileUpload("audio")}
                className="p-4 border-2 border-dashed border-primary/30 rounded-2xl hover:bg-primary/5 transition-colors flex flex-col items-center gap-2 text-foreground"
              >
                <Mic className="w-5 h-5 text-primary" />
                <span className="text-sm">Adicionar Áudio</span>
              </button>
            </div>

            {/* Uploaded Files */}
            {uploadedFiles.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  {uploadedFiles.length} arquivo(s) adicionado(s)
                </p>
                {uploadedFiles.map((file, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="flex items-center justify-between p-3 bg-primary/5 border border-primary/20 rounded-xl"
                  >
                    <div className="flex items-center gap-2">
                      {file.type === "photo" && (
                        <ImageIcon className="w-4 h-4 text-primary" />
                      )}
                      {file.type === "video" && (
                        <Video className="w-4 h-4 text-primary" />
                      )}
                      {file.type === "audio" && (
                        <Mic className="w-4 h-4 text-primary" />
                      )}
                      <span className="text-sm font-medium">{file.name}</span>
                    </div>
                    <button
                      onClick={() => removeFile(index)}
                      className="p-1 hover:bg-primary/20 rounded-lg transition-colors"
                    >
                      <X className="w-4 h-4 text-foreground/60" />
                    </button>
                  </motion.div>
                ))}
              </div>
            )}
          </div>

          {/* Recurrent Info */}
          {isRecurrent && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="p-4 bg-accent/10 border border-accent/30 rounded-2xl"
            >
              <p className="text-sm text-foreground/80">
                ℹ️ Este é um momento recorrente. Você pode registrá-lo várias
                vezes ao longo do tempo.
              </p>
            </motion.div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <button
              onClick={onBack}
              className="flex-1 px-6 py-3 border border-border text-foreground rounded-xl hover:bg-muted transition-colors font-medium"
            >
              Cancelar
            </button>
            <button
              onClick={handleSave}
              className="flex-1 px-6 py-3 bg-primary hover:bg-primary/90 text-white rounded-xl transition-colors font-medium flex items-center justify-center gap-2"
            >
              <Check className="w-4 h-4" />
              Guardar Momento
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
