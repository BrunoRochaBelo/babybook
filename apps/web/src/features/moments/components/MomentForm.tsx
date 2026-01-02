import { useEffect, useMemo, useState, type FormEvent } from "react";
import { X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { MediaUploader } from "./MediaUploader";
import { Button } from "@/components/ui/button";
import { useCreateMoment } from "@/hooks/api";
import type { MomentTemplate } from "../hooks/useMomentTemplate";
import { StampGenerator } from "./StampGenerator";
import { useTranslation } from "@babybook/i18n";

type MediaKind = "photo" | "video" | "audio";

type MomentAudience = "b2c" | "b2b";

type TranslateFn = (key: string, options?: Record<string, unknown>) => string;

const fileKind = (file: File): MediaKind => {
  if (file.type.startsWith("image/")) return "photo";
  if (file.type.startsWith("video/")) return "video";
  return "audio";
};

const countKinds = (files: File[]) => {
  let photos = 0;
  let videos = 0;
  let audios = 0;

  for (const f of files) {
    const kind = fileKind(f);
    if (kind === "photo") photos += 1;
    else if (kind === "video") videos += 1;
    else audios += 1;
  }

  return { photos, videos, audios };
};

const notesSuggestOptional = (notes?: string[]) =>
  (notes ?? []).some((n) => n.toLowerCase().includes("opcional"));

const readMediaDurationSeconds = (file: File): Promise<number | null> => {
  // Em SSR/testes sem DOM, não dá para ler metadata.
  if (typeof document === "undefined") return Promise.resolve(null);

  const kind = fileKind(file);
  if (kind !== "video" && kind !== "audio") return Promise.resolve(null);

  return new Promise((resolve) => {
    const el = document.createElement(kind === "video" ? "video" : "audio");
    el.preload = "metadata";

    const url = URL.createObjectURL(file);
    const cleanup = () => {
      URL.revokeObjectURL(url);
      // Garante que o elemento não “segure” o blob.
      el.removeAttribute("src");
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (el as any).load?.();
      } catch {
        // ignore
      }
    };

    const finalize = (value: number | null) => {
      cleanup();
      resolve(value);
    };

    el.onloadedmetadata = () => {
      const duration = Number.isFinite(el.duration) ? el.duration : null;
      finalize(duration);
    };
    el.onerror = () => finalize(null);

    el.src = url;
  });
};

const getMaxSecondsForKind = (
  media: MomentTemplate["media"] | null | undefined,
  kind: MediaKind,
): number | null => {
  if (!media) return null;

  // Regra “vídeo OU áudio” aplica para ambos.
  if (media.videoOrAudio && (kind === "video" || kind === "audio")) {
    return typeof media.videoOrAudio.maxSeconds === "number"
      ? media.videoOrAudio.maxSeconds
      : null;
  }

  if (kind === "video" && media.video) {
    return typeof media.video.maxSeconds === "number"
      ? media.video.maxSeconds
      : null;
  }
  if (kind === "audio" && media.audio) {
    return typeof media.audio.maxSeconds === "number"
      ? media.audio.maxSeconds
      : null;
  }

  return null;
};

const isRuleRequired = (
  rule?: { required?: boolean } | null,
  notes?: string[],
): boolean => {
  if (!rule) return false;
  if (typeof rule.required === "boolean") return rule.required;
  // Se não foi marcado explicitamente, assume obrigatório exceto se as notas indicarem opcional.
  return !notesSuggestOptional(notes);
};

const buildAccept = (media?: MomentTemplate["media"] | null) => {
  if (!media) return "image/*,video/*,audio/*";

  const allowPhoto = Boolean(media.photos);
  const allowVideo = Boolean(media.video) || Boolean(media.videoOrAudio);
  const allowAudio = Boolean(media.audio) || Boolean(media.videoOrAudio);

  const accepts: string[] = [];
  if (allowPhoto) accepts.push("image/*");
  if (allowVideo) accepts.push("video/*");
  if (allowAudio) accepts.push("audio/*");

  return accepts.length > 0 ? accepts.join(",") : "image/*,video/*,audio/*";
};

