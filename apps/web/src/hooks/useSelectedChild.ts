import { useEffect, useMemo } from "react";
import { useChildren } from "@/hooks/api";
import { useAppStore } from "@/store/app";
import { mockChildren } from "@/mocks/data";

const getMockFlag = () =>
  (
    import.meta.env.VITE_ENABLE_MSW ??
    (import.meta.env.DEV || import.meta.env.MODE === "test" ? "true" : "false")
  )
    .toString()
    .toLowerCase() !== "false";

export const useSelectedChild = () => {
  const { data: children = [], isLoading } = useChildren();
  const selectedChildId = useAppStore((state) => state.selectedChildId);
  const setSelectedChildId = useAppStore((state) => state.setSelectedChildId);
  const clearSelectedChild = useAppStore((state) => state.clearSelectedChild);
  const shouldUseMocks = getMockFlag();

  const effectiveChildren = useMemo(() => {
    if (!isLoading && shouldUseMocks && children.length === 0) {
      return mockChildren;
    }
    return children;
  }, [children, isLoading, shouldUseMocks]);

  useEffect(() => {
    if (isLoading) {
      return;
    }

    if (effectiveChildren.length === 0) {
      if (selectedChildId) {
        clearSelectedChild();
      }
      return;
    }

    const hasSelectedChild = effectiveChildren.some(
      (child) => child.id === selectedChildId,
    );

    if (!hasSelectedChild) {
      setSelectedChildId(effectiveChildren[0].id);
    }
  }, [
    effectiveChildren,
    clearSelectedChild,
    isLoading,
    selectedChildId,
    setSelectedChildId,
  ]);

  const selectedChild = useMemo(
    () =>
      effectiveChildren.find((child) => child.id === selectedChildId) ?? null,
    [effectiveChildren, selectedChildId],
  );

  return {
    children: effectiveChildren,
    selectedChild,
    isLoading,
    setSelectedChildId,
  };
};
