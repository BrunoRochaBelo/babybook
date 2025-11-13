import { useState } from "react";
import { Card } from "@babybook/ui";
import { Heart, Settings, ChevronDown, Camera, Moon, Sun } from "lucide-react";
import { motion } from "motion/react";
import { FloatingNav } from "../../components/FloatingNav";
import { ChildSwitcherDialog } from "../../components/ChildSwitcherDialog";
import { NotificationCenter } from "../../components/NotificationCenter";
import { chapters, getMomentsByChapter } from "../../lib/chaptersData";
import { useTheme } from "../../hooks/useTheme";

interface DashboardProps {
  babyName: string;
  activeSection?: "memories" | "health" | "visits";
  onSelectChapter: (chapterId: string) => void;
  onNavigate: (section: "memories" | "health" | "visits") => void;
  onSettings: () => void;
}

export function Dashboard({
  babyName,
  activeSection = "memories",
  onSelectChapter,
  onNavigate,
  onSettings,
}: DashboardProps) {
  const { theme, toggleTheme } = useTheme();
  const [childSwitcherOpen, setChildSwitcherOpen] = useState(false);

  // Mock data - em produção viria do backend
  const children = [
    {
      id: "1",
      name: babyName,
      age: "10 meses",
      momentCount: 10,
      isActive: true,
    },
    { id: "2", name: "João", age: "3 anos", momentCount: 45, isActive: false },
  ];

  const notifications = [
    {
      id: "1",
      type: "vaccine" as const,
      title: "Vacina Próxima",
      message: "Pentavalente (2ª dose) prevista para 15/11/2025",
      time: "2 dias atrás",
      isRead: false,
      action: {
        label: "Ver detalhes",
        onClick: () => onNavigate("memories"),
      },
    },
    {
      id: "2",
      type: "milestone" as const,
      title: "Marco de Desenvolvimento",
      message: `${babyName} está na idade de começar a engatinhar. Que tal registrar esse momento?`,
      time: "1 semana atrás",
      isRead: false,
    },
    {
      id: "3",
      type: "celebration" as const,
      title: "Mesversário Chegando",
      message: "Faltam 5 dias para o 11º mês de vida!",
      time: "1 semana atrás",
      isRead: true,
    },
  ];

  const [notificationList, setNotificationList] = useState(notifications);

  const handleMarkAsRead = (notificationId: string) => {
    setNotificationList((prev) =>
      prev.map((n) => (n.id === notificationId ? { ...n, isRead: true } : n)),
    );
  };

  const handleMarkAllAsRead = () => {
    setNotificationList((prev) => prev.map((n) => ({ ...n, isRead: true })));
  };

  // Calculate progress based on actual chapter data
  const chaptersWithProgress = chapters.map((chapter: (typeof chapters)[0]) => {
    const moments = getMomentsByChapter(chapter.id);
    return {
      ...chapter,
      progress: 0, // Em produção, viria do backend com momentos completados
      total: moments.length,
    };
  });

  const completedMoments = chaptersWithProgress.reduce(
    (acc: number, ch: (typeof chaptersWithProgress)[0]) => acc + ch.progress,
    0,
  );
  const totalMoments = chaptersWithProgress.reduce(
    (acc: number, ch: (typeof chaptersWithProgress)[0]) => acc + ch.total,
    0,
  );

  return (
    <div className="min-h-screen bg-background pb-32">
      {/* Header - Refined */}
      <div className="sticky top-0 z-10 bg-card/80 backdrop-blur-xl border-b border-border/50 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between gap-3">
            <button
              className="h-auto p-0 hover:opacity-80 transition-opacity -ml-2 flex items-center gap-3 cursor-pointer"
              onClick={() => setChildSwitcherOpen(true)}
            >
              <motion.div
                className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center flex-shrink-0 shadow-sm"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Heart className="w-6 h-6 text-primary fill-current" />
              </motion.div>
              <div className="text-left">
                <div className="flex items-center gap-1.5">
                  <span className="text-lg">{babyName}</span>
                  <ChevronDown className="w-4 h-4 text-muted-foreground" />
                </div>
                <span className="text-xs text-muted-foreground">
                  10 meses • {completedMoments}/{totalMoments} momentos
                </span>
              </div>
            </button>

            <div className="flex items-center gap-1.5">
              <NotificationCenter
                notifications={notificationList}
                onMarkAsRead={handleMarkAsRead}
                onMarkAllAsRead={handleMarkAllAsRead}
              />
              <button
                onClick={toggleTheme}
                className="rounded-full h-10 w-10 hover:bg-muted flex items-center justify-center cursor-pointer transition-colors"
              >
                {theme === "light" ? (
                  <Moon className="w-5 h-5" />
                ) : (
                  <Sun className="w-5 h-5" />
                )}
              </button>
              <button
                onClick={onSettings}
                className="rounded-full h-10 w-10 hover:bg-muted flex items-center justify-center cursor-pointer transition-colors"
              >
                <Settings className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <ChildSwitcherDialog
        open={childSwitcherOpen}
        onOpenChange={setChildSwitcherOpen}
        currentChild={children[0]}
        children={children}
        onSelectChild={(childId: string) => {
          console.log("Selected child:", childId);
          // Em produção, mudaria o filho ativo
        }}
        onAddChild={() => {
          console.log("Add new child");
          // Em produção, abriria wizard de novo filho
        }}
      />

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-6 sm:py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="mb-6 sm:mb-8">
            <h2 className="text-3xl sm:text-4xl font-serif mb-2">
              Santuário de {babyName}
            </h2>
            <p className="text-sm sm:text-base text-muted-foreground">
              Cada momento guardado aqui fica seguro para sempre
            </p>
          </div>

          {/* HUD - Próxima Sugestão (Conforme Modelagem_UI-UX.md § 4.1) */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="mb-6 p-5 sm:p-6 bg-gradient-to-r from-accent/10 to-primary/10 border border-accent/30 rounded-2xl"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <p className="text-xs sm:text-sm text-muted-foreground mb-1 font-medium">
                  Próxima sugestão
                </p>
                <h3 className="text-lg sm:text-xl font-serif text-foreground mb-2">
                  O Primeiro Sorriso
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                  {babyName} está na idade perfeita para aquele sorriso
                  intencionado. Que tal registrar?
                </p>
                <button
                  onClick={() => onSelectChapter("first-smile")}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-accent hover:bg-accent/90 text-white text-sm font-medium transition-colors"
                >
                  <Camera className="w-4 h-4" />
                  Registrar agora
                </button>
              </div>
              <motion.div
                className="w-12 h-12 rounded-full bg-accent/20 flex items-center justify-center flex-shrink-0"
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <Heart className="w-6 h-6 text-accent" />
              </motion.div>
            </div>
          </motion.div>

          {/* Overall Progress */}
          <div className="p-4 sm:p-6 mb-6 bg-gradient-to-br from-primary/5 to-accent/5 border border-primary/20 rounded-2xl">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="text-base sm:text-lg font-serif mb-1">
                  Progresso Geral
                </h3>
                <p className="text-sm text-muted-foreground">
                  {completedMoments} de {totalMoments} momentos guardados
                </p>
              </div>
              <div className="text-right">
                <div className="text-xl sm:text-2xl text-primary font-semibold">
                  {Math.round((completedMoments / totalMoments) * 100)}%
                </div>
              </div>
            </div>
            <div className="w-full bg-muted rounded-full h-2 sm:h-3 overflow-hidden">
              <div
                className="bg-primary h-full transition-all duration-500"
                style={{
                  width: `${totalMoments > 0 ? (completedMoments / totalMoments) * 100 : 0}%`,
                }}
              />
            </div>
          </div>

          {/* Chapters - Refined */}
          <div className="space-y-4">
            {chaptersWithProgress.map(
              (chapter: (typeof chaptersWithProgress)[0], index: number) => (
                <motion.div
                  key={chapter.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                >
                  <div
                    className="p-5 sm:p-6 cursor-pointer hover:shadow-xl hover:scale-[1.01] active:scale-[0.99] transition-all duration-300 border border-border/50 rounded-3xl bg-card/50 backdrop-blur-sm"
                    onClick={() => onSelectChapter(chapter.id)}
                  >
                    <div className="flex items-start gap-4">
                      <motion.div
                        className={`flex-shrink-0 w-14 h-14 sm:w-16 sm:h-16 rounded-2xl ${chapter.color} flex items-center justify-center shadow-sm`}
                        whileHover={{ scale: 1.05, rotate: 3 }}
                        transition={{
                          type: "spring",
                          stiffness: 400,
                          damping: 10,
                        }}
                      >
                        <chapter.icon className="w-7 h-7 sm:w-8 sm:h-8" />
                      </motion.div>
                      <div className="flex-1 min-w-0">
                        <h3 className="mb-1.5 text-base sm:text-lg font-serif">
                          {chapter.title}
                        </h3>
                        <p className="text-sm text-muted-foreground mb-4 line-clamp-1">
                          {chapter.description}
                        </p>

                        <div className="flex items-center gap-3">
                          <div className="flex-1 bg-muted rounded-full h-2.5 overflow-hidden">
                            <div
                              className="bg-primary h-full transition-all duration-500"
                              style={{
                                width: `${chapter.total > 0 ? (chapter.progress / chapter.total) * 100 : 0}%`,
                              }}
                            />
                          </div>
                          <span className="text-sm text-muted-foreground whitespace-nowrap font-medium">
                            {chapter.progress}/{chapter.total}
                          </span>
                        </div>

                        {chapter.progress === 0 && (
                          <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.3 }}
                            className="mt-3 text-sm text-accent flex items-center gap-1.5"
                          >
                            <Camera className="w-4 h-4" />
                            Vamos registrar este momento?
                          </motion.div>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              ),
            )}
          </div>

          {/* Empty State Encouragement */}
          {chaptersWithProgress.every(
            (c: (typeof chaptersWithProgress)[0]) => c.progress === 0,
          ) && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="mt-6 sm:mt-8"
            >
              <div className="p-6 sm:p-8 bg-gradient-to-br from-primary/5 to-accent/5 border border-primary/20 rounded-2xl text-center">
                <motion.div
                  animate={{ y: [0, -4, 0] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="mb-4"
                >
                  <Camera className="w-12 h-12 text-primary mx-auto" />
                </motion.div>
                <h3 className="text-xl sm:text-2xl font-serif mb-3">
                  Seu santuário está pronto
                </h3>
                <p className="text-sm sm:text-base text-muted-foreground mb-6 max-w-md mx-auto">
                  Vamos começar com "O Grande Dia" — o nascimento de {babyName}.
                  Este é o primeiro capítulo de uma história muito especial.
                </p>
                <button
                  onClick={() => onSelectChapter("great-day")}
                  className="inline-flex h-12 px-6 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-medium items-center justify-center gap-2 transition-colors"
                >
                  <Camera className="w-5 h-5" />
                  Registrar o Grande Dia
                </button>
              </div>
            </motion.div>
          )}
        </motion.div>
      </div>

      {/* Floating Navigation - iOS Style */}
      <FloatingNav activeSection={activeSection} onNavigate={onNavigate} />
    </div>
  );
}
