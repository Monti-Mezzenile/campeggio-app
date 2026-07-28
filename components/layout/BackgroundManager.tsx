"use client";

import { usePathname } from "next/navigation";

const BACKGROUNDS = [
  { src: "/background/background.jpg" },
  { src: "/background/background_gold.png" },
  { src: "/background/background_day.png" },
  { src: "/background/background_winter.png" },
];

export default function BackgroundManager({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  const getActiveSrc = () => {
    if (pathname?.startsWith("/history") || pathname?.startsWith("/storico")) {
      return "/background/background_gold.png";
    }
    if (pathname?.startsWith("/curiosita") || pathname?.startsWith("/idee")) {
      return "/background/background_day.png";
    }
    if (pathname?.startsWith("/profile") || pathname?.startsWith("/io")) {
      return "/background/background_winter.png";
    }
    return "/background/background.jpg";
  };

  const activeSrc = getActiveSrc();

  return (
    <div className="fixed inset-0 w-full h-full overflow-hidden bg-[#ebdec8]">
      {/* Sfondi fissi a tutto schermo */}
      <div className="absolute inset-0 z-0 bg-[#ebdec8]">
        {BACKGROUNDS.map((bg) => {
          const isActive = activeSrc === bg.src;
          return (
            <div
              key={bg.src}
              className={`absolute inset-0 transition-opacity duration-500 ease-in-out ${
                isActive ? "opacity-100" : "opacity-0 pointer-events-none"
              }`}
            >
              <img
                src={bg.src}
                alt="Background"
                className="w-full h-full object-cover object-center"
              />
            </div>
          );
        })}
      </div>

      {/* Contenuto dell'App */}
      <div className="relative z-10 w-full h-full overflow-hidden bg-transparent">
        {children}
      </div>
    </div>
  );
}