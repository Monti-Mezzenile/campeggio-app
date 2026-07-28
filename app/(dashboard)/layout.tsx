"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import BackgroundManager from "@/components/layout/BackgroundManager";
import BottomNav from "@/components/layout/BottomNav";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const mainRef = useRef<HTMLElement>(null);

  // Reset dello scroll a ogni cambio scheda
  useEffect(() => {
    if (mainRef.current) {
      mainRef.current.scrollTop = 0;
    }
  }, [pathname]);

  return (
    <BackgroundManager>
      <div className="relative h-dvh w-full max-w-md mx-auto flex flex-col justify-between overflow-hidden">
        <main
          ref={mainRef}
          className="flex-1 overflow-y-auto overflow-x-hidden pt-[calc(env(safe-area-inset-top)+12px)] pb-[calc(56px+env(safe-area-inset-bottom))] touch-pan-y w-full"
        >
          {children}
        </main>
        <BottomNav />
      </div>
    </BackgroundManager>
  );
}