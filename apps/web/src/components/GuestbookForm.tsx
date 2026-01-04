import { useEffect, useId, useRef, useState } from "react";
import { useCreateGuestbookEntry } from "@/hooks/api";
import { X } from "lucide-react";
import { uploadMomentMediaFiles } from "@/features/uploads/b2cUpload";
import { useTranslation } from "@babybook/i18n";
import { useRelationshipDegrees } from "@/features/guestbook/relationshipDegree";
import { GuestbookEntry } from "@babybook/contracts";

interface GuestbookFormProps {
  childId: string;
  onClose: () => void;
}

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])';

export const GuestbookForm = ({ childId, onClose }: GuestbookFormProps) => {
  const { t } = useTranslation();
  const { options } = useRelationshipDegrees();
  const [authorName, setAuthorName] = useState("");
  const [authorEmail, setAuthorEmail] = useState("");
  const [relationshipDegree, setRelationshipDegree] = useState<
    GuestbookEntry["relationshipDegree"] | ""
  >("");
  const [message, setMessage] = useState("");
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [uploadPct, setUploadPct] = useState<number>(0);
  const [isUploading, setIsUploading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const { mutate: createEntry, isPending } = useCreateGuestbookEntry();
  const dialogRef = useRef<HTMLDivElement | null>(null);
  const nameInputRef = useRef<HTMLInputElement | null>(null);
  const titleId = useId();
  const descriptionId = useId();

  const isSubmitting = isPending || isUploading;

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

  useEffect(() => {
    nameInputRef.current?.focus();
  }, []);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
        return;
      }

      if (event.key === "Tab" && dialogRef.current) {
        const focusable = Array.from(
          dialogRef.current.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR),
        ).filter((element) => !element.hasAttribute("disabled"));

        if (focusable.length === 0) {
          return;
        }

        const firstElement = focusable[0];
        const lastElement = focusable[focusable.length - 1];
        const activeElement = document.activeElement as HTMLElement | null;

        if (event.shiftKey && activeElement === firstElement) {
          event.preventDefault();
          lastElement.focus();
        } else if (!event.shiftKey && activeElement === lastElement) {
          event.preventDefault();
          firstElement.focus();
        }
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setErrorMsg(null);
    if (!authorName || !message || !relationshipDegree) {
      return;
    }

    try {
      let assetId: string | undefined;

      if (mediaFile) {
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
          childId,
          files: [mediaFile],
          scope: "guestbook",
          onProgress: ({ overallPct }) => setUploadPct(overallPct),
        });
        assetId = uploaded[0]?.id;
      }

      createEntry(
        {
          childId,
          authorName,
          authorEmail: authorEmail || undefined,
          relationshipDegree,
          message,
          assetId,
        },
        {
          onSuccess: () => {
            setAuthorName("");
            setAuthorEmail("");
            setRelationshipDegree("");
            setMessage("");
            setMediaFile(null);
            onClose();
          },
          onError: (err) => {
            setErrorMsg(
              err instanceof Error
                ? err.message
                : t("b2c.guestbook.invite.errors.sendFailed"),
            );
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

  return (
    <div
      className="fixed inset-0 flex items-center justify-center p-4 z-50"
      style={{ backgroundColor: "rgba(42, 42, 42, 0.5)" }}
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
        className="rounded-2xl p-6 w-full max-w-md shadow-2xl"
        style={{
          backgroundColor: "var(--bb-color-surface)",
        }}
      >
        <div className="flex justify-between items-center mb-4">
          <h3
            id={titleId}
            className="text-lg font-bold"
            style={{ color: "var(--bb-color-ink)" }}
          >
            {t("b2c.guestbook.form.title")}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg transition-colors"
            style={{ color: "var(--bb-color-ink)" }}
            aria-label={t("b2c.guestbook.form.aria.close")}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              className="block text-sm font-semibold mb-2"
              htmlFor="guestbook-name"
              style={{ color: "var(--bb-color-ink)" }}
            >
              {t("b2c.guestbook.form.labels.name")}
            </label>
            <input
              id="guestbook-name"
              type="text"
              value={authorName}
              onChange={(event) => setAuthorName(event.target.value)}
              className="w-full px-3 py-2 border rounded-xl"
              style={{
                backgroundColor: "var(--bb-color-surface)",
                borderColor: "var(--bb-color-border)",
                color: "var(--bb-color-ink)",
              }}
              placeholder={t("b2c.guestbook.form.placeholders.name")}
              ref={nameInputRef}
              required
            />
          </div>

          <div>
            <label
              className="block text-sm font-semibold mb-2"
              htmlFor="guestbook-email"
              style={{ color: "var(--bb-color-ink)" }}
            >
              {t("b2c.guestbook.form.labels.email")}
            </label>
            <input
              id="guestbook-email"
              type="email"
              value={authorEmail}
              onChange={(event) => setAuthorEmail(event.target.value)}
              className="w-full px-3 py-2 border rounded-xl"
              style={{
                backgroundColor: "var(--bb-color-surface)",
                borderColor: "var(--bb-color-border)",
                color: "var(--bb-color-ink)",
              }}
              placeholder={t("b2c.guestbook.form.placeholders.email")}
            />
          </div>

          <div>
            <label
              className="block text-sm font-semibold mb-2"
              htmlFor="guestbook-relationship"
              style={{ color: "var(--bb-color-ink)" }}
            >
              {t("b2c.guestbook.form.labels.relationship")}
            </label>
            <select
              id="guestbook-relationship"
              value={relationshipDegree}
              onChange={(event) =>
                setRelationshipDegree(
                  (event.target.value || "") as
                    | GuestbookEntry["relationshipDegree"]
                    | "",
                )
              }
              className="w-full px-3 py-2 border rounded-xl"
              style={{
                backgroundColor: "var(--bb-color-surface)",
                borderColor: "var(--bb-color-border)",
                color: "var(--bb-color-ink)",
              }}
              required
            >
              <option value="" disabled>
                {t("b2c.guestbook.form.placeholders.relationship")}
              </option>
              {options.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              className="block text-sm font-semibold mb-2"
              htmlFor="guestbook-media"
              style={{ color: "var(--bb-color-ink)" }}
            >
              {t("b2c.guestbook.form.labels.media")}
            </label>
            <input
              id="guestbook-media"
              type="file"
              accept="image/*,video/*"
              onChange={(event) => {
                const file = event.target.files?.[0] ?? null;
                setMediaFile(file);
                setErrorMsg(null);
              }}
              className="w-full px-3 py-2 border rounded-xl"
              style={{
                backgroundColor: "var(--bb-color-surface)",
                borderColor: "var(--bb-color-border)",
                color: "var(--bb-color-ink)",
              }}
            />
            <p
              className="mt-2 text-xs"
              style={{ color: "var(--bb-color-ink-muted)" }}
            >
              {t("b2c.guestbook.form.hints.videoLimit")}
            </p>
            {isUploading && (
              <p
                className="mt-2 text-xs"
                style={{ color: "var(--bb-color-ink-muted)" }}
              >
                {t("b2c.guestbook.form.hints.uploadingAttachment", { pct: uploadPct })}
              </p>
            )}
          </div>

          {errorMsg && (
            <div
              className="border rounded-lg p-3"
              style={{
                backgroundColor: "rgba(239,68,68,0.08)",
                borderColor: "rgba(239,68,68,0.35)",
              }}
            >
              <p className="text-xs" style={{ color: "var(--bb-color-ink)" }}>
                {errorMsg}
              </p>
            </div>
          )}

          <div>
            <label
              className="block text-sm font-semibold mb-2"
              htmlFor="guestbook-message"
              style={{ color: "var(--bb-color-ink)" }}
            >
              {t("b2c.guestbook.form.labels.message")}
            </label>
            <textarea
              id="guestbook-message"
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              className="w-full px-3 py-2 border rounded-xl"
              style={{
                backgroundColor: "var(--bb-color-surface)",
                borderColor: "var(--bb-color-border)",
                color: "var(--bb-color-ink)",
              }}
              rows={5}
              placeholder={t("b2c.guestbook.form.placeholders.message")}
              required
            />
          </div>

          <div
            className="border rounded-lg p-3"
            id={descriptionId}
            style={{
              backgroundColor: "var(--bb-color-accent-soft)",
              borderColor: "var(--bb-color-accent)",
            }}
          >
            <p className="text-xs" style={{ color: "var(--bb-color-ink)" }}>
              {t("b2c.guestbook.form.hints.moderation")}
            </p>
          </div>

          <div className="flex gap-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 px-6 py-2 rounded-xl font-semibold hover:opacity-90 disabled:opacity-50 transition-all"
              style={{
                backgroundColor: "var(--bb-color-accent)",
                color: "var(--bb-color-surface)",
              }}
            >
              {isSubmitting
                ? t("b2c.guestbook.form.actions.submitting")
                : t("b2c.guestbook.form.actions.submit")}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-2 rounded-xl font-semibold hover:opacity-80 transition-all"
              style={{
                backgroundColor: "var(--bb-color-muted)",
                color: "var(--bb-color-ink)",
              }}
            >
              {t("b2c.guestbook.form.actions.cancel")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
