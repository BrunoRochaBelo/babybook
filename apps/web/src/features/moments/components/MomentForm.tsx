import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type FormEvent,
} from "react";
import { Sparkles, X, Calendar, Type, AlignLeft, Info } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { MediaUploader } from "./MediaUploader";
import { B2CButton } from "@/components/B2CButton";
import { ValidatedInput } from "@/components/ValidatedInput";
import {
  B2CDialog,
  B2CDialogContent,
  B2CDialogDescription,
  B2CDialogFooter,
  B2CDialogHeader,
  B2CDialogTitle,
} from "@/components/B2CDialog";
import { useCreateMoment } from "@/hooks/api";
import type { MomentTemplate } from "../hooks/useMomentTemplate";
import { StampGenerator } from "./StampGenerator";
import { useTranslation } from "@babybook/i18n";
import { uploadMomentMediaFiles } from "@/features/uploads/b2cUpload";
import { cn } from "@/lib/utils";

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
    const suggestion =
      min > 0 ? (min === max ? String(min) : `${min}–${max}`) : null;
    parts.push(
      t("b2c.moments.form.media.helper.photos", {
        current: counts.photos,
        max,
        suggestionSuffix: suggestion
          ? t("b2c.moments.form.media.helper.photosSuggestionSuffix", {
              suggestion,
            })
          : "",
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
  const [titleError, setTitleError] = useState<string | null>(null);
  const [summary, setSummary] = useState("");
  const [occurredAt, setOccurredAt] = useState(
    new Date().toISOString().split("T")[0],
  );
  const [occurredAtError, setOccurredAtError] = useState<string | null>(null);
  const [mediaFiles, setMediaFiles] = useState<File[]>([]);
  const [mediaError, setMediaError] = useState<string | null>(null);
  const [mediaUploadPct, setMediaUploadPct] = useState<number | null>(null);
  const [mediaUploadLabel, setMediaUploadLabel] = useState<string | null>(null);
  const [fieldValues, setFieldValues] = useState<Record<string, unknown>>({});
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const [isNoMediaDialogOpen, setIsNoMediaDialogOpen] = useState(false);
  const [noMediaConfirmed, setNoMediaConfirmed] = useState(false);
  const { mutateAsync: createMoment, isPending } = useCreateMoment();

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
      setTitleError(null);
      setOccurredAtError(null);
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

  const scrollToId = (id: string) => {
    if (typeof document === "undefined") return;
    const el = document.getElementById(id);
    if (!el) return;
    try {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (el as any).focus?.();
    } catch {
      // ignore
    }
  };

  const isTitleValid = title.trim().length > 0;
  const isDateValid = occurredAt.trim().length > 0;

  const missingTemplateRequiredFields = useMemo(() => {
    const fields = template?.fields ?? [];
    if (!fields.length) return [];

    const missing = [] as Array<{ key: string; label: string }>;
    for (const field of fields) {
      if (!field.required) continue;

      const value = fieldValues[field.key];
      if (field.type === "number") {
        const n = typeof value === "number" ? value : Number(value);
        if (!Number.isFinite(n)) {
          missing.push({ key: field.key, label: field.label });
        }
        continue;
      }
      if (field.type === "tags") {
        if (!Array.isArray(value) || value.length === 0) {
          missing.push({ key: field.key, label: field.label });
        }
        continue;
      }
      if (isBlank(value)) {
        missing.push({ key: field.key, label: field.label });
      }
    }

    return missing;
  }, [fieldValues, template?.fields]);

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

  const validateAgainstTemplate = useCallback(
    (files: File[]) => {
      const media = effectiveMedia;
      if (!media) return null;

      const { photos, videos, audios } = countKinds(files);

      if (media.photos) {
        const min = media.photos.min ?? 0;
        const max = media.photos.max ?? 0;
        if (photos > max)
          return t("b2c.moments.form.media.errors.maxPhotosExceeded", { max });
        // B2C: fotos não devem ser obrigatórias (min vira apenas uma referência de "meta").
        // B2B: mantém o comportamento de mínimo (ex.: galeria 50+ fotos).
        if (audience === "b2b" && min > 0 && photos < min)
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
            return t("b2c.moments.form.media.errors.maxVideosExceeded", {
              max,
            });
          if (required && videos < 1)
            return t("b2c.moments.form.media.errors.videoRequired");
        }
        if (media.audio) {
          const max = media.audio.max ?? 1;
          const required = isRuleRequired(media.audio, media.notes);
          if (audios > max)
            return t("b2c.moments.form.media.errors.maxAudiosExceeded", {
              max,
            });
          if (required && audios < 1)
            return t("b2c.moments.form.media.errors.audioRequired");
        }
      }

      return null;
    },
    [audience, effectiveMedia, t],
  );

  const derivedMediaError = useMemo(
    () => validateAgainstTemplate(mediaFiles),
    [mediaFiles, validateAgainstTemplate],
  );

  const canSubmit =
    !isPending &&
    mediaUploadPct === null &&
    isTitleValid &&
    isDateValid &&
    missingTemplateRequiredFields.length === 0 &&
    !derivedMediaError;

  const submitHint = useMemo(() => {
    if (isPending) return null;
    if (mediaUploadPct !== null) {
      return t("b2c.moments.form.saving");
    }
    if (derivedMediaError) return derivedMediaError;
    if (!isTitleValid) return t("b2c.moments.form.validation.missingTitle");
    if (!isDateValid) return t("b2c.moments.form.validation.missingDate");
    if (missingTemplateRequiredFields.length > 0)
      return t("b2c.moments.form.validation.missingField", {
        field: missingTemplateRequiredFields[0]?.label ?? "",
      });
    return null;
  }, [
    derivedMediaError,
    isDateValid,
    isPending,
    isTitleValid,
    mediaUploadPct,
    missingTemplateRequiredFields,
    t,
  ]);

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

        // LÓGICA DE SUBSTITUIÇÃO INTELIGENTE (PREMIUM UX)
        // Se já existe um arquivo com o mesmo nome (ex: "carimbo_mao.png"), substitui.
        // Isso permite que o StampGenerator atualize a arte sem duplicar.
        const existingIndex = temp.findIndex(
          (f) => f.name === file.name && f.name.startsWith("carimbo_"),
        );

        if (existingIndex !== -1) {
          // Substitui o arquivo existente e continua para o próximo loop
          const newTemp = [...temp];
          newTemp[existingIndex] = file;
          temp = newTemp;
          continue;
        }

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

  const performCreateMoment = async () => {
    try {
      setMediaError(null);

      let uploadedMedia: Array<{
        id: string;
        type: "image" | "video" | "audio";
        key: string;
      }> | null = null;

      if (mediaFiles.length) {
        setMediaUploadPct(0);
        setMediaUploadLabel(t("b2c.moments.form.saving"));
        uploadedMedia = await uploadMomentMediaFiles({
          childId,
          files: mediaFiles,
          scope: "moment",
          onProgress: ({ fileName, overallPct }) => {
            setMediaUploadLabel(fileName);
            setMediaUploadPct(overallPct);
          },
        });
      }

      await createMoment({
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

          if (uploadedMedia?.length) {
            payload.media = uploadedMedia;
          }

          return Object.keys(payload).length ? payload : undefined;
        })(),
      });

      if (onSuccess) {
        onSuccess();
      } else {
        navigate("/jornada");
      }
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Falha ao salvar momento.";
      setMediaError(message);
      scrollToId("moment-media");
    } finally {
      setMediaUploadPct(null);
      setMediaUploadLabel(null);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitAttempted(true);

    let ok = true;

    if (!title.trim()) {
      setTitleError(t("b2c.moments.form.errors.requiredField"));
      ok = false;
    }
    if (!occurredAt.trim()) {
      setOccurredAtError(t("b2c.moments.form.errors.requiredField"));
      ok = false;
    }

    if (!ok) {
      scrollToId(!title.trim() ? "moment-title" : "moment-date");
      return;
    }

    if (!validateFields()) {
      const firstMissing = missingTemplateRequiredFields[0];
      if (firstMissing) {
        scrollToId(`moment-field-${firstMissing.key}`);
      }
      return;
    }

    const validationError =
      derivedMediaError ?? validateAgainstTemplate(mediaFiles);
    if (validationError) {
      setMediaError(validationError);
      scrollToId("moment-media");
      return;
    }

    // Nudge premium: se está sem mídia, pergunta antes de salvar.
    if (!mediaFiles.length && !noMediaConfirmed) {
      setIsNoMediaDialogOpen(true);
      return;
    }

    await performCreateMoment();
  };

  return (
    <>
      <B2CDialog open={isNoMediaDialogOpen} onOpenChange={setIsNoMediaDialogOpen}>
        <B2CDialogContent>
          <B2CDialogHeader>
            <B2CDialogTitle style={{ color: "var(--bb-color-ink)" }}>
              {t("b2c.moments.common.noMediaNudge.title")}
            </B2CDialogTitle>
            <B2CDialogDescription style={{ color: "var(--bb-color-ink-muted)" }}>
              {t("b2c.moments.common.noMediaNudge.description")}
            </B2CDialogDescription>
          </B2CDialogHeader>

          <B2CDialogFooter>
            <B2CButton
              type="button"
              variant="secondary"
              onClick={() => {
                setIsNoMediaDialogOpen(false);
                scrollToId("moment-media");
              }}
            >
              {t("b2c.moments.common.noMediaNudge.addNow")}
            </B2CButton>
            <B2CButton
              type="button"
              onClick={() => {
                setNoMediaConfirmed(true);
                setIsNoMediaDialogOpen(false);
                void performCreateMoment();
              }}
            >
              {t("b2c.moments.common.noMediaNudge.saveAnyway")}
            </B2CButton>
          </B2CDialogFooter>
        </B2CDialogContent>
      </B2CDialog>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* === SECTION 1: HEADER & CORE INFO (Title/Date) === */}
        <div
          className="rounded-[2rem] p-6 shadow-sm border border-[var(--bb-color-border)]"
          style={{ backgroundColor: "var(--bb-color-surface)" }}
        >
          <div className="space-y-6">
            <ValidatedInput
              id="moment-title"
              label={t("b2c.moments.form.fields.titleLabel")}
              placeholder={t("b2c.moments.form.fields.titlePlaceholder")}
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                setTitleError(null);
              }}
              icon={Type}
              error={titleError || (submitAttempted && !isTitleValid ? "Obrigatório" : undefined)}
              required
            />

            <ValidatedInput
              id="moment-date"
              type="date"
              label={t("b2c.moments.form.fields.dateLabel")}
              value={occurredAt}
              onChange={(e) => {
                setOccurredAt(e.target.value);
                setOccurredAtError(null);
              }}
              icon={Calendar}
              error={occurredAtError || (submitAttempted && !isDateValid ? "Obrigatório" : undefined)}
              required
            />
          </div>
        </div>

        {/* === SECTION 2: DYNAMIC FIELDS (If any) === */}
        {template?.fields?.length ? (
          <div
            className="rounded-[2rem] p-6 shadow-sm border border-[var(--bb-color-border)]"
            style={{ backgroundColor: "var(--bb-color-surface)" }}
          >
            <div className="mb-4">
              <h3 className="text-lg font-bold text-[var(--bb-color-ink)] flex items-center gap-2">
                <AlignLeft className="w-5 h-5 opacity-50" />
                {t("b2c.moments.form.sections.details")}
              </h3>
              <p className="mt-1 text-sm text-[var(--bb-color-ink-muted)]">
                {template.prompt}
              </p>
            </div>

            <div className="space-y-5">
              {template.fields
                .filter(
                  (f) => template.id !== "marcas-crescimento" || f.key !== "limb",
                )
                .map((field) => {
                  const value = fieldValues[field.key];
                  const error = fieldErrors[field.key];

                  // Handle Select
                  if (field.type === "select") {
                    return (
                       <div key={field.key}>
                        <label className="mb-1 block text-sm font-medium text-[var(--bb-color-ink)]">
                          {field.label}
                          {field.required ? " *" : ""}
                        </label>
                        <select
                          id={`moment-field-${field.key}`}
                          value={typeof value === "string" ? value : ""}
                          onChange={(e) => setField(field.key, e.target.value)}
                          className={cn(
                            "w-full py-3 px-4 rounded-xl border-2 transition-all outline-none appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20fill%3D%22none%22%20viewBox%3D%220%200%2020%2020%22%20stroke%3D%22%236b7280%22%3E%3Cpath%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%20stroke-width%3D%221.5%22%20d%3D%22M6%208l4%204%204-4%22%2F%3E%3C%2Fsvg%3E')] bg-[length:1.25rem_1.25rem] bg-no-repeat bg-[right_1rem_center]",
                            "focus:ring-2 focus:ring-[var(--bb-color-accent)]/20 focus:border-[var(--bb-color-accent)]"
                          )}
                          disabled={field.readOnly}
                          style={{
                            backgroundColor: "var(--bb-color-surface)",
                            borderColor: error ? "var(--bb-color-danger)" : "var(--bb-color-border)",
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
                         {error && (
                            <p className="mt-1 text-sm font-medium text-[var(--bb-color-danger)]">
                              {error}
                            </p>
                          )}
                      </div>
                    );
                  }

                  // Handle TextArea / RichText
                  if (field.type === "textarea" || field.type === "richtext") {
                    return (
                      <ValidatedInput
                        key={field.key}
                        id={`moment-field-${field.key}`}
                        label={field.label}
                        multiline
                        rows={4}
                        placeholder={field.placeholder}
                        value={typeof value === "string" ? value : ""}
                        onChange={(e) => setField(field.key, e.target.value)}
                        readOnly={field.readOnly}
                        error={error || undefined}
                        required={field.required}
                      />
                    );
                  }
                  
                  // Handle Number
                  if (field.type === "number") {
                     return (
                      <ValidatedInput
                        key={field.key}
                        id={`moment-field-${field.key}`}
                        type="number"
                        label={field.label}
                        placeholder={field.placeholder}
                        value={typeof value === "number" ? String(value) : (value as string)}
                        onChange={(e) => {
                          const raw = e.target.value;
                          setField(field.key, raw === "" ? "" : Number(raw));
                        }}
                        readOnly={field.readOnly}
                        min={field.min}
                        max={field.max}
                        error={error || undefined}
                         required={field.required}
                      />
                    );
                  }

                  // Default Text / Date / Tags
                  return (
                     <ValidatedInput
                        key={field.key}
                        id={`moment-field-${field.key}`}
                        type={field.type === 'date' ? 'date' : field.type === 'datetime' ? 'datetime-local' : 'text'}
                        label={field.label}
                        placeholder={field.placeholder || (field.type==='tags' ? t("b2c.moments.form.fields.tagsPlaceholder") : undefined)}
                        value={Array.isArray(value) ? value.join(", ") : (value as string)}
                        onChange={(e) => field.type === 'tags' ? setField(field.key, toTags(e.target.value)) : setField(field.key, e.target.value)}
                        readOnly={field.readOnly}
                        error={error || undefined}
                         required={field.required}
                         helperText={field.helperText}
                      />
                  );
                })}
            </div>
          </div>
        ) : null}
        
         {/* === SECTION 3: SUMMARY === */}
         <div
            className="rounded-[2rem] p-6 shadow-sm border border-[var(--bb-color-border)]"
            style={{ backgroundColor: "var(--bb-color-surface)" }}
          >
             <ValidatedInput
              label={t("b2c.moments.form.fields.summaryLabel")}
              multiline
              rows={3}
              placeholder={t("b2c.moments.form.fields.summaryPlaceholder")}
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              icon={Info}
            />
          </div>

        {/* === SECTION 4: MEDIA / STAMPS === */}
         <div
            className="rounded-[2rem] p-6 shadow-sm border border-[var(--bb-color-border)]"
            style={{ backgroundColor: "var(--bb-color-surface)" }}
          >
            {template?.id === "marcas-crescimento" ? (
          <div className="space-y-6" id="moment-media">
            <div
              className="rounded-2xl border p-4"
              style={{
                backgroundColor: "var(--bb-color-bg)",
                borderColor: "var(--bb-color-border)",
              }}
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <p className="text-sm font-semibold text-[var(--bb-color-ink)]">
                  {t("b2c.moments.form.stamps.guide.title")}
                </p>

                <span
                  className="inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.25em]"
                  style={{
                    borderColor: "rgba(242,153,93,0.35)",
                    background:
                      "linear-gradient(135deg, rgba(242,153,93,0.18), rgba(168,85,247,0.14))",
                    color: "var(--bb-color-ink)",
                    boxShadow: "0 0 0 1px rgba(242,153,93,0.08) inset",
                  }}
                  title="Gerado por IA"
                >
                  <Sparkles className="h-3 w-3" aria-hidden />
                  IA
                </span>
              </div>
              <p className="mt-1 text-xs text-[var(--bb-color-ink-muted)]">
                {t("b2c.moments.form.stamps.guide.description")}
              </p>

              <details className="mt-3">
                <summary className="cursor-pointer select-none text-xs font-semibold text-[var(--bb-color-ink)]">
                  {t("b2c.moments.form.stamps.guide.cta")}
                </summary>
                <ul className="mt-2 list-disc space-y-1 pl-5 text-xs text-[var(--bb-color-ink-muted)]">
                  <li>{t("b2c.moments.form.stamps.guide.bullets.1")}</li>
                  <li>{t("b2c.moments.form.stamps.guide.bullets.2")}</li>
                  <li>{t("b2c.moments.form.stamps.guide.bullets.3")}</li>
                  <li>{t("b2c.moments.form.stamps.guide.bullets.4")}</li>
                  <li>{t("b2c.moments.form.stamps.guide.bullets.5")}</li>
                </ul>
              </details>
            </div>

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
          <div id="moment-media">
            {mediaFiles.length === 0 && !derivedMediaError ? (
              <div
                className="mb-3 rounded-2xl border p-4"
                style={{
                  backgroundColor: "var(--bb-color-bg)",
                  borderColor: "var(--bb-color-border)",
                }}
              >
                <p className="text-sm font-semibold text-[var(--bb-color-ink)]">
                  {t("b2c.moments.form.media.optionalHint.title")}
                </p>
                <p className="mt-1 text-xs text-[var(--bb-color-ink-muted)]">
                  {t("b2c.moments.form.media.optionalHint.description")}
                </p>
              </div>
            ) : null}
            <MediaUploader
              mediaFiles={mediaFiles}
              onAddMedia={handleAddMedia}
              onRemoveMedia={handleRemoveMedia}
              accept={accept}
              helperText={helperText}
              error={mediaError ?? derivedMediaError}
            />
          </div>
        )}
        </div>

        {mediaUploadPct !== null ? (
          <div
            className="rounded-xl border p-3"
            style={{
              backgroundColor: "var(--bb-color-surface)",
              borderColor: "var(--bb-color-border)",
            }}
            aria-live="polite"
          >
            <p className="text-xs text-[var(--bb-color-ink-muted)]">
              {t("b2c.moments.form.saving")}
              {mediaUploadLabel ? ` — ${mediaUploadLabel}` : ""}
            </p>
            <div
              className="mt-2 h-2 w-full overflow-hidden rounded-full"
              style={{ backgroundColor: "var(--bb-color-border)" }}
            >
              <div
                className="h-full rounded-full"
                style={{
                  width: `${mediaUploadPct}%`,
                  backgroundColor: "var(--bb-color-ink)",
                  transition: "width 160ms ease",
                }}
              />
            </div>
          </div>
        ) : null}

        <div className="flex gap-4 pt-4 pb-20">
          <B2CButton
            type="submit"
            disabled={!canSubmit}
            className="flex-1"
            title={!canSubmit && submitHint ? submitHint : undefined}
          >
            {isPending
              ? t("b2c.moments.form.saving")
              : t("b2c.moments.form.save")}
          </B2CButton>
          <B2CButton
            type="button"
            variant="secondary"
            onClick={() => navigate("/jornada")}
            className="flex-1"
            disabled={isPending}
          >
            {t("common.cancel")}
          </B2CButton>
        </div>

        {!canSubmit && submitHint ? (
          <p
            className="text-center text-xs text-[var(--bb-color-ink-muted)]"
            role={submitAttempted ? "alert" : "status"}
          >
            {submitHint}
          </p>
        ) : null}
      </form>
    </>
  );
};
