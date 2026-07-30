'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, useAnimation } from 'framer-motion';
import { supabase } from '@/lib/supabase';

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

// 🎒 OGGETTI (Con esperienza)
const ITEMS = [
  { id: 'carota', label: 'Carota', type: 'fame', val: 15, exp: 5, icon: '/icons/carota.png' },
  { id: 'cosciotto', label: 'Cosciotto', type: 'fame', val: 35, exp: 12, icon: '/icons/cosciotto.png' },
  { id: 'acqua', label: 'Acqua', type: 'sete', val: 15, exp: 5, icon: '/icons/acqua.png' },
  { id: 'birra', label: 'Birra', type: 'sete', val: 35, exp: 15, icon: '/icons/birra.png' },
  { id: 'cannetta', label: 'Cannetta', type: 'svago', val: 25, exp: 8, icon: '/icons/cannetta.png' },
  { id: 'drone', label: 'Drone', type: 'svago', val: 40, exp: 20, icon: '/icons/drone.png' },
];

export default function MascottePage() {
  const [mascot, setMascot] = useState({ id: null as string | null, fame: 50, sete: 50, svago: 50, exp: 0, fase: 1, nome: 'Cucciolo' });
  const [otherMascots, setOtherMascots] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [warningMsg, setWarningMsg] = useState('');
  
  const mascotRef = useRef<HTMLDivElement>(null);
  const mascotControls = useAnimation();

  // 1️⃣ CARICAMENTO INIZIALE, DECADIMENTO E MASCOTTE ALTRUI
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          setWarningMsg('Devi fare il login per accedere alla tua mascotte!');
          return;
        }

        // Recupera la MIA mascotte
        let { data: myMascot, error } = await supabase
          .from('mascots')
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle();

        if (error) {
          console.error("Errore recupero mascotte personale:", error);
        }

        if (!myMascot) {
          const { data: newMascot, error: createError } = await supabase
            .from('mascots')
            .insert([{
              user_id: user.id,
              fame: 100,
              sete: 100,
              svago: 100,
              exp: 0,
              fase: 1,
              nome_mascotte: 'Cucciolo',
              last_updated_at: new Date().toISOString()
            }])
            .select()
            .single();

          if (createError) {
            console.error("Errore creazione mascotte:", createError);
            setWarningMsg("Impossibile creare la mascotte. Verifica le permissioni del DB.");
            return;
          }
          myMascot = newMascot;
        }

        // 🧮 CALCOLO DECADIMENTO OFFLINE (Mia Mascotte)
        const now = new Date();
        const lastUpdate = myMascot.last_updated_at ? new Date(myMascot.last_updated_at) : new Date();
        const hoursPassed = (now.getTime() - lastUpdate.getTime()) / (1000 * 60 * 60);

        let currentFame = myMascot.fame ?? 100;
        let currentSete = myMascot.sete ?? 100;
        let currentSvago = myMascot.svago ?? 100;

        if (hoursPassed > 0.5) { 
          const fameDecay = Math.floor(hoursPassed * 1.5);
          const seteDecay = Math.floor(hoursPassed * 2.0);
          const svagoDecay = Math.floor(hoursPassed * 1.2);

          currentFame = Math.max(0, currentFame - fameDecay);
          currentSete = Math.max(0, currentSete - seteDecay);
          currentSvago = Math.max(0, currentSvago - svagoDecay);
          
          await supabase.from('mascots').update({ 
            fame: currentFame,
            sete: currentSete,
            svago: currentSvago,
            last_updated_at: new Date().toISOString()
          }).eq('id', myMascot.id);
        }

        setMascot({ 
          id: myMascot.id,
          fame: currentFame,
          sete: currentSete, 
          svago: currentSvago,
          exp: myMascot.exp ?? 0,
          fase: myMascot.fase ?? 1,
          nome: myMascot.nome_mascotte || 'Cucciolo' 
        });

        // 👥 RECUPERA LE MASCOTTE DEGLI ALTRI CAMPEGGIATORI
        const { data: others, error: othersError } = await supabase
          .from('mascots')
          .select('*')
          .neq('user_id', user.id)
          .order('exp', { ascending: false });

        if (!othersError && others) {
          setOtherMascots(others);
        }

      } catch (err) {
        console.error("Errore generico:", err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // 2️⃣ GESTIONE DROP OGGETTI E LOGICA DI GIOCO
  const handleDragEnd = async (event: any, info: any, item: typeof ITEMS[0]) => {
    if (!mascotRef.current || !mascot.id) return;

    const rect = mascotRef.current.getBoundingClientRect();
    const dropX = info.point.x;
    const dropY = info.point.y;

    const isOver = dropX >= rect.left && dropX <= rect.right && dropY >= rect.top && dropY <= rect.bottom;

    if (isOver) {
      const statKey = item.type as 'fame' | 'sete' | 'svago';

      // 🛑 LIMITAZIONE ANTI-SPAM (80%)
      if (mascot[statKey] > 80) {
        alert(`🛑 Troppo pieno! La barra ${statKey.toUpperCase()} è sopra l'80%. Torna più tardi!`);
        return;
      }

      // ⚠️ MALUS: Se ha troppa fame (<15%)
      const isHangry = mascot.fame < 15;

      if (isHangry && item.type !== 'fame') {
        alert("😡 La mascotte è troppo affamata! Dalle cibo prima di giocare o bere!");
        return;
      }

      const expGained = isHangry ? Math.floor(item.exp / 2) : item.exp;
      const newStatValue = Math.min(100, mascot[statKey] + item.val);
      const newExp = mascot.exp + expGained;

      let newFase = mascot.fase;
      if (mascot.fase < 9 && newExp >= EXP_THRESHOLDS[mascot.fase + 1]) {
        newFase = mascot.fase + 1;
        alert(`🎉 Incredibile! La tua mascotte si è evoluta in ${EVOLUTION_STAGES[newFase].name}!`);
      }

      const updatedMascot = { 
        ...mascot, 
        [statKey]: newStatValue, 
        exp: newExp, 
        fase: newFase 
      };

      setMascot(updatedMascot);

      await supabase.from('mascots').update({
        [statKey]: newStatValue,
        exp: newExp,
        fase: newFase,
        last_updated_at: new Date().toISOString(),
      }).eq('id', mascot.id);

      mascotControls.start({
        scale: [1, 1.25, 0.9, 1],
        rotate: [0, -10, 10, 0],
        transition: { duration: 0.4 },
      });
    }
  };

  if (loading) return <div className="min-h-dvh bg-zinc-950 text-white flex items-center justify-center font-bold">Caricamento mascotte...</div>;
  if (warningMsg) return <div className="min-h-dvh bg-zinc-950 text-white flex items-center justify-center p-6 text-center font-medium">{warningMsg}</div>;

  const currentDef = EVOLUTION_STAGES[mascot.fase] || EVOLUTION_STAGES[1];
  const nextExpThreshold = mascot.fase < 9 ? EXP_THRESHOLDS[mascot.fase + 1] : mascot.exp;
  const progressPercent = mascot.fase < 9 ? Math.min(100, (mascot.exp / nextExpThreshold) * 100) : 100;

  return (
    <div className="flex flex-col items-center min-h-dvh bg-zinc-950 text-white p-4 overflow-y-auto pb-28 select-none">
      
      {/* 🟢 SEZIONE 1: INTESTAZIONE & BARRA EXP */}
      <div className="text-center mt-4 w-full max-w-md">
        <span className="text-xs uppercase tracking-widest text-amber-500 font-black">Fase {mascot.fase} di 9</span>
        <h1 className="text-2xl font-black text-white tracking-tight">{currentDef.name}</h1>
        
        <div className="mt-2 w-full bg-white/10 rounded-full h-1.5 overflow-hidden">
          <div className="bg-amber-400 h-full transition-all duration-300" style={{ width: `${progressPercent}%` }} />
        </div>
        <p className="text-[9px] text-zinc-400 mt-1 uppercase font-bold tracking-wider">
          {mascot.fase === 9 ? 'Livello Massimo' : `EXP: ${mascot.exp} / ${nextExpThreshold}`}
        </p>
      </div>

      {/* 🟢 SEZIONE 2: BARRE STATISTICHE PERSONALI */}
      <div className="w-full max-w-md bg-white/10 backdrop-blur-md p-4 rounded-3xl border border-white/20 space-y-3 shadow-xl z-10 mt-4">
        {(['fame', 'sete', 'svago'] as const).map((key) => (
          <div key={key} className="space-y-1.5">
            <div className="flex justify-between text-[10px] font-black uppercase tracking-wider text-zinc-300">
              <span>{key} {mascot[key] < 15 && '⚠️'}</span>
              <span className={mascot[key] < 15 ? 'text-red-400 font-bold' : ''}>{mascot[key]}%</span>
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

      {/* 🟢 SEZIONE 3: MASCOTTE DINAMICA */}
      <div className="relative my-6 flex items-center justify-center py-6 z-0">
        <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-56 h-56 rounded-full blur-3xl pointer-events-none ${mascot.fame < 15 ? 'bg-red-500/20' : 'bg-amber-500/20'}`} />
        <motion.div ref={mascotRef} animate={mascotControls} className="relative w-56 h-56 flex items-center justify-center cursor-pointer">
          <img src={currentDef.image} alt={currentDef.name} className={`w-full h-full object-contain pointer-events-none drop-shadow-[0_15px_25px_rgba(0,0,0,0.6)] ${mascot.fame < 15 ? 'grayscale opacity-80' : ''}`} />
        </motion.div>
      </div>

      {/* 🟢 SEZIONE 4: INVENTARIO */}
      <div className="w-full max-w-md bg-white/10 backdrop-blur-md border border-white/20 p-4 rounded-3xl z-10 mb-8">
        <h2 className="text-xs font-black uppercase tracking-wider text-zinc-400 mb-3 text-center">Zaino Interattivo</h2>
        <div className="grid grid-cols-3 gap-3">
          {ITEMS.map((item) => (
            <motion.div
              key={item.id} drag dragSnapToOrigin={true}
              onDragEnd={(e: any, info: any) => handleDragEnd(e, info, item)}
              whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
              className={`flex flex-col items-center justify-center p-3 rounded-2xl border cursor-grab hover:bg-zinc-800 transition-colors shadow-sm ${
                mascot[item.type as 'fame' | 'sete' | 'svago'] > 80 ? 'bg-zinc-900/30 border-red-500/20 opacity-50' : 'bg-zinc-900/60 border-white/10'
              }`}
            >
              <img src={item.icon} alt={item.label} className="w-8 h-8 pointer-events-none mb-1 drop-shadow-md" />
              <span className="text-[9px] font-black text-zinc-300">{item.label}</span>
              <span className="text-[7px] text-amber-500 font-bold">+{mascot.fame < 15 ? Math.floor(item.exp/2) : item.exp} XP</span>
            </motion.div>
          ))}
        </div>
      </div>

      {/* 🟢 SEZIONE 5: ALTRE MASCOTTE DEL CAMPEGGIO */}
      <div className="w-full max-w-md border-t border-white/10 pt-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-black uppercase tracking-wider text-amber-400 flex items-center gap-2">
            <span>⛺</span> Mascotte del Campeggio
          </h2>
          <span className="text-[10px] text-zinc-500 font-bold uppercase">{otherMascots.length} Altri Camper</span>
        </div>

        {otherMascots.length === 0 ? (
          <div className="text-center p-6 bg-white/5 rounded-2xl border border-white/5">
            <p className="text-xs text-zinc-400">Nessun altro camper ha ancora creato una mascotte.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {otherMascots.map((other, idx) => {
              const otherDef = EVOLUTION_STAGES[other.fase] || EVOLUTION_STAGES[1];
              return (
                <div key={other.id || idx} className="flex items-center justify-between bg-zinc-900/70 border border-white/10 p-3.5 rounded-2xl shadow-md">
                  
                  {/* Avatar + Info Base */}
                  <div className="flex items-center gap-3">
                    <div className="relative w-12 h-12 bg-white/5 rounded-xl flex items-center justify-center p-1 border border-white/10 overflow-hidden">
                      <img src={otherDef.image} alt={otherDef.name} className="w-full h-full object-contain" />
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-black text-white">{other.nome_mascotte || 'Mascotte Anonima'}</span>
                        <span className="text-[9px] px-1.5 py-0.5 bg-amber-500/20 text-amber-400 font-bold rounded-md">
                          Fase {other.fase}
                        </span>
                      </div>
                      <p className="text-[10px] text-zinc-400 font-medium mt-0.5">{otherDef.name} • {other.exp || 0} XP</p>
                    </div>
                  </div>

                  {/* Mini Stats (Fame, Sete, Svago) */}
                  <div className="flex flex-col gap-1 w-20">
                    <div className="flex items-center justify-between text-[8px] font-bold text-zinc-400">
                      <span>FAME</span>
                      <span className={other.fame < 15 ? 'text-red-400' : ''}>{other.fame ?? 50}%</span>
                    </div>
                    <div className="w-full bg-black/50 h-1 rounded-full overflow-hidden">
                      <div className={`h-full ${other.fame < 15 ? 'bg-red-500' : 'bg-rose-500'}`} style={{ width: `${other.fame ?? 50}%` }} />
                    </div>

                    <div className="flex items-center justify-between text-[8px] font-bold text-zinc-400">
                      <span>SETE</span>
                      <span className={other.sete < 15 ? 'text-red-400' : ''}>{other.sete ?? 50}%</span>
                    </div>
                    <div className="w-full bg-black/50 h-1 rounded-full overflow-hidden">
                      <div className={`h-full ${other.sete < 15 ? 'bg-red-500' : 'bg-sky-500'}`} style={{ width: `${other.sete ?? 50}%` }} />
                    </div>

                    <div className="flex items-center justify-between text-[8px] font-bold text-zinc-400">
                      <span>SVAGO</span>
                      <span className={other.svago < 15 ? 'text-red-400' : ''}>{other.svago ?? 50}%</span>
                    </div>
                    <div className="w-full bg-black/50 h-1 rounded-full overflow-hidden">
                      <div className={`h-full ${other.svago < 15 ? 'bg-red-500' : 'bg-emerald-500'}`} style={{ width: `${other.svago ?? 50}%` }} />
                    </div>
                  </div>

                </div>
              );
            })}
          </div>
        )}
      </div>

    </div>
  );
}