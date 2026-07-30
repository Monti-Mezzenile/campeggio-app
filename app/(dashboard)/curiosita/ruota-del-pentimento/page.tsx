'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';

// 🎡 OPZIONI DELLA RUOTA (Con PESO per truccare le probabilità!)
// weight alto = succede spesso (punizioni) | weight basso = raro (miracoli)
const WHEEL_OPTIONS = [
  { id: 0, label: "Bevi alla Goccia", type: "bad", weight: 35, color: "bg-red-600", textMsg: "Il Popolo non perdona la tua insolenza. Svuota quel bicchiere, ORA." },
  { id: 1, label: "Colpo di Stato!", type: "good", weight: 5, color: "bg-amber-400", textMsg: "MIRACOLO! Annulli il voto del Popolo e decidi tu per tutti." },
  { id: 2, label: "Muto per 15 Min", type: "bad", weight: 20, color: "bg-rose-800", textMsg: "Hai perso il diritto di parola. Al primo suono che emetti, bevi." },
  { id: 3, label: "Cameriere", type: "bad", weight: 20, color: "bg-orange-600", textMsg: "La punizione per l'insolenza è la servitù: servi da bere e sparecchia per la prossima ora." },
  { id: 4, label: "Veto Assoluto", type: "good", weight: 10, color: "bg-emerald-500", textMsg: "Ti sei salvato per miracolo. Sei immune dalla decisione." },
  { id: 5, label: "Fai 10 Flessioni", type: "bad", weight: 10, color: "bg-red-900", textMsg: "Giù a terra, soldato. L'insolenza si paga col sudore." },
];

