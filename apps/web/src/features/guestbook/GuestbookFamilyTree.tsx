import { useMemo, useState, type KeyboardEventHandler } from "react";
import { GuestbookEntry } from "@babybook/contracts";
import { Maximize2, Heart, X, History } from "lucide-react";
import { useTranslation } from "@babybook/i18n";
import { useRelationshipDegrees } from "@/features/guestbook/relationshipDegree";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { GuestbookFamilyTreeGraph } from "./GuestbookFamilyTreeGraph";
import { AnimatePresence, motion } from "framer-motion";

type Variant = "hud" | "full";

interface GuestbookFamilyTreeProps {
  childName: string;
  entries: GuestbookEntry[];
  variant?: Variant;
  expandable?: boolean;
}

export function GuestbookFamilyTree({
  childName,
  entries,
  variant = "hud",
  expandable = true,
}: GuestbookFamilyTreeProps) {
  const { t } = useTranslation();
  const { formatRelationshipDegree } = useRelationshipDegrees();
  const [isOpen, setIsOpen] = useState(false);

  const approved = useMemo(
    () => entries.filter((e) => e.status === "approved"),
    [entries],
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
      {Array.from(grouped.entries()).map(([rel, items]) => {
        const uniqueNames = Array.from(
          new Set(items.map((it) => it.authorName.trim()).filter(Boolean)),
        );
        const count = uniqueNames.length;

        return (
          <div
            key={rel}
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
                {formatRelationshipDegree(rel)}
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
        className="rounded-3xl p-8 text-center border-2 border-dashed"
        style={{
          backgroundColor: "var(--bb-color-surface)",
          borderColor: "var(--bb-color-border)",
        }}
      >
        <p className="text-sm" style={{ color: "var(--bb-color-ink-muted)" }}>
          {t("b2c.guestbook.tree.empty")}
        </p>
      </div>
    );
  }

  return (
    <>
      <div
        className={
          canExpand
            ? "rounded-3xl p-6 shadow-sm border border-orange-50/50 cursor-pointer transition hover:opacity-95 active:scale-[0.995]"
            : "rounded-3xl p-6 shadow-sm border border-orange-50/50"
        }
        style={{ backgroundColor: "var(--bb-color-surface)" }}
        onClick={canExpand ? openFullScreen : undefined}
        role={canExpand ? "button" : undefined}
        tabIndex={canExpand ? 0 : undefined}
        onKeyDown={onRootKeyDown}
        aria-label={canExpand ? t("b2c.guestbook.tree.hud.ariaExpand") : undefined}
      >
        <div className="flex items-center justify-between mb-6">
          <div>
            <p
              className="text-xs uppercase tracking-[0.3em]"
              style={{ color: "var(--bb-color-ink-muted)" }}
            >
              {t("b2c.guestbook.tree.hud.label")}
            </p>
            <h3
              className="text-xl font-serif font-bold mt-1"
              style={{ color: "var(--bb-color-ink)" }}
            >
              {t("b2c.guestbook.tree.hud.title")}
            </h3>
          </div>
          {canExpand && (
            <button
              type="button"
              className="p-2 rounded-xl hover:bg-orange-50/50 transition-colors"
              style={{ color: "var(--bb-color-accent)" }}
            >
              <Maximize2 className="w-5 h-5" />
            </button>
          )}
        </div>

        <div className="space-y-4">
          <div className="flex items-center gap-3 p-3 rounded-2xl bg-orange-50/30">
            <Heart
              className="w-5 h-5 fill-[var(--bb-color-accent)]"
              style={{ color: "var(--bb-color-accent)" }}
            />
            <span
              className="text-sm font-medium"
              style={{ color: "var(--bb-color-ink)" }}
            >
              {t(totalPeople === 1 ? "b2c.guestbook.tree.hud.peopleCount_one" : "b2c.guestbook.tree.hud.peopleCount_other", {
                count: totalPeople,
              })}
            </span>
          </div>

          <p
            className="text-xs"
            style={{ color: "var(--bb-color-ink-muted)" }}
          >
            {t("b2c.guestbook.tree.hud.hint")}
          </p>

          {canExpand && (
            <div
              className="w-full flex items-center justify-center gap-2 text-xs font-semibold py-2 rounded-xl border border-orange-100 hover:bg-orange-50/30 transition-colors"
              style={{ color: "var(--bb-color-ink-muted)" }}
            >
              <Maximize2 className="h-3 w-3" />
              {t("b2c.guestbook.tree.hud.expand")}
            </div>
          )}
        </div>
      </div>

      <Dialog
        open={isOpen}
        onOpenChange={setIsOpen}
      >
        <DialogContent
          className="w-[96vw] h-[92vh] sm:w-[92vw] sm:h-[86vh] max-w-5xl flex flex-col p-0 border-none rounded-[2.5rem] overflow-hidden"
          style={{
            backgroundColor: "#faf9f6",
          }}
        >
          <div className="p-8 pb-4 flex items-center justify-between border-b border-stone-100">
            <div>
              <DialogHeader>
                <DialogTitle className="text-2xl font-serif font-bold text-stone-900">
                  {t("b2c.guestbook.tree.full.title")}
                </DialogTitle>
                <DialogDescription className="text-sm text-stone-500 mt-1">
                  {t(
                    totalPeople === 1
                      ? "b2c.guestbook.tree.full.description"
                      : "b2c.guestbook.tree.full.description_plural",
                    {
                      childName: childName || t("b2c.guestbook.tree.common.child"),
                      peopleCount: totalPeople,
                      entryCount: approved.length,
                    },
                  )}
                </DialogDescription>
              </DialogHeader>
            </div>
          </div>

          <div className="flex-1 min-h-0 overflow-y-auto p-8 custom-scrollbar">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {/* Child Node */}
              <div className="col-span-full flex justify-center mb-8">
                <div className="relative group">
                  <div className="absolute -inset-4 bg-orange-100/50 rounded-full blur-xl group-hover:bg-orange-200/50 transition-colors" />
                  <div className="relative w-24 h-24 rounded-full bg-gradient-to-br from-orange-400 to-rose-500 p-1 shadow-lg">
                    <div className="w-full h-full rounded-full border-2 border-white/30 flex items-center justify-center bg-white/10 backdrop-blur-sm text-white font-serif text-2xl font-bold">
                      {childName?.charAt(0) || "?"}
                    </div>
                  </div>
                  <p className="absolute -bottom-8 left-1/2 -translate-x-1/2 whitespace-nowrap text-sm font-bold text-stone-900">
                    {childName || t("b2c.guestbook.tree.common.child")}
                  </p>
                </div>
              </div>

              {/* Relationship Groups */}
              {Array.from(grouped.entries()).map(([rel, groupEntries]) => (
                <div
                  key={rel}
                  className="group p-6 rounded-3xl bg-white border border-stone-100 hover:border-orange-200 hover:shadow-md transition-all"
                >
                  <div className="flex items-center gap-2 mb-4">
                    <div className="p-2 rounded-xl bg-orange-50 text-orange-500 font-bold text-xs uppercase tracking-wider">
                      {formatRelationshipDegree(rel)}
                    </div>
                    <div className="h-px flex-1 bg-stone-100" />
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {Array.from(new Set(groupEntries.map(e => e.authorName))).map((name) => (
                      <div
                        key={name}
                        className="px-3 py-1.5 rounded-full bg-stone-50 border border-stone-100 text-sm text-stone-600 font-medium hover:bg-orange-50 hover:border-orange-100 hover:text-orange-700 transition-colors"
                      >
                        {name}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="p-6 bg-stone-50 bg-opacity-50 border-t border-stone-100 flex items-center justify-between text-xs text-stone-400 px-8">
            <div className="flex items-center gap-2">
              <History className="w-3.5 h-3.5" />
              <span>{t("b2c.guestbook.tree.full.source")}</span>
            </div>
            <div className="font-medium uppercase tracking-widest bg-stone-100 px-2 py-0.5 rounded">
              {t("b2c.guestbook.tree.full.footnote")}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
