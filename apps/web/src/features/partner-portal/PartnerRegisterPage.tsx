/**
 * Partner Register Page
 *
 * Página de cadastro para novos fotógrafos parceiros.
 * Cria conta com role=PHOTOGRAPHER e redireciona para o Portal.
 *
 * Formulário multi-step com 3 etapas:
 * 1. Dados Pessoais (nome, estúdio)
 * 2. Contato (email, telefone)
 * 3. Segurança (senha, confirmar senha, termos)
 */

import { useState, FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import {
  Camera,
  Eye,
  EyeOff,
  Loader2,
  AlertCircle,
  Heart,
  CheckCircle2,
  User,
  Mail,
  Lock,
  ChevronRight,
  ChevronLeft,
  Check,
} from "lucide-react";
import { registerPartner } from "./api";
import type { OnboardingRequest } from "./types";

// Step configuration
const STEPS = [
  { id: 1, title: "Dados Pessoais", icon: User },
  { id: 2, title: "Contato", icon: Mail },
  { id: 3, title: "Segurança", icon: Lock },
] as const;

export function PartnerRegisterPage() {
  const proUrl =
    (import.meta.env.VITE_LANDINGPAGE_PRO_URL as string | undefined) ??
    "/pro.html";
  const navigate = useNavigate();

  // Step state
  const [currentStep, setCurrentStep] = useState(1);

  // Form fields
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [studioName, setStudioName] = useState("");
  const [phone, setPhone] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const registerMutation = useMutation({
    mutationFn: (data: OnboardingRequest) => registerPartner(data),
    onSuccess: () => {
      navigate("/pro/login?registered=1");
    },
    onError: (err) => {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Erro ao criar conta. Tente novamente.");
      }
    },
  });

  // Validation per step
  const validateStep = (step: number): boolean => {
    setError(null);

    switch (step) {
      case 1:
        if (!name.trim()) {
          setError("Informe seu nome");
          return false;
        }
        break;
      case 2:
        if (!email.trim()) {
          setError("Informe seu e-mail");
          return false;
        }
        // Basic email validation
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
          setError("Informe um e-mail válido");
          return false;
        }
        break;
      case 3:
        if (!password) {
          setError("Crie uma senha");
          return false;
        }
        if (password.length < 8) {
          setError("A senha deve ter pelo menos 8 caracteres");
          return false;
        }
        if (password !== confirmPassword) {
          setError("As senhas não conferem");
          return false;
        }
        if (!acceptTerms) {
          setError("Você precisa aceitar os termos de uso");
          return false;
        }
        break;
    }
    return true;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep((prev) => Math.min(prev + 1, 3));
    }
  };

  const handleBack = () => {
    setError(null);
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();

    if (!validateStep(3)) return;

    registerMutation.mutate({
      name: name.trim(),
      email: email.trim(),
      password,
      studio_name: studioName.trim() || undefined,
      phone: phone.trim() || undefined,
    });
  };

  const formatPhone = (value: string) => {
    // Format as (XX) XXXXX-XXXX
    const numbers = value.replace(/\D/g, "").slice(0, 11);
    if (numbers.length <= 2) return numbers;
    if (numbers.length <= 7)
      return `(${numbers.slice(0, 2)}) ${numbers.slice(2)}`;
    return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7)}`;
  };

  // Render step indicator
  const renderStepper = () => (
    <div className="mb-8">
      {/* Progress bar and circles */}
      <div className="relative flex items-center justify-between">
        {/* Background line */}
        <div className="absolute left-0 right-0 top-6 h-0.5 bg-gray-200 dark:bg-gray-600 mx-6 sm:mx-8" />

        {/* Progress line (animated) */}
        <div
          className="absolute left-0 top-6 h-0.5 bg-pink-500 transition-all duration-500 ease-out mx-6 sm:mx-8"
          style={{
            width: `calc(${((currentStep - 1) / (STEPS.length - 1)) * 100}% - ${currentStep === 1 ? "0px" : currentStep === 3 ? "0px" : "0px"})`,
          }}
        />

        {STEPS.map((step) => {
          const StepIcon = step.icon;
          const isCompleted = currentStep > step.id;
          const isCurrent = currentStep === step.id;

          return (
            <div
              key={step.id}
              className="flex flex-col items-center z-10 flex-1"
            >
              {/* Step circle */}
              <div
                className={`
                  relative w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center
                  transition-all duration-300 ease-out
                  ${
                    isCompleted
                      ? "bg-pink-500 text-white shadow-lg shadow-pink-200 dark:shadow-pink-900/50"
                      : isCurrent
                        ? "bg-pink-100 dark:bg-pink-900 text-pink-600 dark:text-pink-400 ring-4 ring-pink-50 dark:ring-pink-900/40 border-2 border-pink-300 dark:border-pink-500"
                        : "bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500 border-2 border-gray-200 dark:border-gray-600"
                  }
                `}
              >
                {isCompleted ? (
                  <Check className="w-4 h-4 sm:w-5 sm:h-5" />
                ) : (
                  <StepIcon className="w-4 h-4 sm:w-5 sm:h-5" />
                )}
                {/* Pulse animation for current step */}
                {isCurrent && (
                  <span className="absolute inset-0 rounded-full animate-ping bg-pink-400 opacity-20" />
                )}
              </div>

              {/* Step label */}
              <span
                className={`
                  mt-2 text-[10px] sm:text-xs font-medium text-center leading-tight
                  transition-colors duration-300 px-1
                  ${isCurrent ? "text-pink-600 dark:text-pink-400" : isCompleted ? "text-pink-500 dark:text-pink-400" : "text-gray-400 dark:text-gray-500"}
                `}
              >
                {step.title}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );

  // Render step 1: Personal data
  const renderStep1 = () => (
    <div className="space-y-4 animate-fadeIn">
      <div>
        <label
          htmlFor="name"
          className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
        >
          Seu Nome *
        </label>
        <input
          id="name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Como você gostaria de ser chamado"
          className="w-full px-3 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-pink-500 transition-colors placeholder:text-gray-400 dark:placeholder:text-gray-500"
          autoComplete="name"
          autoFocus
        />
      </div>

      <div>
        <label
          htmlFor="studioName"
          className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
        >
          Nome do Estúdio{" "}
          <span className="text-gray-400 dark:text-gray-500 font-normal">
            (opcional)
          </span>
        </label>
        <input
          id="studioName"
          type="text"
          value={studioName}
          onChange={(e) => setStudioName(e.target.value)}
          placeholder="Ex: Studio Encanto Fotografia"
          className="w-full px-3 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-pink-500 transition-colors placeholder:text-gray-400 dark:placeholder:text-gray-500"
        />
        <p className="mt-1.5 text-xs text-gray-500 dark:text-gray-400">
          Este nome aparecerá para seus clientes no app
        </p>
      </div>
    </div>
  );

  // Render step 2: Contact info
  const renderStep2 = () => (
    <div className="space-y-4 animate-fadeIn">
      <div>
        <label
          htmlFor="email"
          className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
        >
          E-mail *
        </label>
        <input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="seu@email.com"
          className="w-full px-3 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-pink-500 transition-colors placeholder:text-gray-400 dark:placeholder:text-gray-500"
          autoComplete="email"
          autoFocus
        />
        <p className="mt-1.5 text-xs text-gray-500 dark:text-gray-400">
          Usaremos este e-mail para login e comunicações importantes
        </p>
      </div>

      <div>
        <label
          htmlFor="phone"
          className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
        >
          WhatsApp{" "}
          <span className="text-gray-400 dark:text-gray-500 font-normal">
            (opcional)
          </span>
        </label>
        <input
          id="phone"
          type="tel"
          value={phone}
          onChange={(e) => setPhone(formatPhone(e.target.value))}
          placeholder="(11) 99999-9999"
          className="w-full px-3 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-pink-500 transition-colors placeholder:text-gray-400 dark:placeholder:text-gray-500"
          autoComplete="tel"
        />
        <p className="mt-1.5 text-xs text-gray-500 dark:text-gray-400">
          Para suporte prioritário e notificações rápidas
        </p>
      </div>
    </div>
  );

  // Render step 3: Security
  const renderStep3 = () => (
    <div className="space-y-4 animate-fadeIn">
      <div>
        <label
          htmlFor="password"
          className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
        >
          Senha *
        </label>
        <div className="relative">
          <input
            id="password"
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Mínimo 8 caracteres"
            className="w-full px-3 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-pink-500 transition-colors pr-10 sm:pr-12 placeholder:text-gray-400 dark:placeholder:text-gray-500"
            autoComplete="new-password"
            autoFocus
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-400"
          >
            {showPassword ? (
              <EyeOff className="w-5 h-5" />
            ) : (
              <Eye className="w-5 h-5" />
            )}
          </button>
        </div>
        {/* Password strength indicator */}
        {password && (
          <div className="mt-2 flex gap-1">
            {[1, 2, 3, 4].map((level) => (
              <div
                key={level}
                className={`h-1 flex-1 rounded-full transition-colors ${
                  password.length >= level * 3
                    ? password.length >= 12
                      ? "bg-green-500"
                      : password.length >= 8
                        ? "bg-yellow-500"
                        : "bg-red-400"
                    : "bg-gray-200 dark:bg-gray-600"
                }`}
              />
            ))}
          </div>
        )}
      </div>

      <div>
        <label
          htmlFor="confirmPassword"
          className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
        >
          Confirmar Senha *
        </label>
        <div className="relative">
          <input
            id="confirmPassword"
            type={showConfirmPassword ? "text" : "password"}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Repita a senha"
            className="w-full px-3 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-pink-500 transition-colors pr-10 sm:pr-12 placeholder:text-gray-400 dark:placeholder:text-gray-500"
            autoComplete="new-password"
          />
          <button
            type="button"
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-400"
          >
            {showConfirmPassword ? (
              <EyeOff className="w-5 h-5" />
            ) : (
              <Eye className="w-5 h-5" />
            )}
          </button>
        </div>
        {/* Match indicator */}
        {confirmPassword && (
          <p
            className={`mt-1.5 text-xs flex items-center gap-1 ${
              password === confirmPassword ? "text-green-600" : "text-red-500"
            }`}
          >
            {password === confirmPassword ? (
              <>
                <Check className="w-3 h-3" /> Senhas conferem
              </>
            ) : (
              "As senhas não conferem"
            )}
          </p>
        )}
      </div>

      <div className="pt-2">
        <div className="flex items-start gap-3 p-4 bg-gray-50 dark:bg-gray-700 rounded-xl border border-gray-200 dark:border-gray-600">
          <input
            id="terms"
            type="checkbox"
            checked={acceptTerms}
            onChange={(e) => setAcceptTerms(e.target.checked)}
            className="w-4 h-4 mt-0.5 rounded border-gray-300 dark:border-gray-600 text-pink-500 focus:ring-pink-500 dark:bg-gray-700"
          />
          <label
            htmlFor="terms"
            className="text-sm text-gray-600 dark:text-gray-400"
          >
            Li e aceito os{" "}
            <Link
              to="/termos"
              target="_blank"
              rel="noopener noreferrer"
              className="text-pink-600 dark:text-pink-400 hover:text-pink-700 dark:hover:text-pink-300 underline"
            >
              Termos de Uso
            </Link>{" "}
            e a{" "}
            <Link
              to="/privacidade"
              target="_blank"
              rel="noopener noreferrer"
              className="text-pink-600 dark:text-pink-400 hover:text-pink-700 dark:hover:text-pink-300 underline"
            >
              Política de Privacidade
            </Link>
          </label>
        </div>
      </div>
    </div>
  );

  // Render current step content
  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return renderStep1();
      case 2:
        return renderStep2();
      case 3:
        return renderStep3();
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-pink-50 via-white to-rose-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-900 flex flex-col">
      {/* CSS Animation */}
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateX(10px); }
          to { opacity: 1; transform: translateX(0); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out forwards;
        }
      `}</style>

      {/* Header */}
      <header className="p-4">
        <a
          href={proUrl}
          className="inline-flex items-center gap-2"
          rel="noreferrer"
        >
          <div className="w-10 h-10 bg-gradient-to-br from-pink-500 to-rose-500 rounded-xl flex items-center justify-center">
            <Heart className="w-6 h-6 text-white" />
          </div>
          <span className="text-xl font-bold text-gray-900 dark:text-white">
            Baby Book{" "}
            <span className="text-pink-600 dark:text-pink-400">Pro</span>
          </span>
        </a>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center px-4 py-6 sm:p-4 sm:py-8">
        <div className="w-full max-w-md sm:max-w-lg">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-5 sm:p-8 border border-gray-100 dark:border-gray-700">
            {/* Header */}
            <div className="text-center mb-4 sm:mb-6">
              <div className="inline-flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14 bg-pink-100 dark:bg-pink-900/50 rounded-full mb-3">
                <Camera className="w-6 h-6 sm:w-7 sm:h-7 text-pink-600 dark:text-pink-400" />
              </div>
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
                Criar Conta de Parceiro
              </h1>
              <p className="text-gray-500 dark:text-gray-400 mt-1 text-xs sm:text-sm">
                Passo {currentStep} de 3 — {STEPS[currentStep - 1].title}
              </p>
            </div>

            {/* Stepper */}
            {renderStepper()}

            {/* Error Alert */}
            {error && (
              <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-xl flex items-center gap-3 text-red-700 dark:text-red-300">
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                <p className="text-sm">{error}</p>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit}>
              {/* Step Content */}
              {renderStepContent()}

              {/* Navigation Buttons */}
              <div className="mt-6 sm:mt-8 flex gap-2 sm:gap-3">
                {currentStep > 1 && (
                  <button
                    type="button"
                    onClick={handleBack}
                    className="flex-1 py-2.5 sm:py-3 px-3 sm:px-4 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-sm sm:text-base font-medium rounded-xl hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors flex items-center justify-center gap-1.5 sm:gap-2"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    <span className="hidden xs:inline">Voltar</span>
                    <span className="xs:hidden">←</span>
                  </button>
                )}

                {currentStep < 3 ? (
                  <button
                    type="button"
                    onClick={handleNext}
                    className="flex-1 py-2.5 sm:py-3 px-3 sm:px-4 bg-pink-500 text-white text-sm sm:text-base font-medium rounded-xl hover:bg-pink-600 transition-colors flex items-center justify-center gap-1.5 sm:gap-2"
                  >
                    Continuar
                    <ChevronRight className="w-4 h-4" />
                  </button>
                ) : (
                  <button
                    type="submit"
                    disabled={registerMutation.isPending}
                    className="flex-1 py-2.5 sm:py-3 px-3 sm:px-4 bg-pink-500 text-white text-sm sm:text-base font-medium rounded-xl hover:bg-pink-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1.5 sm:gap-2"
                  >
                    {registerMutation.isPending ? (
                      <>
                        <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" />
                        <span className="hidden sm:inline">
                          Criando conta...
                        </span>
                        <span className="sm:hidden">Aguarde...</span>
                      </>
                    ) : (
                      <>
                        <Check className="w-4 h-4" />
                        <span className="hidden sm:inline">
                          Criar Conta Grátis
                        </span>
                        <span className="sm:hidden">Criar Conta</span>
                      </>
                    )}
                  </button>
                )}
              </div>
            </form>

            {/* Benefits List - only show on first step */}
            {currentStep === 1 && (
              <div className="mt-6 p-4 bg-green-50 dark:bg-green-900/30 rounded-xl border border-green-100 dark:border-green-800">
                <p className="text-sm font-medium text-green-800 dark:text-green-300 mb-2">
                  Ao se cadastrar você ganha:
                </p>
                <ul className="space-y-1">
                  <li className="flex items-center gap-2 text-sm text-green-700 dark:text-green-400">
                    <CheckCircle2 className="w-4 h-4" />1 crédito de boas-vindas
                  </li>
                  <li className="flex items-center gap-2 text-sm text-green-700 dark:text-green-400">
                    <CheckCircle2 className="w-4 h-4" />
                    Acesso ao Portal do Parceiro
                  </li>
                  <li className="flex items-center gap-2 text-sm text-green-700 dark:text-green-400">
                    <CheckCircle2 className="w-4 h-4" />
                    Suporte prioritário
                  </li>
                </ul>
              </div>
            )}

            {/* Login Link */}
            <div className="mt-6 text-center text-sm text-gray-600 dark:text-gray-400">
              Já tem uma conta?{" "}
              <Link
                to="/pro/login"
                className="text-pink-600 dark:text-pink-400 hover:text-pink-700 dark:hover:text-pink-300 font-medium"
              >
                Entrar
              </Link>
            </div>
          </div>

          {/* Back to Home */}
          <div className="text-center mt-6">
            <a
              href="http://localhost:3000/pro.html"
              className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 text-sm"
            >
              ← Voltar para Baby Book Pro
            </a>
          </div>
        </div>
      </main>
    </div>
  );
}

export default PartnerRegisterPage;
