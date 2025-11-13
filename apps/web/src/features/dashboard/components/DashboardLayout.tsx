import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Dashboard } from "../Dashboard";
import { ChapterView } from "@/components/ChapterView";
import { HealthModule } from "@/components/HealthModule";
import { Guestbook } from "@/components/Guestbook";
import { MomentForm } from "@/components/MomentForm";
import { getChapterById } from "@/features/showcase/lib/chaptersData";

interface DashboardLayoutProps {
  babyName: string;
}

export function DashboardLayout({ babyName }: DashboardLayoutProps) {
  const [activeSection, setActiveSection] = useState<
    "memories" | "health" | "visits"
  >("memories");
  const [selectedChapterId, setSelectedChapterId] = useState<string | null>(
    null,
  );
  const [showMomentForm, setShowMomentForm] = useState(false);

  const handleSelectChapter = (chapterId: string) => {
    setSelectedChapterId(chapterId);
  };

  const handleNavigate = (section: "memories" | "health" | "visits") => {
    setActiveSection(section);
    setSelectedChapterId(null);
    setShowMomentForm(false);
  };

  const handleSettings = () => {
    // TODO: Implementar modal de settings
    console.log("Settings clicked");
  };

  const handleBack = () => {
    setSelectedChapterId(null);
    setShowMomentForm(false);
  };

  const handleAddMoment = () => {
    setShowMomentForm(true);
  };

  const chapterData = selectedChapterId
    ? getChapterById(selectedChapterId)
    : null;

  return (
    <AnimatePresence mode="wait">
      {showMomentForm ? (
        <motion.div
          key="moment-form"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          transition={{ duration: 0.3 }}
        >
          <MomentForm
            momentTitle={chapterData?.title || "Novo Momento"}
            momentDescription={chapterData?.description}
            babyName={babyName}
            isRecurrent={false}
            onBack={handleBack}
            onSave={handleBack}
          />
        </motion.div>
      ) : selectedChapterId ? (
        <motion.div
          key="chapter-view"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.3 }}
        >
          <ChapterView
            chapterId={selectedChapterId}
            chapterTitle={chapterData?.title || "Chapter"}
            babyName={babyName}
            onBack={handleBack}
            onAddMoment={handleAddMoment}
          />
        </motion.div>
      ) : activeSection === "memories" ? (
        <motion.div
          key="dashboard"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          <Dashboard
            babyName={babyName}
            activeSection={activeSection}
            onSelectChapter={handleSelectChapter}
            onNavigate={handleNavigate}
            onSettings={handleSettings}
          />
        </motion.div>
      ) : activeSection === "health" ? (
        <motion.div
          key="health"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          <HealthModule
            babyName={babyName}
            onBack={() => setActiveSection("memories")}
            onNavigate={handleNavigate}
          />
        </motion.div>
      ) : (
        <motion.div
          key="guestbook"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          <Guestbook
            babyName={babyName}
            onBack={() => setActiveSection("memories")}
            onNavigate={handleNavigate}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
