"use client";

import { usePathname } from "next/navigation";

// Array con i percorsi corretti (senza la sottocartella /background/ se sono in /public)
const BACKGROUNDS = [
  { src: "/background_day.png" },
  { src: "/background_gold.png" },
  { src: "/background.png" },
  { src: "/background_winter.png" },
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
      return "/background_gold.png";
    }
    // Curiosità / Idee -> background_day.png
    if (pathname?.startsWith("/curiosita") || pathname?.startsWith("/idee")) {
      return "/background_day.png";
    }
    // IO / Profilo -> background_winter.png
    if (pathname?.startsWith("/profile") || pathname?.startsWith("/io")) {
      return "/background_winter.png";
    }
    // Home ed Eventi -> background.png
    return "/background.png"; 
  };

  const activeSrc = getActiveSrc();

  return (
    <div className="relative min-h-dvh w-full overflow-x-hidden">
      {/* LIVELLO DEGLI SFONDI IN DISSOLVENZA */}
      <div className="fixed inset-0 z-0 bg-[#ebdec8]">
        {BACKGROUNDS.map((bg) => {
          const isActive = activeSrc === bg.src;
          return (
            <div
              key={bg.src}
              className={`absolute inset-0 transition-opacity duration-700 ease-in-out ${
                isActive ? "opacity-100" : "opacity-0 pointer-events-none"
              }`}
            >
              <img
                src={bg.src}
                alt="Background MONTI"
                className="w-full h-full object-cover object-center"
              />
              <div className="absolute inset-0 bg-black/10" />
            </div>
          );
        })}
      </div>

      {/* CONTENUTO DELLA PAGINA (Sopra lo sfondo) */}
      <div className="relative z-10 min-h-dvh bg-transparent">
        {children}
      </div>
    </div>
  );
}