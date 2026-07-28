"use client";

import { useRouter } from "next/navigation";
import CustomIcon, { IconName } from "@/components/ui/CustomIcon";

interface StuffItem {
  id: string;
  icon: IconName;
  title: string;
  subtitle: string;
  link: string;
  borderColor: string;
}

export default function MyStuff() {
  const router = useRouter();

  const items: StuffItem[] = [
    {
      id: "tents",
      icon: "tenda-grossa",
      title: "TENDE",
      subtitle: "Posti & tende",
      link: "/profile/tents",
      // Rosso estratto dall'immagine (#b6144a)
      borderColor: "border-[#b6144a] hover:border-[#d62058] shadow-[#b6144a]/25",
    },
    {
      id: "equipment",
      icon: "zaino",
      title: "STRUMENTI",
      subtitle: "Zaino & cose",
      link: "/profile/equipment",
      borderColor: "border-[#9a5328] hover:border-[#b86432] shadow-[#9a5328]/20", // MARRONE
    },
    {
      id: "badges",
      icon: "medaglia",
      title: "MEDAGLIERE",
      subtitle: "Traguardi",
      link: "/profile/badges",
      borderColor: "border-yellow-400 hover:border-yellow-300 shadow-yellow-400/20", // GIALLO
    },
    {
      id: "cars",
      icon: "macchina",
      title: "MEZZI",
      subtitle: "Auto & trasporti",
      link: "/profile/cars",
      borderColor: "border-emerald-500 hover:border-emerald-400 shadow-emerald-500/20", // VERDE
    },
  ];

  return (
    <section className="mt-6">
      {/* Header Sezione */}
      <div className="flex items-center justify-between mb-2.5 px-1">
        <h2 className="text-xs font-black uppercase tracking-widest text-[#ebdec8]">
          LA MIA ROBA
        </h2>
        <span className="text-[10px] font-mono text-[#ebdec8]/60 font-bold">
          4 SEZIONI
        </span>
      </div>

      {/* Grid 2x2 con Bordi Colorati Evidenti */}
      <div className="grid grid-cols-2 gap-3">
        {items.map((item) => (
          <button
            key={item.id}
            onClick={() => router.push(item.link)}
            className={`group relative h-[88px] bg-white/10 hover:bg-white/15 backdrop-blur-md text-[#ebdec8] rounded-2xl px-3.5 py-2.5 border-[2.5px] ${item.borderColor} shadow-lg active:scale-[0.97] transition-all text-left flex items-center justify-between overflow-hidden`}
          >
            {/* Testo a Sinistra */}
            <div className="flex flex-col justify-center z-10 pr-1 min-w-0">
              <h3 className="text-xs sm:text-[13px] font-black uppercase tracking-wider leading-tight text-[#ebdec8] drop-shadow-xs truncate">
                {item.title}
              </h3>
              <p className="text-[10px] sm:text-[11px] font-medium text-[#ebdec8]/70 truncate mt-0.5">
                {item.subtitle}
              </p>
            </div>

            {/* Icona Ingrandita */}
            <div className="relative shrink-0 z-10 -mr-0.5 group-hover:scale-110 transition-transform duration-200">
              <CustomIcon name={item.icon} size={58} className="drop-shadow-md" />
            </div>

            {/* Freccina discreta in basso */}
            <div className="absolute right-2 bottom-1 text-[9px] font-black opacity-40 text-[#ebdec8] group-hover:opacity-90 transition-opacity">
              ↗
            </div>
          </button>
        ))}
      </div>
    </section>
  );
}