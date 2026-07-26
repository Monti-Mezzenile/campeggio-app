"use client";

import { useState } from "react";
import CustomIcon from "@/components/ui/CustomIcon";

// 📻 Palinsesto di Radio MONTI: Citazioni memorabili + Curiosità
const PALINSESTO = [
  // 🗣️ Frasi storiche del gruppo
  { text: "bastoni è invincibile", category: "🗣️ Citazione Storica" },
  { text: "Dov’è il tuo cappello?", category: "🗣️ Citazione Storica" },
  { text: "Posso vederlo?", category: "🗣️ Citazione Storica" },
  { text: "Tranquilli stasera qualcuno salverà la festa", category: "🗣️ Citazione Storica" },
  { text: "Ma perchè Pizzo non beve?", category: "🗣️ Citazione Storica" },

  // 💡 Curiosità reali
  { text: "I conigli quando sono felici fanno il 'Binky': un salto con piroetta in aria! 🐰✨", category: "💡 Curiosità di Campo" },
  { text: "Il caffè fatto in campeggio ha provatamente il +50% di gusto in più. ☕", category: "💡 Curiosità di Campo" },
  { text: "Se perdi un picchetto, riapparirà magicamente solo l'ultimo giorno mentre smonti la tenda. 🔨", category: "💡 Curiosità di Campo" },
  { text: "Guardare il fuoco del falò di notte abbassa la pressione e azzera lo stress. 🔥", category: "💡 Curiosità di Campo" },
];

export default function Header() {
  const [currentIndex, setCurrentIndex] = useState<number | null>(null);

  const tuneInToRadio = () => {
    const nextIndex = Math.floor(Math.random() * PALINSESTO.length);
    setCurrentIndex(nextIndex);
  };

  const activeItem = currentIndex !== null ? PALINSESTO[currentIndex] : null;

  return (
    <header className="w-full px-4 py-3 flex items-center justify-between border-b border-[#ebdec8]/20 bg-black/60 backdrop-blur-xl sticky top-0 z-40 shadow-md">
      {/* 🚀 SINISTRA: Logo MONTI + Saluto "Ciao Coniglietto\a" */}
      <div className="flex items-center gap-3 sm:gap-4">
        {/* Logo MONTI (Dimensione leggermente aumentata) */}
        <img
          src="/monti/logo.png"
          alt="MONTI"
          className="h-9 md:h-11 w-auto object-contain drop-shadow-[0_2px_10px_rgba(0,0,0,0.8)]"
        />

        {/* Separatore orizzontale */}
        <div className="h-5 w-[1px] bg-[#ebdec8]/30" />

        {/* Saluto */}
        <div
          className="flex items-center gap-1.5 text-[#ebdec8] text-lg sm:text-xl font-semibold leading-none tracking-wide"
          style={{ fontFamily: "var(--font-caveat)" }}
        >
          <span>Ciao Coniglietto\a</span>
          <div className="flex items-center">
            <CustomIcon name="coniglio" size={32} />
          </div>
        </div>
      </div>

      {/* 📻 DESTRA: Radio MONTI Pop-over */}
      <div className="relative">
        <button
          onClick={tuneInToRadio}
          type="button"
          className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-gradient-to-r from-[#ebdec8]/20 to-[#ebdec8]/10 hover:from-[#ebdec8]/30 hover:to-[#ebdec8]/20 border border-[#ebdec8]/35 text-xs sm:text-sm text-[#ebdec8] font-medium transition-all active:scale-95 shadow-sm"
        >
          <span className="animate-pulse">📻</span>
          <span className="font-semibold">Radio MONTI</span>
        </button>

        {/* Pop-up trasmissioni */}
        {activeItem && (
          <div 
            onClick={() => setCurrentIndex(null)}
            className="absolute right-0 top-11 w-72 p-3.5 rounded-2xl bg-zinc-950/95 border border-[#ebdec8]/40 shadow-2xl backdrop-blur-2xl z-50 cursor-pointer animate-in fade-in slide-in-from-top-2 duration-200"
          >
            <div className="flex justify-between items-center mb-1.5">
              <span className="text-amber-300 font-bold text-[10px] uppercase tracking-wider">
                {activeItem.category}
              </span>
              <span className="text-[10px] text-zinc-500">clicca per chiudere</span>
            </div>
            
            <p className="text-sm font-medium text-zinc-100 leading-relaxed italic">
              "{activeItem.text}"
            </p>
          </div>
        )}
      </div>
    </header>
  );
}