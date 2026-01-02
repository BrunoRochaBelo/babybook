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
      <label className="block text-sm font-semibold text-gray-800 mb-2">
        Mídias
      </label>
      <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-primary transition-colors cursor-pointer">
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
          <Plus className="w-8 h-8 text-gray-400 mb-2" />
          <p className="text-sm text-gray-600 font-medium">
            Adicionar fotos, vídeos ou áudios
          </p>
          <p className="text-xs text-gray-500 mt-1">{helperText}</p>
        </label>
      </div>

      {error && (
        <p className="mt-2 text-sm font-medium text-red-600" role="alert">
          {error}
        </p>
      )}

      {mediaFiles.length > 0 && (
        <div className="mt-4 space-y-2">
          <h4 className="text-sm font-semibold text-gray-800">
            Mídias adicionadas ({mediaFiles.length})
          </h4>
          {mediaFiles.map((file, index) => (
            <div
              key={index}
              className="flex items-center justify-between bg-gray-100 p-3 rounded-lg"
            >
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <Paperclip className="w-5 h-5 text-gray-500 flex-shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-gray-800 truncate">
                    {file.name}
                  </p>
                  <p className="text-xs text-gray-500">
                    {(file.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => onRemoveMedia(index)}
                className="p-1 hover:bg-gray-200 rounded-full transition-colors"
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
