import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronDown, UserRound } from "lucide-react";
import { Link } from "react-router-dom";
import { useSelectedChild } from "@/hooks/useSelectedChild";
import { cn } from "@/lib/utils";

interface BBChildSwitcherProps {
  isOpen?: boolean;
  onOpenChange?: (value: boolean) => void;
}

export function BBChildSwitcher({
  isOpen: externalOpen,
  onOpenChange,
}: BBChildSwitcherProps = {}) {
  const { children, selectedChild, setSelectedChildId } = useSelectedChild();
  const [internalOpen, setInternalOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const isControlled = externalOpen !== undefined;
  const isOpen = isControlled ? externalOpen : internalOpen;
  const setOpen = useCallback(
    (value: boolean | ((prev: boolean) => boolean)) => {
      if (isControlled) {
        const current = Boolean(externalOpen);
        const next = typeof value === "function" ? value(current) : value;
        onOpenChange?.(next);
        return;
      }

      setInternalOpen((prev) => {
        const next = typeof value === "function" ? value(prev) : value;
        onOpenChange?.(next);
        return next;
      });
    },
    [externalOpen, isControlled, onOpenChange],
  );

  useEffect(() => {
    if (!isOpen) {
      return;
    }
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        event.target instanceof Node &&
        !containerRef.current.contains(event.target)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener("pointerdown", handleClickOutside);
    return () =>
      document.removeEventListener("pointerdown", handleClickOutside);
  }, [isOpen, setOpen]);

  const hasChildren = children.length > 0;

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={() => hasChildren && setOpen((state) => !state)}
        className={cn(
          "inline-flex items-center gap-2 rounded-2xl border border-border bg-surface px-4 py-2 text-sm font-medium transition hover:border-ink/40",
          !hasChildren && "cursor-not-allowed opacity-70",
        )}
      >
        <span className="font-semibold text-ink">
          {selectedChild ? selectedChild.name : "Cadastre uma criança"}
        </span>
        <ChevronDown
          className={cn(
            "h-4 w-4 text-ink-muted transition",
            isOpen && "rotate-180",
          )}
        />
      </button>

      {isOpen && (
        <div className="absolute right-0 z-30 mt-3 w-80 rounded-[28px] border border-border bg-surface p-4 shadow-2xl">
          <p className="text-xs uppercase tracking-[0.3em] text-ink-muted">
            Escolher álbum
          </p>
          <div className="mt-3 space-y-2">
            {children.map((child) => (
              <button
                key={child.id}
                type="button"
                onClick={() => {
                  setSelectedChildId(child.id);
                  setOpen(false);
                }}
                className={cn(
                  "w-full rounded-2xl border px-3 py-2 text-left text-sm transition",
                  selectedChild?.id === child.id
                    ? "border-ink text-ink"
                    : "border-border text-ink-muted hover:border-ink/40 hover:text-ink",
                )}
              >
                {child.name}
              </button>
            ))}
            {children.length === 0 && (
              <p className="rounded-2xl border border-dashed border-border px-3 py-4 text-sm text-ink-muted">
                Cadastre sua primeira criança para desbloquear a jornada guiada.
              </p>
            )}
          </div>
          <div className="mt-4 space-y-2">
            <Link
              to="/jornada/perfil-crianca"
              className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-ink/30 px-3 py-2 text-sm font-medium text-ink transition hover:border-ink hover:text-accent"
              onClick={() => setOpen(false)}
            >
              <UserRound className="h-4 w-4" />
              Ver perfil da criança
            </Link>
            <Link
              to="/perfil-usuario"
              className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-border px-3 py-2 text-sm font-medium text-ink transition hover:border-ink hover:text-accent"
              onClick={() => setOpen(false)}
            >
              <UserRound className="h-4 w-4" />
              Gerenciar conta
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
