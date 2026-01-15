import { cn } from "@/lib/utils";
import { GodModeState } from "./GodEye";
import { useMemo } from "react";

interface RadioWavesProps {
  state: GodModeState;
  className?: string;
}

// Generate random particles with consistent positions
const generateParticles = (count: number) => {
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    angle: Math.random() * 360,
    distance: 80 + Math.random() * 120,
    size: 2 + Math.random() * 4,
    duration: 3 + Math.random() * 4,
    delay: Math.random() * 3,
    opacity: 0.3 + Math.random() * 0.5,
  }));
};

// Generate orbital particles (Siri-like)
const generateOrbitalParticles = (count: number) => {
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    orbitRadius: 100 + Math.random() * 80,
    size: 3 + Math.random() * 5,
    duration: 6 + Math.random() * 6,
    delay: (i / count) * 6,
    startAngle: Math.random() * 360,
    color: Math.random() > 0.5 ? 'primary' : 'white',
  }));
};

export function RadioWaves({ state, className }: RadioWavesProps) {
  const isActive = state === "listening" || state === "processing";
  const isSuccess = state === "success";
  
  // Memoize particles to prevent regeneration on re-render
  const floatingParticles = useMemo(() => generateParticles(24), []);
  const orbitalParticles = useMemo(() => generateOrbitalParticles(16), []);
  
  return (
    <div className={cn("relative flex items-center justify-center", className)}>
      {/* Ambient glow background */}
      <div 
        className={cn(
          "absolute rounded-full transition-all duration-1000",
          "w-[400px] h-[400px] md:w-[500px] md:h-[500px]",
          state === "idle" && "opacity-20",
          state === "listening" && "opacity-60",
          state === "processing" && "opacity-50",
          state === "success" && "opacity-70",
        )}
        style={{
          background: state === "listening" 
            ? 'radial-gradient(circle, rgba(255,255,255,0.15) 0%, rgba(255,255,255,0.05) 40%, transparent 70%)'
            : state === "processing"
            ? 'radial-gradient(circle, rgba(44,160,28,0.2) 0%, rgba(44,160,28,0.05) 40%, transparent 70%)'
            : 'radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 60%)',
          filter: 'blur(20px)',
        }}
      />

      {/* Orbital particles (Siri-like flowing orbs) */}
      {isActive && (
        <div className="absolute inset-0 overflow-visible pointer-events-none">
          {orbitalParticles.map((particle) => (
            <div
              key={`orbital-${particle.id}`}
              className={cn(
                "absolute rounded-full",
                particle.color === 'primary' ? "bg-primary/60" : "bg-white/50"
              )}
              style={{
                width: `${particle.size}px`,
                height: `${particle.size}px`,
                left: '50%',
                top: '50%',
                marginLeft: `-${particle.size / 2}px`,
                marginTop: `-${particle.size / 2}px`,
                boxShadow: particle.color === 'primary' 
                  ? '0 0 10px rgba(44,160,28,0.6), 0 0 20px rgba(44,160,28,0.3)'
                  : '0 0 10px rgba(255,255,255,0.6), 0 0 20px rgba(255,255,255,0.3)',
                animation: `siri-orbit-${particle.id % 4} ${particle.duration}s linear infinite`,
                animationDelay: `${particle.delay}s`,
                transform: `rotate(${particle.startAngle}deg) translateX(${particle.orbitRadius}px)`,
              }}
            />
          ))}
        </div>
      )}

      {/* Floating dust particles */}
      <div className="absolute inset-0 overflow-visible pointer-events-none">
        {floatingParticles.map((particle) => (
          <div
            key={`float-${particle.id}`}
            className={cn(
              "absolute rounded-full transition-opacity duration-1000",
              isActive ? "opacity-100" : "opacity-0"
            )}
            style={{
              width: `${particle.size}px`,
              height: `${particle.size}px`,
              left: '50%',
              top: '50%',
              background: state === "processing" 
                ? `rgba(44, 160, 28, ${particle.opacity})`
                : `rgba(255, 255, 255, ${particle.opacity})`,
              boxShadow: state === "processing"
                ? `0 0 ${particle.size * 2}px rgba(44, 160, 28, 0.5)`
                : `0 0 ${particle.size * 2}px rgba(255, 255, 255, 0.5)`,
              transform: `rotate(${particle.angle}deg) translateY(-${particle.distance}px)`,
              animation: isActive ? `siri-float ${particle.duration}s ease-in-out infinite` : 'none',
              animationDelay: `${particle.delay}s`,
            }}
          />
        ))}
      </div>

      {/* Radio Wave Rings */}
      {[1, 2, 3, 4, 5].map((ring) => (
        <div
          key={ring}
          className={cn(
            "absolute rounded-full border transition-all duration-500",
            isActive && "animate-ping-slow",
            isSuccess && "border-primary/40",
            !isActive && !isSuccess && "border-white/10",
            isActive && "border-white/20",
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

      {/* Center Orb with Siri-like morph effect */}
      <div 
        className={cn(
          "absolute z-10 rounded-full transition-all duration-500",
          "w-20 h-20 md:w-28 md:h-28",
          state === "idle" && "bg-gradient-to-br from-white via-white/90 to-white/70 shadow-[0_0_40px_rgba(255,255,255,0.3)]",
          state === "listening" && "bg-gradient-to-br from-white via-white/95 to-white/80 shadow-[0_0_80px_rgba(255,255,255,0.6)]",
          state === "processing" && "bg-gradient-to-br from-white via-white/90 to-primary/30 shadow-[0_0_60px_rgba(44,160,28,0.5)]",
          state === "success" && "bg-gradient-to-br from-primary via-primary/80 to-primary/60 shadow-[0_0_60px_rgba(44,160,28,0.5)]",
          state === "error" && "bg-gradient-to-br from-destructive via-destructive/80 to-destructive/60 shadow-[0_0_60px_rgba(239,68,68,0.5)]",
        )}
        style={{
          animation: state === "listening" ? 'siri-morph 4s ease-in-out infinite' : 
                     state === "processing" ? 'siri-pulse 1.5s ease-in-out infinite' : 'none',
        }}
      />

      {/* Inner glow ring */}
      {isActive && (
        <div 
          className="absolute z-5 rounded-full border-2 border-white/30"
          style={{
            width: '100px',
            height: '100px',
            animation: 'siri-breathe 3s ease-in-out infinite',
            boxShadow: '0 0 30px rgba(255,255,255,0.3), inset 0 0 30px rgba(255,255,255,0.1)',
          }}
        />
      )}
    </div>
  );
}
