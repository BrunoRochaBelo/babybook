import { useState } from "react";
import { Users, CheckCircle } from "lucide-react";
import { AnimatePresence, LayoutGroup, motion } from "motion/react";
import { useSelectedChild } from "@/hooks/useSelectedChild";
import { GuestbookList } from "@/components/GuestbookList";
import { GuestbookForm } from "@/components/GuestbookForm";
import { cn } from "@/lib/utils";

export const VisitasPage = () => {
  const { selectedChild } = useSelectedChild();
  const [activeTab, setActiveTab] = useState<"approved" | "pending">(
    "approved",
  );
  const [showForm, setShowForm] = useState(false);

  const renderTabContent = () => {
    if (!selectedChild) {
      return null;
    }

    if (activeTab === "approved") {
      return (
        <div>
          <button
            onClick={() => setShowForm(!showForm)}
            className="mb-6 inline-flex items-center gap-2 rounded-xl bg-[#F2995D] px-6 py-2 font-semibold text-white transition-all hover:bg-opacity-90"
          >
            <Users className="h-4 w-4" />
            Deixar Mensagem
          </button>

          {showForm && (
            <GuestbookForm
              childId={selectedChild.id}
              onClose={() => setShowForm(false)}
            />
          )}

          <GuestbookList childId={selectedChild.id} status="approved" />
        </div>
      );
    }

    return <GuestbookList childId={selectedChild.id} status="pending" />;
  };

  if (!selectedChild) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-6 text-center">
        <p className="text-[#C9D3C2]">Selecione uma criança primeiro</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      <h1 className="text-2xl font-serif font-bold text-[#2A2A2A] mb-6">
        Livro de Visitas
      </h1>

      {/* Tabs */}
      <div className="mb-6 rounded-[28px] border border-border bg-surface p-2 shadow-sm">
        <LayoutGroup id="guestbook-tabs">
          <div className="flex flex-wrap gap-2">
            {[
              { id: "approved", icon: CheckCircle, label: "Aprovadas" },
              { id: "pending", icon: Users, label: "Pendentes" },
            ].map((tab) => {
              const isActive = activeTab === tab.id;
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id as "approved" | "pending")}
                  className={cn(
                    "relative flex-1 min-w-[120px] overflow-hidden rounded-full px-4 py-2 text-sm font-semibold transition-colors duration-300",
                    isActive
                      ? "text-primary-foreground"
                      : "text-ink-muted hover:text-ink",
                  )}
                >
                  {isActive && (
                    <motion.span
                      layoutId="guestbook-nav-pill"
                      className="absolute inset-0 rounded-full bg-primary shadow-[0_10px_24px_rgba(242,153,93,0.28)]"
                      transition={{
                        type: "spring",
                        stiffness: 320,
                        damping: 30,
                      }}
                    />
                  )}
                  <span className="relative z-10 inline-flex items-center justify-center gap-2">
                    <Icon
                      className={cn(
                        "h-4 w-4 transition-colors duration-300",
                        isActive ? "text-primary-foreground" : "text-ink-muted",
                      )}
                    />
                    {tab.label}
                  </span>
                </button>
              );
            })}
          </div>
        </LayoutGroup>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
        >
          {renderTabContent()}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};
