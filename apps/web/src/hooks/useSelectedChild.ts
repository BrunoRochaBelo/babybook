import { useEffect, useMemo } from "react";
import { useChildren } from "@/hooks/api";
import { useAppStore } from "@/store/app";

export const useSelectedChild = () => {
  const { data: children = [], isLoading } = useChildren();
  const selectedChildId = useAppStore((state) => state.selectedChildId);
  const setSelectedChildId = useAppStore((state) => state.setSelectedChildId);
  const clearSelectedChild = useAppStore((state) => state.clearSelectedChild);

  useEffect(() => {
    if (isLoading) {
      return;
    }

    if (children.length === 0) {
      if (selectedChildId) {
        clearSelectedChild();
      }
      return;
    }

    const hasSelectedChild = children.some(
      (child) => child.id === selectedChildId,
    );

    if (!hasSelectedChild) {
      setSelectedChildId(children[0].id);
    }
  }, [
    children,
    clearSelectedChild,
    isLoading,
    selectedChildId,
    setSelectedChildId,
  ]);

  const selectedChild = useMemo(
    () => children.find((child) => child.id === selectedChildId) ?? null,
    [children, selectedChildId],
  );

  return {
    children,
    selectedChild,
    isLoading,
    setSelectedChildId,
  };
};
