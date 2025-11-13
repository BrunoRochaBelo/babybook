import { useGuestbookEntries } from "@/hooks/api";
import { CheckCircle, ShieldAlert } from "lucide-react";

interface GuestbookListProps {
  childId: string;
  status: "approved" | "pending";
}

export const GuestbookList = ({ childId, status }: GuestbookListProps) => {
  const { data: entries = [] } = useGuestbookEntries(childId);

  const filtered = entries.filter((entry) => entry.status === status);

  if (filtered.length === 0) {
    return (
      <div className="text-center py-12 bg-white rounded-2xl border border-[#C9D3C2]">
        <p className="text-[#C9D3C2]">
          {status === "approved"
            ? "Nenhuma mensagem aprovada ainda. Que tal convidar os avós para deixarem um recado?"
            : "Nenhuma mensagem pendente"}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {filtered.map((entry) => (
        <div
          key={entry.id}
          className="bg-white rounded-2xl p-6 border border-[#C9D3C2]"
        >
          <div className="flex justify-between items-start mb-3">
            <div>
              <h4 className="font-semibold text-[#2A2A2A]">
                {entry.authorName}
              </h4>
              <p className="text-xs text-[#C9D3C2]">
                {new Date(entry.createdAt).toLocaleDateString("pt-BR")}
              </p>
            </div>
            {status === "pending" ? (
              <div className="flex items-center gap-2 bg-amber-100 text-amber-700 px-3 py-1 rounded-lg text-xs font-semibold">
                <ShieldAlert className="w-4 h-4" />
                Pendente de revis�o
              </div>
            ) : (
              <div className="flex items-center gap-2 bg-green-100 text-green-700 px-3 py-1 rounded-lg text-xs font-semibold">
                <CheckCircle className="w-4 h-4" />
                Publicada
              </div>
            )}
          </div>
          <p className="text-[#2A2A2A] mb-3">{entry.message}</p>
        </div>
      ))}
    </div>
  );
};
