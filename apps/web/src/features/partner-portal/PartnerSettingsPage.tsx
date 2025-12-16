/**
 * Partner Settings Page
 *
 * Página para editar perfil do estúdio/parceiro.
 * Permite atualizar: nome, nome do estúdio, telefone, logo.
 */

import { useMemo, useState, useEffect, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Camera,
  Save,
  Loader2,
  Upload,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { getPartnerProfile, updatePartnerProfile } from "./api";
import type { Partner } from "./types";
import { usePartnerPageHeader } from "@/layouts/partnerPageHeader";
import { PartnerPage } from "@/layouts/PartnerPage";
import { PartnerLoadingState } from "@/layouts/partnerStates";
import { PartnerBackButton } from "@/layouts/PartnerBackButton";

export function PartnerSettingsPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  usePartnerPageHeader(
    useMemo(
      () => ({
        title: "Configurações",
        backTo: "/partner",
        backLabel: "Voltar",
      }),
      [],
    ),
  );

  const [name, setName] = useState("");
  const [studioName, setStudioName] = useState("");
  const [phone, setPhone] = useState("");
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [logoFile, setLogoFile] = useState<File | null>(null);

  // Query
  const { data: profile, isLoading } = useQuery({
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

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: (
      updates: Partial<
        Pick<Partner, "name" | "studio_name" | "phone" | "logo_url">
      >,
    ) => updatePartnerProfile(updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["partner", "profile"] });
      toast.success("Alterações salvas com sucesso!");
    },
    onError: (err) => {
      toast.error(
        err instanceof Error ? err.message : "Erro ao salvar alterações",
      );
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      toast.error("Nome é obrigatório");
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
        toast.error("Selecione uma imagem válida");
        return;
      }
      // Validate file size (max 2MB)
      if (file.size > 2 * 1024 * 1024) {
        toast.error("A imagem deve ter no máximo 2MB");
        return;
      }
      setLogoFile(file);
      // Create preview URL
      setLogoUrl(URL.createObjectURL(file));
    }
  };

  const handleRemoveLogo = () => {
    setLogoFile(null);
    setLogoUrl(null);
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

  if (isLoading) {
    return <PartnerLoadingState label="Carregando configurações…" />;
  }

  return (
    <PartnerPage>
      {/* Desktop Header */}
      <div className="hidden md:block mb-6">
        <PartnerBackButton label="Voltar" />
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
          Configurações do Perfil
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Gerencie as informações do seu estúdio
        </p>
      </div>

      {/* Mobile summary - botão voltar via header sticky */}
      <div className="md:hidden mb-4">
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Atualize dados do estúdio, logo e informações da conta.
        </p>
      </div>

      <form onSubmit={handleSubmit}>
        {/* Logo Section */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Logo do Estúdio
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
                Escolher Imagem
              </button>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                JPG ou PNG até 2MB. Recomendado: 200x200 pixels
              </p>
            </div>
          </div>
        </div>

        {/* Profile Fields */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Informações do Perfil
          </h2>
          <div className="space-y-4">
            <div>
              <label
                htmlFor="name"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
              >
                Seu Nome *
              </label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Seu nome completo"
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-pink-500 transition-colors placeholder:text-gray-400 dark:placeholder:text-gray-500"
              />
            </div>

            <div>
              <label
                htmlFor="studioName"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
              >
                Nome do Estúdio
              </label>
              <input
                id="studioName"
                type="text"
                value={studioName}
                onChange={(e) => setStudioName(e.target.value)}
                placeholder="Ex: Studio Encanto Fotografia"
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-pink-500 transition-colors placeholder:text-gray-400 dark:placeholder:text-gray-500"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Este nome aparecerá nos cartões-convite dos seus clientes
              </p>
            </div>

            <div>
              <label
                htmlFor="phone"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
              >
                WhatsApp
              </label>
              <input
                id="phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(formatPhone(e.target.value))}
                placeholder="(11) 99999-9999"
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-pink-500 transition-colors placeholder:text-gray-400 dark:placeholder:text-gray-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                E-mail
              </label>
              <input
                type="email"
                value={profile?.email || ""}
                disabled
                className="w-full px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-800 text-gray-500 dark:text-gray-400 cursor-not-allowed"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                O e-mail não pode ser alterado
              </p>
            </div>
          </div>
        </div>

        {/* Account Info */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Informações da Conta
          </h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-xl">
              <p className="text-sm text-gray-500 dark:text-gray-400">Status</p>
              <p className="font-medium text-gray-900 dark:text-white capitalize">
                {profile?.status === "approved"
                  ? "✓ Aprovado"
                  : profile?.status === "pending"
                    ? "⏳ Pendente"
                    : profile?.status}
              </p>
            </div>
            <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-xl">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Saldo de Créditos
              </p>
              <p className="font-medium text-gray-900 dark:text-white">
                {profile?.voucher_balance || 0} créditos
              </p>
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={updateMutation.isPending}
            className="inline-flex items-center gap-2 px-6 py-3 bg-pink-500 text-white font-medium rounded-xl hover:bg-pink-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {updateMutation.isPending ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Salvando...
              </>
            ) : (
              <>
                <Save className="w-5 h-5" />
                Salvar Alterações
              </>
            )}
          </button>
        </div>
      </form>
    </PartnerPage>
  );
}

export default PartnerSettingsPage;
