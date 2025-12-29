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
      <div
        className="text-center py-12 rounded-2xl border"
        style={{
          backgroundColor: "var(--bb-color-surface)",
          borderColor: "var(--bb-color-border)",
        }}
      >
        <p style={{ color: "var(--bb-color-ink-muted)" }}>
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
          className="rounded-2xl p-6 border"
          style={{
            backgroundColor: "var(--bb-color-surface)",
            borderColor: "var(--bb-color-border)",
          }}
        >
          <div className="flex justify-between items-start mb-3">
            <div>
              <h4
                className="font-semibold"
                style={{ color: "var(--bb-color-ink)" }}
              >
                {entry.authorName}
              </h4>
              <p
                className="text-xs"
                style={{ color: "var(--bb-color-ink-muted)" }}
              >
                {new Date(entry.createdAt).toLocaleDateString("pt-BR")}
              </p>
            </div>
            {status === "pending" ? (
              <div
                className="flex items-center gap-2 px-3 py-1 rounded-lg text-xs font-semibold"
                style={{
                  backgroundColor: "var(--bb-color-accent-soft)",
                  color: "var(--bb-color-accent)",
                }}
              >
                <ShieldAlert className="w-4 h-4" />
                Pendente de revisão
              </div>
            ) : (
              <div
                className="flex items-center gap-2 px-3 py-1 rounded-lg text-xs font-semibold"
                style={{
                  backgroundColor: "var(--bb-color-success)",
                  color: "var(--bb-color-surface)",
                  opacity: 0.9,
                }}
              >
                <CheckCircle className="w-4 h-4" />
                Publicada
              </div>
            )}
          </div>
          <p className="mb-3" style={{ color: "var(--bb-color-ink)" }}>
            {entry.message}
          </p>
        </div>
      ))}
    </div>
  );
};
