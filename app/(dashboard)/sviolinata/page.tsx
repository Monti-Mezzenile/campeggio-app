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
      audioRef.current.currentTime = 0; // Riparte dall'inizio ogni volta
      audioRef.current.play().catch((e) => console.error("Errore audio:", e));
      setIsPlaying(true);
    }
  };

  return (
    <div 
      className="relative min-h-dvh cursor-pointer overflow-hidden flex flex-col"
      onClick={toggleViolin} // Cliccando ovunque sullo schermo parte/si ferma
    >
      {/* 🖼️ Sfondo Fisso sfocato per far risaltare il violino */}
      <div 
        className="fixed inset-0 -z-20 bg-cover bg-center bg-no-repeat opacity-50"
        style={{ backgroundImage: "url('/background/background_day.png')" }}
      />
      <div className="fixed inset-0 -z-10 bg-zinc-950/20 backdrop-blur-md pointer-events-none" />

      {/* 🎵 Audio Nascosto Pre-caricato */}
      <audio
        ref={audioRef}
        src="/audio/sviolinata.mp3"
        preload="auto"
        onEnded={() => setIsPlaying(false)}
      />

      {/* ⬅️ Tasto Indietro (Stoppa la propagazione del click per non far suonare il violino) */}
      <div className="p-4 sm:p-6 absolute top-0 left-0 z-50">
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
      <main className="flex-1 flex flex-col items-center justify-center p-6 text-center z-10">
        
        {/* Cerchio luminoso di sfondo che pulsa quando suona */}
        <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[150vw] sm:w-[80vw] aspect-square rounded-full blur-3xl pointer-events-none transition-all duration-700 ${
          isPlaying ? "bg-amber-500/30 scale-110" : "bg-transparent scale-90"
        }`} />

        <div className="relative flex flex-col items-center justify-center w-full max-w-sm">
          
          {/* L'immagine del violino */}
          <div className={`relative w-64 h-64 sm:w-80 sm:h-80 drop-shadow-2xl transition-all duration-300 ${
            isPlaying ? "scale-110 animate-[wiggle_0.3s_ease-in-out_infinite]" : "scale-100 hover:scale-105"
          }`}>
            <img 
              src="/curiosity/violino.png" 
              alt="Corde di violino" 
              className="w-full h-full object-contain"
            />

            {/* Note musicali che appaiono solo quando suona */}
            {isPlaying && (
              <>
                <span className="absolute -top-4 right-10 text-4xl animate-[bounce_1s_infinite_100ms] drop-shadow-md">🎵</span>
                <span className="absolute top-10 -left-6 text-3xl animate-[bounce_1s_infinite_300ms] drop-shadow-md">🎶</span>
                <span className="absolute bottom-10 right-0 text-5xl animate-[bounce_1s_infinite_200ms] drop-shadow-md">🎵</span>
              </>
            )}
          </div>

          <div className="mt-12 p-6 rounded-3xl bg-white/80 border border-white/90 backdrop-blur-md shadow-xl">
            <h1 className="text-2xl font-black text-zinc-950 uppercase tracking-tight mb-2">
              La Sviolinata
            </h1>
            <p className={`text-sm font-bold uppercase transition-colors duration-300 ${
              isPlaying ? "text-amber-500 animate-pulse" : "text-zinc-500"
            }`}>
              {isPlaying ? "Sta sviolinando..." : "Tocca lo schermo per iniziare"}
            </p>
          </div>

        </div>
      </main>

      {/* Stili per l'animazione di vibrazione del violino */}
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes wiggle {
          0%, 100% { transform: rotate(-2deg); }
          50% { transform: rotate(2deg); }
        }
      `}} />
    </div>
  );
}