/**
 * Create Delivery Page
 *
 * Fluxo completo de criação de entrega:
 * 1. Dados do cliente
 * 2. Upload de fotos (com compressão client-side)
 * 3. Gerar voucher
 */

import { useMemo, useState, useCallback, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
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
import { createDelivery, checkEligibility } from "./api";
import { usePartnerUpload } from "./usePartnerUpload";
import type { CreateDeliveryRequest } from "./types";
import { usePartnerPageHeader } from "@/layouts/partnerPageHeader";
import { PartnerPage } from "@/layouts/PartnerPage";

type Step = "client" | "upload" | "review";

export function CreateDeliveryPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [currentStep, setCurrentStep] = useState<Step>("client");
  const [deliveryId, setDeliveryId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  usePartnerPageHeader(
    useMemo(() => {
      const stepLabel =
        currentStep === "client"
          ? "Cliente"
          : currentStep === "upload"
            ? "Upload"
            : "Revisar";

      return {
        title: "Nova entrega",
        backTo: "/partner/deliveries",
        backLabel: "Voltar às entregas",
        badge: {
          text: stepLabel,
          tone: "info",
        },
      };
    }, [currentStep]),
  );

  // Form state
  const [clientName, setClientName] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [childName, setChildName] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [eventDate, setEventDate] = useState("");

  // Access verification state
  const [accessStatus, setAccessStatus] = useState<AccessCheckResult | null>(
    null,
  );
  const [isCheckingAccess, setIsCheckingAccess] = useState(false);

  const checkReqIdRef = useRef(0);
  const isValidEmail = useCallback(
    (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email),
    [],
  );

  const runEligibilityCheck = useCallback(
    async (rawEmail: string) => {
      const normalizedEmail = rawEmail.trim().toLowerCase();
      if (!normalizedEmail || !isValidEmail(normalizedEmail)) {
        setAccessStatus(null);
        setIsCheckingAccess(false);
        return;
      }

      const requestId = ++checkReqIdRef.current;
      setIsCheckingAccess(true);
      setAccessStatus(null);

      try {
        const response = await checkEligibility(normalizedEmail);

        // Evita race condition quando o usuário digita rápido
        if (requestId !== checkReqIdRef.current) return;

        setAccessStatus({
          hasAccess: response.is_eligible,
          children: [],
          message: response.is_eligible
            ? "Elegível: este e-mail já tem pelo menos 1 Baby Book ativo. Esta entrega pode ser enviada sem custo agora."
            : "Novo cliente: esta entrega deve consumir 1 crédito do fotógrafo.",
        });
      } catch {
        if (requestId !== checkReqIdRef.current) return;

        // Fail-safe: se falhar, assumimos 'novo cliente'
        setAccessStatus({
          hasAccess: false,
          children: [],
          message:
            "Não consegui validar agora. Vou assumir novo cliente (1 crédito) para evitar erro no fluxo.",
        });
      } finally {
        if (requestId === checkReqIdRef.current) setIsCheckingAccess(false);
      }
    },
    [isValidEmail],
  );

  // Validação silenciosa com debounce de 500ms
  useEffect(() => {
    const email = clientEmail.trim();
    if (!email) {
      setAccessStatus(null);
      setIsCheckingAccess(false);
      return;
    }

    const handle = window.setTimeout(() => {
      void runEligibilityCheck(email);
    }, 500);

    return () => window.clearTimeout(handle);
  }, [clientEmail, runEligibilityCheck]);

  // Botão opcional (re-check) — também usado por teclado
  const handleCheckAccess = useCallback(() => {
    void runEligibilityCheck(clientEmail);
  }, [clientEmail, runEligibilityCheck]);

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
    const normalizedEmail = clientEmail.trim().toLowerCase();
    if (!normalizedEmail || !isValidEmail(normalizedEmail)) {
      setError("Informe um e-mail válido do responsável");
      return;
    }
    setError(null);

    const titleFallback = `Ensaio - ${
      childName.trim() || clientName.trim() || normalizedEmail
    }`;
    createMutation.mutate({
      target_email: normalizedEmail,
      client_name: clientName.trim() || undefined,
      child_name: childName.trim() || undefined,
      title: title.trim() || titleFallback,
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
    <PartnerPage size="narrow">
      {/* Back Navigation */}
      <button
        onClick={() => navigate(-1)}
        className="hidden md:inline-flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-pink-600 dark:hover:text-pink-400 mb-4 transition-all duration-200 rounded-lg px-2 py-1 -ml-2 hover:bg-pink-50 dark:hover:bg-pink-900/20"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Voltar</span>
      </button>

      {/* Page Header with Progress Steps */}
      <div className="mb-6">
        <h1 className="hidden md:block text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-6">
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
          <div className="flex-1 h-0.5 bg-gray-200 dark:bg-gray-700">
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
          <div className="flex-1 h-0.5 bg-gray-200 dark:bg-gray-700">
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
        <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-xl flex items-center gap-3 text-red-700 dark:text-red-300">
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
    </PartnerPage>
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
              : "bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400"
        }`}
      >
        {completed ? <CheckCircle2 className="w-4 h-4" /> : step}
      </div>
      <span
        className={`text-sm ${active ? "text-gray-900 dark:text-white font-medium" : "text-gray-500 dark:text-gray-400"}`}
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
  children: Array<{ id: string; name: string; hasAccess: boolean }>;
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

  const costEstimate = useMemo(() => {
    if (!accessStatus) return null;

    if (accessStatus.hasAccess) {
      return {
        tone: "success" as const,
        title: "Estimativa de custo",
        icon: Gift,
        headline: "0 crédito (elegível)",
        detail:
          "Este e-mail já possui pelo menos 1 Baby Book ativo. A entrega é criada sem custo agora.",
      };
    }

    return {
      tone: "info" as const,
      title: "Estimativa de custo",
      icon: CreditCard,
      headline: "1 crédito (novo cliente)",
      detail:
        "Este e-mail ainda não tem Baby Book ativo. A criação desta entrega deve consumir 1 crédito.",
    };
  }, [accessStatus]);

  return (
    <div className="space-y-6">
      {/* Card de verificação de acesso */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-pink-100 dark:bg-pink-900/30 rounded-lg flex items-center justify-center">
            <Search className="w-5 h-5 text-pink-600 dark:text-pink-400" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Validação silenciosa
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Digite o e-mail do responsável. A elegibilidade é verificada
              automaticamente.
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
              className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500 placeholder:text-gray-400 dark:placeholder:text-gray-500"
            />
          </div>
          <button
            type="button"
            onClick={onCheckAccess}
            disabled={!emailIsValid || isCheckingAccess}
            className="px-4 py-2.5 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 rounded-lg hover:bg-gray-800 dark:hover:bg-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-2"
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
                ? "bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800"
                : "bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800"
            }`}
          >
            {accessStatus.hasAccess ? (
              <>
                <div className="w-10 h-10 bg-green-100 dark:bg-green-900/50 rounded-full flex items-center justify-center flex-shrink-0">
                  <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400" />
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-green-800 dark:text-green-200">
                    Elegível
                  </p>
                  <p className="text-sm text-green-700 dark:text-green-300 mt-1">
                    {accessStatus.message}
                  </p>
                  <div className="mt-3 inline-flex items-center gap-2 px-3 py-1.5 bg-green-100 dark:bg-green-900/50 text-green-800 dark:text-green-200 rounded-full text-sm font-medium">
                    <Gift className="w-4 h-4" />0 crédito na criação
                  </div>

                  {accessStatus.children.length > 0 && (
                    <div className="mt-3">
                      <p className="text-xs font-medium text-green-800 dark:text-green-200 mb-2">
                        Filhos encontrados
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {accessStatus.children.map((c) => {
                          const cls = c.hasAccess
                            ? "bg-green-100 dark:bg-green-900/50 text-green-800 dark:text-green-200 border-green-200 dark:border-green-800"
                            : "bg-yellow-50 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200 border-yellow-200 dark:border-yellow-800";
                          return (
                            <button
                              type="button"
                              key={c.id}
                              onClick={() => setChildName(c.name)}
                              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border ${cls} hover:opacity-90 transition-opacity`}
                              title={
                                c.hasAccess
                                  ? "Clique para preencher o nome da criança (acesso ativo)"
                                  : "Clique para preencher o nome da criança (sem acesso)"
                              }
                            >
                              {c.name}
                              {c.hasAccess ? " (acesso)" : " (sem acesso)"}
                            </button>
                          );
                        })}
                      </div>
                      <p className="mt-2 text-xs text-green-700 dark:text-green-300">
                        Dica: importar em um filho com acesso é grátis. Criar
                        novo filho custa 1 crédito.
                      </p>
                    </div>
                  )}

                  {costEstimate && (
                    <div className="mt-4 p-3 rounded-lg bg-white/70 dark:bg-gray-900/20 border border-green-200/60 dark:border-green-800/40">
                      <div className="flex items-start gap-2">
                        {(() => {
                          const Icon = costEstimate.icon;
                          return (
                            <Icon className="w-4 h-4 mt-0.5 text-green-700 dark:text-green-300" />
                          );
                        })()}
                        <div className="flex-1">
                          <p className="text-xs font-semibold text-green-900 dark:text-green-100">
                            {costEstimate.title}: {costEstimate.headline}
                          </p>
                          <p className="text-xs text-green-800/90 dark:text-green-200/90 mt-1">
                            {costEstimate.detail}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <>
                <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/50 rounded-full flex items-center justify-center flex-shrink-0">
                  <UserPlus className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-blue-800 dark:text-blue-200">
                    Novo cliente
                  </p>
                  <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                    {accessStatus.message}
                  </p>
                  <div className="mt-3 inline-flex items-center gap-2 px-3 py-1.5 bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-200 rounded-full text-sm font-medium">
                    <CreditCard className="w-4 h-4" />1 crédito na criação
                  </div>

                  {costEstimate && (
                    <div className="mt-4 p-3 rounded-lg bg-white/70 dark:bg-gray-900/20 border border-blue-200/60 dark:border-blue-800/40">
                      <div className="flex items-start gap-2">
                        {(() => {
                          const Icon = costEstimate.icon;
                          return (
                            <Icon className="w-4 h-4 mt-0.5 text-blue-700 dark:text-blue-300" />
                          );
                        })()}
                        <div className="flex-1">
                          <p className="text-xs font-semibold text-blue-900 dark:text-blue-100">
                            {costEstimate.title}: {costEstimate.headline}
                          </p>
                          <p className="text-xs text-blue-800/90 dark:text-blue-200/90 mt-1">
                            {costEstimate.detail}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* Dados da entrega */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
          Dados da Entrega
        </h2>

        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Nome do Responsável (opcional)
              </label>
              <input
                type="text"
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                placeholder="Ex: Maria Silva"
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500 placeholder:text-gray-400 dark:placeholder:text-gray-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Nome da Criança (opcional)
              </label>
              <input
                type="text"
                value={childName}
                onChange={(e) => setChildName(e.target.value)}
                placeholder="Ex: João"
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500 placeholder:text-gray-400 dark:placeholder:text-gray-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Título da Entrega (opcional)
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex: Ensaio Newborn - Bebê João"
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500 placeholder:text-gray-400 dark:placeholder:text-gray-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Data do Evento (opcional)
            </label>
            <input
              type="date"
              value={eventDate}
              onChange={(e) => setEventDate(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Descrição (opcional)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              placeholder="Observações sobre a entrega..."
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500 resize-none placeholder:text-gray-400 dark:placeholder:text-gray-500"
            />
          </div>
        </div>

        <div className="mt-8 flex justify-end">
          <button
            onClick={onNext}
            disabled={!clientName.trim() || !childName.trim() || isLoading}
            title={
              !clientName.trim()
                ? "Preencha o nome do responsável"
                : !childName.trim()
                  ? "Preencha o nome da criança"
                  : undefined
            }
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
  const [isDragging, setIsDragging] = useState(false);

  const {
    uploads,
    addFiles,
    retryUpload,
    retryAllErrors,
    removeUpload,
    isUploading,
    hasErrors,
    completedCount,
    totalCount,
    totalProgress,
  } = usePartnerUpload({
    deliveryId,
    onAllComplete: () => {
      // Feedback ao completar todos
    },
  });

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files.length > 0) {
        addFiles(e.target.files);
      }
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    },
    [addFiles],
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        addFiles(e.dataTransfer.files);
      }
    },
    [addFiles],
  );

  // Alerta ao tentar sair durante upload
  useEffect(() => {
    if (isUploading) {
      const handleBeforeUnload = (e: BeforeUnloadEvent) => {
        e.preventDefault();
        e.returnValue = "Upload em andamento. Tem certeza que deseja sair?";
        return e.returnValue;
      };
      window.addEventListener("beforeunload", handleBeforeUnload);
      return () =>
        window.removeEventListener("beforeunload", handleBeforeUnload);
    }
  }, [isUploading]);

  const pendingCount = totalCount - completedCount;
  const errorCount = uploads.filter((u) => u.status === "error").length;

  return (
    <div className="space-y-6">
      {/* Card de Status Global */}
      {totalCount > 0 && (
        <div
          className={`rounded-xl p-4 border-2 transition-all ${
            isUploading
              ? "bg-blue-50 dark:bg-blue-900/30 border-blue-200 dark:border-blue-700"
              : hasErrors
                ? "bg-yellow-50 dark:bg-yellow-900/30 border-yellow-200 dark:border-yellow-700"
                : "bg-green-50 dark:bg-green-900/30 border-green-200 dark:border-green-700"
          }`}
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              {isUploading ? (
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
                </div>
              ) : hasErrors ? (
                <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center">
                  <AlertCircle className="w-5 h-5 text-yellow-600" />
                </div>
              ) : (
                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                  <CheckCircle2 className="w-5 h-5 text-green-600" />
                </div>
              )}
              <div>
                <p className="font-medium text-gray-900 dark:text-white">
                  {isUploading
                    ? `Enviando ${pendingCount} ${pendingCount === 1 ? "arquivo" : "arquivos"}...`
                    : hasErrors
                      ? `${errorCount} ${errorCount === 1 ? "erro" : "erros"} no upload`
                      : `${completedCount} ${completedCount === 1 ? "arquivo enviado" : "arquivos enviados"}!`}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {isUploading
                    ? "Não feche esta página"
                    : hasErrors
                      ? "Clique em ↻ para tentar novamente"
                      : "Você pode adicionar mais fotos ou continuar"}
                </p>
              </div>
            </div>
            {isUploading && (
              <span className="text-lg font-bold text-blue-600">
                {totalProgress}%
              </span>
            )}
            {hasErrors && !isUploading && (
              <button
                onClick={retryAllErrors}
                className="inline-flex items-center gap-2 px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white text-sm font-medium rounded-lg transition-colors"
                title="Tentar novamente todos os arquivos com erro"
              >
                <RefreshCw className="w-4 h-4" />
                Retentar Todos
              </button>
            )}
          </div>

          {/* Barra de Progresso Global */}
          {isUploading && (
            <div className="h-2 bg-blue-100 dark:bg-blue-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-500 transition-all duration-300 ease-out"
                style={{ width: `${totalProgress}%` }}
              />
            </div>
          )}
        </div>
      )}

      {/* Aviso durante upload */}
      {isUploading && (
        <div className="bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-700 rounded-lg p-3 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0" />
          <p className="text-sm text-amber-800 dark:text-amber-200">
            <strong>Aguarde!</strong> Os arquivos estão sendo comprimidos e
            enviados. Não feche esta página até o upload concluir.
          </p>
        </div>
      )}

      {/* Drop Zone */}
      <div
        onDrop={handleDrop}
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        className={`bg-white dark:bg-gray-800 rounded-xl p-8 border-2 border-dashed transition-all text-center ${
          isDragging
            ? "border-pink-400 bg-pink-50 dark:bg-pink-900/20 scale-[1.02]"
            : "border-gray-300 dark:border-gray-600 hover:border-pink-300 dark:hover:border-pink-500"
        }`}
      >
        <Upload
          className={`w-12 h-12 mx-auto mb-4 transition-colors ${
            isDragging ? "text-pink-500" : "text-gray-400 dark:text-gray-500"
          }`}
        />
        <p className="text-gray-600 dark:text-gray-300 mb-2">
          {isDragging ? "Solte as fotos aqui!" : "Arraste fotos aqui ou"}
        </p>
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
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-4">
          📷 Imagens serão comprimidas automaticamente para envio rápido
        </p>
      </div>

      {/* Upload List */}
      {uploads.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between bg-gray-50 dark:bg-gray-700/50">
            <p className="font-medium text-gray-900 dark:text-white">
              {completedCount} de {totalCount} arquivos enviados
            </p>
            {totalCount > 0 &&
              !isUploading &&
              completedCount === totalCount && (
                <span className="text-xs bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300 px-2 py-1 rounded-full font-medium">
                  ✓ Todos enviados
                </span>
              )}
          </div>

          <div className="max-h-64 overflow-y-auto divide-y divide-gray-100 dark:divide-gray-700">
            {uploads.map((upload) => (
              <div
                key={upload.id}
                className={`flex items-center gap-4 p-3 ${
                  upload.status === "error"
                    ? "bg-red-50 dark:bg-red-900/20"
                    : "hover:bg-gray-50 dark:hover:bg-gray-700/50"
                }`}
              >
                <div
                  className={`w-10 h-10 rounded flex items-center justify-center ${
                    upload.status === "complete"
                      ? "bg-green-100 dark:bg-green-900/50"
                      : upload.status === "error"
                        ? "bg-red-100 dark:bg-red-900/50"
                        : "bg-gray-100 dark:bg-gray-700"
                  }`}
                >
                  {upload.status === "complete" ? (
                    <CheckCircle2 className="w-5 h-5 text-green-600" />
                  ) : upload.status === "error" ? (
                    <AlertCircle className="w-5 h-5 text-red-500" />
                  ) : (
                    <Image className="w-5 h-5 text-gray-400" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                    {upload.file.name}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    {upload.status === "compressing" && (
                      <span className="text-xs text-blue-600 dark:text-blue-400 flex items-center gap-1">
                        <Loader2 className="w-3 h-3 animate-spin" />
                        Comprimindo...
                      </span>
                    )}
                    {upload.status === "uploading" && (
                      <>
                        <div className="flex-1 h-1.5 bg-gray-200 dark:bg-gray-600 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-pink-500 transition-all duration-300"
                            style={{ width: `${upload.progress}%` }}
                          />
                        </div>
                        <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                          {upload.progress}%
                        </span>
                      </>
                    )}
                    {upload.status === "complete" && (
                      <span className="text-xs text-green-600 font-medium">
                        ✓ Enviado
                      </span>
                    )}
                    {upload.status === "error" && (
                      <span className="text-xs text-red-600">
                        {upload.error || "Erro no upload"}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  {upload.status === "error" && (
                    <button
                      onClick={() => retryUpload(upload.id)}
                      className="p-2 text-gray-400 hover:text-pink-500 hover:bg-pink-50 rounded-lg transition-colors"
                      title="Tentar novamente"
                    >
                      <RefreshCw className="w-4 h-4" />
                    </button>
                  )}
                  {upload.status !== "uploading" &&
                    upload.status !== "compressing" && (
                      <button
                        onClick={() => removeUpload(upload.id)}
                        className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
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
      <div className="flex justify-between items-center pt-4 border-t border-gray-200 dark:border-gray-700">
        <button
          onClick={onBack}
          disabled={isUploading}
          className="inline-flex items-center gap-2 px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
          title={isUploading ? "Aguarde o upload terminar" : ""}
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar
        </button>
        <button
          onClick={onNext}
          disabled={completedCount === 0 || isUploading}
          className="inline-flex items-center gap-2 px-6 py-2.5 bg-pink-500 text-white rounded-lg hover:bg-pink-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
        >
          {isUploading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Enviando...
            </>
          ) : (
            <>
              Revisar Entrega
              <ArrowRight className="w-4 h-4" />
            </>
          )}
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
    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-green-100 dark:bg-green-900/50 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle2 className="w-8 h-8 text-green-600 dark:text-green-400" />
        </div>
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
          Entrega Criada!
        </h2>
        <p className="text-gray-500 dark:text-gray-400 mt-2">
          A entrega para <strong>{clientName}</strong> foi criada com sucesso.
        </p>
      </div>

      <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 mb-6">
        <p className="text-sm text-gray-600 dark:text-gray-300">
          <strong>Próximo passo:</strong> Acesse os detalhes da entrega para
          gerar o voucher que será enviado ao cliente.
        </p>
      </div>

      <div className="flex justify-between">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
        >
          <ArrowLeft className="w-4 h-4" />
          Adicionar mais fotos
        </button>
        <Link
          to={`/partner/deliveries/${deliveryId}`}
          onClick={() => onComplete()}
          className="inline-flex items-center gap-2 px-6 py-2 bg-pink-500 text-white rounded-lg hover:bg-pink-600 transition-colors"
        >
          Ver Entrega
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
}

export default CreateDeliveryPage;
