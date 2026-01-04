import React, { useId } from "react";
import { Plus, X, Paperclip } from "lucide-react";

interface MediaUploaderProps {
  mediaFiles: File[];
  onAddMedia: (files: File[]) => void | Promise<void>;
  onRemoveMedia: (index: number) => void;
  accept?: string;
  helperText?: string;
  error?: string | null;
}

export const MediaUploader = ({
  mediaFiles,
  onAddMedia,
  onRemoveMedia,
  accept = "image/*,video/*,audio/*",
  helperText = "Até 10 mídias por momento",
  error = null,
}: MediaUploaderProps) => {
  const inputId = useId();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    onAddMedia(files);
    // Permite selecionar o mesmo arquivo novamente (útil quando rejeitamos por validação)
    e.target.value = "";
  };

  return (
    <div>
      <label 
          className="block text-sm font-semibold mb-2"
          style={{ color: "var(--bb-color-ink)" }}
      >
        Mídias
      </label>
      <div 
          className="border-2 border-dashed rounded-lg p-6 text-center transition-colors cursor-pointer hover:bg-opacity-5"
          style={{
              borderColor: "var(--bb-color-border)",
              backgroundColor: "var(--bb-color-bg)",
          }}
      >
        <input
          type="file"
          multiple
          accept={accept}
          onChange={handleFileChange}
          className="hidden"
          id={inputId}
        />
        <label
          htmlFor={inputId}
          className="flex flex-col items-center justify-center cursor-pointer"
        >
          <Plus className="w-8 h-8 mb-2" style={{ color: "var(--bb-color-ink-muted)" }} />
          <p className="text-sm font-medium" style={{ color: "var(--bb-color-ink)" }}>
            Adicionar fotos, vídeos ou áudios
          </p>
          <p className="text-xs mt-1" style={{ color: "var(--bb-color-ink-muted)" }}>{helperText}</p>
        </label>
      </div>

      {error && (
        <p className="mt-2 text-sm font-medium text-red-600" role="alert">
          {error}
        </p>
      )}

      {mediaFiles.length > 0 && (
        <div className="mt-4 space-y-2">
          <h4 className="text-sm font-semibold" style={{ color: "var(--bb-color-ink)" }}>
            Mídias adicionadas ({mediaFiles.length})
          </h4>
          {mediaFiles.map((file, index) => (
            <div
              key={index}
              className="flex items-center justify-between p-3 rounded-lg border"
              style={{
                  backgroundColor: "var(--bb-color-bg)",
                  borderColor: "var(--bb-color-border)"
              }}
            >
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <Paperclip className="w-5 h-5 flex-shrink-0" style={{ color: "var(--bb-color-ink-muted)" }} />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium truncate" style={{ color: "var(--bb-color-ink)" }}>
                    {file.name}
                  </p>
                  <p className="text-xs" style={{ color: "var(--bb-color-ink-muted)" }}>
                    {(file.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => onRemoveMedia(index)}
                className="p-1 rounded-full transition-colors hover:bg-black/5 dark:hover:bg-white/10"
              >
                <X className="w-4 h-4 text-red-600" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
