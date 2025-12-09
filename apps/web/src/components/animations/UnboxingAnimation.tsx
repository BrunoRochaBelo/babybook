/**
 * Unboxing Animation Component
 *
 * Magical "gift opening" animation for voucher redemption.
 * Shows progress while backend processes the redemption.
 */

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Gift, Sparkles, Heart, Check } from "lucide-react";

interface UnboxingAnimationProps {
  isActive: boolean;
  progress: number; // 0-100
  partnerName?: string;
  onComplete?: () => void;
}

const LOADING_MESSAGES = [
  "Abrindo seu presente...",
  "Preparando suas memórias...",
  "Organizando as fotos...",
  "Quase lá...",
  "Finalizando...",
];

export function UnboxingAnimation({
  isActive,
  progress,
  partnerName,
  onComplete,
}: UnboxingAnimationProps) {
  const [messageIndex, setMessageIndex] = useState(0);
  const [showComplete, setShowComplete] = useState(false);

  useEffect(() => {
    if (!isActive) return;

    const interval = setInterval(() => {
      setMessageIndex((prev) => (prev + 1) % LOADING_MESSAGES.length);
    }, 1500);

    return () => clearInterval(interval);
  }, [isActive]);

  useEffect(() => {
    if (progress >= 100 && isActive) {
      setShowComplete(true);
      const timer = setTimeout(() => {
        onComplete?.();
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [progress, isActive, onComplete]);

  if (!isActive) return null;

  return (
    <AnimatePresence mode="wait">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-gradient-to-b from-pink-100 via-white to-rose-100 flex items-center justify-center z-40"
      >
        <div className="text-center px-6 max-w-md">
          {/* Gift Icon Animation */}
          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{
              scale: showComplete ? [1, 1.2, 1] : 1,
              opacity: 1,
              rotate: showComplete ? 0 : [0, -5, 5, -5, 0],
            }}
            transition={{
              scale: { duration: 0.5 },
              rotate: {
                duration: 0.5,
                repeat: showComplete ? 0 : Infinity,
                repeatDelay: 1,
              },
            }}
            className="relative inline-block mb-8"
          >
            <div className="w-32 h-32 bg-gradient-to-br from-pink-500 to-rose-500 rounded-3xl flex items-center justify-center shadow-2xl shadow-pink-200">
              <AnimatePresence mode="wait">
                {showComplete ? (
                  <motion.div
                    key="check"
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ type: "spring", stiffness: 200 }}
                  >
                    <Check className="w-16 h-16 text-white" strokeWidth={3} />
                  </motion.div>
                ) : (
                  <motion.div
                    key="gift"
                    animate={{ scale: [1, 1.05, 1] }}
                    transition={{ duration: 1, repeat: Infinity }}
                  >
                    <Gift className="w-16 h-16 text-white" />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Sparkles around gift */}
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
              className="absolute inset-0"
            >
              {[0, 60, 120, 180, 240, 300].map((angle, i) => (
                <motion.div
                  key={i}
                  animate={{
                    scale: [1, 1.3, 1],
                    opacity: [0.5, 1, 0.5],
                  }}
                  transition={{
                    duration: 1.5,
                    repeat: Infinity,
                    delay: i * 0.2,
                  }}
                  style={{
                    position: "absolute",
                    top: "50%",
                    left: "50%",
                    transform: `rotate(${angle}deg) translate(80px) rotate(-${angle}deg)`,
                  }}
                >
                  <Sparkles className="w-5 h-5 text-pink-400" />
                </motion.div>
              ))}
            </motion.div>
          </motion.div>

          {/* Partner Attribution */}
          {partnerName && (
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-pink-600 font-medium mb-2"
            >
              Presente de {partnerName}
            </motion.p>
          )}

          {/* Status Text */}
          <AnimatePresence mode="wait">
            <motion.h2
              key={showComplete ? "complete" : messageIndex}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
              className="text-2xl font-bold text-gray-900 mb-4"
            >
              {showComplete ? (
                <span className="flex items-center justify-center gap-2">
                  <Heart className="w-6 h-6 text-pink-500 fill-pink-500" />
                  Presente Aberto!
                </span>
              ) : (
                LOADING_MESSAGES[messageIndex]
              )}
            </motion.h2>
          </AnimatePresence>

          {/* Progress Bar */}
          {!showComplete && (
            <div className="w-full h-3 bg-pink-100 rounded-full overflow-hidden mb-4">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.3 }}
                className="h-full bg-gradient-to-r from-pink-500 to-rose-500 rounded-full"
              />
            </div>
          )}

          {/* Sub-message */}
          {showComplete && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="text-gray-600"
            >
              Suas memórias estão prontas para serem exploradas
            </motion.p>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

export default UnboxingAnimation;
