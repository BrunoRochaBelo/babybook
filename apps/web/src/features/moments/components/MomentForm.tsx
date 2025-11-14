import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { MediaUploader } from "./MediaUploader";
import { Button } from "@/components/ui/button";
import { useCreateMoment } from "@/hooks/api";
import type { MomentTemplate } from "../hooks/useMomentTemplate";

interface MomentFormProps {
  childId: string;
  template?: MomentTemplate | null;
  onSuccess?: () => void;
}

export const MomentForm = ({
  childId,
  template,
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

  useEffect(() => {
    if (template) {
      setTitle(template.title);
    }
  }, [template]);

  const handleAddMedia = (files: File[]) => {
    setMediaFiles((prev) => [...prev, ...files]);
  };

  const handleRemoveMedia = (index: number) => {
    setMediaFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !occurredAt) {
      return;
    }
    createMoment(
      {
        childId,
        title,
        summary: summary || undefined,
        occurredAt,
        templateKey: template?.templateKey ?? template?.id,
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
          if (onSuccess) {
            onSuccess();
          } else {
            navigate("/momentos");
          }
        },
      }
    );
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label className="block text-sm font-semibold text-gray-800 mb-2">
          Título do Momento *
        </label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-primary focus:outline-none"
          placeholder="Ex: Primeiro Sorriso"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-semibold text-gray-800 mb-2">
          Data do Momento *
        </label>
        <input
          type="date"
          value={occurredAt}
          onChange={(e) => setOccurredAt(e.target.value)}
          className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-primary focus:outline-none"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-semibold text-gray-800 mb-2">
          Descrição (opcional)
        </label>
        <textarea
          value={summary}
          onChange={(e) => setSummary(e.target.value)}
          className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg resize-none focus:border-primary focus:outline-none"
          rows={4}
          placeholder="Conte a história desse momento especial..."
        />
      </div>

      <MediaUploader
        mediaFiles={mediaFiles}
        onAddMedia={handleAddMedia}
        onRemoveMedia={handleRemoveMedia}
      />

      <div className="flex gap-4 pt-4">
        <Button type="submit" disabled={isPending || !title} className="flex-1">
          {isPending ? "Salvando..." : "Salvar Momento"}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => navigate("/momentos")}
          className="flex-1"
        >
          Cancelar
        </Button>
      </div>
    </form>
  );
};
