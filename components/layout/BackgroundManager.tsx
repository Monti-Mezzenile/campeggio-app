"use client";

import { usePathname } from "next/navigation";

const BACKGROUNDS = [
  { src: "/background/background_day.png" },
  { src: "/background/background_gold.png" },
  { src: "/background/background.jpg" },
  { src: "/background/background.png" },
  { src: "/background/background_winter.png" },
];

export default function BackgroundManager({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  const getActiveSrc = () => {
    // Storico -> background_gold.png
    if (pathname?.startsWith("/history") || pathname?.startsWith("/storico")) {
      return "/background/background_gold.png";
    }
    // Idee -> background_day.png (GIORNO)
    if (pathname?.startsWith("/curiosita") || pathname?.startsWith("/idee")) {
      return "/background/background_day.png";
    }
    // IO / Profilo -> background_winter.png
    if (pathname?.startsWith("/profile") || pathname?.startsWith("/io")) {
      return "/background/background_winter.png";
    }
    // Home ed Eventi -> background.jpg (o background.png se usi quello)
    return "/background/background.jpg"; 
  };

  const activeSrc = getActiveSrc();

  return (
    <div className="relative min-h-dvh overflow-x-hidden">
      {/* LIVELLO DEGLI SFONDI IN DISSOLVENZA */}
      <div className="fixed inset-0 -z-10 bg-[#1f2041]">
        {BACKGROUNDS.map((bg) => {
          const isActive = activeSrc === bg.src;
          return (
            <div
              key={bg.src}
              className={`absolute inset-0 transition-all duration-700 ease-in-out ${
                isActive ? "opacity-100 scale-100" : "opacity-0 scale-105 pointer-events-none"
              }`}
            >
              <img
                src={bg.src}
                alt="Background MONTI"
                className="w-full h-full object-cover object-center"
              />
              <div className="absolute inset-0 bg-black/15" />
            </div>
          );
        })}
      </div>

      {/* CONTENUTO DELLA PAGINA */}
      <div className="relative z-10 min-h-dvh">{children}</div>
    </div>
  );
}