const buildHelperText = (
  media: MomentTemplate["media"] | null | undefined,
  files: File[],
  t: TranslateFn,
) => {
  const counts = countKinds(files);

  if (!media) {
    return t("b2c.moments.form.media.helper.generic", {
      count: counts.photos + counts.videos + counts.audios,
    });
  }

  const parts: string[] = [];
  if (media.photos) {
    const min = media.photos.min ?? 0;
    const max = media.photos.max ?? 0;
    const range = min > 0 ? `${min}–${max}` : `até ${max}`;
    parts.push(
      t("b2c.moments.form.media.helper.photos", {
        current: counts.photos,
        max,
        range,
      }),
    );
  }

  if (media.videoOrAudio) {
    const max = media.videoOrAudio.max ?? 1;
    const required = isRuleRequired(media.videoOrAudio, media.notes);
    const secs = media.videoOrAudio.maxSeconds
      ? t("b2c.moments.form.media.helper.secondsSuffix", {
          seconds: media.videoOrAudio.maxSeconds,
        })
      : "";
    const current = counts.videos + counts.audios;
    parts.push(
      t("b2c.moments.form.media.helper.videoOrAudio", {
        current,
        max,
        secondsSuffix: secs,
        requiredSuffix: required
          ? t("b2c.moments.form.media.helper.requiredSuffix")
          : "",
      }),
    );
  } else {
    if (media.video) {
      const max = media.video.max ?? 1;
      const required = isRuleRequired(media.video, media.notes);
      const secs = media.video.maxSeconds
        ? t("b2c.moments.form.media.helper.secondsSuffix", {
            seconds: media.video.maxSeconds,
          })
        : "";
      parts.push(
        t("b2c.moments.form.media.helper.video", {
          current: counts.videos,
          max,
          secondsSuffix: secs,
          requiredSuffix: required
            ? t("b2c.moments.form.media.helper.requiredSuffix")
            : "",
        }),
      );
    }
    if (media.audio) {
      const max = media.audio.max ?? 1;
      const required = isRuleRequired(media.audio, media.notes);
      parts.push(
        t("b2c.moments.form.media.helper.audio", {
          current: counts.audios,
          max,
          requiredSuffix: required
            ? t("b2c.moments.form.media.helper.requiredSuffix")
            : "",
        }),
      );
    }
  }

  return parts.join(" · ");
};

interface MomentFormProps {
  childId: string;
  template?: MomentTemplate | null;
  audience?: MomentAudience;
  onSuccess?: () => void;
}

type FieldErrors = Record<string, string | null>;

const isBlank = (value: unknown) => {
  if (value === null || value === undefined) return true;
  if (Array.isArray(value)) return value.length === 0;
  if (typeof value === "string") return value.trim().length === 0;
  return false;
};

const toTags = (raw: string) =>
  raw
    .split(",")
    .map((p) => p.trim())
    .filter(Boolean);

