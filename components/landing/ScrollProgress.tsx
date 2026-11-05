"use client";

import React, { useEffect, useState } from "react";

export function ScrollProgress() {
  const [scrollProgress, setScrollProgress] = useState(0);

  useEffect(() => {
    let ticking = false;

    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const totalScroll = document.documentElement.scrollHeight - window.innerHeight;
          if (totalScroll > 0) {
            const currentProgress = (window.scrollY / totalScroll) * 100;
            setScrollProgress(Math.min(100, Math.max(0, currentProgress)));
          }
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div className="fixed top-0 left-0 right-0 h-[3px] z-[100] pointer-events-none bg-white/[0.03]">
      <div
        className="h-full bg-gradient-to-r from-purple-500 via-indigo-500 to-emerald-400 shadow-[0_0_12px_rgba(168,85,247,0.8)] transition-all duration-75 origin-left"
        style={{
          width: `${scrollProgress}%`,
        }}
      />
    </div>
  );
}
