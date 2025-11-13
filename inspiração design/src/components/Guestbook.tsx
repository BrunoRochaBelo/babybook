import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { Badge } from "./ui/badge";
import { ArrowLeft, Share2, Users, Heart, Check, X, Image as ImageIcon, Mic } from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner@2.0.3";
import { InviteGuestDialog } from "./InviteGuestDialog";
import { FloatingNav } from "./FloatingNav";

interface GuestbookProps {
  babyName: string;
  onBack: () => void;
  onNavigate?: (section: 'memories' | 'health' | 'visits') => void;
}

export function Guestbook({ babyName, onBack }: GuestbookProps) {
  const [showInviteDialog, setShowInviteDialog] = useState(false);

  const messages = [
    {
      id: 1,
      name: "Vovó Maria",
      message: "Minha netinha linda! Que Deus abençoe cada dia da sua vida. Vovó te ama infinitamente! 💕",
      type: "approved",
      date: "15/03/2024",
      hasAudio: true
    },
    {
      id: 2,
      name: "Tia Ana",
      message: "Helena, você trouxe tanta luz para nossa família! Mal posso esperar para ver você crescer.",
      type: "approved",
      date: "18/03/2024",
      hasPhoto: true
    },
    {
      id: 3,
      name: "Tio Pedro",
      message: "Bem-vinda ao mundo, pequena! Seu tio já está planejando todas as aventuras que vamos viver juntos.",
      type: "pending",
      date: "20/03/2024"
    }
  ];

  const approvedMessages = messages.filter(m => m.type === 'approved');
  const pendingMessages = messages.filter(m => m.type === 'pending');

  const handleApprove = (id: number) => {
    toast.success("Mensagem aprovada!", {
      description: "Agora ela está visível no livro de visitas",
    });
  };

  const handleReject = (id: number) => {
    toast.success("Mensagem removida");
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header - Sticky */}
      <div className="sticky top-0 z-10 bg-card/95 backdrop-blur-sm border-b border-border">
        <div className="max-w-4xl mx-auto px-4 py-4 sm:py-6">
          <Button 
            variant="ghost" 
            size="sm"
            onClick={onBack}
            className="mb-3 -ml-2 h-9"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar
          </Button>
          <div className="flex items-center justify-between gap-3">
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl sm:text-3xl mb-1 sm:mb-2 truncate">Livro de Visitas</h1>
              <p className="text-xs sm:text-sm text-muted-foreground">
                {approvedMessages.length} mensagens de amor guardadas
              </p>
            </div>
            <InviteGuestDialog open={showInviteDialog} onOpenChange={setShowInviteDialog}>
              <Button className="h-10 sm:h-12 rounded-xl bg-primary hover:bg-primary/90 flex-shrink-0 px-3 sm:px-4">
                <Share2 className="w-4 h-4 sm:mr-2" />
                <span className="hidden sm:inline">Convidar</span>
              </Button>
            </InviteGuestDialog>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Storage Info */}
        <Card className="p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="mb-1">Mensagens Guardadas</h3>
              <p className="text-sm text-muted-foreground">
                5 de 20 slots utilizados
              </p>
            </div>
            <Button variant="outline" className="rounded-xl">
              Ampliar para 50
            </Button>
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div className="h-full bg-primary" style={{ width: '25%' }} />
          </div>
        </Card>

        {/* Pending Moderation */}
        {pendingMessages.length > 0 && (
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <h3>Aguardando Moderação</h3>
              <Badge variant="secondary">{pendingMessages.length}</Badge>
            </div>
            <div className="space-y-3">
              {pendingMessages.map((message, index) => (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                >
                  <Card className="p-4 border-accent/50">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center flex-shrink-0">
                        <Users className="w-6 h-6 text-accent" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span>{message.name}</span>
                          <span className="text-xs text-muted-foreground">• {message.date}</span>
                        </div>
                        <p className="text-sm text-muted-foreground mb-3">
                          {message.message}
                        </p>
                        <div className="flex gap-2">
                          <Button 
                            size="sm" 
                            className="rounded-xl bg-primary hover:bg-primary/90"
                            onClick={() => handleApprove(message.id)}
                          >
                            <Check className="w-4 h-4 mr-1" />
                            Aprovar
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline"
                            className="rounded-xl"
                            onClick={() => handleReject(message.id)}
                          >
                            <X className="w-4 h-4 mr-1" />
                            Rejeitar
                          </Button>
                        </div>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* Approved Messages */}
        <div>
          <h3 className="mb-4">Mensagens de Amor</h3>
          <div className="space-y-4">
            {approvedMessages.map((message, index) => (
              <motion.div
                key={message.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
              >
                <Card className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <Heart className="w-6 h-6 text-primary fill-current" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span>{message.name}</span>
                        <span className="text-xs text-muted-foreground">• {message.date}</span>
                      </div>
                      <p className="text-muted-foreground mb-4">
                        {message.message}
                      </p>
                      {(message.hasAudio || message.hasPhoto) && (
                        <div className="flex gap-2">
                          {message.hasAudio && (
                            <div className="flex items-center gap-2 text-sm text-primary">
                              <Mic className="w-4 h-4" />
                              <span>Áudio anexado</span>
                            </div>
                          )}
                          {message.hasPhoto && (
                            <div className="flex items-center gap-2 text-sm text-primary">
                              <ImageIcon className="w-4 h-4" />
                              <span>Foto anexada</span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Empty State */}
        {approvedMessages.length === 0 && pendingMessages.length === 0 && (
          <Card className="p-12 text-center bg-gradient-to-br from-primary/5 to-accent/5 border-primary/20">
            <Users className="w-16 h-16 text-primary mx-auto mb-4" />
            <h3 className="mb-2">Ainda sem mensagens</h3>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              Convide familiares e amigos para deixarem mensagens especiais para {babyName}
            </p>
            <Button 
              className="h-12 px-6 rounded-xl bg-primary hover:bg-primary/90"
              onClick={() => setShowInviteDialog(true)}
            >
              <Share2 className="w-4 h-4 mr-2" />
              Enviar Primeiro Convite
            </Button>
          </Card>
        )}
      </div>
    </div>
  );
}
