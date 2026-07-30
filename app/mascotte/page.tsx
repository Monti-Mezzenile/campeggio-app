'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, useAnimation } from 'framer-motion';
import { createClient } from '@supabase/supabase-js';

// Inizializzazione client Supabase
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Mappatura esatta dei file grafici delle 9 fasi evolutive
const EVOLUTION_STAGES: Record<number, { name: string; image: string }> = {
  1: { name: 'Coniglio Piccolo', image: '/tamagotchi/fase1_coniglio_piccolo.png' },
  2: { name: 'Coniglio Medio', image: '/tamagotchi/fase2_coniglio_medio.png' },
  3: { name: 'Lepre', image: '/tamagotchi/fase3_lepre.png' },
  4: { name: 'Lepre Muscolosa', image: '/tamagotchi/fase4_lepre_muscolosa.png' },
  5: { name: 'Lepre Centauro', image: '/tamagotchi/fase5_lepre_centauro.png.png' }, // Usiamo il tuo nome file esatto
  6: { name: 'Pony', image: '/tamagotchi/fase6_pony.png' },
  7: { name: 'Cavallo Medio', image: '/tamagotchi/fase7_cavallo_medio.png' },
  8: { name: 'Cavallo Grande', image: '/tamagotchi/fase8_cavallo_grande.png' },
  9: { name: 'Cavallo Supremo', image: '/tamagotchi/fase9_cavallo_supremo.png' },
};

// Configurazione Oggetti Inventario
const ITEMS = [
  { id: 'carota', label: 'Carota', type: 'fame', val: 15, icon: '/icons/carota.png' },
  { id: 'cosciotto', label: 'Cosciotto', type: 'fame', val: 35, icon: '/icons/cosciotto.png' },
  { id: 'acqua', label: 'Acqua', type: 'sete', val: 15, icon: '/icons/acqua.png' },
  { id: 'birra', label: 'Birra', type: 'sete', val: 35, icon: '/icons/birra.png' },
  { id: 'cannetta', label: 'Cannetta', type: 'svago', val: 25, icon: '/icons/cannetta.png' },
  { id: 'drone', label: 'Drone', type: 'svago', val: 40, icon: '/icons/drone.png' },
];

