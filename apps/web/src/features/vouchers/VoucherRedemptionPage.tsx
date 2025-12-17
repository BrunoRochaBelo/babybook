/**
 * Voucher Redemption Page
 *
 * Fluxo alinhado ao Golden Record:
 * - Token (código) imutável durante login/cadastro (sessionStorage + redirectTo)
 * - Direcionamento comportamental: prioriza vínculo com bebê existente (economiza crédito)
 * - Late binding no resgate (action EXISTING_CHILD/NEW_CHILD)
 * - Proteções anti-misclick: disable imediato + idempotency_key
 * - Hard stop quando quota de storage do usuário está no limite (upsell)
 */

import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  Baby,
  CheckCircle,
  Gift,
  HardDrive,
  Loader2,
  Sparkles,
  User,
  UserPlus,
  XCircle,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

import { useVoucherRedemption } from "./useVoucherRedemption";
import {
  buildLoginRedirectToVoucherRedeem,
  clearPersistedVoucherCode,
  persistVoucherCode,
  readPersistedVoucherCode,
} from "./voucherToken";

import { useChildren, useStorageQuota } from "@/hooks/api";
import { useAuthStore } from "@/store/auth";
import { Confetti, UnboxingAnimation } from "@/components/animations";

type PostUnboxingAction =
  | { type: "step"; step: "input" | "account" | "decision" | "hard_stop" }
  | { type: "navigate"; url: string };

const makeIdempotencyKey = () => {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `redeem_${Date.now()}_${Math.random().toString(16).slice(2)}`;
};

