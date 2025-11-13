import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { Badge } from "./ui/badge";
import { 
  ArrowLeft, Edit2, Plus, Image as ImageIcon, Video, Mic, 
  Calendar, Clock, MoreVertical, Repeat, AlertCircle 
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useState } from "react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "./ui/dropdown-menu";
import { Alert, AlertDescription } from "./ui/alert";

interface MomentRecord {
  id: string;
  date: string;
  story?: string;
  media: { type: 'photo' | 'video' | 'audio'; url: string; thumbnail?: string }[];
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
  onAddNew 
}: MomentViewerProps) {
  const [selectedRecord, setSelectedRecord] = useState<string | null>(
    records.length === 1 ? records[0].id : null
  );

  const currentRecord = records.find(r => r.id === selectedRecord);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('pt-BR', { 
      day: '2-digit', 
      month: 'long', 
      year: 'numeric' 
    });
  };

  const getTimeAgo = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Hoje';
    if (diffDays === 1) return 'Ontem';
    if (diffDays < 7) return `${diffDays} dias atrás`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} semanas atrás`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} meses atrás`;
    return `${Math.floor(diffDays / 365)} anos atrás`;
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header - Sticky */}
      <div className="sticky top-0 z-10 bg-card/95 backdrop-blur-sm border-b border-border">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <Button 
            variant="ghost" 
            size="sm"
            onClick={onBack}
            className="mb-3 -ml-2 h-9"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar
          </Button>
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <h1 className="text-xl sm:text-2xl md:text-3xl">{momentTitle}</h1>
                {isRecurrent && (
                  <Badge variant="secondary" className="text-xs">
                    <Repeat className="w-3 h-3 mr-1" />
                    Recorrente
                  </Badge>
                )}
              </div>
              <p className="text-xs sm:text-sm text-muted-foreground">
                {momentDescription}
              </p>
              {isRecurrent && (
                <p className="text-xs sm:text-sm text-accent mt-1">
                  {records.length} {records.length === 1 ? 'registro' : 'registros'}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-6 sm:py-8">
        {isRecurrent && records.length > 1 ? (
          /* Recurrent Timeline View */
          <div className="space-y-6">
            {/* Info Alert */}
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Alert className="bg-accent/10 border-accent/30">
                <Repeat className="h-4 w-4 text-accent" />
                <AlertDescription className="text-sm">
                  Este é um momento recorrente. Você tem <strong>{records.length} registros</strong> guardados. 
                  Toque em um para ver os detalhes ou adicione um novo registro.
                </AlertDescription>
              </Alert>
            </motion.div>

            {/* Timeline of Records */}
            <div className="space-y-3">
              {records
                .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                .map((record, index) => (
                  <motion.div
                    key={record.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <Card 
                      className={`p-4 cursor-pointer transition-all duration-200 ${
                        selectedRecord === record.id 
                          ? 'border-primary shadow-md' 
                          : 'hover:border-primary/30 hover:shadow-sm'
                      }`}
                      onClick={() => setSelectedRecord(record.id)}
                    >
                      <div className="flex items-start gap-3">
                        {/* Timeline dot */}
                        <div className="flex-shrink-0 pt-1">
                          <div className={`w-3 h-3 rounded-full ${
                            selectedRecord === record.id 
                              ? 'bg-primary' 
                              : 'bg-muted-foreground/30'
                          }`} />
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                <Calendar className="w-4 h-4 text-muted-foreground" />
                                <span className="text-sm">{formatDate(record.date)}</span>
                              </div>
                              <p className="text-xs text-muted-foreground">
                                {getTimeAgo(record.date)} • {record.ageAtMoment || `${babyName} com X meses`}
                              </p>
                            </div>
                            
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button 
                                  variant="ghost" 
                                  size="icon"
                                  className="h-8 w-8 rounded-full"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <MoreVertical className="w-4 h-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => onEdit(record.id)}>
                                  <Edit2 className="w-4 h-4 mr-2" />
                                  Editar registro
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>

                          {/* Media preview */}
                          {record.media.length > 0 && (
                            <div className="flex gap-2 mb-2">
                              {record.media.slice(0, 3).map((media, idx) => (
                                <div 
                                  key={idx}
                                  className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center overflow-hidden"
                                >
                                  {media.thumbnail ? (
                                    <img 
                                      src={media.thumbnail} 
                                      alt="Preview"
                                      className="w-full h-full object-cover"
                                    />
                                  ) : (
                                    <>
                                      {media.type === 'photo' && <ImageIcon className="w-5 h-5 text-muted-foreground" />}
                                      {media.type === 'video' && <Video className="w-5 h-5 text-muted-foreground" />}
                                      {media.type === 'audio' && <Mic className="w-5 h-5 text-muted-foreground" />}
                                    </>
                                  )}
                                </div>
                              ))}
                              {record.media.length > 3 && (
                                <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center text-xs text-muted-foreground">
                                  +{record.media.length - 3}
                                </div>
                              )}
                            </div>
                          )}

                          {/* Story preview */}
                          {record.story && (
                            <p className="text-sm text-muted-foreground line-clamp-2">
                              {record.story}
                            </p>
                          )}
                        </div>
                      </div>
                    </Card>
                  </motion.div>
                ))}
            </div>

            {/* Expanded record details */}
            <AnimatePresence mode="wait">
              {selectedRecord && currentRecord && (
                <motion.div
                  key={selectedRecord}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3 }}
                >
                  <Card className="p-6 bg-gradient-to-br from-primary/5 to-accent/5 border-primary/20">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="text-lg mb-1">Detalhes do Registro</h3>
                        <p className="text-sm text-muted-foreground">
                          {formatDate(currentRecord.date)}
                        </p>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onEdit(currentRecord.id)}
                        className="rounded-xl"
                      >
                        <Edit2 className="w-4 h-4 mr-2" />
                        Editar
                      </Button>
                    </div>

                    {/* Full media gallery */}
                    {currentRecord.media.length > 0 && (
                      <div className="mb-4">
                        <h4 className="text-sm mb-3">Mídias ({currentRecord.media.length})</h4>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                          {currentRecord.media.map((media, idx) => (
                            <div 
                              key={idx}
                              className="aspect-square rounded-xl bg-muted flex items-center justify-center overflow-hidden"
                            >
                              {media.thumbnail ? (
                                <img 
                                  src={media.thumbnail} 
                                  alt="Media"
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <>
                                  {media.type === 'photo' && <ImageIcon className="w-8 h-8 text-muted-foreground" />}
                                  {media.type === 'video' && <Video className="w-8 h-8 text-muted-foreground" />}
                                  {media.type === 'audio' && <Mic className="w-8 h-8 text-muted-foreground" />}
                                </>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Full story */}
                    {currentRecord.story && (
                      <div>
                        <h4 className="text-sm mb-2">História</h4>
                        <p className="text-sm text-muted-foreground leading-relaxed">
                          {currentRecord.story}
                        </p>
                      </div>
                    )}

                    {!currentRecord.story && currentRecord.media.length === 0 && (
                      <div className="text-center py-8">
                        <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-50" />
                        <p className="text-sm text-muted-foreground">
                          Este registro não tem história ou mídias ainda.
                        </p>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onEdit(currentRecord.id)}
                          className="mt-3"
                        >
                          <Edit2 className="w-4 h-4 mr-2" />
                          Adicionar detalhes
                        </Button>
                      </div>
                    )}
                  </Card>
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
          >
            <Card className="p-6 sm:p-8">
              <div className="flex items-start justify-between mb-6">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Calendar className="w-5 h-5 text-primary" />
                    <span className="text-base sm:text-lg">{formatDate(records[0].date)}</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {getTimeAgo(records[0].date)} • {records[0].ageAtMoment || `${babyName} com X meses`}
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onEdit(records[0].id)}
                  className="rounded-xl"
                >
                  <Edit2 className="w-4 h-4 mr-2" />
                  Editar
                </Button>
              </div>

              {/* Media */}
              {records[0].media.length > 0 && (
                <div className="mb-6">
                  <h4 className="text-sm sm:text-base mb-3">Mídias</h4>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {records[0].media.map((media, idx) => (
                      <div 
                        key={idx}
                        className="aspect-square rounded-xl bg-muted flex items-center justify-center overflow-hidden"
                      >
                        {media.thumbnail ? (
                          <img 
                            src={media.thumbnail} 
                            alt="Media"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <>
                            {media.type === 'photo' && <ImageIcon className="w-8 h-8 sm:w-10 sm:h-10 text-muted-foreground" />}
                            {media.type === 'video' && <Video className="w-8 h-8 sm:w-10 sm:h-10 text-muted-foreground" />}
                            {media.type === 'audio' && <Mic className="w-8 h-8 sm:w-10 sm:h-10 text-muted-foreground" />}
                          </>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Story */}
              {records[0].story && (
                <div>
                  <h4 className="text-sm sm:text-base mb-3">História</h4>
                  <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
                    {records[0].story}
                  </p>
                </div>
              )}

              {!records[0].story && records[0].media.length === 0 && (
                <div className="text-center py-12">
                  <AlertCircle className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-50" />
                  <h3 className="mb-2">Momento registrado</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Este momento foi salvo, mas ainda não tem história ou mídias.
                  </p>
                  <Button
                    onClick={() => onEdit(records[0].id)}
                    className="rounded-xl"
                  >
                    <Edit2 className="w-4 h-4 mr-2" />
                    Adicionar detalhes
                  </Button>
                </div>
              )}
            </Card>
          </motion.div>
        )}
      </div>

      {/* Fixed Bottom Button - Add New (especially for recurrent) */}
      {isRecurrent && (
        <div className="fixed bottom-0 left-0 right-0 bg-card/95 backdrop-blur-sm border-t border-border shadow-lg safe-area-inset-bottom">
          <div className="max-w-4xl mx-auto px-4 py-3 sm:py-4">
            <Button 
              onClick={onAddNew}
              className="w-full h-12 sm:h-14 rounded-2xl bg-primary hover:bg-primary/90 transition-smooth"
            >
              <Plus className="w-5 h-5 mr-2" />
              <span className="text-sm sm:text-base">Adicionar Novo Registro</span>
            </Button>
            <p className="text-xs text-center text-muted-foreground mt-2">
              Registre mais uma vez que este momento aconteceu
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
