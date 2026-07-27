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

interface HeaderProps {
  name?: string;
}

export default function Header({ name }: HeaderProps) {
  const [currentIndex, setCurrentIndex] = useState<number | null>(null);

  const tuneInToRadio = () => {
    const nextIndex = Math.floor(Math.random() * PALINSESTO.length);
    setCurrentIndex(nextIndex);
  };

  const activeItem = currentIndex !== null ? PALINSESTO[currentIndex] : null;

  return (
    // Sfondo Glassmorphism elegante
    <header className="w-full px-4 py-3 flex items-center justify-between rounded-3xl bg-white/10 backdrop-blur-md border border-white/20 shadow-sm sticky top-4 z-40 mx-auto mt-2">
      
      {/* 🚀 SINISTRA: Logo MONTI + Saluto */}
      <div className="flex items-center gap-2.5 sm:gap-3">
        {/* Logo MONTI */}
        <img
          src="/monti/logo.png"
          alt="MONTI"
          className="h-8 md:h-10 w-auto object-contain drop-shadow-md"
        />

        {/* Separatore orizzontale ammorbidito */}
        <div className="h-4 w-[1px] bg-[#ebdec8]/20" />

        {/* Saluto (MODIFICATO: dimensione ridotta a text-xs sm:text-sm) */}
        <div
          className="flex items-center gap-1 text-[#ebdec8] text-xs sm:text-sm font-medium leading-none tracking-wide drop-shadow-sm opacity-90"
          style={{ fontFamily: "var(--font-caveat)" }}
        >
          <span>Ciao coniglietto/a</span>
          <div className="flex items-center drop-shadow-md shrink-0">
            <CustomIcon name="coniglio" size={18} />
          </div>
        </div>
      </div>

      {/* 📻 DESTRA: Radio MONTI Pop-over */}
      <div className="relative">
        <button
          onClick={tuneInToRadio}
          type="button"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/20 border border-white/30 text-xs text-[#ebdec8] font-medium transition-all active:scale-95 shadow-sm backdrop-blur-sm"
        >
          <span className="animate-pulse drop-shadow-sm">📻</span>
          <span className="font-semibold drop-shadow-sm">Radio MONTI</span>
        </button>

        {/* Pop-up trasmissioni */}
        {activeItem && (
          <div 
            onClick={() => setCurrentIndex(null)}
            className="absolute right-0 top-12 w-72 p-4 rounded-2xl bg-[#1b2b25]/95 border border-[#ebdec8]/20 shadow-2xl backdrop-blur-2xl z-50 cursor-pointer animate-in fade-in slide-in-from-top-2 duration-200"
          >
            <div className="flex justify-between items-center mb-2">
              <span className="text-[#ebdec8] font-black text-[10px] uppercase tracking-wider">
                {activeItem.category}
              </span>
              <span className="text-[10px] text-[#ebdec8]/50">chiudi ✕</span>
            </div>
            
            <p className="text-sm font-medium text-white leading-relaxed italic">
              "{activeItem.text}"
            </p>
          </div>
        )}
      </div>
    </header>
  );
}