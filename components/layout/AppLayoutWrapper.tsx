"use client";

import React from "react";
import { usePathname } from "next/navigation";
import { AuthSync } from "@/components/auth/AuthSync";
import { AuthModal } from "@/components/auth/AuthModal";
import { UsernameOnboardingModal } from "@/components/auth/UsernameOnboardingModal";
import { InteractiveOnboardingModal } from "@/components/onboarding/InteractiveOnboardingModal";

interface AppLayoutWrapperProps {
  children: React.ReactNode;
}

export function AppLayoutWrapper({ children }: AppLayoutWrapperProps) {
  const pathname = usePathname();
  // Landing page runs at '/' or '/home'
  const isLandingPage = pathname === "/" || pathname === "/home";
  const isLoop = pathname === "/loop" || pathname === "/qzloop";

  if (isLandingPage) {
    return (
      <div className="w-full min-h-screen flex flex-col relative bg-[#07090e] text-slate-100 selection:bg-purple-500/30 selection:text-white overflow-x-hidden">
        {children}
        <AuthModal />
        <UsernameOnboardingModal />
        <InteractiveOnboardingModal />
      </div>
    );
  }

  return (
    <div
      className={`w-full max-w-[480px] bg-surface-container-lowest flex flex-col relative shadow-[0_0_24px_rgba(0,0,0,0.06)] md:border-x md:border-surface-container-high/60 ${
        isLoop ? "h-[100dvh] max-h-[100dvh] overflow-hidden" : "min-h-screen"
      }`}
    >
      {children}
      <AuthModal />
      <UsernameOnboardingModal />
      <InteractiveOnboardingModal />
    </div>
  );
}
