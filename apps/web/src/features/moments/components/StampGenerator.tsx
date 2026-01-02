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
} from "lucide-react";

interface StampGeneratorProps {
  type?: "hand" | "foot";
  placeholderUrl?: string;
  onSuccess: (file: File) => void;
  onError?: (msg: string) => void;
  /**
   * Cor em HEX no formato #RRGGBB.
   * Mantida por compatibilidade, pois o worker espera HEX.
   */
  colorHex?: string;
  /**
   * Cor em formato CSS (ex: "var(--bb-color-ink)", "rgb(0 0 0)").
   * Será resolvida para HEX antes de enviar ao worker.
   */
  colorCss?: string;
}

const DEFAULT_STAMP_COLOR_CSS = "var(--bb-color-ink)";
const FALLBACK_STAMP_COLOR_HEX = "#2A2A2A";

function clamp255(n: number) {
  return Math.max(0, Math.min(255, n));
}

function toHex2(n: number) {
  return clamp255(Math.round(n)).toString(16).padStart(2, "0");
}

function normalizeHexColor(input: string): string | null {
  const value = input.trim();
  if (!value.startsWith("#")) return null;

  const raw = value.slice(1);
  if (raw.length === 3) {
    // #abc -> #aabbcc
    const r = raw[0];
    const g = raw[1];
    const b = raw[2];
    if (!r || !g || !b) return null;
    return `#${r}${r}${g}${g}${b}${b}`.toUpperCase();
  }

  if (raw.length === 6) {
    if (!/^[0-9a-fA-F]{6}$/.test(raw)) return null;
    return `#${raw}`.toUpperCase();
  }

  if (raw.length === 8) {
    // #RRGGBBAA -> #RRGGBB (ignora alpha)
    const rgb = raw.slice(0, 6);
    if (!/^[0-9a-fA-F]{6}$/.test(rgb)) return null;
    return `#${rgb}`.toUpperCase();
  }

  return null;
}

function rgbStringToHex(color: string): string | null {
  // Ex: rgb(255, 0, 0) | rgb(255 0 0) | rgba(255, 0, 0, 0.5)
  const m = color.trim().match(/^rgba?\(([^)]+)\)$/i);
  if (!m) return null;

  const body = m[1] ?? "";
  const parts = body
    .split(/[\s,\/]+/)
    .map((p) => p.trim())
    .filter(Boolean);

  const r = Number(parts[0]);
  const g = Number(parts[1]);
  const b = Number(parts[2]);

  if (![r, g, b].every((v) => Number.isFinite(v))) return null;
  return `#${toHex2(r)}${toHex2(g)}${toHex2(b)}`.toUpperCase();
}

function resolveCssColorToHex(cssColor: string): string | null {
  const directHex = normalizeHexColor(cssColor);
  if (directHex) return directHex;

  const directRgb = rgbStringToHex(cssColor);
  if (directRgb) return directRgb;

  if (typeof document === "undefined") return null;

  // Resolve CSS variables e nomes de cores usando computedStyle
  const el = document.createElement("span");
  el.style.color = cssColor;
  el.style.position = "absolute";
  el.style.left = "-9999px";
  el.style.top = "-9999px";
  document.body.appendChild(el);
  try {
    const computed = getComputedStyle(el).color;
    return rgbStringToHex(computed);
  } finally {
    el.remove();
  }
}

