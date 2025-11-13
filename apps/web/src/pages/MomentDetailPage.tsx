import { useParams, useNavigate } from "react-router-dom";
import { useMoment } from "@/hooks/api";
import { ChevronLeft, Share2, Edit, Trash2 } from "lucide-react";

export const MomentDetailPage = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { data: moment, isLoading } = useMoment(id || "");

  if (isLoading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-6">
        <div className="bg-white rounded-2xl p-6 animate-pulse">
          <div className="h-64 bg-[#F7F3EF] rounded-2xl mb-4" />
          <div className="h-8 bg-[#F7F3EF] rounded-lg mb-2" />
          <div className="h-4 bg-[#F7F3EF] rounded-lg" />
        </div>
      </div>
    );
  }

  if (!moment) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-6 text-center">
        <p className="text-[#C9D3C2]">Momento não encontrado</p>
      </div>
    );
  }

  const formatDate = (date?: string | null) => {
    if (!date) return "";
    return new Date(date).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={() => navigate("/jornada")}
          className="p-2 hover:bg-[#F7F3EF] rounded-lg transition-colors"
        >
          <ChevronLeft className="w-5 h-5 text-[#2A2A2A]" />
        </button>
        <div className="flex gap-2">
          <button className="p-2 hover:bg-[#F7F3EF] rounded-lg transition-colors">
            <Share2 className="w-5 h-5 text-[#F2995D]" />
          </button>
          <button className="p-2 hover:bg-[#F7F3EF] rounded-lg transition-colors">
            <Edit className="w-5 h-5 text-[#2A2A2A]" />
          </button>
          <button className="p-2 hover:bg-[#F7F3EF] rounded-lg transition-colors">
            <Trash2 className="w-5 h-5 text-[#C76A6A]" />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="bg-white rounded-2xl overflow-hidden border border-[#C9D3C2]">
        {/* Media */}
        {moment.media.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-6">
            {moment.media.map((media) => (
              <div
                key={media.id}
                className="rounded-2xl overflow-hidden bg-[#F7F3EF] flex items-center justify-center h-48"
              >
                {media.kind === "photo" && (
                  <img
                    src={media.url}
                    alt={moment.title}
                    className="w-full h-full object-cover"
                  />
                )}
                {media.kind === "video" && (
                  <video
                    src={media.url}
                    controls
                    className="w-full h-full object-cover"
                  />
                )}
                {media.kind === "audio" && (
                  <audio src={media.url} controls className="w-full" />
                )}
              </div>
            ))}
          </div>
        )}

        {/* Text */}
        <div className="p-6 border-t border-[#C9D3C2]">
          <div className="mb-4">
            <p className="text-xs text-[#C9D3C2] mb-1">
              {formatDate(moment.occurredAt ?? moment.createdAt)}
            </p>
            <h1 className="text-2xl font-serif font-bold text-[#2A2A2A]">
              {moment.title}
            </h1>
          </div>

          {moment.summary && (
            <p className="text-[#2A2A2A] leading-relaxed whitespace-pre-wrap">
              {moment.summary}
            </p>
          )}

          {moment.templateKey && (
            <div className="mt-4 pt-4 border-t border-[#C9D3C2]">
              <p className="text-xs text-[#C9D3C2]">
                Template:{" "}
                <span className="font-semibold capitalize">
                  {moment.templateKey.replace("-", " ")}
                </span>
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Metadata */}
      <div className="mt-6 space-y-2 text-xs text-[#C9D3C2]">
        <p>
          Criado em {new Date(moment.createdAt).toLocaleString("pt-BR")}
        </p>
        {moment.updatedAt !== moment.createdAt && (
          <p>
            Atualizado em {new Date(moment.updatedAt).toLocaleString("pt-BR")}
          </p>
        )}
      </div>
    </div>
  );
};
