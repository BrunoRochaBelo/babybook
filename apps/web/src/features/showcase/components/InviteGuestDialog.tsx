import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "./ui/dialog";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerTrigger } from "./ui/drawer";
import { QrCode, Share2 } from "lucide-react";
import { useIsMobile } from "./ui/use-mobile";
import { toast } from "sonner";

interface InviteGuestDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
}

export function InviteGuestDialog({ open, onOpenChange, children }: InviteGuestDialogProps) {
  const isMobile = useIsMobile();

  const InviteContent = () => (
    <div className="space-y-4 pt-4">
      <div className="bg-muted rounded-xl p-6 text-center">
        <div className="w-40 h-40 mx-auto bg-white dark:bg-background rounded-xl flex items-center justify-center mb-4 border border-border">
          <QrCode className="w-20 h-20 text-muted-foreground" />
        </div>
        <p className="text-sm text-muted-foreground">
          Escaneie o QR Code para acessar
        </p>
      </div>

      <div className="flex gap-2">
        <Input 
          value="https://cofrememoria.app/guestbook/helena-abc123"
          readOnly
          className="h-12 rounded-xl bg-input-background text-sm"
        />
        <Button 
          variant="outline" 
          className="h-12 rounded-xl flex-shrink-0"
          onClick={() => {
            navigator.clipboard?.writeText("https://cofrememoria.app/guestbook/helena-abc123");
            toast.success("Link copiado!");
          }}
        >
          Copiar
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <Button variant="outline" className="h-12 rounded-xl">
          <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
          </svg>
          <span className="text-sm">WhatsApp</span>
        </Button>
        <Button variant="outline" className="h-12 rounded-xl">
          <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
            <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/>
          </svg>
          <span className="text-sm">E-mail</span>
        </Button>
      </div>
    </div>
  );

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerTrigger asChild>
          {children}
        </DrawerTrigger>
        <DrawerContent className="px-4 pb-6">
          <DrawerHeader className="text-left px-0">
            <DrawerTitle>Convide para deixar uma mensagem</DrawerTitle>
          </DrawerHeader>
          <InviteContent />
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Convide para deixar uma mensagem</DialogTitle>
        </DialogHeader>
        <InviteContent />
      </DialogContent>
    </Dialog>
  );
}
