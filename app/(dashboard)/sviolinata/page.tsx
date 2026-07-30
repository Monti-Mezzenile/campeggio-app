"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";

export default function SviolinataPage() {
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const router = useRouter();

  const toggleViolin = () => {
    if (!audioRef.current) return;

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.currentTime = 0; 
      audioRef.current.play().catch((e) => console.error("Errore audio:", e));
      setIsPlaying(true);
    }
  };

  return (
    <div 
      className="fixed inset-0 cursor-pointer overflow-hidden flex flex-col justify-between select-none"
      onClick={toggleViolin}
    >
      {/* 🖼️ Sfondo Fisso & Glow Isolate */}
      <div className="fixed inset-0 -z-20 overflow-hidden pointer-events-none">
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-50 scale-105"
          style={{ backgroundImage: "url('/background/background_day.png')" }}
        />
        <div className="absolute inset-0 bg-zinc-950/20 backdrop-blur-md" />

        <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120vw] max-w-2xl aspect-square rounded-full blur-3xl transition-all duration-700 ${
          isPlaying ? "bg-amber-500/35 scale-110" : "bg-transparent scale-90"
        }`} />
      </div>

      {/* 🎵 Audio Nascosto Pre-caricato */}
      <audio
        ref={audioRef}
        src="/audio/sviolinata.mp3"
        preload="auto"
        onEnded={() => setIsPlaying(false)}
      />

      {/* ⬅️ Tasto Indietro (Spostato sotto il notch/safe-area) */}
      <div className="pt-12 sm:pt-16 px-4 sm:px-6 z-50">
        <button 
          onClick={(e) => {
            e.stopPropagation();
            router.push("/curiosita");
          }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-white/80 border border-white/90 shadow-sm text-xs font-black text-zinc-800 hover:bg-white hover:scale-105 active:scale-95 transition-all backdrop-blur-md"
        >
          ← Torna indietro
        </button>
      </div>

      {/* 🎻 Contenuto Principale: Il Violino Gigante */}
      <main className="flex-1 flex flex-col items-center justify-center p-4 text-center z-10 relative">
        <div className="relative flex flex-col items-center justify-center w-full max-w-lg">
          
          <div className={`relative w-80 h-80 sm:w-[420px] sm:h-[420px] transition-all duration-300 ${
            isPlaying ? "scale-105 animate-[wiggle_0.3s_ease-in-out_infinite]" : "scale-100 hover:scale-105"
          }`}>
            <img 
              src="/curiosity/violino.png" 
              alt="Corde di violino" 
              className="w-full h-full object-contain drop-shadow-[0_20px_30px_rgba(0,0,0,0.35)]"
            />

            {isPlaying && (
              <>
                <span className="absolute -top-2 right-4 text-5xl animate-[bounce_1s_infinite_100ms] drop-shadow-lg">🎵</span>
                <span className="absolute top-12 -left-8 text-4xl animate-[bounce_1s_infinite_300ms] drop-shadow-lg">🎶</span>
                <span className="absolute bottom-12 -right-4 text-6xl animate-[bounce_1s_infinite_200ms] drop-shadow-lg">🎵</span>
              </>
            )}
          </div>

          {/* Card di Stato Glass */}
          <div className="mt-4 sm:mt-8 p-5 sm:p-6 rounded-3xl bg-white/80 border border-white/90 backdrop-blur-md shadow-xl max-w-xs sm:max-w-sm w-full">
            <h1 className="text-xl sm:text-2xl font-black text-zinc-950 uppercase tracking-tight mb-1">
              La Sviolinata
            </h1>
            <p className={`text-xs sm:text-sm font-bold uppercase transition-colors duration-300 ${
              isPlaying ? "text-amber-500 animate-pulse" : "text-zinc-500"
            }`}>
              {isPlaying ? "Sta sviolinando..." : "Tocca lo schermo per iniziare"}
            </p>
          </div>

        </div>
      </main>

      {/* Margine invisibile per bilanciare l'altezza */}
      <div className="h-6 pointer-events-none" />

      {/* Stili per l'animazione di vibrazione */}
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes wiggle {
          0%, 100% { transform: rotate(-2.5deg); }
          50% { transform: rotate(2.5deg); }
        }
      `}} />
    </div>
  );
}