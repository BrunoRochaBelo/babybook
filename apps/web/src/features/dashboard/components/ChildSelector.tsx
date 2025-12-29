import type { Child } from "@babybook/contracts";

interface ChildSelectorProps {
  children: Child[];
  selectedChildId: string | undefined;
  onChildChange: (childId: string) => void;
}

export const ChildSelector = ({
  children,
  selectedChildId,
  onChildChange,
}: ChildSelectorProps) => {
  const hasChildren = children.length > 0;

  return (
    <div className="mb-6">
      <select
        value={hasChildren ? selectedChildId || "" : ""}
        onChange={(e) => onChildChange(e.target.value)}
        className="w-full px-4 py-2 border-2 rounded-2xl disabled:opacity-60"
        style={{
          backgroundColor: "var(--bb-color-surface)",
          borderColor: "var(--bb-color-border)",
          color: "var(--bb-color-ink)",
        }}
        disabled={!hasChildren}
      >
        {hasChildren ? (
          children.map((child) => (
            <option key={child.id} value={child.id}>
              {child.name}
            </option>
          ))
        ) : (
          <option value="">Nenhuma criança cadastrada</option>
        )}
      </select>
    </div>
  );
};
