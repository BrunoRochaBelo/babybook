/**
 * Create Delivery Page
 *
 * Fluxo completo de criação de entrega:
 * 1. Dados do cliente
 * 2. Upload de fotos (com compressão client-side)
 * 3. Gerar voucher
 */

import { useState, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  ArrowRight,
  Upload,
  Image,
  Loader2,
  X,
  CheckCircle2,
  AlertCircle,
  Trash2,
  RefreshCw,
  Search,
  Gift,
  UserPlus,
  CreditCard,
} from "lucide-react";
import { createDelivery, checkClientAccess } from "./api";
import { usePartnerUpload } from "./usePartnerUpload";
import type { CreateDeliveryRequest } from "./types";

type Step = "client" | "upload" | "review";

export function CreateDeliveryPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [currentStep, setCurrentStep] = useState<Step>("client");
  const [deliveryId, setDeliveryId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [clientName, setClientName] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [childName, setChildName] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [eventDate, setEventDate] = useState("");

  // Access verification state
  const [accessStatus, setAccessStatus] = useState<{
    hasAccess: boolean;
    childName?: string;
    message: string;
  } | null>(null);
  const [isCheckingAccess, setIsCheckingAccess] = useState(false);

  // Verifica se cliente já tem acesso usando API real
  const handleCheckAccess = async () => {
    setIsCheckingAccess(true);
    setAccessStatus(null);

    try {
      const response = await checkClientAccess(clientEmail);
      setAccessStatus({
        hasAccess: response.has_access,
        childName: response.client_name || undefined,
        message: response.message,
      });
      
      // Se tiver nome do cliente, preenche automaticamente
      if (response.client_name && !clientName) {
        setClientName(response.client_name);
      }
    } catch (err) {
      setAccessStatus({
        hasAccess: false,
        message: "Erro ao verificar acesso. Tente novamente.",
      });
    }

    setIsCheckingAccess(false);
  };

  // Create delivery mutation
  const createMutation = useMutation({
    mutationFn: (data: CreateDeliveryRequest) => createDelivery(data),
    onSuccess: (delivery) => {
      setDeliveryId(delivery.id);
      setCurrentStep("upload");
    },
    onError: (err) => {
      setError(err instanceof Error ? err.message : "Erro ao criar entrega");
    },
  });

  const handleCreateDelivery = () => {
    if (!clientName.trim()) {
      setError("Nome do responsável é obrigatório");
      return;
    }
    if (!childName.trim()) {
      setError("Nome da criança é obrigatório");
      return;
    }
    setError(null);
    createMutation.mutate({
      client_name: clientName.trim(),
      title: title.trim() || `Ensaio - ${childName.trim()}`,
      description: description.trim() || undefined,
      event_date: eventDate || undefined,
    });
  };

  const handleComplete = () => {
    queryClient.invalidateQueries({ queryKey: ["partner", "deliveries"] });
    queryClient.invalidateQueries({ queryKey: ["partner", "stats"] });
    navigate(`/partner/deliveries/${deliveryId}`);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="max-w-3xl mx-auto px-4 py-6 sm:py-8">
        {/* Page Header with Progress Steps */}
        <div className="mb-6">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-6">
            Nova Entrega
          </h1>

          {/* Progress Steps */}
          <div className="flex items-center gap-4">
            <StepIndicator
              step={1}
              label="Cliente"
              active={currentStep === "client"}
              completed={currentStep !== "client"}
            />
            <div className="flex-1 h-0.5 bg-gray-200">
              <div
                className={`h-full bg-pink-500 transition-all ${
                  currentStep === "client"
                    ? "w-0"
                    : currentStep === "upload"
                      ? "w-1/2"
                      : "w-full"
                }`}
              />
            </div>
            <StepIndicator
              step={2}
              label="Upload"
              active={currentStep === "upload"}
              completed={currentStep === "review"}
            />
            <div className="flex-1 h-0.5 bg-gray-200">
              <div
                className={`h-full bg-pink-500 transition-all ${
                  currentStep === "review" ? "w-full" : "w-0"
                }`}
              />
            </div>
            <StepIndicator
              step={3}
              label="Revisar"
              active={currentStep === "review"}
              completed={false}
            />
          </div>
        </div>
        {/* Error */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3 text-red-700">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <p>{error}</p>
            <button onClick={() => setError(null)} className="ml-auto">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Step Content */}
        {currentStep === "client" && (
          <ClientStep
            clientName={clientName}
            setClientName={setClientName}
            clientEmail={clientEmail}
            setClientEmail={setClientEmail}
            childName={childName}
            setChildName={setChildName}
            title={title}
            setTitle={setTitle}
            description={description}
            setDescription={setDescription}
            eventDate={eventDate}
            setEventDate={setEventDate}
            accessStatus={accessStatus}
            isCheckingAccess={isCheckingAccess}
            onCheckAccess={handleCheckAccess}
            onNext={handleCreateDelivery}
            isLoading={createMutation.isPending}
          />
        )}

        {currentStep === "upload" && deliveryId && (
          <UploadStep
            deliveryId={deliveryId}
            onNext={() => setCurrentStep("review")}
            onBack={() => setCurrentStep("client")}
          />
        )}

        {currentStep === "review" && deliveryId && (
          <ReviewStep
            deliveryId={deliveryId}
            clientName={clientName}
            onComplete={handleComplete}
            onBack={() => setCurrentStep("upload")}
          />
        )}
      </main>
    </div>
  );
}

