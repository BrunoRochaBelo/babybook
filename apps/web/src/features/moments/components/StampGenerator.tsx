import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Upload,
  Camera,
  Loader2,
  CheckCircle2,
  AlertCircle,
  RefreshCcw,
  Hand,
  Maximize2,
  X,
  Palette,
} from "lucide-react";
import * as Dialog from "@radix-ui/react-dialog";

interface StampGeneratorProps {
  type?: "hand" | "foot";
  placeholderUrl?: string;
  onSuccess: (file: File) => void;
  onError?: (msg: string) => void;
  colorHex?: string; // Legacy
  colorCss?: string; // Legacy
}

const INK_COLORS = [
  { name: "Preto Clássico", hex: "#1A1A1A", css: "#1A1A1A" },
  { name: "Azul Cobalto", hex: "#0047AB", css: "#0047AB" },
  { name: "Rosa Bebê", hex: "#E75480", css: "#E75480" },
];

const DEFAULT_COLOR = INK_COLORS[0];

export function StampGenerator({
  type = "hand",
  placeholderUrl,
  onSuccess,
  onError,
}: StampGeneratorProps) {
  const [status, setStatus] = useState<string>("Pronto para começar");
  const [progress, setProgress] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [generatedFile, setGeneratedFile] = useState<File | null>(null);
  const [selectedColor, setSelectedColor] = useState(DEFAULT_COLOR);
  const [isZoomOpen, setIsZoomOpen] = useState(false);
  
  // Guardar o arquivo original para reprocessar se mudar a cor
  const [originalFile, setOriginalFile] = useState<File | null>(null);

  const workerRef = useRef<Worker | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const callbacksRef = useRef({ onSuccess, onError });

  useEffect(() => {
    callbacksRef.current = { onSuccess, onError };
  }, [onSuccess, onError]);

  const label = type === "hand" ? "Mãozinha" : "Pezinho";

  useEffect(() => {
    workerRef.current = new Worker(
      new URL("../../../workers/stamp.worker.ts", import.meta.url),
      { type: "module" },
    );

    workerRef.current.onmessage = (e) => {
      const { type: msgType, value, status: statusMsg, file, message } = e.data;

      if (msgType === "progress") {
        setProgress(value);
        setStatus(statusMsg);
      } else if (msgType === "complete") {
        setIsProcessing(false);
        setProgress(100);
        setStatus("Carimbo gerado com sucesso!");
        setGeneratedFile(file);
        const url = URL.createObjectURL(file);
        setPreviewUrl(url);
      } else if (msgType === "error") {
        setIsProcessing(false);
        setError(message || "Ocorreu um erro ao processar a imagem.");
        if (callbacksRef.current.onError) callbacksRef.current.onError(message);
      }
    };

    workerRef.current.onerror = (err) => {
      console.error("[StampGenerator] Worker Error:", err);
      setIsProcessing(false);
      setError("Erro crítico ao carregar o processador de imagem.");
    };

    // Otimização: Preload dos modelos
    workerRef.current.postMessage({ type: 'preload' });

    return () => {
      workerRef.current?.terminate();
    };
  }, []);

  const processFile = (file: File, colorConfig = selectedColor) => {
    if (!file.type.startsWith("image/")) {
      setError("Por favor, selecione apenas arquivos de imagem.");
      return;
    }

    setError(null);
    setIsProcessing(true);
    setProgress(0);
    // Não limpa o preview anterior se estiver apenas trocando a cor (opcional, mas visualmente melhor limpar)
    setPreviewUrl(null); 
    setGeneratedFile(null);

    workerRef.current?.postMessage({
      file,
      colorHex: colorConfig.hex,
    });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setOriginalFile(file);
      processFile(file);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
        setOriginalFile(file);
        processFile(file);
    }
  };

  const handleColorChange = (color: typeof INK_COLORS[0]) => {
    setSelectedColor(color);
    if (originalFile) {
        processFile(originalFile, color);
    }
  };

  const reset = () => {
    setPreviewUrl(null);
    setStatus("Pronto para começar");
    setProgress(0);
    setError(null);
    setGeneratedFile(null);
    setOriginalFile(null);
  };

  return (
    <>
      <div className="w-full flex-1 overflow-hidden rounded-3xl border border-[#E0E0E0] bg-white dark:bg-surface dark:border-border shadow-sm transition-all hover:shadow-md">
        <AnimatePresence mode="wait">
          {!isProcessing && !previewUrl && !error && (
            <motion.div
              key="idle"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className={`flex flex-col items-center justify-center p-6 text-center transition-colors h-full min-h-[340px] ${
                isDragging ? "bg-[#F7F3EF] dark:bg-muted/50" : "bg-transparent"
              }`}
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
            >
               {/* CONFIGURAÇÃO DE COR (ANTES DO UPLOAD) */}
               <div className="mb-6 flex flex-col items-center gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-ink-muted">Escolha a Tinta</span>
                  <div className="flex items-center gap-2 p-1.5 bg-gray-50 dark:bg-muted/50 rounded-full border border-gray-100 dark:border-border shadow-sm">
                      {INK_COLORS.map((color) => (
                          <button
                              key={color.name}
                              onClick={(e) => { e.stopPropagation(); setSelectedColor(color); }}
                              className={`w-6 h-6 rounded-full border-2 transition-all ${selectedColor.name === color.name ? 'scale-125 shadow-md border-white ring-2 ring-gray-200' : 'border-transparent hover:scale-110'}`}
                              style={{ backgroundColor: color.hex }}
                              title={color.name}
                          />
                      ))}
                  </div>
              </div>

              {placeholderUrl ? (
                <div className="mb-6 relative w-28 h-28 opacity-30 grayscale transition-all duration-300 group-hover:grayscale-0 group-hover:opacity-60">
                  <img
                    src={placeholderUrl}
                    alt={`Placeholder ${label}`}
                    className="w-full h-full object-contain"
                  />
                </div>
              ) : (
                <div className="mb-6 rounded-2xl bg-[#F7F3EF] dark:bg-surface-muted p-5 text-[#F2995D]">
                  <Camera className="h-10 w-10" />
                </div>
              )}

              <h3 className="mb-2 text-lg font-bold text-[#2A2A2A] dark:text-ink">
                {label}
              </h3>
              <p className="mb-6 text-xs font-medium text-gray-400 dark:text-ink-muted max-w-[200px]">
                Arraste uma foto aqui ou clique para selecionar
              </p>
              
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="group flex items-center gap-2 rounded-full bg-[#2A2A2A] dark:bg-accent px-6 py-3 text-sm font-bold text-white dark:text-surface shadow-lg transition-all hover:bg-black dark:hover:bg-accent-hover hover:scale-105 active:scale-95"
              >
                <Upload className="h-4 w-4" />
                <span>Escolher Foto</span>
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileChange}
              />
            </motion.div>
          )}

          {isProcessing && (
            <motion.div
              key="processing"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="relative flex flex-col items-center justify-center p-8 text-center min-h-[340px]"
            >
              <div className="relative mb-6 h-28 w-28">
                  <div className="absolute inset-0 rounded-full border-4 border-[#F0F0F0] dark:border-border overflow-hidden bg-white dark:bg-surface shadow-inner">
                      <motion.div 
                          className="absolute bottom-0 left-0 right-0 bg-[#F2995D]"
                          initial={{ height: "0%" }}
                          animate={{ height: `${progress}%` }}
                          transition={{ type: "spring", stiffness: 20, damping: 10 }}
                      >
                           <motion.div
                              className="absolute -top-4 left-[-50%] right-[-50%] h-8 bg-[#F2995D] rounded-[50%]"
                              animate={{ rotate: 360 }}
                              transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                              style={{ opacity: 0.5, borderRadius: "40%" }}
                          />
                          <motion.div
                              className="absolute -top-3 left-[-50%] right-[-50%] h-8 bg-[#F2995D] rounded-[50%]"
                              animate={{ rotate: -360 }}
                              transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                              style={{ opacity: 0.3, borderRadius: "45%" }}
                          />
                      </motion.div>
                  </div>
                  <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none">
                      <motion.div
                          animate={{ y: [0, -4, 0] }}
                          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                      >
                          {placeholderUrl ? (
                               <img src={placeholderUrl} className="w-14 h-14 mix-blend-overlay opacity-60" alt="loading" />
                          ) : <Loader2 className="h-8 w-8 text-white mix-blend-overlay" />}
                      </motion.div>
                  </div>
              </div>

              <div className="w-full max-w-[200px] space-y-2">
                <div className="flex justify-center flex-col items-center text-[#2A2A2A] dark:text-ink gap-1">
                  <span className="text-xs font-bold uppercase tracking-wider animate-pulse">{status.split('...')[0]}</span>
                  <span className="text-[10px] font-mono text-gray-400 dark:text-ink-muted max-w-[150px] truncate">{Math.round(progress)}%</span>
                </div>
              </div>
            </motion.div>
          )}

          {error && (
            <motion.div
              key="error"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center justify-center p-8 text-center min-h-[340px]"
            >
              <div className="mb-4 rounded-full bg-red-50 p-4 text-red-500 ring-8 ring-red-50/50">
                <AlertCircle className="h-8 w-8" />
              </div>
              <h3 className="mb-2 text-lg font-bold text-gray-800">Ops, algo deu errado!</h3>
              <p className="mb-6 text-sm text-gray-500 max-w-[240px] leading-relaxed">{error}</p>
              <button
                type="button"
                onClick={reset}
                className="flex items-center gap-2 rounded-xl bg-gray-100 px-5 py-2.5 text-sm font-bold text-gray-700 transition hover:bg-gray-200 active:scale-95"
              >
                <RefreshCcw className="h-4 w-4" />
                Tentar Novamente
              </button>
            </motion.div>
          )}

          {previewUrl && (
            <motion.div
              key="success"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col p-5 h-full min-h-[340px]"
            >
              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-2 text-green-600 bg-green-50 px-3 py-1 rounded-full">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  <span className="text-[10px] font-bold uppercase tracking-wide">Sucesso</span>
                </div>
                
                {/* Color Picker Compacto */}
                <div className="flex items-center gap-1.5 p-1 bg-gray-50 dark:bg-surface-muted rounded-lg border border-gray-100 dark:border-border">
                    {INK_COLORS.slice(0, 3).map((color) => (
                        <button
                            key={color.name}
                            onClick={() => handleColorChange(color)}
                            className={`w-5 h-5 rounded-full border-2 transition-all ${selectedColor.name === color.name ? 'scale-110 shadow-sm border-white ring-1 ring-gray-300' : 'border-transparent hover:scale-105'}`}
                            style={{ backgroundColor: color.hex }}
                            title={color.name}
                        />
                    ))}
                     <button
                        onClick={() => { /* Expandir paleta completa se necessário */ }}
                        className="w-5 h-5 flex items-center justify-center rounded-full bg-white dark:bg-surface border border-gray-200 dark:border-border text-gray-400 dark:text-ink-muted hover:text-gray-600 dark:hover:text-ink"
                     >
                        <Palette className="w-3 h-3" />
                     </button>
                </div>
              </div>

              {/* Fundo BRANCO como papel sulfite, independente do tema */}
              <div className="relative flex-1 w-full rounded-2xl bg-white p-4 border border-gray-200 group overflow-hidden shadow-sm">
                {/* Textura de papel sutil (pontilhado) */}
                <div className="absolute inset-0 opacity-5" style={{ backgroundImage: "radial-gradient(#999 0.5px, transparent 0.5px)", backgroundSize: "8px 8px" }}></div>
                
                <motion.div 
                    layoutId={`stamp-${label}`}
                    className="relative w-full h-full flex items-center justify-center cursor-zoom-in"
                    onClick={() => setIsZoomOpen(true)}
                >
                     <motion.img
                        key={selectedColor.hex} // Anima transição de cor
                        initial={{ opacity: 0.5, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        src={previewUrl}
                        alt={`${label} Preview`}
                        className="max-h-full max-w-full object-contain drop-shadow-xl"
                        style={{ filter: "contrast(1.1)" }} // Leve realce
                    />
                     <div className="absolute bottom-2 right-2 bg-white/80 backdrop-blur-sm p-1.5 rounded-lg shadow-sm opacity-0 group-hover:opacity-100 transition-opacity">
                        <Maximize2 className="w-4 h-4 text-gray-600" />
                     </div>
                </motion.div>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={reset}
                  className="flex items-center justify-center gap-2 rounded-xl border border-gray-200 dark:border-border bg-white dark:bg-secondary py-3 text-xs font-bold text-gray-600 dark:text-secondary-foreground transition hover:bg-gray-50 dark:hover:bg-secondary/80 hover:border-gray-300"
                >
                  <RefreshCcw className="h-3.5 w-3.5" />
                  Refazer
                </button>
                <button
                  type="button"
                  onClick={() => generatedFile && onSuccess(generatedFile)}
                  className="flex items-center justify-center gap-2 rounded-xl bg-[#2A2A2A] dark:bg-primary py-3 text-xs font-bold text-white dark:text-primary-foreground shadow-lg transition hover:bg-black hover:scale-[1.02] active:scale-95"
                >
                  <Hand className="h-3.5 w-3.5" />
                  Confirmar
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Zoom Dialog */}
      <Dialog.Root open={isZoomOpen} onOpenChange={setIsZoomOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200" />
          <Dialog.Content className="fixed left-1/2 top-1/2 z-50 -translate-x-1/2 -translate-y-1/2 w-full max-w-3xl max-h-[90vh] outline-none animate-in zoom-in-95 duration-200">
             <div className="relative bg-white dark:bg-surface rounded-2xl shadow-2xl overflow-hidden p-2">
                 <button 
                    onClick={() => setIsZoomOpen(false)}
                    className="absolute top-4 right-4 z-10 p-2 bg-white/50 backdrop-blur-md rounded-full shadow-sm hover:bg-white text-gray-700 transition-all"
                 >
                    <X className="w-5 h-5" />
                 </button>
                 
                 {/* Fundo BRANCO como papel sulfite, independente do tema */}
                 <div className="w-full h-[60vh] md:h-[70vh] bg-white rounded-xl flex items-center justify-center relative border border-gray-200 shadow-inner">
                     <div className="absolute inset-0 opacity-5" style={{ backgroundImage: "radial-gradient(#999 0.5px, transparent 0.5px)", backgroundSize: "10px 10px" }}></div>
                     {previewUrl && (
                        <img 
                            src={previewUrl} 
                            className="max-w-full max-h-full object-contain p-8 drop-shadow-2xl" 
                            alt="Zoom"
                        />
                     )}
                 </div>

                 <div className="p-4 bg-white dark:bg-surface flex flex-col items-center gap-4">
                     <p className="text-sm font-medium text-gray-500 dark:text-ink-muted">Escolha a cor da tinta</p>
                     <div className="flex gap-3">
                         {INK_COLORS.map((color) => (
                             <button
                                key={color.name}
                                onClick={() => handleColorChange(color)}
                                className={`w-10 h-10 rounded-full border-4 transition-all ${selectedColor.name === color.name ? 'scale-110 shadow-md border-white ring-2 ring-[#2A2A2A]' : 'border-transparent hover:scale-105 hover:shadow-sm'}`}
                                style={{ backgroundColor: color.hex }}
                                title={color.name}
                             />
                         ))}
                     </div>
                 </div>
             </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </>
  );
}
