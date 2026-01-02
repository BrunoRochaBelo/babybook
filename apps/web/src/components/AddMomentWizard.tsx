/**
 * AddMomentWizard - Step-by-Step Moment Creation
 *
 * A beautiful wizard for creating moments with:
 * - Step 1: Select moment type (photo, video, audio, text)
 * - Step 2: Capture/upload media
 * - Step 3: Add text/audio narration
 * - Step 4: Preview and confirm
 * - Step 5: Success celebration
 *
 * Design Goals:
 * - Minimize friction for quick capture
 * - Support multiple media types
 * - Audio recording for voice notes
 * - Beautiful animations between steps
 */

import React, { useState, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import {
  Camera,
  Video,
  Mic,
  FileText,
  X,
  ChevronLeft,
  ChevronRight,
  Upload,
  Check,
  Sparkles,
  Calendar,
  Image as ImageIcon,
} from "lucide-react";
import { useCreateMoment } from "@/hooks/api";
import { useSelectedChild } from "@/hooks/useSelectedChild";
import { Confetti } from "@/components/animations";
import { cn } from "@/lib/utils";
import { useTranslation } from "@babybook/i18n";

type MomentType = "photo" | "video" | "audio" | "text";
type WizardStep = "type" | "media" | "details" | "preview" | "success";

interface AddMomentWizardProps {
  onClose?: () => void;
  initialType?: MomentType;
}

export function AddMomentWizard({
  onClose,
  initialType,
}: AddMomentWizardProps) {
  const navigate = useNavigate();
  const { selectedChild } = useSelectedChild();
  const { mutateAsync: createMoment, isPending } = useCreateMoment();
  const { t, i18n } = useTranslation();

  // Wizard state
  const [step, setStep] = useState<WizardStep>(initialType ? "media" : "type");
  const [momentType, setMomentType] = useState<MomentType | null>(
    initialType || null,
  );

  // Form data
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [occurredAt, setOccurredAt] = useState(
    new Date().toISOString().split("T")[0],
  );
  const [mediaFiles, setMediaFiles] = useState<File[]>([]);
  const [mediaPreviewUrls, setMediaPreviewUrls] = useState<string[]>([]);

  // Audio recording
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioDuration, setAudioDuration] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  // UI state
  const [showConfetti, setShowConfetti] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const steps: WizardStep[] = [
    "type",
    "media",
    "details",
    "preview",
    "success",
  ];
  const currentStepIndex = steps.indexOf(step);

  const handleSelectType = (type: MomentType) => {
    setMomentType(type);
    setStep("media");
  };

  const handleMediaUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    // Create preview URLs
    const newPreviewUrls = files.map((file) => URL.createObjectURL(file));
    setMediaFiles((prev) => [...prev, ...files]);
    setMediaPreviewUrls((prev) => [...prev, ...newPreviewUrls]);
  };

  const handleRemoveMedia = (index: number) => {
    URL.revokeObjectURL(mediaPreviewUrls[index]);
    setMediaFiles((prev) => prev.filter((_, i) => i !== index));
    setMediaPreviewUrls((prev) => prev.filter((_, i) => i !== index));
  };

  const startAudioRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, {
          type: "audio/webm",
        });
        setAudioBlob(audioBlob);
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);

      // Track duration
      const startTime = Date.now();
      const durationInterval = setInterval(() => {
        setAudioDuration(Math.floor((Date.now() - startTime) / 1000));
      }, 1000);

      mediaRecorder.addEventListener("stop", () => {
        clearInterval(durationInterval);
      });
    } catch (error) {
      console.error("Failed to start recording:", error);
      alert(t("b2c.moments.wizard.errors.microphonePermission"));
    }
  };

  const stopAudioRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const handleNext = () => {
    const nextIndex = currentStepIndex + 1;
    if (nextIndex < steps.length) {
      setStep(steps[nextIndex]);
    }
  };

  const handleBack = () => {
    const prevIndex = currentStepIndex - 1;
    if (prevIndex >= 0) {
      setStep(steps[prevIndex]);
    }
  };

  const handleSubmit = async () => {
    if (!selectedChild) return;

    try {
      await createMoment({
        childId: selectedChild.id,
        title: title || t("b2c.moments.common.newMoment"),
        summary: description,
        occurredAt,
        payload: mediaFiles.length
          ? {
              media: mediaFiles.map((file) => ({
                id: file.name,
                type: file.type.startsWith("video")
                  ? "video"
                  : file.type.startsWith("audio")
                    ? "audio"
                    : "image",
                url: URL.createObjectURL(file),
              })),
            }
          : undefined,
      });

      setStep("success");
      setShowConfetti(true);
    } catch (error) {
      console.error("Failed to create moment:", error);
      alert(t("b2c.moments.wizard.errors.createFailed"));
    }
  };

  const handleFinish = () => {
    // Cleanup preview URLs
    mediaPreviewUrls.forEach((url) => URL.revokeObjectURL(url));
    navigate("/jornada");
  };

  const handleClose = () => {
    mediaPreviewUrls.forEach((url) => URL.revokeObjectURL(url));
    if (onClose) {
      onClose();
    } else {
      navigate(-1);
    }
  };

  // Step validation
  const canProceed = useCallback(() => {
    switch (step) {
      case "type":
        return momentType !== null;
      case "media":
        if (momentType === "text") return true;
        if (momentType === "audio")
          return audioBlob !== null || mediaFiles.length > 0;
        return mediaFiles.length > 0;
      case "details":
        return title.trim().length > 0;
      case "preview":
        return true;
      default:
        return true;
    }
  }, [step, momentType, mediaFiles, audioBlob, title]);

  // Type selection cards
  const typeOptions = [
    {
      type: "photo" as MomentType,
      icon: Camera,
      label: t("b2c.moments.wizard.types.photo.label"),
      description: t("b2c.moments.wizard.types.photo.description"),
      color: "from-pink-400 to-rose-500",
    },
    {
      type: "video" as MomentType,
      icon: Video,
      label: t("b2c.moments.wizard.types.video.label"),
      description: t("b2c.moments.wizard.types.video.description"),
      color: "from-purple-400 to-indigo-500",
    },
    {
      type: "audio" as MomentType,
      icon: Mic,
      label: t("b2c.moments.wizard.types.audio.label"),
      description: t("b2c.moments.wizard.types.audio.description"),
      color: "from-amber-400 to-orange-500",
    },
    {
      type: "text" as MomentType,
      icon: FileText,
      label: t("b2c.moments.wizard.types.text.label"),
      description: t("b2c.moments.wizard.types.text.description"),
      color: "from-teal-400 to-emerald-500",
    },
  ];

  return (
    <>
      <Confetti isActive={showConfetti} duration={3000} />

      <div
        className="fixed inset-0 z-50 flex flex-col"
        style={{
          backgroundColor: "var(--bb-color-bg)",
          color: "var(--bb-color-ink)",
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between border-b p-4"
          style={{ borderColor: "var(--bb-color-border)" }}
        >
          <button
            onClick={step === "type" ? handleClose : handleBack}
            className="rounded-full p-2 transition-colors"
            style={{ color: "var(--bb-color-ink)" }}
            aria-label={t("common.back")}
          >
            <ChevronLeft className="h-5 w-5" aria-hidden />
          </button>
          <div className="flex gap-1.5">
            {steps.slice(0, -1).map((s, index) => (
              <div
                key={s}
                className={cn(
                  "h-1.5 rounded-full transition-all",
                  index < currentStepIndex
                    ? "w-6 bg-primary"
                    : index === currentStepIndex
                      ? "w-6 bg-primary"
                      : "w-1.5 bg-[var(--bb-color-border)]",
                )}
              />
            ))}
          </div>
          <div className="w-9" /> {/* Spacer for centering */}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-4">
          <AnimatePresence mode="wait">
            {/* Step 1: Select Type */}
            {step === "type" && (
              <motion.div
                key="type"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="max-w-md mx-auto"
              >
                <h1 className="mb-2 text-center text-2xl font-serif font-bold text-[var(--bb-color-ink)]">
                  {t("b2c.moments.common.newMoment")}
                </h1>
                <p className="mb-8 text-center text-[var(--bb-color-ink-muted)]">
                  {t("b2c.moments.wizard.stepType.subtitle")}
                </p>

                <div className="grid grid-cols-2 gap-4">
                  {typeOptions.map((option) => (
                    <motion.button
                      key={option.type}
                      onClick={() => handleSelectType(option.type)}
                      className={cn(
                        "p-6 rounded-2xl text-left transition-all",
                        "bg-gradient-to-br hover:scale-[1.02] active:scale-[0.98]",
                        option.color,
                      )}
                      whileTap={{ scale: 0.98 }}
                    >
                      <option.icon className="w-8 h-8 text-white mb-3" />
                      <h3 className="font-semibold text-white text-lg">
                        {option.label}
                      </h3>
                      <p className="text-white/80 text-sm mt-1">
                        {option.description}
                      </p>
                    </motion.button>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Step 2: Media Capture/Upload */}
            {step === "media" && (
              <motion.div
                key="media"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="max-w-md mx-auto"
              >
                <h2 className="mb-2 text-center text-xl font-serif font-bold text-[var(--bb-color-ink)]">
                  {momentType === "photo" &&
                    t("b2c.moments.wizard.stepMedia.title.photo")}
                  {momentType === "video" &&
                    t("b2c.moments.wizard.stepMedia.title.video")}
                  {momentType === "audio" &&
                    t("b2c.moments.wizard.stepMedia.title.audio")}
                  {momentType === "text" &&
                    t("b2c.moments.wizard.stepMedia.title.text")}
                </h2>

                {/* Photo/Video Upload */}
                {(momentType === "photo" || momentType === "video") && (
                  <div className="space-y-4">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept={momentType === "photo" ? "image/*" : "video/*"}
                      multiple={momentType === "photo"}
                      onChange={handleMediaUpload}
                      className="hidden"
                    />

                    {/* Upload Area */}
                    {mediaFiles.length === 0 ? (
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        className="flex aspect-square w-full flex-col items-center justify-center rounded-2xl border-2 border-dashed transition-colors hover:border-primary"
                        style={{
                          borderColor: "var(--bb-color-border)",
                          backgroundColor: "transparent",
                        }}
                      >
                        <Upload className="mb-3 h-12 w-12 text-[var(--bb-color-ink-muted)]" />
                        <p
                          className="font-medium"
                          style={{ color: "var(--bb-color-ink)" }}
                        >
                          {momentType === "photo"
                            ? t(
                                "b2c.moments.wizard.stepMedia.upload.tapToAddPhotos",
                              )
                            : t(
                                "b2c.moments.wizard.stepMedia.upload.tapToAddVideo",
                              )}
                        </p>
                        <p
                          className="mt-1 text-sm"
                          style={{ color: "var(--bb-color-ink-muted)" }}
                        >
                          {t("b2c.moments.wizard.stepMedia.upload.dragDrop")}
                        </p>
                      </button>
                    ) : (
                      <div className="space-y-4">
                        {/* Preview Grid */}
                        <div className="grid grid-cols-3 gap-2">
                          {mediaPreviewUrls.map((url, index) => (
                            <div key={index} className="relative aspect-square">
                              {momentType === "photo" ? (
                                <img
                                  src={url}
                                  alt=""
                                  className="w-full h-full object-cover rounded-lg"
                                />
                              ) : (
                                <video
                                  src={url}
                                  className="w-full h-full object-cover rounded-lg"
                                />
                              )}
                              <button
                                onClick={() => handleRemoveMedia(index)}
                                className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full text-white"
                                style={{
                                  backgroundColor: "var(--bb-color-danger)",
                                }}
                                aria-label={t("common.delete")}
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          ))}
                          {momentType === "photo" && mediaFiles.length < 10 && (
                            <button
                              onClick={() => fileInputRef.current?.click()}
                              className="flex aspect-square items-center justify-center rounded-lg border-2 border-dashed transition-colors hover:border-primary"
                              style={{ borderColor: "var(--bb-color-border)" }}
                            >
                              <ImageIcon className="h-6 w-6 text-[var(--bb-color-ink-muted)]" />
                            </button>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Audio Recording */}
                {momentType === "audio" && (
                  <div className="space-y-6 text-center py-8">
                    {!audioBlob ? (
                      <>
                        <div
                          className={cn(
                            "w-32 h-32 mx-auto rounded-full flex items-center justify-center transition-all",
                            isRecording
                              ? "bg-red-500 animate-pulse"
                              : "bg-gradient-to-br from-amber-400 to-orange-500",
                          )}
                        >
                          <Mic className="w-12 h-12 text-white" />
                        </div>

                        {isRecording && (
                          <p className="text-2xl font-mono text-[var(--bb-color-ink)]">
                            {Math.floor(audioDuration / 60)}:
                            {(audioDuration % 60).toString().padStart(2, "0")}
                          </p>
                        )}

                        <button
                          onClick={
                            isRecording
                              ? stopAudioRecording
                              : startAudioRecording
                          }
                          className={cn(
                            "px-8 py-3 rounded-full font-semibold text-white transition-colors",
                            isRecording
                              ? "bg-red-500 hover:bg-red-600"
                              : "bg-primary hover:bg-primary/90",
                          )}
                        >
                          {isRecording
                            ? t("b2c.moments.wizard.stepMedia.audio.stop")
                            : t("b2c.moments.wizard.stepMedia.audio.start")}
                        </button>
                      </>
                    ) : (
                      <div className="space-y-4">
                        <div className="w-24 h-24 mx-auto rounded-full bg-green-500 flex items-center justify-center">
                          <Check className="w-10 h-10 text-white" />
                        </div>
                        <p className="text-[var(--bb-color-ink-muted)]">
                          {t("b2c.moments.wizard.stepMedia.audio.success")}
                        </p>
                        <audio
                          src={URL.createObjectURL(audioBlob)}
                          controls
                          className="mx-auto"
                        />
                        <button
                          onClick={() => {
                            setAudioBlob(null);
                            setAudioDuration(0);
                          }}
                          className="text-sm underline"
                          style={{ color: "var(--bb-color-ink-muted)" }}
                        >
                          {t("b2c.moments.wizard.stepMedia.audio.recordAgain")}
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* Text - Skip message */}
                {momentType === "text" && (
                  <div className="text-center py-12">
                    <FileText className="mx-auto mb-4 h-16 w-16 text-[var(--bb-color-border)]" />
                    <p className="text-[var(--bb-color-ink-muted)]">
                      {t("b2c.moments.wizard.stepMedia.textSkip")}
                    </p>
                  </div>
                )}
              </motion.div>
            )}

            {/* Step 3: Details */}
            {step === "details" && (
              <motion.div
                key="details"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="max-w-md mx-auto space-y-6"
              >
                <h2 className="mb-6 text-center text-xl font-serif font-bold text-[var(--bb-color-ink)]">
                  {t("b2c.moments.wizard.stepDetails.title")}
                </h2>

                {/* Title */}
                <div>
                  <label className="mb-2 block text-sm font-medium text-[var(--bb-color-ink)]">
                    {t("b2c.moments.wizard.stepDetails.fields.titleLabel")}
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder={t(
                      "b2c.moments.wizard.stepDetails.fields.titlePlaceholder",
                    )}
                    className="w-full rounded-xl border px-4 py-3 focus:ring-2 focus:ring-primary focus:border-transparent"
                    style={{
                      backgroundColor: "var(--bb-color-surface)",
                      borderColor: "var(--bb-color-border)",
                      color: "var(--bb-color-ink)",
                    }}
                  />
                </div>

                {/* Date */}
                <div>
                  <label className="mb-2 block text-sm font-medium text-[var(--bb-color-ink)]">
                    <Calendar className="mr-1 inline h-4 w-4" aria-hidden />
                    {t("b2c.moments.wizard.stepDetails.fields.dateLabel")}
                  </label>
                  <input
                    type="date"
                    value={occurredAt}
                    onChange={(e) => setOccurredAt(e.target.value)}
                    className="w-full rounded-xl border px-4 py-3 focus:ring-2 focus:ring-primary focus:border-transparent"
                    style={{
                      backgroundColor: "var(--bb-color-surface)",
                      borderColor: "var(--bb-color-border)",
                      color: "var(--bb-color-ink)",
                    }}
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="mb-2 block text-sm font-medium text-[var(--bb-color-ink)]">
                    {t(
                      "b2c.moments.wizard.stepDetails.fields.descriptionLabel",
                    )}
                  </label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder={t(
                      "b2c.moments.wizard.stepDetails.fields.descriptionPlaceholder",
                    )}
                    rows={4}
                    className="w-full resize-none rounded-xl border px-4 py-3 focus:ring-2 focus:ring-primary focus:border-transparent"
                    style={{
                      backgroundColor: "var(--bb-color-surface)",
                      borderColor: "var(--bb-color-border)",
                      color: "var(--bb-color-ink)",
                    }}
                  />
                </div>
              </motion.div>
            )}

            {/* Step 4: Preview */}
            {step === "preview" && (
              <motion.div
                key="preview"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="max-w-md mx-auto"
              >
                <h2 className="mb-6 text-center text-xl font-serif font-bold text-[var(--bb-color-ink)]">
                  {t("b2c.moments.wizard.stepPreview.title")}
                </h2>

                <div className="overflow-hidden rounded-2xl border bg-[var(--bb-color-surface)] border-[var(--bb-color-border)]">
                  {/* Media Preview */}
                  {mediaPreviewUrls.length > 0 && (
                    <div className="aspect-video bg-[var(--bb-color-bg)]">
                      {momentType === "video" ? (
                        <video
                          src={mediaPreviewUrls[0]}
                          controls
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <img
                          src={mediaPreviewUrls[0]}
                          alt=""
                          className="w-full h-full object-cover"
                        />
                      )}
                    </div>
                  )}

                  {/* Audio Preview */}
                  {audioBlob && (
                    <div
                      className="p-4"
                      style={{ backgroundColor: "var(--bb-color-bg)" }}
                    >
                      <audio
                        src={URL.createObjectURL(audioBlob)}
                        controls
                        className="w-full"
                      />
                    </div>
                  )}

                  {/* Content */}
                  <div className="p-4 space-y-2">
                    <p className="text-sm text-[var(--bb-color-ink-muted)]">
                      {new Date(occurredAt).toLocaleDateString(i18n.language, {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      })}
                    </p>
                    <h3 className="text-xl font-serif font-bold text-[var(--bb-color-ink)]">
                      {title || t("b2c.moments.wizard.stepPreview.untitled")}
                    </h3>
                    {description && (
                      <p className="text-[var(--bb-color-ink-muted)]">
                        {description}
                      </p>
                    )}
                  </div>
                </div>
              </motion.div>
            )}

            {/* Step 5: Success */}
            {step === "success" && (
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="max-w-md mx-auto text-center py-12"
              >
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2, type: "spring" }}
                  className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center"
                >
                  <Sparkles className="w-12 h-12 text-white" />
                </motion.div>

                <h2 className="mb-2 text-2xl font-serif font-bold text-[var(--bb-color-ink)]">
                  {t("b2c.moments.wizard.stepSuccess.title")}
                </h2>
                <p className="mb-8 text-[var(--bb-color-ink-muted)]">
                  {t("b2c.moments.wizard.stepSuccess.subtitle")}
                </p>

                <button
                  onClick={handleFinish}
                  className="w-full py-4 bg-primary text-white rounded-xl font-semibold hover:bg-primary/90 transition-colors"
                >
                  {t("b2c.moments.wizard.stepSuccess.cta")}
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer - Navigation */}
        {step !== "type" && step !== "success" && (
          <div
            className="border-t p-4"
            style={{ borderColor: "var(--bb-color-border)" }}
          >
            <button
              onClick={step === "preview" ? handleSubmit : handleNext}
              disabled={!canProceed() || isPending}
              className={cn(
                "w-full py-4 rounded-xl font-semibold flex items-center justify-center gap-2 transition-colors",
                canProceed() && !isPending
                  ? "bg-primary text-white hover:bg-primary/90"
                  : "bg-[var(--bb-color-border)] text-[var(--bb-color-ink-muted)] cursor-not-allowed",
              )}
            >
              {isPending ? (
                <>
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{
                      duration: 1,
                      repeat: Infinity,
                      ease: "linear",
                    }}
                    className="w-5 h-5 border-2 border-white border-t-transparent rounded-full"
                  />
                  {t("b2c.moments.wizard.saving")}
                </>
              ) : step === "preview" ? (
                <>
                  <Check className="w-5 h-5" />
                  {t("b2c.moments.wizard.saveMoment")}
                </>
              ) : (
                <>
                  {t("b2c.moments.wizard.continue")}
                  <ChevronRight className="w-5 h-5" />
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </>
  );
}

export default AddMomentWizard;
