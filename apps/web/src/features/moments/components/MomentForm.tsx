import { useEffect, useMemo, useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { MediaUploader } from "./MediaUploader";
import { Button } from "@/components/ui/button";
import { useCreateMoment } from "@/hooks/api";
import type { MomentTemplate } from "../hooks/useMomentTemplate";

type MediaKind = "photo" | "video" | "audio";

type MomentAudience = "b2c" | "b2b";

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
) => {
  const counts = countKinds(files);

  if (!media) {
    return `Até 10 mídias por momento. Você adicionou ${counts.photos + counts.videos + counts.audios}.`;
  }

  const parts: string[] = [];
  if (media.photos) {
    const min = media.photos.min ?? 0;
    const max = media.photos.max ?? 0;
    const range = min > 0 ? `${min}–${max}` : `até ${max}`;
    parts.push(`Fotos: ${counts.photos}/${max} (meta: ${range})`);
  }

  if (media.videoOrAudio) {
    const max = media.videoOrAudio.max ?? 1;
    const required = isRuleRequired(media.videoOrAudio, media.notes);
    const secs = media.videoOrAudio.maxSeconds
      ? ` (${media.videoOrAudio.maxSeconds}s)`
      : "";
    const current = counts.videos + counts.audios;
    parts.push(
      `Vídeo ou áudio: ${current}/${max}${secs}${required ? " (obrigatório)" : ""}`,
    );
  } else {
    if (media.video) {
      const max = media.video.max ?? 1;
      const required = isRuleRequired(media.video, media.notes);
      const secs = media.video.maxSeconds
        ? ` (${media.video.maxSeconds}s)`
        : "";
      parts.push(
        `Vídeo: ${counts.videos}/${max}${secs}${required ? " (obrigatório)" : ""}`,
      );
    }
    if (media.audio) {
      const max = media.audio.max ?? 1;
      const required = isRuleRequired(media.audio, media.notes);
      parts.push(
        `Áudio: ${counts.audios}/${max}${required ? " (obrigatório)" : ""}`,
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
    () => buildHelperText(effectiveMedia, mediaFiles),
    [effectiveMedia, mediaFiles],
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
          nextErrors[field.key] = "Campo obrigatório.";
          continue;
        }
      } else if (field.type === "tags") {
        if (!Array.isArray(value) || value.length === 0) {
          nextErrors[field.key] = "Campo obrigatório.";
          continue;
        }
      } else if (isBlank(value)) {
        nextErrors[field.key] = "Campo obrigatório.";
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
      if (photos > max) return `Limite de fotos excedido: máximo ${max}.`;
      if (min > 0 && photos < min) return `Adicione pelo menos ${min} foto(s).`;
    }

    if (media.videoOrAudio) {
      const max = media.videoOrAudio.max ?? 1;
      const required = isRuleRequired(media.videoOrAudio, media.notes);
      const combined = videos + audios;
      if (combined > max)
        return `Limite excedido: no máximo ${max} vídeo OU áudio.`;
      if (max === 1 && videos > 0 && audios > 0)
        return "Escolha apenas um: vídeo OU áudio.";
      if (required && combined < 1)
        return "Inclua 1 vídeo OU áudio para este momento.";
    } else {
      if (media.video) {
        const max = media.video.max ?? 1;
        const required = isRuleRequired(media.video, media.notes);
        if (videos > max) return `Limite de vídeos excedido: máximo ${max}.`;
        if (required && videos < 1) return "Inclua 1 vídeo para este momento.";
      }
      if (media.audio) {
        const max = media.audio.max ?? 1;
        const required = isRuleRequired(media.audio, media.notes);
        if (audios > max) return `Limite de áudios excedido: máximo ${max}.`;
        if (required && audios < 1) return "Inclua 1 áudio para este momento.";
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
        durationError = `Duração máxima: ${maxSeconds}s. Arquivo "${file.name}" tem ~${Math.ceil(duration)}s.`;
        continue;
      }

      acceptedByDuration.push(file);
    }

    setMediaFiles((prev) => {
      if (!media) {
        const next = [...prev, ...acceptedByDuration];
        if (next.length > 10) {
          setMediaError("Limite de 10 mídias por momento.");
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
          lastError = "Este momento não aceita fotos.";
          continue;
        }
        if (kind === "video" && !allowVideo) {
          lastError = "Este momento não aceita vídeos.";
          continue;
        }
        if (kind === "audio" && !allowAudio) {
          lastError = "Este momento não aceita áudios.";
          continue;
        }

        const next = [...temp, file];
        const { photos, videos, audios } = countKinds(next);

        if (allowPhoto && maxPhotos > 0 && photos > maxPhotos) {
          lastError = `Limite de fotos: máximo ${maxPhotos}.`;
          continue;
        }

        if (media.videoOrAudio) {
          const combined = videos + audios;
          if (maxVideoOrAudio > 0 && combined > maxVideoOrAudio) {
            lastError = `Limite: no máximo ${maxVideoOrAudio} vídeo OU áudio.`;
            continue;
          }
          if (maxVideoOrAudio === 1 && videos > 0 && audios > 0) {
            lastError = "Escolha apenas um: vídeo OU áudio.";
            continue;
          }
        } else {
          if (allowVideo && maxVideo > 0 && videos > maxVideo) {
            lastError = `Limite de vídeos: máximo ${maxVideo}.`;
            continue;
          }
          if (allowAudio && maxAudio > 0 && audios > maxAudio) {
            lastError = `Limite de áudios: máximo ${maxAudio}.`;
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
            navigate("/momentos");
          }
        },
      },
    );
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label className="block text-sm font-semibold text-gray-800 mb-2">
          Título do Momento *
        </label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-primary focus:outline-none"
          placeholder="Ex: Primeiro Sorriso"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-semibold text-gray-800 mb-2">
          Data do Momento *
        </label>
        <input
          type="date"
          value={occurredAt}
          onChange={(e) => setOccurredAt(e.target.value)}
          className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-primary focus:outline-none"
          required
        />
      </div>

      {template?.fields?.length ? (
        <div className="space-y-4">
          <div>
            <h3 className="text-sm font-semibold text-gray-800">
              Detalhes do momento
            </h3>
            <p className="text-xs text-gray-500 mt-1">{template.prompt}</p>
          </div>

          {template.fields.map((field) => {
            const value = fieldValues[field.key];
            const error = fieldErrors[field.key];
            const commonClassName =
              "w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-primary focus:outline-none";

            return (
              <div key={field.key}>
                <label className="block text-sm font-semibold text-gray-800 mb-2">
                  {field.label}
                  {field.required ? " *" : ""}
                </label>

                {field.type === "select" ? (
                  <select
                    value={typeof value === "string" ? value : ""}
                    onChange={(e) => setField(field.key, e.target.value)}
                    className={commonClassName}
                    disabled={field.readOnly}
                  >
                    <option value="">Selecione...</option>
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
                      "w-full px-4 py-3 border-2 border-gray-200 rounded-lg resize-none focus:border-primary focus:outline-none"
                    }
                    rows={4}
                    placeholder={field.placeholder}
                    readOnly={field.readOnly}
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
                  />
                ) : field.type === "tags" ? (
                  <input
                    type="text"
                    value={Array.isArray(value) ? value.join(", ") : ""}
                    onChange={(e) =>
                      setField(field.key, toTags(e.target.value))
                    }
                    className={commonClassName}
                    placeholder={field.placeholder ?? "Separe por vírgulas"}
                    readOnly={field.readOnly}
                  />
                ) : field.type === "date" ? (
                  <input
                    type="date"
                    value={typeof value === "string" ? value : ""}
                    onChange={(e) => setField(field.key, e.target.value)}
                    className={commonClassName}
                    readOnly={field.readOnly}
                  />
                ) : field.type === "datetime" ? (
                  <input
                    type="datetime-local"
                    value={typeof value === "string" ? value : ""}
                    onChange={(e) => setField(field.key, e.target.value)}
                    className={commonClassName}
                    readOnly={field.readOnly}
                  />
                ) : (
                  <input
                    type="text"
                    value={typeof value === "string" ? value : ""}
                    onChange={(e) => setField(field.key, e.target.value)}
                    className={commonClassName}
                    placeholder={field.placeholder}
                    readOnly={field.readOnly}
                  />
                )}

                {field.helperText ? (
                  <p className="mt-1 text-xs text-gray-500">
                    {field.helperText}
                  </p>
                ) : null}

                {error ? (
                  <p
                    className="mt-1 text-sm font-medium text-red-600"
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
        <label className="block text-sm font-semibold text-gray-800 mb-2">
          Descrição (opcional)
        </label>
        <textarea
          value={summary}
          onChange={(e) => setSummary(e.target.value)}
          className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg resize-none focus:border-primary focus:outline-none"
          rows={4}
          placeholder="Conte a história desse momento especial..."
        />
      </div>

      <MediaUploader
        mediaFiles={mediaFiles}
        onAddMedia={handleAddMedia}
        onRemoveMedia={handleRemoveMedia}
        accept={accept}
        helperText={helperText}
        error={mediaError}
      />

      <div className="flex gap-4 pt-4">
        <Button type="submit" disabled={isPending || !title} className="flex-1">
          {isPending ? "Salvando..." : "Salvar Momento"}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => navigate("/momentos")}
          className="flex-1"
        >
          Cancelar
        </Button>
      </div>
    </form>
  );
};
