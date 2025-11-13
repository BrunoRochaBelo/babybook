import { useState } from "react";
import { useCreateGuestbookEntry } from "@/hooks/api";
import { X } from "lucide-react";

interface GuestbookFormProps {
  childId: string;
  onClose: () => void;
}

export const GuestbookForm = ({ childId, onClose }: GuestbookFormProps) => {
  const [authorName, setAuthorName] = useState("");
  const [authorEmail, setAuthorEmail] = useState("");
  const [message, setMessage] = useState("");
  const { mutate: createEntry, isPending } = useCreateGuestbookEntry();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-bold text-[#2A2A2A]">
            Deixe uma Mensagem
          </h3>
          <button
            onClick={onClose}
            className="p-1 hover:bg-[#F7F3EF] rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-[#2A2A2A]" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-[#2A2A2A] mb-2">
              Seu Nome
            </label>
            <input
              type="text"
              value={authorName}
              onChange={(e) => setAuthorName(e.target.value)}
              className="w-full px-3 py-2 border border-[#C9D3C2] rounded-xl"
              placeholder="Como você se chama?"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-[#2A2A2A] mb-2">
              Seu E-mail (opcional)
            </label>
            <input
              type="email"
              value={authorEmail}
              onChange={(e) => setAuthorEmail(e.target.value)}
              className="w-full px-3 py-2 border border-[#C9D3C2] rounded-xl"
              placeholder="voce@email.com"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-[#2A2A2A] mb-2">
              Sua Mensagem
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="w-full px-3 py-2 border border-[#C9D3C2] rounded-xl"
              rows={5}
              placeholder="Escreva uma mensagem especial..."
              required
            />
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
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
