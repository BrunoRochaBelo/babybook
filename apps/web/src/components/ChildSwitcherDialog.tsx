import { Heart, Plus, Check } from "lucide-react";
import { motion } from "motion/react";

interface Child {
  id: string;
  name: string;
  age: string;
  momentCount: number;
  isActive: boolean;
}

interface ChildSwitcherDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentChild: Child;
  children: Child[];
  onSelectChild: (childId: string) => void;
  onAddChild: () => void;
}

export function ChildSwitcherDialog({
  open,
  onOpenChange,
  children,
  onSelectChild,
  onAddChild,
}: ChildSwitcherDialogProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-40 flex items-center justify-center p-4">
      <div className="bg-card rounded-3xl max-w-md w-full">
        <div className="p-6 border-b border-border">
          <h2 className="text-2xl font-semibold mb-1">Trocar de Filho</h2>
          <p className="text-sm text-muted-foreground">
            Selecione qual filho você deseja visualizar
          </p>
        </div>

        <div className="space-y-3 p-6">
          {children.map((child, index) => (
            <motion.div
              key={child.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
            >
              <button
                className={`w-full p-4 rounded-2xl border-2 transition-all duration-200 flex items-center gap-3 ${
                  child.isActive
                    ? "border-primary/50 bg-primary/5 shadow-md"
                    : "border-border hover:border-primary/30 hover:shadow-md active:scale-[0.98]"
                }`}
                onClick={() => {
                  onSelectChild(child.id);
                  onOpenChange(false);
                }}
              >
                <div
                  className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 ${
                    child.isActive ? "bg-primary/20" : "bg-muted"
                  }`}
                >
                  <Heart
                    className={`w-6 h-6 ${
                      child.isActive
                        ? "text-primary fill-current"
                        : "text-muted-foreground"
                    }`}
                  />
                </div>

                <div className="flex-1 text-left">
                  <p className="font-medium">{child.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {child.age} • {child.momentCount} momentos
                  </p>
                </div>

                {child.isActive && (
                  <Check className="w-5 h-5 text-primary flex-shrink-0" />
                )}
              </button>
            </motion.div>
          ))}

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: children.length * 0.05 }}
          >
            <button
              className="w-full h-14 rounded-2xl border-2 border-dashed border-border hover:border-primary hover:bg-primary/5 flex items-center justify-center gap-2 text-foreground font-medium"
              onClick={() => {
                onAddChild();
                onOpenChange(false);
              }}
            >
              <Plus className="w-5 h-5" />
              Adicionar Outro Filho
            </button>
          </motion.div>
        </div>

        <div className="border-t border-border p-4">
          <button
            className="w-full py-2 text-sm text-muted-foreground hover:text-foreground"
            onClick={() => onOpenChange(false)}
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
}
