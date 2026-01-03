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
  Sparkles,
  LayoutTemplate,
  Gift,
} from "lucide-react";
import { registerPartner } from "./api";
import type { OnboardingRequest } from "./types";
import { ValidatedInput, validationRules } from "@/components/ValidatedInput";
import { cn } from "@/lib/utils";

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
  const [direction, setDirection] = useState<"forward" | "back">("forward");

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
      setDirection("forward");
      setCurrentStep((prev) => Math.min(prev + 1, 3));
    }
  };

  const handleBack = () => {
    setError(null);
    setDirection("back");
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
    <div className="mb-10 px-4">
      {/* Progress bar and circles */}
      <div className="relative flex items-center justify-between max-w-xs mx-auto">
        {/* Background line */}
        <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-1 bg-gray-100 dark:bg-gray-700/50 rounded-full" />

        {/* Progress line (animated) */}
        <div
          className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-gradient-to-r from-pink-500 to-rose-500 rounded-full transition-all duration-500 ease-out"
          style={{
            width: `${((currentStep - 1) / (STEPS.length - 1)) * 100}%`,
          }}
        />

        {STEPS.map((step) => {
          const StepIcon = step.icon;
          const isCompleted = currentStep > step.id;
          const isCurrent = currentStep === step.id;

          return (
            <div key={step.id} className="relative z-10 group">
              {/* Step circle */}
              <div
                className={cn(
                  "w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 ease-out border-4",
                  isCompleted
                    ? "bg-gradient-to-br from-pink-500 to-rose-600 text-white border-white dark:border-gray-800 shadow-lg shadow-pink-500/30 scale-100"
                    : isCurrent
                      ? "bg-white dark:bg-gray-800 text-pink-600 dark:text-pink-400 border-pink-100 dark:border-pink-900 ring-2 ring-pink-500 ring-offset-2 ring-offset-white dark:ring-offset-gray-900 scale-110"
                      : "bg-white dark:bg-gray-800 text-gray-300 dark:text-gray-600 border-gray-100 dark:border-gray-700",
                )}
              >
                {isCompleted ? (
                  <Check className="w-5 h-5" />
                ) : (
                  <StepIcon className="w-4 h-4" />
                )}
              </div>

              {/* Step label - hidden on mobile small */}
              <span
                className={cn(
                  "absolute -bottom-8 left-1/2 -translate-x-1/2 text-[10px] font-bold uppercase tracking-wider whitespace-nowrap transition-all duration-300",
                  isCurrent
                    ? "text-pink-600 dark:text-pink-400 translate-y-0 opacity-100"
                    : "text-gray-400 dark:text-gray-500 translate-y-1 opacity-0 sm:opacity-70",
                )}
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
    <div className="space-y-5 animate-in fade-in slide-in-from-right-8 duration-300">
      <div>
        <label
          htmlFor="name"
          className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1.5"
        >
          Seu Nome <span className="text-pink-500">*</span>
        </label>
        <div className="relative group">
          <input
            id="name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Como você gostaria de ser chamado"
            className="w-full pl-4 pr-4 py-3.5 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white rounded-2xl focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all placeholder:text-gray-400 dark:placeholder:text-gray-500 group-hover:bg-white dark:group-hover:bg-gray-800"
            autoComplete="name"
            autoFocus
          />
        </div>
      </div>

      <div>
        <label
          htmlFor="studioName"
          className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1.5"
        >
          Nome do Estúdio{" "}
          <span className="text-gray-400 dark:text-gray-500 font-normal text-xs ml-1">
            (opcional)
          </span>
        </label>
        <div className="relative group">
          <input
            id="studioName"
            type="text"
            value={studioName}
            onChange={(e) => setStudioName(e.target.value)}
            placeholder="Ex: Studio Encanto Fotografia"
            className="w-full pl-4 pr-4 py-3.5 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white rounded-2xl focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all placeholder:text-gray-400 dark:placeholder:text-gray-500 group-hover:bg-white dark:group-hover:bg-gray-800"
          />
        </div>
        <p className="mt-2 text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
          <Sparkles className="w-3 h-3 text-amber-500" />
          Este nome aparecerá para seus clientes no app
        </p>
      </div>
    </div>
  );

  // Render step 2: Contact info
  const renderStep2 = () => (
    <div className="space-y-5 animate-in fade-in slide-in-from-right-8 duration-300">
      <ValidatedInput
        label="E-mail *"
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="seu@email.com"
        autoComplete="email"
        autoFocus
        rules={[validationRules.email]}
        validateDelay={300}
        helperText="Usaremos este e-mail para login e comunicações"
        className="w-full pl-4 pr-4 py-3.5 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white rounded-2xl focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all placeholder:text-gray-400 dark:placeholder:text-gray-500 hover:bg-white dark:hover:bg-gray-800"
      />

      <div>
        <label
          htmlFor="phone"
          className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1.5"
        >
          WhatsApp{" "}
          <span className="text-gray-400 dark:text-gray-500 font-normal text-xs ml-1">
            (opcional)
          </span>
        </label>
        <div className="relative group">
          <input
            id="phone"
            type="tel"
            value={phone}
            onChange={(e) => setPhone(formatPhone(e.target.value))}
            placeholder="(11) 99999-9999"
            className="w-full pl-4 pr-4 py-3.5 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white rounded-2xl focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all placeholder:text-gray-400 dark:placeholder:text-gray-500 group-hover:bg-white dark:group-hover:bg-gray-800"
            autoComplete="tel"
          />
        </div>
        <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
          Para suporte prioritário e notificações rápidas
        </p>
      </div>
    </div>
  );

  // Render step 3: Security
  const renderStep3 = () => (
    <div className="space-y-5 animate-in fade-in slide-in-from-right-8 duration-300">
      <div>
        <label
          htmlFor="password"
          className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1.5"
        >
          Senha <span className="text-pink-500">*</span>
        </label>
        <div className="relative group">
          <input
            id="password"
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Mínimo 8 caracteres"
            className="w-full pl-4 pr-12 py-3.5 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white rounded-2xl focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all placeholder:text-gray-400 dark:placeholder:text-gray-500 group-hover:bg-white dark:group-hover:bg-gray-800"
            autoComplete="new-password"
            autoFocus
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-400 transition-colors p-1"
          >
            {showPassword ? (
              <EyeOff className="w-5 h-5" />
            ) : (
              <Eye className="w-5 h-5" />
            )}
          </button>
        </div>
        {/* Password strength indicator */}
        <div className="mt-2 h-1 w-full bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden flex gap-1">
          {[1, 2, 3, 4].map((level) => (
            <div
              key={level}
              className={cn(
                "h-full flex-1 rounded-full transition-all duration-500",
                password.length >= level * 3
                  ? password.length >= 12
                    ? "bg-emerald-500"
                    : password.length >= 8
                      ? "bg-amber-500"
                      : "bg-rose-500"
                  : "bg-transparent",
              )}
            />
          ))}
        </div>
      </div>

      <div>
        <label
          htmlFor="confirmPassword"
          className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1.5"
        >
          Confirmar Senha <span className="text-pink-500">*</span>
        </label>
        <div className="relative group">
          <input
            id="confirmPassword"
            type={showConfirmPassword ? "text" : "password"}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Repita a senha"
            className="w-full pl-4 pr-12 py-3.5 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white rounded-2xl focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all placeholder:text-gray-400 dark:placeholder:text-gray-500 group-hover:bg-white dark:group-hover:bg-gray-800"
            autoComplete="new-password"
          />
          <button
            type="button"
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-400 transition-colors p-1"
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
            className={cn(
              "mt-2 text-xs font-medium flex items-center gap-1.5 animate-in fade-in slide-in-from-left-2",
              password === confirmPassword ? "text-emerald-600" : "text-rose-500"
            )}
          >
            {password === confirmPassword ? (
              <>
                <CheckCircle2 className="w-3.5 h-3.5" /> Senhas conferem
              </>
            ) : (
              <>
                 <AlertCircle className="w-3.5 h-3.5" /> Senhas não conferem
              </>
            )}
          </p>
        )}
      </div>

      <div className="pt-2">
        <div className="flex items-start gap-3 p-4 bg-gray-50/50 dark:bg-gray-800/50 rounded-2xl border border-gray-100 dark:border-gray-700/50 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
          <div className="relative flex items-center h-5">
             <input
              id="terms"
              type="checkbox"
              checked={acceptTerms}
              onChange={(e) => setAcceptTerms(e.target.checked)}
              className="w-5 h-5 rounded-md border-gray-300 dark:border-gray-600 text-pink-600 focus:ring-pink-500 dark:bg-gray-700 cursor-pointer"
            />
          </div>
          <label
            htmlFor="terms"
            className="text-sm text-gray-600 dark:text-gray-400 cursor-pointer select-none"
          >
            Li e aceito os{" "}
            <Link
              to="/termos"
              target="_blank"
              rel="noopener noreferrer"
              className="font-bold text-gray-900 dark:text-white hover:text-pink-600 dark:hover:text-pink-400 transition-colors underline decoration-gray-300 dark:decoration-gray-600 underline-offset-2"
            >
              Termos de Uso
            </Link>{" "}
            e a{" "}
            <Link
              to="/privacidade"
              target="_blank"
              rel="noopener noreferrer"
              className="font-bold text-gray-900 dark:text-white hover:text-pink-600 dark:hover:text-pink-400 transition-colors underline decoration-gray-300 dark:decoration-gray-600 underline-offset-2"
            >
              Política de Privacidade
            </Link>.
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
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))] from-gray-50 via-white to-pink-50/20 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      
      {/* Background Decor */}
      <div className="fixed top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
         <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-gradient-to-br from-pink-200/20 to-purple-200/20 dark:from-pink-900/10 dark:to-purple-900/10 rounded-full blur-[100px] -mr-40 -mt-40" />
         <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-gradient-to-tr from-blue-200/20 to-emerald-200/20 dark:from-blue-900/10 dark:to-emerald-900/10 rounded-full blur-[100px] -ml-40 -mb-40" />
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        {/* Header Branding */}
        <div className="text-center mb-8">
          <Link
            to={proUrl}
            className="inline-flex items-center gap-3 group"
          >
            <div className="w-12 h-12 bg-gradient-to-br from-pink-500 to-rose-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-pink-500/20 group-hover:scale-110 group-hover:-rotate-3 transition-transform duration-300">
               <Heart className="w-6 h-6 fill-current" />
            </div>
            <span className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">
              BabyBook <span className="text-pink-600 dark:text-pink-400">Pro</span>
            </span>
          </Link>
          <h2 className="mt-6 text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
             Crie sua conta parceira
          </h2>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            Comece a encantar seus clientes hoje mesmo.
          </p>
        </div>

        {/* Main Card */}
        <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl py-8 px-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-black/20 rounded-[2rem] border border-white/50 dark:border-gray-700/50 sm:px-10 relative">
          
          {/* Stepper */}
          {renderStepper()}

          {/* Error Alert */}
          {error && (
            <div className="mb-6 p-4 bg-rose-50 dark:bg-rose-900/20 border border-rose-100 dark:border-rose-900/30 rounded-2xl flex items-center gap-3 text-rose-700 dark:text-rose-300 animate-in fade-in slide-in-from-top-2">
              <div className="w-8 h-8 rounded-full bg-rose-100 dark:bg-rose-900/50 flex items-center justify-center flex-shrink-0">
                 <AlertCircle className="w-4 h-4" />
              </div>
              <p className="text-sm font-medium">{error}</p>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="relative min-h-[280px] flex flex-col justify-between">
            {/* Step Content Area */}
            <div className="flex-1">
               {renderStepContent()}
            </div>

            {/* Navigation Buttons */}
            <div className="mt-8 flex items-center gap-3 pt-6 border-t border-gray-100 dark:border-gray-700/50">
              {currentStep > 1 ? (
                <button
                  type="button"
                  onClick={handleBack}
                  className="flex-1 py-3.5 px-4 bg-gray-100 dark:bg-gray-700/50 text-gray-700 dark:text-gray-300 text-sm font-bold rounded-2xl hover:bg-gray-200 dark:hover:bg-gray-700 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Voltar
                </button>
              ) : (
                 <Link
                    to="/pro/login"
                    className="flex-1 py-3.5 px-4 bg-transparent text-gray-500 dark:text-gray-400 text-sm font-bold rounded-2xl hover:text-gray-900 dark:hover:text-white transition-colors flex items-center justify-center"
                 >
                    Ja tenho conta
                 </Link>
              )}

              {currentStep < 3 ? (
                <button
                  type="button"
                  onClick={handleNext}
                  className="flex-[2] py-3.5 px-4 bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-sm font-bold rounded-2xl hover:bg-gray-800 dark:hover:bg-gray-100 transition-all active:scale-[0.98] shadow-lg shadow-gray-900/20 dark:shadow-white/10 flex items-center justify-center gap-2 group"
                >
                  Continuar
                  <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={registerMutation.isPending}
                  className="flex-[2] py-3.5 px-4 bg-gradient-to-r from-pink-500 to-rose-600 text-white text-sm font-bold rounded-2xl hover:from-pink-600 hover:to-rose-700 transition-all active:scale-[0.98] shadow-lg shadow-pink-500/25 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {registerMutation.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Criando conta...
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      Finalizar Cadastro
                    </>
                  )}
                </button>
              )}
            </div>
          </form>
          
        </div>

        {/* Benefits List - only show on first step */}
       {currentStep === 1 && (
            <div className="mt-8 text-center animate-in fade-in slide-in-from-bottom-4 duration-700 delay-100">
              <p className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-4">
                 Benefícios exclusivos
              </p>
              <div className="flex justify-center gap-6">
                 <div className="flex flex-col items-center gap-2">
                    <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-100 to-teal-100 dark:from-emerald-900/30 dark:to-teal-900/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-1">
                       <Gift className="w-5 h-5" />
                    </div>
                    <span className="text-[10px] font-medium text-gray-600 dark:text-gray-400 max-w-[80px] leading-tight">1 crédito grátis</span>
                 </div>
                <div className="flex flex-col items-center gap-2">
                    <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-900/30 dark:to-indigo-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-1">
                       <LayoutTemplate className="w-5 h-5" />
                    </div>
                    <span className="text-[10px] font-medium text-gray-600 dark:text-gray-400 max-w-[80px] leading-tight">Portal completo</span>
                 </div>
                 <div className="flex flex-col items-center gap-2">
                    <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-100 to-orange-100 dark:from-amber-900/30 dark:to-orange-900/30 text-amber-600 dark:text-amber-400 flex items-center justify-center mb-1">
                       <Sparkles className="w-5 h-5" />
                    </div>
                    <span className="text-[10px] font-medium text-gray-600 dark:text-gray-400 max-w-[80px] leading-tight">Suporte VIP</span>
                 </div>
              </div>
            </div>
       )}
      </div>
    </div>
  );
}

export default PartnerRegisterPage;
