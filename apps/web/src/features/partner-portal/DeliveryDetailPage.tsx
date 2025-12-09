/**
 * Delivery Detail Page
 *
 * Detalhes da entrega com:
 * - Lista de assets
 * - Geração de voucher
 * - Download do cartão-convite
 */

import { useState, useRef } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  Image,
  Trash2,
  Loader2,
  Download,
  Share2,
  Ticket,
  Copy,
  Check,
  QrCode,
  AlertCircle,
  Plus,
} from "lucide-react";
import { getDelivery, generateVoucherCard, deleteDeliveryAsset } from "./api";
import { VoucherCard } from "./VoucherCard";
import type {
  DeliveryDetail,
  VoucherCardData,
  GenerateVoucherCardRequest,
} from "./types";

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

export function DeliveryDetailPage() {
  const { deliveryId } = useParams<{ deliveryId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [showVoucherModal, setShowVoucherModal] = useState(false);
  const [voucherCard, setVoucherCard] = useState<VoucherCardData | null>(null);
  const [copied, setCopied] = useState(false);

  // Query
  const {
    data: delivery,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["delivery", deliveryId],
    queryFn: () => getDelivery(deliveryId!),
    enabled: !!deliveryId,
  });

  // Delete asset mutation
  const deleteAssetMutation = useMutation({
    mutationFn: ({ key }: { key: string }) =>
      deleteDeliveryAsset(deliveryId!, key),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["delivery", deliveryId] });
    },
  });

  // Generate voucher mutation
  const generateVoucherMutation = useMutation({
    mutationFn: (request: GenerateVoucherCardRequest) =>
      generateVoucherCard(deliveryId!, request),
    onSuccess: (data) => {
      setVoucherCard(data);
      queryClient.invalidateQueries({ queryKey: ["delivery", deliveryId] });
      queryClient.invalidateQueries({ queryKey: ["partner", "stats"] });
    },
  });

  const handleCopyCode = async () => {
    if (voucherCard?.voucher_code) {
      await navigator.clipboard.writeText(voucherCard.voucher_code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleCopyUrl = async () => {
    if (voucherCard?.redeem_url) {
      await navigator.clipboard.writeText(voucherCard.redeem_url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
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

  const hasVoucher = !!delivery.voucher_code;
  const canGenerateVoucher = delivery.assets_count > 0 && !hasVoucher;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-4 py-6">
          <button
            onClick={() => navigate("/partner/deliveries")}
            className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar às Entregas
          </button>

          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {delivery.title || delivery.client_name || "Entrega"}
              </h1>
              <p className="text-gray-500 mt-1">
                {delivery.client_name && `Cliente: ${delivery.client_name} • `}
                Criada em {formatDate(delivery.created_at)}
              </p>
            </div>

            <div className="flex items-center gap-2">
              {hasVoucher ? (
                <button
                  onClick={() => setShowVoucherModal(true)}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-pink-500 text-white rounded-lg hover:bg-pink-600 transition-colors"
                >
                  <QrCode className="w-4 h-4" />
                  Ver Voucher
                </button>
              ) : canGenerateVoucher ? (
                <button
                  onClick={() => setShowVoucherModal(true)}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-pink-500 text-white rounded-lg hover:bg-pink-600 transition-colors"
                >
                  <Ticket className="w-4 h-4" />
                  Gerar Voucher
                </button>
              ) : null}
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8">
        {/* Voucher Info (if exists) */}
        {hasVoucher && (
          <div className="mb-8 bg-gradient-to-r from-pink-500 to-rose-500 rounded-2xl p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-pink-100 text-sm">Código do Voucher</p>
                <p className="text-2xl font-mono font-bold mt-1">
                  {delivery.voucher_code}
                </p>
                {delivery.redeemed_at && (
                  <p className="text-pink-100 text-sm mt-2">
                    Resgatado em {formatDate(delivery.redeemed_at)}
                  </p>
                )}
              </div>
              <button
                onClick={() => setShowVoucherModal(true)}
                className="px-4 py-2 bg-white text-pink-600 rounded-lg hover:bg-pink-50 transition-colors font-medium"
              >
                Ver Cartão
              </button>
            </div>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="bg-white rounded-xl p-4 border border-gray-200">
            <p className="text-sm text-gray-500">Arquivos</p>
            <p className="text-2xl font-bold text-gray-900">
              {delivery.assets_count}
            </p>
          </div>
          <div className="bg-white rounded-xl p-4 border border-gray-200">
            <p className="text-sm text-gray-500">Status</p>
            <p className="text-lg font-medium text-gray-900 capitalize">
              {delivery.status === "ready"
                ? "Pronta"
                : delivery.status === "delivered"
                  ? "Entregue"
                  : delivery.status === "draft"
                    ? "Rascunho"
                    : delivery.status}
            </p>
          </div>
          <div className="bg-white rounded-xl p-4 border border-gray-200">
            <p className="text-sm text-gray-500">Voucher</p>
            <p className="text-lg font-medium text-gray-900">
              {hasVoucher
                ? delivery.redeemed_at
                  ? "Resgatado"
                  : "Ativo"
                : "Não gerado"}
            </p>
          </div>
        </div>

        {/* Assets Grid */}
        <div className="bg-white rounded-xl border border-gray-200">
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">
              Arquivos ({delivery.assets_count})
            </h2>
            <Link
              to={`/partner/deliveries/${deliveryId}/upload`}
              className="inline-flex items-center gap-2 px-3 py-1.5 text-sm text-pink-600 hover:text-pink-700 font-medium"
            >
              <Plus className="w-4 h-4" />
              Adicionar
            </Link>
          </div>

          {delivery.assets.length === 0 ? (
            <div className="p-8 text-center">
              <Image className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 mb-4">Nenhum arquivo enviado ainda</p>
              <Link
                to={`/partner/deliveries/${deliveryId}/upload`}
                className="inline-flex items-center gap-2 px-4 py-2 bg-pink-500 text-white rounded-lg hover:bg-pink-600 transition-colors"
              >
                <Plus className="w-4 h-4" />
                Enviar Arquivos
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4">
              {delivery.assets.map((asset) => (
                <div
                  key={asset.key}
                  className="group relative aspect-square bg-gray-100 rounded-lg overflow-hidden"
                >
                  {/* Thumbnail placeholder */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Image className="w-8 h-8 text-gray-400" />
                  </div>

                  {/* Overlay */}
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <button
                      onClick={() => {
                        if (confirm("Remover este arquivo?")) {
                          deleteAssetMutation.mutate({ key: asset.key });
                        }
                      }}
                      className="p-2 bg-white/20 rounded-full hover:bg-white/30 text-white"
                      title="Remover"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Info */}
                  <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/50 to-transparent">
                    <p className="text-xs text-white truncate">
                      {asset.filename}
                    </p>
                    <p className="text-xs text-white/70">
                      {formatFileSize(asset.size_bytes)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Voucher Modal */}
      {showVoucherModal && (
        <VoucherModal
          delivery={delivery}
          voucherCard={voucherCard}
          isGenerating={generateVoucherMutation.isPending}
          error={generateVoucherMutation.error?.message}
          onGenerate={(request) => generateVoucherMutation.mutate(request)}
          onCopyCode={handleCopyCode}
          onCopyUrl={handleCopyUrl}
          copied={copied}
          onClose={() => {
            setShowVoucherModal(false);
            if (!delivery.voucher_code && voucherCard) {
              // Refresh delivery data after generating voucher
              queryClient.invalidateQueries({
                queryKey: ["delivery", deliveryId],
              });
            }
          }}
        />
      )}
    </div>
  );
}

// =============================================================================
// Voucher Modal
// =============================================================================

interface VoucherModalProps {
  delivery: DeliveryDetail;
  voucherCard: VoucherCardData | null;
  isGenerating: boolean;
  error?: string;
  onGenerate: (request: GenerateVoucherCardRequest) => void;
  onCopyCode: () => void;
  onCopyUrl: () => void;
  copied: boolean;
  onClose: () => void;
}

function VoucherModal({
  delivery,
  voucherCard,
  isGenerating,
  error,
  onGenerate,
  onCopyCode,
  onCopyUrl,
  copied,
  onClose,
}: VoucherModalProps) {
  const [beneficiaryName, setBeneficiaryName] = useState(
    delivery.client_name || "",
  );
  const [message, setMessage] = useState("");

  const hasExistingVoucher = !!delivery.voucher_code;
  const showGenerateForm = !hasExistingVoucher && !voucherCard;
  const cardData =
    voucherCard ||
    (hasExistingVoucher
      ? {
          voucher_code: delivery.voucher_code!,
          redeem_url: `${window.location.origin}/voucher/redeem/${delivery.voucher_code}`,
          qr_data: `${window.location.origin}/voucher/redeem/${delivery.voucher_code}`,
          studio_name: "",
          studio_logo_url: null,
          beneficiary_name: delivery.client_name,
          message: "",
          assets_count: delivery.assets_count,
          expires_at: null,
        }
      : null);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {showGenerateForm ? (
            <>
              <h2 className="text-xl font-bold text-gray-900 mb-6">
                Gerar Voucher
              </h2>

              <p className="text-gray-600 mb-6">
                Isso irá consumir <strong>1 crédito</strong> do seu saldo. O
                voucher será único para esta entrega.
              </p>

              <div className="space-y-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nome do Beneficiário
                  </label>
                  <input
                    type="text"
                    value={beneficiaryName}
                    onChange={(e) => setBeneficiaryName(e.target.value)}
                    placeholder="Nome que aparecerá no cartão"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Mensagem (opcional)
                  </label>
                  <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    rows={3}
                    placeholder="Uma mensagem especial para o cliente..."
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500 resize-none"
                  />
                </div>
              </div>

              {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                  {error}
                </div>
              )}

              <div className="flex gap-3">
                <button
                  onClick={onClose}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  onClick={() =>
                    onGenerate({
                      beneficiary_name: beneficiaryName || undefined,
                      message: message || undefined,
                    })
                  }
                  disabled={isGenerating}
                  className="flex-1 px-4 py-2 bg-pink-500 text-white rounded-lg hover:bg-pink-600 disabled:opacity-50 inline-flex items-center justify-center gap-2"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Gerando...
                    </>
                  ) : (
                    <>
                      <Ticket className="w-4 h-4" />
                      Gerar Voucher
                    </>
                  )}
                </button>
              </div>
            </>
          ) : cardData ? (
            <>
              <h2 className="text-xl font-bold text-gray-900 mb-6">
                Cartão-Convite
              </h2>

              {/* Use VoucherCard Component */}
              <VoucherCard data={cardData} />

              <button
                onClick={onClose}
                className="w-full mt-6 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Fechar
              </button>
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
}

export default DeliveryDetailPage;
