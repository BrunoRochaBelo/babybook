import { useState } from "react";
import { ArrowLeft, Camera } from "lucide-react";
import { motion } from "motion/react";
import { getMomentsByChapter } from "../lib/chaptersData";

interface ChapterViewProps {
  chapterId: string;
  chapterTitle: string;
  babyName: string;
  onBack: () => void;
  onAddMoment: (momentId: string) => void;
}

export function ChapterView({
  chapterId,
  chapterTitle,
  babyName,
  onBack,
  onAddMoment,
}: ChapterViewProps) {
  const momentTemplates = getMomentsByChapter(chapterId);
  const mockCompleted = ["first-photo", "going-home"];
  const mockRecurrent = ["visitors"];

  const moments = momentTemplates.map((template) => {
    if (mockCompleted.includes(template.id)) {
      return {
        ...template,
        status: "completed" as const,
        date: "10/02/2024",
      };
    } else if (mockRecurrent.includes(template.id)) {
      return {
        ...template,
        status: "recurrent" as const,
        count: 3,
      };
    } else {
      return { ...template, status: "pending" as const };
    }
  });

  const completedCount = moments.filter((m) => m.status === "completed").length;

  const handleMomentClick = (moment: (typeof moments)[0]) => {
    if (moment.status === "pending") {
      onAddMoment(moment.id);
    }
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="sticky top-0 z-10 bg-card/95 backdrop-blur-sm border-b border-border">
        <div className="max-w-4xl mx-auto px-4 py-4 sm:py-6">
          <button
            onClick={onBack}
            className="mb-3 -ml-2 h-9 flex items-center gap-2 text-sm hover:opacity-70"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar
          </button>
          <h1 className="text-2xl sm:text-3xl font-serif mb-2">
            {chapterTitle}
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            {completedCount} de {moments.length} momentos registrados
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="space-y-4">
          {moments.map((moment, index) => (
            <motion.div
              key={moment.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
              className="p-5 sm:p-6 rounded-3xl border border-border/50 bg-card/50 cursor-pointer hover:shadow-xl hover:scale-[1.01] active:scale-[0.99] transition-all"
              onClick={() => handleMomentClick(moment)}
            >
              <div className="flex items-start gap-4">
                <div
                  className={`flex-shrink-0 w-14 h-14 sm:w-16 sm:h-16 rounded-2xl flex items-center justify-center shadow-sm ${
                    moment.status === "pending"
                      ? "bg-muted/50"
                      : "bg-primary/10"
                  }`}
                >
                  <Camera className="w-7 h-7 sm:w-8 sm:h-8 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="mb-1.5 text-base sm:text-lg font-serif">
                    {moment.title}
                  </h3>
                  <p className="text-sm text-muted-foreground mb-3 line-clamp-1">
                    {moment.description}
                  </p>

                  {moment.status === "pending" && (
                    <div className="text-sm text-primary flex items-center gap-1.5">
                      <Camera className="w-4 h-4" />
                      Registrar agora
                    </div>
                  )}

                  {moment.status === "completed" && (
                    <div className="text-sm text-muted-foreground">
                      Registrado em {moment.date}
                    </div>
                  )}

                  {moment.status === "recurrent" && (
                    <div className="text-sm text-accent">
                      {moment.count} registros
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