// =============================================================================
// Step Indicator
// =============================================================================

interface StepIndicatorProps {
  step: number;
  label: string;
  active: boolean;
  completed: boolean;
}

function StepIndicator({ step, label, active, completed }: StepIndicatorProps) {
  return (
    <div className="flex items-center gap-2">
      <div
        className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
          completed
            ? "bg-pink-500 text-white"
            : active
              ? "bg-pink-500 text-white"
              : "bg-gray-200 text-gray-600"
        }`}
      >
        {completed ? <CheckCircle2 className="w-4 h-4" /> : step}
      </div>
      <span
        className={`text-sm ${active ? "text-gray-900 font-medium" : "text-gray-500"}`}
      >
        {label}
      </span>
    </div>
  );
}

// =============================================================================
// Client Step
// =============================================================================

interface ClientStepProps {
  clientName: string;
  setClientName: (v: string) => void;
  title: string;
  setTitle: (v: string) => void;
  description: string;
  setDescription: (v: string) => void;
  eventDate: string;
  setEventDate: (v: string) => void;
  clientEmail: string;
  setClientEmail: (v: string) => void;
  childName: string;
  setChildName: (v: string) => void;
  accessStatus: AccessCheckResult | null;
  isCheckingAccess: boolean;
  onCheckAccess: () => void;
  onNext: () => void;
  isLoading: boolean;
}

// Resultado da verificação de acesso
interface AccessCheckResult {
  hasAccess: boolean;
  childName?: string;
  message: string;
}

function ClientStep({
  clientName,
  setClientName,
  title,
  setTitle,
  description,
  setDescription,
  eventDate,
  setEventDate,
  clientEmail,
  setClientEmail,
  childName,
  setChildName,
  accessStatus,
  isCheckingAccess,
  onCheckAccess,
  onNext,
  isLoading,
}: ClientStepProps) {
  const emailIsValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clientEmail);

  return (
    <div className="space-y-6">
      {/* Card de verificação de acesso */}
      <div className="bg-white rounded-xl p-6 border border-gray-200">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-pink-100 rounded-lg flex items-center justify-center">
            <Search className="w-5 h-5 text-pink-600" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              Verificar Acesso
            </h2>
            <p className="text-sm text-gray-500">
              Digite o e-mail do responsável para verificar se já tem Baby Book
            </p>
          </div>
        </div>

        <div className="flex gap-3">
          <div className="flex-1">
            <input
              type="email"
              value={clientEmail}
              onChange={(e) => setClientEmail(e.target.value)}
              placeholder="email@responsavel.com"
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
            />
          </div>
          <button
            type="button"
            onClick={onCheckAccess}
            disabled={!emailIsValid || isCheckingAccess}
            className="px-4 py-2.5 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-2"
          >
            {isCheckingAccess ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Verificando...
              </>
            ) : (
              <>
                <Search className="w-4 h-4" />
                Verificar
              </>
            )}
          </button>
        </div>

        {/* Resultado da verificação */}
        {accessStatus && (
          <div
            className={`mt-4 p-4 rounded-lg flex items-start gap-3 ${
              accessStatus.hasAccess
                ? "bg-green-50 border border-green-200"
                : "bg-blue-50 border border-blue-200"
            }`}
          >
            {accessStatus.hasAccess ? (
              <>
                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <CheckCircle2 className="w-5 h-5 text-green-600" />
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-green-800">
                    🎉 Cliente já tem acesso!
                  </p>
                  <p className="text-sm text-green-700 mt-1">
                    {accessStatus.message}
                  </p>
                  <div className="mt-3 inline-flex items-center gap-2 px-3 py-1.5 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                    <Gift className="w-4 h-4" />
                    Esta entrega não consome crédito
                  </div>
                </div>
              </>
            ) : (
              <>
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <UserPlus className="w-5 h-5 text-blue-600" />
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-blue-800">
                    Novo cliente
                  </p>
                  <p className="text-sm text-blue-700 mt-1">
                    {accessStatus.message}
                  </p>
                  <div className="mt-3 inline-flex items-center gap-2 px-3 py-1.5 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                    <CreditCard className="w-4 h-4" />
                    Será consumido 1 crédito
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* Dados da entrega */}
      <div className="bg-white rounded-xl p-6 border border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900 mb-6">
          Dados da Entrega
        </h2>

        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nome do Responsável *
              </label>
              <input
                type="text"
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                placeholder="Ex: Maria Silva"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nome da Criança *
              </label>
              <input
                type="text"
                value={childName}
                onChange={(e) => setChildName(e.target.value)}
                placeholder="Ex: João"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Título da Entrega (opcional)
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex: Ensaio Newborn - Bebê João"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Data do Evento (opcional)
            </label>
            <input
              type="date"
              value={eventDate}
              onChange={(e) => setEventDate(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Descrição (opcional)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              placeholder="Observações sobre a entrega..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500 resize-none"
            />
          </div>
        </div>

        <div className="mt-8 flex justify-end">
          <button
            onClick={onNext}
            disabled={!clientName.trim() || !childName.trim() || isLoading}
            className="inline-flex items-center gap-2 px-6 py-2 bg-pink-500 text-white rounded-lg hover:bg-pink-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Criando...
              </>
            ) : (
              <>
                Próximo
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// Upload Step
// =============================================================================

interface UploadStepProps {
  deliveryId: string;
  onNext: () => void;
  onBack: () => void;
}

function UploadStep({ deliveryId, onNext, onBack }: UploadStepProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

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
    deliveryId,
    onAllComplete: () => {
      // Auto-advance when all uploads complete
    },
  });

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files.length > 0) {
        addFiles(e.target.files);
      }
      // Reset input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    },
    [addFiles],
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        addFiles(e.dataTransfer.files);
      }
    },
    [addFiles],
  );

  return (
    <div className="space-y-6">
      {/* Drop Zone */}
      <div
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
        className="bg-white rounded-xl p-8 border-2 border-dashed border-gray-300 hover:border-pink-300 transition-colors text-center"
      >
        <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-600 mb-2">Arraste fotos aqui ou</p>
        <button
          onClick={() => fileInputRef.current?.click()}
          className="inline-flex items-center gap-2 px-4 py-2 bg-pink-500 text-white rounded-lg hover:bg-pink-600 transition-colors"
        >
          <Image className="w-4 h-4" />
          Selecionar Arquivos
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,video/*"
          multiple
          onChange={handleFileSelect}
          className="hidden"
        />
        <p className="text-xs text-gray-500 mt-4">
          Imagens serão comprimidas automaticamente antes do envio
        </p>
      </div>

      {/* Upload List */}
      {uploads.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="p-4 border-b border-gray-200 flex items-center justify-between">
            <div>
              <p className="font-medium text-gray-900">
                {completedCount} de {totalCount} arquivos enviados
              </p>
              {isUploading && (
                <p className="text-sm text-gray-500">
                  Progresso: {totalProgress}%
                </p>
              )}
            </div>
            {isUploading && (
              <Loader2 className="w-5 h-5 animate-spin text-pink-500" />
            )}
          </div>

          <div className="max-h-64 overflow-y-auto divide-y divide-gray-100">
            {uploads.map((upload) => (
              <div
                key={upload.id}
                className="flex items-center gap-4 p-3 hover:bg-gray-50"
              >
                <div className="w-10 h-10 bg-gray-100 rounded flex items-center justify-center">
                  <Image className="w-5 h-5 text-gray-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {upload.file.name}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    {upload.status === "compressing" && (
                      <span className="text-xs text-blue-600">
                        Comprimindo...
                      </span>
                    )}
                    {upload.status === "uploading" && (
                      <>
                        <div className="flex-1 h-1 bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-pink-500 transition-all"
                            style={{ width: `${upload.progress}%` }}
                          />
                        </div>
                        <span className="text-xs text-gray-500">
                          {upload.progress}%
                        </span>
                      </>
                    )}
                    {upload.status === "complete" && (
                      <span className="text-xs text-green-600 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" />
                        Concluído
                      </span>
                    )}
                    {upload.status === "error" && (
                      <span className="text-xs text-red-600">
                        {upload.error}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  {upload.status === "error" && (
                    <button
                      onClick={() => retryUpload(upload.id)}
                      className="p-1 text-gray-400 hover:text-pink-500"
                      title="Tentar novamente"
                    >
                      <RefreshCw className="w-4 h-4" />
                    </button>
                  )}
                  {upload.status !== "uploading" && (
                    <button
                      onClick={() => removeUpload(upload.id)}
                      className="p-1 text-gray-400 hover:text-red-500"
                      title="Remover"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Navigation */}
      <div className="flex justify-between">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar
        </button>
        <button
          onClick={onNext}
          disabled={completedCount === 0 || isUploading}
          className="inline-flex items-center gap-2 px-6 py-2 bg-pink-500 text-white rounded-lg hover:bg-pink-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Revisar Entrega
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

// =============================================================================
// Review Step
// =============================================================================

interface ReviewStepProps {
  deliveryId: string;
  clientName: string;
  onComplete: () => void;
  onBack: () => void;
}

function ReviewStep({
  deliveryId,
  clientName,
  onComplete,
  onBack,
}: ReviewStepProps) {
  return (
    <div className="bg-white rounded-xl p-6 border border-gray-200">
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle2 className="w-8 h-8 text-green-600" />
        </div>
        <h2 className="text-xl font-semibold text-gray-900">Entrega Criada!</h2>
        <p className="text-gray-500 mt-2">
          A entrega para <strong>{clientName}</strong> foi criada com sucesso.
        </p>
      </div>

      <div className="bg-gray-50 rounded-lg p-4 mb-6">
        <p className="text-sm text-gray-600">
          <strong>Próximo passo:</strong> Acesse os detalhes da entrega para
          gerar o voucher que será enviado ao cliente.
        </p>
      </div>

      <div className="flex justify-between">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="w-4 h-4" />
          Adicionar mais fotos
        </button>
        <button
          onClick={onComplete}
          className="inline-flex items-center gap-2 px-6 py-2 bg-pink-500 text-white rounded-lg hover:bg-pink-600 transition-colors"
        >
          Ver Entrega
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

export default CreateDeliveryPage;
