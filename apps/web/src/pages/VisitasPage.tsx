import { useEffect, useState } from "react";
import {
  Users,
  CheckCircle,
  MessageCircle,
  Mail,
  X,
  Baby,
  UserPlus,
  ArrowUpCircle,
} from "lucide-react";
import { AnimatePresence, LayoutGroup, motion } from "motion/react";
import { useTranslation } from "@babybook/i18n";
import { useSelectedChild } from "@/hooks/useSelectedChild";
import { useCreateGuestbookInvite, useGuestbookEntries } from "@/hooks/api";
import { toast } from "sonner";
import { GuestbookList } from "@/components/GuestbookList";
import { GuestbookForm } from "@/components/GuestbookForm";
import { HudCard } from "@/components/HudCard";
import { B2CActionBar } from "@/components/B2CActionBar";
import { B2CButton } from "@/components/B2CButton";
import { B2CEmptyState, B2CErrorState } from "@/layouts/b2cStates";
import { GuestbookSkeleton } from "@/components/skeletons/GuestbookSkeleton";
import { GuestbookFamilyTree } from "@/features/guestbook/GuestbookFamilyTree";
import { QRCodeSVG } from "qrcode.react";

const TOTAL_SLOTS: number = 20;

export const VisitasPage = () => {
  const { t } = useTranslation();
  const { selectedChild } = useSelectedChild();
  const {
    data: entries = [],
    isLoading,
    isError,
    error,
    refetch,
  } = useGuestbookEntries(selectedChild?.id);
  const [activeTab, setActiveTab] = useState<"approved" | "pending">(
    "approved",
  );
  const [showForm, setShowForm] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);

  useEffect(() => {
    if (activeTab === "pending") {
      setShowForm(false);
    }
  }, [activeTab]);

  const [invitedEmail, setInvitedEmail] = useState("");
  const [inviteUrl, setInviteUrl] = useState<string>("");
  const [inviteError, setInviteError] = useState<string | null>(null);
  const { mutate: createInvite, isPending: isCreatingInvite } =
    useCreateGuestbookInvite();

  const pendingCount = entries.filter(
    (entry) => entry.status === "pending",
  ).length;
  const approvedCount = entries.filter(
    (entry) => entry.status === "approved",
  ).length;
  const slotUsagePercent =
    TOTAL_SLOTS === 0
      ? 0
      : Math.min(100, Math.round((approvedCount / TOTAL_SLOTS) * 100));

  useEffect(() => {
    if (!showInviteModal || !selectedChild) return;

    setInviteError(null);
    createInvite(
      { childId: selectedChild.id },
      {
        onSuccess: (data) => setInviteUrl(data.url),
        onError: (err) =>
          setInviteError(
            err instanceof Error
              ? err.message
              : t("b2c.guestbook.invite.modal.errorGenerate"),
          ),
      },
    );
  }, [showInviteModal, selectedChild, createInvite, t]);

  if (isLoading) {
    return <GuestbookSkeleton />;
  }

  if (isError) {
    return (
      <B2CErrorState
        title={t("b2c.errors.guestbookLoadTitle")}
        description={t("b2c.errors.guestbookLoadDesc")}
        errorDetails={error?.message}
        onRetry={() => refetch()}
        skeleton={<GuestbookSkeleton />}
      />
    );
  }

  const renderTabContent = () => {
    if (!selectedChild) {
      return null;
    }

    if (activeTab === "approved") {
      return (
        <div>
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
      <B2CEmptyState
        variant="page"
        icon={Baby}
        title={t("b2c.common.selectChildTitle")}
        description={t("b2c.common.selectChildDesc")}
        primaryAction={{
          label: t("b2c.common.goToChildProfile"),
          to: "/jornada/perfil-crianca",
        }}
      />
    );
  }

  return (
    <motion.div
      className="mx-auto max-w-4xl px-4 py-6"
      initial="hidden"
      animate="visible"
      variants={{
        hidden: { opacity: 0 },
        visible: {
          opacity: 1,
          transition: {
            staggerChildren: 0.1,
            delayChildren: 0.1,
          },
        },
      }}
    >
      <motion.div
        className="mb-8 mt-2 px-2"
        variants={{
          hidden: { opacity: 0, y: 20 },
          visible: {
            opacity: 1,
            y: 0,
            transition: { type: "spring", stiffness: 300, damping: 24 },
          },
        }}
      >
        <h1 className="text-4xl md:text-5xl font-medium tracking-tight">
          {t("b2c.guestbook.title")}
        </h1>
        <p className="mt-2 text-lg opacity-60 font-medium max-w-lg">
          {t("b2c.guestbook.description")}
        </p>
      </motion.div>

      <div
        className="mb-8 rounded-2xl border p-1.5 shadow-sm"
        style={{
          backgroundColor: "var(--bb-color-surface)",
          borderColor: "var(--bb-color-border)",
        }}
      >
        <LayoutGroup id="guestbook-tabs">
          <div className="flex flex-wrap gap-1.5">
            {[
              { id: "approved", icon: CheckCircle, label: t("b2c.guestbook.tabs.approved") },
              { id: "pending", icon: Users, label: t("b2c.guestbook.tabs.pending") },
            ].map((tab) => {
              const isActive = activeTab === tab.id;
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id as "approved" | "pending")}
                  className="relative flex-1 min-w-[140px] overflow-hidden rounded-2xl px-4 py-1.5 text-sm font-semibold transition-colors duration-300"
                  style={{
                    color: isActive
                      ? "var(--bb-color-surface)"
                      : "var(--bb-color-ink-muted)",
                  }}
                >
                  {isActive && (
                    <motion.span
                      layoutId="guestbook-nav-pill"
                      className="absolute inset-0 rounded-2xl"
                      style={{
                        backgroundColor: "var(--bb-color-accent)",
                        boxShadow: "0 8px 20px rgba(242,153,93,0.2)",
                      }}
                      transition={{
                        type: "spring",
                        stiffness: 320,
                        damping: 30,
                      }}
                    />
                  )}
                  <span className="relative z-10 inline-flex items-center justify-center gap-2">
                    <Icon
                      className="h-4 w-4 transition-colors duration-300"
                      style={{
                        color: isActive
                          ? "var(--bb-color-surface)"
                          : "var(--bb-color-ink-muted)",
                      }}
                    />
                    {tab.label}
                    {tab.id === "pending" && pendingCount > 0 && (
                      <span
                        className="inline-flex h-5 min-w-[20px] items-center justify-center rounded-full px-2 text-[11px] font-semibold"
                        style={{
                          backgroundColor: "rgba(255,255,255,0.3)",
                          color: "var(--bb-color-surface)",
                        }}
                      >
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

      <div className="mb-8">
        <HudCard
          title={t("b2c.guestbook.hud.title")}
          value={t("b2c.guestbook.hud.subtitle")}
          description={t("b2c.guestbook.hud.description", {
            count: approvedCount,
            total: TOTAL_SLOTS,
          })}
          progressPercent={slotUsagePercent}
          actions={
            <>
              <B2CButton variant="secondary" size="sm">
                <ArrowUpCircle className="h-4 w-4" />
                {t("b2c.guestbook.hud.actions.expand")}
              </B2CButton>
            </>
          }
        />
      </div>

      {activeTab === "approved" && (
        <div className="mb-8">
          <GuestbookFamilyTree
            childName={selectedChild.name}
            entries={entries}
          />
        </div>
      )}

      <B2CActionBar>
        {activeTab === "approved" && (
          <B2CButton
            variant="primary"
            onClick={() => setShowForm((state) => !state)}
          >
            <Users className="h-4 w-4" />
            {showForm ? t("b2c.guestbook.actions.closeForm") : t("b2c.guestbook.actions.leaveMessage")}
          </B2CButton>
        )}

        <B2CButton variant="secondary" onClick={() => setShowInviteModal(true)}>
          <UserPlus className="h-4 w-4" />
          {t("b2c.guestbook.actions.invite")}
        </B2CButton>
      </B2CActionBar>

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
        <div
          className="fixed inset-0 z-50 flex items-center justify-center px-4"
          style={{ backgroundColor: "rgba(42, 42, 42, 0.4)" }}
        >
          <div
            className="w-full max-w-md rounded-2xl border p-6 shadow-2xl"
            style={{
              backgroundColor: "var(--bb-color-surface)",
              borderColor: "var(--bb-color-border)",
            }}
          >
            <div className="flex items-start justify-between">
              <div>
                <p
                  className="text-xs uppercase tracking-[0.3em]"
                  style={{ color: "var(--bb-color-ink-muted)" }}
                >
                  {t("b2c.guestbook.invite.modal.label")}
                </p>
                <h2 className="mt-1 text-xl">
                  {t("b2c.guestbook.invite.modal.title")}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setShowInviteModal(false)}
                className="rounded-full border p-1 transition"
                style={{
                  borderColor: "var(--bb-color-border)",
                  color: "var(--bb-color-ink-muted)",
                }}
                aria-label={t("b2c.guestbook.list.aria.close")}
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div
              className="mt-6 rounded-[24px] border p-6 text-center"
              style={{
                backgroundColor: "var(--bb-color-muted)",
                borderColor: "var(--bb-color-border)",
                opacity: 0.1,
              }}
            >
              <div
                className="mx-auto flex h-32 w-32 items-center justify-center rounded-2xl shadow-inner"
                style={{ backgroundColor: "var(--bb-color-surface)" }}
              >
                {inviteUrl ? (
                  <QRCodeSVG
                    value={inviteUrl}
                    size={120}
                    level="M"
                    includeMargin={false}
                    fgColor="#1f2937"
                  />
                ) : (
                  <span
                    className="text-sm font-semibold"
                    style={{ color: "var(--bb-color-ink-muted)" }}
                  >
                    {isCreatingInvite ? t("b2c.guestbook.invite.modal.generating") : "QR"}
                  </span>
                )}
              </div>
              <p
                className="mt-3 text-xs uppercase tracking-[0.3em]"
                style={{ color: "var(--bb-color-ink-muted)" }}
              >
                {t("b2c.guestbook.invite.modal.qrLabel")}
              </p>
            </div>

            <div className="mt-4">
              <label
                className="block text-xs font-semibold mb-2"
                htmlFor="guestbook-invited-email"
                style={{ color: "var(--bb-color-ink-muted)" }}
              >
                {t("b2c.guestbook.invite.modal.emailLabel")}
              </label>
              <input
                id="guestbook-invited-email"
                type="email"
                value={invitedEmail}
                onChange={(event) => setInvitedEmail(event.target.value)}
                placeholder={t("b2c.guestbook.invite.modal.emailPlaceholder")}
                className="w-full px-3 py-2 border rounded-xl"
                style={{
                  backgroundColor: "var(--bb-color-surface)",
                  borderColor: "var(--bb-color-border)",
                  color: "var(--bb-color-ink)",
                }}
              />
              <div className="mt-2 flex gap-2">
                <button
                  type="button"
                  disabled={!selectedChild || isCreatingInvite}
                  className="flex-1 rounded-[20px] border px-3 py-2 text-sm font-semibold transition disabled:opacity-50"
                  style={{
                    borderColor: "var(--bb-color-border)",
                    color: "var(--bb-color-ink)",
                  }}
                  onClick={() => {
                    if (!selectedChild) return;
                    setInviteError(null);
                    createInvite(
                      {
                        childId: selectedChild.id,
                        invitedEmail: invitedEmail.trim() || undefined,
                      },
                      {
                        onSuccess: (data) => setInviteUrl(data.url),
                        onError: (err) =>
                          setInviteError(
                            err instanceof Error
                              ? err.message
                              : t("b2c.guestbook.invite.modal.errorGenerate"),
                          ),
                      },
                    );
                  }}
                >
                  {isCreatingInvite ? t("b2c.guestbook.invite.modal.generating") : (inviteUrl ? t("b2c.guestbook.invite.modal.updateAction") : t("b2c.guestbook.invite.modal.generateAction"))}
                </button>
              </div>
              {inviteError && (
                <p className="mt-2 text-xs" style={{ color: "rgb(239,68,68)" }}>
                  {inviteError}
                </p>
              )}
            </div>
            <div
              className="mt-6 flex flex-wrap items-center gap-2 rounded-[24px] border px-3 py-2 text-sm font-semibold"
              style={{
                backgroundColor: "var(--bb-color-surface)",
                borderColor: "var(--bb-color-border)",
                color: "var(--bb-color-ink)",
              }}
            >
              <span className="flex-1 truncate">{inviteUrl || ""}</span>
              <button
                type="button"
                className="rounded-full border px-3 py-1 text-xs transition"
                style={{
                  borderColor: "var(--bb-color-border)",
                  color: "var(--bb-color-ink)",
                }}
                onClick={() => {
                  if (inviteUrl) {
                    navigator.clipboard?.writeText(inviteUrl);
                    toast.success(t("b2c.guestbook.invite.modal.copied"));
                  }
                }}
              >
                {t("b2c.guestbook.invite.modal.copyAction")}
              </button>
            </div>
            <div className="mt-4 grid gap-2 sm:grid-cols-2">
              <button
                type="button"
                className="inline-flex items-center justify-center gap-2 rounded-[20px] border px-3 py-2 text-sm font-semibold transition"
                style={{
                  borderColor: "var(--bb-color-border)",
                  color: "var(--bb-color-ink)",
                }}
                onClick={() => {
                  if (!inviteUrl) return;
                  const message = encodeURIComponent(
                    t("b2c.guestbook.invite.shareMessage", { childName: selectedChild?.name, url: inviteUrl })
                  );
                  window.open(`https://wa.me/?text=${message}`, "_blank");
                }}
              >
                <MessageCircle className="h-4 w-4" />
                {t("b2c.guestbook.invite.modal.whatsapp")}
              </button>
              <button
                type="button"
                className="inline-flex items-center justify-center gap-2 rounded-[20px] border px-3 py-2 text-sm font-semibold transition"
                style={{
                  borderColor: "var(--bb-color-border)",
                  color: "var(--bb-color-ink)",
                }}
                onClick={() => {
                  if (!inviteUrl) return;
                  const subject = encodeURIComponent(
                    t("b2c.guestbook.invite.shareSubject")
                  );
                  const body = encodeURIComponent(
                    t("b2c.guestbook.invite.shareMessage", { childName: selectedChild?.name, url: inviteUrl })
                  );
                  const recipient = invitedEmail.trim();
                  window.location.href = `mailto:${recipient}?subject=${subject}&body=${body}`;
                }}
              >
                <Mail className="h-4 w-4" />
                {t("b2c.guestbook.invite.modal.email")}
              </button>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
};
