/**
 * Create Delivery Page
 *
 * Fluxo premium de criação de entrega.
 * Layout centralizado, stepper animado e inputs refinados.
 * Passos: Cliente/Dados -> Upload (Drag & Drop) -> Revisão/Sucesso
 */

import { useMemo, useState, useCallback, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  Search,
  Gift,
  UserPlus,
  CreditCard,
  Loader2,
  AlertCircle,
  X,
  CheckCircle2,
  ChevronRight,
  ChevronLeft,
  Sparkles,
  UploadCloud,
  FileText,
  Trash2,
  Image as ImageIcon,
  Check,
} from "lucide-react";
import { createDelivery, checkClientAccess, getDelivery } from "./api";
import { usePartnerUpload } from "./usePartnerUpload";
import type { CreateDeliveryRequest } from "./types";
import { usePartnerPageHeader } from "@/layouts/partnerPageHeader";
import { PartnerBackButton } from "@/layouts/PartnerBackButton";
import { PartnerStepper } from "./components/PartnerStepper";
import { ReviewSkeleton } from "./components/ReviewSkeleton";
import { cn } from "@/lib/utils";
// function localFormatBytes below handles this

// Local utils if not available globally
function localFormatBytes(bytes: number, decimals = 0) {
  if (!+bytes) return "0 Bytes";
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

type Step = "client" | "upload" | "review";

const STEPS = [
  { id: "client", title: "Cliente" },
  { id: "upload", title: "Upload" },
  { id: "review", title: "Revisão" },
];

interface AccessCheckResult {
    hasAccount: boolean;
    children: Array<{ id: string; name: string; hasAccess: boolean }>;
    message: string;
}

export function CreateDeliveryPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [currentStep, setCurrentStep] = useState<Step>("client");
  const [deliveryId, setDeliveryId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Sem header padrão, usamos layout customizado
  usePartnerPageHeader(
    useMemo(
      () => ({
        title: "",
        backTo: "/partner/deliveries",
        backLabel: "Voltar",
      }),
      [],
    ),
  );

  // Form state
  const [clientName, setClientName] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [childName, setChildName] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [deliveryTargetMode, setDeliveryTargetMode] = useState<"existing" | "new">("new");
  const [selectedChildId, setSelectedChildId] = useState<string>("");
  const [accessStatus, setAccessStatus] = useState<AccessCheckResult | null>(null);
  const [isCheckingAccess, setIsCheckingAccess] = useState(false);

  // Access Check Logic
  const checkReqIdRef = useRef(0);
  const isValidEmail = useCallback(
    (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email),
    [],
  );

  const runAccessCheck = useCallback(
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
        const response = await checkClientAccess(normalizedEmail);
        if (requestId !== checkReqIdRef.current) return;

        const children = (response.children || []).map((c) => ({
          id: c.id,
          name: c.name,
          hasAccess: Boolean(c.has_access),
        }));

        setAccessStatus({
          hasAccount: Boolean(response.has_access),
          children,
          message: response.message,
        });

        if (response.has_access) {
          const paidChildren = children.filter((c) => c.hasAccess);
          if (paidChildren.length > 0) {
            setDeliveryTargetMode("existing");
            setSelectedChildId(paidChildren[0]?.id ?? "");
          } else {
            setDeliveryTargetMode("new");
            setSelectedChildId("");
          }
        } else {
          setDeliveryTargetMode("new");
          setSelectedChildId("");
        }
      } catch {
        if (requestId !== checkReqIdRef.current) return;
        setAccessStatus({
            hasAccount: false,
            children: [],
            message: "Novo cliente (verificação falhou ou timeout)",
        });
        setDeliveryTargetMode("new");
      } finally {
        if (requestId === checkReqIdRef.current) setIsCheckingAccess(false);
      }
    },
    [isValidEmail],
  );

  useEffect(() => {
    const handle = setTimeout(() => {
      if (clientEmail.trim()) runAccessCheck(clientEmail);
    }, 600);
    return () => clearTimeout(handle);
  }, [clientEmail, runAccessCheck]);

  // Create Mutation
  const createMutation = useMutation({
    mutationFn: (data: CreateDeliveryRequest) => createDelivery(data),
    onSuccess: (delivery) => {
      setDeliveryId(delivery.id);
      setCurrentStep("upload");
      queryClient.invalidateQueries({ queryKey: ["partner", "deliveries"] });
    },
    onError: (err) => setError(err instanceof Error ? err.message : "Erro ao criar entrega"),
  });

  const handleCreateDelivery = () => {
     const normalizedEmail = clientEmail.trim().toLowerCase();
     if (!isValidEmail(normalizedEmail)) {
         setError("E-mail inválido");
         return;
     }

     const intended_import_action = 
        deliveryTargetMode === "existing" && accessStatus?.children.find(c => c.id === selectedChildId)?.hasAccess 
        ? "EXISTING_CHILD" : "NEW_CHILD";

     const titleFallback = `Ensaio - ${childName.trim() || clientName.trim() || normalizedEmail}`;

     createMutation.mutate({
        target_email: normalizedEmail,
        client_name: clientName.trim() || undefined,
        child_name: childName.trim() || undefined,
        intended_import_action,
        target_child_id: intended_import_action === "EXISTING_CHILD" ? selectedChildId : undefined,
        title: title.trim() || titleFallback,
        description: description.trim() || undefined,
        event_date: eventDate || undefined,
     });
  };

  // Skip upload action
  const handleSkipUpload = () => {
      setCurrentStep("review");
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))] from-gray-50 via-white to-pink-50/20 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800 pb-20">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        
        {/* Top Actions */}
        {/* Top Actions */}
        <div className="animate-in fade-in slide-in-from-top-2">
             <PartnerBackButton to="/partner/deliveries" />
        </div>

        {/* Header Visual */}
        <div className="mb-10 text-center animate-in fade-in slide-in-from-top-4 duration-700">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                Nova Entrega
            </h1>
            <p className="text-gray-500 dark:text-gray-400">
                {currentStep === "client" && "Comece identificando o cliente e os detalhes do ensaio."}
                {currentStep === "upload" && "Adicione as fotos do ensaio para esta entrega."}
                {currentStep === "review" && "Tudo pronto! Confira os detalhes da entrega."}
            </p>
        </div>

        {/* Stepper */}
        <div className="mb-10">
            <PartnerStepper 
                steps={STEPS} 
                currentStep={currentStep} 
            />
        </div>

        {/* Main Card */}
        <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-[2.5rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-black/20 border border-white/50 dark:border-gray-700/50 p-6 sm:p-10 relative overflow-hidden transition-all duration-500">
            
            {/* Background Decor */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-pink-500/5 to-purple-500/5 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />

            {/* Error Banner */}
            {error && (
                <div className="mb-8 p-4 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-300 rounded-2xl flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
                    <AlertCircle className="w-5 h-5" />
                    <span className="font-medium">{error}</span>
                    <button onClick={() => setError(null)} className="ml-auto p-1 hover:bg-red-100 dark:hover:bg-red-900/40 rounded-full">
                        <X className="w-4 h-4" />
                    </button>
                </div>
            )}

            {/* Steps Content */}
            <div className="relative z-10 min-h-[400px]">
                {currentStep === "client" && (
                    <ClientStep 
                        clientName={clientName} setClientName={setClientName}
                        clientEmail={clientEmail} setClientEmail={setClientEmail}
                        childName={childName} setChildName={setChildName}
                        title={title} setTitle={setTitle}
                        description={description} setDescription={setDescription}
                        eventDate={eventDate} setEventDate={setEventDate}
                        accessStatus={accessStatus}
                        isCheckingAccess={isCheckingAccess}
                        deliveryTargetMode={deliveryTargetMode} setDeliveryTargetMode={setDeliveryTargetMode}
                        selectedChildId={selectedChildId} setSelectedChildId={setSelectedChildId}
                        onNext={handleCreateDelivery}
                        isLoading={createMutation.isPending}
                    />
                )}
                
                {currentStep === "upload" && deliveryId && (
                     <UploadStep 
                        deliveryId={deliveryId}
                        onNext={() => setCurrentStep("review")}
                        onSkip={handleSkipUpload}
                     />
                )}

                 {currentStep === "review" && deliveryId && (
                     <ReviewStep 
                        deliveryId={deliveryId}
                     />
                )}
            </div>
            
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Passo 1: Cliente (ClientStep)
// ─────────────────────────────────────────────────────────────────────────────

function ClientStep({
    clientName, setClientName,
    clientEmail, setClientEmail,
    childName, setChildName,
    title, setTitle,
    description, setDescription,
    eventDate, setEventDate,
    accessStatus, isCheckingAccess,
    deliveryTargetMode, setDeliveryTargetMode,
    selectedChildId, setSelectedChildId,
    onNext, isLoading
}: any) {
    
    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
            {/* 1. Identificação do Cliente */}
            <section className="space-y-4">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-pink-50 dark:bg-pink-900/20 text-pink-600 dark:text-pink-400 flex items-center justify-center">
                        <UserPlus className="w-5 h-5" />
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white">Identificação</h3>
                </div>
                
                <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                        <label className="text-sm font-bold text-gray-700 dark:text-gray-300 ml-1">E-mail do Responsável</label>
                        <div className="relative">
                            <input 
                                type="email" 
                                value={clientEmail}
                                onChange={e => setClientEmail(e.target.value)}
                                placeholder="ex: cliente@email.com"
                                className="w-full pl-4 pr-10 py-3 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-2xl focus:ring-2 focus:ring-pink-500 transition-all"
                            />
                            {isCheckingAccess && (
                                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                    <Loader2 className="w-4 h-4 animate-spin text-pink-500" />
                                </div>
                            )}
                        </div>
                         {/* Access Feedback */}
                        {accessStatus && (
                            <div className={cn(
                                "text-xs font-medium px-3 py-2 rounded-xl mt-2 flex items-center gap-2",
                                accessStatus.hasAccount 
                                    ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400"
                                    : "bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400"
                            )}>
                                {accessStatus.hasAccount ? <CheckCircle2 className="w-3 h-3" /> : <Sparkles className="w-3 h-3" />}
                                {accessStatus.hasAccount ? "Conta encontrada!" : "Novo cliente"}
                            </div>
                        )}
                    </div>
                    
                    <div className="space-y-1.5">
                         <label className="text-sm font-bold text-gray-700 dark:text-gray-300 ml-1">Nome (opcional)</label>
                         <input 
                                type="text" 
                                value={clientName}
                                onChange={e => setClientName(e.target.value)}
                                placeholder="Nome do responsável"
                                className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-2xl focus:ring-2 focus:ring-pink-500 transition-all"
                            />
                    </div>
                </div>
            </section>

            <div className="h-px bg-gray-100 dark:bg-gray-700/50" />

            {/* 2. Detalhes da Entrega */}
            <section className="space-y-4">
                 <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 flex items-center justify-center">
                        <Gift className="w-5 h-5" />
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white">Detalhes da Entrega</h3>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                         <label className="text-sm font-bold text-gray-700 dark:text-gray-300 ml-1">Título</label>
                         <input 
                                type="text" 
                                value={title}
                                onChange={e => setTitle(e.target.value)}
                                placeholder="Ex: Ensaio de Natal"
                                className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-2xl focus:ring-2 focus:ring-pink-500 transition-all"
                            />
                    </div>
                     <div className="space-y-1.5">
                         <label className="text-sm font-bold text-gray-700 dark:text-gray-300 ml-1">Nome da Criança</label>
                         <input 
                                type="text" 
                                value={childName}
                                onChange={e => setChildName(e.target.value)}
                                placeholder="Nome da criança"
                                className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-2xl focus:ring-2 focus:ring-pink-500 transition-all"
                            />
                    </div>
                </div>

                 <div className="space-y-1.5">
                         <label className="text-sm font-bold text-gray-700 dark:text-gray-300 ml-1">Mensagem (opcional)</label>
                         <textarea 
                                value={description}
                                onChange={e => setDescription(e.target.value)}
                                placeholder="Uma mensagem carinhosa para a família..."
                                rows={3}
                                className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-2xl focus:ring-2 focus:ring-pink-500 transition-all resize-none"
                            />
                </div>
            </section>

            {/* Actions */}
            <div className="pt-6 flex justify-end">
                <button 
                    onClick={onNext}
                    disabled={isLoading || !clientEmail}
                    className="flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-pink-500 to-rose-600 text-white font-bold rounded-2xl shadow-lg shadow-pink-500/25 hover:shadow-pink-500/40 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {isLoading ? (
                        <>
                            <Loader2 className="w-5 h-5 animate-spin" />
                            Criando...
                        </>
                    ) : (
                        <>
                            Continuar para Upload
                            <ChevronRight className="w-5 h-5" />
                        </>
                    )}
                </button>
            </div>
        </div>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// Passo 2: Upload (UploadStep)
// ─────────────────────────────────────────────────────────────────────────────

interface UploadStepProps {
    deliveryId: string;
    onNext: () => void;
    onSkip: () => void;
}

function UploadStep({ deliveryId, onNext, onSkip }: UploadStepProps) {
    const {
        uploads,
        addFiles,
        removeUpload,
        retryUpload,
        isUploading,
        completedCount,
        hasErrors
    } = usePartnerUpload({
        deliveryId,
    });

    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files?.length) {
            addFiles(e.target.files);
        }
        // Reset input
        if (fileInputRef.current) fileInputRef.current.value = "";
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.dataTransfer.files?.length) {
            addFiles(e.dataTransfer.files);
        }
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
    };

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
             <div className="text-center space-y-2">
                 <h3 className="text-xl font-bold text-gray-900 dark:text-white">Upload de Arquivos</h3>
                 <p className="text-gray-500 dark:text-gray-400">
                     Adicione fotos e vídeos para esta entrega. Eles serão processados automaticamente.
                 </p>
             </div>

             {/* Drag & Drop Zone */}
             <div 
                className={cn(
                    "relative border-2 border-dashed rounded-[2rem] p-10 text-center transition-all duration-300",
                    isUploading 
                        ? "border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50"
                        : "border-pink-200 dark:border-pink-900/50 bg-pink-50/30 dark:bg-pink-900/10 hover:border-pink-300 dark:hover:border-pink-800 hover:bg-pink-50 dark:hover:bg-pink-900/20"
                )}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
             >
                 <input 
                    type="file"
                    ref={fileInputRef}
                    multiple
                    accept="image/*,video/*"
                    onChange={handleFileChange}
                    className="hidden"
                 />
                 
                 <div className="flex flex-col items-center gap-4">
                     <div className="w-16 h-16 rounded-full bg-white dark:bg-gray-800 shadow-sm flex items-center justify-center">
                         <UploadCloud className="w-8 h-8 text-pink-500" />
                     </div>
                     <div>
                         <h4 className="font-bold text-gray-900 dark:text-white text-lg">
                             Arraste e solte arquivos aqui
                         </h4>
                         <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                             ou <button onClick={() => fileInputRef.current?.click()} className="text-pink-600 font-bold hover:underline">clique para selecionar</button>
                         </p>
                     </div>
                     <p className="text-xs text-gray-400 dark:text-gray-500">
                         Suporta JPG, PNG, WEBP e MP4
                     </p>
                 </div>
             </div>

             {/* Upload List */}
             {uploads.length > 0 && (
                 <div className="space-y-3 pt-4">
                     <h4 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
                         Arquivos ({completedCount}/{uploads.length})
                         {isUploading && <Loader2 className="w-3 h-3 animate-spin" />}
                     </h4>
                     
                     <div className="grid gap-2 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                         {uploads.map((item) => (
                             <div 
                                key={item.id} 
                                className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-900/50 border border-gray-100 dark:border-gray-700 rounded-xl"
                             >
                                 <div className="w-10 h-10 rounded-lg bg-white dark:bg-gray-800 flex items-center justify-center flex-shrink-0 text-gray-400">
                                     {item.file.type.startsWith("video") ? <FileText className="w-5 h-5" /> : <ImageIcon className="w-5 h-5" />}
                                 </div>
                                 <div className="flex-1 min-w-0">
                                     <div className="flex justify-between items-center mb-1">
                                         <p className="text-sm font-medium text-gray-900 dark:text-white truncate" title={item.file.name}>
                                             {item.file.name}
                                         </p>
                                         <span className="text-xs text-gray-500">
                                             {localFormatBytes(item.file.size)}
                                         </span>
                                     </div>
                                     <div className="h-1.5 w-full bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                                         <div 
                                            className={cn(
                                                "h-full rounded-full transition-all duration-300",
                                                item.status === "error" ? "bg-red-500" :
                                                item.status === "complete" ? "bg-emerald-500" : "bg-pink-500"
                                            )}
                                            style={{ width: `${item.progress}%` }}
                                         />
                                     </div>
                                     {item.error && (
                                         <p className="text-xs text-red-500 mt-1">{item.error}</p>
                                     )}
                                 </div>
                                 
                                 {/* Actions */}
                                 {item.status === "error" ? (
                                     <button onClick={() => retryUpload(item.id)} className="p-2 text-gray-500 hover:text-gray-900">
                                          <span className="text-xs underline">Reenviar</span>
                                     </button>
                                 ) : item.status === "complete" ? (
                                     <div className="p-2 text-emerald-500">
                                         <CheckCircle2 className="w-5 h-5" />
                                     </div>
                                 ) : (
                                     <div className="p-2 text-gray-400">
                                         <span className="text-xs font-mono">{item.progress}%</span>
                                     </div>
                                 )}

                                 <button 
                                    onClick={() => removeUpload(item.id)}
                                    className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                                 >
                                     <Trash2 className="w-4 h-4" />
                                 </button>
                             </div>
                         ))}
                     </div>
                 </div>
             )}

             {/* Actions */}
             <div className="pt-6 flex justify-between items-center border-t border-gray-100 dark:border-gray-700/50 mt-6">
                <button 
                     onClick={onSkip}
                     disabled={isUploading && completedCount === 0} // Allow skip if stuck, but prefer waiting. Actually allow skip always if user realizes they dont want to upload.
                     className="px-6 py-3 text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white font-medium transition-colors"
                >
                    Pular este passo
                </button>
                <button 
                     onClick={onNext}
                     disabled={isUploading || (uploads.length > 0 && completedCount === 0 && !hasErrors)}
                     className="flex items-center gap-2 px-8 py-3 bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-bold rounded-xl shadow-lg hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:scale-100"
                >
                    {isUploading ? (
                        <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Enviando...
                        </>
                    ) : (
                         <>
                            Revisar e Finalizar
                            <ChevronRight className="w-4 h-4" />
                        </>
                    )}
                </button>
             </div>
        </div>
    );
}


