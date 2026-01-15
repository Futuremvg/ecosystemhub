import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

interface AudioWaveformProps {
  frequencies: number[];
  volume: number;
  isActive: boolean;
  className?: string;
}

export function AudioWaveform({ frequencies, volume, isActive, className }: AudioWaveformProps) {
  if (!isActive) return null;

  // Create symmetric waveform (mirror effect like Siri)
  const leftBars = frequencies.slice(0, 16).reverse();
  const rightBars = frequencies.slice(0, 16);
  const allBars = [...leftBars, ...rightBars];

  return (
    <div className={cn("flex items-center justify-center gap-[2px]", className)}>
      {allBars.map((level, index) => {
        // Calculate distance from center for intensity
        const distanceFromCenter = Math.abs(index - 16) / 16;
        const centerBoost = 1 - distanceFromCenter * 0.3;
        
        // Apply volume multiplier for overall reactivity
        const adjustedLevel = Math.max(0.05, level * centerBoost * (0.5 + volume * 1.5));
        
        // Height ranges from 4px to 60px based on level
        const height = 4 + adjustedLevel * 56;
        
        // Color gradient based on position and volume
        const hue = 113; // Primary green
        const saturation = 75 + volume * 25;
        const lightness = 40 + adjustedLevel * 20;
        
        return (
          <motion.div
            key={index}
            className="rounded-full"
            initial={{ height: 4 }}
            animate={{ 
              height,
              opacity: 0.4 + adjustedLevel * 0.6,
            }}
            transition={{ 
              type: "spring",
              stiffness: 400,
              damping: 20,
              mass: 0.5,
            }}
            style={{
              width: 3,
              background: `linear-gradient(180deg, 
                hsl(${hue}, ${saturation}%, ${lightness + 10}%) 0%, 
                hsl(${hue}, ${saturation}%, ${lightness}%) 50%,
                hsl(${hue}, ${saturation - 10}%, ${lightness - 10}%) 100%)`,
              boxShadow: adjustedLevel > 0.3 
                ? `0 0 ${4 + adjustedLevel * 8}px hsl(${hue}, ${saturation}%, ${lightness}% / 0.5)`
                : 'none',
            }}
          />
        );
      })}
    </div>
  );
}

// Circular waveform variant (Siri-like)
export function CircularWaveform({ frequencies, volume, isActive, className }: AudioWaveformProps) {
  if (!isActive) return null;

  return (
    <div className={cn("relative", className)}>
      <svg viewBox="0 0 200 200" className="w-full h-full">
        {frequencies.map((level, index) => {
          const angle = (index / frequencies.length) * 360;
          const radians = (angle * Math.PI) / 180;
          
          // Adjust level with volume
          const adjustedLevel = Math.max(0.1, level * (0.5 + volume * 1.5));
          
          // Calculate bar position and size
          const innerRadius = 60;
          const barLength = 10 + adjustedLevel * 30;
          
          const x1 = 100 + Math.cos(radians) * innerRadius;
          const y1 = 100 + Math.sin(radians) * innerRadius;
          const x2 = 100 + Math.cos(radians) * (innerRadius + barLength);
          const y2 = 100 + Math.sin(radians) * (innerRadius + barLength);
          
          return (
            <motion.line
              key={index}
              x1={x1}
              y1={y1}
              x2={x2}
              y2={y2}
              stroke={`hsl(113, ${70 + adjustedLevel * 30}%, ${45 + adjustedLevel * 15}%)`}
              strokeWidth={2}
              strokeLinecap="round"
              initial={{ opacity: 0.3 }}
              animate={{ 
                opacity: 0.4 + adjustedLevel * 0.6,
                x2,
                y2,
              }}
              transition={{ 
                type: "spring",
                stiffness: 300,
                damping: 20,
              }}
              style={{
                filter: adjustedLevel > 0.4 ? `drop-shadow(0 0 ${adjustedLevel * 4}px hsl(113, 75%, 50%))` : 'none',
              }}
            />
          );
        })}
      </svg>
    </div>
  );
}
