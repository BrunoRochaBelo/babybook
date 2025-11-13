import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { ArrowLeft, Upload, Video, Mic, Image as ImageIcon, X, Check, Info, Repeat } from "lucide-react";
import { Badge } from "./ui/badge";
import { RecurrentMomentExplainer } from "./RecurrentMomentExplainer";
import { motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";
import { Alert, AlertDescription } from "./ui/alert";

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
  onSave 
}: MomentFormProps) {
  const [date, setDate] = useState("");
  const [story, setStory] = useState("");
  const [uploadedFiles, setUploadedFiles] = useState<{ type: string; name: string }[]>([]);

  const calculateAge = (birthDate: string, momentDate: string) => {
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

  const handleFileUpload = (type: string) => {
    // Simulate file upload
    setUploadedFiles([...uploadedFiles, { type, name: `${type}-${Date.now()}` }]);
    toast.success(`${type === 'video' ? 'Vídeo' : type === 'audio' ? 'Áudio' : 'Foto'} adicionado!`);
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
          <Button 
            variant="ghost" 
            size="sm"
            onClick={onBack}
            className="mb-3 -ml-2 h-9"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar
          </Button>
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <h1 className="text-xl sm:text-2xl md:text-3xl line-clamp-2">{momentTitle}</h1>
                {isRecurrent && (
                  <Badge variant="secondary" className="text-xs">
                    <Repeat className="w-3 h-3 mr-1" />
                    Recorrente
                  </Badge>
                )}
              </div>
              <p className="text-xs sm:text-sm text-muted-foreground">
                {isRecurrent 
                  ? existingRecordsCount > 0 
                    ? `Adicione mais um registro (você já tem ${existingRecordsCount})`
                    : 'Este momento pode ser registrado múltiplas vezes'
                  : 'Registre este momento especial para sempre'
                }
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
          {/* Recurrent Moment Explainer */}
          {isRecurrent && (
            <div className="mb-6">
              <RecurrentMomentExplainer 
                momentTitle={momentTitle}
                existingCount={existingRecordsCount}
              />
            </div>
          )}

          <Card className="p-4 sm:p-6 md:p-8">
            <div className="space-y-6">
              {/* Date */}
              <div>
                <Label htmlFor="moment-date" className="text-sm sm:text-base">Quando aconteceu? *</Label>
                <Input
                  id="moment-date"
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="mt-2 h-12 rounded-xl bg-input-background"
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

              {/* Media Upload Slots */}
              <div>
                <Label className="text-sm sm:text-base">Adicione Memórias</Label>
                <p className="text-xs sm:text-sm text-muted-foreground mb-3">
                  Vídeos, áudios e fotos deste momento
                </p>
                
                <div className="grid grid-cols-3 gap-2 sm:gap-3">
                  {/* Video Slot */}
                  <button
                    onClick={() => handleFileUpload('video')}
                    className="aspect-square rounded-xl border-2 border-dashed border-border hover:border-primary hover:bg-primary/5 active:scale-95 transition-all flex flex-col items-center justify-center gap-1.5 sm:gap-2 p-3 sm:p-4"
                  >
                    <Video className="w-6 h-6 sm:w-8 sm:h-8 text-muted-foreground" />
                    <span className="text-[10px] sm:text-xs text-muted-foreground text-center leading-tight">
                      Vídeo<br className="hidden sm:inline" />
                      <span className="hidden sm:inline">(5min)</span>
                    </span>
                  </button>

                  {/* Audio Slot */}
                  <button
                    onClick={() => handleFileUpload('audio')}
                    className="aspect-square rounded-xl border-2 border-dashed border-border hover:border-primary hover:bg-primary/5 active:scale-95 transition-all flex flex-col items-center justify-center gap-1.5 sm:gap-2 p-3 sm:p-4"
                  >
                    <Mic className="w-6 h-6 sm:w-8 sm:h-8 text-muted-foreground" />
                    <span className="text-[10px] sm:text-xs text-muted-foreground text-center leading-tight">
                      Áudio<br className="hidden sm:inline" />
                      <span className="hidden sm:inline">(3min)</span>
                    </span>
                  </button>

                  {/* Photo Slot */}
                  <button
                    onClick={() => handleFileUpload('photo')}
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
                          {file.type === 'video' && <Video className="w-5 h-5 text-primary" />}
                          {file.type === 'audio' && <Mic className="w-5 h-5 text-primary" />}
                          {file.type === 'photo' && <ImageIcon className="w-5 h-5 text-primary" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm capitalize truncate">{file.type} enviado</p>
                          <p className="text-xs text-muted-foreground">Pronto para salvar</p>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="rounded-full h-8 w-8 flex-shrink-0"
                          onClick={() => removeFile(index)}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>

              {/* Story */}
              <div>
                <Label htmlFor="story" className="text-sm sm:text-base">Conte a história (opcional)</Label>
                <p className="text-xs sm:text-sm text-muted-foreground mb-2">
                  Descreva o que tornou este momento especial
                </p>
                <Textarea
                  id="story"
                  value={story}
                  onChange={(e) => setStory(e.target.value)}
                  placeholder="Era uma tarde ensolarada quando..."
                  className="mt-2 min-h-28 sm:min-h-32 rounded-xl bg-input-background resize-none"
                />
              </div>

              {/* Encouragement Alert */}
              <Alert className="bg-secondary/20 border-secondary/30">
                <Info className="h-4 w-4 text-secondary-foreground" />
                <AlertDescription className="text-xs sm:text-sm">
                  <strong>Dica:</strong> Você pode adicionar mais detalhes depois. 
                  O importante é registrar o momento enquanto está fresco na memória.
                </AlertDescription>
              </Alert>
            </div>
          </Card>
        </motion.div>
      </div>

      {/* Fixed Bottom Button */}
      <div className="fixed bottom-0 left-0 right-0 bg-card/95 backdrop-blur-sm border-t border-border shadow-lg safe-area-inset-bottom">
        <div className="max-w-4xl mx-auto px-4 py-3 sm:py-4">
          <Button 
            onClick={handleSave}
            disabled={!date}
            className="w-full h-12 sm:h-14 rounded-2xl bg-primary hover:bg-primary/90 transition-smooth disabled:opacity-50"
          >
            <Check className="w-5 h-5 mr-2" />
            <span className="text-sm sm:text-base">Salvar Momento Permanentemente</span>
          </Button>
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
