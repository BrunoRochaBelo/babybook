import { useEffect, useRef, useState } from "react";
import { ChevronDown, UserRound } from "lucide-react";
import { Link } from "react-router-dom";
import { useSelectedChild } from "@/hooks/useSelectedChild";
import { cn } from "@/lib/utils";

export function BBChildSwitcher() {
  const { children, selectedChild, setSelectedChildId } = useSelectedChild();
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

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
        setIsOpen(false);
      }
    };
    document.addEventListener("pointerdown", handleClickOutside);
    return () => document.removeEventListener("pointerdown", handleClickOutside);
  }, [isOpen]);

  const hasChildren = children.length > 0;

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={() => hasChildren && setIsOpen((state) => !state)}
        className={cn(
          "flex items-center gap-3 rounded-[32px] border border-border bg-surface px-4 py-2 text-left shadow-sm transition hover:border-ink/40",
          !hasChildren && "cursor-not-allowed opacity-70",
        )}
      >
        <div className="flex flex-col">
          <p className="text-xs uppercase tracking-[0.3em] text-ink-muted">
            Criança
          </p>
          <p className="font-serif text-lg text-ink">
            {selectedChild ? selectedChild.name : "Cadastre uma criança"}
          </p>
        </div>
        <ChevronDown
          className={cn(
            "h-4 w-4 text-ink-muted transition",
            isOpen && "rotate-180",
          )}
        />
      </button>

      {isOpen && (
        <div className="absolute right-0 z-30 mt-3 w-80 rounded-[32px] border border-border bg-surface p-4 shadow-2xl">
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
                  setIsOpen(false);
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
          <Link
            to="/jornada/perfil-crianca"
            className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-ink/30 px-3 py-2 text-sm font-medium text-ink transition hover:border-ink hover:text-accent"
            onClick={() => setIsOpen(false)}
          >
            <UserRound className="h-4 w-4" />
            Ver perfil da criança
          </Link>
        </div>
      )}
    </div>
  );
}
