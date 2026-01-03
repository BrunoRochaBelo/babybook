import { useMemo } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useTranslation, useLanguage } from "@babybook/i18n";
import {
  Loader2,
  Calendar,
  User,
  ExternalLink,
  Edit,
  MapPin,
  Image as ImageIcon,
  Video,
  Ticket,
} from "lucide-react";

import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerBody,
  DrawerFooter,
} from "@/components/ui/drawer";
import { StatusBadge } from "./StatusBadges";
import { CreditStatusBadge } from "../creditStatus";
import { getDelivery } from "../api";
import { getPartnerDeliveryDisplayStatus } from "../deliveryStatus";
import { formatDate } from "../utils";

interface DeliveryDetailsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  deliveryId: string | null;
}

export function DeliveryDetailsDrawer({
  isOpen,
  onClose,
  deliveryId,
}: DeliveryDetailsDrawerProps) {
  const { t } = useTranslation();
  const { language } = useLanguage();

  const { data: delivery, isLoading, isError } = useQuery({
    queryKey: ["partner", "delivery", deliveryId],
    queryFn: () => getDelivery(deliveryId!),
    enabled: !!deliveryId && isOpen,
  });

  const displayStatus = delivery
    ? getPartnerDeliveryDisplayStatus(delivery)
    : "draft";

  return (
    <Drawer open={isOpen} onOpenChange={(open) => !open && onClose()} direction="right">
      <DrawerContent className="sm:max-w-md w-full">
        {isLoading ? (
          <div className="h-full flex flex-col items-center justify-center gap-4">
            <Loader2 className="w-8 h-8 animate-spin text-pink-500" />
            <p className="text-gray-500">Carregando detalhes...</p>
          </div>
        ) : isError || !delivery ? (
          <div className="h-full flex flex-col items-center justify-center p-6 text-center">
            <p className="text-red-500 font-medium mb-2">Erro ao carregar</p>
            <p className="text-sm text-gray-400 mb-4">
              Não foi possível buscar os dados da entrega.
            </p>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-100 dark:bg-gray-800 rounded-lg text-sm font-medium"
            >
              Fechar
            </button>
          </div>
        ) : (
          <>
            <DrawerHeader>
              <div className="space-y-1">
                <DrawerTitle className="text-xl">
                  {delivery.title || "Sem título"}
                </DrawerTitle>
                <DrawerDescription className="flex items-center gap-2">
                  <span>ID: {delivery.id.slice(0, 8)}</span>
                </DrawerDescription>
              </div>
              <div className="flex flex-col items-end gap-2">
                 <StatusBadge status={displayStatus} />
              </div>
            </DrawerHeader>

            <DrawerBody className="space-y-6">
              {/* Main Info */}
              <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                      <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Data do Evento</label>
                      <div className="flex items-center gap-2 text-gray-900 dark:text-white">
                          <Calendar className="w-4 h-4 text-pink-500" />
                          <span className="font-medium">
                              {delivery.event_date ? formatDate(delivery.event_date, language) : "Não informada"}
                          </span>
                      </div>
                  </div>
                  <div className="space-y-1">
                      <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Cliente</label>
                       <div className="flex items-center gap-2 text-gray-900 dark:text-white">
                          <User className="w-4 h-4 text-pink-500" />
                          <span className="font-medium truncate block max-w-[120px]" title={delivery.client_name || ""}>
                              {delivery.client_name || "N/A"}
                          </span>
                      </div>
                  </div>
              </div>

              {/* Voucher Section */}
              <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-2xl border border-gray-100 dark:border-gray-700">
                  <div className="flex items-center justify-between mb-2">
                      <h4 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
                          <Ticket className="w-4 h-4 text-purple-500" />
                          Voucher & Créditos
                      </h4>
                      <CreditStatusBadge status={delivery.credit_status} variant="pill" />
                  </div>
                  
                  {delivery.voucher_code ? (
                      <div className="mt-3 p-3 bg-white dark:bg-gray-800 rounded-xl border border-dashed border-gray-200 dark:border-gray-600 text-center">
                          <p className="text-xs text-gray-500 mb-1">CÓDIGO DO VOUCHER</p>
                          <p className="text-2xl font-mono font-bold text-gray-900 dark:text-white tracking-widest select-all">
                              {delivery.voucher_code}
                          </p>
                      </div>
                  ) : (
                      <p className="text-xs text-gray-500 mt-1">
                          Voucher ainda não gerado. Complete o upload para liberar.
                      </p>
                  )}
              </div>

               {/* Assets Summary */}
               <div className="space-y-3">
                   <h4 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
                       <ImageIcon className="w-4 h-4 text-rose-500" />
                       Arquivos
                       <span className="ml-auto text-xs font-normal text-gray-500">
                           {delivery.assets?.length || 0} itens
                       </span>
                   </h4>
                   
                   {delivery.assets && delivery.assets.length > 0 ? (
                       <div className="grid grid-cols-3 gap-2">
                           {delivery.assets.slice(0, 6).map((asset) => (
                               <div key={asset.upload_id} className="aspect-square bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden relative">
                                   {/* Mock thumbnail logic */}
                                   <div className="w-full h-full flex items-center justify-center text-gray-400">
                                       {asset.content_type.startsWith("video") ? (
                                           <Video className="w-6 h-6" />
                                       ) : (
                                           <ImageIcon className="w-6 h-6" />
                                       )}
                                   </div>
                               </div>
                           ))}
                           {delivery.assets.length > 6 && (
                               <div className="aspect-square bg-gray-50 dark:bg-gray-800 rounded-lg flex items-center justify-center text-xs font-bold text-gray-500">
                                   +{delivery.assets.length - 6}
                               </div>
                           )}
                       </div>
                   ) : (
                       <div className="p-4 rounded-xl border border-dashed border-gray-200 dark:border-gray-700 text-center text-gray-400 text-sm">
                           Nenhum arquivo enviado
                       </div>
                   )}
               </div>

            </DrawerBody>

            <DrawerFooter className="grid grid-cols-2 gap-3">
                 <Link
                    to={`/partner/deliveries/${delivery.id}`}
                    className="flex items-center justify-center gap-2 px-4 py-3 bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-bold rounded-xl"
                 >
                     <ExternalLink className="w-4 h-4" />
                     Abrir Completo
                 </Link>
                 
                 {/* Secondary Action based on Status */}
                 {displayStatus === "draft" ? (
                     <Link
                        to={`/partner/deliveries/${delivery.id}/upload`}
                        className="flex items-center justify-center gap-2 px-4 py-3 bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white font-bold rounded-xl hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                     >
                         <Edit className="w-4 h-4" />
                         Editar / Upload
                     </Link>
                 ) : (
                     <button
                        onClick={onClose}
                        className="flex items-center justify-center gap-2 px-4 py-3 bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white font-bold rounded-xl"
                     >
                         Fechar
                     </button>
                 )}
            </DrawerFooter>
          </>
        )}
      </DrawerContent>
    </Drawer>
  );
}