export function VoucherRedemptionPage() {
  const { code: urlCode } = useParams<{ code: string }>();
  const navigate = useNavigate();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  const { state, setCode, validate, redeem, goToStep, reset } =
    useVoucherRedemption();

  const [showUnboxing, setShowUnboxing] = useState(false);
  const [unboxingProgress, setUnboxingProgress] = useState(0);
  const [showConfetti, setShowConfetti] = useState(false);
  const [postUnboxingAction, setPostUnboxingAction] =
    useState<PostUnboxingAction | null>(null);
  const [hasAutoValidated, setHasAutoValidated] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedChildId, setSelectedChildId] = useState<string | null>(null);

  const childrenQuery = useChildren({
    enabled: isAuthenticated && state.step === "decision",
  });

  const quotaQuery = useStorageQuota({
    enabled:
      isAuthenticated && state.step === "decision" && Boolean(selectedChildId),
    childId: selectedChildId ?? undefined,
  });

  const children = childrenQuery.data ?? [];

  const isStorageFull = useMemo(() => {
    const quota = quotaQuery.data;
    if (!quota) return false;
    return quota.bytesUsed >= quota.bytesQuota;
  }, [quotaQuery.data]);

  // Inicializa o código a partir da URL ou do sessionStorage
  useEffect(() => {
    const persisted = readPersistedVoucherCode();
    const initial = (urlCode ?? persisted ?? "").trim();
    if (initial && !state.code) {
      setCode(initial);
    }
    if (urlCode) {
      persistVoucherCode(urlCode);
    }
  }, [setCode, state.code, urlCode]);

  // Auto-validate em deep-link (ex.: link do WhatsApp)
  useEffect(() => {
    if (!urlCode) return;
    if (hasAutoValidated) return;
    if (!state.code) return;

    setHasAutoValidated(true);
    void handleValidate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [urlCode, hasAutoValidated, state.code]);

  // Simula progresso durante unboxing
  useEffect(() => {
    if (!showUnboxing) return;
    if (unboxingProgress >= 95) return;

    const timer = setInterval(() => {
      setUnboxingProgress((prev) => {
        const inc = Math.random() * 14 + 6;
        return Math.min(prev + inc, 95);
      });
    }, 420);

    return () => clearInterval(timer);
  }, [showUnboxing, unboxingProgress]);

  const startUnboxing = (action: PostUnboxingAction) => {
    setPostUnboxingAction(action);
    setShowUnboxing(true);
    setUnboxingProgress(10);
  };

  const handleUnboxingComplete = () => {
    setShowUnboxing(false);
    setUnboxingProgress(0);

    const action = postUnboxingAction;
    setPostUnboxingAction(null);
    if (!action) return;

    if (action.type === "navigate") {
      navigate(action.url);
      return;
    }
    goToStep(action.step);
  };

  const handleValidate = async () => {
    persistVoucherCode(state.code);
    goToStep("validation");
    startUnboxing({
      type: "step",
      step: isAuthenticated ? "decision" : "account",
    });

    const result = await validate();
    if (!result) {
      // validate() já setou step=error e error
      setShowUnboxing(false);
      setUnboxingProgress(0);
      return;
    }
    // Sucesso: finaliza animação e segue para account/decision
    setUnboxingProgress(100);
  };

  const goToLogin = () => {
    persistVoucherCode(state.code);
    const redirectTo = buildLoginRedirectToVoucherRedeem(state.code);
    navigate(`/login?redirectTo=${encodeURIComponent(redirectTo)}`);
  };

  const goToRegister = () => {
    persistVoucherCode(state.code);
    const redirectTo = buildLoginRedirectToVoucherRedeem(state.code);
    navigate(`/register?redirectTo=${encodeURIComponent(redirectTo)}`);
  };

  const handleRedeem = async (params: {
    action: "EXISTING_CHILD" | "NEW_CHILD";
    childId?: string;
  }) => {
    if (isSubmitting || state.isLoading || showUnboxing) return;

    // Hard stop antes de qualquer side-effect: evita criar momento/cópias sem quota.
    // A quota é child-centric. Para NEW_CHILD (novo livro), assumimos quota vazia.
    if (params.action === "EXISTING_CHILD" && isStorageFull) {
      goToStep("hard_stop");
      return;
    }

    setIsSubmitting(true);
    goToStep("confirmation");
    startUnboxing({ type: "step", step: "decision" });

    const result = await redeem({
      action: params.action,
      child_id: params.childId,
      idempotency_key: makeIdempotencyKey(),
    });

    if (!result?.success) {
      setShowUnboxing(false);
      setUnboxingProgress(0);
      setIsSubmitting(false);
      return;
    }

    clearPersistedVoucherCode();
    setShowConfetti(true);
    setPostUnboxingAction({
      type: "navigate",
      url: result.redirect_url || "/jornada",
    });
    setUnboxingProgress(100);
    setIsSubmitting(false);
  };

  const primaryTitle =
    state.step === "input"
      ? "Insira o código do seu voucher para abrir seu presente"
      : "Complete o resgate para acessar suas memórias";

  return (
    <>
      <Confetti isActive={showConfetti} duration={4000} particleCount={80} />

      <UnboxingAnimation
        isActive={showUnboxing}
        progress={unboxingProgress}
        partnerName={state.validation?.partner_name ?? undefined}
        onComplete={handleUnboxingComplete}
      />

      <div className="min-h-screen bg-gradient-to-b from-pink-50 via-white to-rose-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md"
        >
          <div className="bg-white rounded-3xl shadow-xl p-8 border border-pink-100">
            <div className="text-center mb-8">
              <motion.div
                initial={{ scale: 0.8 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 200 }}
                className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-pink-500 to-rose-500 rounded-2xl mb-4 shadow-lg shadow-pink-200"
              >
                <Gift className="w-10 h-10 text-white" />
              </motion.div>
              <h1 className="text-2xl font-bold text-gray-900">
                Resgatar Presente
              </h1>
              <p className="text-gray-600 mt-2">{primaryTitle}</p>
            </div>

            <AnimatePresence mode="wait">
              {state.step === "input" && (
                <motion.div
                  key="input"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                >
                  <VoucherInputStep
                    code={state.code}
                    onCodeChange={(value) => {
                      setCode(value);
                      persistVoucherCode(value);
                    }}
                    onSubmit={handleValidate}
                    isLoading={state.isLoading || showUnboxing}
                    error={state.error}
                  />
                </motion.div>
              )}

              {state.step === "account" && state.validation && (
                <motion.div
                  key="account"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                >
                  <AccountGateStep
                    validation={state.validation}
                    onBack={() => goToStep("input")}
                    onLogin={goToLogin}
                    onRegister={goToRegister}
                  />
                </motion.div>
              )}

              {state.step === "decision" && state.validation && (
                <motion.div
                  key="decision"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                >
                  <DecisionStep
                    validation={state.validation}
                    children={children}
                    isChildrenLoading={childrenQuery.isLoading}
                    selectedChildId={selectedChildId}
                    onSelectChild={setSelectedChildId}
                    isStorageLoading={quotaQuery.isLoading}
                    isStorageFull={isStorageFull}
                    onBack={() => goToStep("input")}
                    onRedeemExisting={() =>
                      handleRedeem({
                        action: "EXISTING_CHILD",
                        childId: selectedChildId ?? undefined,
                      })
                    }
                    onRedeemNew={() =>
                      handleRedeem({
                        action: "NEW_CHILD",
                      })
                    }
                    isSubmitting={
                      isSubmitting || state.isLoading || showUnboxing
                    }
                  />
                </motion.div>
              )}

              {state.step === "hard_stop" && (
                <motion.div
                  key="hard_stop"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                >
                  <HardStopStep
                    onBack={() => goToStep("decision")}
                    onUpsell={() => navigate("/checkout")}
                  />
                </motion.div>
              )}

              {state.step === "error" && (
                <motion.div
                  key="error"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                >
                  <ErrorStep error={state.error} onRetry={reset} />
                </motion.div>
              )}

              {state.step === "success" && !showUnboxing && (
                <motion.div
                  key="success"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                >
                  <SuccessStep
                    assetsCount={state.validation?.assets_count ?? 0}
                    partnerName={state.validation?.partner_name ?? ""}
                    onContinue={() => navigate("/jornada")}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <p className="text-center text-sm text-gray-500 mt-6">
            Não tem um voucher?{" "}
            <a
              href="/"
              className="text-pink-600 hover:text-pink-700 font-medium"
            >
              Conheça o Baby Book
            </a>
          </p>
        </motion.div>
      </div>
    </>
  );
}

// ============================================================
// Step Components
// ============================================================

interface VoucherInputStepProps {
  code: string;
  onCodeChange: (code: string) => void;
  onSubmit: () => void;
  isLoading: boolean;
  error: string | null;
}

function VoucherInputStep({
  code,
  onCodeChange,
  onSubmit,
  isLoading,
  error,
}: VoucherInputStepProps) {
  const formatCode = (value: string) => {
    const clean = value.replace(/[^A-Z0-9]/gi, "").toUpperCase();
    const parts = clean.match(/.{1,4}/g) || [];
    return parts.join("-");
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCode(e.target.value);
    if (formatted.length <= 14) {
      onCodeChange(formatted);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <label
          htmlFor="voucher-code"
          className="block text-sm font-medium text-gray-700 mb-2"
        >
          Código do Voucher
        </label>
        <div className="relative">
          <input
            id="voucher-code"
            type="text"
            value={code}
            onChange={handleChange}
            placeholder="BABY-XXXX-XXXX"
            className="w-full px-4 py-4 border-2 border-gray-200 rounded-2xl focus:ring-2 focus:ring-pink-500 focus:border-pink-500 text-center text-xl font-mono uppercase tracking-widest transition-all"
            disabled={isLoading}
            onKeyDown={(e) => e.key === "Enter" && onSubmit()}
            autoFocus
          />
          <Sparkles className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-pink-300" />
        </div>
        <p className="text-xs text-gray-500 mt-2 text-center">
          O código está no cartão-convite que você recebeu
        </p>
      </div>

      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-2 text-red-600 text-sm bg-red-50 p-3 rounded-xl"
        >
          <XCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </motion.div>
      )}

      <button
        onClick={onSubmit}
        disabled={isLoading || !code.trim()}
        className="w-full py-4 px-4 bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 disabled:from-gray-300 disabled:to-gray-300 text-white font-semibold rounded-2xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-pink-200 disabled:shadow-none"
      >
        {isLoading ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            Validando...
          </>
        ) : (
          <>
            Abrir Presente
            <Gift className="w-5 h-5" />
          </>
        )}
      </button>
    </div>
  );
}