export default function RuotaInsolenzaPage() {
  const [isSpinning, setIsSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [result, setResult] = useState<typeof WHEEL_OPTIONS[0] | null>(null);

  const spinWheel = () => {
    if (isSpinning) return;
    
    setIsSpinning(true);
    setResult(null);

    // 🎲 1. Calcolo Probabilità Truccata
    const totalWeight = WHEEL_OPTIONS.reduce((sum, opt) => sum + opt.weight, 0);
    let randomNum = Math.random() * totalWeight;
    let selectedIndex = 0;

    for (let i = 0; i < WHEEL_OPTIONS.length; i++) {
      if (randomNum < WHEEL_OPTIONS[i].weight) {
        selectedIndex = i;
        break;
      }
      randomNum -= WHEEL_OPTIONS[i].weight;
    }

    // 🎯 2. Calcolo Angolo di Rotazione
    const sliceAngle = 360 / WHEEL_OPTIONS.length;
    const targetAngle = 360 - (selectedIndex * sliceAngle); 
    const randomOffset = Math.floor(Math.random() * (sliceAngle - 10)) - (sliceAngle / 2 - 5);
    const totalRotation = rotation + (360 * 8) + targetAngle - (rotation % 360) + randomOffset;

    setRotation(totalRotation);

    // ⏱️ 3. Mostra il risultato dopo l'animazione (4 secondi)
    setTimeout(() => {
      setResult(WHEEL_OPTIONS[selectedIndex]);
      setIsSpinning(false);
    }, 4000);
  };

  return (
    <div className="flex flex-col items-center min-h-dvh bg-zinc-950 text-white p-4 pt-16 sm:pt-20 overflow-y-auto pb-28 select-none">
      
      {/* 🔙 BACK BUTTON */}
      <div className="w-full max-w-md flex justify-start mb-6 z-20">
        <Link 
          href="/curiosita" 
          className="bg-zinc-900/90 border border-white/20 text-xs font-black px-4 py-2.5 rounded-2xl hover:bg-zinc-800 transition-colors shadow-lg backdrop-blur-md uppercase tracking-wider text-zinc-300"
        >
          ← TORNA ALLE CURIOSITÀ
        </Link>
      </div>

      <div className="w-full max-w-md space-y-8 z-10">

        {/* 📖 LORE: IL POTERE DEL POPOLO */}
        <section className="bg-zinc-900/80 border border-white/10 rounded-[2rem] p-6 shadow-xl backdrop-blur-md">
          <div className="flex items-center gap-3 mb-4">
            <span className="text-3xl">⚖️</span>
            <div>
              <h1 className="text-xl font-black uppercase text-amber-400 tracking-tight leading-none">
                Il Potere del Popolo
              </h1>
              <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mt-1">
                La democrazia fa schifo
              </p>
            </div>
          </div>
          
          <div className="space-y-3 text-sm text-zinc-300 font-medium leading-relaxed">
            <p>
              In questo campeggio non c'è leader. Quando c'è un dubbio, un litigio o bisogna decidere chi deve pulire la griglia, si invoca il sacro <strong className="text-white">Potere del Popolo</strong>.
            </p>
            <p>
              Funziona come una democrazia, ma più sadica: si vota. La maggioranza vince, 
              e la minoranza si attacca.
            </p>
            <div className="bg-amber-500/10 border border-amber-500/30 p-3 rounded-xl">
              <p className="text-xs text-amber-400 font-bold italic">
                "Ma se sono da solo contro tutti e penso di avere palesemente ragione?!"
              </p>
            </div>
            <p>
              Pessima idea ribellarsi. Ma se ti senti fortunato e vuoi tentare l'insolenza contro il decreto della maggioranza, puoi girare <strong className="text-red-400">La Ruota dell'Insolenza</strong>. 
            </p>
          </div>
        </section>

        {/* 🎡 LA RUOTA DELL'INSOLENZA */}
        <section className="bg-zinc-900/80 border border-red-500/30 rounded-[2.5rem] p-6 shadow-xl backdrop-blur-md flex flex-col items-center relative overflow-hidden">
          
          {/* BG Sfumato */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-32 bg-red-500/10 blur-3xl pointer-events-none" />

          <h2 className="text-xl font-black uppercase text-white tracking-widest mb-1 text-center">
            La Ruota dell'Insolenza
          </h2>
          <p className="text-xs text-red-400 font-bold text-center mb-8">
            Attenzione: 85% di probabilità di peggiorare la tua situazione.
          </p>

          {/* INDICATORE DELLA RUOTA */}
          <div className="relative w-full flex justify-center z-20 mb-[-15px]">
            <div className="w-0 h-0 border-l-[15px] border-r-[15px] border-t-[25px] border-l-transparent border-r-transparent border-t-white drop-shadow-[0_4px_4px_rgba(0,0,0,0.5)] z-30 relative top-2" />
          </div>

          {/* RUOTA */}
          <div className="relative w-72 h-72 rounded-full border-4 border-zinc-800 shadow-[0_0_30px_rgba(0,0,0,0.5)] overflow-hidden">
            <motion.div
              className="w-full h-full rounded-full relative"
              animate={{ rotate: rotation }}
              transition={{ duration: 4, ease: [0.2, 0.8, 0.2, 1] }}
            >
              {WHEEL_OPTIONS.map((opt, index) => {
                const rotationAngle = index * (360 / WHEEL_OPTIONS.length);
                return (
                  <div
                    key={opt.id}
                    className={`absolute top-0 left-1/2 w-36 h-36 origin-bottom-left flex items-center justify-center border-l-2 border-zinc-900/50 ${opt.color}`}
                    style={{
                      transform: `rotate(${rotationAngle}deg)`,
                      clipPath: 'polygon(0 0, 100% 0, 100% 100%)',
                    }}
                  >
                    <span 
                      className="absolute text-[10px] font-black uppercase tracking-wider text-white w-24 text-center origin-center"
                      style={{ transform: 'rotate(45deg) translate(5px, -30px)' }}
                    >
                      {opt.label}
                    </span>
                  </div>
                );
              })}
            </motion.div>
            
            {/* Perno centrale */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 bg-zinc-950 border-4 border-zinc-800 rounded-full z-10 shadow-inner flex items-center justify-center">
               <span className="text-xl">💀</span>
            </div>
          </div>

          {/* BOTTONE GIRA */}
          <button
            onClick={spinWheel}
            disabled={isSpinning}
            className={`mt-10 w-full py-4 rounded-2xl font-black text-sm uppercase tracking-widest transition-all shadow-lg ${
              isSpinning 
                ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed' 
                : 'bg-red-600 hover:bg-red-500 text-white active:scale-95 border-b-4 border-red-800'
            }`}
          >
            {isSpinning ? 'Il destino punisce...' : 'SFIDA IL POPOLO'}
          </button>
        </section>

      </div>

      {/* 🚨 POPUP RISULTATO */}
      {result && !isSpinning && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <motion.div 
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className={`w-full max-w-sm p-6 rounded-[2rem] border-2 shadow-2xl text-center flex flex-col items-center gap-4 ${
              result.type === 'bad' ? 'bg-red-950 border-red-500' : 'bg-emerald-950 border-emerald-500'
            }`}
          >
            <div className="text-6xl mb-2">
              {result.type === 'bad' ? '🤡' : '👑'}
            </div>
            <h2 className={`text-2xl font-black uppercase tracking-tight ${result.type === 'bad' ? 'text-red-500' : 'text-emerald-400'}`}>
              {result.label}
            </h2>
            <p className="text-sm font-medium text-white/80 leading-relaxed px-2">
              {result.textMsg}
            </p>
            <button
              onClick={() => setResult(null)}
              className="mt-4 w-full py-3 bg-white text-black font-black text-xs uppercase tracking-widest rounded-xl active:scale-95 transition-transform"
            >
              Accetta la Sentenza
            </button>
          </motion.div>
        </div>
      )}

    </div>
  );
}