import { useState } from "react";
import { Users, CheckCircle, MessageCircle, Mail, X } from "lucide-react";
import { AnimatePresence, LayoutGroup, motion } from "motion/react";
import { useSelectedChild } from "@/hooks/useSelectedChild";
import { useGuestbookEntries } from "@/hooks/api";
import { GuestbookList } from "@/components/GuestbookList";
import { GuestbookForm } from "@/components/GuestbookForm";
import { HudCard } from "@/components/HudCard";
import { cn } from "@/lib/utils";

const TOTAL_SLOTS: number = 20;

export const VisitasPage = () => {
  const { selectedChild } = useSelectedChild();
  const [activeTab, setActiveTab] = useState<"approved" | "pending">("approved");
  const [showForm, setShowForm] = useState(false);
  const { data: entries = [] } = useGuestbookEntries(selectedChild?.id);
  const [showInviteModal, setShowInviteModal] = useState(false);

  const pendingCount = entries.filter((entry) => entry.status === "pending").length;
  const approvedCount = entries.filter((entry) => entry.status === "approved").length;
  const slotUsagePercent =
    TOTAL_SLOTS === 0
      ? 0
      : Math.min(100, Math.round((approvedCount / TOTAL_SLOTS) * 100));

  const inviteLink = selectedChild
    ? `https://cofrememoria.app/guestbook/${selectedChild.id}`
    : "";

  const renderTabContent = () => {
    if (!selectedChild) {
      return null;
    }

    if (activeTab === "approved") {
      return (
        <div>
          {showForm && (
            <GuestbookForm childId={selectedChild.id} onClose={() => setShowForm(false)} />
          )}

          <GuestbookList childId={selectedChild.id} status="approved" />
        </div>
      );
    }

    return <GuestbookList childId={selectedChild.id} status="pending" />;
  };

  if (!selectedChild) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-6 text-center">
        <p className="text-[#C9D3C2]">Selecione uma criança primeiro</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-6">
      <h1 className="mb-6 text-center text-3xl font-serif font-bold text-ink">
        Livro de Visitas
      </h1>

      <div className="mb-6 rounded-2xl border border-border bg-surface p-2 shadow-sm">
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
                    "relative flex-1 min-w-[120px] overflow-hidden rounded-2xl px-4 py-2 text-sm font-semibold transition-colors duration-300",
                    isActive
                      ? "text-primary-foreground"
                      : "text-ink-muted hover:text-ink",
                  )}
                >
                  {isActive && (
                    <motion.span
                      layoutId="guestbook-nav-pill"
                      className="absolute inset-0 rounded-2xl bg-primary shadow-[0_10px_24px_rgba(242,153,93,0.28)]"
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
                    {tab.id === "pending" && pendingCount > 0 && (
                      <span className="inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-white/30 px-2 text-[11px] font-semibold text-white">
                        {pendingCount}
                      </span>
                    )}
                  </span>
                </button>
              );
            })}
          </div>
        </LayoutGroup>
      </div>

      <div className="mb-6">
        <HudCard
          title={"HUD \u2022 livro de visitas"}
          value="Mensagens guardadas"
          description={`${approvedCount} de ${TOTAL_SLOTS} slots utilizados`}
          progressPercent={slotUsagePercent}
          actions={
            <>
              <button
                type="button"
                className="inline-flex items-center gap-2 rounded-2xl border border-border px-4 py-2 text-sm font-semibold text-ink transition hover:border-ink hover:text-accent"
              >
                Ampliar para 50
              </button>
              {activeTab === "approved" && (
                <button
                  type="button"
                  onClick={() => setShowForm((state) => !state)}
                  className="inline-flex items-center gap-2 rounded-2xl bg-primary px-6 py-2 font-semibold text-primary-foreground transition hover:opacity-90"
                >
                  <Users className="h-4 w-4" />
                  {showForm ? "Fechar formulário" : "Deixar mensagem"}
                </button>
              )}
              <button
                type="button"
                onClick={() => setShowInviteModal(true)}
                className="inline-flex items-center gap-2 rounded-2xl border border-border px-6 py-2 text-sm font-semibold text-ink transition hover:border-ink hover:text-accent"
              >
                <MessageCircle className="h-4 w-4" />
                Convidar
              </button>
            </>
          }
        />
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

      {showInviteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 px-4">
          <div className="w-full max-w-md rounded-2xl border border-border bg-surface p-6 shadow-2xl">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-ink-muted">
                  Convide para deixar uma mensagem
                </p>
                <h2 className="mt-1 font-serif text-xl text-ink">
                  Envie o livro de visitas
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setShowInviteModal(false)}
                className="rounded-full border border-border p-1 text-ink-muted transition hover:border-ink hover:text-ink"
                aria-label="Fechar"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="mt-6 rounded-[24px] border border-border bg-muted/10 p-6 text-center">
              <div className="mx-auto flex h-32 w-32 items-center justify-center rounded-2xl bg-surface shadow-inner">
                <span className="text-sm font-semibold text-ink-muted">QR</span>
              </div>
              <p className="mt-3 text-xs uppercase tracking-[0.3em] text-ink-muted">
                Escaneie o QR Code para acessar
              </p>
            </div>
            <div className="mt-6 flex flex-wrap items-center gap-2 rounded-[24px] border border-border bg-surface px-3 py-2 text-sm font-semibold text-ink">
              <span className="flex-1 truncate">{inviteLink}</span>
              <button
                type="button"
                className="rounded-full border border-border px-3 py-1 text-xs text-ink transition hover:border-ink"
                onClick={() => inviteLink && navigator.clipboard?.writeText(inviteLink)}
              >
                Copiar
              </button>
            </div>
            <div className="mt-4 grid gap-2 sm:grid-cols-2">
              <button
                type="button"
                className="inline-flex items-center justify-center gap-2 rounded-[20px] border border-border px-3 py-2 text-sm font-semibold text-ink transition hover:border-ink hover:text-accent"
                onClick={() => {
                  if (!inviteLink) return;
                  const message = encodeURIComponent(
                    `Deixe uma mensagem no livro de visitas ${selectedChild?.name}: ${inviteLink}`,
                  );
                  window.open(`https://wa.me/?text=${message}`, "_blank");
                }}
              >
                <MessageCircle className="h-4 w-4" />
                WhatsApp
              </button>
              <button
                type="button"
                className="inline-flex items-center justify-center gap-2 rounded-[20px] border border-border px-3 py-2 text-sm font-semibold text-ink transition hover:border-ink hover:text-accent"
                onClick={() => {
                  if (!inviteLink) return;
                  const subject = encodeURIComponent("Convite para deixar mensagem");
                  const body = encodeURIComponent(
                    `Olá! Você foi convidado a deixar uma mensagem no livro de visitas ${selectedChild?.name}: ${inviteLink}`,
                  );
                  window.location.href = `mailto:?subject=${subject}&body=${body}`;
                }}
              >
                <Mail className="h-4 w-4" />
                E-mail
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
