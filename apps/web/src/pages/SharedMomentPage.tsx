/**
 * SharedMomentPage - Public View for Shared Moments
 *
 * This page is the entry point for viral sharing:
 * - Public view of a shared moment (no auth required)
 * - Beautiful presentation of moment content
 * - Call-to-action to create own babybook
 * - Meta tags for social preview (Open Graph, Twitter Cards)
 *
 * Route: /share/:token
 */

import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { motion } from "motion/react";
import {
  Heart,
  Calendar,
  Share2,
  ArrowRight,
  MessageCircle,
  Sparkles,
  Play,
  Volume2,
  ChevronLeft,
  ChevronRight,
  Gift,
} from "lucide-react";
import { cn } from "@/lib/utils";

// Mock shared moment data (would come from API in real app)
interface SharedMoment {
  id: string;
  token: string;
  title: string;
  description?: string;
  occurredAt: string;
  childName: string;
  childAge?: string;
  media: Array<{
    id: string;
    kind: "photo" | "video" | "audio";
    url: string;
  }>;
  partnerBranding?: {
    name: string;
    logo?: string;
  };
}

export function SharedMomentPage() {
  const { token } = useParams<{ token: string }>();
  const [moment, setMoment] = useState<SharedMoment | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentMediaIndex, setCurrentMediaIndex] = useState(0);
  const [showShareMenu, setShowShareMenu] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [hasLiked, setHasLiked] = useState(false);

  // Fetch shared moment data
  useEffect(() => {
    const fetchMoment = async () => {
      setIsLoading(true);
      try {
        // In real app: const response = await api.get(`/share/${token}`);
        // Mock data for now:
        await new Promise((resolve) => setTimeout(resolve, 800));

        // Simulating API response
        setMoment({
          id: "moment-123",
          token: token || "",
          title: "Primeiro Sorriso",
          description:
            "Hoje, aos 2 meses, o pequeno Miguel nos presenteou com seu primeiro sorriso de verdade! Foi logo de manhã, quando a mamãe estava trocando sua fralda. Um momento mágico que nunca vamos esquecer.",
          occurredAt: "2024-01-15",
          childName: "Miguel",
          childAge: "2 meses",
          media: [
            {
              id: "m1",
              kind: "photo",
              url: "https://images.unsplash.com/photo-1519689680058-324335c77eba?w=800",
            },
            {
              id: "m2",
              kind: "photo",
              url: "https://images.unsplash.com/photo-1555252333-9f8e92e65df9?w=800",
            },
          ],
          partnerBranding: {
            name: "Studio Maria Fotografia",
          },
        });
        setLikeCount(Math.floor(Math.random() * 50) + 10);
      } catch {
        setError("Momento não encontrado ou link expirado");
      } finally {
        setIsLoading(false);
      }
    };

    if (token) {
      fetchMoment();
    }
  }, [token]);

  const handleLike = () => {
    if (!hasLiked) {
      setLikeCount((prev) => prev + 1);
      setHasLiked(true);
    }
  };

  const handleShare = async () => {
    const shareUrl = window.location.href;
    const shareText = moment
      ? `Olha esse momento especial de ${moment.childName}: ${moment.title}`
      : "Momento especial compartilhado via Babybook";

    if (navigator.share) {
      try {
        await navigator.share({
          title: moment?.title || "Momento Babybook",
          text: shareText,
          url: shareUrl,
        });
      } catch {
        // User cancelled or share failed
        setShowShareMenu(true);
      }
    } else {
      setShowShareMenu(true);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(window.location.href);
    alert("Link copiado!");
    setShowShareMenu(false);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("pt-BR", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-pink-50 to-white flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full"
        />
      </div>
    );
  }

  // Error state
  if (error || !moment) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-pink-50 to-white flex flex-col items-center justify-center p-6 text-center">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-6"
        >
          <MessageCircle className="w-10 h-10 text-gray-400" />
        </motion.div>
        <h1 className="text-2xl font-serif font-bold text-gray-800 mb-2">
          Momento não encontrado
        </h1>
        <p className="text-gray-500 mb-8 max-w-sm">
          Este link pode ter expirado ou o momento foi removido pelo autor.
        </p>
        <Link
          to="/"
          className="px-6 py-3 bg-primary text-white rounded-full font-semibold hover:bg-primary/90 transition-colors"
        >
          Criar meu Babybook
        </Link>
      </div>
    );
  }

  const currentMedia = moment.media[currentMediaIndex];

  return (
    <div className="min-h-screen bg-gradient-to-b from-pink-50 to-white">
      {/* Header - Fixed */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-pink-100">
        <div className="max-w-lg mx-auto px-4 h-14 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-pink-400 to-rose-500 rounded-xl flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <span className="font-serif font-bold text-gray-800">Babybook</span>
          </Link>

          <Link
            to="/register"
            className="text-sm font-semibold text-primary hover:underline"
          >
            Criar meu diário
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="pt-14 pb-24">
        {/* Media Gallery */}
        <div className="relative bg-black aspect-[4/5] max-h-[60vh]">
          {moment.media.length > 0 && (
            <>
              {currentMedia.kind === "photo" && (
                <img
                  src={currentMedia.url}
                  alt={moment.title}
                  className="w-full h-full object-cover"
                />
              )}
              {currentMedia.kind === "video" && (
                <div className="relative w-full h-full">
                  <video
                    src={currentMedia.url}
                    controls
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="w-16 h-16 bg-white/80 rounded-full flex items-center justify-center">
                      <Play className="w-8 h-8 text-gray-800 ml-1" />
                    </div>
                  </div>
                </div>
              )}
              {currentMedia.kind === "audio" && (
                <div className="w-full h-full bg-gradient-to-br from-purple-100 to-indigo-100 flex flex-col items-center justify-center p-8">
                  <div className="w-24 h-24 bg-gradient-to-br from-purple-400 to-indigo-500 rounded-full flex items-center justify-center mb-6">
                    <Volume2 className="w-12 h-12 text-white" />
                  </div>
                  <audio
                    src={currentMedia.url}
                    controls
                    className="w-full max-w-xs"
                  />
                </div>
              )}

              {/* Navigation Arrows */}
              {moment.media.length > 1 && (
                <>
                  <button
                    onClick={() =>
                      setCurrentMediaIndex((prev) =>
                        prev > 0 ? prev - 1 : moment.media.length - 1,
                      )
                    }
                    className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/80 rounded-full flex items-center justify-center shadow-lg"
                  >
                    <ChevronLeft className="w-6 h-6 text-gray-800" />
                  </button>
                  <button
                    onClick={() =>
                      setCurrentMediaIndex((prev) =>
                        prev < moment.media.length - 1 ? prev + 1 : 0,
                      )
                    }
                    className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/80 rounded-full flex items-center justify-center shadow-lg"
                  >
                    <ChevronRight className="w-6 h-6 text-gray-800" />
                  </button>
                </>
              )}

              {/* Dots Indicator */}
              {moment.media.length > 1 && (
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5">
                  {moment.media.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentMediaIndex(index)}
                      className={cn(
                        "w-2 h-2 rounded-full transition-all",
                        index === currentMediaIndex
                          ? "w-4 bg-white"
                          : "bg-white/50",
                      )}
                    />
                  ))}
                </div>
              )}
            </>
          )}
        </div>

        {/* Content */}
        <div className="max-w-lg mx-auto px-4 -mt-6 relative z-10">
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="bg-white rounded-3xl shadow-xl border border-pink-100 p-6"
          >
            {/* Child Info */}
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-pink-200 to-rose-300 rounded-full flex items-center justify-center">
                <span className="text-lg">👶</span>
              </div>
              <div>
                <h2 className="font-semibold text-gray-800">
                  {moment.childName}
                </h2>
                {moment.childAge && (
                  <p className="text-sm text-gray-500">{moment.childAge}</p>
                )}
              </div>
            </div>

            {/* Title & Date */}
            <h1 className="text-2xl font-serif font-bold text-gray-800 mb-2">
              {moment.title}
            </h1>
            <div className="flex items-center gap-2 text-sm text-gray-500 mb-4">
              <Calendar className="w-4 h-4" />
              {formatDate(moment.occurredAt)}
            </div>

            {/* Description */}
            {moment.description && (
              <p className="text-gray-700 leading-relaxed mb-6">
                {moment.description}
              </p>
            )}

            {/* Action Buttons */}
            <div className="flex items-center gap-4 pt-4 border-t border-gray-100">
              <button
                onClick={handleLike}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-full transition-colors",
                  hasLiked
                    ? "bg-pink-100 text-pink-600"
                    : "hover:bg-gray-100 text-gray-600",
                )}
              >
                <Heart className={cn("w-5 h-5", hasLiked && "fill-current")} />
                <span className="text-sm font-medium">{likeCount}</span>
              </button>

              <button
                onClick={handleShare}
                className="flex items-center gap-2 px-4 py-2 rounded-full hover:bg-gray-100 text-gray-600 transition-colors"
              >
                <Share2 className="w-5 h-5" />
                <span className="text-sm font-medium">Compartilhar</span>
              </button>
            </div>

            {/* Share Menu */}
            {showShareMenu && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-4 p-4 bg-gray-50 rounded-xl space-y-2"
              >
                <button
                  onClick={copyToClipboard}
                  className="w-full py-3 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Copiar link
                </button>
                <button
                  onClick={() => setShowShareMenu(false)}
                  className="w-full py-2 text-sm text-gray-500"
                >
                  Cancelar
                </button>
              </motion.div>
            )}

            {/* Partner Branding */}
            {moment.partnerBranding && (
              <div className="mt-6 pt-4 border-t border-gray-100 flex items-center gap-3">
                <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                  <Gift className="w-4 h-4 text-gray-500" />
                </div>
                <p className="text-sm text-gray-500">
                  Fotografado por{" "}
                  <span className="font-medium text-gray-700">
                    {moment.partnerBranding.name}
                  </span>
                </p>
              </div>
            )}
          </motion.div>
        </div>
      </main>

      {/* CTA Footer - Fixed */}
      <footer className="fixed bottom-0 left-0 right-0 bg-white border-t border-pink-100 p-4 safe-area-bottom">
        <div className="max-w-lg mx-auto">
          <Link
            to="/register"
            className="flex items-center justify-center gap-2 w-full py-4 bg-gradient-to-r from-pink-500 to-rose-500 text-white rounded-2xl font-semibold hover:from-pink-600 hover:to-rose-600 transition-colors"
          >
            <Sparkles className="w-5 h-5" />
            Criar meu diário de memórias
            <ArrowRight className="w-5 h-5" />
          </Link>
          <p className="text-center text-xs text-gray-400 mt-2">
            Preserve os momentos mais especiais do seu bebê
          </p>
        </div>
      </footer>
    </div>
  );
}

export default SharedMomentPage;
