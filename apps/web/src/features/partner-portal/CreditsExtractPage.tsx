
import { PartnerPage } from "@/layouts/PartnerPage";
import { PartnerBackButton } from "@/layouts/PartnerBackButton";
import { useQuery } from "@tanstack/react-query";
import { getCreditsHistory } from "./api";
import { Loader2, ArrowUpRight, ArrowDownLeft, Clock } from "lucide-react";
import { CreditsExtractSkeleton } from "./components/CreditsExtractSkeleton";
import { useTranslation, useLanguage } from "@babybook/i18n";

export function CreditsExtractPage() {
  const { t } = useTranslation();
  const { language } = useLanguage();

  const { data, isLoading } = useQuery({
    queryKey: ["partner", "credits", "history"],
    queryFn: () => getCreditsHistory(),
  });
  
  const formatDate = (dateStr: string) => {
      try {
          return new Intl.DateTimeFormat(language, {
              day: 'numeric',
              month: 'long',
              hour: '2-digit',
              minute: '2-digit'
          }).format(new Date(dateStr));
      } catch {
          return dateStr;
      }
  };

  return (
    <PartnerPage>
      <div className="max-w-4xl mx-auto space-y-8">
        <div>
          <PartnerBackButton to="/partner/credits" label={t("partner.credits.backToCredits", "Voltar para Créditos")} />
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mt-4">
            Extrato de Uso
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-2">
            Acompanhe o histórico de adição e consumo dos seus créditos.
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-[2rem] border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden">
          {isLoading ? (
            <CreditsExtractSkeleton />
          ) : data?.items && data.items.length > 0 ? (
            <div className="divide-y divide-gray-100 dark:divide-gray-700">
              {data.items.map((item) => (
                <div key={item.id} className="p-6 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                      item.amount > 0 
                        ? "bg-green-100 text-green-600 dark:bg-green-900/20 dark:text-green-400" 
                        : "bg-red-100 text-red-600 dark:bg-red-900/20 dark:text-red-400"
                    }`}>
                      {item.amount > 0 ? <ArrowUpRight className="w-6 h-6" /> : <ArrowDownLeft className="w-6 h-6" />}
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900 dark:text-white">
                        {item.description}
                      </h3>
                      <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mt-1">
                        <Clock className="w-3 h-3" />
                        <span>
                          {formatDate(item.created_at)}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`text-lg font-bold ${
                      item.amount > 0 
                        ? "text-green-600 dark:text-green-400" 
                        : "text-red-600 dark:text-red-400"
                    }`}>
                      {item.amount > 0 ? "+" : ""}{item.amount}
                    </div>
                    <div className="text-xs text-gray-400 dark:text-gray-500 uppercase tracking-wider font-bold mt-1">
                       Saldo: {item.balance_after}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-12 text-center text-gray-500 dark:text-gray-400">
              Nenhuma movimentação encontrada.
            </div>
          )}
        </div>
      </div>
    </PartnerPage>
  );
}
