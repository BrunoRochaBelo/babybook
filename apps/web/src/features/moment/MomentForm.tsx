import { useState } from "react";
import {
  ArrowLeft,
  Video,
  Mic,
  Image as ImageIcon,
  X,
  Check,
  Info,
  Repeat,
} from "lucide-react";
import { motion } from "motion/react";
import { toast } from "sonner";

interface MomentFormProps {
  momentTitle: string;
  momentDescription?: string;
  babyName: string;
  isRecurrent?: boolean;
  existingRecordsCount?: number;
  onBack: () => void;
  onSave: () => void;
}

export function MomentForm({
  momentTitle,
  momentDescription,
  babyName,
  isRecurrent = false,
  existingRecordsCount = 0,
  onBack,
  onSave,
}: MomentFormProps) {
  const [date, setDate] = useState("");
  const [story, setStory] = useState("");
  const [uploadedFiles, setUploadedFiles] = useState<
    { type: string; name: string }[]
  >([]);

  const calculateAge = (birthDate: string, momentDate: string) => {
    return `${babyName} com 10 meses e 2 dias`;
  };

  const handleSave = () => {
    if (!date) {
      toast.error("Por favor, selecione a data");
      return;
    }

    toast.success("✨ Momento registrado! Já estamos preparando sua mídia.", {
      description: `O Grande Dia de ${babyName} fica guardado no santuário.`,
      duration: 3000,
    });
    setTimeout(onSave, 1000);
  };

  const handleFileUpload = (type: string) => {
    setUploadedFiles([
      ...uploadedFiles,
      { type, name: `${type}-${Date.now()}` },
    ]);
    const typeLabels = {
      video: "Vídeo adicionado! 🎬",
      audio: "Áudio adicionado! 🎤",
      photo: "Foto adicionada! 📸",
    };
    toast.success(
      typeLabels[type as keyof typeof typeLabels] || "Arquivo adicionado!",
    );
  };

  const removeFile = (index: number) => {
    setUploadedFiles(uploadedFiles.filter((_, i) => i !== index));
    toast.success("Arquivo removido");
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-card/95 backdrop-blur-sm border-b border-border">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <button
            onClick={onBack}
            className="mb-3 -ml-2 h-9 px-2 py-1.5 text-sm font-medium hover:bg-muted rounded-lg flex items-center gap-2 text-foreground"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar
          </button>
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <h1 className="text-2xl sm:text-3xl md:text-4xl font-serif line-clamp-2">
                  {momentTitle}
                </h1>
                {isRecurrent && (
                  <span className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-accent/20 text-accent rounded-full">
                    <Repeat className="w-3 h-3" />
                    Recorrente
                  </span>
                )}
              </div>
              <p className="text-xs sm:text-sm text-muted-foreground">
                {isRecurrent
                  ? existingRecordsCount > 0
                    ? `Adicione mais um registro (você já tem ${existingRecordsCount})`
                    : "Este momento pode ser registrado múltiplas vezes"
                  : "Registre este momento especial para sempre"}
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
          transition={{ duration: 0.5 }}
        >
          <div className="rounded-2xl border border-border bg-card p-4 sm:p-6 md:p-8">
            <div className="space-y-6">
              {/* Date */}
              <div>
                <label
                  htmlFor="moment-date"
                  className="text-sm sm:text-base font-medium block mb-2"
                >
                  Quando aconteceu? *
                </label>
                <input
                  id="moment-date"
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full h-12 rounded-xl bg-muted px-4 border border-border text-foreground"
                />
                {date && (
                  <motion.p
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-sm text-primary mt-2 flex items-center gap-1"
                  >
                    <Check className="w-4 h-4" />
                    {calculateAge("2024-04-10", date)}
                  </motion.p>
                )}
              </div>

              {/* Media Upload */}
              <div>
                <label className="text-sm sm:text-base font-medium block mb-2 font-serif">
                  Memórias Deste Momento
                </label>
                <p className="text-xs sm:text-sm text-muted-foreground mb-3">
                  Vídeos, áudios e fotos — tudo que tornar este momento mais
                  vivo
                </p>

                <div className="grid grid-cols-3 gap-2 sm:gap-3">
                  {/* Video */}
                  <button
                    onClick={() => handleFileUpload("video")}
                    className="aspect-square rounded-xl border-2 border-dashed border-border hover:border-primary hover:bg-primary/5 active:scale-95 transition-all flex flex-col items-center justify-center gap-1.5 sm:gap-2 p-3 sm:p-4"
                  >
                    <Video className="w-6 h-6 sm:w-8 sm:h-8 text-muted-foreground" />
                    <span className="text-[10px] sm:text-xs text-muted-foreground text-center leading-tight">
                      Vídeo
                      <br className="hidden sm:inline" />
                      <span className="hidden sm:inline">(5min)</span>
                    </span>
                  </button>

                  {/* Audio */}
                  <button
                    onClick={() => handleFileUpload("audio")}
                    className="aspect-square rounded-xl border-2 border-dashed border-border hover:border-primary hover:bg-primary/5 active:scale-95 transition-all flex flex-col items-center justify-center gap-1.5 sm:gap-2 p-3 sm:p-4"
                  >
                    <Mic className="w-6 h-6 sm:w-8 sm:h-8 text-muted-foreground" />
                    <span className="text-[10px] sm:text-xs text-muted-foreground text-center leading-tight">
                      Áudio
                      <br className="hidden sm:inline" />
                      <span className="hidden sm:inline">(3min)</span>
                    </span>
                  </button>

                  {/* Photo */}
                  <button
                    onClick={() => handleFileUpload("photo")}
                    className="aspect-square rounded-xl border-2 border-dashed border-border hover:border-primary hover:bg-primary/5 active:scale-95 transition-all flex flex-col items-center justify-center gap-1.5 sm:gap-2 p-3 sm:p-4"
                  >
                    <ImageIcon className="w-6 h-6 sm:w-8 sm:h-8 text-muted-foreground" />
                    <span className="text-[10px] sm:text-xs text-muted-foreground text-center leading-tight">
                      Foto
                    </span>
                  </button>
                </div>

                {/* Uploaded Files */}
                {uploadedFiles.length > 0 && (
                  <div className="mt-4 space-y-2">
                    {uploadedFiles.map((file, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="flex items-center gap-3 p-3 bg-muted rounded-xl"
                      >
                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                          {file.type === "video" && (
                            <Video className="w-5 h-5 text-primary" />
                          )}
                          {file.type === "audio" && (
                            <Mic className="w-5 h-5 text-primary" />
                          )}
                          {file.type === "photo" && (
                            <ImageIcon className="w-5 h-5 text-primary" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm capitalize truncate">
                            {file.type} enviado
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Pronto para salvar
                          </p>
                        </div>
                        <button
                          className="rounded-full h-8 w-8 flex-shrink-0 hover:bg-muted-foreground/20 flex items-center justify-center"
                          onClick={() => removeFile(index)}
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>

              {/* Story */}
              <div>
                <label
                  htmlFor="story"
                  className="text-sm sm:text-base font-medium block mb-2 font-serif"
                >
                  Conte a história
                </label>
                <p className="text-xs sm:text-sm text-muted-foreground mb-2">
                  O que tornou este momento especial? (opcional)
                </p>
                <textarea
                  id="story"
                  value={story}
                  onChange={(e) => setStory(e.target.value)}
                  placeholder="Era uma manhã ensolarada quando..."
                  className="w-full min-h-28 sm:min-h-32 rounded-xl bg-muted px-4 py-3 border border-border text-foreground resize-none"
                />
              </div>

              {/* Alert */}
              <div className="bg-accent/10 border border-accent/30 rounded-lg p-4 flex gap-3">
                <Info className="h-4 w-4 text-accent flex-shrink-0 mt-0.5" />
                <p className="text-xs sm:text-sm text-accent/90">
                  <strong>Dica:</strong> Não precisa ser perfeito. O importante
                  é registrar o momento enquanto está fresco na memória.
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Button */}
      <div className="fixed bottom-0 left-0 right-0 bg-card/95 backdrop-blur-sm border-t border-border shadow-lg">
        <div className="max-w-4xl mx-auto px-4 py-3 sm:py-4">
          <button
            onClick={handleSave}
            disabled={!date}
            className="w-full h-12 sm:h-14 rounded-2xl bg-primary hover:bg-primary/90 transition-colors disabled:opacity-50 text-white font-medium flex items-center justify-center gap-2"
          >
            <Check className="w-5 h-5" />
            <span className="text-sm sm:text-base">Guardar no Santuário</span>
          </button>
          {!date && (
            <p className="text-xs text-center text-muted-foreground mt-2">
              Selecione a data para continuar
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
