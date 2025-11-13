import { useEffect, useRef, useState } from "react";
import { ChevronDown, Users } from "lucide-react";
import { useSelectedChild } from "@/hooks/useSelectedChild";
import { useAppStore } from "@/store/app";

export const ChildSwitcher = () => {
  const { children = [], selectedChild, isLoading } = useSelectedChild();
  const setSelectedChildId = useAppStore((state) => state.setSelectedChildId);
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (childId: string) => {
    setSelectedChildId(childId);
    setOpen(false);
  };

  if (isLoading) {
    return (
      <div className="h-10 w-44 rounded-2xl border border-[#C9D3C2] bg-[#F7F3EF] animate-pulse" />
    );
  }

  const hasChildren = children.length > 0;

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        disabled={!hasChildren}
        onClick={() => setOpen((prev) => !prev)}
        className="flex items-center gap-2 rounded-2xl border border-[#C9D3C2] px-3 py-2 text-left shadow-sm transition-colors hover:border-[#F2995D] disabled:cursor-not-allowed disabled:opacity-60"
      >
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#F7F3EF] text-[#F2995D]">
          <Users className="h-4 w-4" />
        </div>
        <div className="flex flex-col">
          <span className="text-xs text-[#C9D3C2]">
            {hasChildren ? "Criança selecionada" : "Nenhuma criança"}
          </span>
          <span className="text-sm font-semibold text-[#2A2A2A]">
            {selectedChild?.name ?? (hasChildren ? "Selecionar" : "Adicionar")}
          </span>
        </div>
        <ChevronDown className="h-4 w-4 text-[#2A2A2A]" />
      </button>

      {open && hasChildren && (
        <div className="absolute left-0 right-0 top-12 z-20 rounded-2xl border border-[#C9D3C2] bg-white shadow-lg">
          <div className="p-2">
            {children.map((child) => {
              const active = child.id === selectedChild?.id;
              return (
                <button
                  key={child.id}
                  onClick={() => handleSelect(child.id)}
                  className={`flex w-full flex-col rounded-xl px-3 py-2 text-left transition-colors ${
                    active
                      ? "bg-[#F2995D]/10 text-[#F2995D]"
                      : "text-[#2A2A2A] hover:bg-[#F7F3EF]"
                  }`}
                >
                  <span className="text-sm font-semibold">{child.name}</span>
                  {child.birthday && (
                    <span className="text-xs text-[#C9D3C2]">
                      Nasc.:{" "}
                      {new Date(child.birthday).toLocaleDateString("pt-BR")}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
