"use client";

import { usePathname } from "next/navigation";

// Array con i nomi esatti che mi hai confermato
const BACKGROUNDS = [
  { src: "/background.png" },
  { src: "/background_gold.png" },
  { src: "/background_day.png" },
  { src: "/background_winter.png" },
];

export default function BackgroundManager({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  const getActiveSrc = () => {
    // Storico
    if (pathname?.startsWith("/history") || pathname?.startsWith("/storico")) {
      return "/background_gold.png";
    }
    // Idee / Curiosità
    if (pathname?.startsWith("/curiosita") || pathname?.startsWith("/idee")) {
      return "/background_day.png";
    }
    // IO / Profilo
    if (pathname?.startsWith("/profile") || pathname?.startsWith("/io")) {
      return "/background_winter.png";
    }
    // Home ed Eventi (default)
    return "/background.png";
  };

  const activeSrc = getActiveSrc();

  return (
    <div className="relative min-h-dvh w-full overflow-x-hidden">
      {/* Sfondi fissi con z-index 0 */}
      <div className="fixed inset-0 z-0 bg-[#1f2041]">
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
      <div className="relative z-10 min-h-dvh bg-transparent">
        {children}
      </div>
    </div>
  );
}