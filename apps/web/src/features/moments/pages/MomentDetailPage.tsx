import { useParams, useNavigate } from "react-router-dom";
import { useMoment } from "@/hooks/api";
import { getMediaUrl } from "@/lib/media";
import { ChevronLeft, Share2, Edit, Trash2 } from "lucide-react";

const MomentDetailSkeleton = () => (
  <div className="max-w-3xl mx-auto animate-pulse">
    <div className="h-10 bg-gray-200 rounded-lg w-1/3 mb-8" />
    <div className="bg-white rounded-2xl p-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="h-64 bg-gray-200 rounded-lg" />
        <div className="h-64 bg-gray-200 rounded-lg" />
      </div>
      <div className="h-8 bg-gray-200 rounded-lg w-3/4 mb-4" />
      <div className="h-4 bg-gray-200 rounded-lg w-full mb-2" />
      <div className="h-4 bg-gray-200 rounded-lg w-full mb-2" />
      <div className="h-4 bg-gray-200 rounded-lg w-1/2" />
    </div>
  </div>
);

export const MomentDetailPage = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { data: moment, isLoading } = useMoment(id || "");

  if (isLoading) {
    return <MomentDetailSkeleton />;
  }

  if (!moment) {
    return (
      <div className="max-w-3xl mx-auto text-center py-20">
        <h2 className="text-xl font-semibold text-gray-600">Momento não encontrado</h2>
        <p className="text-gray-400 mt-2">O momento que você está procurando não existe ou foi removido.</p>
        <button onClick={() => navigate("/momentos")} className="mt-6 bg-primary text-white px-4 py-2 rounded-lg">
          Voltar para Momentos
        </button>
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
    <div className="max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={() => navigate("/momentos")}
          className="flex items-center gap-2 p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ChevronLeft className="w-5 h-5 text-gray-700" />
          <span className="font-semibold text-gray-700">Voltar</span>
        </button>
        <div className="flex gap-2">
          <button
            type="button"
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="Compartilhar momento"
            title="Compartilhar momento"
          >
            <Share2 className="w-5 h-5 text-primary" />
          </button>
          <button
            type="button"
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="Editar momento"
            title="Editar momento"
          >
            <Edit className="w-5 h-5 text-gray-700" />
          </button>
          <button
            type="button"
            className="p-2 hover:bg-red-50 rounded-lg transition-colors"
            aria-label="Excluir momento"
            title="Excluir momento"
          >
            <Trash2 className="w-5 h-5 text-red-600" />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="bg-white rounded-2xl overflow-hidden border border-gray-200">
        {/* Media */}
        {moment.media.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4">
            {moment.media.map((media) => (
              <div
                key={media.id}
                className="rounded-lg overflow-hidden bg-gray-100 flex items-center justify-center aspect-w-4 aspect-h-3"
              >
                {media.kind === "photo" && (
                  <img
                    src={getMediaUrl(media, "full") ?? getMediaUrl(media) ?? ""}
                    alt={moment.title}
                    className="w-full h-full object-cover"
                  />
                )}
                {media.kind === "video" && (
                  <video
                    src={getMediaUrl(media) ?? ""}
                    controls
                    className="w-full h-full object-cover"
                  />
                )}
                {media.kind === "audio" && (
                  <audio src={getMediaUrl(media) ?? ""} controls className="w-full" />
                )}
              </div>
            ))}
          </div>
        )}

        {/* Text */}
        <div className="p-6">
          <div className="mb-4">
            <p className="text-sm text-gray-500 mb-1">
              {formatDate(moment.occurredAt ?? moment.createdAt)}
            </p>
            <h1 className="text-3xl font-bold text-gray-800">
              {moment.title}
            </h1>
          </div>

          {moment.summary && (
            <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
              {moment.summary}
            </p>
          )}

          {moment.templateKey && (
            <div className="mt-6 pt-4 border-t border-gray-200">
              <p className="text-sm text-gray-500">
                Template:{" "}
                <span className="font-semibold capitalize text-gray-600">
                  {moment.templateKey.replace("-", " ")}
                </span>
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
