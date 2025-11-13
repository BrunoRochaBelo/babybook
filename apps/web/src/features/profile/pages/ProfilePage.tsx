import React from "react";
import { User, Mail, Key, Baby } from "lucide-react";
import { useProfile } from "../hooks/useProfile";
import { Button } from "@/components/ui/button";

export const ProfilePage = () => {
  const { data: profile, isLoading } = useProfile();

  if (isLoading || !profile) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="h-24 bg-gray-200 rounded-lg animate-pulse mb-8" />
        <div className="h-12 bg-gray-200 rounded-lg animate-pulse" />
        <div className="h-12 bg-gray-200 rounded-lg animate-pulse mt-4" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center gap-4 mb-8">
        <div className="w-20 h-20 rounded-full bg-gray-200 flex items-center justify-center">
          <User className="w-10 h-10 text-gray-500" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-gray-800">{profile.name}</h1>
          <p className="text-gray-500">{profile.email}</p>
        </div>
      </div>

      <div className="space-y-6">
        <div>
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Minha Conta</h2>
          <div className="bg-white rounded-lg border border-gray-200 p-4 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Mail className="w-5 h-5 text-gray-500" />
                <span>{profile.email}</span>
              </div>
              <Button variant="outline" size="sm" disabled>Alterar E-mail</Button>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Key className="w-5 h-5 text-gray-500" />
                <span>••••••••</span>
              </div>
              <Button variant="outline" size="sm">Alterar Senha</Button>
            </div>
          </div>
        </div>

        <div>
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Crianças</h2>
          <div className="bg-white rounded-lg border border-gray-200 p-4 space-y-4">
            {profile.children.map(child => (
              <div key={child.id} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Baby className="w-5 h-5 text-primary" />
                  <span>{child.name}</span>
                </div>
                <Button variant="ghost" size="sm">Gerenciar</Button>
              </div>
            ))}
             <Button variant="outline" className="w-full">Adicionar Criança</Button>
          </div>
        </div>
      </div>
    </div>
  );
};
