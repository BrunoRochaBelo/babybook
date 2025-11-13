import { useState } from "react";
import {
  ArrowLeft,
  Edit2,
  Plus,
  Image as ImageIcon,
  Video,
  Mic,
  Calendar,
  Repeat,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface MomentRecord {
  id: string;
  date: string;
  story?: string;
  media: {
    type: "photo" | "video" | "audio";
    url: string;
    thumbnail?: string;
  }[];
  ageAtMoment?: string;
}

interface MomentViewerProps {
  momentTitle: string;
  momentDescription: string;
  isRecurrent: boolean;
  records: MomentRecord[];
  babyName: string;
  onBack: () => void;
  onEdit: (recordId: string) => void;
  onAddNew: () => void;
}

export function MomentViewer({
  momentTitle,
  momentDescription,
  isRecurrent,
  records,
  babyName,
  onBack,
  onEdit,
  onAddNew,
}: MomentViewerProps) {
  const [selectedRecord, setSelectedRecord] = useState<string | null>(
    records.length === 1 ? records[0].id : null,
  );

  const currentRecord = records.find((r) => r.id === selectedRecord);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  };

  const getTimeAgo = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return "Hoje";
    if (diffDays === 1) return "Ontem";
    if (diffDays < 7) return `${diffDays} dias atrás`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} semanas atrás`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} meses atrás`;
    return `${Math.floor(diffDays / 365)} anos atrás`;
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-card/95 backdrop-blur-sm border-b border-border">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <button
            onClick={onBack}
            className="mb-3 -ml-2 h-9 px-2 py-1.5 text-sm font-medium hover:bg-muted rounded-lg flex items-center gap-2 text-foreground"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar
          </button>
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <h1 className="text-xl sm:text-2xl md:text-3xl">
                  {momentTitle}
                </h1>
                {isRecurrent && (
                  <span className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-secondary text-secondary-foreground rounded-full">
                    <Repeat className="w-3 h-3" />
                    Recorrente
                  </span>
                )}
              </div>
              <p className="text-xs sm:text-sm text-muted-foreground">
                {momentDescription}
              </p>
              {isRecurrent && (
                <p className="text-xs sm:text-sm text-accent mt-1">
                  {records.length}{" "}
                  {records.length === 1 ? "registro" : "registros"}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-6 sm:py-8">
        {isRecurrent && records.length > 1 ? (
          /* Timeline View */
          <div className="space-y-6">
            {/* Timeline of Records */}
            <div className="space-y-3">
              {records
                .sort(
                  (a, b) =>
                    new Date(b.date).getTime() - new Date(a.date).getTime(),
                )
                .map((record, index) => (
                  <motion.div
                    key={record.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <button
                      className={`w-full p-4 rounded-2xl border-2 transition-all duration-200 text-left ${
                        selectedRecord === record.id
                          ? "border-primary shadow-md bg-primary/5"
                          : "border-border hover:border-primary/30"
                      }`}
                      onClick={() => setSelectedRecord(record.id)}
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 pt-1">
                          <div
                            className={`w-3 h-3 rounded-full ${
                              selectedRecord === record.id
                                ? "bg-primary"
                                : "bg-muted-foreground/30"
                            }`}
                          />
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <Calendar className="w-4 h-4 text-muted-foreground" />
                            <span className="text-sm">
                              {formatDate(record.date)}
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {getTimeAgo(record.date)} •{" "}
                            {record.ageAtMoment || `${babyName} com X meses`}
                          </p>
                        </div>
                      </div>
                    </button>
                  </motion.div>
                ))}
            </div>

            {/* Details */}
            <AnimatePresence mode="wait">
              {selectedRecord && currentRecord && (
                <motion.div
                  key={selectedRecord}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3 }}
                  className="rounded-2xl border border-border bg-card p-6"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-lg mb-1">Detalhes do Registro</h3>
                      <p className="text-sm text-muted-foreground">
                        {formatDate(currentRecord.date)}
                      </p>
                    </div>
                    <button
                      onClick={() => onEdit(currentRecord.id)}
                      className="px-3 py-1.5 text-sm rounded-xl border border-border hover:bg-muted flex items-center gap-2"
                    >
                      <Edit2 className="w-4 h-4" />
                      Editar
                    </button>
                  </div>

                  {currentRecord.media.length > 0 && (
                    <div className="mb-4">
                      <h4 className="text-sm mb-3">
                        Mídias ({currentRecord.media.length})
                      </h4>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        {currentRecord.media.map((media, idx) => (
                          <div
                            key={idx}
                            className="aspect-square rounded-xl bg-muted flex items-center justify-center overflow-hidden"
                          >
                            {media.type === "photo" && (
                              <ImageIcon className="w-8 h-8 text-muted-foreground" />
                            )}
                            {media.type === "video" && (
                              <Video className="w-8 h-8 text-muted-foreground" />
                            )}
                            {media.type === "audio" && (
                              <Mic className="w-8 h-8 text-muted-foreground" />
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {currentRecord.story && (
                    <div>
                      <h4 className="text-sm mb-2">História</h4>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {currentRecord.story}
                      </p>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ) : (
          /* Single Record View */
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="rounded-2xl border border-border bg-card p-6"
          >
            <div className="flex items-start justify-between mb-6">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Calendar className="w-5 h-5 text-primary" />
                  <span className="text-base sm:text-lg">
                    {formatDate(records[0].date)}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground">
                  {getTimeAgo(records[0].date)} •{" "}
                  {records[0].ageAtMoment || `${babyName} com X meses`}
                </p>
              </div>
              <button
                onClick={() => onEdit(records[0].id)}
                className="px-3 py-1.5 text-sm rounded-xl border border-border hover:bg-muted flex items-center gap-2"
              >
                <Edit2 className="w-4 h-4" />
                Editar
              </button>
            </div>

            {records[0].media.length > 0 && (
              <div className="mb-6">
                <h4 className="text-sm sm:text-base mb-3">Mídias</h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {records[0].media.map((media, idx) => (
                    <div
                      key={idx}
                      className="aspect-square rounded-xl bg-muted flex items-center justify-center overflow-hidden"
                    >
                      {media.type === "photo" && (
                        <ImageIcon className="w-8 h-8 sm:w-10 sm:h-10 text-muted-foreground" />
                      )}
                      {media.type === "video" && (
                        <Video className="w-8 h-8 sm:w-10 sm:h-10 text-muted-foreground" />
                      )}
                      {media.type === "audio" && (
                        <Mic className="w-8 h-8 sm:w-10 sm:h-10 text-muted-foreground" />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {records[0].story && (
              <div>
                <h4 className="text-sm sm:text-base mb-3">História</h4>
                <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
                  {records[0].story}
                </p>
              </div>
            )}
          </motion.div>
        )}
      </div>

      {/* Add New Button */}
      {isRecurrent && (
        <div className="fixed bottom-0 left-0 right-0 bg-card/95 backdrop-blur-sm border-t border-border shadow-lg">
          <div className="max-w-4xl mx-auto px-4 py-3 sm:py-4">
            <button
              onClick={onAddNew}
              className="w-full h-12 sm:h-14 rounded-2xl bg-primary hover:bg-primary/90 transition-smooth text-white font-medium flex items-center justify-center gap-2"
            >
              <Plus className="w-5 h-5" />
              <span className="text-sm sm:text-base">
                Adicionar Novo Registro
              </span>
            </button>
            <p className="text-xs text-center text-muted-foreground mt-2">
              Registre mais uma vez que este momento aconteceu
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
