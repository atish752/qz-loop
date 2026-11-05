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
  return (
    <div className="w-full min-h-screen flex flex-col relative bg-[#07090e] text-slate-100 selection:bg-purple-500/30 selection:text-white overflow-x-hidden">
      {children}
    </div>
  );
}
