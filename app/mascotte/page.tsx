'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { motion, useAnimation } from 'framer-motion';
import { supabase } from '@/lib/supabase';

// ⚙️ TASSI DI DECADIMENTO ORARIO
const DECAY_RATES = {
  fame: 3.5, // % all'ora
  sete: 4.5, // % all'ora
  svago: 3.0, // % all'ora
};

// 📊 SOGLIE DI ESPERIENZA PER LE FASI
const EXP_THRESHOLDS: Record<number, number> = {
  1: 0, 2: 300, 3: 900, 4: 2000, 5: 4000,
  6: 7500, 7: 12500, 8: 19000, 9: 30000
};

// 🖼️ MAPPA GRAFICA EVOLUZIONI
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

// 🎒 OGGETTI BILANCIATI (EXP Ridotta)
const ITEMS = [
  { id: 'carota', label: 'Carota', type: 'fame', val: 15, exp: 1, icon: '/icons/carota.png' },
  { id: 'cosciotto', label: 'Cosciotto', type: 'fame', val: 35, exp: 3, icon: '/icons/cosciotto.png' },
  { id: 'acqua', label: 'Acqua', type: 'sete', val: 20, exp: 2, icon: '/icons/acqua.png' },
  { id: 'birra', label: 'Birra', type: 'sete', val: 35, exp: 4, icon: '/icons/birra.png' },
  { id: 'cannetta', label: 'Cannetta', type: 'svago', val: 25, exp: 3, icon: '/icons/cannetta.png' },
  { id: 'drone', label: 'Drone', type: 'svago', val: 40, exp: 5, icon: '/icons/drone.png' },
];

