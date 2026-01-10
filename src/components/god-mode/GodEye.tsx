import { cn } from "@/lib/utils";
import { Eye, Mic, MicOff, Loader2, Sparkles } from "lucide-react";

export type GodModeState = "idle" | "listening" | "processing" | "success" | "error";

interface GodEyeProps {
  state: GodModeState;
  onClick?: () => void;
  size?: "sm" | "md" | "lg";
  showMic?: boolean;
}

const sizeClasses = {
  sm: "w-16 h-16",
  md: "w-24 h-24",
  lg: "w-32 h-32",
};

const iconSizes = {
  sm: "w-8 h-8",
  md: "w-12 h-12",
  lg: "w-16 h-16",
};

export function GodEye({ state, onClick, size = "lg", showMic = false }: GodEyeProps) {
  const isInteractive = state === "idle" || state === "success";

  return (
    <div className="relative flex flex-col items-center gap-4">
      {/* Particles Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className="absolute w-2 h-2 rounded-full bg-god-gold/30"
            style={{
              left: `${20 + i * 15}%`,
              top: `${30 + (i % 3) * 20}%`,
              animation: `float-particle ${3 + i * 0.5}s ease-in-out infinite`,
              animationDelay: `${i * 0.3}s`,
            }}
          />
        ))}
      </div>

      {/* Main Eye */}
      <button
        onClick={onClick}
        disabled={!isInteractive}
        className={cn(
          "relative rounded-full flex items-center justify-center transition-all duration-300",
          "bg-gradient-to-br from-god-gold via-god-gold-glow to-god-gold-dark",
          sizeClasses[size],
          state === "idle" && "god-eye cursor-pointer hover:scale-105",
          state === "listening" && "god-eye-listening cursor-default",
          state === "processing" && "god-eye-processing cursor-wait",
          state === "success" && "god-sparkle cursor-pointer",
          state === "error" && "opacity-50",
          isInteractive && "active:scale-95"
        )}
      >
        {/* Inner Eye */}
        <div className={cn(
          "absolute rounded-full bg-sidebar flex items-center justify-center",
          size === "sm" && "w-10 h-10",
          size === "md" && "w-16 h-16",
          size === "lg" && "w-20 h-20",
        )}>
          {state === "processing" ? (
            <Loader2 className={cn(iconSizes[size], "text-god-gold animate-spin")} />
          ) : state === "listening" ? (
            <Mic className={cn(iconSizes[size], "text-god-gold animate-pulse")} />
          ) : state === "success" ? (
            <Sparkles className={cn(iconSizes[size], "text-god-gold")} />
          ) : (
            <Eye className={cn(iconSizes[size], "text-god-gold")} />
          )}
        </div>

        {/* Processing Ring */}
        {state === "processing" && (
          <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-god-gold animate-spin" />
        )}
      </button>

      {/* Status Text */}
      <div className="text-center">
        <p className={cn(
          "text-sm font-medium transition-all",
          state === "idle" && "text-muted-foreground",
          state === "listening" && "text-god-gold animate-pulse",
          state === "processing" && "text-god-gold",
          state === "success" && "text-financial-positive",
          state === "error" && "text-destructive"
        )}>
          {state === "idle" && "Toque para falar"}
          {state === "listening" && "Estou ouvindo..."}
          {state === "processing" && "Processando..."}
          {state === "success" && "Pronto!"}
          {state === "error" && "Algo deu errado"}
        </p>
      </div>

      {/* Mic Toggle (optional) */}
      {showMic && state === "idle" && (
        <button
          onClick={onClick}
          className="p-3 rounded-full bg-god-gold/10 text-god-gold hover:bg-god-gold/20 transition-colors"
        >
          <Mic className="w-5 h-5" />
        </button>
      )}
    </div>
  );
}