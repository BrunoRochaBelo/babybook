import { motion, AnimatePresence } from "motion/react";
import { Heart } from "lucide-react";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

interface HeartBurstProps {
  isActive: boolean;
  onComplete?: () => void;
}

export const HeartBurst = ({ isActive, onComplete }: HeartBurstProps) => {
  const [hearts, setHearts] = useState<{ id: number; x: number; y: number; scale: number; rotation: number }[]>([]);

  useEffect(() => {
    if (isActive) {
      // Generate burst of hearts
      const newHearts = Array.from({ length: 6 }).map((_, i) => ({
        id: Date.now() + i,
        x: (Math.random() - 0.5) * 60,
        y: -Math.random() * 60 - 20,
        scale: Math.random() * 0.5 + 0.5,
        rotation: (Math.random() - 0.5) * 45,
      }));
      setHearts(newHearts);

      const timer = setTimeout(() => {
        setHearts([]);
        onComplete?.();
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [isActive, onComplete]);

  return (
    <AnimatePresence>
      {hearts.map((heart) => (
        <motion.div
          key={heart.id}
          initial={{ opacity: 1, x: 0, y: 0, scale: 0 }}
          animate={{ opacity: 0, x: heart.x, y: heart.y, scale: heart.scale, rotate: heart.rotation }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="absolute pointer-events-none z-10"
         style={{ top: "50%", left: "50%" }}
        >
          <Heart className="w-4 h-4 fill-[var(--bb-color-accent)] text-[var(--bb-color-accent)]" />
        </motion.div>
      ))}
    </AnimatePresence>
  );
};
