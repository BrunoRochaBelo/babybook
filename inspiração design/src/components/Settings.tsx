import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { Separator } from "./ui/separator";
import { Switch } from "./ui/switch";
import { Label } from "./ui/label";
import { 
  ArrowLeft, User, BookHeart, CreditCard, Download, 
  HelpCircle, LogOut, Share2, UserPlus, Trash2, Shield
} from "lucide-react";
import { motion } from "motion/react";
import { toast } from "sonner@2.0.3";

interface SettingsProps {
  onBack: () => void;
  onLogout: () => void;
}

export function Settings({ onBack, onLogout }: SettingsProps) {
  const handleExportRequest = () => {
    toast.success("Solicitação recebida!", {
      description: "Enviaremos o link de download por e-mail em até 24h",
      duration: 4000,
    });
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
          <h1 className="text-2xl sm:text-3xl mb-2">Configurações</h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            Gerencie sua conta e preferências
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-6 sm:py-8 space-y-6">
        {/* Profile Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <Card className="p-6">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                <User className="w-8 h-8 text-primary" />
              </div>
              <div>
                <h3 className="mb-1">Maria Silva</h3>
                <p className="text-sm text-muted-foreground">maria.silva@email.com</p>
              </div>
            </div>
            <Button variant="outline" className="w-full h-12 rounded-xl">
              Editar Perfil
            </Button>
          </Card>
        </motion.div>

        {/* Children Management */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
        >
          <h3 className="mb-4">Livros dos Meus Filhos</h3>
          <Card className="p-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-muted rounded-xl">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <BookHeart className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h4>Helena</h4>
                    <p className="text-sm text-muted-foreground">10 meses • Administradora</p>
                  </div>
                </div>
                <Button variant="ghost" size="sm" className="rounded-xl">
                  Gerenciar
                </Button>
              </div>

              <Separator />

              <Button variant="outline" className="w-full h-12 rounded-xl">
                <UserPlus className="w-4 h-4 mr-2" />
                Adicionar Outro Filho
              </Button>
            </div>
          </Card>
        </motion.div>

        {/* Sharing & Access */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
        >
          <h3 className="mb-4">Compartilhamento e Acesso</h3>
          <Card className="p-6 space-y-6">
            <div>
              <h4 className="mb-4">Responsáveis com Acesso</h4>
              <div className="space-y-3 mb-4">
                <div className="flex items-center justify-between p-4 bg-muted rounded-xl">
                  <div>
                    <div>João Silva (Você)</div>
                    <div className="text-sm text-muted-foreground">Administrador</div>
                  </div>
                </div>
              </div>
              <Button variant="outline" className="w-full h-12 rounded-xl">
                <UserPlus className="w-4 h-4 mr-2" />
                Convidar Co-responsável
              </Button>
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label>Permitir Links Públicos</Label>
                <p className="text-sm text-muted-foreground">
                  Compartilhe momentos específicos via link
                </p>
              </div>
              <Switch />
            </div>
          </Card>
        </motion.div>

        {/* Billing */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.3 }}
        >
          <h3 className="mb-4">Faturamento</h3>
          <Card className="p-6">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <CreditCard className="w-6 h-6 text-primary" />
              </div>
              <div className="flex-1">
                <h4 className="mb-1">Plano Vitalício Ativo</h4>
                <p className="text-sm text-muted-foreground">
                  Streaming incluído até 10/02/2029
                </p>
              </div>
            </div>

            <div className="bg-secondary/20 rounded-xl p-4 mb-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm">Armazenamento</span>
                <span className="text-sm text-primary">Ilimitado</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Streaming até</span>
                <span className="text-sm">10/02/2029</span>
              </div>
            </div>

            <Button variant="outline" className="w-full h-12 rounded-xl">
              Ver Histórico de Pagamentos
            </Button>
          </Card>
        </motion.div>

        {/* Export Data */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.4 }}
        >
          <h3 className="mb-4">Exportar Dados</h3>
          <Card className="p-6">
            <div className="flex items-start gap-4 mb-6">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Download className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h4 className="mb-2">Backup Completo</h4>
                <p className="text-sm text-muted-foreground">
                  Solicite um arquivo .zip com todas as memórias, fotos, vídeos e áudios de Helena, organizados por capítulos
                </p>
              </div>
            </div>
            <Button 
              className="w-full h-12 rounded-xl bg-primary hover:bg-primary/90"
              onClick={handleExportRequest}
            >
              Solicitar Backup .zip
            </Button>
          </Card>
        </motion.div>

        {/* Privacy & Security */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.5 }}
        >
          <h3 className="mb-4">Privacidade e Segurança</h3>
          <Card className="p-6 space-y-4">
            <Button variant="outline" className="w-full h-12 rounded-xl justify-start">
              <Shield className="w-4 h-4 mr-2" />
              Política de Privacidade
            </Button>
            <Button variant="outline" className="w-full h-12 rounded-xl justify-start">
              <HelpCircle className="w-4 h-4 mr-2" />
              Central de Ajuda
            </Button>
          </Card>
        </motion.div>

        {/* Danger Zone */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.6 }}
        >
          <Card className="p-6 border-destructive/50">
            <h4 className="mb-4 text-destructive">Zona de Perigo</h4>
            <div className="space-y-3">
              <Button 
                variant="outline" 
                className="w-full h-12 rounded-xl justify-start border-destructive/50 text-destructive hover:bg-destructive/10"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Excluir Conta
              </Button>
            </div>
          </Card>
        </motion.div>

        {/* Logout */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.7 }}
        >
          <Button 
            variant="outline" 
            className="w-full h-14 rounded-2xl"
            onClick={onLogout}
          >
            <LogOut className="w-4 h-4 mr-2" />
            Sair
          </Button>
        </motion.div>
      </div>
    </div>
  );
}
