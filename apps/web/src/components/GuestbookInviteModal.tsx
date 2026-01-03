import { useState } from "react";
import { useForm } from "react-hook-form";
import { Copy, Loader2, Mail, Send } from "lucide-react";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { ValidatedInput } from "@/components/ValidatedInput";
import { useCreateGuestbookInvite } from "@/hooks/api";
import { SuccessButton } from "@/components/SuccessButton";

const inviteSchema = z.object({
  email: z.string().email("Email inválido"),
  message: z.string().optional(),
});

type InviteFormValues = z.infer<typeof inviteSchema>;

interface GuestbookInviteModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  childId: string;
}

export function GuestbookInviteModal({
  open,
  onOpenChange,
  childId,
}: GuestbookInviteModalProps) {
  const [successLink, setSuccessLink] = useState<string | null>(null);
  const { mutateAsync: createInvite, isPending } = useCreateGuestbookInvite();

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<InviteFormValues>({
    resolver: zodResolver(inviteSchema),
    defaultValues: {
      email: "",
      message: "",
    },
  });

  const emailValue = watch("email");

  const onSubmit = async (data: InviteFormValues) => {
    try {
      const result = await createInvite({
        childId,
        invitedEmail: data.email,
        messageOpt: data.message,
      });
      setSuccessLink(result.url);
      reset();
    } catch (error) {
      console.error("Failed to notify", error);
    }
  };

  const handleCopyLink = () => {
    if (successLink) {
      navigator.clipboard.writeText(successLink);
    }
  };

  const close = () => {
    setSuccessLink(null);
    reset();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-white">
        <DialogHeader>
          <DialogTitle>Convidar para o Guestbook</DialogTitle>
          <DialogDescription>
            Envie um convite por e-mail para amigos e família deixarem
            mensagens.
          </DialogDescription>
        </DialogHeader>

        {successLink ? (
          <div className="space-y-4">
            <div className="bg-green-50 p-4 rounded-lg text-center border border-green-100">
              <h3 className="text-green-800 font-semibold mb-2">
                Convite enviado!
              </h3>
              <p className="text-sm text-green-700 mb-4">
                Enviamos um e-mail para o convidado com o link de acesso.
              </p>
              <div className="flex items-center gap-2 bg-white p-2 rounded border border-green-200">
                <code className="text-xs flex-1 truncate text-gray-600 font-mono">
                  {successLink}
                </code>
                <button
                  onClick={handleCopyLink}
                  className="p-1.5 hover:bg-gray-50 rounded text-gray-500 transition-colors"
                  title="Copiar link"
                  type="button"
                >
                  <Copy className="w-4 h-4" />
                </button>
              </div>
            </div>
            <div className="flex justify-center">
              <button
                onClick={close}
                className="text-sm font-medium text-gray-600 hover:text-gray-900 px-4 py-2"
              >
                Fechar
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <ValidatedInput
              id="email"
              label="E-mail do convidado"
              placeholder="exemplo@email.com"
              error={errors.email?.message}
              value={emailValue}
              {...register("email")}
            />

            <div className="space-y-1.5">
              <label
                htmlFor="message"
                className="text-sm font-medium text-[var(--bb-color-ink)]"
              >
                Mensagem (opcional)
              </label>
              <textarea
                id="message"
                {...register("message")}
                className="w-full min-h-[80px] rounded-md border border-[var(--bb-color-border)] bg-white px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--bb-color-accent)] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-y"
                placeholder="Escreva algo pessoal para o convidado..."
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={close}
                className="px-4 py-2 text-sm font-medium hover:bg-gray-100 rounded-md transition-colors text-gray-700"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isPending}
                className="flex items-center gap-2 bg-[var(--bb-color-accent)] text-white px-4 py-2 rounded-md text-sm font-medium hover:opacity-90 disabled:opacity-50 transition-opacity"
              >
                {isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Mail className="w-4 h-4" />
                )}
                Enviar Convite
              </button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
