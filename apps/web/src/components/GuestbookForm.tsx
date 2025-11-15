import { useEffect, useId, useRef, useState } from "react";
import { useCreateGuestbookEntry } from "@/hooks/api";
import { X } from "lucide-react";

interface GuestbookFormProps {
  childId: string;
  onClose: () => void;
}

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])';

export const GuestbookForm = ({ childId, onClose }: GuestbookFormProps) => {
  const [authorName, setAuthorName] = useState("");
  const [authorEmail, setAuthorEmail] = useState("");
  const [message, setMessage] = useState("");
  const { mutate: createEntry, isPending } = useCreateGuestbookEntry();
  const dialogRef = useRef<HTMLDivElement | null>(null);
  const nameInputRef = useRef<HTMLInputElement | null>(null);
  const titleId = useId();
  const descriptionId = useId();

  useEffect(() => {
    nameInputRef.current?.focus();
  }, []);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
        return;
      }

      if (event.key === "Tab" && dialogRef.current) {
        const focusable = Array.from(
          dialogRef.current.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR),
        ).filter((element) => !element.hasAttribute("disabled"));

        if (focusable.length === 0) {
          return;
        }

        const firstElement = focusable[0];
        const lastElement = focusable[focusable.length - 1];
        const activeElement = document.activeElement as HTMLElement | null;

        if (event.shiftKey && activeElement === firstElement) {
          event.preventDefault();
          lastElement.focus();
        } else if (!event.shiftKey && activeElement === lastElement) {
          event.preventDefault();
          firstElement.focus();
        }
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!authorName || !message) {
      return;
    }
    createEntry(
      {
        childId,
        authorName,
        authorEmail: authorEmail || undefined,
        message,
      },
      {
        onSuccess: () => {
          setAuthorName("");
          setAuthorEmail("");
          setMessage("");
          onClose();
        },
      },
    );
  };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
        className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl"
      >
        <div className="flex justify-between items-center mb-4">
          <h3 id={titleId} className="text-lg font-bold text-[#2A2A2A]">
            Deixe uma Mensagem
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="p-1 hover:bg-[#F7F3EF] rounded-lg transition-colors"
            aria-label="Fechar formulário de mensagem"
          >
            <X className="w-5 h-5 text-[#2A2A2A]" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-[#2A2A2A] mb-2" htmlFor="guestbook-name">
              Seu Nome
            </label>
            <input
              id="guestbook-name"
              type="text"
              value={authorName}
              onChange={(event) => setAuthorName(event.target.value)}
              className="w-full px-3 py-2 border border-[#C9D3C2] rounded-xl"
              placeholder="Como você se chama?"
              ref={nameInputRef}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-[#2A2A2A] mb-2" htmlFor="guestbook-email">
              Seu E-mail (opcional)
            </label>
            <input
              id="guestbook-email"
              type="email"
              value={authorEmail}
              onChange={(event) => setAuthorEmail(event.target.value)}
              className="w-full px-3 py-2 border border-[#C9D3C2] rounded-xl"
              placeholder="voce@email.com"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-[#2A2A2A] mb-2" htmlFor="guestbook-message">
              Sua Mensagem
            </label>
            <textarea
              id="guestbook-message"
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              className="w-full px-3 py-2 border border-[#C9D3C2] rounded-xl"
              rows={5}
              placeholder="Escreva uma mensagem especial..."
              required
            />
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3" id={descriptionId}>
            <p className="text-xs text-blue-700">
              Sua mensagem será revisada antes de ser publicada.
            </p>
          </div>

          <div className="flex gap-2">
            <button
              type="submit"
              disabled={isPending}
              className="flex-1 bg-[#F2995D] text-white px-6 py-2 rounded-xl font-semibold hover:bg-opacity-90 disabled:opacity-50 transition-all"
            >
              {isPending ? "Enviando..." : "Enviar"}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-[#C9D3C2] text-[#2A2A2A] px-6 py-2 rounded-xl font-semibold hover:bg-opacity-80 transition-all"
            >
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
