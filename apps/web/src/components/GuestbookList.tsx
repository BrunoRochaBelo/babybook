import { Fragment, useEffect, useMemo, useState } from "react";
import { AnimatePresence, LayoutGroup, motion } from "motion/react";
import {
  useApproveGuestbookEntry,
  useGuestbookEntries,
  useRejectGuestbookEntry,
} from "@/hooks/api";
import {
  CheckCircle,
  CheckCircle2,
  Image as ImageIcon,
  ShieldAlert,
  X,
  XCircle,
} from "lucide-react";
import { GuestbookEntry } from "@babybook/contracts";
import {
  formatRelationshipDegree,
  relationshipDegreeOptions,
} from "@/features/guestbook/relationshipDegree";

interface GuestbookListProps {
  childId: string;
  status: "approved" | "pending";
}

export const GuestbookList = ({ childId, status }: GuestbookListProps) => {
  const { data: entries = [] } = useGuestbookEntries(childId);
  const { mutate: approveEntry, isPending: isApproving } =
    useApproveGuestbookEntry();
  const { mutate: rejectEntry, isPending: isRejecting } =
    useRejectGuestbookEntry();

  const [relationshipEdits, setRelationshipEdits] = useState<
    Record<string, GuestbookEntry["relationshipDegree"]>
  >({});
  const [selectedEntry, setSelectedEntry] = useState<GuestbookEntry | null>(
    null,
  );

  useEffect(() => {
    if (!selectedEntry) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setSelectedEntry(null);
      }
    };

    document.addEventListener("keydown", onKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [selectedEntry]);

  const isModerating = isApproving || isRejecting;

  const filtered = entries.filter((entry) => entry.status === status);

  const sorted = useMemo(() => {
    return [...filtered].sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
  }, [filtered]);

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
            ? "Nenhuma mensagem aprovada ainda."
            : "Nenhuma mensagem pendente"}
        </p>
      </div>
    );
  }

  return (
    <LayoutGroup id={`guestbook-${childId}-${status}`}>
      <div className="space-y-4">
        {sorted.map((entry) => (
          <Fragment key={entry.id}>
            {status === "approved" ? (
              <motion.button
                type="button"
                layoutId={`gb-entry-${entry.id}`}
                onClick={() => setSelectedEntry(entry)}
                className="bb-pressable w-full text-left rounded-2xl p-6 border transition hover:shadow-sm active:scale-[0.99]"
                style={{
                  backgroundColor: "var(--bb-color-surface)",
                  borderColor: "var(--bb-color-border)",
                }}
                aria-label={`Abrir mensagem de ${entry.authorName}`}
                transition={{ type: "spring", stiffness: 520, damping: 46 }}
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
                      {formatRelationshipDegree(entry.relationshipDegree)} •{" "}
                      {new Date(entry.createdAt).toLocaleDateString("pt-BR")}
                    </p>
                  </div>
                  <div
                    className="flex items-center gap-2 px-3 py-1 rounded-lg text-xs font-semibold"
                    style={{
                      backgroundColor: "var(--bb-color-success)",
                      color: "var(--bb-color-surface)",
                      opacity: 0.9,
                    }}
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    Publicada
                  </div>
                </div>

                <p className="mb-3" style={{ color: "var(--bb-color-ink)" }}>
                  {entry.message}
                </p>

                {entry.assetId && (
                  <motion.div
                    layoutId={`gb-entry-media-${entry.id}`}
                    className="mt-4 rounded-xl border p-3"
                    style={{
                      borderColor: "var(--bb-color-border)",
                      backgroundColor: "var(--bb-color-bg)",
                    }}
                  >
                    <div
                      className="flex items-center gap-2 text-xs font-semibold"
                      style={{ color: "var(--bb-color-ink-muted)" }}
                    >
                      <ImageIcon className="h-4 w-4" />
                      Anexo enviado
                    </div>
                  </motion.div>
                )}
              </motion.button>
            ) : (
              <div
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
                      {formatRelationshipDegree(entry.relationshipDegree)} •{" "}
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
                      <CheckCircle2 className="w-4 h-4" />
                      Publicada
                    </div>
                  )}
                </div>
                <p className="mb-3" style={{ color: "var(--bb-color-ink)" }}>
                  {entry.message}
                </p>

                {entry.assetId && (
                  <p
                    className="text-xs mb-3"
                    style={{ color: "var(--bb-color-ink-muted)" }}
                  >
                    Anexo enviado
                  </p>
                )}

                {status === "pending" && (
                  <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_auto_auto] sm:items-end">
                    <div>
                      <label
                        className="block text-xs font-semibold mb-1"
                        htmlFor={`guestbook-relationship-${entry.id}`}
                        style={{ color: "var(--bb-color-ink-muted)" }}
                      >
                        Grau de parentesco
                      </label>
                      <select
                        id={`guestbook-relationship-${entry.id}`}
                        value={
                          relationshipEdits[entry.id] ??
                          entry.relationshipDegree
                        }
                        onChange={(event) =>
                          setRelationshipEdits((prev) => ({
                            ...prev,
                            [entry.id]: event.target
                              .value as GuestbookEntry["relationshipDegree"],
                          }))
                        }
                        className="w-full px-3 py-2 border rounded-xl text-sm"
                        style={{
                          backgroundColor: "var(--bb-color-surface)",
                          borderColor: "var(--bb-color-border)",
                          color: "var(--bb-color-ink)",
                        }}
                      >
                        {relationshipDegreeOptions.map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <button
                      type="button"
                      disabled={isModerating}
                      className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[var(--bb-color-success)] text-[var(--bb-color-surface)] px-4 py-2 text-sm font-bold shadow-sm transition hover:opacity-90 disabled:opacity-50"
                      onClick={() => {
                        const relationshipDegree =
                          relationshipEdits[entry.id] ??
                          entry.relationshipDegree;
                        approveEntry({ entryId: entry.id, relationshipDegree });
                      }}
                    >
                      <CheckCircle className="h-4 w-4" />
                      Aprovar
                    </button>

                    <button
                      type="button"
                      disabled={isModerating}
                      className="inline-flex items-center justify-center gap-2 rounded-2xl border px-4 py-2 text-sm font-bold transition hover:opacity-90 disabled:opacity-50"
                      style={{
                        borderColor: "rgba(239,68,68,0.35)",
                        color: "rgb(239,68,68)",
                      }}
                      onClick={() => rejectEntry({ entryId: entry.id })}
                    >
                      <XCircle className="h-4 w-4" />
                      Rejeitar
                    </button>
                  </div>
                )}
              </div>
            )}
          </Fragment>
        ))}

        <AnimatePresence initial={false}>
          {selectedEntry && (
            <motion.div
              className="fixed inset-0 z-50"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <motion.button
                type="button"
                className="absolute inset-0 w-full h-full"
                onClick={() => setSelectedEntry(null)}
                aria-label="Fechar mensagem"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                style={{ backgroundColor: "rgba(0,0,0,0.55)" }}
              />

              <div className="absolute inset-0 flex items-center justify-center p-4 sm:p-6">
                <motion.div
                  layoutId={`gb-entry-${selectedEntry.id}`}
                  className="w-full max-w-3xl max-h-[90vh] overflow-hidden rounded-2xl border"
                  style={{
                    backgroundColor: "var(--bb-color-surface)",
                    borderColor: "var(--bb-color-border)",
                  }}
                  transition={{ type: "spring", stiffness: 520, damping: 46 }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="p-5 sm:p-6">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div
                          className="text-base font-semibold"
                          style={{ color: "var(--bb-color-ink)" }}
                        >
                          {selectedEntry.authorName}
                        </div>
                        <div
                          className="mt-1 text-xs"
                          style={{ color: "var(--bb-color-ink-muted)" }}
                        >
                          {formatRelationshipDegree(
                            selectedEntry.relationshipDegree,
                          )}{" "}
                          •{" "}
                          {new Date(selectedEntry.createdAt).toLocaleDateString(
                            "pt-BR",
                          )}
                        </div>
                      </div>

                      <button
                        type="button"
                        className="rounded-xl p-2 transition hover:opacity-90"
                        onClick={() => setSelectedEntry(null)}
                        aria-label="Fechar"
                        style={{
                          backgroundColor: "var(--bb-color-bg)",
                          border: "1px solid var(--bb-color-border)",
                          color: "var(--bb-color-ink-muted)",
                        }}
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>

                    <div className="mt-4 max-h-[70vh] overflow-y-auto">
                      <p
                        className="text-base leading-relaxed whitespace-pre-wrap"
                        style={{ color: "var(--bb-color-ink)" }}
                      >
                        {selectedEntry.message}
                      </p>

                      {selectedEntry.assetId && (
                        <motion.div
                          layoutId={`gb-entry-media-${selectedEntry.id}`}
                          className="mt-4 rounded-xl border p-4"
                          style={{
                            borderColor: "var(--bb-color-border)",
                            color: "var(--bb-color-ink-muted)",
                            backgroundColor: "var(--bb-color-bg)",
                          }}
                        >
                          <div className="flex items-center gap-2 text-sm font-semibold">
                            <ImageIcon className="h-4 w-4" />
                            Anexo enviado (visualização em breve)
                          </div>
                        </motion.div>
                      )}
                    </div>
                  </div>
                </motion.div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </LayoutGroup>
  );
};
