import { useState, useEffect } from "react";
import { useCreateHealthVisit } from "@/hooks/api";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerBody,
  DrawerFooter,
} from "@/components/ui/drawer";
import { Camera, Calendar, FileText, Stethoscope } from "lucide-react";
import { cn } from "@/lib/utils";

interface HealthVisitFormProps {
  childId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const HealthVisitForm = ({
  childId,
  open,
  onOpenChange,
}: HealthVisitFormProps) => {
  const { mutate: createVisit, isPending } = useCreateHealthVisit();
  const [date, setDate] = useState("");
  const [reason, setReason] = useState("");
  const [notes, setNotes] = useState("");
  const [hasPhoto, setHasPhoto] = useState(false); // Mock de foto (receita/laudo)

  // Reset form when opening
  useEffect(() => {
    if (open) {
      setDate(new Date().toISOString().split("T")[0]);
      setReason("");
      setNotes("");
      setHasPhoto(false);
    }
  }, [open]);

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!date || !reason) {
      return;
    }

    // TODO: Enviar Foto quando o backend suportar
    console.log("Saving Visit:", {
      childId,
      date,
      reason,
      notes,
      hasPhoto,
    });

    createVisit(
      {
        childId,
        date,
        reason,
        notes: notes || undefined,
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
      <DrawerContent
        className="sm:max-w-md"
        style={{ backgroundColor: "var(--bb-color-surface)" }}
      >
        <form onSubmit={handleSubmit} className="flex h-full flex-col">
          <DrawerHeader
            style={{
              borderBottom: "1px solid var(--bb-color-border)",
              backgroundColor: "var(--bb-color-surface)",
            }}
          >
            <DrawerTitle style={{ color: "var(--bb-color-ink)" }}>
              Nova Visita
            </DrawerTitle>
            <DrawerDescription style={{ color: "var(--bb-color-ink-muted)" }}>
              Registre consultas, urgências ou acompanhamentos.
            </DrawerDescription>
          </DrawerHeader>

          <DrawerBody
            className="space-y-6"
            style={{ backgroundColor: "var(--bb-color-surface)" }}
          >
            {/* Campo Data */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-ink flex items-center gap-2">
                <Calendar className="h-4 w-4 text-ink-muted" />
                Data da consulta
              </label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full rounded-2xl border border-border bg-transparent px-4 py-3 text-ink focus:border-ink focus:outline-none"
              />
            </div>

            {/* Campo Motivo */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-ink flex items-center gap-2">
                <Stethoscope className="h-4 w-4 text-ink-muted" />
                Motivo
              </label>
              <input
                type="text"
                placeholder="Ex: Rotina, Febre, Vacina..."
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full rounded-2xl border border-border bg-transparent px-4 py-3 text-ink focus:border-ink focus:outline-none"
                required
              />
            </div>

            {/* Campo Prescrição/Obs */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-ink flex items-center gap-2">
                <FileText className="h-4 w-4 text-ink-muted" />
                Prescrição / Observações
              </label>
              <textarea
                rows={5}
                placeholder="Medicamentos, orientações, diagnósticos..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full resize-none rounded-2xl border border-border bg-transparent px-4 py-3 text-ink focus:border-ink focus:outline-none"
              />
            </div>

            {/* Mock Upload de Foto */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-ink flex items-center gap-2">
                <Camera className="h-4 w-4 text-ink-muted" />
                Foto (Receita ou Laudo)
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

          <DrawerFooter
            style={{
              borderTop: "1px solid var(--bb-color-border)",
              backgroundColor: "var(--bb-color-bg)",
            }}
          >
            <button
              type="submit"
              disabled={isPending}
              className="w-full rounded-2xl bg-primary py-3 font-semibold text-primary-foreground transition hover:opacity-90 disabled:opacity-60"
            >
              {isPending ? "Salvando..." : "Salvar Visita"}
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
