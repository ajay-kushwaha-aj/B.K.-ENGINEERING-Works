import * as React from "react";

export interface LogoProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  size?: number;
  showText?: boolean;
}

export const Logo: React.FC<LogoProps> = ({ size = 48, showText = true, className = "", ...props }) => {
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/logo.png"
        alt="B.K. Engineering Works Logo"
        width={size}
        height={size}
        className="rounded-lg object-contain bg-white p-1 border border-border/50"
        {...props}
      />

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