interface AccountGateStepProps {
  validation: {
    partner_name: string | null;
    delivery_title: string | null;
    assets_count: number;
  };
  onBack: () => void;
  onLogin: () => void;
  onRegister: () => void;
}

function AccountGateStep({
  validation,
  onBack,
  onLogin,
  onRegister,
}: AccountGateStepProps) {
  return (
    <div className="space-y-6">
      <VoucherInfoCard validation={validation} />

      <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
        <p className="text-sm text-gray-700">
          Para escolher <strong>onde guardar</strong> estas memórias, faça login
          ou crie sua conta. O código do voucher já está seguro com você.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-3">
        <button
          onClick={onRegister}
          className="w-full py-3 px-4 bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white font-semibold rounded-2xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-pink-200"
        >
          <UserPlus className="w-5 h-5" />
          Criar conta e continuar
          <ArrowRight className="w-5 h-5" />
        </button>
        <button
          onClick={onLogin}
          className="w-full py-3 px-4 border border-gray-200 text-gray-700 font-semibold rounded-2xl hover:bg-gray-50 transition-all flex items-center justify-center gap-2"
        >
          <User className="w-5 h-5" />
          Já tenho conta
        </button>
      </div>

      <button
        onClick={onBack}
        className="w-full py-3 px-4 text-gray-600 font-semibold rounded-2xl hover:bg-gray-50 transition-all flex items-center justify-center gap-2"
      >
        <ArrowLeft className="w-5 h-5" />
        Voltar
      </button>
    </div>
  );
}

