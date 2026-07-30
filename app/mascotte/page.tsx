'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, useAnimation } from 'framer-motion';
import { supabase } from '@/lib/supabase'; // Import corretto

// 📊 SOGLIE DI ESPERIENZA PER LE FASI
const EXP_THRESHOLDS: Record<number, number> = {
  1: 0, 2: 300, 3: 900, 4: 2000, 5: 4000,
  6: 7500, 7: 12500, 8: 19000, 9: 30000
};

// 🖼️ MAPPA GRAFICA
const EVOLUTION_STAGES: Record<number, { name: string; image: string }> = {
  1: { name: 'Coniglio Piccolo', image: '/tamagotchi/fase1_coniglio_piccolo.png' },
  2: { name: 'Coniglio Medio', image: '/tamagotchi/fase2_coniglio_medio.png' },
  3: { name: 'Lepre', image: '/tamagotchi/fase3_lepre.png' },
  4: { name: 'Lepre Muscolosa', image: '/tamagotchi/fase4_lepre_muscolosa.png' },
  5: { name: 'Lepre Centauro', image: '/tamagotchi/fase5_lepre_centauro.png.png' }, 
  6: { name: 'Pony', image: '/tamagotchi/fase6_pony.png' },
  7: { name: 'Cavallo Medio', image: '/tamagotchi/fase7_cavallo_medio.png' },
  8: { name: 'Cavallo Grande', image: '/tamagotchi/fase8_cavallo_grande.png' },
  9: { name: 'Cavallo Supremo', image: '/tamagotchi/fase9_cavallo_supremo.png' },
};

// 🎒 OGGETTI (Ora con i valori di ESPERIENZA)
const ITEMS = [
  { id: 'carota', label: 'Carota', type: 'fame', val: 15, exp: 5, icon: '/icons/carota.png' },
  { id: 'cosciotto', label: 'Cosciotto', type: 'fame', val: 35, exp: 12, icon: '/icons/cosciotto.png' },
  { id: 'acqua', label: 'Acqua', type: 'sete', val: 15, exp: 5, icon: '/icons/acqua.png' },
  { id: 'birra', label: 'Birra', type: 'sete', val: 35, exp: 15, icon: '/icons/birra.png' },
  { id: 'cannetta', label: 'Cannetta', type: 'svago', val: 25, exp: 8, icon: '/icons/cannetta.png' },
  { id: 'drone', label: 'Drone', type: 'svago', val: 40, exp: 20, icon: '/icons/drone.png' },
];

