"use client";

import { useRouter } from "next/navigation";
import CustomIcon, { IconName } from "@/components/ui/CustomIcon";

interface StuffItem {
  id: string;
  icon: IconName;
  title: string;
  subtitle: string;
  link: string;
}

export default function MyStuff() {
  const router = useRouter();

  const items: StuffItem[] = [
    {
      id: "tents",
      icon: "tenda-grossa",
      title: "LE MIE TENDE",
      subtitle: "Posti & tende",
      link: "/profile/tents",
    },
    {
      id: "equipment",
      icon: "zaino",
      title: "ATTREZZATURA",
      subtitle: "Zaino & cose",
      link: "/profile/equipment",
    },
    {
      id: "badges",
      icon: "medaglia",
      title: "MEDAGLIERE",
      subtitle: "Traguardi",
      link: "/profile/badges",
    },
    {
      id: "cars",
      icon: "macchina",
      title: "I MIEI MEZZI",
      subtitle: "Auto & trasporti",
      link: "/profile/cars",
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

      {/* Grid 2x2 con Icone XXL */}
      <div className="grid grid-cols-2 gap-2.5">
        {items.map((item) => (
          <button
            key={item.id}
            onClick={() => router.push(item.link)}
            className="group relative h-[82px] bg-[#ebdec8] text-[#1b2b25] rounded-2xl px-3 py-2 border border-[#1b2b25]/10 shadow-sm active:scale-[0.97] transition-all text-left flex items-center justify-between overflow-hidden"
          >
            {/* Testo a Sinistra */}
            <div className="flex flex-col justify-center z-10 pr-1 min-w-0">
              <h3 className="text-[11px] font-black uppercase tracking-wider leading-tight text-[#1b2b25] truncate">
                {item.title}
              </h3>
              <p className="text-[9px] font-semibold text-[#1b2b25]/65 truncate mt-0.5">
                {item.subtitle}
              </p>
            </div>

            {/* Icona Ingrandita a 58px */}
            <div className="relative shrink-0 z-10 -mr-0.5 group-hover:scale-110 transition-transform duration-200">
              <CustomIcon name={item.icon} size={58} className="drop-shadow-md" />
            </div>

            {/* Freccina discreta in basso */}
            <div className="absolute right-1.5 bottom-0.5 text-[8px] font-black opacity-20 text-[#1b2b25] group-hover:opacity-60 transition-opacity">
              ↗
            </div>
          </button>
        ))}
      </div>
    </section>
  );
}