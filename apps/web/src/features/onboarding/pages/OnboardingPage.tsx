/**
 * Onboarding Page
 *
 * Initial setup wizard for new users.
 * Collects essential information: baby name and birth date.
 *
 * Design Goals (from Dossiê):
 * - Minimal friction: only 2 questions
 * - These configure the entire timeline
 * - Emotional design with gentle animations
 */

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import {
  Baby,
  Calendar,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  Heart,
  Loader2,
} from "lucide-react";
import { useCreateChild } from "@/hooks/api";

type OnboardingStep = "welcome" | "name" | "birthday" | "complete";

export function OnboardingPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState<OnboardingStep>("welcome");
  const [babyName, setBabyName] = useState("");
  const [birthday, setBirthday] = useState("");
  const [isExpecting, setIsExpecting] = useState(false);
  const [dueDate, setDueDate] = useState("");

  const createChild = useCreateChild();

  const handleNext = () => {
    const steps: OnboardingStep[] = ["welcome", "name", "birthday", "complete"];
    const currentIndex = steps.indexOf(step);
    if (currentIndex < steps.length - 1) {
      setStep(steps[currentIndex + 1]);
    }
  };

  const handleBack = () => {
    const steps: OnboardingStep[] = ["welcome", "name", "birthday", "complete"];
    const currentIndex = steps.indexOf(step);
    if (currentIndex > 0) {
      setStep(steps[currentIndex - 1]);
    }
  };

  const handleComplete = async () => {
    try {
      await createChild.mutateAsync({
        name: babyName,
        // For expecting parents, we store the due date in birthday (can be updated after birth)
        birthday: isExpecting ? dueDate : birthday || undefined,
      });
      setStep("complete");
      // Redirect after animation
      setTimeout(() => navigate("/jornada"), 2000);
    } catch (error) {
      console.error("Failed to create child:", error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-pink-50 via-white to-rose-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-lg"
      >
        <div className="bg-white rounded-3xl shadow-xl p-8 border border-pink-100">
          <AnimatePresence mode="wait">
            {step === "welcome" && (
              <WelcomeStep key="welcome" onNext={handleNext} />
            )}

            {step === "name" && (
              <NameStep
                key="name"
                babyName={babyName}
                onNameChange={setBabyName}
                onNext={handleNext}
                onBack={handleBack}
              />
            )}

            {step === "birthday" && (
              <BirthdayStep
                key="birthday"
                birthday={birthday}
                onBirthdayChange={setBirthday}
                isExpecting={isExpecting}
                onExpectingChange={setIsExpecting}
                dueDate={dueDate}
                onDueDateChange={setDueDate}
                onComplete={handleComplete}
                onBack={handleBack}
                isLoading={createChild.isPending}
              />
            )}

            {step === "complete" && (
              <CompleteStep key="complete" babyName={babyName} />
            )}
          </AnimatePresence>

          {/* Progress Indicator */}
          {step !== "welcome" && step !== "complete" && (
            <div className="flex justify-center gap-2 mt-8">
              {["name", "birthday"].map((s) => (
                <div
                  key={s}
                  className={`w-2 h-2 rounded-full transition-colors ${
                    step === s ? "bg-pink-500" : "bg-gray-200"
                  }`}
                />
              ))}
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}

// ============================================================
// Step Components
// ============================================================

interface WelcomeStepProps {
  onNext: () => void;
}

function WelcomeStep({ onNext }: WelcomeStepProps) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      className="text-center space-y-6"
    >
      <motion.div
        initial={{ scale: 0.8 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", stiffness: 200, delay: 0.2 }}
        className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-br from-pink-500 to-rose-500 rounded-3xl shadow-lg shadow-pink-200"
      >
        <Heart className="w-12 h-12 text-white" />
      </motion.div>

      <div>
        <motion.h1
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="text-3xl font-bold text-gray-900"
        >
          Bem-vinda ao Baby Book!
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="text-gray-600 mt-3"
        >
          Vamos configurar o álbum do seu bebê. São apenas 2 perguntinhas
          rápidas!
        </motion.p>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="flex justify-center gap-4 text-sm text-gray-500"
      >
        <span className="flex items-center gap-1">
          <Sparkles className="w-4 h-4 text-pink-400" />
          Rápido
        </span>
        <span className="flex items-center gap-1">
          <Baby className="w-4 h-4 text-pink-400" />
          Personalizado
        </span>
        <span className="flex items-center gap-1">
          <Calendar className="w-4 h-4 text-pink-400" />
          Organizado
        </span>
      </motion.div>

      <motion.button
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        onClick={onNext}
        className="w-full py-4 px-4 bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white font-semibold rounded-2xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-pink-200"
      >
        Vamos Começar!
        <ArrowRight className="w-5 h-5" />
      </motion.button>
    </motion.div>
  );
}

interface NameStepProps {
  babyName: string;
  onNameChange: (name: string) => void;
  onNext: () => void;
  onBack: () => void;
}

function NameStep({ babyName, onNameChange, onNext, onBack }: NameStepProps) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      className="space-y-6"
    >
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-pink-100 rounded-2xl mb-4">
          <Baby className="w-8 h-8 text-pink-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900">
          Qual o nome do bebê?
        </h2>
        <p className="text-gray-600 mt-2">
          Esse será o protagonista do seu Baby Book
        </p>
      </div>

      <div>
        <input
          type="text"
          value={babyName}
          onChange={(e) => onNameChange(e.target.value)}
          placeholder="Nome do bebê"
          className="w-full px-4 py-4 border-2 border-gray-200 rounded-2xl focus:ring-2 focus:ring-pink-500 focus:border-pink-500 text-center text-xl transition-all"
          autoFocus
        />
        <p className="text-xs text-gray-500 mt-2 text-center">
          Pode ser apelido carinhoso também 💕
        </p>
      </div>

      <div className="flex gap-3">
        <button
          onClick={onBack}
          className="flex-1 py-3 px-4 border border-gray-200 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 transition-all flex items-center justify-center gap-2"
        >
          <ArrowLeft className="w-5 h-5" />
          Voltar
        </button>
        <button
          onClick={onNext}
          disabled={!babyName.trim()}
          className="flex-1 py-3 px-4 bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 disabled:from-gray-300 disabled:to-gray-300 text-white font-semibold rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-pink-200 disabled:shadow-none"
        >
          Próximo
          <ArrowRight className="w-5 h-5" />
        </button>
      </div>
    </motion.div>
  );
}

interface BirthdayStepProps {
  birthday: string;
  onBirthdayChange: (date: string) => void;
  isExpecting: boolean;
  onExpectingChange: (expecting: boolean) => void;
  dueDate: string;
  onDueDateChange: (date: string) => void;
  onComplete: () => void;
  onBack: () => void;
  isLoading: boolean;
}

function BirthdayStep({
  birthday,
  onBirthdayChange,
  isExpecting,
  onExpectingChange,
  dueDate,
  onDueDateChange,
  onComplete,
  onBack,
  isLoading,
}: BirthdayStepProps) {
  const isValid = isExpecting ? Boolean(dueDate) : Boolean(birthday);

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      className="space-y-6"
    >
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-pink-100 rounded-2xl mb-4">
          <Calendar className="w-8 h-8 text-pink-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900">
          {isExpecting ? "Quando é a data prevista?" : "Quando o bebê nasceu?"}
        </h2>
        <p className="text-gray-600 mt-2">
          Isso nos ajuda a organizar a timeline de momentos
        </p>
      </div>

      {/* Toggle: Already born or expecting */}
      <div className="flex rounded-2xl border border-gray-200 overflow-hidden p-1 bg-gray-50">
        <button
          onClick={() => onExpectingChange(false)}
          className={`flex-1 py-3 text-sm font-medium rounded-xl transition-all ${
            !isExpecting
              ? "bg-white text-pink-600 shadow-sm"
              : "text-gray-600 hover:text-gray-900"
          }`}
        >
          Já Nasceu
        </button>
        <button
          onClick={() => onExpectingChange(true)}
          className={`flex-1 py-3 text-sm font-medium rounded-xl transition-all ${
            isExpecting
              ? "bg-white text-pink-600 shadow-sm"
              : "text-gray-600 hover:text-gray-900"
          }`}
        >
          Ainda é Gestação
        </button>
      </div>

      <div>
        {isExpecting ? (
          <input
            type="date"
            value={dueDate}
            onChange={(e) => onDueDateChange(e.target.value)}
            className="w-full px-4 py-4 border-2 border-gray-200 rounded-2xl focus:ring-2 focus:ring-pink-500 focus:border-pink-500 text-center text-lg transition-all"
          />
        ) : (
          <input
            type="date"
            value={birthday}
            onChange={(e) => onBirthdayChange(e.target.value)}
            max={new Date().toISOString().split("T")[0]}
            className="w-full px-4 py-4 border-2 border-gray-200 rounded-2xl focus:ring-2 focus:ring-pink-500 focus:border-pink-500 text-center text-lg transition-all"
          />
        )}
        <p className="text-xs text-gray-500 mt-2 text-center">
          {isExpecting
            ? "A data prevista do parto"
            : "Você pode ajustar depois se precisar"}
        </p>
      </div>

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
          onClick={onComplete}
          disabled={!isValid || isLoading}
          className="flex-1 py-3 px-4 bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 disabled:from-gray-300 disabled:to-gray-300 text-white font-semibold rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-pink-200 disabled:shadow-none"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Criando...
            </>
          ) : (
            <>
              Criar Baby Book
              <Heart className="w-5 h-5" />
            </>
          )}
        </button>
      </div>
    </motion.div>
  );
}

interface CompleteStepProps {
  babyName: string;
}

function CompleteStep({ babyName }: CompleteStepProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="text-center space-y-6"
    >
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", stiffness: 200 }}
        className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full shadow-lg shadow-green-200"
      >
        <Sparkles className="w-12 h-12 text-white" />
      </motion.div>

      <div>
        <h2 className="text-2xl font-bold text-gray-900">Tudo Pronto!</h2>
        <p className="text-gray-600 mt-2">
          O Baby Book de <strong>{babyName}</strong> foi criado com carinho.
        </p>
      </div>

      <p className="text-sm text-gray-500">Preparando sua Jornada...</p>
      <Loader2 className="w-6 h-6 animate-spin mx-auto text-pink-500" />
    </motion.div>
  );
}

export default OnboardingPage;
