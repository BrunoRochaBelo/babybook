import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { RadioGroup, RadioGroupItem } from "./ui/radio-group";
import { Heart, Baby, Calendar, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useState } from "react";

interface SetupWizardProps {
  onComplete: (data: { name: string; birthDate: string; mode: string }) => void;
}

export function SetupWizard({ onComplete }: SetupWizardProps) {
  const [step, setStep] = useState(1);
  const [babyName, setBabyName] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [mode, setMode] = useState<"pregnancy" | "postnatal">("postnatal");

  const handleNext = () => {
    if (step < 3) {
      setStep(step + 1);
    } else {
      onComplete({ name: babyName, birthDate, mode });
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-[#FAF8F5] via-[#F5F1EC] to-[#EDE8E2]">
      <div className="w-full max-w-2xl">
        {/* Progress */}
        <div className="mb-8">
          <div className="flex justify-center gap-2 mb-4">
            {[1, 2, 3].map((s) => (
              <div
                key={s}
                className={`h-2 rounded-full transition-all duration-500 ${
                  s === step ? "w-12 bg-primary" : s < step ? "w-8 bg-primary/60" : "w-8 bg-border"
                }`}
              />
            ))}
          </div>
          <p className="text-center text-sm text-muted-foreground">
            Passo {step} de 3
          </p>
        </div>

        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              <Card className="p-8 md:p-12">
                <div className="text-center mb-8">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
                    <Baby className="w-8 h-8 text-primary" />
                  </div>
                  <h2 className="text-3xl mb-3">Como você chama seu bebê?</h2>
                  <p className="text-muted-foreground">
                    Pode ser o nome ou um apelido carinhoso
                  </p>
                </div>

                <div className="space-y-4">
                  <div>
                    <Label htmlFor="babyName">Nome ou Apelido</Label>
                    <Input
                      id="babyName"
                      value={babyName}
                      onChange={(e) => setBabyName(e.target.value)}
                      placeholder="Ex: Helena, Miguelzinho..."
                      className="mt-2 h-14 rounded-2xl bg-input-background text-center text-lg"
                      autoFocus
                    />
                  </div>

                  <Button
                    onClick={handleNext}
                    disabled={!babyName.trim()}
                    className="w-full h-14 rounded-2xl bg-primary hover:bg-primary/90 transition-smooth mt-6"
                  >
                    Continuar
                  </Button>
                </div>
              </Card>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              <Card className="p-8 md:p-12">
                <div className="text-center mb-8">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
                    <Calendar className="w-8 h-8 text-primary" />
                  </div>
                  <h2 className="text-3xl mb-3">Quando {babyName} nasceu?</h2>
                  <p className="text-muted-foreground">
                    Se ainda está na barriga, coloque a data prevista
                  </p>
                </div>

                <div className="space-y-4">
                  <div>
                    <Label htmlFor="birthDate">Data de Nascimento</Label>
                    <Input
                      id="birthDate"
                      type="date"
                      value={birthDate}
                      onChange={(e) => setBirthDate(e.target.value)}
                      className="mt-2 h-14 rounded-2xl bg-input-background text-center"
                      autoFocus
                    />
                  </div>

                  <div className="flex gap-3 mt-6">
                    <Button
                      onClick={handleBack}
                      variant="outline"
                      className="flex-1 h-14 rounded-2xl"
                    >
                      Voltar
                    </Button>
                    <Button
                      onClick={handleNext}
                      disabled={!birthDate}
                      className="flex-1 h-14 rounded-2xl bg-primary hover:bg-primary/90 transition-smooth"
                    >
                      Continuar
                    </Button>
                  </div>
                </div>
              </Card>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              <Card className="p-8 md:p-12">
                <div className="text-center mb-8">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
                    <Sparkles className="w-8 h-8 text-primary" />
                  </div>
                  <h2 className="text-3xl mb-3">Qual é o momento?</h2>
                  <p className="text-muted-foreground">
                    Vamos personalizar sua experiência
                  </p>
                </div>

                <RadioGroup value={mode} onValueChange={(v) => setMode(v as "pregnancy" | "postnatal")} className="space-y-4 mb-8">
                  <div className="relative">
                    <RadioGroupItem value="pregnancy" id="pregnancy" className="sr-only peer" />
                    <Label
                      htmlFor="pregnancy"
                      className="flex flex-col p-6 border-2 border-border rounded-2xl cursor-pointer hover:bg-muted/50 transition-smooth peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/5"
                    >
                      <span className="mb-2">🤰 Estou grávida</span>
                      <span className="text-sm text-muted-foreground">
                        Acompanhe a gestação e prepare-se para o grande dia
                      </span>
                    </Label>
                  </div>

                  <div className="relative">
                    <RadioGroupItem value="postnatal" id="postnatal" className="sr-only peer" />
                    <Label
                      htmlFor="postnatal"
                      className="flex flex-col p-6 border-2 border-border rounded-2xl cursor-pointer hover:bg-muted/50 transition-smooth peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/5"
                    >
                      <span className="mb-2">👶 {babyName} já nasceu</span>
                      <span className="text-sm text-muted-foreground">
                        Registre marcos, momentos e o crescimento do bebê
                      </span>
                    </Label>
                  </div>
                </RadioGroup>

                <div className="flex gap-3">
                  <Button
                    onClick={handleBack}
                    variant="outline"
                    className="flex-1 h-14 rounded-2xl"
                  >
                    Voltar
                  </Button>
                  <Button
                    onClick={handleNext}
                    className="flex-1 h-14 rounded-2xl bg-primary hover:bg-primary/90 transition-smooth"
                  >
                    Abrir meu Livro! 🎉
                  </Button>
                </div>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Encouragement */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-center mt-6"
        >
          <div className="inline-flex items-center gap-2 text-primary">
            <Heart className="w-5 h-5 fill-current" />
            <span className="text-sm">
              {step === 1 && "Que nome lindo! Continue..."}
              {step === 2 && "Estamos quase lá!"}
              {step === 3 && "Última etapa antes do seu santuário!"}
            </span>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