export default function MascottePage() {
  const [mascot, setMascot] = useState({ 
    id: null as string | null, 
    fame: 50, 
    sete: 50, 
    svago: 50, 
    exp: 0, 
    fase: 1, 
    nome: 'Essere Infelice' 
  });
  const [otherMascots, setOtherMascots] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [warningMsg, setWarningMsg] = useState('');
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  
  // Gestione editer nome
  const [isEditingName, setIsEditingName] = useState(false);
  const [tempName, setTempName] = useState('');

  const mascotRef = useRef<HTMLDivElement>(null);
  const mascotControls = useAnimation();

  // 1️⃣ CARICAMENTO INIZIALE & DECADIMENTO OFFLINE
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          setWarningMsg('Nessuna sessione attiva. Effettua il login prima di accedere al campeggio.');
          return;
        }

        let { data: myMascot, error } = await supabase
          .from('mascots')
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle();

        if (error) console.error("Errore recupero mascotte:", error);

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
              nome_mascotte: 'Vittima del Campeggio',
              last_updated_at: new Date().toISOString()
            }])
            .select()
            .single();

          if (createError) {
            setWarningMsg("Impossibile creare la mascotte. Verificare le politiche RLS di Supabase.");
            return;
          }
          myMascot = newMascot;
        }

        // Calcolo Decadimento Temporale
        const now = new Date();
        const lastUpdate = myMascot.last_updated_at ? new Date(myMascot.last_updated_at) : new Date();
        const hoursPassed = Math.max(0, (now.getTime() - lastUpdate.getTime()) / (1000 * 60 * 60));

        let currentFame = myMascot.fame ?? 100;
        let currentSete = myMascot.sete ?? 100;
        let currentSvago = myMascot.svago ?? 100;
        let currentExp = myMascot.exp ?? 0;

        if (hoursPassed > 0.05) { 
          currentFame = Math.max(0, currentFame - hoursPassed * DECAY_RATES.fame);
          currentSete = Math.max(0, currentSete - hoursPassed * DECAY_RATES.sete);
          currentSvago = Math.max(0, currentSvago - hoursPassed * DECAY_RATES.svago);

          // Penalità da abbandono (<10% per più di 2 ore)
          if (currentFame < 10 || currentSete < 10 || currentSvago < 10) {
            const penaltyHours = Math.floor(hoursPassed);
            if (penaltyHours > 2) {
              currentExp = Math.max(0, currentExp - penaltyHours * 2);
            }
          }

          await supabase.from('mascots').update({ 
            fame: currentFame,
            sete: currentSete,
            svago: currentSvago,
            exp: currentExp,
            last_updated_at: new Date().toISOString()
          }).eq('id', myMascot.id);
        }

        const mascotName = myMascot.nome_mascotte || 'Vittima del Campeggio';
        setMascot({ 
          id: myMascot.id,
          fame: currentFame,
          sete: currentSete, 
          svago: currentSvago,
          exp: currentExp,
          fase: myMascot.fase ?? 1,
          nome: mascotName 
        });
        setTempName(mascotName);

        // Caricamento rivali
        const { data: others } = await supabase
          .from('mascots')
          .select('*')
          .neq('user_id', user.id)
          .order('exp', { ascending: false });

        if (others) setOtherMascots(others);

      } catch (err) {
        console.error("Errore generico:", err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // 2️⃣ SALVATAGGIO NOME
  const handleSaveName = async () => {
    if (!tempName.trim() || !mascot.id) return;
    const cleanName = tempName.trim();
    setMascot(prev => ({ ...prev, nome: cleanName }));
    setIsEditingName(false);

    await supabase.from('mascots').update({
      nome_mascotte: cleanName
    }).eq('id', mascot.id);
  };

  // 3️⃣ DRAG & DROP LOGIC
  const handleDragEnd = async (event: any, info: any, item: typeof ITEMS[0]) => {
    if (!mascotRef.current || !mascot.id) return;

    const rect = mascotRef.current.getBoundingClientRect();
    const dropX = info.point.x;
    const dropY = info.point.y;

    const isOver = dropX >= rect.left && dropX <= rect.right && dropY >= rect.top && dropY <= rect.bottom;

    if (isOver) {
      const statKey = item.type as 'fame' | 'sete' | 'svago';

      // Blocco Anti-Spam (>80%)
      if (mascot[statKey] >= 80) {
        setToastMsg(`🛑 La barra ${statKey.toUpperCase()} è oltre l'80%! Aspetta prima di riempirla.`);
        setTimeout(() => setToastMsg(null), 3000);
        return;
      }

      // Controllo Stato Critico (<20%)
      const isCritical = mascot.fame < 20 || mascot.sete < 20 || mascot.svago < 20;
      const expGained = isCritical ? 0 : item.exp;

      const newStatValue = Math.min(100, mascot[statKey] + item.val);
      const newExp = mascot.exp + expGained;

      let newFase = mascot.fase;
      if (mascot.fase < 9 && newExp >= EXP_THRESHOLDS[mascot.fase + 1]) {
        newFase = mascot.fase + 1;
        setToastMsg(`🎉 EVOLUZIONE! La tua mascotte è diventata: ${EVOLUTION_STAGES[newFase].name}!`);
      } else {
        if (isCritical) {
          setToastMsg(`⚠️ Statistica ripristinata, ma 0 XP guadagnati! La mascotte è in Stato Critico (<20%).`);
        } else {
          setToastMsg(`+${item.val}% ${statKey.toUpperCase()} | +${expGained} XP!`);
        }
      }
      setTimeout(() => setToastMsg(null), 3500);

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
        scale: [1, 1.2, 0.95, 1],
        rotate: [0, -8, 8, 0],
        transition: { duration: 0.35 },
      });
    }
  };

  // 🐰 4️⃣ CARICAMENTO CON ICONA CONIGLIO IN CENTRO
  if (loading) {
    return (
      <div className="min-h-dvh bg-zinc-950 flex flex-col items-center justify-center p-4">
        <div className="relative flex items-center justify-center">
          <div className="absolute w-28 h-28 bg-amber-500/20 rounded-full blur-2xl animate-pulse" />
          <img
            src="/tamagotchi/fase1_coniglio_piccolo.png"
            alt="Loading..."
            className="w-24 h-24 object-contain animate-bounce z-10"
            onError={(e) => {
              (e.target as HTMLImageElement).src = '/icons/coniglio.png';
            }}
          />
        </div>
      </div>
    );
  }

  if (warningMsg) {
    return (
      <div className="min-h-dvh bg-zinc-950 text-red-400 flex items-center justify-center p-6 text-center font-bold">
        {warningMsg}
      </div>
    );
  }

  const currentDef = EVOLUTION_STAGES[mascot.fase] || EVOLUTION_STAGES[1];
  const nextExpThreshold = mascot.fase < 9 ? EXP_THRESHOLDS[mascot.fase + 1] : mascot.exp;
  const progressPercent = mascot.fase < 9 ? Math.min(100, (mascot.exp / nextExpThreshold) * 100) : 100;
  const isCriticalState = mascot.fame < 20 || mascot.sete < 20 || mascot.svago < 20;

  return (
    <div className="flex flex-col items-center min-h-dvh bg-zinc-950 text-white p-4 pt-10 sm:pt-14 overflow-y-auto pb-28 select-none">
      
      {/* 🟢 SEZIONE 1: INTESTAZIONE & EXP */}
      <div className="text-center w-full max-w-md z-10">
        <span className="text-[10px] uppercase tracking-widest text-amber-500 font-black">
          Fase {mascot.fase} / 9 • {currentDef.name}
        </span>
        
        {/* EDIT NOME MASCOTTE */}
        <div className="flex items-center justify-center gap-2 mt-1">
          {isEditingName ? (
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={tempName}
                onChange={(e) => setTempName(e.target.value)}
                maxLength={24}
                className="bg-zinc-900 border border-amber-500/50 text-white text-lg font-black text-center rounded-xl px-3 py-1 outline-none w-52"
                autoFocus
              />
              <button onClick={handleSaveName} className="bg-amber-500 text-black font-black text-xs px-3 py-2 rounded-xl active:scale-95">
                OK
              </button>
            </div>
          ) : (
            <button onClick={() => setIsEditingName(true)} className="group flex items-center gap-2 text-2xl font-black text-white tracking-tight hover:text-amber-400 transition-colors">
              <span>{mascot.nome}</span>
              <img src="/icons/edit.png" alt="Edit" className="w-4 h-4 opacity-40 group-hover:opacity-100 transition-opacity" />
            </button>
          )}
        </div>

        <div className="mt-3 w-full bg-white/10 rounded-full h-2 overflow-hidden border border-white/5">
          <div className="bg-amber-400 h-full transition-all duration-300" style={{ width: `${progressPercent}%` }} />
        </div>
        <p className="text-[9px] text-zinc-400 mt-1 uppercase font-bold tracking-wider">
          {mascot.fase === 9 ? 'Livello Massimo Raggiunto' : `EXP: ${mascot.exp} / ${nextExpThreshold}`}
        </p>
      </div>

      {/* 🔔 TOAST NOTIFICHE */}
      {toastMsg && (
        <div className="w-full max-w-md mt-3 bg-zinc-900 border border-amber-500/50 text-amber-300 text-xs font-bold text-center py-2.5 px-4 rounded-2xl shadow-xl animate-in fade-in zoom-in-95 z-20">
          {toastMsg}
        </div>
      )}

      {/* ⚠️ AVVISO STATO CRITICO */}
      {isCriticalState && (
        <div className="w-full max-w-md mt-3 bg-red-500/20 border border-red-500/50 p-3 rounded-2xl text-center animate-pulse z-10">
          <p className="text-xs font-black text-red-400 uppercase tracking-wide">⚠️ STATO CRITICO (&lt;20%)</p>
          <p className="text-[10px] text-red-300">Riporta le statistiche sopra il 20% per guadagnare di nuovo punti EXP dagli oggetti!</p>
        </div>
      )}

      {/* 🟢 SEZIONE 2: BARRE STATISTICHE PERSONALI */}
      <div className="w-full max-w-md bg-zinc-900/80 backdrop-blur-md p-4 rounded-3xl border border-white/10 space-y-3 shadow-xl z-10 mt-4">
        {(['fame', 'sete', 'svago'] as const).map((key) => (
          <div key={key} className="space-y-1.5">
            <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-wider text-zinc-300">
              <span className="flex items-center gap-1">
                {key}
                {mascot[key] < 20 && <img src="/icons/warning.png" alt="Warning" className="w-3.5 h-3.5 animate-bounce" />}
              </span>
              <span className={mascot[key] < 20 ? 'text-red-400 font-bold' : ''}>{Math.round(mascot[key])}%</span>
            </div>
            <div className="w-full h-3.5 bg-black/50 rounded-full overflow-hidden border border-white/5">
              <div
                className={`h-full transition-all duration-500 ${
                  mascot[key] < 20 ? 'bg-red-600 animate-pulse' :
                  key === 'fame' ? 'bg-rose-500' : key === 'sete' ? 'bg-sky-500' : 'bg-emerald-500'
                }`}
                style={{ width: `${Math.min(100, Math.max(0, mascot[key]))}%` }}
              />
            </div>
          </div>
        ))}
      </div>

      {/* 🟢 SEZIONE 3: MASCOTTE CON SFONDO SCENICO PIXEL ART */}
      <div className="relative w-full max-w-md my-4 rounded-3xl overflow-hidden border border-white/10 flex items-center justify-center min-h-[320px] shadow-2xl">
        <img
          src="/Backgr.png"
          alt="Camping Pixel Landscape"
          className="absolute inset-0 w-full h-full object-cover pointer-events-none"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-zinc-950/20 to-zinc-950 pointer-events-none" />

        <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 rounded-full blur-3xl pointer-events-none ${isCriticalState ? 'bg-red-500/30' : 'bg-amber-500/20'}`} />

        <motion.div ref={mascotRef} animate={mascotControls} className="relative w-56 h-56 flex items-center justify-center cursor-pointer z-10">
          <img 
            src={currentDef.image} 
            alt={currentDef.name} 
            className={`w-full h-full object-contain pointer-events-none drop-shadow-[0_20px_30px_rgba(0,0,0,0.9)] ${
              isCriticalState ? 'grayscale opacity-80' : ''
            }`} 
          />
        </motion.div>
      </div>

      {/* 🟢 SEZIONE 4: INVENTARIO DRAG & DROP */}
      <div className="w-full max-w-md bg-zinc-900/80 backdrop-blur-md border border-white/10 p-4 rounded-3xl z-10">
        <h2 className="text-xs font-black uppercase tracking-wider text-zinc-400 mb-3 text-center">Rifornimenti (Trascina sulla Mascotte)</h2>
        <div className="grid grid-cols-3 gap-3">
          {ITEMS.map((item) => {
            const currentStatVal = mascot[item.type as 'fame' | 'sete' | 'svago'];
            const isDisabled = currentStatVal >= 80;

            return (
              <motion.div
                key={item.id} 
                drag={!isDisabled}
                dragSnapToOrigin={true}
                onDragEnd={(e: any, info: any) => handleDragEnd(e, info, item)}
                whileHover={{ scale: isDisabled ? 1 : 1.05 }} 
                whileTap={{ scale: isDisabled ? 1 : 0.95 }}
                className={`flex flex-col items-center justify-center p-3 rounded-2xl border transition-colors shadow-sm ${
                  isDisabled 
                    ? 'bg-zinc-900/30 border-red-500/20 opacity-40 cursor-not-allowed' 
                    : 'bg-zinc-900/60 border-white/10 cursor-grab active:cursor-grabbing hover:bg-zinc-800'
                }`}
              >
                <img src={item.icon} alt={item.label} className="w-8 h-8 pointer-events-none mb-1 drop-shadow-md" />
                <span className="text-[9px] font-black text-zinc-300">{item.label}</span>
                <span className="text-[8px] text-amber-400 font-bold">+{item.val}% | +{isCriticalState ? 0 : item.exp} XP</span>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* 🟢 SEZIONE MINIGAME RUNNER */}
      <div className="w-full max-w-md my-5 z-10">
        <Link href="/runner" className="block w-full">
          <motion.div
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="relative overflow-hidden bg-gradient-to-r from-amber-600 via-amber-500 to-amber-600 p-4 rounded-3xl text-zinc-950 font-black shadow-xl border border-amber-400/50 flex items-center justify-between group cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="bg-zinc-950/20 p-2.5 rounded-2xl text-2xl">🏃‍♂️</div>
              <div className="text-left">
                <div className="text-[10px] uppercase tracking-wider text-zinc-900/80 font-extrabold">Minigame Arcade</div>
                <div className="text-base font-black tracking-tight text-zinc-950 uppercase leading-none mt-0.5">Fuga nel Bosco</div>
              </div>
            </div>
            <div className="bg-zinc-950 text-amber-400 text-xs px-3.5 py-2 rounded-xl font-black uppercase tracking-wider group-hover:bg-zinc-900 transition-colors shadow-md">
              GIOCA →
            </div>
          </motion.div>
        </Link>
      </div>

      {/* 🟢 SEZIONE 5: SUPERSTITI DEL CAMPEGGIO */}
      <div className="w-full max-w-md border-t border-white/10 pt-6 z-10">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-black uppercase tracking-wider text-amber-400 flex items-center gap-2">
            <img src="/icons/camp.png" alt="Camp" className="w-4 h-4" />
            <span>Superstiti del Campeggio</span>
          </h2>
          <span className="text-[10px] text-zinc-500 font-bold uppercase">{otherMascots.length} Rivali</span>
        </div>

        {otherMascots.length === 0 ? (
          <div className="text-center p-6 bg-white/5 rounded-2xl border border-white/5">
            <p className="text-xs text-zinc-400">Nessun rivale presente al momento.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {otherMascots.map((other, idx) => {
              const otherDef = EVOLUTION_STAGES[other.fase] || EVOLUTION_STAGES[1];
              return (
                <div key={other.id || idx} className="flex flex-col sm:flex-row sm:items-center justify-between bg-zinc-900/80 border border-white/10 p-4 rounded-2xl shadow-md gap-3">
                  
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="relative w-14 h-14 bg-black/40 rounded-xl flex items-center justify-center p-1 border border-white/10 shrink-0 shadow-inner">
                      <img src={otherDef.image} alt={otherDef.name} className="w-full h-full object-contain" />
                    </div>
                    <div className="space-y-1 min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-black text-white break-words leading-tight">
                          {other.nome_mascotte || 'Anonimo'}
                        </span>
                        <span className="text-[9px] px-2 py-0.5 bg-amber-500/20 text-amber-400 font-bold rounded-md shrink-0 border border-amber-500/30">
                          Fase {other.fase}
                        </span>
                      </div>
                      <p className="text-[10px] text-zinc-400 font-medium">{otherDef.name} • {other.exp || 0} XP</p>
                    </div>
                  </div>

                  <div className="flex flex-col gap-1.5 w-full sm:w-28 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-white/5">
                    <div className="space-y-0.5">
                      <div className="flex items-center justify-between text-[8px] font-bold text-zinc-400">
                        <span>FAME</span>
                        <span className={other.fame < 20 ? 'text-red-400' : ''}>{Math.round(other.fame ?? 50)}%</span>
                      </div>
                      <div className="w-full bg-black/60 h-1.5 rounded-full overflow-hidden border border-white/5">
                        <div className={`h-full ${other.fame < 20 ? 'bg-red-500 animate-pulse' : 'bg-rose-500'}`} style={{ width: `${Math.min(100, Math.max(0, other.fame ?? 50))}%` }} />
                      </div>
                    </div>

                    <div className="space-y-0.5">
                      <div className="flex items-center justify-between text-[8px] font-bold text-zinc-400">
                        <span>SETE</span>
                        <span className={other.sete < 20 ? 'text-red-400' : ''}>{Math.round(other.sete ?? 50)}%</span>
                      </div>
                      <div className="w-full bg-black/60 h-1.5 rounded-full overflow-hidden border border-white/5">
                        <div className={`h-full ${other.sete < 20 ? 'bg-red-500 animate-pulse' : 'bg-sky-500'}`} style={{ width: `${Math.min(100, Math.max(0, other.sete ?? 50))}%` }} />
                      </div>
                    </div>

                    <div className="space-y-0.5">
                      <div className="flex items-center justify-between text-[8px] font-bold text-zinc-400">
                        <span>SVAGO</span>
                        <span className={other.svago < 20 ? 'text-red-400' : ''}>{Math.round(other.svago ?? 50)}%</span>
                      </div>
                      <div className="w-full bg-black/60 h-1.5 rounded-full overflow-hidden border border-white/5">
                        <div className={`h-full ${other.svago < 20 ? 'bg-red-500 animate-pulse' : 'bg-emerald-500'}`} style={{ width: `${Math.min(100, Math.max(0, other.svago ?? 50))}%` }} />
                      </div>
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