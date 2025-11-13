import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useCreateMoment } from "@/hooks/api";
import { Plus, X } from "lucide-react";

interface MomentFormProps {
  childId: string;
  templateId?: string;
  onSuccess?: () => void;
}

export const MomentForm = ({
  childId,
  templateId,
  onSuccess,
}: MomentFormProps) => {
  const navigate = useNavigate();
  const [title, setTitle] = useState("");
  const [summary, setSummary] = useState("");
  const [occurredAt, setOccurredAt] = useState(
    new Date().toISOString().split("T")[0],
  );
  const [mediaFiles, setMediaFiles] = useState<File[]>([]);
  const { mutate: createMoment, isPending } = useCreateMoment();

  const handleAddMedia = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setMediaFiles([...mediaFiles, ...files]);
  };

  const handleRemoveMedia = (index: number) => {
    setMediaFiles(mediaFiles.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !occurredAt) {
      return;
    }
    createMoment(
      {
        childId,
        title,
        summary,
        occurredAt,
        templateKey: templateId,
        payload: mediaFiles.length
          ? {
              media: mediaFiles.map((file) => ({
                id: file.name,
                type: file.type.startsWith("video")
                  ? "video"
                  : file.type.startsWith("audio")
                    ? "audio"
                    : "image",
                url: URL.createObjectURL(file),
              })),
            }
          : undefined,
      },
      {
        onSuccess: () => {
          setTitle("");
          setSummary("");
          setOccurredAt(new Date().toISOString().split("T")[0]);
          setMediaFiles([]);
          if (onSuccess) {
            onSuccess();
          } else {
            navigate("/jornada");
          }
        },
      },
    );
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Título */}
      <div>
        <label className="block text-sm font-semibold text-[#2A2A2A] mb-2">
          Título do Momento *
        </label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full px-4 py-2 border-2 border-[#C9D3C2] rounded-2xl focus:border-[#F2995D] focus:outline-none"
          placeholder="Ex: Primeiro Sorriso"
          required
        />
      </div>

      {/* Data */}
      <div>
        <label className="block text-sm font-semibold text-[#2A2A2A] mb-2">
          Data do Momento *
        </label>
        <input
          type="date"
          value={occurredAt}
          onChange={(e) => setOccurredAt(e.target.value)}
          className="w-full px-4 py-2 border-2 border-[#C9D3C2] rounded-2xl focus:border-[#F2995D] focus:outline-none"
          required
        />
      </div>

      {/* Descrição */}
      <div>
        <label className="block text-sm font-semibold text-[#2A2A2A] mb-2">
          Descrição (opcional)
        </label>
        <textarea
          value={summary}
          onChange={(e) => setSummary(e.target.value)}
          className="w-full px-4 py-3 border-2 border-[#C9D3C2] rounded-2xl resize-none focus:border-[#F2995D] focus:outline-none"
          rows={4}
          placeholder="Conte a história desse momento especial..."
        />
      </div>

      {/* Upload de mídia */}
      <div>
        <label className="block text-sm font-semibold text-[#2A2A2A] mb-2">
          Adicionar Mídias (Fotos, Vídeos, Áudio)
        </label>
        <div className="border-2 border-dashed border-[#C9D3C2] rounded-2xl p-6 text-center hover:border-[#F2995D] transition-colors cursor-pointer">
          <input
            type="file"
            multiple
            accept="image/*,video/*,audio/*"
            onChange={handleAddMedia}
            className="hidden"
            id="media-input"
          />
          <label
            htmlFor="media-input"
            className="flex flex-col items-center justify-center cursor-pointer"
          >
            <Plus className="w-8 h-8 text-[#C9D3C2] mb-2" />
            <p className="text-sm text-[#2A2A2A] font-medium">
              Clique para adicionar fotos, vídeos ou áudio
            </p>
            <p className="text-xs text-[#C9D3C2] mt-1">
              Até 10 mídias por momento
            </p>
          </label>
        </div>

        {/* Lista de mídias adicionadas */}
        {mediaFiles.length > 0 && (
          <div className="mt-4 space-y-2">
            <p className="text-sm font-semibold text-[#2A2A2A]">
              Mídias adicionadas ({mediaFiles.length})
            </p>
            {mediaFiles.map((file, index) => (
              <div
                key={index}
                className="flex items-center justify-between bg-[#F7F3EF] p-3 rounded-xl"
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="w-10 h-10 bg-[#C9D3C2] rounded-lg flex items-center justify-center text-xs font-bold text-white flex-shrink-0">
                    {file.type.startsWith("image")
                      ? "🖼️"
                      : file.type.startsWith("video")
                        ? "🎬"
                        : "🎵"}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-[#2A2A2A] truncate">
                      {file.name}
                    </p>
                    <p className="text-xs text-[#C9D3C2]">
                      {(file.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => handleRemoveMedia(index)}
                  className="p-1 hover:bg-white rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-[#C76A6A]" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Botões */}
      <div className="flex gap-2 pt-4">
        <button
          type="submit"
          disabled={isPending || !title}
          className="flex-1 bg-[#F2995D] text-white px-6 py-3 rounded-2xl font-semibold hover:bg-opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-95"
        >
          {isPending ? "Salvando..." : "Salvar Momento"}
        </button>
        <button
          type="button"
          onClick={() => navigate("/jornada")}
          className="flex-1 bg-[#C9D3C2] text-[#2A2A2A] px-6 py-3 rounded-2xl font-semibold hover:bg-opacity-80 transition-all"
        >
          Cancelar
        </button>
      </div>
    </form>
  );
};
