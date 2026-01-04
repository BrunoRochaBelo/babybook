import { cn } from "@/lib/utils";

interface BabyBookLogoProps {
  variant?: "b2c" | "b2b" | "b2c-dark";
  className?: string;
  size?: "sm" | "md" | "lg";
  showText?: boolean;
  textClassName?: string;
}

export function BabyBookLogo({ 
  variant = "b2c", 
  className, 
  size = "md", 
  showText = true,
  textClassName
}: BabyBookLogoProps) {
  const isB2B = variant === "b2b";
  const isB2CDark = variant === "b2c-dark";
  
  const sizeClasses = {
    sm: "w-8 h-8 text-[14px] rounded-xl font-black",
    md: "w-10 h-10 text-[18px] rounded-2xl font-black",
    lg: "w-12 h-12 text-[22px] rounded-[1.25rem] font-black",
  };

  return (
    <div className={cn("flex items-center gap-3", className)}>
      <div 
        className={cn(
          "flex items-center justify-center text-white font-bold shadow-md transition-shadow",
          sizeClasses[size],
          isB2B 
            ? "bg-gradient-to-br from-pink-500 to-rose-600 shadow-pink-500/10" 
            : isB2CDark
              ? "bg-white text-black shadow-none"
              : "bg-gradient-to-br from-orange-400 to-orange-500 shadow-orange-500/10"
        )}
      >
        BB
      </div>
      {showText && (
        <div className={cn("flex flex-col leading-none", textClassName)}>
          <div className={cn(
            "font-sans italic tracking-tight",
            size === "sm" ? "text-sm" : size === "lg" ? "text-xl" : "text-base",
            isB2CDark ? "text-white" : ""
          )}>
            <span className="font-light opacity-90">Baby</span>
            <span className="font-extrabold tracking-tighter ml-0.5">Book</span>
            {isB2B && <span className="ml-1.5 text-pink-500 dark:text-pink-400 font-bold not-italic tracking-widest text-[0.75em] uppercase font-sans">PRO</span>}
          </div>
          {!isB2B && (
             <p className={cn("text-[10px] font-medium tracking-wide mt-0.5", isB2CDark ? "text-gray-400" : "text-gray-500")}>Eternizando momentos</p>
          )}
        </div>
      )}
    </div>
  );
}
