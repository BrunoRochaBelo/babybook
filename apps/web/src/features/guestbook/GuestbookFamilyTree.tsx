import { useMemo, useState, type KeyboardEventHandler } from "react";
import { GuestbookEntry } from "@babybook/contracts";
import { Maximize2 } from "lucide-react";
import {
  formatRelationshipDegree,
  relationshipDegreeOptions,
} from "@/features/guestbook/relationshipDegree";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { GuestbookFamilyTreeGraph } from "./GuestbookFamilyTreeGraph";

type Variant = "hud" | "full";

export function GuestbookFamilyTree(props: {
  childName: string;
  entries: GuestbookEntry[];
  variant?: Variant;
  /** Quando true e variant="hud", permite abrir a árvore em tela cheia (default: true). */
  expandable?: boolean;
}) {
  const variant = props.variant ?? "hud";
  const expandable = props.expandable ?? true;
  const [isOpen, setIsOpen] = useState(false);

  const approved = useMemo(
    () => props.entries.filter((e) => e.status === "approved"),
    [props.entries],
  );

  const grouped = useMemo(() => {
    const map = new Map<
      GuestbookEntry["relationshipDegree"],
      GuestbookEntry[]
    >();
    for (const entry of approved) {
      const list = map.get(entry.relationshipDegree) ?? [];
      list.push(entry);
      map.set(entry.relationshipDegree, list);
    }
    return map;
  }, [approved]);

  const graphNodes = useMemo(() => {
    return relationshipDegreeOptions
      .map((opt) => {
        const count = (grouped.get(opt.value) ?? []).length;
        return {
          key: opt.value,
          label: formatRelationshipDegree(opt.value),
          count,
        };
      })
      .filter((n) => n.count > 0);
  }, [grouped]);

  const totalPeople = useMemo(() => {
    const seen = new Set<string>();
    for (const entry of approved) {
      const key = `${entry.authorName.trim().toLowerCase()}|${(entry.authorEmail ?? "").trim().toLowerCase()}`;
      seen.add(key);
    }
    return seen.size;
  }, [approved]);

  const canExpand = variant === "hud" && expandable;

  const openFullScreen = () => {
    if (!canExpand) return;
    setIsOpen(true);
  };

  const onRootKeyDown: KeyboardEventHandler<HTMLDivElement> = (event) => {
    if (!canExpand) return;
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      openFullScreen();
    }
  };

  const renderGroups = (opts: { showNames: boolean; maxNames: number }) => (
    <div className="flex flex-wrap gap-2">
      {relationshipDegreeOptions
        .filter((opt) => grouped.has(opt.value))
        .map((opt) => {
          const items = grouped.get(opt.value) ?? [];
          const uniqueNames = Array.from(
            new Set(items.map((it) => it.authorName.trim()).filter(Boolean)),
          );
          const count = uniqueNames.length;

          return (
            <div
              key={opt.value}
              className="rounded-2xl border px-3 py-2"
              style={{
                borderColor: "var(--bb-color-border)",
                backgroundColor: "var(--bb-color-bg)",
              }}
            >
              <div className="flex items-center justify-between gap-3">
                <div
                  className="text-sm font-semibold"
                  style={{ color: "var(--bb-color-ink)" }}
                >
                  {formatRelationshipDegree(opt.value)}
                </div>
                <div
                  className="min-w-[28px] text-center text-xs font-bold rounded-full px-2 py-0.5"
                  style={{
                    backgroundColor: "var(--bb-color-accent)",
                    color: "var(--bb-color-surface)",
                  }}
                >
                  {count}
                </div>
              </div>

              {opts.showNames && (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {uniqueNames.slice(0, opts.maxNames).map((name) => (
                    <span
                      key={name}
                      className="text-xs rounded-full px-2 py-1"
                      style={{
                        backgroundColor: "var(--bb-color-surface)",
                        border: "1px solid var(--bb-color-border)",
                        color: "var(--bb-color-ink-muted)",
                      }}
                    >
                      {name}
                    </span>
                  ))}
                  {uniqueNames.length > opts.maxNames && (
                    <span
                      className="text-xs rounded-full px-2 py-1"
                      style={{
                        backgroundColor: "var(--bb-color-surface)",
                        border: "1px dashed var(--bb-color-border)",
                        color: "var(--bb-color-ink-muted)",
                      }}
                    >
                      +{uniqueNames.length - opts.maxNames}
                    </span>
                  )}
                </div>
              )}
            </div>
          );
        })}
    </div>
  );

  if (approved.length === 0) {
    return (
      <div
        className="rounded-2xl border p-5"
        style={{
          backgroundColor: "var(--bb-color-surface)",
          borderColor: "var(--bb-color-border)",
        }}
      >
        <p className="text-sm" style={{ color: "var(--bb-color-ink-muted)" }}>
          Quando você aprovar mensagens, a árvore afetiva aparece aqui com os
          parentescos.
        </p>
      </div>
    );
  }

  return (
    <>
      <div
        className={
          canExpand
            ? "rounded-2xl border p-5 cursor-pointer transition hover:opacity-95 active:scale-[0.995]"
            : "rounded-2xl border p-5"
        }
        style={{
          backgroundColor: "var(--bb-color-surface)",
          borderColor: "var(--bb-color-border)",
        }}
        onClick={canExpand ? openFullScreen : undefined}
        role={canExpand ? "button" : undefined}
        tabIndex={canExpand ? 0 : undefined}
        onKeyDown={onRootKeyDown}
        aria-label={canExpand ? "Ver árvore genealógica" : undefined}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <p
              className="text-xs uppercase tracking-[0.3em]"
              style={{ color: "var(--bb-color-ink-muted)" }}
            >
              Árvore genealógica
            </p>
            <h3
              className="mt-1 font-serif text-lg"
              style={{ color: "var(--bb-color-ink)" }}
            >
              Quem faz parte da história
            </h3>
            <p
              className="mt-1 text-sm"
              style={{ color: "var(--bb-color-ink-muted)" }}
            >
              {totalPeople} pessoa{totalPeople === 1 ? "" : "s"} já deixaram
              recados aprovados.
            </p>
          </div>

          <div className="shrink-0">
            <div
              className="rounded-2xl px-4 py-3 text-center"
              style={{
                backgroundColor: "var(--bb-color-accent-soft)",
                color: "var(--bb-color-accent)",
              }}
            >
              <div className="text-xs font-semibold uppercase tracking-wide">
                Criança
              </div>
              <div
                className="mt-1 font-semibold"
                style={{ color: "var(--bb-color-ink)" }}
              >
                {props.childName}
              </div>
            </div>
          </div>
        </div>

        <div className="mt-5">
          {renderGroups({ showNames: variant === "full", maxNames: 14 })}

          {variant === "hud" && (
            <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
              <p
                className="text-xs"
                style={{ color: "var(--bb-color-ink-muted)" }}
              >
                Dica: você pode ajustar o parentesco ao aprovar mensagens na aba
                “Pendentes”.
              </p>
            </div>
          )}

          {variant === "hud" && canExpand && (
            <div
              className="mt-3 flex items-center justify-center gap-2 text-xs font-semibold"
              style={{ color: "var(--bb-color-ink-muted)" }}
            >
              <Maximize2 className="h-3 w-3" />
              Toque para expandir
            </div>
          )}
        </div>
      </div>

      {canExpand && (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogContent
            className="w-[96vw] h-[92vh] sm:w-[92vw] sm:h-[86vh] max-w-5xl flex flex-col"
            style={{
              backgroundColor: "var(--bb-color-surface)",
              borderColor: "var(--bb-color-border)",
            }}
          >
            <DialogHeader className="flex-shrink-0">
              <DialogTitle style={{ color: "var(--bb-color-ink)" }}>
                Árvore genealógica
              </DialogTitle>
              <DialogDescription style={{ color: "var(--bb-color-ink-muted)" }}>
                {props.childName} • {totalPeople} pessoa
                {totalPeople === 1 ? "" : "s"} • {approved.length} recado
                {approved.length === 1 ? "" : "s"} aprovado
                {approved.length === 1 ? "" : "s"}
              </DialogDescription>
            </DialogHeader>

            <div className="flex-1 min-h-0 overflow-y-auto">
              <div
                className="rounded-2xl border p-5"
                style={{
                  backgroundColor: "var(--bb-color-surface)",
                  borderColor: "var(--bb-color-border)",
                }}
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p
                      className="text-xs uppercase tracking-[0.3em]"
                      style={{ color: "var(--bb-color-ink-muted)" }}
                    >
                      Baseado no Livro de Visitas
                    </p>
                    <h3
                      className="mt-1 font-serif text-lg"
                      style={{ color: "var(--bb-color-ink)" }}
                    >
                      Mapa completo de parentescos
                    </h3>
                    <p
                      className="mt-1 text-sm"
                      style={{ color: "var(--bb-color-ink-muted)" }}
                    >
                      Mostrando apenas mensagens aprovadas.
                    </p>
                  </div>

                  <div className="shrink-0">
                    <div
                      className="rounded-2xl px-4 py-3 text-center"
                      style={{
                        backgroundColor: "var(--bb-color-accent-soft)",
                        color: "var(--bb-color-accent)",
                      }}
                    >
                      <div className="text-xs font-semibold uppercase tracking-wide">
                        Criança
                      </div>
                      <div
                        className="mt-1 font-semibold"
                        style={{ color: "var(--bb-color-ink)" }}
                      >
                        {props.childName}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-4">
                  <GuestbookFamilyTreeGraph
                    childName={props.childName}
                    nodes={graphNodes}
                  />
                </div>

                <div className="mt-5">
                  {renderGroups({ showNames: true, maxNames: 28 })}
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}