function VoucherInfoCard({
  validation,
}: {
  validation: {
    partner_name: string | null;
    delivery_title: string | null;
    assets_count: number;
  };
}) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-2xl p-5"
    >
      <div className="flex items-center gap-3 mb-3">
        <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
          <CheckCircle className="w-6 h-6 text-green-600" />
        </div>
        <div>
          <span className="font-semibold text-green-800">Voucher Válido!</span>
          {validation.partner_name && (
            <p className="text-sm text-green-600">
              Presente de <strong>{validation.partner_name}</strong>
            </p>
          )}
        </div>
      </div>
      <div className="flex items-center gap-4 text-sm text-green-700">
        <span className="flex items-center gap-1">
          <Sparkles className="w-4 h-4" />
          {validation.assets_count} memória(s)
        </span>
        {validation.delivery_title && (
          <span>• {validation.delivery_title}</span>
        )}
      </div>
    </motion.div>
  );
}

interface DecisionStepProps {
  validation: {
    partner_name: string | null;
    delivery_title: string | null;
    assets_count: number;
  };
  children: Array<{ id: string; name: string }>;
  isChildrenLoading: boolean;
  selectedChildId: string | null;
  onSelectChild: (id: string | null) => void;
  isStorageLoading: boolean;
  isStorageFull: boolean;
  onBack: () => void;
  onRedeemExisting: () => void;
  onRedeemNew: () => void;
  isSubmitting: boolean;
}

function DecisionStep({
  validation,
  children,
  isChildrenLoading,
  selectedChildId,
  onSelectChild,
  isStorageLoading,
  isStorageFull,
  onBack,
  onRedeemExisting,
  onRedeemNew,
  isSubmitting,
}: DecisionStepProps) {
  const hasChildren = children.length > 0;
  const selected = selectedChildId ?? (hasChildren ? children[0].id : null);

  useEffect(() => {
    if (!hasChildren) return;
    if (selectedChildId) return;
    onSelectChild(children[0].id);
  }, [children, hasChildren, onSelectChild, selectedChildId]);

  const isPrimaryDisabled =
    isSubmitting ||
    isChildrenLoading ||
    isStorageLoading ||
    !hasChildren ||
    (hasChildren && !selected);

  return (
    <div className="space-y-6">
      <VoucherInfoCard validation={validation} />

      <div>
        <h2 className="text-xl font-bold text-gray-900">
          Onde devemos guardar estas fotos?
        </h2>
        <p className="text-sm text-gray-600 mt-2">
          Recomendamos vincular a um bebê existente — isso evita criar um Baby
          Book duplicado e <strong>economiza o crédito do fotógrafo</strong>.
        </p>
      </div>

      {isStorageFull && (
        <div className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4">
          <HardDrive className="mt-0.5 h-5 w-5 text-amber-700" />
          <div>
            <p className="text-sm font-semibold text-amber-900">
              Seu espaço está no limite
            </p>
            <p className="text-sm text-amber-800 mt-1">
              Antes de importar as memórias, precisamos liberar armazenamento.
            </p>
          </div>
        </div>
      )}

      <div className="space-y-3">
        <div className="rounded-2xl border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-gray-900 flex items-center gap-2">
              <Baby className="h-5 w-5 text-pink-600" />
              Vincular a bebê existente (recomendado)
            </p>
            {isChildrenLoading && (
              <span className="text-xs text-gray-500 flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Carregando...
              </span>
            )}
          </div>

          {hasChildren ? (
            <div className="mt-3 space-y-2">
              {children.slice(0, 4).map((child) => {
                const isSelected = child.id === selected;
                return (
                  <button
                    key={child.id}
                    type="button"
                    onClick={() => onSelectChild(child.id)}
                    className={`w-full flex items-center justify-between rounded-xl border px-3 py-3 text-left transition ${
                      isSelected
                        ? "border-pink-300 bg-pink-50"
                        : "border-gray-200 hover:bg-gray-50"
                    }`}
                  >
                    <span className="text-sm font-medium text-gray-900">
                      {child.name}
                    </span>
                    {isSelected && (
                      <span className="text-xs font-semibold text-pink-700">
                        Selecionado
                      </span>
                    )}
                  </button>
                );
              })}
              {children.length > 4 && (
                <p className="text-xs text-gray-500">
                  Mostrando 4 de {children.length}. (Vamos deixar essa lista
                  linda já já.)
                </p>
              )}
            </div>
          ) : (
            <p className="mt-2 text-sm text-gray-600">
              Você ainda não tem um bebê cadastrado. Sem problemas — vamos criar
              um Baby Book novo.
            </p>
          )}

          <button
            type="button"
            disabled={isPrimaryDisabled || isStorageFull}
            onClick={onRedeemExisting}
            className="mt-4 w-full py-3 px-4 bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 disabled:from-gray-300 disabled:to-gray-300 text-white font-semibold rounded-2xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-pink-200 disabled:shadow-none"
          >
            Guardar neste bebê
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>

        <div className="rounded-2xl border border-gray-200 p-4">
          <p className="text-sm font-semibold text-gray-900">
            Criar um novo Baby Book (segunda opção)
          </p>
          <p className="text-sm text-gray-600 mt-1">
            Use se estas fotos são de outro bebê. Caso contrário, você pode
            acabar com dois Baby Books para a mesma criança.
          </p>
          <button
            type="button"
            disabled={isSubmitting || isStorageLoading}
            onClick={onRedeemNew}
            className="mt-4 w-full py-3 px-4 border border-gray-200 text-gray-700 font-semibold rounded-2xl hover:bg-gray-50 disabled:opacity-60 transition-all flex items-center justify-center gap-2"
          >
            Criar novo Baby Book
          </button>
        </div>
      </div>

      <button
        onClick={onBack}
        className="w-full py-3 px-4 text-gray-600 font-semibold rounded-2xl hover:bg-gray-50 transition-all flex items-center justify-center gap-2"
      >
        <ArrowLeft className="w-5 h-5" />
        Voltar
      </button>
    </div>
  );
}

