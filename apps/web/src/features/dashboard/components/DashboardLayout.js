import { jsx as _jsx } from "react/jsx-runtime";
import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Dashboard } from "../Dashboard";
import { ChapterView } from "@/components/ChapterView";
import { HealthModule } from "@/components/HealthModule";
import { Guestbook } from "@/components/Guestbook";
import { MomentForm } from "@/components/MomentForm";
import { getChapterById } from "@/features/showcase/lib/chaptersData";
export function DashboardLayout({ babyName }) {
    const [activeSection, setActiveSection] = useState("memories");
    const [selectedChapterId, setSelectedChapterId] = useState(null);
    const [showMomentForm, setShowMomentForm] = useState(false);
    const handleSelectChapter = (chapterId) => {
        setSelectedChapterId(chapterId);
    };
    const handleNavigate = (section) => {
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
    return (_jsx(AnimatePresence, { mode: "wait", children: showMomentForm ? (_jsx(motion.div, { initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 }, exit: { opacity: 0, y: 20 }, transition: { duration: 0.3 }, children: _jsx(MomentForm, { momentTitle: chapterData?.title || "Novo Momento", momentDescription: chapterData?.description, babyName: babyName, isRecurrent: false, onBack: handleBack, onSave: handleBack }) }, "moment-form")) : selectedChapterId ? (_jsx(motion.div, { initial: { opacity: 0, x: 20 }, animate: { opacity: 1, x: 0 }, exit: { opacity: 0, x: -20 }, transition: { duration: 0.3 }, children: _jsx(ChapterView, { chapterId: selectedChapterId, chapterTitle: chapterData?.title || "Chapter", babyName: babyName, onBack: handleBack, onAddMoment: handleAddMoment }) }, "chapter-view")) : activeSection === "memories" ? (_jsx(motion.div, { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 }, transition: { duration: 0.3 }, children: _jsx(Dashboard, { babyName: babyName, activeSection: activeSection, onSelectChapter: handleSelectChapter, onNavigate: handleNavigate, onSettings: handleSettings }) }, "dashboard")) : activeSection === "health" ? (_jsx(motion.div, { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 }, transition: { duration: 0.3 }, children: _jsx(HealthModule, { babyName: babyName, onBack: () => setActiveSection("memories"), onNavigate: handleNavigate }) }, "health")) : (_jsx(motion.div, { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 }, transition: { duration: 0.3 }, children: _jsx(Guestbook, { babyName: babyName, onBack: () => setActiveSection("memories"), onNavigate: handleNavigate }) }, "guestbook")) }));
}