export function StampGenerator({
  type = "hand",
  placeholderUrl,
  onSuccess,
  onError,
  colorHex,
  colorCss = DEFAULT_STAMP_COLOR_CSS,
}: StampGeneratorProps) {
  const [status, setStatus] = useState<string>("Pronto para começar");
  const [progress, setProgress] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [generatedFile, setGeneratedFile] = useState<File | null>(null);

  const workerRef = useRef<Worker | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const callbacksRef = useRef({ onSuccess, onError });

  // Manter callbacks atualizados sem disparar o efeito do worker
  useEffect(() => {
    callbacksRef.current = { onSuccess, onError };
  }, [onSuccess, onError]);

  const label = type === "hand" ? "Mãozinha" : "Pezinho";

  useEffect(() => {
    console.log(`[StampGenerator] Inicializando worker para ${label}`);
    workerRef.current = new Worker(
      new URL("../../../workers/stamp.worker.ts", import.meta.url),
      {
        type: "module",
      },
    );

    workerRef.current.onmessage = (e) => {
      const { type: msgType, value, status: statusMsg, file, message } = e.data;
      console.log(
        `[StampGenerator] Worker message:`,
        msgType,
        value,
        statusMsg,
      );

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

    return () => {
      console.log(`[StampGenerator] Terminando worker para ${label}`);
      workerRef.current?.terminate();
    };
  }, [label]); // Somente reinicia se o tipo (label) mudar

  const processFile = (file: File) => {
    if (!file.type.startsWith("image/")) {
      setError("Por favor, selecione apenas arquivos de imagem.");
      return;
    }

    setError(null);
    setIsProcessing(true);
    setProgress(0);
    setPreviewUrl(null);
    setGeneratedFile(null);

    const resolvedHex =
      normalizeHexColor(colorHex ?? "") ??
      resolveCssColorToHex(colorCss) ??
      FALLBACK_STAMP_COLOR_HEX;

    workerRef.current?.postMessage({
      file,
      colorHex: resolvedHex,
    });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) processFile(file);
  };

  const reset = () => {
    setPreviewUrl(null);
    setStatus("Pronto para começar");
    setProgress(0);
    setError(null);
    setGeneratedFile(null);
  };

  return (
    <div className="w-full flex-1 overflow-hidden rounded-3xl border-2 border-dashed border-[#C9D3C2] bg-white transition-all">
      <AnimatePresence mode="wait">
        {!isProcessing && !previewUrl && !error && (
          <motion.div
            key="idle"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className={`flex flex-col items-center justify-center p-6 text-center transition-colors h-full min-h-[320px] ${
              isDragging ? "bg-[#F7F3EF]" : "bg-transparent"
            }`}
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
          >
            {placeholderUrl ? (
              <div className="mb-4 relative w-24 h-24 opacity-40 grayscale group-hover:grayscale-0 group-hover:opacity-60 transition-all">
                <img
                  src={placeholderUrl}
                  alt={`Placeholder ${label}`}
                  className="w-full h-full object-contain"
                />
              </div>
            ) : (
              <div className="mb-4 rounded-2xl bg-[#F7F3EF] p-4 text-[#F2995D]">
                <Camera className="h-8 w-8" />
              </div>
            )}

            <h3 className="mb-1 text-base font-bold text-[#2A2A2A]">
              Registrar {label}
            </h3>
            <p className="mb-4 text-xs text-gray-400">
              Arraste a foto ou clique para upload
            </p>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-2 rounded-xl bg-[#F2995D] px-4 py-2 text-sm font-semibold text-white shadow-md transition hover:bg-opacity-90 active:scale-95"
            >
              <Upload className="h-3.5 w-3.5" />
              Upload
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
            className="relative flex flex-col items-center justify-center p-8 text-center min-h-[320px]"
          >
            <div className="relative mb-6 h-32 w-32 overflow-hidden rounded-full bg-[#F7F3EF]">
              <motion.div
                className="absolute inset-0 bg-[#F2995D] opacity-20"
                animate={{
                  top: ["0%", "100%", "0%"],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "linear",
                }}
                style={{ height: "40%", width: "100%", filter: "blur(20px)" }}
              />
              <div className="flex h-full items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-[#F2995D]" />
              </div>
            </div>

            <div className="w-full max-w-[200px] space-y-2">
              <div className="flex justify-between text-[10px] font-bold text-[#2A2A2A]">
                <span className="truncate">{status}</span>
                <span>{progress}%</span>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-[#F7F3EF]">
                <motion.div
                  className="h-full bg-[#F2995D]"
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                />
              </div>
            </div>
          </motion.div>
        )}

        {error && (
          <motion.div
            key="error"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center justify-center p-8 text-center min-h-[320px]"
          >
            <div className="mb-2 rounded-full bg-red-100 p-3 text-red-500">
              <AlertCircle className="h-8 w-8" />
            </div>
            <h3 className="mb-1 text-base font-bold text-red-600">Ops!</h3>
            <p className="mb-4 text-xs text-gray-500">{error}</p>
            <button
              type="button"
              onClick={reset}
              className="flex items-center gap-2 rounded-xl bg-gray-200 px-4 py-2 text-xs font-semibold text-gray-700 transition hover:bg-gray-300 active:scale-95"
            >
              <RefreshCcw className="h-3.5 w-3.5" />
              Tentar Novamente
            </button>
          </motion.div>
        )}

        {previewUrl && (
          <motion.div
            key="success"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center justify-center p-6 text-center h-full min-h-[320px]"
          >
            <div className="mb-2 flex items-center gap-2 text-[#4BB543]">
              <CheckCircle2 className="h-4 w-4" />
              <span className="text-xs font-bold">{label} Criado!</span>
            </div>

            <div
              className="relative mb-4 flex h-40 w-full items-center justify-center rounded-2xl bg-[#f0f0f0] p-4"
              style={{
                backgroundImage: "radial-gradient(#ccc 1px, transparent 1px)",
                backgroundSize: "16px 16px",
              }}
            >
              <motion.img
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1, rotate: [-2, 2, 0] }}
                src={previewUrl}
                alt={`${label} Preview`}
                className="h-full object-contain drop-shadow-lg"
              />
            </div>

            <div className="flex w-full gap-2">
              <button
                type="button"
                onClick={reset}
                className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-gray-100 py-2.5 text-[10px] font-bold text-gray-600 transition hover:bg-gray-200"
              >
                <RefreshCcw className="h-3 w-3" />
                Tentar Outra
              </button>
              <button
                type="button"
                onClick={() => generatedFile && onSuccess(generatedFile)}
                className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-[#2A2A2A] py-2.5 text-[10px] font-bold text-white shadow-md transition hover:bg-black active:scale-95"
              >
                <Hand className="h-3 w-3" />
                Usar {label}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
