import { useUpsellStore } from "@/store/upsell.store";
import { Dialog, DialogContent, DialogTitle } from "@babybook/ui";

const titles: Record<string, string> = {
  recurrent_social: "Pacote Repetições",
  storage: "Mais Armazenamento",
  premium_print: "Versão Premium Impressa"
};

export function UpsellModal() {
  const { visibleModal, closeModal } = useUpsellStore();
  return (
    <Dialog open={Boolean(visibleModal)} onOpenChange={closeModal}>
      <DialogContent>
        <DialogTitle>
          {visibleModal ? titles[visibleModal] : "Upgrade disponível"}
        </DialogTitle>
        <p className="text-sm text-slate-600">
          Todo upsell precisa estar alinhado com os limites definidos na API
          (quotas base + flags). Este modal é apenas um placeholder para o
          fluxo completo.
        </p>
      </DialogContent>
    </Dialog>
  );
}
