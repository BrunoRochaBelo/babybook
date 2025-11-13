import { motion } from "motion/react";
import { Calendar, Image as ImageIcon, Video, Mic } from "lucide-react";

interface RecurrentRecord {
  id: string;
  date: string;
  mediaCount: number;
  hasStory: boolean;
}

interface RecurrentMomentPreviewProps {
  records: RecurrentRecord[];
  maxVisible?: number;
}

export function RecurrentMomentPreview({ records, maxVisible = 2 }: RecurrentMomentPreviewProps) {
  const displayRecords = records.slice(0, maxVisible);
  
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('pt-BR', { 
      day: '2-digit', 
      month: 'short'
    }).replace('.', '');
  };

  return (
    <div className="flex gap-2 mt-2 overflow-x-auto pb-1 scrollbar-hide">
      {displayRecords.map((record, index) => (
        <motion.div
          key={record.id}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: index * 0.05 }}
          className="flex-shrink-0 px-2 py-1.5 bg-accent/10 border border-accent/20 rounded-lg flex items-center gap-1.5"
        >
          <Calendar className="w-3 h-3 text-accent" />
          <span className="text-xs text-accent">{formatDate(record.date)}</span>
          {record.mediaCount > 0 && (
            <div className="flex items-center gap-0.5">
              <div className="w-px h-3 bg-accent/30" />
              <span className="text-xs text-accent/70">{record.mediaCount}</span>
            </div>
          )}
        </motion.div>
      ))}
      {records.length > maxVisible && (
        <div className="flex-shrink-0 px-2 py-1.5 bg-muted/50 rounded-lg flex items-center">
          <span className="text-xs text-muted-foreground">+{records.length - maxVisible}</span>
        </div>
      )}
    </div>
  );
}
