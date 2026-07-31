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

const ITEMS = [
  { id: 'carota', label: 'Carota', type: 'fame', val: 15, exp: 1, icon: '/icons/carota.png' },
  { id: 'cosciotto', label: 'Cosciotto', type: 'fame', val: 35, exp: 3, icon: '/icons/cosciotto.png' },
  { id: 'acqua', label: 'Acqua', type: 'sete', val: 20, exp: 2, icon: '/icons/acqua.png' },
  { id: 'birra', label: 'Birra', type: 'sete', val: 35, exp: 4, icon: '/icons/birra.png' },
  { id: 'cannetta', label: 'Cannetta', type: 'svago', val: 25, exp: 3, icon: '/icons/cannetta.png' },
  { id: 'drone', label: 'Drone', type: 'svago', val: 40, exp: 5, icon: '/icons/drone.png' },
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

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
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

  const mascotRef = useRef<HTMLDivElement>(null);
  const mascotControls = useAnimation();

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

        // Ricavo nome proprietario
        const ownerName = currentUser.user_metadata?.full_name || currentUser.user_metadata?.name || currentUser.email?.split('@')[0] || 'Ignoto';

        if ('serviceWorker' in navigator && 'PushManager' in window) {
          const reg = await navigator.serviceWorker.getRegistration();
          const sub = await reg?.pushManager.getSubscription();
          if (sub) setPushEnabled(true);
        }

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

        // Aggiorno i dati e assicuro che l'owner_name sia presente
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

  const enablePushNotifications = async () => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window) || !user) {
      alert("Il tuo browser non supporta le notifiche push web.");
      return;
    }

    try {
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        alert("Devi concedere i permessi per le notifiche!");
        return;
      }

      const registration = await navigator.serviceWorker.register('/sw.js');
      const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;

      if (!publicKey) {
        alert("Chiave VAPID pubblica non configurata in .env.local!");
        return;
      }

      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey)
      });

      await supabase.from('push_subscriptions').upsert({
        user_id: user.id,
        subscription: subscription.toJSON()
      });

      setPushEnabled(true);
      setToastMsg("🔔 Notifiche Push attivate! Ora saprai chi ti attacca.");
      setTimeout(() => setToastMsg(null), 3500);
    } catch (err) {
      console.error("Errore iscrizione push:", err);
      alert("Errore nell'attivazione delle notifiche.");
    }
  };

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

    if (mascot[statKey] >= 80) {
      playAudioEffect('hurt');
      setToastMsg(`🛑 Ingordo! La stat ${statKey.toUpperCase()} è già quasi piena. Datti una calmata.`);
      spawnParticle(`🛑 Pieno!`, 'text-red-400');
      setTimeout(() => setToastMsg(null), 3000);
      return;
    }

    const isCritical = mascot.fame < 20 || mascot.sete < 20 || mascot.svago < 20;
    const expGained = isCritical ? 0 : item.exp;

    const newStatValue = Math.min(100, mascot[statKey] + item.val);
    const newExp = mascot.exp + expGained;
    
    const newFase = getStageFromExp(newExp);

    if (newFase > mascot.fase) {
      playAudioEffect('level');
      setToastMsg(`🧬 BOTOX NATURALE! Si è evoluto in: ${EVOLUTION_STAGES[newFase].name}!`);
      spawnParticle(`🎉 EVOLUZIONE!`, 'text-amber-300');
    } else {
      playAudioEffect('munch');
      if (isCritical) {
        setToastMsg(`⚠️ Curato a stento. Zero EXP finché non tiri su le altre barre rosse, genio.`);
      } else {
        setToastMsg(`Sbem! +${item.val}% ${statKey.toUpperCase()} e +${expGained} XP!`);
      }
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

  const handleRivalAction = async (rival: any, actionType: 'pigna' | 'birra' | 'cibo' | 'troll') => {
    if (!rival?.id || !user) return;

    let updatedFame = rival.fame ?? 50;
    let updatedSete = rival.sete ?? 50;
    let updatedSvago = rival.svago ?? 50;
    let actionTitle = "";
    let logMessage = "";

    const senderName = mascot.nome || 'Un campeggiatore anonimo';

    if (actionType === 'pigna') {
      updatedSvago = Math.max(0, updatedSvago - 12);
      actionTitle = "🎯 Pigna in faccia!";
      logMessage = `${senderName} ti ha tirato una pigna in faccia! (-12% Svago)`;
      playAudioEffect('hurt');
    } else if (actionType === 'birra') {
      updatedSete = Math.min(100, updatedSete + 25);
      actionTitle = "🍺 Birra offerta!";
      logMessage = `${senderName} ti ha offerto una birra fresca! (+25% Sete)`;
      playAudioEffect('pop');
    } else if (actionType === 'cibo') {
      updatedFame = Math.min(100, updatedFame + 25);
      actionTitle = "🥩 Cibo lanciato!";
      logMessage = `${senderName} ti ha lanciato un cosciotto! (+25% Fame)`;
      playAudioEffect('munch');
    } else if (actionType === 'troll') {
      updatedSvago = Math.max(0, updatedSvago - 8);
      updatedFame = Math.max(0, updatedFame - 8);
      actionTitle = "👻 Spavento notturno!";
      logMessage = `${senderName} ti ha spaventato a morte! (-8% Fame e Svago)`;
      playAudioEffect('hurt');
    }

    setOtherMascots((prev) =>
      prev.map((m) => (m.id === rival.id ? { ...m, fame: updatedFame, sete: updatedSete, svago: updatedSvago } : m))
    );

    setToastMsg(`Azione eseguita su ${rival.nome_mascotte || 'Anonimo'}!`);
    setTimeout(() => setToastMsg(null), 3500);
    setSelectedRival(null);

    await supabase.from('mascots').update({
      fame: updatedFame, sete: updatedSete, svago: updatedSvago, last_updated_at: new Date().toISOString()
    }).eq('id', rival.id);

    await supabase.from('mascot_logs').insert([{
      sender_name: senderName,
      receiver_user_id: rival.user_id,
      action_type: actionType,
      message: logMessage
    }]);

    try {
      await fetch('/api/push-notify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          receiverUserId: rival.user_id,
          title: actionTitle,
          message: logMessage
        })
      });
    } catch (e) {
      console.error("Errore invio push:", e);
    }
  };

  if (loading) {
    return (
      <div className="min-h-dvh bg-zinc-950 flex flex-col items-center justify-center p-4">
        <img src="/tamagotchi/fase1_coniglio_piccolo.png" alt="Loading..." className="w-24 h-24 object-contain animate-bounce" onError={(e) => { (e.target as HTMLImageElement).src = '/icons/coniglio.png'; }} />
      </div>
    );
  }

  if (warningMsg) {
    return <div className="min-h-dvh bg-zinc-950 text-red-400 flex items-center justify-center p-6 text-center font-bold">{warningMsg}</div>;
  }

  const currentDef = EVOLUTION_STAGES[mascot.fase] || EVOLUTION_STAGES[1];
  
  const currentStageThreshold = EXP_THRESHOLDS[mascot.fase] || 0;
  const nextStageThreshold = mascot.fase < 9 ? EXP_THRESHOLDS[mascot.fase + 1] : currentStageThreshold;
  const expInCurrentStage = mascot.exp - currentStageThreshold;
  const expNeededForNextStage = nextStageThreshold - currentStageThreshold;

  const progressPercent = mascot.fase < 9 && expNeededForNextStage > 0
    ? Math.min(100, Math.max(0, (expInCurrentStage / expNeededForNextStage) * 100))
    : 100;

  const isCriticalState = mascot.fame < 20 || mascot.sete < 20 || mascot.svago < 20;

  return (
    <div className="flex flex-col items-center min-h-dvh bg-zinc-950 text-white p-4 pt-20 sm:pt-24 overflow-y-auto pb-28 select-none">
      
      {/* 🔙 HEADER & BARRA NOTIFICHE PUSH */}
      <div className="w-full max-w-md flex justify-between items-center mb-4 z-20">
        <Link href="/" className="bg-zinc-900/90 border border-white/20 text-xs font-black px-4 py-2 rounded-2xl hover:bg-zinc-800 transition-colors uppercase text-zinc-300">
          ← INDIETRO
        </Link>

        {!pushEnabled ? (
          <button 
            onClick={enablePushNotifications} 
            className="bg-amber-500 hover:bg-amber-400 text-black font-black text-[10px] px-3 py-2 rounded-2xl shadow-lg animate-pulse uppercase tracking-wider"
          >
            🔔 Attiva Push
          </button>
        ) : (
          <span className="text-[10px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 px-3 py-1.5 rounded-2xl font-black">
            🔔 Push Attive
          </span>
        )}
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

      {/* STATO CRITICO */}
      {isCriticalState && (
        <div className="w-full max-w-md mt-3 bg-red-950/60 border border-red-500/50 p-3 rounded-2xl text-center animate-pulse z-10">
          <p className="text-xs font-black text-red-500 uppercase tracking-widest">⚠️ STATO PATETICO (&lt;20%)</p>
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

      {/* INVENTARIO */}
      <div className="w-full max-w-md bg-zinc-900/80 backdrop-blur-md border border-white/10 p-4 rounded-3xl z-10">
        <h2 className="text-xs font-black uppercase tracking-widest text-zinc-500 mb-3 text-center">Spazzatura Utile</h2>
        <div className="grid grid-cols-3 gap-3">
          {ITEMS.map((item) => {
            const isDisabled = mascot[item.type as 'fame' | 'sete' | 'svago'] >= 80;
            return (
              <motion.div
                key={item.id} drag={!isDisabled} dragSnapToOrigin={true} onDragEnd={(e: any, info: any) => handleDragEnd(e, info, item)} onClick={() => !isDisabled && applyItemToMascot(item)}
                className={`flex flex-col items-center justify-center p-3 rounded-2xl border ${isDisabled ? 'bg-zinc-900/30 opacity-30 border-red-500/10 cursor-not-allowed' : 'bg-zinc-800/80 border-white/10 cursor-pointer'}`}
              >
                <img src={item.icon} alt={item.label} className="w-8 h-8 pointer-events-none mb-1" />
                <span className="text-[9px] font-black text-zinc-300">{item.label}</span>
                <span className="text-[8px] text-amber-500 font-black">+{item.val}%</span>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* RUNNER */}
      <div className="w-full max-w-md my-5 z-10">
        <Link href="/runner" className="block w-full">
          <div className="bg-gradient-to-r from-amber-600 to-amber-500 p-4 rounded-3xl text-zinc-950 font-black flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img src="/icons/coniglio-run.png" alt="Run" className="w-8 h-8 object-contain" onError={(e) => { (e.target as HTMLImageElement).src = '/icons/carota.png'; }} />
              <div>
                <div className="text-[10px] uppercase text-zinc-900/80 font-extrabold">Rischi la vita per</div>
                <div className="text-base font-black uppercase leading-none">La Fuga Disperata</div>
              </div>
            </div>
            <div className="bg-zinc-950 text-amber-400 text-xs px-3.5 py-2 rounded-xl font-black">VIA →</div>
          </div>
        </Link>
      </div>

      {/* FECCIA DEL CAMPEGGIO (CON SCHEDE CHIARE E STATISTICHE) */}
      <div className="w-full max-w-md border-t border-white/10 pt-6 z-10">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-sm font-black uppercase tracking-widest text-amber-500 flex items-center gap-2">
              <img src="/icons/wallace.png" alt="Wallace" className="w-5 h-5 object-contain" />
              <span>Feccia del Campeggio</span>
            </h2>
            <p className="text-[9px] text-zinc-400 mt-0.5">Le mascotte degli altri sfigati</p>
          </div>
          <span className="text-[10px] text-zinc-500 font-bold uppercase bg-zinc-900 px-2 py-1 rounded-lg border border-white/5">
            {otherMascots.length} Rivali
          </span>
        </div>

        {otherMascots.length === 0 ? (
          <div className="text-center p-6 bg-zinc-900/50 rounded-2xl border border-white/5">
            <p className="text-xs text-zinc-500 font-medium">Deserto totale. Sei l'unico pazzo qui.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {otherMascots.map((other, idx) => {
              const otherDef = EVOLUTION_STAGES[other.fase] || EVOLUTION_STAGES[1];
              const oFame = Math.min(100, Math.max(0, other.fame ?? 50));
              const oSete = Math.min(100, Math.max(0, other.sete ?? 50));
              const oSvago = Math.min(100, Math.max(0, other.svago ?? 50));

              return (
                <div key={other.id || idx} className="bg-zinc-900/80 border border-white/10 rounded-3xl p-4 shadow-lg relative overflow-hidden flex flex-col group">
                   
                   {/* ETICHETTA DEL PROPRIETARIO */}
                   <div className="absolute top-0 right-0 bg-zinc-950 text-amber-500/80 border-b border-l border-white/10 text-[8px] font-black uppercase tracking-widest px-3 py-1.5 rounded-bl-xl shadow-sm">
                     👤 Di: <span className="text-white">{other.owner_name || 'Ignoto'}</span>
                   </div>

                   <div className="flex gap-4 items-center mt-2">
                     {/* Immagine Mascotte */}
                     <div className="w-20 h-20 bg-black/60 rounded-2xl p-2 border border-white/10 relative shrink-0">
                        <img src={otherDef.image} alt={other.nome_mascotte} className="w-full h-full object-contain drop-shadow-md" />
                        <span className="absolute -bottom-2.5 left-1/2 -translate-x-1/2 bg-zinc-800 text-zinc-300 border border-white/10 text-[9px] font-black px-2.5 py-0.5 rounded-full whitespace-nowrap shadow-md">
                          Fase {other.fase || 1}
                        </span>
                     </div>

                     {/* Info & Micro-Barre Statistiche */}
                     <div className="flex-1 min-w-0 pt-1">
                        <h3 className="text-sm font-black text-white truncate leading-tight">{other.nome_mascotte || 'Anonimo'}</h3>
                        <p className="text-[9px] text-amber-500/80 font-bold mb-2.5">{other.exp || 0} XP Totali</p>
                        
                        <div className="space-y-1.5 w-full pr-1">
                           {/* Fame */}
                           <div className="flex items-center gap-2">
                             <span className="text-[8px] font-black text-zinc-500 w-8 text-right">FAME</span>
                             <div className="flex-1 bg-black/90 h-1.5 rounded-full overflow-hidden border border-white/5">
                               <div className={`h-full ${oFame < 20 ? 'bg-red-500' : 'bg-rose-500/80'}`} style={{ width: `${oFame}%` }} />
                             </div>
                           </div>
                           {/* Sete */}
                           <div className="flex items-center gap-2">
                             <span className="text-[8px] font-black text-zinc-500 w-8 text-right">SETE</span>
                             <div className="flex-1 bg-black/90 h-1.5 rounded-full overflow-hidden border border-white/5">
                               <div className={`h-full ${oSete < 20 ? 'bg-red-500' : 'bg-sky-500/80'}`} style={{ width: `${oSete}%` }} />
                             </div>
                           </div>
                           {/* Svago */}
                           <div className="flex items-center gap-2">
                             <span className="text-[8px] font-black text-zinc-500 w-8 text-right">SVAGO</span>
                             <div className="flex-1 bg-black/90 h-1.5 rounded-full overflow-hidden border border-white/5">
                               <div className={`h-full ${oSvago < 20 ? 'bg-red-500' : 'bg-emerald-500/80'}`} style={{ width: `${oSvago}%` }} />
                             </div>
                           </div>
                        </div>
                     </div>
                   </div>

                   {/* Tasto Azione Gigante */}
                   <button 
                     onClick={() => setSelectedRival(other)}
                     className="w-full mt-5 bg-zinc-950 hover:bg-amber-500 hover:text-black border border-amber-500/30 text-amber-400 text-[10px] font-black uppercase tracking-widest py-3 rounded-xl transition-all active:scale-[0.98] flex items-center justify-center gap-2 shadow-sm"
                   >
                     <span className="text-sm">⚔️</span>
                     <span>PIGNE E CAREZZE</span>
                   </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 📜 REGISTRO DELLE INFAMIE */}
      <div className="w-full max-w-md border-t border-white/10 pt-6 mt-6 z-10">
        <h2 className="text-xs font-black uppercase tracking-widest text-red-400 mb-3 flex items-center gap-2">
          <span>📜 Registro delle Infamie</span>
        </h2>
        {infamieLogs.length === 0 ? (
          <p className="text-[10px] text-zinc-500 italic text-center p-3 bg-zinc-900/40 rounded-xl">Nessuno ti ha ancora attaccato o aiutato. Sei trasparente.</p>
        ) : (
          <div className="space-y-2">
            {infamieLogs.map((log) => (
              <div key={log.id} className="bg-zinc-900/90 border border-white/5 p-3 rounded-xl flex items-center justify-between">
                <p className="text-xs text-zinc-300 font-bold">{log.message}</p>
                <span className="text-[8px] text-zinc-500 font-mono ml-2 shrink-0">{new Date(log.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* MODAL INTERAZIONE RIVALE */}
      <AnimatePresence>
        {selectedRival && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
            <motion.div initial={{ scale: 0.85, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.85, opacity: 0 }} className="bg-zinc-900 border-2 border-amber-500/50 rounded-3xl p-6 w-full max-w-sm text-center relative shadow-2xl space-y-4">
              <button onClick={() => setSelectedRival(null)} className="absolute top-4 right-4 text-white font-bold">✕</button>

              <h3 className="text-xl font-black text-white">{selectedRival.nome_mascotte || 'Bestia Ignota'}</h3>
              
              <div className="grid grid-cols-2 gap-2 pt-2">
                <button onClick={() => handleRivalAction(selectedRival, 'pigna')} className="p-3 bg-red-600/20 border border-red-500/40 rounded-xl text-red-300 font-black text-xs flex flex-col items-center gap-1">
                  <span className="text-lg">🎯</span><span>Tira Pigna</span><span className="text-[9px] text-red-400/80">-12% Svago</span>
                </button>
                <button onClick={() => handleRivalAction(selectedRival, 'troll')} className="p-3 bg-purple-600/20 border border-purple-500/40 rounded-xl text-purple-300 font-black text-xs flex flex-col items-center gap-1">
                  <span className="text-lg">👻</span><span>Spaventa</span><span className="text-[9px] text-purple-400/80">-8% Fame/Svago</span>
                </button>
                <button onClick={() => handleRivalAction(selectedRival, 'birra')} className="p-3 bg-sky-600/20 border border-sky-500/40 rounded-xl text-sky-300 font-black text-xs flex flex-col items-center gap-1">
                  <span className="text-lg">🍺</span><span>Offri Birra</span><span className="text-[9px] text-sky-400/80">+25% Sete</span>
                </button>
                <button onClick={() => handleRivalAction(selectedRival, 'cibo')} className="p-3 bg-emerald-600/20 border border-emerald-500/40 rounded-xl text-emerald-300 font-black text-xs flex flex-col items-center gap-1">
                  <span className="text-lg">🥩</span><span>Lancia Cibo</span><span className="text-[9px] text-emerald-400/80">+25% Fame</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}