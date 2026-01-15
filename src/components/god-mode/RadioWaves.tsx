import { cn } from "@/lib/utils";
import { GodModeState } from "./GodEye";

interface RadioWavesProps {
  state: GodModeState;
  className?: string;
}

export function RadioWaves({ state, className }: RadioWavesProps) {
  const isActive = state === "listening" || state === "processing";
  const isSuccess = state === "success";
  
  return (
    <div className={cn("relative flex items-center justify-center", className)}>
      {/* Center Orb with glow */}
      <div 
        className={cn(
          "absolute z-10 rounded-full transition-all duration-500",
          "w-20 h-20 md:w-28 md:h-28",
          state === "idle" && "bg-gradient-to-br from-white via-white/90 to-white/70 shadow-[0_0_40px_rgba(255,255,255,0.3)]",
          state === "listening" && "bg-gradient-to-br from-white via-white/95 to-white/80 shadow-[0_0_60px_rgba(255,255,255,0.5)]",
          state === "processing" && "bg-gradient-to-br from-white via-white/90 to-primary/30 shadow-[0_0_50px_rgba(44,160,28,0.4)]",
          state === "success" && "bg-gradient-to-br from-primary via-primary/80 to-primary/60 shadow-[0_0_60px_rgba(44,160,28,0.5)]",
          state === "error" && "bg-gradient-to-br from-destructive via-destructive/80 to-destructive/60 shadow-[0_0_60px_rgba(239,68,68,0.5)]",
        )}
        style={{
          filter: isActive ? 'blur(0px)' : 'blur(0px)',
          animation: state === "listening" ? 'morph 3s ease-in-out infinite' : 'none',
        }}
      />

      {/* Radio Wave Rings */}
      {[1, 2, 3, 4, 5].map((ring) => (
        <div
          key={ring}
          className={cn(
            "absolute rounded-full border transition-all duration-500",
            isActive && "animate-ping-slow",
            isSuccess && "border-primary/40",
            !isActive && !isSuccess && "border-white/10",
            isActive && "border-white/30",
          )}
          style={{
            width: `${80 + ring * 50}px`,
            height: `${80 + ring * 50}px`,
            animationDelay: `${ring * 0.3}s`,
            animationDuration: `${2 + ring * 0.5}s`,
            opacity: isActive ? 1 - ring * 0.15 : 0.1,
          }}
        />
      ))}

      {/* Pulsating outer glow */}
      <div 
        className={cn(
          "absolute rounded-full transition-all duration-700",
          "w-48 h-48 md:w-64 md:h-64",
          state === "idle" && "bg-primary/5",
          state === "listening" && "bg-white/10 animate-pulse",
          state === "processing" && "bg-primary/10 animate-pulse",
          state === "success" && "bg-primary/20",
          state === "error" && "bg-destructive/10",
        )}
        style={{
          filter: 'blur(30px)',
        }}
      />

      {/* Particle effects for listening state */}
      {isActive && (
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {[...Array(12)].map((_, i) => (
            <div
              key={i}
              className="absolute w-1.5 h-1.5 rounded-full bg-white/40"
              style={{
                left: '50%',
                top: '50%',
                transform: `rotate(${i * 30}deg) translateY(-${60 + Math.random() * 40}px)`,
                animation: `float-particle ${2 + Math.random() * 2}s ease-in-out infinite`,
                animationDelay: `${i * 0.1}s`,
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
