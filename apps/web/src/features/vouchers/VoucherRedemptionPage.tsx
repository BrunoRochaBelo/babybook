/**
 * Voucher Redemption Page - Enhanced "Unboxing" Experience
 *
 * Page component for redeeming gift vouchers with magical animations.
 * Supports both authenticated users and new account creation.
 *
 * Design Goals (from Dossiê):
 * - "Efeito UAU" with celebratory animations
 * - Smooth unboxing experience while backend processes
 * - Immediate value perception (timeline with content)
 */

import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Gift,
  CheckCircle,
  XCircle,
  Loader2,
  ArrowRight,
  ArrowLeft,
  Sparkles,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useVoucherRedemption } from "./useVoucherRedemption";
import { Confetti, UnboxingAnimation } from "@/components/animations";

export function VoucherRedemptionPage() {
  const { code: urlCode } = useParams<{ code: string }>();
  const navigate = useNavigate();
  const { state, setCode, validate, redeem, goToStep, reset } =
    useVoucherRedemption();

  const [showUnboxing, setShowUnboxing] = useState(false);
  const [unboxingProgress, setUnboxingProgress] = useState(0);
  const [showConfetti, setShowConfetti] = useState(false);
  const [isNewUser, setIsNewUser] = useState(false);

  // Pre-fill code from URL if present
  useEffect(() => {
    if (urlCode && !state.code) {
      setCode(urlCode);
      // Auto-validate if code comes from URL
      setTimeout(() => validate(), 500);
    }
  }, [urlCode, state.code, setCode, validate]);

  // Simulate progress during redemption
  useEffect(() => {
    if (showUnboxing && unboxingProgress < 95) {
      const timer = setInterval(() => {
        setUnboxingProgress((prev) => {
          const increment = Math.random() * 15 + 5;
          return Math.min(prev + increment, 95);
        });
      }, 400);
      return () => clearInterval(timer);
    }
  }, [showUnboxing, unboxingProgress]);

  // Handle redemption with unboxing animation
  const handleRedeemWithAnimation = async (request?: {
    create_account?: { email: string; name: string; password: string };
  }) => {
    setShowUnboxing(true);
    setUnboxingProgress(10);

    // Track if this is a new user registration
    setIsNewUser(!!request?.create_account);

    const result = await redeem(request);

    if (result?.success) {
      setUnboxingProgress(100);
      setShowConfetti(true);
    } else {
      setShowUnboxing(false);
      setUnboxingProgress(0);
    }
  };

  const handleUnboxingComplete = () => {
    // New users go to onboarding, existing users go directly to timeline
    if (isNewUser) {
      navigate("/app/onboarding");
    } else {
      navigate("/jornada");
    }
  };

  return (
    <>
      {/* Confetti Celebration */}
      <Confetti isActive={showConfetti} duration={4000} particleCount={80} />

      {/* Unboxing Animation Overlay */}
      <UnboxingAnimation
        isActive={showUnboxing && state.step === "success"}
        progress={unboxingProgress}
        partnerName={state.validation?.partner_name ?? undefined}
        onComplete={handleUnboxingComplete}
      />

      {/* Main Content */}
      <div className="min-h-screen bg-gradient-to-b from-pink-50 via-white to-rose-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md"
        >
          <div className="bg-white rounded-3xl shadow-xl p-8 border border-pink-100">
            {/* Header */}
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
              <p className="text-gray-600 mt-2">
                {state.step === "input"
                  ? "Insira o código do seu voucher para abrir seu presente"
                  : "Complete o resgate para acessar suas memórias"}
              </p>
            </div>

            {/* Steps */}
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
                    onCodeChange={setCode}
                    onSubmit={validate}
                    isLoading={state.isLoading}
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
                  <AccountStep
                    validation={state.validation}
                    onRedeem={handleRedeemWithAnimation}
                    onBack={() => goToStep("input")}
                    isLoading={state.isLoading || showUnboxing}
                    error={state.error}
                  />
                </motion.div>
              )}

              {state.step === "success" && !showUnboxing && (
                <motion.div
                  key="success"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                >
                  <SuccessStep
                    assetsCount={state.validation?.assets_count ?? 0}
                    partnerName={state.validation?.partner_name ?? ""}
                    onContinue={handleUnboxingComplete}
                  />
                </motion.div>
              )}

              {state.step === "error" && (
                <motion.div
                  key="error"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                >
                  <ErrorStep error={state.error} onRetry={reset} />
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Footer Link */}
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
  // Format code with dashes for better readability
  const formatCode = (value: string) => {
    const clean = value.replace(/[^A-Z0-9]/gi, "").toUpperCase();
    const parts = clean.match(/.{1,4}/g) || [];
    return parts.join("-");
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCode(e.target.value);
    if (formatted.length <= 14) {
      // XXXX-XXXX-XXXX
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

interface AccountStepProps {
  validation: {
    partner_name: string | null;
    delivery_title: string | null;
    assets_count: number;
  };
  onRedeem: (request?: {
    create_account?: { email: string; name: string; password: string };
  }) => Promise<unknown>;
  onBack: () => void;
  isLoading: boolean;
  error: string | null;
}

function AccountStep({
  validation,
  onRedeem,
  onBack,
  isLoading,
  error,
}: AccountStepProps) {
  const [mode, setMode] = useState<"login" | "register">("register");
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = () => {
    if (mode === "register") {
      onRedeem({
        create_account: { email, name, password },
      });
    } else {
      // For existing users, just redeem without account creation
      onRedeem();
    }
  };

  return (
    <div className="space-y-6">
      {/* Voucher Info - Celebration Card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-2xl p-5"
      >
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
            <CheckCircle className="w-6 h-6 text-green-600" />
          </div>
          <div>
            <span className="font-semibold text-green-800">
              Voucher Válido!
            </span>
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

      {/* Mode Toggle */}
      <div className="flex rounded-2xl border border-gray-200 overflow-hidden p-1 bg-gray-50">
        <button
          onClick={() => setMode("register")}
          className={`flex-1 py-3 text-sm font-medium rounded-xl transition-all ${
            mode === "register"
              ? "bg-white text-pink-600 shadow-sm"
              : "text-gray-600 hover:text-gray-900"
          }`}
        >
          Sou Novo(a)
        </button>
        <button
          onClick={() => setMode("login")}
          className={`flex-1 py-3 text-sm font-medium rounded-xl transition-all ${
            mode === "login"
              ? "bg-white text-pink-600 shadow-sm"
              : "text-gray-600 hover:text-gray-900"
          }`}
        >
          Já Tenho Conta
        </button>
      </div>

      {/* Form */}
      <div className="space-y-4">
        {mode === "register" && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Seu Nome
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Maria Silva"
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-pink-500 transition-all"
              disabled={isLoading}
            />
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            E-mail
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="seu@email.com"
            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-pink-500 transition-all"
            disabled={isLoading}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Senha
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-pink-500 transition-all"
            disabled={isLoading}
          />
        </div>
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

      {/* Actions */}
      <div className="flex gap-3">
        <button
          onClick={onBack}
          disabled={isLoading}
          className="flex-1 py-3 px-4 border border-gray-200 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 transition-all flex items-center justify-center gap-2"
        >
          <ArrowLeft className="w-5 h-5" />
          Voltar
        </button>
        <button
          onClick={handleSubmit}
          disabled={
            isLoading || !email || !password || (mode === "register" && !name)
          }
          className="flex-1 py-3 px-4 bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 disabled:from-gray-300 disabled:to-gray-300 text-white font-semibold rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-pink-200 disabled:shadow-none"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Abrindo...
            </>
          ) : (
            <>
              Abrir Presente
              <Gift className="w-5 h-5" />
            </>
          )}
        </button>
      </div>
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
        <h2 className="text-2xl font-bold text-gray-900">Presente Aberto!</h2>
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
