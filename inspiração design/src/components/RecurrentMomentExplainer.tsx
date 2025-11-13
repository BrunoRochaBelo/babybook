import { Card } from "./ui/card";
import { Badge } from "./ui/badge";
import { Repeat, Calendar, Plus, List } from "lucide-react";
import { motion } from "motion/react";

interface RecurrentMomentExplainerProps {
  momentTitle: string;
  existingCount: number;
}

export function RecurrentMomentExplainer({ momentTitle, existingCount }: RecurrentMomentExplainerProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <Card className="p-4 sm:p-5 bg-gradient-to-br from-accent/10 to-accent/5 border-accent/30">
        <div className="flex gap-3 sm:gap-4">
          <div className="flex-shrink-0">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-accent/20 flex items-center justify-center">
              <Repeat className="w-5 h-5 sm:w-6 sm:h-6 text-accent" />
            </div>
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <h4 className="text-sm sm:text-base">Momento Recorrente</h4>
              <Badge variant="secondary" className="text-xs">
                <Repeat className="w-3 h-3 mr-1" />
                {existingCount > 0 ? `${existingCount} registros` : 'Novo'}
              </Badge>
            </div>
            
            <p className="text-xs sm:text-sm text-muted-foreground mb-3">
              <strong>"{momentTitle}"</strong> é um tipo de momento que pode acontecer várias vezes. 
              Cada registro é guardado separadamente na sua linha do tempo.
            </p>

            <div className="space-y-2">
              <div className="flex items-start gap-2 text-xs sm:text-sm">
                <Calendar className="w-4 h-4 text-accent flex-shrink-0 mt-0.5" />
                <span className="text-muted-foreground">
                  Cada registro tem sua própria data e detalhes
                </span>
              </div>
              <div className="flex items-start gap-2 text-xs sm:text-sm">
                <List className="w-4 h-4 text-accent flex-shrink-0 mt-0.5" />
                <span className="text-muted-foreground">
                  Você pode ver todos os registros em uma linha do tempo
                </span>
              </div>
              <div className="flex items-start gap-2 text-xs sm:text-sm">
                <Plus className="w-4 h-4 text-accent flex-shrink-0 mt-0.5" />
                <span className="text-muted-foreground">
                  Adicione quantos registros quiser deste momento
                </span>
              </div>
            </div>

            {existingCount > 0 && (
              <div className="mt-3 pt-3 border-t border-accent/20">
                <p className="text-xs sm:text-sm text-accent">
                  💡 <strong>Dica:</strong> Este será o <strong>{existingCount + 1}º registro</strong> de "{momentTitle}". 
                  Depois de salvar, você poderá ver todos juntos na linha do tempo.
                </p>
              </div>
            )}
          </div>
        </div>
      </Card>
    </motion.div>
  );
}
