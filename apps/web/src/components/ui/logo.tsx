import * as React from "react";

export interface LogoProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: number;
  showText?: boolean;
}

export const Logo: React.FC<LogoProps> = ({ size = 48, showText = true, className = "", ...props }) => {
  const imageSize = Math.round(size * 0.74);

  return (
    <div className={`flex items-center gap-3 logo-container select-none ${className}`} {...props}>
      {/* Visual Icon Container */}
      <div 
        className="relative flex items-center justify-center flex-shrink-0"
        style={{ width: size, height: size }}
      >
        {/* Animated Background SVG elements (gears and circles) */}
        <svg
          width={size}
          height={size}
          viewBox="0 0 100 100"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="absolute inset-0 overflow-visible"
        >
          <defs>
            <linearGradient id="logo-gold-grad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#FBBF24" />
              <stop offset="50%" stopColor="#F59E0B" />
              <stop offset="100%" stopColor="#D97706" />
            </linearGradient>
            <linearGradient id="logo-metal-grad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#94A3B8" />
              <stop offset="50%" stopColor="#475569" />
              <stop offset="100%" stopColor="#1E293B" />
            </linearGradient>
          </defs>

          <style>{`
            @keyframes logo-spin-cw {
              from { transform: rotate(0deg); }
              to { transform: rotate(360deg); }
            }
            @keyframes logo-spin-ccw {
              from { transform: rotate(0deg); }
              to { transform: rotate(-360deg); }
            }
            @keyframes logo-pulse-glow {
              0%, 100% {
                transform: scale(1);
                filter: drop-shadow(0 0 2px rgba(245, 158, 11, 0.4));
              }
              50% {
                transform: scale(1.03);
                filter: drop-shadow(0 0 8px rgba(245, 158, 11, 0.7));
              }
            }
            .logo-outer-gear {
              transform-origin: 50px 50px;
              animation: logo-spin-cw 25s linear infinite;
              transition: animation-duration 0.5s ease;
            }
            .logo-draft-circle {
              transform-origin: 50px 50px;
              animation: logo-spin-ccw 40s linear infinite;
            }
            .logo-center-img {
              transform-origin: center;
              animation: logo-pulse-glow 3s ease-in-out infinite;
            }
            .logo-container:hover .logo-outer-gear {
              animation-duration: 8s;
            }
            .logo-container:hover .logo-draft-circle {
              animation-duration: 10s;
            }
            .logo-container:hover .logo-center-img {
              animation: logo-pulse-glow 1.2s ease-in-out infinite;
            }
          `}</style>

          {/* Technical drafting outer dashed guide */}
          <circle
            cx="50"
            cy="50"
            r="48.5"
            stroke="url(#logo-gold-grad)"
            strokeWidth="0.8"
            strokeDasharray="4 5"
            opacity="0.35"
            className="logo-draft-circle"
          />

          {/* Rotating outer gear teeth outline */}
          <g className="logo-outer-gear">
            {/* Gear Ring */}
            <circle cx="50" cy="50" r="43" stroke="url(#logo-metal-grad)" strokeWidth="1.5" fill="none" opacity="0.6" />
            <circle cx="50" cy="50" r="44.5" stroke="url(#logo-metal-grad)" strokeWidth="0.5" fill="none" opacity="0.25" />
            {/* Gear teeth */}
            {[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map((deg) => (
              <rect
                key={`tooth-${deg}`}
                x="48"
                y="3"
                width="4"
                height="5"
                rx="1"
                fill="url(#logo-metal-grad)"
                opacity="0.8"
                transform={`rotate(${deg} 50 50)`}
              />
            ))}
          </g>

          {/* Inner golden ring framing the logo */}
          <circle
            cx="50"
            cy="50"
            r="37"
            stroke="url(#logo-gold-grad)"
            strokeWidth="1.5"
            fill="none"
            opacity="0.8"
          />
        </svg>

        {/* The Actual Logo Image centered inside */}
        <div 
          className="absolute logo-center-img flex items-center justify-center rounded-full bg-white p-0.5 overflow-hidden border border-border/50 shadow-sm"
          style={{ width: imageSize, height: imageSize }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/logo.png"
            alt="B.K. Engineering Works Logo"
            className="w-full h-full object-contain rounded-full"
          />
        </div>
      </div>

      {showText && (
        <div className="flex flex-col justify-center leading-none">
          <span className="text-[15px] font-black tracking-widest text-slate-100 uppercase">
            B.K. <span className="text-secondary font-black">ENGINEERING</span>
          </span>
          <span className="text-[9px] tracking-[0.38em] text-muted-foreground uppercase font-bold mt-1">
            Works
          </span>
        </div>
      )}
    </div>
  );
};
