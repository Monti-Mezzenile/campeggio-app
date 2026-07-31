'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { motion, useAnimation, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/supabase';

const DECAY_RATES = { fame: 3.5, sete: 4.5, svago: 3.0 };

const EXP_THRESHOLDS: Record<number, number> = {
  1: 0, 2: 300, 3: 900, 4: 2000, 5: 4000,
  6: 7500, 7: 12500, 8: 19000, 9: 30000
};

// Durata Cooldown in secondi
const COOLDOWNS = {
  SCORRIBANDA: 15 * 60, // 15 minuti
  ALLENAMENTO: 5 * 60,   // 5 minuti
};

const getStageFromExp = (exp: number): number => {
  for (let stage = 9; stage >= 1; stage--) {
    if (exp >= EXP_THRESHOLDS[stage]) {
      return stage;
    }
  }
  return 1;
};

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

// 💡 RIBILANCIATO: Il cibo serve a curare le barre, dà pochissima o zero EXP per evitare spam
const ITEMS = [
  { id: 'carota', label: 'Carota', type: 'fame', val: 15, exp: 0, icon: '/icons/carota.png' },
  { id: 'cosciotto', label: 'Cosciotto', type: 'fame', val: 35, exp: 1, icon: '/icons/cosciotto.png' },
  { id: 'acqua', label: 'Acqua', type: 'sete', val: 20, exp: 0, icon: '/icons/acqua.png' },
  { id: 'birra', label: 'Birra', type: 'sete', val: 35, exp: 1, icon: '/icons/birra.png' },
  { id: 'cannetta', label: 'Cannetta', type: 'svago', val: 25, exp: 1, icon: '/icons/cannetta.png' },
  { id: 'drone', label: 'Drone', type: 'svago', val: 40, exp: 2, icon: '/icons/drone.png' },
];

const MASCOT_QUOTES = [
  "Mollami le orecchie, bifolco!",
  "Anziché toccarmi, versa da bere!",
  "Oggi mi sento un po Pizzo, dammi dell'acqua.",
  "Chi è il coniglio qui, eh?",
  "bucockkkkk.",
  "Portami subito alla grigliata!",
  "Smettila o ti tiro un calcio in faccia.",
  "Aggiungi della birra alla mia ciotola!",
  "tu sei un babbo e io bevo",
  "Godo",
  "oh ma hai visto rive?",
  "oh ma hai visto Lore?",
  "Ciao faccetta di cazzo",
  "ma te ne torni a lavorare?",
  "Svarion ha cucinato?",
  "Dai che sto aspettando che arrivi Conte",
  "Dammi quella normale che l'analcolica è per Pizzo",
  "oh ma lo vedi anche tu quel Golem?",
  "Monti 3, Gran bel film!",
  "Cazzo ti tocchi?",
  "Cavallo!",
  "Dov'è il tuo cappello?"
];

const playAudioEffect = (type: 'pop' | 'munch' | 'hurt' | 'level') => {
  if (typeof window === 'undefined') return;
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    if (type === 'pop') {
      osc.frequency.setValueAtTime(300, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(700, ctx.currentTime + 0.08);
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.08);
      osc.start();
      osc.stop(ctx.currentTime + 0.08);
    } else if (type === 'munch') {
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(180, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(320, ctx.currentTime + 0.12);
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.12);
      osc.start();
      osc.stop(ctx.currentTime + 0.12);
    } else if (type === 'level') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(440, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.3);
      gain.gain.setValueAtTime(0.4, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
      osc.start();
      osc.stop(ctx.currentTime + 0.3);
    } else if (type === 'hurt') {
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(220, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(110, ctx.currentTime + 0.15);
      gain.gain.setValueAtTime(0.25, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);
      osc.start();
      osc.stop(ctx.currentTime + 0.15);
    }
  } catch (e) {}
};

interface Particle {
  id: number;
  text: string;
  color: string;
}

