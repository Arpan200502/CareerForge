"use client";
import { useEffect, useRef, useState } from "react";

interface PreloaderProps {
  text?: string;
  duration?: number;
  onComplete?: () => void;
}

export function Preloader({ text = "CareerForge", duration = 3500, onComplete }: PreloaderProps) {
  const [progress, setProgress] = useState(0);
  const startRef = useRef<number | null>(null);

  useEffect(() => {
    let raf = 0;
    const tick = (t: number) => {
      if (startRef.current === null) startRef.current = t;
      const p = Math.min(100, ((t - startRef.current) / duration) * 100);
      setProgress(p);
      if (p < 100) {
        raf = requestAnimationFrame(tick);
      } else {
        setTimeout(() => {
          onComplete?.();
        }, 500);
      }
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [duration, onComplete]);

  const fillY = 100 - progress;

  const done = progress >= 100;

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-[#0e0e0e]"
    >
     
      <div className="relative w-full px-6">
        <svg
          viewBox="0 0 1000 240"
          className="mx-auto block w-full max-w-[1400px]"
          preserveAspectRatio="xMidYMid meet"
        >
          <defs>
            <clipPath id="text-clip">
              <text
                x="50%"
                y="50%"
                textAnchor="middle"
                dominantBaseline="central"
                fontFamily="'Inter', system-ui, sans-serif"
                fontWeight="900"
                fontSize="140"
                letterSpacing="-4"
              >
                {text}
              </text>
            </clipPath>
          </defs>

          <g clipPath="url(#text-clip)">
            <rect x="0" y="0" width="1000" height="240" fill="#3a3a3a" />

            <g style={{ transform: `translateY(${fillY * 2.4}px)` }}>
              <path
                d="M0,40 C150,10 300,70 500,40 C700,10 850,70 1000,40 L1000,240 L0,240 Z"
                fill="#ffffff"
                style={{ animation: "preloader-wave 3.2s ease-in-out infinite" }}
              />
              <path
                d="M0,40 C150,70 300,10 500,40 C700,70 850,10 1000,40 L1000,240 L0,240 Z"
                fill="#ffffff"
                opacity="0.85"
                style={{ animation: "preloader-wave 4s ease-in-out infinite reverse" }}
              />
            </g>
          </g>
        </svg>

        <div
          className="absolute right-[6%] text-xs tracking-wide text-white/90"
          style={{ top: "calc(50% + 8vw)" }}
        >
          <span className="opacity-80">loading...</span>{" "}
          <span className="ml-2">{Math.floor(progress)} %</span>
        </div>
      </div>

      <style>{`
        @keyframes preloader-wave {
          0%   { transform: translateX(0); }
          50%  { transform: translateX(-40px); }
          100% { transform: translateX(0); }
        }
        @keyframes preloader-dot {
          0%, 100% { transform: translateY(0); opacity: 0.5; }
          50%      { transform: translateY(8px); opacity: 1; }
        }
      `}</style>
    </div>
  );
}

export default Preloader;
