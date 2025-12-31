import { useState, useEffect } from "react";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerBody,
  DrawerFooter,
} from "@/components/ui/drawer";
import { Camera, Calendar, FileText, Syringe, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

interface HealthVaccineFormProps {
  childId: string;
  vaccineName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const HealthVaccineForm = ({
  childId,
  vaccineName,
  open,
  onOpenChange,
}: HealthVaccineFormProps) => {
  const [date, setDate] = useState("");
  const [batch, setBatch] = useState("");
  const [reaction, setReaction] = useState("");
  const [hasPhoto, setHasPhoto] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Reset form when opening
  useEffect(() => {
    if (open) {
      setDate(new Date().toISOString().split("T")[0]);
      setBatch("");
      setReaction("");
      setHasPhoto(false);
    }
  }, [open]);

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    setIsSubmitting(true);

    // MOCK SUBMISSION
    console.log("Marking Vaccine Taken:", {
      childId,
      vaccineName,
      date,
      batch,
      reaction,
      hasPhoto,
    });

    setTimeout(() => {
      setIsSubmitting(false);
      onOpenChange(false);
      alert(`Vacina ${vaccineName} registrada com sucesso! (Mock)`);
    }, 1000);
  };

  return (
    <Drawer open={open} onOpenChange={onOpenChange} direction="right">
      <DrawerContent className="sm:max-w-md">
        <form onSubmit={handleSubmit} className="flex h-full flex-col">
          <DrawerHeader>
            <DrawerTitle>Registrar Vacina</DrawerTitle>
            <DrawerDescription>
              Detalhes da aplicação de <strong>{vaccineName}</strong>.
            </DrawerDescription>
          </DrawerHeader>

          <DrawerBody className="space-y-6">
            {/* Campo Data */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-ink flex items-center gap-2">
                <Calendar className="h-4 w-4 text-ink-muted" />
                Data da aplicação
              </label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full rounded-2xl border border-border bg-transparent px-4 py-3 text-ink focus:border-ink focus:outline-none"
              />
            </div>

            {/* Campo Lote */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-ink flex items-center gap-2">
                <Syringe className="h-4 w-4 text-ink-muted" />
                Lote da vacina
              </label>
              <input
                type="text"
                placeholder="Ex: AB12345"
                value={batch}
                onChange={(e) => setBatch(e.target.value)}
                className="w-full rounded-2xl border border-border bg-transparent px-4 py-3 text-ink focus:border-ink focus:outline-none"
              />
            </div>

            {/* Campo Reação */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-ink flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-ink-muted" />
                Reação (se houver)
              </label>
              <textarea
                rows={3}
                placeholder="Ex: Febre leve, dor local..."
                value={reaction}
                onChange={(e) => setReaction(e.target.value)}
                className="w-full resize-none rounded-2xl border border-border bg-transparent px-4 py-3 text-ink focus:border-ink focus:outline-none"
              />
            </div>

            {/* Mock Upload de Foto */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-ink flex items-center gap-2">
                <Camera className="h-4 w-4 text-ink-muted" />
                Foto do comprovante/selo
              </label>
              <button
                type="button"
                onClick={() => setHasPhoto(!hasPhoto)}
                className={cn(
                  "flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-dashed p-6 transition-all",
                  hasPhoto
                    ? "border-success bg-success/10 text-success"
                    : "border-border text-ink-muted hover:border-ink hover:bg-surface-hover"
                )}
              >
                {hasPhoto ? (
                  <>Foto adicionada!</>
                ) : (
                  <>Toque para adicionar foto</>
                )}
              </button>
            </div>
          </DrawerBody>

          <DrawerFooter>
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full rounded-2xl bg-primary py-3 font-semibold text-primary-foreground transition hover:opacity-90 disabled:opacity-60"
            >
              {isSubmitting ? "Salvando..." : "Confirmar Aplicação"}
            </button>
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="w-full rounded-2xl border border-border py-3 font-semibold text-ink transition hover:bg-surface-hover"
            >
              Cancelar
            </button>
          </DrawerFooter>
        </form>
      </DrawerContent>
    </Drawer>
  );
};