// ─────────────────────────────────────────────────────────────────────────────
// Passo 3: Revisão (ReviewStep)
// ─────────────────────────────────────────────────────────────────────────────

function ReviewStep({ deliveryId }: { deliveryId: string }) {
    const navigate = useNavigate();
    const { data: delivery, isLoading } = useQuery({
        queryKey: ["partner", "delivery", deliveryId],
        queryFn: () => getDelivery(deliveryId),
        enabled: !!deliveryId
    });

    if (isLoading || !delivery) {
    if (isLoading || !delivery) {
        return <ReviewSkeleton />;
    }
    }

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500 text-center">
             
             <div className="flex flex-col items-center justify-center gap-4 py-6">
                 <div className="w-20 h-20 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center mb-2 animate-bounce-subtle">
                     <Sparkles className="w-10 h-10 text-emerald-600 dark:text-emerald-400" />
                 </div>
                 <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                     Entrega Criada com Sucesso!
                 </h2>
                 <p className="text-gray-500 dark:text-gray-400 max-w-md">
                     A entrega <strong>"{delivery.title}"</strong> foi gerada. Você pode gerar o voucher agora ou adicionar mais fotos depois.
                 </p>
             </div>

             {/* Summary Card */}
             <div className="bg-gray-50 dark:bg-gray-900/50 rounded-3xl p-6 text-left border border-gray-100 dark:border-gray-700">
                 <h3 className="text-sm font-bold uppercase tracking-wider text-gray-400 mb-4">Resumo</h3>
                 <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-6">
                     <div>
                         <dt className="text-xs text-gray-500">Cliente</dt>
                         <dd className="font-medium text-gray-900 dark:text-white text-lg">
                             {delivery.client_name || "Não informado"}
                         </dd>
                     </div>
                     <div>
                         <dt className="text-xs text-gray-500">Status</dt>
                         <dd className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-sm font-bold">
                             {delivery.status}
                         </dd>
                     </div>
                     <div>
                         <dt className="text-xs text-gray-500">Arquivos</dt>
                         <dd className="font-medium text-gray-900 dark:text-white">
                             {delivery.assets ? delivery.assets.length : 0} itens enviados
                         </dd>
                     </div>
                 </dl>
             </div>

             {/* Actions */}
             <div className="grid sm:grid-cols-2 gap-4">
                 <button 
                    onClick={() => navigate("/partner/deliveries")}
                    className="px-6 py-4 rounded-xl border border-gray-200 dark:border-gray-700 font-bold text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                 >
                     Voltar para Lista
                 </button>
                 <button 
                    onClick={() => navigate(`/partner/deliveries/${deliveryId}`)}
                    className="px-6 py-4 rounded-xl bg-pink-500 hover:bg-pink-600 text-white font-bold shadow-lg shadow-pink-500/25 transition-all"
                 >
                     Ver Detalhes & Voucher
                 </button>
             </div>
        </div>
    );
}

