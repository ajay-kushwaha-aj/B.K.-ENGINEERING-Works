"use client";

import * as React from "react";

export interface LogoProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: number;
  showText?: boolean;
}

export const Logo: React.FC<LogoProps> = ({
  size = 60,
  showText = true,
  className = "",
  ...props
}) => {
  const [imgError, setImgError] = React.useState(false);

  return (
    <div
      className={`flex items-center gap-4 select-none group transition-all duration-300 ${className}`}
      {...props}
    >
      {/* 60x60 Clean White Circular Logo Container with Subtle Border */}
      <div
        className="relative flex items-center justify-center flex-shrink-0 rounded-full bg-white border border-slate-200/90 shadow-sm p-1 transition-transform duration-300 group-hover:scale-105"
        style={{ width: size, height: size }}
      >
        {!imgError ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src="/logo.png"
            alt="B.K. Engineering Works Logo"
            onError={() => setImgError(true)}
            className="w-full h-full object-contain rounded-full"
          />
        ) : (
          /* Vector Fallback Emblem if PNG fails to load */
          <svg viewBox="0 0 100 100" fill="none" className="w-full h-full">
            <circle cx="50" cy="50" r="44" stroke="#D4AF37" strokeWidth="3" fill="none" />
            <circle cx="50" cy="50" r="36" stroke="#0F172A" strokeWidth="1.5" strokeDasharray="3 3" fill="none" />
            <path
              d="M34 32 H54 C60 32 64 36 64 41 C64 45 61 48 56 49.5 C62 51 65 55 65 60 C65 66 60 70 53 70 H34 V32 Z"
              fill="none"
              stroke="#D4AF37"
              strokeWidth="4"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path d="M44 32 V70 M34 50 H54" stroke="#0F172A" strokeWidth="3.5" strokeLinecap="round" />
          </svg>
        )}
      </div>

      {/* Two Line Official Company Typography */}
      {showText && (
        <div className="flex flex-col justify-center leading-none transition-opacity duration-300">
          {/* Line 1: B.K. ENGINEERING (Bold 700, 22px, White) */}
          <span className="text-[20px] lg:text-[22px] font-bold text-white tracking-tight uppercase leading-none font-sans font-[700] whitespace-nowrap">
            B.K. ENGINEERING
          </span>
          {/* Line 2: WORKS (Medium 500, 14px, 4px Letter Spacing, #94A3B8) */}
          <span className="text-[14px] font-medium text-[#94A3B8] uppercase tracking-[4px] leading-none font-[500] mt-1.5 whitespace-nowrap">
            WORKS
          </span>
        </div>
      )}
    </div>
  );
};
