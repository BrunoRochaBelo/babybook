import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "./ui/dialog";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { Badge } from "./ui/badge";
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
  currentChild,
  children,
  onSelectChild,
  onAddChild
}: ChildSwitcherDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md rounded-3xl">
        <DialogHeader>
          <DialogTitle className="text-2xl">Trocar de Filho</DialogTitle>
          <DialogDescription>
            Selecione qual filho você deseja visualizar
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-3 mt-4">
          {children.map((child, index) => (
            <motion.div
              key={child.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
            >
              <Card
                className={`p-4 cursor-pointer transition-all duration-200 ${
                  child.isActive
                    ? 'border-primary/50 bg-primary/5 shadow-md'
                    : 'hover:border-primary/30 hover:shadow-md active:scale-[0.98]'
                }`}
                onClick={() => {
                  onSelectChild(child.id);
                  onOpenChange(false);
                }}
              >
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                    child.isActive ? 'bg-primary/20' : 'bg-muted'
                  }`}>
                    <Heart className={`w-6 h-6 ${
                      child.isActive ? 'text-primary fill-current' : 'text-muted-foreground'
                    }`} />
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="text-base">{child.name}</h4>
                      {child.isActive && (
                        <Badge variant="default" className="text-xs">
                          Atual
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {child.age} • {child.momentCount} momentos
                    </p>
                  </div>
                  
                  {child.isActive && (
                    <Check className="w-5 h-5 text-primary" />
                  )}
                </div>
              </Card>
            </motion.div>
          ))}
          
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: children.length * 0.05 }}
          >
            <Button
              variant="outline"
              className="w-full h-14 rounded-2xl border-dashed hover:border-primary hover:bg-primary/5"
              onClick={() => {
                onAddChild();
                onOpenChange(false);
              }}
            >
              <Plus className="w-5 h-5 mr-2" />
              Adicionar Outro Filho
            </Button>
          </motion.div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