export default function MascottePage() {
  const [mascot, setMascot] = useState({ id: null, fame: 50, sete: 50, svago: 50, exp: 0, fase: 1, nome: 'Cucciolo' });
  const [loading, setLoading] = useState(true);
  const [warningMsg, setWarningMsg] = useState('');
  
  const mascotRef = useRef<HTMLDivElement>(null);
  const mascotControls = useAnimation();

  // 1️⃣ CARICAMENTO INIZIALE E CALCOLO DECADIMENTO
  useEffect(() => {
    const loadAndDecay = async () => {
      // Prendi l'utente loggato
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setWarningMsg('Devi fare il login per avere la tua mascotte!');
        setLoading(false);
        return;
      }

      // Cerca la mascotte dell'utente
      let { data: myMascot, error } = await supabase.from('mascots').select('*').eq('user_id', user.id).single();

      // Se non esiste, la crea da zero!
      if (!myMascot || error) {
        const { data: newMascot } = await supabase.from('mascots').insert({ user_id: user.id }).select().single();
        myMascot = newMascot;
      }

      // 🧮 CALCOLO DECADIMENTO OFFLINE
      const now = new Date();
      const lastUpdate = new Date(myMascot.last_updated_at);
      const hoursPassed = (now.getTime() - lastUpdate.getTime()) / (1000 * 60 * 60);

      if (hoursPassed > 0.5) { // Applica decadimento se è passata più di mezz'ora
        const fameDecay = Math.floor(hoursPassed * 1.5);
        const seteDecay = Math.floor(hoursPassed * 2.0);
        const svagoDecay = Math.floor(hoursPassed * 1.2);

        myMascot.fame = Math.max(0, myMascot.fame - fameDecay);
        myMascot.sete = Math.max(0, myMascot.sete - seteDecay);
        myMascot.svago = Math.max(0, myMascot.svago - svagoDecay);
        
        // Salva i nuovi valori decaduti nel DB
        await supabase.from('mascots').update({ 
          fame: myMascot.fame, sete: myMascot.sete, svago: myMascot.svago, last_updated_at: new Date().toISOString()
        }).eq('id', myMascot.id);
      }

      setMascot({ 
        id: myMascot.id, fame: myMascot.fame, sete: myMascot.sete, 
        svago: myMascot.svago, exp: myMascot.exp, fase: myMascot.fase, nome: myMascot.nome_mascotte 
      });
      setLoading(false);
    };

    loadAndDecay();
  }, []);

  // 2️⃣ GESTIONE DROP OGGETTI E LOGICA DI GIOCO
  const handleDragEnd = async (event: any, info: any, item: typeof ITEMS[0]) => {
    if (!mascotRef.current || !mascot.id) return;

    const rect = mascotRef.current.getBoundingClientRect();
    const isOver = event.clientX >= rect.left && event.clientX <= rect.right && event.clientY >= rect.top && event.clientY <= rect.bottom;

    if (isOver) {
      // ⚠️ MALUS: Se ha troppa fame (<15%), è nervosa e prende metà EXP!
      const isHangry = mascot.fame < 15;
      const expGained = isHangry ? Math.floor(item.exp / 2) : item.exp;

      if (isHangry && item.type !== 'fame') {
        alert("La mascotte è troppo affamata! Dalle cibo prima di giocare o bere!");
        return;
      }

      // Calcola nuove statistiche
      const newStatValue = Math.min(100, mascot[item.type as 'fame' | 'sete' | 'svago'] + item.val);
      const newExp = mascot.exp + expGained;

      // 🌟 CHECK EVOLUZIONE
      let newFase = mascot.fase;
      if (mascot.fase < 9 && newExp >= EXP_THRESHOLDS[mascot.fase + 1]) {
        newFase = mascot.fase + 1;
        alert(`🎉 Incredibile! La tua mascotte si è evoluta in ${EVOLUTION_STAGES[newFase].name}!`);
      }

      const updatedMascot = { 
        ...mascot, 
        [item.type]: newStatValue, 
        exp: newExp, 
        fase: newFase 
      };

      // Aggiorna UI istantaneamente
      setMascot(updatedMascot);

      // Salva su Supabase
      await supabase.from('mascots').update({
        [item.type]: newStatValue,
        exp: newExp,
        fase: newFase,
        last_updated_at: new Date().toISOString(),
      }).eq('id', mascot.id);

      // Animazione di reazione
      mascotControls.start({
        scale: [1, 1.25, 0.9, 1],
        rotate: [0, -10, 10, 0],
        transition: { duration: 0.4 },
      });
    }
  };

  if (loading) return <div className="min-h-dvh bg-zinc-950 text-white flex items-center justify-center">Caricamento mascotte...</div>;
  if (warningMsg) return <div className="min-h-dvh bg-zinc-950 text-white flex items-center justify-center p-6 text-center">{warningMsg}</div>;

  const currentDef = EVOLUTION_STAGES[mascot.fase] || EVOLUTION_STAGES[1];
  const nextExpThreshold = mascot.fase < 9 ? EXP_THRESHOLDS[mascot.fase + 1] : mascot.exp;
  const progressPercent = mascot.fase < 9 ? Math.min(100, (mascot.exp / nextExpThreshold) * 100) : 100;

  return (
    <div className="flex flex-col items-center justify-between min-h-dvh bg-zinc-950 text-white p-4 overflow-hidden select-none">
      
      {/* INTESTAZIONE & BARRA ESPERIENZA */}
      <div className="text-center mt-6 w-full max-w-md">
        <span className="text-xs uppercase tracking-widest text-amber-500 font-black">Fase {mascot.fase} di 9</span>
        <h1 className="text-2xl font-black text-white tracking-tight">{currentDef.name}</h1>
        
        {/* Barra EXP */}
        <div className="mt-2 w-full bg-white/10 rounded-full h-1.5 overflow-hidden">
          <div className="bg-amber-400 h-full" style={{ width: `${progressPercent}%` }} />
        </div>
        <p className="text-[9px] text-zinc-400 mt-1 uppercase font-bold tracking-wider">
          {mascot.fase === 9 ? 'Livello Massimo' : `EXP: ${mascot.exp} / ${nextExpThreshold}`}
        </p>
      </div>

      {/* BARRE STATISTICHE (Fame, Sete, Svago) */}
      <div className="w-full max-w-md bg-white/10 backdrop-blur-md p-4 rounded-3xl border border-white/20 space-y-3 shadow-xl z-10">
        {(['fame', 'sete', 'svago'] as const).map((key) => (
          <div key={key} className="space-y-1.5">
            <div className="flex justify-between text-[10px] font-black uppercase tracking-wider text-zinc-300">
              <span>{key} {mascot[key] < 15 && '⚠️'}</span>
              <span className={mascot[key] < 15 ? 'text-red-400' : ''}>{mascot[key]}%</span>
            </div>
            <div className="w-full h-3.5 bg-black/40 rounded-full overflow-hidden border border-white/5">
              <div
                className={`h-full transition-all duration-500 ${
                  mascot[key] < 15 ? 'bg-red-600 animate-pulse' :
                  key === 'fame' ? 'bg-rose-500' : key === 'sete' ? 'bg-sky-500' : 'bg-emerald-500'
                }`}
                style={{ width: `${mascot[key]}%` }}
              />
            </div>
          </div>
        ))}
      </div>

      {/* MASCOTTE DINAMICA */}
      <div className="relative my-auto flex items-center justify-center py-10 z-0">
        <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 rounded-full blur-3xl pointer-events-none ${mascot.fame < 15 ? 'bg-red-500/20' : 'bg-amber-500/20'}`} />
        <motion.div ref={mascotRef} animate={mascotControls} className="relative w-64 h-64 flex items-center justify-center cursor-pointer">
          <img src={currentDef.image} alt={currentDef.name} className={`w-full h-full object-contain pointer-events-none drop-shadow-[0_15px_25px_rgba(0,0,0,0.6)] ${mascot.fame < 15 ? 'grayscale opacity-80' : ''}`} />
        </motion.div>
      </div>

      {/* INVENTARIO */}
      <div className="w-full max-w-md bg-white/10 backdrop-blur-md border border-white/20 p-4 rounded-3xl z-10 mb-16">
        <div className="grid grid-cols-3 gap-3">
          {ITEMS.map((item) => (
            <motion.div
              key={item.id} drag dragSnapToOrigin={true}
              onDragEnd={(e: any, info: any) => handleDragEnd(e, info, item)}
              whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
              className="flex flex-col items-center justify-center p-3 bg-zinc-900/60 rounded-2xl border border-white/10 cursor-grab hover:bg-zinc-800 transition-colors shadow-sm"
            >
              <img src={item.icon} alt={item.label} className="w-8 h-8 pointer-events-none mb-1 drop-shadow-md" />
              <span className="text-[9px] font-black text-zinc-300">{item.label}</span>
              <span className="text-[7px] text-amber-500 font-bold">+{mascot.fame < 15 ? Math.floor(item.exp/2) : item.exp} XP</span>
            </motion.div>
          ))}
        </div>
      </div>

    </div>
  );
}