export default function MascottePage() {
  const [stage, setStage] = useState<number>(1);
  const [stats, setStats] = useState({ fame: 50, sete: 50, svago: 50 });
  const mascotRef = useRef<HTMLDivElement>(null);
  const mascotControls = useAnimation();

  // 1. CARICAMENTO E ASCOLTO REAL-TIME DA SUPABASE
  useEffect(() => {
    const fetchMascotData = async () => {
      const { data, error } = await supabase
        .from('tamagotchi')
        .select('*')
        .single();

      if (data && !error) {
        setStats({ fame: data.fame, sete: data.sete, svago: data.svago });
        setStage(data.stage || 1);
      }
    };

    fetchMascotData();

    const channel = supabase
      .channel('tamagotchi_realtime')
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'tamagotchi' },
        (payload) => {
          const updated = payload.new;
          setStats({ fame: updated.fame, sete: updated.sete, svago: updated.svago });
          setStage(updated.stage);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // 2. SALVATAGGIO STATISTICHE SU SUPABASE
  const updateDBStats = async (newStats: typeof stats) => {
    await supabase
      .from('tamagotchi')
      .update({
        fame: newStats.fame,
        sete: newStats.sete,
        svago: newStats.svago,
        updated_at: new Date().toISOString(),
      })
      .eq('id', 1);
  };

  // 3. GESTIONE COLLISIONE DRAG & DROP
  const handleDragEnd = (event: any, info: any, item: typeof ITEMS[0]) => {
    if (!mascotRef.current) return;

    const mascotRect = mascotRef.current.getBoundingClientRect();
    const dropX = event.clientX;
    const dropY = event.clientY;

    const isOverMascot =
      dropX >= mascotRect.left &&
      dropX <= mascotRect.right &&
      dropY >= mascotRect.top &&
      dropY <= mascotRect.bottom;

    if (isOverMascot) {
      const updatedValue = Math.min(100, stats[item.type as keyof typeof stats] + item.val);
      const newStats = { ...stats, [item.type]: updatedValue };

      setStats(newStats);
      updateDBStats(newStats);

      mascotControls.start({
        scale: [1, 1.25, 0.9, 1],
        rotate: [0, -10, 10, 0],
        transition: { duration: 0.4 },
      });
    }
  };

  const currentMascot = EVOLUTION_STAGES[stage] || EVOLUTION_STAGES[1];

  return (
    <div className="flex flex-col items-center justify-between min-h-dvh bg-zinc-950 text-white p-4 overflow-hidden select-none">
      
      {/* INTESTAZIONE CON STADIO ATTUALE */}
      <div className="text-center mt-6 mb-2">
        <span className="text-xs uppercase tracking-widest text-amber-500 font-black">Fase {stage} di 9</span>
        <h1 className="text-2xl font-black text-white tracking-tight">{currentMascot.name}</h1>
      </div>

      {/* BARRE STATISTICHE */}
      <div className="w-full max-w-md bg-white/10 backdrop-blur-md p-4 rounded-3xl border border-white/20 space-y-3 shadow-xl z-10">
        {Object.entries(stats).map(([key, value]) => (
          <div key={key} className="space-y-1.5">
            <div className="flex justify-between text-[10px] font-black uppercase tracking-wider text-zinc-300">
              <span>{key}</span>
              <span>{value}%</span>
            </div>
            <div className="w-full h-3.5 bg-black/40 rounded-full overflow-hidden border border-white/5">
              <div
                className={`h-full transition-all duration-500 ${
                  key === 'fame' ? 'bg-rose-500' : key === 'sete' ? 'bg-sky-500' : 'bg-emerald-500'
                }`}
                style={{ width: `${value}%` }}
              />
            </div>
          </div>
        ))}
      </div>

      {/* MASCOTTE DINAMICA */}
      <div className="relative my-auto flex items-center justify-center py-10 z-0">
        {/* Glow di Sfondo dietro la mascotte */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-amber-500/20 rounded-full blur-3xl pointer-events-none" />
        
        <motion.div
          ref={mascotRef}
          animate={mascotControls}
          className="relative w-64 h-64 flex items-center justify-center cursor-pointer"
        >
          <img
            src={currentMascot.image}
            alt={currentMascot.name}
            className="w-full h-full object-contain pointer-events-none drop-shadow-[0_15px_25px_rgba(0,0,0,0.6)]"
          />
        </motion.div>
      </div>

      {/* INVENTARIO TRASCINABILE */}
      <div className="w-full max-w-md bg-white/10 backdrop-blur-md border border-white/20 p-4 rounded-3xl z-10 mb-6">
        <p className="text-center text-[10px] text-zinc-400 mb-3 font-bold uppercase tracking-widest">
          Trascina un oggetto
        </p>
        <div className="grid grid-cols-3 gap-3">
          {ITEMS.map((item) => (
            <div key={item.id} className="relative group">
              <motion.div
                drag
                dragSnapToOrigin={true}
                onDragEnd={(e: any, info: any) => handleDragEnd(e, info, item)} // <-- Errore TS risolto qui
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="flex flex-col items-center justify-center p-3 bg-zinc-900/60 rounded-2xl border border-white/10 cursor-grab active:cursor-grabbing hover:bg-zinc-800 transition-colors shadow-sm relative z-20"
              >
                <img src={item.icon} alt={item.label} className="w-10 h-10 pointer-events-none mb-1 drop-shadow-md" />
                <span className="text-[10px] font-black text-zinc-300">{item.label}</span>
              </motion.div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}