/**
 * VoucherCard Component
 *
 * Componente de cartão-convite digital com:
 * - QR Code real (usando qrcode.react)
 * - Download como imagem (usando html2canvas)
 * - Compartilhamento via WhatsApp
 */

import { useRef, useState, useCallback, useMemo } from "react";
import { QRCodeSVG } from "qrcode.react";
import {
  Download,
  Share2,
  Copy,
  Check,
  MessageCircle,
  Mail,
  Loader2,
  Heart,
} from "lucide-react";
import type { VoucherCardData } from "./types";

interface VoucherCardProps {
  data: VoucherCardData;
  onCopy?: () => void;
}

export function VoucherCard({ data, onCopy }: VoucherCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [copied, setCopied] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  const redeemUrl = useMemo(() => {
    try {
      const u = new URL(data.redeem_url, window.location.origin);
      // Normaliza para a rota curta e pública (mantemos aliases no router).
      u.pathname = u.pathname.replace(/^\/voucher\/redeem\//, "/resgate/");
      u.pathname = u.pathname.replace(/^\/resgatar\//, "/resgate/");
      return u.toString();
    } catch {
      // Fallback: se for uma URL relativa ou inválida, não arrisca quebrar.
      return data.redeem_url;
    }
  }, [data.redeem_url]);

  const openExternal = useCallback((url: string) => {
    const w = window.open(url, "_blank", "noopener,noreferrer");
    if (w) w.opener = null;
  }, []);

  const handleCopyCode = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(data.voucher_code);
      setCopied(true);
      onCopy?.();
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  }, [data.voucher_code, onCopy]);

  const handleCopyUrl = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(redeemUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  }, [redeemUrl]);

  const handleDownload = useCallback(async () => {
    if (!cardRef.current) return;

    setIsDownloading(true);
    try {
      // Dynamically import html2canvas
      const html2canvas = (await import("html2canvas")).default;

      const canvas = await html2canvas(cardRef.current, {
        backgroundColor: "#ffffff",
        scale: 2, // Higher resolution
        logging: false,
        useCORS: true,
      });

      const link = document.createElement("a");
      link.download = `voucher-${data.voucher_code}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
    } catch (err) {
      console.error("Failed to download:", err);
    } finally {
      setIsDownloading(false);
    }
  }, [data.voucher_code]);

  const handleWhatsAppShare = useCallback(() => {
    const message = encodeURIComponent(
      `Presente especial para você!\n\n` +
        `${data.beneficiary_name ? `Olá ${data.beneficiary_name}! ` : ""}` +
        `Você recebeu acesso ao Baby Book — um álbum digital para guardar as memórias mais preciosas.\n\n` +
        `Código de resgate: ${data.voucher_code}\n` +
        `Link: ${redeemUrl}\n\n` +
        `Se abrir uma tela de login, tudo bem: o código fica salvo e você continua o resgate depois de entrar/criar conta.\n\n` +
        `${data.message ? `Mensagem do fotógrafo: "${data.message}"\n\n` : ""}` +
        `Com carinho, ${data.studio_name || "seu fotógrafo"}`,
    );
    openExternal(`https://wa.me/?text=${message}`);
  }, [data, openExternal, redeemUrl]);

  const handleEmailShare = useCallback(() => {
    const subject = encodeURIComponent(
      `🎁 Presente especial: seu Baby Book está pronto!`,
    );
    const body = encodeURIComponent(
      `Olá${data.beneficiary_name ? ` ${data.beneficiary_name}` : ""}!\n\n` +
        `Você recebeu um presente muito especial: acesso ao Baby Book, ` +
        `um álbum digital para guardar as memórias mais preciosas dos primeiros anos de vida.\n\n` +
        `🔑 Seu código de resgate: ${data.voucher_code}\n\n` +
        `📱 Para acessar, clique no link: ${redeemUrl}\n\n` +
        `Se o link abrir uma tela de login, não se preocupe: o código fica salvo e você continua depois de entrar/criar conta.\n\n` +
        `${data.message ? `Mensagem do fotógrafo:\n"${data.message}"\n\n` : ""}` +
        `📷 ${data.assets_count} fotos estão esperando por você!\n\n` +
        `Com carinho,\n${data.studio_name || "Seu fotógrafo"}`,
    );
    window.location.href = `mailto:?subject=${subject}&body=${body}`;
  }, [data, redeemUrl]);

  return (
    <div className="space-y-6">
      {/* Card Preview - This is what gets downloaded */}
      <div
        ref={cardRef}
        className="bg-gradient-to-br from-pink-50 to-rose-100 rounded-2xl p-6 border border-pink-200 shadow-sm"
      >
        {/* Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-gradient-to-br from-pink-500 to-rose-500 rounded-xl mb-3">
            <Heart className="w-6 h-6 text-white" />
          </div>
          <p className="text-pink-600 text-sm font-medium">Baby Book</p>
          {data.studio_name && (
            <p className="text-gray-500 text-xs mt-1">
              Presente de {data.studio_name}
            </p>
          )}
          <h3 className="text-xl font-bold text-gray-900 mt-2">
            {data.beneficiary_name || "Para você!"}
          </h3>
        </div>

        {/* QR Code */}
        <div className="flex justify-center mb-6">
          <div className="bg-white p-4 rounded-xl shadow-sm">
            <QRCodeSVG
              value={redeemUrl}
              size={160}
              level="M"
              includeMargin={false}
              fgColor="#1f2937"
            />
          </div>
        </div>

        {/* Code Display */}
        <div className="bg-white rounded-xl p-4 mb-4 shadow-sm">
          <p className="text-center text-gray-600 text-sm mb-2">
            Seu código de resgate:
          </p>
          <p className="text-center text-2xl font-mono font-bold text-pink-600 tracking-wider">
            {data.voucher_code}
          </p>
        </div>

        {/* Info */}
        <p className="text-center text-gray-600 text-sm">
          📷 {data.assets_count} fotos estão esperando por você!
        </p>

        {/* Message */}
        {data.message && (
          <div className="mt-4 p-3 bg-white/50 rounded-xl">
            <p className="text-center text-gray-700 text-sm italic">
              "{data.message}"
            </p>
          </div>
        )}

        {/* Footer */}
        <div className="mt-6 pt-4 border-t border-pink-200">
          <p className="text-center text-xs text-gray-500">
            Escaneie o QR Code ou acesse:
          </p>
          <p className="text-center text-xs text-pink-600 font-medium mt-1 break-all">
            {redeemUrl}
          </p>
        </div>
      </div>

      {/* Actions */}
      <div className="space-y-3">
        {/* Copy Actions */}
        <div className="flex gap-2">
          <button
            onClick={handleCopyCode}
            className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 text-green-500" />
                Copiado!
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                Copiar Código
              </>
            )}
          </button>
          <button
            onClick={handleCopyUrl}
            className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            <Share2 className="w-4 h-4" />
            Copiar Link
          </button>
        </div>

        {/* Download */}
        <button
          onClick={handleDownload}
          disabled={isDownloading}
          className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 bg-pink-500 text-white font-medium rounded-xl hover:bg-pink-600 transition-colors disabled:opacity-50"
        >
          {isDownloading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Gerando imagem...
            </>
          ) : (
            <>
              <Download className="w-5 h-5" />
              Baixar Cartão (PNG)
            </>
          )}
        </button>

        {/* Share Buttons */}
        <div className="flex gap-2">
          <button
            onClick={handleWhatsAppShare}
            className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-3 bg-green-500 text-white font-medium rounded-xl hover:bg-green-600 transition-colors"
          >
            <MessageCircle className="w-5 h-5" />
            WhatsApp
          </button>
          <button
            onClick={handleEmailShare}
            className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-3 bg-blue-500 text-white font-medium rounded-xl hover:bg-blue-600 transition-colors"
          >
            <Mail className="w-5 h-5" />
            E-mail
          </button>
        </div>
      </div>

      {/* Tip */}
      <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
        💡 Dica: Baixe o cartão e envie pelo WhatsApp ou imprima para entregar
        pessoalmente!
      </p>
    </div>
  );
}

export default VoucherCard;
