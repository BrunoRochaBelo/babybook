/**
 * GuestbookInvitePage - Public invite landing + form
 *
 * Route: /guestbook/:token
 *
 * Fluxo:
 * - Usuário abre link/QR público
 * - Vê uma explicação curta
 * - Envia nome, e-mail (preenchido se convite foi por e-mail), parentesco, mensagem e mídia opcional
 * - Entrada cai em pendentes para aprovação
 */

import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { motion } from "motion/react";
import {
  ArrowRight,
  MessageCircle,
  ShieldCheck,
  Sparkles,
  Upload,
} from "lucide-react";

import { GuestbookEntry } from "@babybook/contracts";
import {
  useCreateGuestbookEntryFromInvite,
  useGuestbookInvitePublicMeta,
} from "@/hooks/api";
import { uploadMomentMediaFiles } from "@/features/uploads/b2cUpload";
import { useTranslation } from "@babybook/i18n";
import { useRelationshipDegrees } from "@/features/guestbook/relationshipDegree";

export function GuestbookInvitePage() {
  const { t } = useTranslation();
  const { options } = useRelationshipDegrees();
  const { token } = useParams<{ token: string }>();
  const { data: meta, isLoading } = useGuestbookInvitePublicMeta(token);
  const { mutate: createEntry, isPending } =
    useCreateGuestbookEntryFromInvite();

  const [authorName, setAuthorName] = useState("");
  const [authorEmail, setAuthorEmail] = useState("");
  const [relationshipDegree, setRelationshipDegree] = useState<
    GuestbookEntry["relationshipDegree"] | ""
  >("");
  const [message, setMessage] = useState("");
  const [mediaFile, setMediaFile] = useState<File | null>(null);

  const [isUploading, setIsUploading] = useState(false);
  const [uploadPct, setUploadPct] = useState(0);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  const isSubmitting = isPending || isUploading;

  useEffect(() => {
    if (!meta?.invited_email) return;
    setAuthorEmail((prev) =>
      prev.trim().length > 0 ? prev : (meta.invited_email ?? ""),
    );
  }, [meta?.invited_email]);

  const childName = useMemo(() => meta?.child_name || t("b2c.guestbook.invite.titleFallback"), [meta?.child_name, t]);

  const getVideoDurationSeconds = async (file: File): Promise<number> => {
    const url = URL.createObjectURL(file);
    try {
      const duration = await new Promise<number>((resolve, reject) => {
        const video = document.createElement("video");
        video.preload = "metadata";
        video.src = url;
        video.onloadedmetadata = () => resolve(video.duration);
        video.onerror = () =>
          reject(new Error(t("b2c.guestbook.invite.errors.mediaFailed")));
      });
      return duration;
    } finally {
      URL.revokeObjectURL(url);
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!token) return;

    setErrorMsg(null);

    if (!authorName.trim() || !message.trim() || !relationshipDegree) {
      setErrorMsg(t("b2c.guestbook.invite.errors.fillRequired"));
      return;
    }

    try {
      let assetId: string | undefined;

      if (mediaFile && meta?.child_id) {
        if (mediaFile.type.startsWith("video/")) {
          const duration = await getVideoDurationSeconds(mediaFile);
          if (Number.isFinite(duration) && duration > 15) {
            setErrorMsg(
              t("b2c.guestbook.invite.errors.videoTooLong", {
                duration: Math.ceil(duration),
              }),
            );
            return;
          }
        }

        setIsUploading(true);
        setUploadPct(0);
        const uploaded = await uploadMomentMediaFiles({
          childId: meta.child_id,
          files: [mediaFile],
          scope: "guestbook",
          onProgress: ({ overallPct }) => setUploadPct(overallPct),
        });
        assetId = uploaded[0]?.id;
      }

      createEntry(
        {
          token,
          authorName: authorName.trim(),
          authorEmail: authorEmail.trim() || undefined,
          relationshipDegree,
          message: message.trim(),
          assetId,
        },
        {
          onSuccess: () => {
            setSent(true);
            setAuthorName("");
            setMessage("");
            setMediaFile(null);
            setIsUploading(false);
            setUploadPct(0);
          },
          onError: (err) => {
            setErrorMsg(
              err instanceof Error
                ? err.message
                : t("b2c.guestbook.invite.errors.sendFailed"),
            );
            setIsUploading(false);
            setUploadPct(0);
          },
          onSettled: () => {
            setIsUploading(false);
            setUploadPct(0);
          },
        },
      );
    } catch (err) {
      setIsUploading(false);
      setUploadPct(0);
      setErrorMsg(
        err instanceof Error
          ? err.message
          : t("b2c.guestbook.invite.errors.mediaFailed"),
      );
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-pink-50 to-white flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-12 h-12 border-4 border-[var(--bb-color-accent)] border-t-transparent rounded-full"
        />
      </div>
    );
  }

  if (!token || !meta) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-pink-50 to-white flex flex-col items-center justify-center p-6 text-center">
        <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mb-6 shadow">
          <MessageCircle className="w-10 h-10 text-gray-400" />
        </div>
        <h1 className="text-2xl font-serif font-bold text-gray-800 mb-2">
          {t("b2c.guestbook.invite.notFound.title")}
        </h1>
        <p className="text-gray-500 mb-8 max-w-sm">
          {t("b2c.guestbook.invite.notFound.description")}
        </p>
        <Link
          to="/"
          className="px-6 py-3 bg-[var(--bb-color-accent)] text-white rounded-full font-semibold hover:opacity-90 transition"
        >
          {t("b2c.guestbook.invite.notFound.cta")}
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-pink-50 to-white">
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-pink-100">
        <div className="max-w-lg mx-auto px-4 h-14 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-pink-400 to-rose-500 rounded-xl flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <span className="font-serif font-bold text-gray-800">Babybook</span>
          </Link>

          <Link
            to="/register"
            className="text-sm font-semibold text-[var(--bb-color-accent)] hover:underline"
          >
            {t("b2c.guestbook.invite.actions.createMyDiary")}
          </Link>
        </div>
      </header>

      <main className="max-w-lg mx-auto p-4 pt-6 pb-24">
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-pink-100">
          <h1 className="text-2xl font-serif font-bold text-gray-900">
            {t("b2c.guestbook.invite.title", { childName })}
          </h1>

          <p className="mt-2 text-sm text-gray-600">
            {t("b2c.guestbook.invite.description")}
          </p>

          {sent ? (
            <div className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
              <div className="flex items-center gap-2 text-emerald-700 font-semibold">
                <ShieldCheck className="w-5 h-5" />
                {t("b2c.guestbook.invite.sentTitle")}
              </div>
              <p className="mt-2 text-sm text-emerald-700">
                {t("b2c.guestbook.invite.sentDescription")}
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  {t("b2c.guestbook.invite.labels.name")}
                </label>
                <input
                  type="text"
                  required
                  value={authorName}
                  onChange={(e) => setAuthorName(e.target.value)}
                  className="w-full px-3 py-2 border rounded-xl"
                  placeholder={t("b2c.guestbook.invite.placeholders.name")}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  {t("b2c.guestbook.invite.labels.email")}
                </label>
                <input
                  type="email"
                  value={authorEmail}
                  onChange={(e) => setAuthorEmail(e.target.value)}
                  className="w-full px-3 py-2 border rounded-xl"
                  placeholder={t("b2c.guestbook.invite.placeholders.email")}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  {t("b2c.guestbook.invite.labels.relationship")}
                </label>
                <select
                  required
                  value={relationshipDegree}
                  onChange={(e) =>
                    setRelationshipDegree(
                      (e.target.value || "") as
                        | GuestbookEntry["relationshipDegree"]
                        | "",
                    )
                  }
                  className="w-full px-3 py-2 border rounded-xl"
                >
                  <option value="" disabled>
                    {t("b2c.guestbook.invite.placeholders.relationship")}
                  </option>
                  {options.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  {t("b2c.guestbook.invite.labels.message")}
                </label>
                <textarea
                  required
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="w-full px-3 py-2 border rounded-xl"
                  rows={5}
                  placeholder={t("b2c.guestbook.invite.placeholders.message")}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  {t("b2c.guestbook.invite.labels.media")}
                </label>
                <input
                  type="file"
                  accept="image/*,video/*"
                  onChange={(e) => setMediaFile(e.target.files?.[0] ?? null)}
                  className="w-full px-3 py-2 border rounded-xl"
                />
                <p className="mt-2 text-xs text-gray-500">
                  {t("b2c.guestbook.invite.hints.videoLimit")}
                  {isUploading
                    ? ` ${t("b2c.guestbook.invite.hints.uploading", { pct: uploadPct })}`
                    : ""}
                </p>
              </div>

              {errorMsg && (
                <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                  {errorMsg}
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full inline-flex items-center justify-center gap-2 rounded-2xl bg-[var(--bb-color-accent)] text-white px-6 py-3 font-bold shadow-sm transition hover:opacity-90 disabled:opacity-50"
              >
                <Upload className="w-4 h-4" />
                {isSubmitting
                  ? t("b2c.guestbook.invite.actions.submitting")
                  : t("b2c.guestbook.invite.actions.submit")}
              </button>

              <div className="mb-8 flex justify-center">
                <Link
                  to="/register"
                  className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--bb-color-accent)] hover:underline"
                >
                  {t("b2c.guestbook.invite.actions.wantToCreate")}
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </form>
          )}
        </div>
      </main>
    </div>
  );
}
