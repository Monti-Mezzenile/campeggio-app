"use client";

import { useState, useRef } from "react";

// Mappatura audio con icone dedicate
const SUONI = [
  {
    id: "take",
    titolo: "TAKE CONTROL",
    file: "/audio/Take-control.mp3",
    icona: "/icons/macchina.png",
  },
  {
    id: "bastoni",
    titolo: "BASTONI È INVINCIBILE",
    file: "/audio/Bastoni.mp3",
    icona: "/corsa/Bastoni.png",
  },
  {
    id: "cappello",
    titolo: "DOV'È IL TUO CAPPELLO",
    file: "/audio/Cappello.mp3",
    icona: "/icons/cappello.png",
  },
  {
    id: "godo",
    titolo: "GODO",
    file: "/audio/Godo.mp3",
    icona: "/icons/godo.png",
  },
  {
    id: "posso",
    titolo: "POSSO VEDERLO?",
    file: "/audio/Posso-vederlo.mp3",
    icona: "/icons/vederlo.png",
  },
  {
    id: "zitto",
    titolo: "STAI ZITTO COGLIONE",
    file: "/audio/Stai-zitto.mp3",
    icona: "/icons/zitto.png",
  },
  {
    id: "benvenuto",
    titolo: "BENVENUTO",
    file: "/audio/Tenuta-walllace.mp3",
    icona: "/icons/wallace.png",
  },
  {
    id: "horseman",
    titolo: "UN VERO HORSEMAN",
    file: "/audio/Vero-Horseman.mp3",
    icona: "/icons/horseman.png",
  },
];