export const MomentForm = ({
  childId,
  template,
  audience = "b2c",
  onSuccess,
}: MomentFormProps) => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [title, setTitle] = useState("");
  const [summary, setSummary] = useState("");
  const [occurredAt, setOccurredAt] = useState(
    new Date().toISOString().split("T")[0],
  );
  const [mediaFiles, setMediaFiles] = useState<File[]>([]);
  const [mediaError, setMediaError] = useState<string | null>(null);
  const [fieldValues, setFieldValues] = useState<Record<string, unknown>>({});
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const { mutate: createMoment, isPending } = useCreateMoment();

  const effectiveMedia = useMemo(() => {
    if (!template?.media) return null;
    if (audience === "b2b" && template.mediaB2B) return template.mediaB2B;
    return template.media;
  }, [audience, template]);

  const accept = useMemo(() => buildAccept(effectiveMedia), [effectiveMedia]);
  const helperText = useMemo(
    () => buildHelperText(effectiveMedia, mediaFiles, t),
    [effectiveMedia, mediaFiles, t],
  );

  useEffect(() => {
    if (template) {
      setTitle(template.title);
      const defaults = template.defaults ?? {};
      const next: Record<string, unknown> = { ...defaults };
      for (const field of template.fields ?? []) {
        if (next[field.key] !== undefined) {
          continue;
        }
        if (field.type === "tags") {
          next[field.key] = [];
        } else {
          next[field.key] = "";
        }
      }
      setFieldValues(next);
      setFieldErrors({});
    }
  }, [template]);

  const validateFields = () => {
    const fields = template?.fields ?? [];
    if (fields.length === 0) {
      setFieldErrors({});
      return true;
    }

    const nextErrors: FieldErrors = {};
    for (const field of fields) {
      if (!field.required) {
        nextErrors[field.key] = null;
        continue;
      }

      const value = fieldValues[field.key];
      if (field.type === "number") {
        const n = typeof value === "number" ? value : Number(value);
        if (!Number.isFinite(n)) {
          nextErrors[field.key] = t("b2c.moments.form.errors.requiredField");
          continue;
        }
      } else if (field.type === "tags") {
        if (!Array.isArray(value) || value.length === 0) {
          nextErrors[field.key] = t("b2c.moments.form.errors.requiredField");
          continue;
        }
      } else if (isBlank(value)) {
        nextErrors[field.key] = t("b2c.moments.form.errors.requiredField");
        continue;
      }

      nextErrors[field.key] = null;
    }

    setFieldErrors(nextErrors);
    return Object.values(nextErrors).every((v) => !v);
  };

  const setField = (key: string, value: unknown) => {
    setFieldValues((prev) => ({ ...prev, [key]: value }));
    setFieldErrors((prev) => ({ ...prev, [key]: null }));
  };

  const validateAgainstTemplate = (files: File[]) => {
    const media = effectiveMedia;
    if (!media) return null;

    const { photos, videos, audios } = countKinds(files);

    if (media.photos) {
      const min = media.photos.min ?? 0;
      const max = media.photos.max ?? 0;
      if (photos > max)
        return t("b2c.moments.form.media.errors.maxPhotosExceeded", { max });
      if (min > 0 && photos < min)
        return t("b2c.moments.form.media.errors.minPhotosRequired", { min });
    }

    if (media.videoOrAudio) {
      const max = media.videoOrAudio.max ?? 1;
      const required = isRuleRequired(media.videoOrAudio, media.notes);
      const combined = videos + audios;
      if (combined > max)
        return t("b2c.moments.form.media.errors.maxVideoOrAudioExceeded", {
          max,
        });
      if (max === 1 && videos > 0 && audios > 0)
        return t("b2c.moments.form.media.errors.chooseOnlyOneVideoOrAudio");
      if (required && combined < 1)
        return t("b2c.moments.form.media.errors.videoOrAudioRequired");
    } else {
      if (media.video) {
        const max = media.video.max ?? 1;
        const required = isRuleRequired(media.video, media.notes);
        if (videos > max)
          return t("b2c.moments.form.media.errors.maxVideosExceeded", { max });
        if (required && videos < 1)
          return t("b2c.moments.form.media.errors.videoRequired");
      }
      if (media.audio) {
        const max = media.audio.max ?? 1;
        const required = isRuleRequired(media.audio, media.notes);
        if (audios > max)
          return t("b2c.moments.form.media.errors.maxAudiosExceeded", { max });
        if (required && audios < 1)
          return t("b2c.moments.form.media.errors.audioRequired");
      }
    }

    return null;
  };

  const handleAddMedia = async (files: File[]) => {
    const media = effectiveMedia;

    // 1) Validação de duração real (se houver maxSeconds na constraint)
    const acceptedByDuration: File[] = [];
    let durationError: string | null = null;

    for (const file of files) {
      const kind = fileKind(file);
      const maxSeconds = getMaxSecondsForKind(media, kind);
      if (!maxSeconds) {
        acceptedByDuration.push(file);
        continue;
      }

      const duration = await readMediaDurationSeconds(file);
      // Se não deu para ler (browser não suportou / erro), não bloqueia.
      if (duration === null) {
        acceptedByDuration.push(file);
        continue;
      }

      // Pequena tolerância para metadata arredondada.
      if (duration > maxSeconds + 0.25) {
        durationError = t("b2c.moments.form.media.errors.maxDurationExceeded", {
          maxSeconds,
          fileName: file.name,
          duration: Math.ceil(duration),
        });
        continue;
      }

      acceptedByDuration.push(file);
    }

    setMediaFiles((prev) => {
      if (!media) {
        const next = [...prev, ...acceptedByDuration];
        if (next.length > 10) {
          setMediaError(t("b2c.moments.form.media.errors.maxItemsGeneric"));
          return prev;
        }
        setMediaError(durationError);
        return next;
      }

      const allowPhoto = Boolean(media.photos);
      const allowVideo = Boolean(media.video) || Boolean(media.videoOrAudio);
      const allowAudio = Boolean(media.audio) || Boolean(media.videoOrAudio);

      const maxPhotos = media.photos?.max ?? 0;
      const maxVideo = media.video?.max ?? 0;
      const maxAudio = media.audio?.max ?? 0;
      const maxVideoOrAudio = media.videoOrAudio?.max ?? 0;

      let temp = [...prev];
      let lastError: string | null = null;

      for (const file of acceptedByDuration) {
        const kind = fileKind(file);

        if (kind === "photo" && !allowPhoto) {
          lastError = t("b2c.moments.form.media.errors.photosNotAllowed");
          continue;
        }
        if (kind === "video" && !allowVideo) {
          lastError = t("b2c.moments.form.media.errors.videosNotAllowed");
          continue;
        }
        if (kind === "audio" && !allowAudio) {
          lastError = t("b2c.moments.form.media.errors.audiosNotAllowed");
          continue;
        }

        const next = [...temp, file];
        const { photos, videos, audios } = countKinds(next);

        if (allowPhoto && maxPhotos > 0 && photos > maxPhotos) {
          lastError = t("b2c.moments.form.media.errors.maxPhotos", {
            max: maxPhotos,
          });
          continue;
        }

        if (media.videoOrAudio) {
          const combined = videos + audios;
          if (maxVideoOrAudio > 0 && combined > maxVideoOrAudio) {
            lastError = t("b2c.moments.form.media.errors.maxVideoOrAudio", {
              max: maxVideoOrAudio,
            });
            continue;
          }
          if (maxVideoOrAudio === 1 && videos > 0 && audios > 0) {
            lastError = t(
              "b2c.moments.form.media.errors.chooseOnlyOneVideoOrAudio",
            );
            continue;
          }
        } else {
          if (allowVideo && maxVideo > 0 && videos > maxVideo) {
            lastError = t("b2c.moments.form.media.errors.maxVideos", {
              max: maxVideo,
            });
            continue;
          }
          if (allowAudio && maxAudio > 0 && audios > maxAudio) {
            lastError = t("b2c.moments.form.media.errors.maxAudios", {
              max: maxAudio,
            });
            continue;
          }
        }

        temp = next;
      }

      setMediaError(
        validateAgainstTemplate(temp) ?? durationError ?? lastError,
      );
      return temp;
    });
  };

  const handleRemoveMedia = (index: number) => {
    setMediaFiles((prev) => {
      const next = prev.filter((_, i) => i !== index);
      setMediaError(validateAgainstTemplate(next));
      return next;
    });
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!title || !occurredAt) {
      return;
    }

    if (!validateFields()) {
      return;
    }

    const validationError = validateAgainstTemplate(mediaFiles);
    if (validationError) {
      setMediaError(validationError);
      return;
    }

    createMoment(
      {
        childId,
        title,
        summary: summary || undefined,
        occurredAt,
        templateKey: template?.templateKey ?? template?.id,
        payload: (() => {
          const payload: Record<string, unknown> = {};

          const hasFields = Boolean(template?.fields?.length);
          if (hasFields) {
            payload.fields = {
              ...(template?.defaults ?? {}),
              ...fieldValues,
            };
          }

          if (mediaFiles.length) {
            payload.media = mediaFiles.map((file) => ({
              id: file.name,
              type: file.type.startsWith("video")
                ? "video"
                : file.type.startsWith("audio")
                  ? "audio"
                  : "image",
              url: URL.createObjectURL(file),
            }));
          }

          return Object.keys(payload).length ? payload : undefined;
        })(),
      },
      {
        onSuccess: () => {
          if (onSuccess) {
            onSuccess();
          } else {
            navigate("/jornada");
          }
        },
      },
    );
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label className="mb-2 block text-sm font-semibold text-[var(--bb-color-ink)]">
          {t("b2c.moments.form.fields.titleLabel")}
        </label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full rounded-xl border-2 px-4 py-2 focus:border-primary focus:outline-none"
          style={{
            backgroundColor: "var(--bb-color-surface)",
            borderColor: "var(--bb-color-border)",
            color: "var(--bb-color-ink)",
          }}
          placeholder={t("b2c.moments.form.fields.titlePlaceholder")}
          required
        />
      </div>

      <div>
        <label className="mb-2 block text-sm font-semibold text-[var(--bb-color-ink)]">
          {t("b2c.moments.form.fields.dateLabel")}
        </label>
        <input
          type="date"
          value={occurredAt}
          onChange={(e) => setOccurredAt(e.target.value)}
          className="w-full rounded-xl border-2 px-4 py-2 focus:border-primary focus:outline-none"
          style={{
            backgroundColor: "var(--bb-color-surface)",
            borderColor: "var(--bb-color-border)",
            color: "var(--bb-color-ink)",
          }}
          required
        />
      </div>

      {template?.fields?.length ? (
        <div className="space-y-4">
          <div>
            <h3 className="text-sm font-semibold text-[var(--bb-color-ink)]">
              {t("b2c.moments.form.sections.details")}
            </h3>
            <p className="mt-1 text-xs text-[var(--bb-color-ink-muted)]">
              {template.prompt}
            </p>
          </div>

          {template.fields
            .filter(
              (f) => template.id !== "marcas-crescimento" || f.key !== "limb",
            )
            .map((field) => {
              const value = fieldValues[field.key];
              const error = fieldErrors[field.key];
              const commonClassName =
                "w-full rounded-xl border-2 px-4 py-2 focus:border-primary focus:outline-none";

              return (
                <div key={field.key}>
                  <label className="mb-2 block text-sm font-semibold text-[var(--bb-color-ink)]">
                    {field.label}
                    {field.required ? " *" : ""}
                  </label>

                  {field.type === "select" ? (
                    <select
                      value={typeof value === "string" ? value : ""}
                      onChange={(e) => setField(field.key, e.target.value)}
                      className={commonClassName}
                      disabled={field.readOnly}
                      style={{
                        backgroundColor: "var(--bb-color-surface)",
                        borderColor: "var(--bb-color-border)",
                        color: "var(--bb-color-ink)",
                      }}
                    >
                      <option value="">{t("common.select")}</option>
                      {(field.options ?? []).map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  ) : field.type === "textarea" || field.type === "richtext" ? (
                    <textarea
                      value={typeof value === "string" ? value : ""}
                      onChange={(e) => setField(field.key, e.target.value)}
                      className={
                        "w-full resize-none rounded-xl border-2 px-4 py-3 focus:border-primary focus:outline-none"
                      }
                      rows={4}
                      placeholder={field.placeholder}
                      readOnly={field.readOnly}
                      style={{
                        backgroundColor: "var(--bb-color-surface)",
                        borderColor: "var(--bb-color-border)",
                        color: "var(--bb-color-ink)",
                      }}
                    />
                  ) : field.type === "number" ? (
                    <input
                      type="number"
                      value={
                        typeof value === "number"
                          ? String(value)
                          : typeof value === "string"
                            ? value
                            : ""
                      }
                      onChange={(e) => {
                        const raw = e.target.value;
                        if (raw === "") {
                          setField(field.key, "");
                          return;
                        }
                        setField(field.key, Number(raw));
                      }}
                      className={commonClassName}
                      placeholder={field.placeholder}
                      min={field.min}
                      max={field.max}
                      readOnly={field.readOnly}
                      style={{
                        backgroundColor: "var(--bb-color-surface)",
                        borderColor: "var(--bb-color-border)",
                        color: "var(--bb-color-ink)",
                      }}
                    />
                  ) : field.type === "tags" ? (
                    <input
                      type="text"
                      value={Array.isArray(value) ? value.join(", ") : ""}
                      onChange={(e) =>
                        setField(field.key, toTags(e.target.value))
                      }
                      className={commonClassName}
                      placeholder={
                        field.placeholder ??
                        t("b2c.moments.form.fields.tagsPlaceholder")
                      }
                      readOnly={field.readOnly}
                      style={{
                        backgroundColor: "var(--bb-color-surface)",
                        borderColor: "var(--bb-color-border)",
                        color: "var(--bb-color-ink)",
                      }}
                    />
                  ) : field.type === "date" ? (
                    <input
                      type="date"
                      value={typeof value === "string" ? value : ""}
                      onChange={(e) => setField(field.key, e.target.value)}
                      className={commonClassName}
                      readOnly={field.readOnly}
                      style={{
                        backgroundColor: "var(--bb-color-surface)",
                        borderColor: "var(--bb-color-border)",
                        color: "var(--bb-color-ink)",
                      }}
                    />
                  ) : field.type === "datetime" ? (
                    <input
                      type="datetime-local"
                      value={typeof value === "string" ? value : ""}
                      onChange={(e) => setField(field.key, e.target.value)}
                      className={commonClassName}
                      readOnly={field.readOnly}
                      style={{
                        backgroundColor: "var(--bb-color-surface)",
                        borderColor: "var(--bb-color-border)",
                        color: "var(--bb-color-ink)",
                      }}
                    />
                  ) : (
                    <input
                      type="text"
                      value={typeof value === "string" ? value : ""}
                      onChange={(e) => setField(field.key, e.target.value)}
                      className={commonClassName}
                      placeholder={field.placeholder}
                      readOnly={field.readOnly}
                      style={{
                        backgroundColor: "var(--bb-color-surface)",
                        borderColor: "var(--bb-color-border)",
                        color: "var(--bb-color-ink)",
                      }}
                    />
                  )}

                  {field.helperText ? (
                    <p className="mt-1 text-xs text-[var(--bb-color-ink-muted)]">
                      {field.helperText}
                    </p>
                  ) : null}

                  {error ? (
                    <p
                      className="mt-1 text-sm font-medium text-[var(--bb-color-danger)]"
                      role="alert"
                    >
                      {error}
                    </p>
                  ) : null}
                </div>
              );
            })}
        </div>
      ) : null}

      <div>
        <label className="mb-2 block text-sm font-semibold text-[var(--bb-color-ink)]">
          {t("b2c.moments.form.fields.summaryLabel")}
        </label>
        <textarea
          value={summary}
          onChange={(e) => setSummary(e.target.value)}
          className="w-full resize-none rounded-xl border-2 px-4 py-3 focus:border-primary focus:outline-none"
          style={{
            backgroundColor: "var(--bb-color-surface)",
            borderColor: "var(--bb-color-border)",
            color: "var(--bb-color-ink)",
          }}
          rows={4}
          placeholder={t("b2c.moments.form.fields.summaryPlaceholder")}
        />
      </div>

      {template?.id === "marcas-crescimento" ? (
        <div className="space-y-6">
          <div className="flex flex-col md:flex-row gap-4">
            <StampGenerator
              type="hand"
              placeholderUrl="/placeholders/hand_stamp.png"
              onSuccess={(file: File) => {
                const renamed = new File([file], "carimbo_mao.png", {
                  type: file.type,
                });
                handleAddMedia([renamed]);
              }}
            />
            <StampGenerator
              type="foot"
              placeholderUrl="/placeholders/foot_stamp.png"
              onSuccess={(file: File) => {
                const renamed = new File([file], "carimbo_pe.png", {
                  type: file.type,
                });
                handleAddMedia([renamed]);
              }}
            />
          </div>

          {mediaFiles.length === 0 && (
            <p className="text-center text-xs text-[var(--bb-color-ink-muted)]">
              {t("b2c.moments.form.stamps.emptyHint")}
            </p>
          )}

          {mediaFiles.length > 0 && (
            <div
              className="mt-4 rounded-2xl border p-4"
              style={{
                backgroundColor: "var(--bb-color-bg)",
                borderColor: "var(--bb-color-border)",
              }}
            >
              <p className="mb-3 text-sm font-bold text-[var(--bb-color-ink)]">
                {t("b2c.moments.form.stamps.readyTitle")}
              </p>
              <div className="grid grid-cols-1 gap-2">
                {mediaFiles.map((file, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between rounded-xl border p-3 shadow-sm"
                    style={{
                      backgroundColor: "var(--bb-color-surface)",
                      borderColor: "var(--bb-color-border)",
                    }}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="flex h-8 w-8 items-center justify-center rounded-lg text-xs"
                        style={{
                          backgroundColor: "var(--bb-color-ink)",
                          color: "var(--bb-color-surface)",
                        }}
                      >
                        {file.name.includes("mao") ? "✋" : "👣"}
                      </div>
                      <span className="text-sm font-medium text-[var(--bb-color-ink)]">
                        {file.name.includes("mao")
                          ? t("b2c.moments.form.stamps.handLabel")
                          : t("b2c.moments.form.stamps.footLabel")}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveMedia(index)}
                      className="group rounded-lg p-2 transition-colors"
                      aria-label={t("common.delete")}
                    >
                      <X className="h-4 w-4 text-[var(--bb-color-ink-muted)] group-hover:text-[var(--bb-color-danger)]" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        <MediaUploader
          mediaFiles={mediaFiles}
          onAddMedia={handleAddMedia}
          onRemoveMedia={handleRemoveMedia}
          accept={accept}
          helperText={helperText}
          error={mediaError}
        />
      )}

      <div className="flex gap-4 pt-4">
        <Button type="submit" disabled={isPending || !title} className="flex-1">
          {isPending
            ? t("b2c.moments.form.saving")
            : t("b2c.moments.form.save")}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => navigate("/jornada")}
          className="flex-1"
        >
          {t("common.cancel")}
        </Button>
      </div>
    </form>
  );
};