function formatTime(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s < 10 ? '0' : ''}${s}`;
}

export default function MascottePage() {
  const [user, setUser] = useState<any>(null);
  const [mascot, setMascot] = useState({ id: null as string | null, fame: 50, sete: 50, svago: 50, exp: 0, fase: 1, nome: 'Vittima del Campeggio' });
  const [otherMascots, setOtherMascots] = useState<any[]>([]);
  const [infamieLogs, setInfamieLogs] = useState<any[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [warningMsg, setWarningMsg] = useState('');
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [pushEnabled, setPushEnabled] = useState(false);
  
  const [isEditingName, setIsEditingName] = useState(false);
  const [tempName, setTempName] = useState('');

  const [speechBubble, setSpeechBubble] = useState<string | null>(null);
  const [particles, setParticles] = useState<Particle[]>([]);
  const [selectedRival, setSelectedRival] = useState<any | null>(null);

  // ⏳ GESTIONE COOLDOWN
  const [scorribandaCd, setScorribandaCd] = useState(0);
  const [allenamentoCd, setAllenamentoCd] = useState(0);

  const mascotRef = useRef<HTMLDivElement>(null);
  const mascotControls = useAnimation();

  // TIMER COOLDOWN ATTIVO
  useEffect(() => {
    const timer = setInterval(() => {
      const now = Math.floor(Date.now() / 1000);
      
      const scEnd = parseInt(localStorage.getItem('cd_scorribanda') || '0', 10);
      const alEnd = parseInt(localStorage.getItem('cd_allenamento') || '0', 10);

      setScorribandaCd(Math.max(0, scEnd - now));
      setAllenamentoCd(Math.max(0, alEnd - now));
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const spawnParticle = (text: string, color = 'text-emerald-400') => {
    const id = Date.now() + Math.random();
    setParticles((prev) => [...prev, { id, text, color }]);
    setTimeout(() => {
      setParticles((prev) => prev.filter((p) => p.id !== id));
    }, 1200);
  };

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);

        const { data: { user: currentUser } } = await supabase.auth.getUser();
        if (!currentUser) {
          setWarningMsg("Ehi fantasma, vedi di loggarti prima di mettere piede in questo campeggio.");
          return;
        }
        setUser(currentUser);

        const ownerName = currentUser.user_metadata?.full_name || currentUser.user_metadata?.name || currentUser.email?.split('@')[0] || 'Ignoto';

        let { data: myMascot } = await supabase.from('mascots').select('*').eq('user_id', currentUser.id).maybeSingle();

        if (!myMascot) {
          const { data: newMascot } = await supabase.from('mascots').insert([{
            user_id: currentUser.id, 
            owner_name: ownerName,
            fame: 100, sete: 100, svago: 100, exp: 0, fase: 1, 
            nome_mascotte: 'Scarto di Natura', 
            last_updated_at: new Date().toISOString()
          }]).select().single();
          myMascot = newMascot;
        }

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

          if (currentFame < 10 || currentSete < 10 || currentSvago < 10) {
            const penaltyHours = Math.floor(hoursPassed);
            if (penaltyHours > 2) {
              currentExp = Math.max(0, currentExp - penaltyHours * 2);
            }
          }
        }

        const calculatedFase = getStageFromExp(currentExp);

        await supabase.from('mascots').update({ 
          fame: currentFame, 
          sete: currentSete, 
          svago: currentSvago, 
          exp: currentExp, 
          fase: calculatedFase, 
          owner_name: ownerName,
          last_updated_at: new Date().toISOString()
        }).eq('id', myMascot.id);

        setMascot({ 
          id: myMascot.id, fame: currentFame, sete: currentSete, svago: currentSvago, exp: currentExp, 
          fase: calculatedFase, nome: myMascot.nome_mascotte || 'Bestia Anonima' 
        });
        setTempName(myMascot.nome_mascotte || 'Bestia Anonima');

        const { data: others } = await supabase.from('mascots').select('*').neq('user_id', currentUser.id).order('exp', { ascending: false });
        if (others) {
          const formattedOthers = others.map(o => ({
            ...o,
            fase: getStageFromExp(o.exp ?? 0)
          }));
          setOtherMascots(formattedOthers);
        }

        const { data: logs } = await supabase.from('mascot_logs').select('*').eq('receiver_user_id', currentUser.id).order('created_at', { ascending: false }).limit(10);
        if (logs) setInfamieLogs(logs);

      } catch (err) {
        console.error("Errore generico:", err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const handleSaveName = async () => {
    if (!tempName.trim() || !mascot.id) return;
    const cleanName = tempName.trim();
    setMascot(prev => ({ ...prev, nome: cleanName }));
    setIsEditingName(false);
    await supabase.from('mascots').update({ nome_mascotte: cleanName }).eq('id', mascot.id);
  };

  const applyItemToMascot = async (item: typeof ITEMS[0]) => {
    if (!mascot.id) return;
    const statKey = item.type as 'fame' | 'sete' | 'svago';

    // INDIGESTIONE
    if (mascot[statKey] >= 80) {
      playAudioEffect('hurt');
      const penalty = 15;
      const newSvago = Math.max(0, mascot.svago - penalty);
      
      setToastMsg(item.type === 'sete' ? `🥴 Sbronza colossale! (-15% Svago)` : `🤮 Indigestione! (-15% Svago)`);
      spawnParticle(`🤮 INDIGESTIONE!`, 'text-lime-400');
      setTimeout(() => setToastMsg(null), 3500);
      
      setMascot(prev => ({ ...prev, svago: newSvago }));
      await supabase.from('mascots').update({ svago: newSvago, last_updated_at: new Date().toISOString() }).eq('id', mascot.id);
      mascotControls.start({ x: [-15, 15, -10, 10, -5, 5, 0], scale: [1, 0.9, 1.05, 1], transition: { duration: 0.6 } });
      return;
    }

    const isCritical = mascot.fame < 20 || mascot.sete < 20 || mascot.svago < 20;
    const expGained = isCritical ? 0 : item.exp;

    const newStatValue = Math.min(100, mascot[statKey] + item.val);
    const newExp = mascot.exp + expGained;
    const newFase = getStageFromExp(newExp);

    if (newFase > mascot.fase) {
      playAudioEffect('level');
      setToastMsg(`🧬 EVOLUZIONE! Si è evoluto in: ${EVOLUTION_STAGES[newFase].name}!`);
      spawnParticle(`🎉 EVOLUZIONE!`, 'text-amber-300');
    } else {
      playAudioEffect('munch');
      setToastMsg(`+${item.val}% ${statKey.toUpperCase()}${expGained > 0 ? ` e +${expGained} XP` : ''}!`);
      spawnParticle(`+${item.val}% ${statKey.toUpperCase()}`, 'text-emerald-400');
    }
    setTimeout(() => setToastMsg(null), 3500);

    const updatedMascot = { ...mascot, [statKey]: newStatValue, exp: newExp, fase: newFase };
    setMascot(updatedMascot);

    await supabase.from('mascots').update({
      [statKey]: newStatValue, exp: newExp, fase: newFase, last_updated_at: new Date().toISOString(),
    }).eq('id', mascot.id);

    mascotControls.start({ scale: [1, 1.25, 0.9, 1], rotate: [0, -10, 10, 0], transition: { duration: 0.35 } });
  };

  const handleDragEnd = (event: any, info: any, item: typeof ITEMS[0]) => {
    if (!mascotRef.current) return;
    const rect = mascotRef.current.getBoundingClientRect();
    const isOver = info.point.x >= rect.left && info.point.x <= rect.right && info.point.y >= rect.top && info.point.y <= rect.bottom;
    if (isOver) applyItemToMascot(item);
  };

  const handleMascotTap = () => {
    playAudioEffect('pop');
    if (typeof window !== 'undefined' && 'vibrate' in navigator) navigator.vibrate?.(35);

    const quote = MASCOT_QUOTES[Math.floor(Math.random() * MASCOT_QUOTES.length)];
    setSpeechBubble(quote);
    setTimeout(() => setSpeechBubble(null), 2800);

    mascotControls.start({ scale: [1, 1.18, 0.92, 1], rotate: [0, -12, 12, 0], transition: { duration: 0.3 } });
    spawnParticle('❤️ +1 Affetto', 'text-rose-400');
  };

  // 🥷 SCORRIBANDA (15 MIN COOLDOWN)
  const handleScorribanda = async () => {
    if (scorribandaCd > 0) return;
    if (!mascot.id) return;
    if (mascot.fame < 25 || mascot.sete < 25 || mascot.svago < 25) {
      playAudioEffect('hurt');
      setToastMsg("⚠️ Troppo debole! Porta tutte le barre ad almeno 25%.");
      setTimeout(() => setToastMsg(null), 3000);
      return;
    }

    playAudioEffect('level');
    const newFame = mascot.fame - 25;
    const newSete = mascot.sete - 25;
    const newSvago = mascot.svago - 25;
    const newExp = mascot.exp + 20;
    const newFase = getStageFromExp(newExp);

    // Imposta Cooldown (15 min)
    const until = Math.floor(Date.now() / 1000) + COOLDOWNS.SCORRIBANDA;
    localStorage.setItem('cd_scorribanda', until.toString());
    setScorribandaCd(COOLDOWNS.SCORRIBANDA);

    setMascot(prev => ({ ...prev, fame: newFame, sete: newSete, svago: newSvago, exp: newExp, fase: newFase }));
    setToastMsg("🥷 Scorribanda riuscita! +20 XP guadagnati! (Cooldown 15m)");
    spawnParticle("💰 +20 XP", "text-amber-400");
    setTimeout(() => setToastMsg(null), 4000);

    mascotControls.start({ x: [0, 200, -200, 0], opacity: [1, 0, 0, 1], scale: [1, 0.5, 0.5, 1], transition: { duration: 0.8 } });

    await supabase.from('mascots').update({ fame: newFame, sete: newSete, svago: newSvago, exp: newExp, fase: newFase, last_updated_at: new Date().toISOString() }).eq('id', mascot.id);
  };

  // 🏋️ ALLENAMENTO (5 MIN COOLDOWN)
  const handleAllenamento = async () => {
    if (allenamentoCd > 0) return;
    if (!mascot.id) return;
    if (mascot.fame < 15 || mascot.sete < 15) {
      playAudioEffect('hurt');
      setToastMsg("⚠️ Non ha energie! Nutrila prima.");
      setTimeout(() => setToastMsg(null), 3000);
      return;
    }

    playAudioEffect('munch');
    const newFame = mascot.fame - 15;
    const newSete = mascot.sete - 15;
    const newExp = mascot.exp + 10;
    const newFase = getStageFromExp(newExp);

    // Imposta Cooldown (5 min)
    const until = Math.floor(Date.now() / 1000) + COOLDOWNS.ALLENAMENTO;
    localStorage.setItem('cd_allenamento', until.toString());
    setAllenamentoCd(COOLDOWNS.ALLENAMENTO);

    setMascot(prev => ({ ...prev, fame: newFame, sete: newSete, exp: newExp, fase: newFase }));
    setToastMsg("🏋️ Allenamento completato! +10 XP (Cooldown 5m)");
    spawnParticle("💦 +10 XP", "text-sky-400");
    setTimeout(() => setToastMsg(null), 3500);

    mascotControls.start({ 
      y: [0, -60, -100, -60, 0], 
      rotate: [0, 180, 360, 360, 360], 
      scale: [1, 1.1, 1.2, 1.1, 1], 
      transition: { duration: 0.8, ease: "easeInOut" } 
    });

    await supabase.from('mascots').update({ fame: newFame, sete: newSete, exp: newExp, fase: newFase, last_updated_at: new Date().toISOString() }).eq('id', mascot.id);
  };

  if (loading) {
    return (
      <div className="min-h-dvh bg-zinc-950 flex flex-col items-center justify-center p-4">
        <img src="/tamagotchi/fase1_coniglio_piccolo.png" alt="Loading..." className="w-24 h-24 object-contain animate-bounce" onError={(e) => { (e.target as HTMLImageElement).src = '/icons/coniglio.png'; }} />
      </div>
    );
  }

  const currentDef = EVOLUTION_STAGES[mascot.fase] || EVOLUTION_STAGES[1];
  const currentStageThreshold = EXP_THRESHOLDS[mascot.fase] || 0;
  const nextStageThreshold = mascot.fase < 9 ? EXP_THRESHOLDS[mascot.fase + 1] : currentStageThreshold;
  const expInCurrentStage = mascot.exp - currentStageThreshold;
  const expNeededForNextStage = nextStageThreshold - currentStageThreshold;
  const progressPercent = mascot.fase < 9 && expNeededForNextStage > 0 ? Math.min(100, Math.max(0, (expInCurrentStage / expNeededForNextStage) * 100)) : 100;
  const isCriticalState = mascot.fame < 20 || mascot.sete < 20 || mascot.svago < 20;

  return (
    <div className="flex flex-col items-center min-h-dvh bg-zinc-950 text-white p-4 pt-20 sm:pt-24 overflow-y-auto pb-28 select-none">
      
      {/* HEADER */}
      <div className="w-full max-w-md flex justify-between items-center mb-4 z-20">
        <Link href="/" className="bg-zinc-900/90 border border-white/20 text-xs font-black px-4 py-2 rounded-2xl hover:bg-zinc-800 transition-colors uppercase text-zinc-300">
          ← INDIETRO
        </Link>
        <Link href="/runner" className="bg-amber-500 hover:bg-amber-400 text-black font-black text-xs px-4 py-2 rounded-2xl shadow-lg flex items-center gap-1.5 uppercase tracking-wider">
          <span>🏃 Corsa Clandestina</span>
        </Link>
      </div>

      {/* HEADER MASCOTTE */}
      <div className="text-center w-full max-w-md z-10">
        <span className="text-[10px] uppercase tracking-widest text-amber-500 font-black">
          Fase {mascot.fase} / 9 • {currentDef.name}
        </span>
        
        <div className="flex items-center justify-center gap-2 mt-1">
          {isEditingName ? (
            <div className="flex items-center gap-2">
              <input type="text" value={tempName} onChange={(e) => setTempName(e.target.value)} maxLength={24} className="bg-zinc-900 border border-amber-500/50 text-white text-lg font-black text-center rounded-xl px-3 py-1 outline-none w-52" autoFocus />
              <button onClick={handleSaveName} className="bg-amber-500 text-black font-black text-xs px-3 py-2 rounded-xl">OK</button>
            </div>
          ) : (
            <button onClick={() => setIsEditingName(true)} className="group flex items-center gap-2 text-2xl font-black text-white tracking-tight hover:text-amber-400 transition-colors">
              <span>{mascot.nome}</span>
              <img src="/icons/edit.png" alt="Edit" className="w-4 h-4 opacity-40 group-hover:opacity-100" />
            </button>
          )}
        </div>

        <div className="mt-3 w-full bg-white/10 rounded-full h-2.5 overflow-hidden border border-white/5 shadow-inner">
          <div className="bg-amber-400 h-full transition-all duration-300" style={{ width: `${progressPercent}%` }} />
        </div>
        <p className="text-[9px] text-zinc-400 mt-1 uppercase font-bold tracking-wider">
          {mascot.fase === 9 ? 'IL MOSTRO FINALE' : `EXP FASE: ${Math.max(0, expInCurrentStage)} / ${expNeededForNextStage} (Totale: ${mascot.exp} XP)`}
        </p>
      </div>

      {/* TOAST NOTIFICHE */}
      {toastMsg && (
        <div className="w-full max-w-md mt-3 bg-zinc-900 border border-amber-500/50 text-amber-300 text-xs font-black tracking-wide text-center py-3 px-4 rounded-2xl shadow-xl z-20">
          {toastMsg}
        </div>
      )}

      {/* BARRE STATISTICHE PERSONALI */}
      <div className="w-full max-w-md bg-zinc-900/80 backdrop-blur-md p-4 rounded-3xl border border-white/10 space-y-3 shadow-xl z-10 mt-4">
        {(['fame', 'sete', 'svago'] as const).map((key) => (
          <div key={key} className="space-y-1.5">
            <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-zinc-300">
              <span>{key}</span>
              <span className={mascot[key] < 20 ? 'text-red-500 font-black text-xs' : ''}>{Math.round(mascot[key])}%</span>
            </div>
            <div className="w-full h-3.5 bg-black/50 rounded-full overflow-hidden border border-white/5">
              <div className={`h-full transition-all duration-500 ${mascot[key] < 20 ? 'bg-red-600 animate-pulse' : key === 'fame' ? 'bg-rose-500' : key === 'sete' ? 'bg-sky-500' : 'bg-emerald-500'}`} style={{ width: `${Math.min(100, Math.max(0, mascot[key]))}%` }} />
            </div>
          </div>
        ))}
      </div>

      {/* MASCOTTE SCENICA */}
      <div className="relative w-full max-w-md my-4 rounded-3xl overflow-hidden border border-white/10 flex items-center justify-center min-h-[320px] shadow-2xl">
        <img src="/Backgr.png" alt="Camping Pixel Landscape" className="absolute inset-0 w-full h-full object-cover pointer-events-none" />
        
        <AnimatePresence>
          {speechBubble && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="absolute top-4 z-30 bg-white text-zinc-950 px-4 py-2 rounded-2xl font-black text-xs text-center border-2 border-amber-400">
              {speechBubble}
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {particles.map((p) => (
            <motion.div key={p.id} initial={{ opacity: 1, y: 20 }} animate={{ opacity: 0, y: -60 }} transition={{ duration: 1 }} className={`absolute z-30 font-black text-sm ${p.color}`}>
              {p.text}
            </motion.div>
          ))}
        </AnimatePresence>

        <motion.div ref={mascotRef} animate={mascotControls} onClick={handleMascotTap} className="relative w-56 h-56 flex items-center justify-center cursor-pointer z-10">
          <motion.img 
            animate={{ y: isCriticalState ? [0, -2, 2, 0] : [0, -8, 0] }}
            transition={{ repeat: Infinity, duration: isCriticalState ? 0.25 : 3 }}
            src={currentDef.image} alt={currentDef.name} className={`w-full h-full object-contain pointer-events-none ${isCriticalState ? 'grayscale opacity-70' : ''}`} 
          />
        </motion.div>
      </div>

      {/* ⚡ AZIONI SPECIALI (CON COUNTDOWN TIMER) */}
      <div className="w-full max-w-md mb-4 z-10 space-y-2">
        <h2 className="text-xs font-black uppercase tracking-widest text-zinc-500 text-center mb-1">Azioni Rapide</h2>
        
        <div className="grid grid-cols-2 gap-3">
          {/* Scorribanda */}
          <button 
            onClick={handleScorribanda}
            disabled={scorribandaCd > 0}
            className={`p-3 rounded-2xl border shadow-lg transition-all flex flex-col items-center justify-center gap-1 group ${
              scorribandaCd > 0 
                ? 'bg-zinc-900/60 border-zinc-800 opacity-60 cursor-not-allowed' 
                : 'bg-gradient-to-br from-purple-900/80 to-indigo-900/80 hover:from-purple-800 hover:to-indigo-800 border-purple-500/40 active:scale-[0.98]'
            }`}
          >
            <span className="text-2xl group-hover:scale-110 transition-transform">🥷</span>
            <span className="text-[10px] font-black text-white uppercase mt-1">Scorribanda</span>
            <span className={`text-[8px] font-black px-2 py-0.5 rounded-full border ${
              scorribandaCd > 0 
                ? 'bg-zinc-800 text-amber-400 border-amber-500/30' 
                : 'bg-purple-500/20 text-purple-300 border-purple-500/50'
            }`}>
              {scorribandaCd > 0 ? `⏳ ${formatTime(scorribandaCd)}` : '-25% Stats | +20 XP'}
            </span>
          </button>

          {/* Allenamento */}
          <button 
            onClick={handleAllenamento}
            disabled={allenamentoCd > 0}
            className={`p-3 rounded-2xl border shadow-lg transition-all flex flex-col items-center justify-center gap-1 group ${
              allenamentoCd > 0 
                ? 'bg-zinc-900/60 border-zinc-800 opacity-60 cursor-not-allowed' 
                : 'bg-gradient-to-br from-sky-900/80 to-blue-900/80 hover:from-sky-800 hover:to-blue-800 border-sky-500/40 active:scale-[0.98]'
            }`}
          >
            <span className="text-2xl group-hover:scale-110 transition-transform">🏋️</span>
            <span className="text-[10px] font-black text-white uppercase mt-1">Allenamento</span>
            <span className={`text-[8px] font-black px-2 py-0.5 rounded-full border ${
              allenamentoCd > 0 
                ? 'bg-zinc-800 text-amber-400 border-amber-500/30' 
                : 'bg-sky-500/20 text-sky-300 border-sky-500/50'
            }`}>
              {allenamentoCd > 0 ? `⏳ ${formatTime(allenamentoCd)}` : '-15% Stats | +10 XP'}
            </span>
          </button>
        </div>
      </div>

      {/* INVENTARIO */}
      <div className="w-full max-w-md bg-zinc-900/80 backdrop-blur-md border border-white/10 p-4 rounded-3xl z-10 mb-4">
        <h2 className="text-xs font-black uppercase tracking-widest text-zinc-500 mb-3 text-center">Spazzatura Utile</h2>
        <div className="grid grid-cols-3 gap-3">
          {ITEMS.map((item) => (
            <motion.div
              key={item.id} drag dragSnapToOrigin={true} onDragEnd={(e: any, info: any) => handleDragEnd(e, info, item)} onClick={() => applyItemToMascot(item)}
              className="flex flex-col items-center justify-center p-3 rounded-2xl border bg-zinc-800/80 border-white/10 cursor-pointer active:bg-zinc-700/80"
            >
              <img src={item.icon} alt={item.label} className="w-8 h-8 pointer-events-none mb-1" />
              <span className="text-[9px] font-black text-zinc-300">{item.label}</span>
              <span className="text-[8px] text-amber-500 font-black">+{item.val}%</span>
            </motion.div>
          ))}
        </div>
      </div>

    </div>
  );
}