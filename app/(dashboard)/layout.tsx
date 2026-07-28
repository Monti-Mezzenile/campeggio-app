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

  useEffect(() => {
    if (mainRef.current) {
      mainRef.current.scrollTop = 0;
    }
  }, [pathname]);

  return (
    <BackgroundManager>
      <div className="relative min-h-screen w-full max-w-md mx-auto flex flex-col justify-between">
        <main
          ref={mainRef}
          className="flex-1 pt-[calc(env(safe-area-inset-top)+12px)] pb-[calc(90px+env(safe-area-inset-bottom))] touch-pan-y w-full"
        >
          {children}
        </main>
        <BottomNav />
      </div>
    </BackgroundManager>
  );
}