/**
 * Partner Settings Page
 *
 * Página para editar perfil do estúdio/parceiro.
 * Permite atualizar: nome, nome do estúdio, telefone, logo.
 */

import { useMemo, useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Camera, Save, Upload, X, Globe, LogOut } from "lucide-react";
import { toast } from "sonner";
import { useTranslation } from "@babybook/i18n";
import { getPartnerProfile, updatePartnerProfile } from "./api";
import type { Partner } from "./types";
import { usePartnerPageHeader } from "@/layouts/partnerPageHeader";
import { PartnerPage } from "@/layouts/PartnerPage";
import { PartnerErrorState } from "@/layouts/partnerStates";
import { PartnerBackButton } from "@/layouts/PartnerBackButton";
import { useUnsavedChangesWarning } from "@/hooks/useOnlineStatus";
import { SuccessButton } from "@/components/SuccessButton";
import { LanguageSelector } from "@/components/LanguageSelector";
import { ThemeSelector } from "@/components/ThemeSelector";
import { apiClient } from "@/lib/api-client";
import { SettingsSkeleton } from "./components/SettingsSkeleton";

export function PartnerSettingsPage() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const previewUrlRef = useRef<string | null>(null);

  usePartnerPageHeader(
    useMemo(
      () => ({
        title: t("partner.settings.title"),
        backTo: "/partner",
        backLabel: t("common.back"),
      }),
      [t],
    ),
  );

  const [name, setName] = useState("");
  const [studioName, setStudioName] = useState("");
  const [phone, setPhone] = useState("");
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [logoFile, setLogoFile] = useState<File | null>(null);

  // Query
  const {
    data: profile,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ["partner", "profile"],
    queryFn: getPartnerProfile,
  });

  // Update state when profile loads
  useEffect(() => {
    if (profile) {
      setName(profile.name || "");
      setStudioName(profile.studio_name || "");
      setPhone(profile.phone || "");
      setLogoUrl(profile.logo_url);
    }
  }, [profile]);

  useEffect(() => {
    return () => {
      if (previewUrlRef.current) {
        URL.revokeObjectURL(previewUrlRef.current);
        previewUrlRef.current = null;
      }
    };
  }, []);

  // Detectar alterações não salvas
  const hasUnsavedChanges = profile
    ? name !== (profile.name || "") ||
      studioName !== (profile.studio_name || "") ||
      phone !== (profile.phone || "") ||
      logoFile !== null
    : false;

  // Alertar ao sair com alterações não salvas
  useUnsavedChangesWarning(hasUnsavedChanges, t("errors.validation"));

  // Estado de sucesso para o botão
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: (
      updates: Partial<
        Pick<Partner, "name" | "studio_name" | "phone" | "logo_url">
      >,
    ) => updatePartnerProfile(updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["partner", "profile"] });
      setSaveSuccess(true);
      toast.success(t("common.success"));
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : t("errors.generic"));
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      toast.error(t("common.required"));
      return;
    }

    // TODO: Upload logo file first if changed
    // For now, just update text fields
    updateMutation.mutate({
      name: name.trim(),
      studio_name: studioName.trim() || null,
      phone: phone.trim() || null,
      logo_url: logoUrl,
    });
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith("image/")) {
        toast.error(t("errors.validation"));
        return;
      }
      // Validate file size (max 2MB)
      if (file.size > 2 * 1024 * 1024) {
        toast.error(t("errors.validation"));
        return;
      }
      setLogoFile(file);
      // Create preview URL (revoga o anterior para evitar vazamento)
      if (previewUrlRef.current) {
        URL.revokeObjectURL(previewUrlRef.current);
        previewUrlRef.current = null;
      }
      const preview = URL.createObjectURL(file);
      previewUrlRef.current = preview;
      setLogoUrl(preview);
    }
  };

  const handleRemoveLogo = () => {
    setLogoFile(null);
    setLogoUrl(null);
    if (previewUrlRef.current) {
      URL.revokeObjectURL(previewUrlRef.current);
      previewUrlRef.current = null;
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const formatPhone = (value: string) => {
    const numbers = value.replace(/\D/g, "").slice(0, 11);
    if (numbers.length <= 2) return numbers;
    if (numbers.length <= 7)
      return `(${numbers.slice(0, 2)}) ${numbers.slice(2)}`;
    return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7)}`;
  };

  // Tratamento de erro de carregamento (precisa ficar após os hooks)
  if (isError) {
    return (
      <PartnerErrorState
        title={t("errors.generic")}
        onRetry={refetch}
        skeleton={<SettingsSkeleton />}
      />
    );
  }

  if (isLoading) {
    return <SettingsSkeleton />;
  }

  return (
    <PartnerPage>
      {/* Desktop Header */}
      <div className="hidden md:block mb-10 animate-in fade-in slide-in-from-top-4 duration-700">
        <PartnerBackButton label={t("common.back")} />
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          {t("partner.settings.profile.title")}
        </h1>
        <p className="text-gray-500 dark:text-gray-400">
          {t("partner.settings.title")}
        </p>
      </div>

      {/* Mobile summary - botão voltar via header sticky */}
      <div className="md:hidden mb-4">
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {t("partner.settings.title")}
        </p>
      </div>

      <form onSubmit={handleSubmit}>
        {/* Logo Section */}
        <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-[2.5rem] p-8 border border-white/50 dark:border-gray-700/50 mb-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-black/20">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            {t("partner.settings.profile.logo")}
          </h2>
          <div className="flex items-center gap-6">
            <div className="relative">
              {logoUrl ? (
                <div className="w-24 h-24 rounded-xl overflow-hidden border-2 border-gray-200 dark:border-gray-600">
                  <img
                    src={logoUrl}
                    alt="Logo"
                    className="w-full h-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={handleRemoveLogo}
                    className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600"
                    aria-label={t("partner.settings.profile.removeLogo")}
                    title={t("partner.settings.profile.removeLogo")}
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ) : (
                <div className="w-24 h-24 rounded-xl bg-gray-100 dark:bg-gray-700 border-2 border-dashed border-gray-300 dark:border-gray-600 flex items-center justify-center">
                  <Camera className="w-8 h-8 text-gray-400 dark:text-gray-500" />
                </div>
              )}
            </div>
            <div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleLogoChange}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                <Upload className="w-4 h-4" />
                {t("partner.settings.profile.uploadLogo")}
              </button>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                JPG ou PNG até 2MB. Recomendado: 200x200 pixels
              </p>
            </div>
          </div>
        </div>

        {/* Profile Fields */}
        <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-[2.5rem] p-8 border border-white/50 dark:border-gray-700/50 mb-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-black/20">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            {t("partner.settings.profile.title")}
          </h2>
          <div className="space-y-4">
            <div>
              <label
                htmlFor="name"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
              >
                {t("partner.settings.profile.contactName")} *
              </label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={t("partner.settings.profile.contactName")}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-2xl focus:ring-2 focus:ring-pink-500 focus:border-pink-500 transition-colors placeholder:text-gray-400 dark:placeholder:text-gray-500"
              />
            </div>

            <div>
              <label
                htmlFor="studioName"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
              >
                {t("partner.settings.profile.companyName")}
              </label>
              <input
                id="studioName"
                type="text"
                value={studioName}
                onChange={(e) => setStudioName(e.target.value)}
                placeholder={t("partner.settings.profile.companyName")}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-2xl focus:ring-2 focus:ring-pink-500 focus:border-pink-500 transition-colors placeholder:text-gray-400 dark:placeholder:text-gray-500"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {t("partner.settings.profile.companyName")}
              </p>
            </div>

            <div>
              <label
                htmlFor="phone"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
              >
                {t("common.phone")}
              </label>
              <input
                id="phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(formatPhone(e.target.value))}
                placeholder="(11) 99999-9999"
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-2xl focus:ring-2 focus:ring-pink-500 focus:border-pink-500 transition-colors placeholder:text-gray-400 dark:placeholder:text-gray-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t("common.email")}
              </label>
              <input
                type="email"
                value={profile?.email || ""}
                disabled
                className="w-full px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-2xl bg-gray-50 dark:bg-gray-800 text-gray-500 dark:text-gray-400 cursor-not-allowed"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {t("common.email")}
              </p>
            </div>
          </div>
        </div>

        {/* Preferences Section - Language */}
        <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-[2.5rem] p-8 border border-white/50 dark:border-gray-700/50 mb-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-black/20">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <Globe className="w-5 h-5 text-gray-500" />
            {t("partner.settings.preferences.title")}
          </h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t("partner.settings.preferences.language")}
              </label>
              <LanguageSelector />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t("partner.settings.preferences.theme")}
              </label>
              <ThemeSelector />
            </div>
          </div>
        </div>

        {/* Account Info */}
        <div className="bg-white dark:bg-gray-800 rounded-[1.5rem] p-8 border border-gray-200 dark:border-gray-700 mb-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            {t("partner.settings.title")}
          </h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-xl">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {t("common.status")}
              </p>
              <p className="font-medium text-gray-900 dark:text-white capitalize">
                {profile?.status === "approved"
                  ? `✓ ${t("partner.deliveries.status.delivered")}`
                  : profile?.status === "pending"
                    ? `⏳ ${t("partner.deliveries.status.pending")}`
                    : profile?.status}
              </p>
            </div>
            <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-xl">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {t("partner.credits.balance")}
              </p>
              <p className="font-medium text-gray-900 dark:text-white">
                {profile?.voucher_balance || 0}{" "}
                {t("partner.credits.title").toLowerCase()}
              </p>
            </div>
          </div>
        </div>

        {/* Security Section */}
        <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-[2.5rem] p-8 border border-white/50 dark:border-gray-700/50 mb-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-black/20">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            {t("partner.settings.security.title")}
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
            {t("partner.settings.security.logoutAllDesc")}
          </p>
          <button
            type="button"
            onClick={async () => {
              if (
                window.confirm(t("partner.settings.security.logoutAllConfirm"))
              ) {
                try {
                  await apiClient.post("/auth/logout/all");
                  window.location.href = "/pro/login";
                } catch {
                  toast.error(t("errors.generic"));
                }
              }
            }}
            className="inline-flex items-center gap-2 px-4 py-2 border border-red-200 dark:border-red-900/30 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors text-sm font-medium"
          >
            <LogOut className="w-4 h-4" />
            {t("partner.settings.security.logoutAll")}
          </button>
        </div>

        {/* Submit Button */}
        <div className="flex justify-end">
          <SuccessButton
            type="submit"
            isLoading={updateMutation.isPending}
            isSuccess={saveSuccess}
            loadingText={t("common.loading")}
            successText={t("common.success")}
            onSuccessEnd={() => setSaveSuccess(false)}
            icon={<Save className="w-5 h-5" />}
            size="lg"
          >
            {t("common.save")}
          </SuccessButton>
        </div>
      </form>
    </PartnerPage>
  );
}

export default PartnerSettingsPage;
