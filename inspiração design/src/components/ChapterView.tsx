import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { Badge } from "./ui/badge";
import { Alert, AlertDescription } from "./ui/alert";
import { ArrowLeft, Plus, Check, Camera, Repeat, Info, Eye } from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import { MomentViewer } from "./MomentViewer";
import { RecurrentMomentPreview } from "./RecurrentMomentPreview";
import { getMomentsByChapter, getChapterById } from "../lib/chaptersData";

interface MomentRecord {
  id: string;
  date: string;
  story?: string;
  media: { type: 'photo' | 'video' | 'audio'; url: string; thumbnail?: string }[];
  ageAtMoment?: string;
}

interface Moment {
  id: string;
  title: string;
  description: string;
  status: 'pending' | 'completed' | 'recurrent';
  thumbnail?: string;
  date?: string;
  count?: number; // For recurrent moments
  records?: MomentRecord[]; // Actual records for completed/recurrent moments
}

interface ChapterViewProps {
  chapterId: string;
  chapterTitle: string;
  babyName: string;
  onBack: () => void;
  onAddMoment: (momentId: string) => void;
}

export function ChapterView({ chapterId, chapterTitle, babyName, onBack, onAddMoment }: ChapterViewProps) {
  const [showRecurrentInfo, setShowRecurrentInfo] = useState(false);
  const [viewingMoment, setViewingMoment] = useState<Moment | null>(null);
  
  // Get moments for this specific chapter
  const momentTemplates = getMomentsByChapter(chapterId);
  const chapter = getChapterById(chapterId);
  
  // Mock data - in production would come from backend
  // Transform moment templates into moments with status
  const moments: Moment[] = momentTemplates.map(template => {
    // Mock: some moments are completed, some pending
    const mockCompleted = ['first-photo', 'going-home'];
    const mockRecurrent = ['visitors'];
    
    if (mockCompleted.includes(template.id)) {
      return {
        ...template,
        status: 'completed' as const,
        thumbnail: "https://images.unsplash.com/photo-1761891950459-bc48f5bf026d?w=400",
        date: "10/02/2024",
        records: [
          {
            id: `${template.id}-1`,
            date: "2024-02-10",
            story: "Um momento especial registrado com muito carinho.",
            media: [
              { type: 'photo' as const, url: '#', thumbnail: "https://images.unsplash.com/photo-1761891950459-bc48f5bf026d?w=400" }
            ],
            ageAtMoment: `${babyName} com poucos dias`
          }
        ]
      };
    } else if (mockRecurrent.includes(template.id)) {
      return {
        ...template,
        status: 'recurrent' as const,
        count: 3,
        records: [
          {
            id: `${template.id}-1`,
            date: "2024-02-13",
            story: "Primeira vez deste momento especial.",
            media: [{ type: 'photo' as const, url: '#' }],
            ageAtMoment: `${babyName} com 3 dias`
          },
          {
            id: `${template.id}-2`,
            date: "2024-02-15",
            story: "Segunda vez deste momento memorável.",
            media: [{ type: 'photo' as const, url: '#' }],
            ageAtMoment: `${babyName} com 5 dias`
          },
          {
            id: `${template.id}-3`,
            date: "2024-02-20",
            story: "Terceira vez, sempre especial.",
            media: [{ type: 'photo' as const, url: '#' }],
            ageAtMoment: `${babyName} com 10 dias`
          }
        ]
      };
    } else {
      return {
        ...template,
        status: 'pending' as const
      };
    }
  });

  const completedCount = moments.filter(m => m.status === 'completed').length;
  const recurrentCount = moments.filter(m => m.status === 'recurrent').length;
  const hasRecurrent = recurrentCount > 0;

  const handleMomentClick = (moment: Moment) => {
    if (moment.status === 'pending') {
      // Open form to add new moment
      onAddMoment(moment.id);
    } else {
      // Open viewer to see existing records
      setViewingMoment(moment);
    }
  };

  const handleViewerBack = () => {
    setViewingMoment(null);
  };

  const handleViewerAddNew = () => {
    if (viewingMoment) {
      onAddMoment(viewingMoment.id);
    }
  };

  const handleViewerEdit = (recordId: string) => {
    // In a real app, would pass recordId to edit specific record
    if (viewingMoment) {
      onAddMoment(viewingMoment.id);
    }
  };

  // If viewing a moment, show the viewer
  if (viewingMoment && viewingMoment.records && viewingMoment.records.length > 0) {
    return (
      <MomentViewer
        momentTitle={viewingMoment.title}
        momentDescription={viewingMoment.description}
        isRecurrent={viewingMoment.status === 'recurrent'}
        records={viewingMoment.records}
        babyName={babyName}
        onBack={handleViewerBack}
        onEdit={handleViewerEdit}
        onAddNew={handleViewerAddNew}
      />
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header - Refined */}
      <div className="sticky top-0 z-10 bg-card/80 backdrop-blur-xl border-b border-border/50 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-5">
          <Button 
            variant="ghost" 
            size="sm"
            onClick={onBack}
            className="mb-4 -ml-2 h-9 rounded-xl hover:bg-muted"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar
          </Button>
          
          {chapter && (
            <div className="flex items-center gap-3 mb-3">
              <div className={`w-12 h-12 rounded-2xl ${chapter.color} flex items-center justify-center shadow-sm`}>
                <chapter.icon className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl mb-1">{chapterTitle}</h1>
                <p className="text-sm text-muted-foreground">{chapter.description}</p>
              </div>
            </div>
          )}
          
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant="outline" className="rounded-full">
              {completedCount} de {moments.length} concluídos
            </Badge>
            {hasRecurrent && (
              <Badge variant="secondary" className="text-xs rounded-full">
                <Repeat className="w-3 h-3 mr-1" />
                {recurrentCount} recorrente{recurrentCount > 1 ? 's' : ''}
              </Badge>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-6 sm:py-8">
        {/* Recurrent Info Alert */}
        {hasRecurrent && !showRecurrentInfo && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6"
          >
            <Alert className="bg-accent/10 border-accent/30">
              <Info className="h-4 w-4 text-accent" />
              <AlertDescription className="flex items-start justify-between gap-2">
                <div className="flex-1">
                  <p className="text-sm">
                    <strong>Momentos Recorrentes</strong> podem ser registrados múltiplas vezes. 
                    Ideal para eventos que se repetem!
                  </p>
                </div>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-auto p-0 text-accent hover:text-accent hover:bg-transparent underline"
                  onClick={() => setShowRecurrentInfo(true)}
                >
                  Entendi
                </Button>
              </AlertDescription>
            </Alert>
          </motion.div>
        )}

        <div className="space-y-3">
          {moments.map((moment, index) => (
            <motion.div
              key={moment.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.03 }}
            >
              <Card 
                className={`p-5 cursor-pointer transition-all duration-300 border-border/50 rounded-2xl ${
                  moment.status === 'completed' 
                    ? 'hover:shadow-lg hover:scale-[1.01] active:scale-[0.99] bg-card/50' 
                    : 'hover:shadow-xl hover:border-primary/30 hover:scale-[1.01] active:scale-[0.99]'
                }`}
                onClick={() => handleMomentClick(moment)}
              >
                <div className="flex items-center gap-4">
                  {/* Status Icon */}
                  <div className="flex-shrink-0">
                    {moment.status === 'completed' ? (
                      <motion.div 
                        className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center shadow-sm"
                        whileHover={{ scale: 1.05 }}
                      >
                        <Check className="w-6 h-6 text-primary" />
                      </motion.div>
                    ) : moment.status === 'recurrent' ? (
                      <div className="relative">
                        <motion.div 
                          className="w-12 h-12 rounded-2xl bg-accent/10 flex items-center justify-center shadow-sm"
                          whileHover={{ scale: 1.05 }}
                        >
                          <Repeat className="w-6 h-6 text-accent" />
                        </motion.div>
                        {moment.count && moment.count > 0 && (
                          <motion.div 
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-accent text-white flex items-center justify-center text-xs shadow-md"
                          >
                            {moment.count}
                          </motion.div>
                        )}
                      </div>
                    ) : (
                      <div className="w-12 h-12 rounded-2xl border-2 border-dashed border-border/50 flex items-center justify-center hover:border-primary/30 transition-colors">
                        <Camera className="w-6 h-6 text-muted-foreground" />
                      </div>
                    )}
                  </div>

                  {/* Thumbnail if completed */}
                  {moment.thumbnail && (
                    <div className="flex-shrink-0 w-16 h-16 rounded-2xl overflow-hidden shadow-sm">
                      <img 
                        src={moment.thumbnail} 
                        alt={moment.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start gap-2 mb-1">
                      <h4 className={`${moment.status === 'completed' ? 'text-muted-foreground' : ''} text-sm sm:text-base`}>
                        {moment.title}
                      </h4>
                      {moment.status === 'recurrent' && (
                        <Badge variant="secondary" className="text-[10px] sm:text-xs flex-shrink-0">
                          Recorrente
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs sm:text-sm text-muted-foreground line-clamp-1">
                      {moment.description}
                    </p>
                    {moment.date && (
                      <p className="text-xs text-primary mt-1">
                        Registrado em {moment.date}
                      </p>
                    )}
                    {moment.status === 'recurrent' && (
                      <>
                        {moment.count && moment.count > 0 ? (
                          <>
                            <p className="text-xs text-accent mt-1">
                              {moment.count} {moment.count === 1 ? 'registro' : 'registros'} • Toque para ver{moment.count === 1 ? ' e adicionar mais' : ''}
                            </p>
                            {moment.records && moment.records.length > 0 && (
                              <RecurrentMomentPreview 
                                records={moment.records.map(r => ({
                                  id: r.id,
                                  date: r.date,
                                  mediaCount: r.media.length,
                                  hasStory: !!r.story
                                }))}
                                maxVisible={2}
                              />
                            )}
                          </>
                        ) : (
                          <p className="text-xs text-accent mt-1">
                            Momento recorrente • Toque para começar
                          </p>
                        )}
                      </>
                    )}
                  </div>

                  {/* Action - Hidden on very small screens, shown as icon */}
                  <div className="flex-shrink-0 hidden xs:block">
                    {moment.status === 'completed' ? (
                      <Button 
                        variant="ghost" 
                        size="sm"
                        className="rounded-xl h-9 px-3 gap-1"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleMomentClick(moment);
                        }}
                      >
                        <Eye className="w-4 h-4" />
                        <span className="hidden sm:inline">Ver</span>
                      </Button>
                    ) : moment.status === 'recurrent' ? (
                      <Button 
                        variant="outline"
                        size="sm" 
                        className="rounded-xl h-9 px-3 sm:px-4 border-accent text-accent hover:bg-accent/10"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleMomentClick(moment);
                        }}
                      >
                        <Eye className="w-4 h-4 sm:mr-1" />
                        <span className="hidden sm:inline">Ver {moment.count}</span>
                      </Button>
                    ) : (
                      <Button 
                        size="sm" 
                        className="rounded-xl bg-primary hover:bg-primary/90 h-9 px-3 sm:px-4"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleMomentClick(moment);
                        }}
                      >
                        <Plus className="w-4 h-4 sm:mr-1" />
                        <span className="hidden sm:inline">Registrar</span>
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Encouragement */}
        {completedCount === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="mt-6 sm:mt-8"
          >
            <Card className="p-6 sm:p-8 text-center bg-gradient-to-br from-primary/5 to-accent/5 border-primary/20">
              <Repeat className="w-12 h-12 text-primary mx-auto mb-4" />
              <h3 className="mb-2">Comece registrando o primeiro momento</h3>
              <p className="text-sm sm:text-base text-muted-foreground">
                Cada detalhe é precioso. Não tenha pressa, vá no seu ritmo. 💛
              </p>
            </Card>
          </motion.div>
        )}

        {/* Explanation for Recurrent Moments */}
        {hasRecurrent && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="mt-6 sm:mt-8"
          >
            <Card className="p-4 sm:p-6 bg-accent/5 border-accent/20">
              <div className="flex gap-3 sm:gap-4">
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-accent/20 flex items-center justify-center">
                    <Repeat className="w-5 h-5 sm:w-6 sm:h-6 text-accent" />
                  </div>
                </div>
                <div className="flex-1">
                  <h4 className="mb-2 text-sm sm:text-base">O que são momentos recorrentes?</h4>
                  <p className="text-xs sm:text-sm text-muted-foreground mb-3">
                    Alguns momentos acontecem mais de uma vez! Por exemplo, as visitas de familiares 
                    ou amigos. Você pode registrar cada visita separadamente, criando uma coleção de 
                    memórias do mesmo tipo de evento.
                  </p>
                  <div className="flex items-center gap-2 text-xs sm:text-sm text-accent">
                    <Plus className="w-4 h-4" />
                    <span>Toque em um momento recorrente para adicionar um novo registro</span>
                  </div>
                </div>
              </div>
            </Card>
          </motion.div>
        )}
      </div>
    </div>
  );
}