function HardStopStep({
  onBack,
  onUpsell,
}: {
  onBack: () => void;
  onUpsell: () => void;
}) {
  return (
    <div className="space-y-6">
      <div className="text-center space-y-3">
        <div className="inline-flex items-center justify-center w-20 h-20 bg-amber-100 rounded-2xl">
          <HardDrive className="w-10 h-10 text-amber-700" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900">
          Seu Baby Book está sem espaço
        </h2>
        <p className="text-gray-600">
          Para importar este presente com segurança, precisamos liberar
          armazenamento. Assim você não perde nada no meio do caminho.
        </p>
      </div>

      <button
        onClick={onUpsell}
        className="w-full py-4 px-4 bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white font-semibold rounded-2xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-pink-200"
      >
        Assinar para liberar espaço
        <ArrowRight className="w-5 h-5" />
      </button>
      <button
        onClick={onBack}
        className="w-full py-3 px-4 border border-gray-200 text-gray-700 font-semibold rounded-2xl hover:bg-gray-50 transition-all flex items-center justify-center gap-2"
      >
        <ArrowLeft className="w-5 h-5" />
        Voltar
      </button>
    </div>
  );
}

interface SuccessStepProps {
  assetsCount: number;
  partnerName: string;
  onContinue: () => void;
}

function SuccessStep({
  assetsCount,
  partnerName,
  onContinue,
}: SuccessStepProps) {
  return (
    <div className="text-center space-y-6">
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", stiffness: 200 }}
        className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full shadow-lg shadow-green-200"
      >
        <CheckCircle className="w-12 h-12 text-white" />
      </motion.div>

      <div>
        <h2 className="text-2xl font-bold text-gray-900">
          Presente Importado!
        </h2>
        <p className="text-gray-600 mt-2">
          {assetsCount} memória(s) {partnerName ? `de ${partnerName} ` : ""}
          foram adicionadas ao seu Baby Book.
        </p>
      </div>

      <button
        onClick={onContinue}
        className="w-full py-4 px-4 bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white font-semibold rounded-2xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-pink-200"
      >
        Ver Minhas Memórias
        <ArrowRight className="w-5 h-5" />
      </button>
    </div>
  );
}

interface ErrorStepProps {
  error: string | null;
  onRetry: () => void;
}

function ErrorStep({ error, onRetry }: ErrorStepProps) {
  return (
    <div className="text-center space-y-6">
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", stiffness: 200 }}
        className="inline-flex items-center justify-center w-24 h-24 bg-red-100 rounded-full"
      >
        <XCircle className="w-12 h-12 text-red-500" />
      </motion.div>

      <div>
        <h2 className="text-2xl font-bold text-gray-900">
          Ops! Algo deu errado
        </h2>
        <p className="text-gray-600 mt-2">
          {error ?? "Não foi possível processar seu voucher. Tente novamente."}
        </p>
      </div>

      <button
        onClick={onRetry}
        className="w-full py-4 px-4 bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white font-semibold rounded-2xl transition-all shadow-lg shadow-pink-200"
      >
        Tentar Novamente
      </button>
    </div>
  );
}

export default VoucherRedemptionPage;