export default function SuoniPage() {
  const [activeId, setActiveId] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const currentTrack = SUONI.find((s) => s.id === activeId);

  const stopAudio = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    setActiveId(null);
  };

  const playSound = (id: string, file: string) => {
    if (activeId === id) {
      stopAudio();
      return;
    }

    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }

    const audio = new Audio(file);
    audioRef.current = audio;
    setActiveId(id);

    audio.play().catch((e) => console.error("Errore audio:", e));

    audio.onended = () => {
      setActiveId(null);
    };
  };

  const playRandomSound = () => {
    const randomIndex = Math.floor(Math.random() * SUONI.length);
    const randomSuono = SUONI[randomIndex];
    playSound(randomSuono.id, randomSuono.file);
  };

  return (
    <div className="relative min-h-dvh">
      {/* 🖼️ Sfondo Fisso background_day.png */}
      <div 
        className="fixed inset-0 -z-10 bg-cover bg-center bg-no-repeat pointer-events-none"
        style={{ backgroundImage: "url('/background/background_day.png')" }}
      />

      <main className="min-h-dvh p-4 sm:p-6 pb-40 max-w-xl mx-auto text-zinc-900 select-none space-y-6 relative">
        
        {/* ⬅️ Tasto Indietro Glass */}
        <div className="pt-2">
          <a 
            href="/curiosita" 
            className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-white/80 border border-white/90 shadow-sm text-xs font-black text-zinc-800 hover:bg-white hover:scale-105 active:scale-95 transition-all backdrop-blur-md"
          >
            ← Torna alle Curiosità
          </a>
        </div>

        {/* 💡 Header Glassmorphic */}
        <header className="relative overflow-hidden bg-white/80 border border-white/90 rounded-3xl p-6 shadow-xl backdrop-blur-md text-center">
          <div className="absolute top-0 right-1/2 translate-x-1/2 -mt-10 w-48 h-48 bg-amber-500/15 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 space-y-3">
            <div className="flex items-center justify-center gap-3">
              <div className="p-2 rounded-2xl bg-amber-500/10 border border-amber-500/20 shadow-sm">
                <img 
                  src="/icons/lampadina.png" 
                  alt="I Pezzi" 
                  className="h-7 w-7 object-contain drop-shadow-sm"
                />
              </div>
              <h1 className="text-3xl sm:text-4xl font-black text-zinc-950 tracking-tight">
                I Pezzi
              </h1>
            </div>

            <div>
              <button
                onClick={playRandomSound}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-black shadow-md hover:shadow-lg active:scale-95 transition-all"
              >
                🎲 Pezzo Casuale
              </button>
            </div>
          </div>
        </header>

        {/* 🎛️ Griglia Pad Tactile Soundboard */}
        <div className="grid grid-cols-2 gap-3.5 sm:gap-4">
          {SUONI.map((suono) => {
            const isPlaying = activeId === suono.id;

            return (
              <button
                key={suono.id}
                onClick={() => playSound(suono.id, suono.file)}
                className={`relative overflow-hidden p-4 rounded-3xl border transition-all duration-200 flex flex-col justify-between items-center text-center h-36 sm:h-40 group ${
                  isPlaying
                    ? "bg-amber-500 border-amber-600 text-white shadow-inner translate-y-1 scale-[0.98]"
                    : "bg-white/80 border-white/90 text-zinc-950 hover:bg-white hover:-translate-y-1 hover:shadow-xl shadow-md active:translate-y-0.5 active:scale-95 backdrop-blur-md"
                }`}
              >
                {/* Glow di Sfondo in Attivo */}
                <div 
                  className={`absolute inset-0 rounded-3xl transition-opacity duration-300 pointer-events-none ${
                    isPlaying ? "bg-amber-400/30 blur-xl opacity-100" : "bg-amber-500/10 blur-xl opacity-0 group-hover:opacity-100"
                  }`} 
                />

                {/* Equalizzatore animato se in riproduzione */}
                {isPlaying && (
                  <div className="absolute top-3 right-3 flex items-end gap-0.5 h-3 z-10">
                    <span className="w-0.5 bg-white rounded-full animate-[bounce_0.6s_infinite_100ms] h-full" />
                    <span className="w-0.5 bg-white rounded-full animate-[bounce_0.6s_infinite_300ms] h-2/3" />
                    <span className="w-0.5 bg-white rounded-full animate-[bounce_0.6s_infinite_200ms] h-5/6" />
                  </div>
                )}

                {/* Icona Personalizzata */}
                <div className="relative z-10 flex-1 flex items-center justify-center w-full my-1">
                  <div className={`relative w-16 h-16 sm:w-20 sm:h-20 flex items-center justify-center transition-transform duration-300 ${
                    isPlaying ? "scale-110 animate-pulse" : "group-hover:scale-110"
                  }`}>
                    <img
                      src={suono.icona}
                      alt={suono.titolo}
                      className="max-w-full max-h-full object-contain drop-shadow-md"
                    />
                  </div>
                </div>

                {/* Titolo Unico */}
                <div className="relative z-10 w-full pt-1">
                  <span className={`block text-[11px] sm:text-xs font-black uppercase tracking-tight leading-tight line-clamp-2 ${
                    isPlaying ? "text-white drop-shadow-xs" : "text-zinc-950"
                  }`}>
                    {suono.titolo}
                  </span>
                </div>
              </button>
            );
          })}
        </div>

        {/* 🎵 Mini Player Fluttuante Glass */}
        {currentTrack && (
          <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 w-[92%] max-w-md bg-zinc-950/90 text-white backdrop-blur-2xl border border-white/20 p-3.5 rounded-3xl shadow-2xl flex items-center justify-between animate-in fade-in slide-in-from-bottom-4 duration-300">
            <div className="flex items-center gap-3 overflow-hidden">
              <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center shrink-0 p-1.5">
                <img 
                  src={currentTrack.icona} 
                  alt={currentTrack.titolo} 
                  className="w-full h-full object-contain"
                />
              </div>
              <div className="truncate">
                <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping" />
                  In Riproduzione
                </span>
                <h4 className="text-xs font-black truncate text-white">{currentTrack.titolo}</h4>
              </div>
            </div>

            <button
              onClick={stopAudio}
              className="px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-black transition-all shadow-sm active:scale-95 shrink-0"
            >
              Stop ⏹️
            </button>
          </div>
        )}

      </main>
    </div>
  );
}