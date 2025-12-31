import { useState, useEffect } from "react";
import { useCreateHealthMeasurement } from "@/hooks/api";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerBody,
  DrawerFooter,
} from "@/components/ui/drawer";
import { Camera, Calendar, Ruler, Weight, User } from "lucide-react";
import { cn } from "@/lib/utils";

interface HealthGrowthFormProps {
  childId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const HealthGrowthForm = ({
  childId,
  open,
  onOpenChange,
}: HealthGrowthFormProps) => {
  const { mutate: createMeasurement, isPending } = useCreateHealthMeasurement();
  const [date, setDate] = useState("");
  const [weight, setWeight] = useState("");
  const [height, setHeight] = useState("");
  const [headCircumference, setHeadCircumference] = useState(""); // Novo campo (PC)
  const [hasPhoto, setHasPhoto] = useState(false); // Mock de foto

  // Reset form when opening
  useEffect(() => {
    if (open) {
      setDate(new Date().toISOString().split("T")[0]);
      setWeight("");
      setHeight("");
      setHeadCircumference("");
      setHasPhoto(false);
    }
  }, [open]);

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!date || (!weight && !height)) {
      return;
    }

    // TODO: Enviar PC e Foto quando o backend suportar
    console.log("Saving Measurement:", {
      childId,
      date,
      weight,
      height,
      headCircumference,
      hasPhoto,
    });

    createMeasurement(
      {
        childId,
        date,
        weight: weight ? parseFloat(weight) : undefined,
        height: height ? parseFloat(height) : undefined,
      },
      {
        onSuccess: () => {
          onOpenChange(false);
        },
      }
    );
  };

  return (
    <Drawer open={open} onOpenChange={onOpenChange} direction="right">
      <DrawerContent className="sm:max-w-md">
        <form onSubmit={handleSubmit} className="flex h-full flex-col">
          <DrawerHeader>
            <DrawerTitle>Nova Medição</DrawerTitle>
            <DrawerDescription>
              Registre o crescimento para acompanhar a curva.
            </DrawerDescription>
          </DrawerHeader>

          <DrawerBody className="space-y-6">
            {/* Campo Data */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-ink flex items-center gap-2">
                <Calendar className="h-4 w-4 text-ink-muted" />
                Data da medição
              </label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full rounded-2xl border border-border bg-transparent px-4 py-3 text-ink focus:border-ink focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* Campo Peso */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-ink flex items-center gap-2">
                  <Weight className="h-4 w-4 text-ink-muted" />
                  Peso (kg)
                </label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="0,00"
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                  className="w-full rounded-2xl border border-border bg-transparent px-4 py-3 text-ink focus:border-ink focus:outline-none"
                />
              </div>

              {/* Campo Altura */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-ink flex items-center gap-2">
                  <Ruler className="h-4 w-4 text-ink-muted" />
                  Altura (cm)
                </label>
                <input
                  type="number"
                  step="0.1"
                  placeholder="0,0"
                  value={height}
                  onChange={(e) => setHeight(e.target.value)}
                  className="w-full rounded-2xl border border-border bg-transparent px-4 py-3 text-ink focus:border-ink focus:outline-none"
                />
              </div>
            </div>

            {/* Campo PC (Perímetro Cefálico) */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-ink flex items-center gap-2">
                <User className="h-4 w-4 text-ink-muted" />
                Perímetro Cefálico (cm)
              </label>
              <input
                type="number"
                step="0.1"
                placeholder="0,0"
                value={headCircumference}
                onChange={(e) => setHeadCircumference(e.target.value)}
                className="w-full rounded-2xl border border-border bg-transparent px-4 py-3 text-ink focus:border-ink focus:outline-none"
              />
            </div>

            {/* Mock Upload de Foto */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-ink flex items-center gap-2">
                <Camera className="h-4 w-4 text-ink-muted" />
                Foto do registro (Balança)
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
              disabled={isPending}
              className="w-full rounded-2xl bg-primary py-3 font-semibold text-primary-foreground transition hover:opacity-90 disabled:opacity-60"
            >
              {isPending ? "Salvando..." : "Salvar Medição"}
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
