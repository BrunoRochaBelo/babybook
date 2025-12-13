/**
 * Delivery Upload Page
 *
 * Página para adicionar mais fotos a uma entrega existente.
 * Reutiliza o hook usePartnerUpload.
 */

import { useRef } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowLeft,
  Upload,
  Image,
  Loader2,
  X,
  CheckCircle2,
  AlertCircle,
  Trash2,
  RefreshCw,
} from "lucide-react";
import { getDelivery } from "./api";
import { usePartnerUpload } from "./usePartnerUpload";

export function DeliveryUploadPage() {
  const { deliveryId } = useParams<{ deliveryId: string }>();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Query delivery details
  const {
    data: delivery,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["delivery", deliveryId],
    queryFn: () => getDelivery(deliveryId!),
    enabled: !!deliveryId,
  });

  // Upload hook
  const {
    uploads,
    addFiles,
    retryUpload,
    removeUpload,
    isUploading,
    hasErrors,
    completedCount,
    totalCount,
    totalProgress,
  } = usePartnerUpload({
    deliveryId: deliveryId!,
    onAllComplete: () => {
      // Opcional: redirecionar após completar
    },
  });

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      addFiles(e.target.files);
      e.target.value = "";
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files.length > 0) {
      addFiles(e.dataTransfer.files);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-pink-500" />
      </div>
    );
  }

  if (error || !delivery) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="text-red-600 mb-4">Entrega não encontrada</p>
          <Link
            to="/partner/deliveries"
            className="text-pink-600 hover:underline"
          >
            Voltar às entregas
          </Link>
        </div>
      </div>
    );
  }

  // Não permitir upload se já tem voucher
  if (delivery.voucher_code) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl p-8 max-w-md text-center">
          <AlertCircle className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">
            Entrega Finalizada
          </h2>
          <p className="text-gray-600 mb-6">
            Não é possível adicionar fotos após o voucher ser gerado.
          </p>
          <Link
            to={`/partner/deliveries/${deliveryId}`}
            className="inline-flex items-center gap-2 px-4 py-2 bg-pink-500 text-white rounded-lg hover:bg-pink-600 transition-colors"
          >
            Ver Entrega
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="max-w-3xl mx-auto px-4 py-6 sm:py-8">
        {/* Page Header */}
        <div className="mb-6">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
            Adicionar Fotos
          </h1>
          <p className="text-gray-500 mt-1">
            Entrega: {delivery.title || delivery.client_name || "Sem título"}
          </p>
        </div>
        {/* Current Stats */}
        <div className="bg-white rounded-xl p-4 border border-gray-200 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-pink-100 rounded-lg flex items-center justify-center">
                <Image className="w-5 h-5 text-pink-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Fotos na entrega</p>
                <p className="text-xl font-bold text-gray-900">
                  {delivery.assets_count}
                </p>
              </div>
            </div>
            {completedCount > 0 && (
              <div className="text-right">
                <p className="text-sm text-gray-500">Enviadas agora</p>
                <p className="text-xl font-bold text-green-600">
                  +{completedCount}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Upload Zone */}
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          className="bg-white rounded-xl border-2 border-dashed border-gray-300 p-8 text-center hover:border-pink-400 transition-colors cursor-pointer"
          onClick={() => fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
          />
          <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 font-medium">
            Arraste as fotos ou clique para selecionar
          </p>
          <p className="text-sm text-gray-400 mt-2">
            JPG, PNG, WEBP • Até 20MB por arquivo
          </p>
        </div>

        {/* Upload Progress */}
        {uploads.length > 0 && (
          <div className="mt-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">
                Uploads ({completedCount}/{totalCount})
              </h2>
              {isUploading && (
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  {totalProgress}%
                </div>
              )}
            </div>

            <div className="space-y-2">
              {uploads.map((upload) => (
                <div
                  key={upload.id}
                  className="flex items-center gap-3 p-3 bg-white rounded-lg border border-gray-200"
                >
                  <div className="w-8 h-8 bg-gray-100 rounded flex items-center justify-center">
                    <Image className="w-4 h-4 text-gray-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {upload.file.name}
                    </p>
                    {upload.status === "error" ? (
                      <p className="text-xs text-red-500">{upload.error}</p>
                    ) : (
                      <div className="mt-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full transition-all ${
                            upload.status === "complete"
                              ? "bg-green-500"
                              : "bg-pink-500"
                          }`}
                          style={{ width: `${upload.progress}%` }}
                        />
                      </div>
                    )}
                  </div>
                  {upload.status === "complete" && (
                    <CheckCircle2 className="w-5 h-5 text-green-500" />
                  )}
                  {upload.status === "error" && (
                    <button
                      onClick={() => retryUpload(upload.id)}
                      className="p-1 text-gray-400 hover:text-pink-600"
                    >
                      <RefreshCw className="w-4 h-4" />
                    </button>
                  )}
                  {(upload.status === "compressing" ||
                    upload.status === "uploading") && (
                    <Loader2 className="w-4 h-4 animate-spin text-pink-500" />
                  )}
                  <button
                    onClick={() => removeUpload(upload.id)}
                    className="p-1 text-gray-400 hover:text-red-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="mt-8 flex gap-4">
          <button
            onClick={() => navigate(`/partner/deliveries/${deliveryId}`)}
            className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors font-medium"
          >
            Cancelar
          </button>
          <button
            onClick={() => navigate(`/partner/deliveries/${deliveryId}`)}
            disabled={isUploading}
            className="flex-1 px-4 py-3 bg-pink-500 text-white rounded-xl hover:bg-pink-600 transition-colors disabled:opacity-50 font-medium"
          >
            {isUploading ? "Aguarde..." : "Concluir"}
          </button>
        </div>
      </main>
    </div>
  );
}

export default DeliveryUploadPage;
