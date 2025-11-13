import { useState } from "react";
import {
  ArrowLeft,
  Share2,
  Users,
  Heart,
  Check,
  X,
  Image as ImageIcon,
  Mic,
} from "lucide-react";
import { motion } from "motion/react";
import { toast } from "sonner";

interface GuestbookProps {
  babyName: string;
  onBack: () => void;
  onNavigate?: (section: "memories" | "health" | "visits") => void;
}

export function Guestbook({ babyName, onBack }: GuestbookProps) {
  const [messages, setMessages] = useState([
    {
      id: 1,
      name: "Vovó Maria",
      message:
        "Minha netinha linda! Que Deus abençoe cada dia da sua vida. Vovó te ama infinitamente! 💕",
      type: "approved" as const,
      date: "15/03/2024",
      hasAudio: true,
      hasPhoto: false,
    },
    {
      id: 2,
      name: "Tia Ana",
      message:
        "Helena, você trouxe tanta luz para nossa família! Mal posso esperar para ver você crescer.",
      type: "approved" as const,
      date: "18/03/2024",
      hasPhoto: true,
      hasAudio: false,
    },
    {
      id: 3,
      name: "Tio Pedro",
      message:
        "Bem-vinda ao mundo, pequena! Seu tio já está planejando todas as aventuras que vamos viver juntos.",
      type: "pending" as const,
      date: "20/03/2024",
      hasAudio: false,
      hasPhoto: false,
    },
  ]);

  const approvedMessages = messages.filter((m) => m.type === "approved");
  const pendingMessages = messages.filter((m) => m.type === "pending");

  const handleApprove = (id: number) => {
    setMessages(
      messages.map((m) =>
        m.id === id ? { ...m, type: "approved" as const } : m,
      ),
    );
    toast.success("Mensagem aprovada!");
  };

  const handleReject = (id: number) => {
    setMessages(messages.filter((m) => m.id !== id));
    toast.success("Mensagem removida");
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="sticky top-0 z-10 bg-card/95 backdrop-blur-sm border-b border-border">
        <div className="max-w-4xl mx-auto px-4 py-4 sm:py-6">
          <button
            onClick={onBack}
            className="mb-3 -ml-2 h-9 flex items-center gap-2 text-sm hover:opacity-70"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar
          </button>
          <div className="flex items-center justify-between gap-3">
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl sm:text-3xl font-serif mb-1 sm:mb-2 truncate">
                Livro de Visitas
              </h1>
              <p className="text-xs sm:text-sm text-muted-foreground">
                {approvedMessages.length} mensagens de amor guardadas
              </p>
            </div>
            <button className="h-10 sm:h-12 px-3 sm:px-4 rounded-xl bg-primary hover:bg-primary/90 text-white text-sm flex-shrink-0 flex items-center justify-center gap-2">
              <Share2 className="w-4 h-4" />
              <span className="hidden sm:inline">Convidar</span>
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Storage Info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-6 rounded-3xl border border-border/50 bg-card/50 mb-6"
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-serif text-lg mb-1">Mensagens Guardadas</h3>
              <p className="text-sm text-muted-foreground">
                5 de 20 slots utilizados
              </p>
            </div>
            <button className="px-4 py-2 rounded-xl border border-border hover:bg-muted/50 text-sm transition-colors">
              Ampliar para 50
            </button>
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div className="h-full bg-primary" style={{ width: "25%" }} />
          </div>
        </motion.div>

        {/* Pending Moderation */}
        {pendingMessages.length > 0 && (
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <h3 className="font-serif text-lg">Aguardando Moderação</h3>
              <span className="text-xs bg-secondary/50 text-secondary-foreground px-2 py-1 rounded-full">
                {pendingMessages.length}
              </span>
            </div>
            <div className="space-y-3">
              {pendingMessages.map((message, index) => (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                  className="p-4 rounded-3xl border-accent/50 border bg-card/50"
                >
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center flex-shrink-0">
                      <Users className="w-6 h-6 text-accent" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="font-medium">{message.name}</span>
                        <span className="text-xs text-muted-foreground">
                          • {message.date}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground mb-3">
                        {message.message}
                      </p>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleApprove(message.id)}
                          className="px-4 py-2 rounded-xl bg-primary hover:bg-primary/90 text-white text-sm flex items-center gap-1"
                        >
                          <Check className="w-4 h-4" />
                          Aprovar
                        </button>
                        <button
                          onClick={() => handleReject(message.id)}
                          className="px-4 py-2 rounded-xl border border-border hover:bg-muted/50 text-sm flex items-center gap-1"
                        >
                          <X className="w-4 h-4" />
                          Rejeitar
                        </button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* Approved Messages */}
        <div>
          <h3 className="font-serif text-lg mb-4">Mensagens de Amor</h3>
          <div className="space-y-4">
            {approvedMessages.map((message, index) => (
              <motion.div
                key={message.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
                className="p-6 rounded-3xl border border-border/50 bg-card/50"
              >
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Heart className="w-6 h-6 text-primary fill-current" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="font-medium">{message.name}</span>
                      <span className="text-xs text-muted-foreground">
                        • {message.date}
                      </span>
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
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
