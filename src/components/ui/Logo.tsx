import { cn } from "@/lib/utils";

interface LogoProps {
  className?: string;
  showText?: boolean;
  size?: "sm" | "md" | "lg";
}

export function Logo({ className, showText = true, size = "md" }: LogoProps) {
  const sizes = {
    sm: { icon: 24, text: "text-lg" },
    md: { icon: 32, text: "text-xl" },
    lg: { icon: 48, text: "text-2xl" },
  };

  const { icon, text } = sizes[size];

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <svg
        width={icon}
        height={icon}
        viewBox="0 0 48 48"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="flex-shrink-0"
      >
        {/* Main "A" shape with gradient */}
        <defs>
          <linearGradient id="logoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#F5D742" />
            <stop offset="50%" stopColor="#E5B732" />
            <stop offset="100%" stopColor="#C9A227" />
          </linearGradient>
          <linearGradient id="logoGradientDark" x1="0%" y1="100%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#8B7316" />
            <stop offset="100%" stopColor="#C9A227" />
          </linearGradient>
        </defs>
        
        {/* Left side of A */}
        <path
          d="M8 40 L24 8 L28 16 L16 40 Z"
          fill="url(#logoGradient)"
        />
        
        {/* Right side of A */}
        <path
          d="M24 8 L40 40 L32 40 L28 16 Z"
          fill="url(#logoGradientDark)"
        />
        
        {/* Crossbar accent */}
        <path
          d="M14 32 L34 32 L32 28 L16 28 Z"
          fill="url(#logoGradient)"
          opacity="0.9"
        />
        
        {/* Highlight accent on top */}
        <path
          d="M22 12 L24 8 L26 12 L24 10 Z"
          fill="#FFF8DC"
          opacity="0.6"
        />
      </svg>
      
      {showText && (
        <span className={cn("font-bold tracking-tight text-sidebar-foreground", text)}>
          Architecta
        </span>
      )}
    </div>
  );
}
