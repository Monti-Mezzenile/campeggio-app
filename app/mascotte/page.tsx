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
  const [mascot, setMascot] = useState({ id: null as string | null, fame: 50, sete: 50, svago: 50, exp: 0, fase: 1, nome: 'Essere Infelice' });
  const [otherMascots, setOtherMascots] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [warningMsg, setWarningMsg] = useState('');
  
  // Naming state
  const [isEditingName, setIsEditingName] = useState(false);
  const [tempName, setTempName] = useState('');

  const mascotRef = useRef<HTMLDivElement>(null);
  const mascotControls = useAnimation();

  // 1️⃣ CARICAMENTO INIZIALE & DECADIMENTO
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          setWarningMsg('Niente login, niente mascotte. Chi sei, un fantasma? Accedi prima.');
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
            setWarningMsg("Il DB si rifiuta di darti una mascotte. Controlla le permissioni.");
            return;
          }
          myMascot = newMascot;
        }

        // Decadimento Offline
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

        const mascotName = myMascot.nome_mascotte || 'Vittima del Campeggio';
        setMascot({ 
          id: myMascot.id,
          fame: currentFame,
          sete: currentSete, 
          svago: currentSvago,
          exp: myMascot.exp ?? 0,
          fase: myMascot.fase ?? 1,
          nome: mascotName 
        });
        setTempName(mascotName);

        // Altre mascotte
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

      if (mascot[statKey] > 80) {
        alert(`Fermati, ingordo! La barra ${statKey.toUpperCase()} è sopra l'80%. Falla digerire prima di ingozzarla ancora.`);
        return;
      }

      const isHangry = mascot.fame < 15;

      if (isHangry && item.type !== 'fame') {
        alert("Sei un padrone pessimo! Sta esaurendo le energie vitali: dalle da mangiare prima di pretendere che giochi o beva!");
        return;
      }

      const expGained = isHangry ? Math.floor(item.exp / 2) : item.exp;
      const newStatValue = Math.min(100, mascot[statKey] + item.val);
      const newExp = mascot.exp + expGained;

      let newFase = mascot.fase;
      if (mascot.fase < 9 && newExp >= EXP_THRESHOLDS[mascot.fase + 1]) {
        newFase = mascot.fase + 1;
        alert(`Miracolo! Nonostante le tue scarse cure, la tua creatura si è evoluta in: ${EVOLUTION_STAGES[newFase].name}!`);
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

  if (loading) return <div className="min-h-dvh bg-zinc-950 text-white flex items-center justify-center font-bold text-sm tracking-widest uppercase animate-pulse">Riesumando la tua mascotte dal degrado...</div>;
  if (warningMsg) return <div className="min-h-dvh bg-zinc-950 text-red-400 flex items-center justify-center p-6 text-center font-bold">{warningMsg}</div>;

  const currentDef = EVOLUTION_STAGES[mascot.fase] || EVOLUTION_STAGES[1];
  const nextExpThreshold = mascot.fase < 9 ? EXP_THRESHOLDS[mascot.fase + 1] : mascot.exp;
  const progressPercent = mascot.fase < 9 ? Math.min(100, (mascot.exp / nextExpThreshold) * 100) : 100;

  return (
    <div className="flex flex-col items-center min-h-dvh bg-zinc-950 text-white p-4 pt-14 sm:pt-16 overflow-y-auto pb-28 select-none">
      
      {/* 🟢 SEZIONE 1: INTESTAZIONE, NOME EDITABILE & BARRA EXP */}
      <div className="text-center w-full max-w-md">
        <span className="text-[10px] uppercase tracking-widest text-amber-500 font-black">Fase {mascot.fase} / 9 • {currentDef.name}</span>
        
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

        <div className="mt-3 w-full bg-white/10 rounded-full h-1.5 overflow-hidden">
          <div className="bg-amber-400 h-full transition-all duration-300" style={{ width: `${progressPercent}%` }} />
        </div>
        <p className="text-[9px] text-zinc-400 mt-1 uppercase font-bold tracking-wider">
          {mascot.fase === 9 ? 'Livello Massimo (Soddisfatto?)' : `EXP: ${mascot.exp} / ${nextExpThreshold}`}
        </p>
      </div>

      {/* 🟢 SEZIONE 2: BARRE STATISTICHE PERSONALI */}
      <div className="w-full max-w-md bg-zinc-900/80 backdrop-blur-md p-4 rounded-3xl border border-white/20 space-y-3 shadow-xl z-10 mt-4">
        {(['fame', 'sete', 'svago'] as const).map((key) => (
          <div key={key} className="space-y-1.5">
            <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-wider text-zinc-300">
              <span className="flex items-center gap-1">
                {key}
                {mascot[key] < 15 && <img src="/icons/warning.png" alt="Warning" className="w-3.5 h-3.5 animate-bounce" />}
              </span>
              <span className={mascot[key] < 15 ? 'text-red-400 font-bold' : ''}>{mascot[key]}%</span>
            </div>
            <div className="w-full h-3.5 bg-black/50 rounded-full overflow-hidden border border-white/5">
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

      {/* 🟢 SEZIONE 3: MASCOTTE CON SFONDO SCENICO PIXEL ART */}
      <div className="relative w-full max-w-md my-4 rounded-3xl overflow-hidden border border-white/10 flex items-center justify-center min-h-[320px] shadow-2xl">
        {/* Immagine di Sfondo Pixel Art */}
        <img
          src="/Backgr.png"
          alt="Camping Pixel Landscape"
          className="absolute inset-0 w-full h-full object-cover pointer-events-none"
        />
        
        {/* Sfocatura/Dissolvenza sfumata verso il nero in basso */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-zinc-950/20 to-zinc-950 pointer-events-none" />

        {/* Glow circolare dinamico attorno al personaggio */}
        <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 rounded-full blur-3xl pointer-events-none ${mascot.fame < 15 ? 'bg-red-500/30' : 'bg-amber-500/20'}`} />

        {/* Mascotte Animata */}
        <motion.div ref={mascotRef} animate={mascotControls} className="relative w-56 h-56 flex items-center justify-center cursor-pointer z-10">
          <img src={currentDef.image} alt={currentDef.name} className={`w-full h-full object-contain pointer-events-none drop-shadow-[0_20px_30px_rgba(0,0,0,0.9)] ${mascot.fame < 15 ? 'grayscale opacity-80' : ''}`} />
        </motion.div>
      </div>

      {/* 🟢 SEZIONE 4: INVENTARIO */}
      <div className="w-full max-w-md bg-zinc-900/80 backdrop-blur-md border border-white/20 p-4 rounded-3xl z-10 mb-8">
        <h2 className="text-xs font-black uppercase tracking-wider text-zinc-400 mb-3 text-center">Rifornimenti (Mantenimento)</h2>
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

      {/* 🟢 SEZIONE 5: ALTRE MASCOTTE DEL CAMPEGGIO (SPAZIO AMPLIATO) */}
      <div className="w-full max-w-md border-t border-white/10 pt-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-black uppercase tracking-wider text-amber-400 flex items-center gap-2">
            <img src="/icons/camp.png" alt="Camp" className="w-4 h-4" />
            <span>Superstiti del Campeggio</span>
          </h2>
          <span className="text-[10px] text-zinc-500 font-bold uppercase">{otherMascots.length} Rivali</span>
        </div>

        {otherMascots.length === 0 ? (
          <div className="text-center p-6 bg-white/5 rounded-2xl border border-white/5">
            <p className="text-xs text-zinc-400">Nessun rivale nei paraggi. Sei solo in questo deserto.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {otherMascots.map((other, idx) => {
              const otherDef = EVOLUTION_STAGES[other.fase] || EVOLUTION_STAGES[1];
              return (
                <div key={other.id || idx} className="flex flex-col sm:flex-row sm:items-center justify-between bg-zinc-900/80 border border-white/10 p-4 rounded-2xl shadow-md gap-3">
                  
                  {/* Avatar + Info Mascotte (Spazio generoso per il nome) */}
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

                  {/* Statistiche Avversario */}
                  <div className="flex flex-col gap-1.5 w-full sm:w-28 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-white/5">
                    
                    <div className="space-y-0.5">
                      <div className="flex items-center justify-between text-[8px] font-bold text-zinc-400">
                        <span>FAME</span>
                        <span className={other.fame < 15 ? 'text-red-400' : ''}>{other.fame ?? 50}%</span>
                      </div>
                      <div className="w-full bg-black/60 h-1.5 rounded-full overflow-hidden border border-white/5">
                        <div className={`h-full ${other.fame < 15 ? 'bg-red-500 animate-pulse' : 'bg-rose-500'}`} style={{ width: `${other.fame ?? 50}%` }} />
                      </div>
                    </div>

                    <div className="space-y-0.5">
                      <div className="flex items-center justify-between text-[8px] font-bold text-zinc-400">
                        <span>SETE</span>
                        <span className={other.sete < 15 ? 'text-red-400' : ''}>{other.sete ?? 50}%</span>
                      </div>
                      <div className="w-full bg-black/60 h-1.5 rounded-full overflow-hidden border border-white/5">
                        <div className={`h-full ${other.sete < 15 ? 'bg-red-500 animate-pulse' : 'bg-sky-500'}`} style={{ width: `${other.sete ?? 50}%` }} />
                      </div>
                    </div>

                    <div className="space-y-0.5">
                      <div className="flex items-center justify-between text-[8px] font-bold text-zinc-400">
                        <span>SVAGO</span>
                        <span className={other.svago < 15 ? 'text-red-400' : ''}>{other.svago ?? 50}%</span>
                      </div>
                      <div className="w-full bg-black/60 h-1.5 rounded-full overflow-hidden border border-white/5">
                        <div className={`h-full ${other.svago < 15 ? 'bg-red-500 animate-pulse' : 'bg-emerald-500'}`} style={{ width: `${other.svago ?? 50}%` }} />
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