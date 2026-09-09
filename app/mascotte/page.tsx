'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { motion, useAnimation, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/supabase';
import { persistedMascotNeeds } from '@/lib/mascot-needs';
import EvolutionSequence, { prepareEvolutionAudio } from '@/components/mascot/EvolutionSequence';

const DECAY_RATES = { fame: 3.5, sete: 4.5, svago: 3.0 };
const EXP_DECAY_PER_HOUR_AT_ZERO = 2;

// 📈 SOGLIE EXP RI-BILANCIATE
const EXP_THRESHOLDS: Record<number, number> = {
  1: 0,
  2: 800,
  3: 2500,
  4: 6000,
  5: 12000,
  6: 22000,
  7: 38000,
  8: 60000,
  9: 100000,
};

const getStageFromExp = (exp: number): number => {
  for (let stage = 9; stage >= 1; stage--) {
    if (exp >= EXP_THRESHOLDS[stage]) {
      return stage;
    }
  }
  return 1;
};

// ⏱️ Calcola i valori reali attuali considerando il tempo trascorso
const calculateLiveStats = (mascotData: any) => {
  if (!mascotData) return mascotData;
  const now = new Date();
  const lastUpdate = mascotData.last_updated_at ? new Date(mascotData.last_updated_at) : new Date();
  const hoursPassed = Math.max(0, (now.getTime() - lastUpdate.getTime()) / (1000 * 60 * 60));

  let currentFame = mascotData.fame ?? 100;
  let currentSete = mascotData.sete ?? 100;
  let currentSvago = mascotData.svago ?? 100;
  const startingExp = mascotData.exp ?? 0;

  if (hoursPassed > 0.05) {
    currentFame = Math.max(0, currentFame - hoursPassed * DECAY_RATES.fame);
    currentSete = Math.max(0, currentSete - hoursPassed * DECAY_RATES.sete);
    currentSvago = Math.max(0, currentSvago - hoursPassed * DECAY_RATES.svago);
  }

  const hoursUntilFirstZero = Math.min(
    (mascotData.fame ?? 100) / DECAY_RATES.fame,
    (mascotData.sete ?? 100) / DECAY_RATES.sete,
    (mascotData.svago ?? 100) / DECAY_RATES.svago
  );
  const hoursWithAStatAtZero = Math.max(0, hoursPassed - hoursUntilFirstZero);
  const expPenalty = Math.floor(
    hoursWithAStatAtZero * EXP_DECAY_PER_HOUR_AT_ZERO
  );
  const currentExp = Math.max(0, startingExp - expPenalty);

  return {
    ...mascotData,
    fame: currentFame,
    sete: currentSete,
    svago: currentSvago,
    fase: getStageFromExp(currentExp)
  };
};

const EVOLUTION_STAGES: Record<number, { name: string; image: string }> = {
  1: { name: 'Coniglio Piccolo', image: '/tamagotchi/fase1_coniglio_piccolo.png' },
  2: { name: 'Coniglio Medio', image: '/tamagotchi/fase2_coniglio_medio.png' },
  3: { name: 'Lepre', image: '/tamagotchi/fase3_lepre.png' },
  4: { name: 'Lepre Muscolosa', image: '/tamagotchi/fase4_lepre_muscolosa.png' },
  5: { name: 'Lepre Centauro', image: '/tamagotchi/fase5_lepre_centauro.png' },
  6: { name: 'Pony', image: '/tamagotchi/fase6_pony.png' },
  7: { name: 'Cavallo Medio', image: '/tamagotchi/fase7_cavallo_medio.png' },
  8: { name: 'Cavallo Grande', image: '/tamagotchi/fase8_cavallo_grande.png' },
  9: { name: 'Cavallo Supremo', image: '/tamagotchi/fase9_cavallo_supremo.png' },
};

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

export default function MascottePage() {
  const [user, setUser] = useState<any>(null);
  const [mascot, setMascot] = useState({
    id: null as string | null,
    fame: 50,
    sete: 50,
    svago: 50,
    exp: 0,
    fase: 1,
    nome: 'Vittima del Campeggio',
    last_updated_at: new Date().toISOString()
  });
  const [evolution, setEvolution] = useState<{ from: number; to: number; audioContext: AudioContext | null } | null>(null);
  const previousPhaseRef = useRef<number | null>(null);
  const feedingRef = useRef(false);
  const evolutionAudioRef = useRef<AudioContext | null>(null);
  const [otherMascots, setOtherMascots] = useState<any[]>([]);
  const [infamieLogs, setInfamieLogs] = useState<any[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [warningMsg, setWarningMsg] = useState('');
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  
  const [activeTab, setActiveTab] = useState<'mascotte' | 'rivali' | 'infamie'>('mascotte');

  const [isEditingName, setIsEditingName] = useState(false);
  const [tempName, setTempName] = useState('');

  const [speechBubble, setSpeechBubble] = useState<string | null>(null);
  const [particles, setParticles] = useState<Particle[]>([]);
  const [selectedRival, setSelectedRival] = useState<any | null>(null);
  const [rivalActionPending, setRivalActionPending] = useState(false);

  const mascotRef = useRef<HTMLDivElement>(null);
  const mascotControls = useAnimation();
  const mascotBaselineRef = useRef<Parameters<typeof calculateLiveStats>[0]>(null);
  const otherMascotBaselinesRef = useRef<Array<Parameters<typeof calculateLiveStats>[0]>>([]);

  const spawnParticle = (text: string, color = 'text-emerald-400') => {
    const id = Date.now() + Math.random();
    setParticles((prev) => [...prev, { id, text, color }]);
    setTimeout(() => {
      setParticles((prev) => prev.filter((p) => p.id !== id));
    }, 1500); 
  };

  useEffect(() => {
    let realtimeChannel: ReturnType<typeof supabase.channel> | null = null;
    let isMounted = true;

    const loadData = async () => {
      try {
        setLoading(true);

        const { data: { user: currentUser } } = await supabase.auth.getUser();
        if (!currentUser) {
          if (isMounted) setWarningMsg("Ehi fantasma, vedi di loggarti prima di mettere piede in questo campeggio.");
          return;
        }
        if (isMounted) setUser(currentUser);

        const ownerName = currentUser.user_metadata?.full_name || 
                          currentUser.user_metadata?.name || 
                          (currentUser.email ? currentUser.email.split('@')[0] : null) || 
                          'Campeggiatore';

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

        const liveMyMascot = calculateLiveStats(myMascot);
        const updatedMyMascot = { ...liveMyMascot, ...persistedMascotNeeds(liveMyMascot) };

        const persistedAt = new Date().toISOString();
        await supabase.from('mascots').update({
          fame: updatedMyMascot.fame,
          sete: updatedMyMascot.sete,
          svago: updatedMyMascot.svago,
          exp: updatedMyMascot.exp,
          fase: updatedMyMascot.fase,
          owner_name: ownerName,
          last_updated_at: persistedAt
        }).eq('id', myMascot.id);

        if (!isMounted) return;

        const nextMascot = {
          id: myMascot.id, 
          fame: updatedMyMascot.fame, 
          sete: updatedMyMascot.sete, 
          svago: updatedMyMascot.svago, 
          exp: updatedMyMascot.exp, 
          fase: updatedMyMascot.fase, 
          nome: myMascot.nome_mascotte || 'Bestia Anonima',
          last_updated_at: persistedAt
        };
        mascotBaselineRef.current = nextMascot;
        setMascot(nextMascot);
        setTempName(myMascot.nome_mascotte || 'Bestia Anonima');

        const { data: others } = await supabase
          .from('mascots')
          .select('*')
          .neq('user_id', currentUser.id)
          .order('exp', { ascending: false });

        if (others && isMounted) {
          otherMascotBaselinesRef.current = others;
          const formattedOthers = others.map(o => calculateLiveStats(o));
          setOtherMascots(formattedOthers);
        }

        const { data: logs } = await supabase.from('mascot_logs').select('*').eq('receiver_user_id', currentUser.id).order('created_at', { ascending: false }).limit(10);
        if (logs && isMounted) setInfamieLogs(logs);

        if (!isMounted) return;

        const channelName = `mascotte_realtime_${currentUser.id}_${Date.now()}`;
        realtimeChannel = supabase
          .channel(channelName)
          .on(
            'postgres_changes',
            { event: '*', schema: 'public', table: 'mascots' },
            (payload) => {
              if (!isMounted) return;
              const updated = payload.new as any;
              if (!updated) return;

              if (updated.user_id === currentUser.id) {
                mascotBaselineRef.current = updated;
                const liveMy = calculateLiveStats(updated);
                setMascot(prev => ({
                  ...prev,
                  fame: liveMy.fame,
                  sete: liveMy.sete,
                  svago: liveMy.svago,
                  exp: liveMy.exp,
                  fase: liveMy.fase,
                  nome: liveMy.nome_mascotte || prev.nome,
                  last_updated_at: updated.last_updated_at || new Date().toISOString()
                }));
              } else {
                otherMascotBaselinesRef.current = [
                  ...otherMascotBaselinesRef.current.filter((m) => m.id !== updated.id),
                  updated,
                ];
                setOtherMascots(prev => {
                  const exists = prev.some(m => m.id === updated.id);
                  const calculated = calculateLiveStats(updated);
                  if (exists) {
                    return prev.map(m => m.id === updated.id ? calculated : m);
                  }
                  return [...prev, calculated].sort((a, b) => (b.exp || 0) - (a.exp || 0));
                });
              }
            }
          )
          .on(
            'postgres_changes',
            { event: 'INSERT', schema: 'public', table: 'mascot_logs', filter: `receiver_user_id=eq.${currentUser.id}` },
            (payload) => {
              if (!isMounted) return;
              const newLog = payload.new as any;
              if (newLog) {
                setInfamieLogs(prev => [newLog, ...prev].slice(0, 10));
              }
            }
          )
          .subscribe();

      } catch (err) {
        console.error("Errore generico:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadData();

    const interval = setInterval(() => {
      if (!isMounted) return;
      setOtherMascots(otherMascotBaselinesRef.current.map(m => calculateLiveStats(m)));
      setMascot(prev => {
        if (!prev.id || !mascotBaselineRef.current) return prev;
        const updated = calculateLiveStats(mascotBaselineRef.current);
        return {
          ...prev,
          fame: updated.fame,
          sete: updated.sete,
          svago: updated.svago,
          exp: updated.exp,
          fase: updated.fase,
        };
      });
    }, 15000);

    return () => {
      isMounted = false;
      clearInterval(interval);
      if (realtimeChannel) {
        supabase.removeChannel(realtimeChannel);
      }
    };
  }, []);

  useEffect(() => {
    if (loading || !mascot.id) return;
    const previous = previousPhaseRef.current;
    previousPhaseRef.current = mascot.fase;
    if (previous !== null && mascot.fase > previous) {
      setEvolution({ from: previous, to: mascot.fase, audioContext: evolutionAudioRef.current });
      setSpeechBubble(null);
      setToastMsg(null);
    }
    const nextForm = EVOLUTION_STAGES[mascot.fase + 1];
    if (nextForm) {
      const image = new window.Image();
      image.src = nextForm.image;
    }
  }, [loading, mascot.id, mascot.fase]);

  useEffect(() => () => { void evolutionAudioRef.current?.close().catch(() => {}); }, []);

  const finishEvolution = () => {
    void evolutionAudioRef.current?.close().catch(() => {});
    evolutionAudioRef.current = null;
    setEvolution(null);
  };

  const handleSaveName = async () => {
    if (!tempName.trim() || !mascot.id) return;
    const cleanName = tempName.trim();
    setMascot(prev => ({ ...prev, nome: cleanName }));
    setIsEditingName(false);
    await supabase.from('mascots').update({ nome_mascotte: cleanName }).eq('id', mascot.id);
  };

  const applyItemToMascot = async (item: typeof ITEMS[0]) => {
    if (!mascot.id || evolution || feedingRef.current) return;
    const statKey = item.type as 'fame' | 'sete' | 'svago';

    // 🚨 Indigestione/Sbronza scatta solo se la stat è già al 100% pieno
    if (mascot[statKey] >= 100) {
      const penalty = 15;
      const updatedNeeds = persistedMascotNeeds({ ...mascot, svago: mascot.svago - penalty });
      const nowIso = new Date().toISOString();
      feedingRef.current = true;
      try {
        const { error } = await supabase.from('mascots').update({
          ...updatedNeeds, last_updated_at: nowIso,
        }).eq('id', mascot.id);
        if (error) throw error;
      } catch (error) {
        console.error('Errore salvataggio cavia:', error);
        setToastMsg('Non riesco a salvare la cavia. Riprova tra un momento.');
        return;
      } finally {
        feedingRef.current = false;
      }
      const next = { ...mascot, ...updatedNeeds, last_updated_at: nowIso };
      mascotBaselineRef.current = next;
      setMascot(next);
      playAudioEffect('hurt');
      setToastMsg(item.type === 'sete' ? `🥴 Sbronza colossale! (-15% Svago)` : `🤮 Indigestione! (-15% Svago)`);
      spawnParticle(`🤮 TROPPO PIENO!`, 'text-lime-400');
      setTimeout(() => setToastMsg(null), 5000);
      mascotControls.start({ x: [-15, 15, -10, 10, -5, 5, 0], scale: [1, 0.9, 1.05, 1], transition: { duration: 0.6 } });
      return;
    }

    const isCritical = mascot.fame < 20 || mascot.sete < 20 || mascot.svago < 20;
    const expGained = isCritical ? 0 : item.exp;

    const updatedNeeds = persistedMascotNeeds({ ...mascot, [statKey]: mascot[statKey] + item.val });
    const newExp = mascot.exp + expGained;
    const newFase = getStageFromExp(newExp);
    const nowIso = new Date().toISOString();

    const updatedMascot = {
      ...mascot,
      ...updatedNeeds,
      exp: newExp,
      fase: newFase,
      last_updated_at: nowIso
    };

    feedingRef.current = true;
    if (newFase > mascot.fase) {
      void evolutionAudioRef.current?.close().catch(() => {});
      evolutionAudioRef.current = prepareEvolutionAudio();
    }
    try {
      const { error } = await supabase.from('mascots').update({
        ...updatedNeeds,
        exp: newExp,
        fase: newFase,
        last_updated_at: nowIso,
      }).eq('id', mascot.id);
      if (error) throw error;
    } catch (error) {
      console.error('Errore salvataggio cavia:', error);
      void evolutionAudioRef.current?.close().catch(() => {});
      evolutionAudioRef.current = null;
      setToastMsg('Non riesco a salvare la cavia. Riprova tra un momento.');
      return;
    } finally {
      feedingRef.current = false;
    }

    mascotBaselineRef.current = updatedMascot;
    setMascot(updatedMascot);

    if (newFase <= mascot.fase) {
      playAudioEffect('munch');
      setToastMsg(`+${item.val}% ${statKey.toUpperCase()}${expGained > 0 ? ` e +${expGained} XP` : ''}!`);
      spawnParticle(`+${item.val}% ${statKey.toUpperCase()}`, 'text-emerald-400');
      setTimeout(() => setToastMsg(null), 5000);
    }

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
    setTimeout(() => setSpeechBubble(null), 5000);

    mascotControls.start({ scale: [1, 1.18, 0.92, 1], rotate: [0, -12, 12, 0], transition: { duration: 0.3 } });
    spawnParticle('❤️ +1 Affetto', 'text-rose-400');
  };

  const handleRivalAction = async (rival: any, actionType: 'pigna' | 'birra' | 'cibo' | 'troll' | 'gioca') => {
    if (!rival?.id || !user || rivalActionPending) return;
    setRivalActionPending(true);

    try {
      const { data, error } = await supabase.rpc('apply_mascot_action', {
        p_target_mascot_id: rival.id,
        p_action_type: actionType,
      });

      if (error || !data) {
        console.error("Errore azione mascotte:", error);
        setToastMsg("Azione non riuscita. Riprova tra poco.");
        setTimeout(() => setToastMsg(null), 5000);
        return;
      }

      const result = data as {
        id: string;
        fame: number;
        sete: number;
        svago: number;
        last_updated_at: string | null;
      };
      otherMascotBaselinesRef.current = otherMascotBaselinesRef.current.map((m) =>
        m.id === rival.id ? { ...m, ...result } : m
      );

      if (actionType === 'pigna' || actionType === 'troll') playAudioEffect('hurt');
      else if (actionType === 'birra') playAudioEffect('pop');
      else if (actionType === 'cibo') playAudioEffect('munch');
      else playAudioEffect('level');

      setOtherMascots((prev) =>
        prev.map((m) => (m.id === rival.id ? { ...m, ...result } : m))
      );

      setToastMsg(`Azione eseguita su ${rival.nome_mascotte || 'Anonimo'}!`);
      setTimeout(() => setToastMsg(null), 5000);
      setSelectedRival(null);

      try {
        await fetch('/api/push-notify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            targetMascotId: rival.id,
            actionType
          })
        });
      } catch (pushError) {
        console.error("Errore invio push:", pushError);
      }
    } catch (e) {
      console.error("Errore azione mascotte:", e);
      setToastMsg("Azione non riuscita. Riprova tra poco.");
      setTimeout(() => setToastMsg(null), 5000);
    } finally {
      setRivalActionPending(false);
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
  const progressPercent = mascot.fase < 9 && expNeededForNextStage > 0 ? Math.min(100, Math.max(0, (expInCurrentStage / expNeededForNextStage) * 100)) : 100;
  const isCriticalState = mascot.fame < 20 || mascot.sete < 20 || mascot.svago < 20;

  return (
    <div className="flex flex-col items-center min-h-dvh bg-zinc-950 text-white select-none pb-24">
      {evolution && (
        <EvolutionSequence
          from={EVOLUTION_STAGES[evolution.from]}
          to={EVOLUTION_STAGES[evolution.to]}
          audioContext={evolution.audioContext}
          onComplete={finishEvolution}
        />
      )}
      
      {/* TESSERINO DI SOPRAVVIVENZA */}
      <div className="w-full max-w-md px-3 pb-2 pt-[calc(0.75rem+env(safe-area-inset-top))]">
        <div className="relative overflow-hidden rounded-[1.75rem] border border-amber-400/20 bg-zinc-950/90 p-3 shadow-2xl shadow-black/50 backdrop-blur-xl">
          <div className="pointer-events-none absolute -right-8 -top-10 h-28 w-28 rounded-full bg-amber-500/10 blur-2xl" />

          <div className="relative flex items-center gap-3">
            <Link
              href="/"
              aria-label="Torna alla home"
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-xl text-zinc-200 transition active:scale-90"
            >
              ←
            </Link>

            <div className="min-w-0 flex-1">
              <div className="mb-1 flex items-center gap-2">
                <span className="rounded-full border border-amber-400/30 bg-amber-400/10 px-2 py-0.5 text-[8px] font-black uppercase tracking-[0.16em] text-amber-300">
                  Fase {mascot.fase}
                </span>
                <span className="truncate text-[9px] font-bold uppercase tracking-wider text-zinc-500">
                  {currentDef.name}
                </span>
              </div>

              {isEditingName ? (
                <form
                  className="flex items-center gap-1.5"
                  onSubmit={(event) => {
                    event.preventDefault();
                    void handleSaveName();
                  }}
                >
                  <input
                    type="text"
                    value={tempName}
                    onChange={(event) => setTempName(event.target.value)}
                    maxLength={20}
                    aria-label="Nome della mascotte"
                    className="min-w-0 flex-1 rounded-xl border border-amber-500/40 bg-black/40 px-2.5 py-1.5 text-sm font-black text-white outline-none focus:border-amber-400"
                    autoFocus
                  />
                  <button type="submit" className="rounded-xl bg-amber-400 px-2.5 py-1.5 text-[10px] font-black text-zinc-950">
                    SALVA
                  </button>
                </form>
              ) : (
                <button
                  type="button"
                  onClick={() => setIsEditingName(true)}
                  className="group flex max-w-full items-center gap-2 text-left"
                  aria-label={`Modifica il nome ${mascot.nome}`}
                >
                  <span className="truncate text-base font-black tracking-tight text-white group-active:text-amber-300">
                    {mascot.nome}
                  </span>
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-white/5 text-[11px] text-zinc-400" aria-hidden="true">
                    ✎
                  </span>
                </button>
              )}
            </div>

            <div className="shrink-0 text-right">
              <span className="block text-[8px] font-black uppercase tracking-widest text-zinc-500">Potenza</span>
              <span className="text-sm font-black tabular-nums text-amber-300">⚡ {Math.floor(mascot.exp)}</span>
            </div>
          </div>

          <div className="relative mt-3 h-1.5 overflow-hidden rounded-full bg-white/5" aria-label={`Progresso fase ${Math.round(progressPercent)}%`}>
            <div className="h-full rounded-full bg-gradient-to-r from-orange-500 via-amber-400 to-yellow-200 transition-all duration-500" style={{ width: `${progressPercent}%` }} />
          </div>

          <div className="relative mt-3 grid grid-cols-3 gap-2">
          {(['fame', 'sete', 'svago'] as const).map((key) => (
            <div key={key} className={`rounded-xl border px-2 py-1.5 ${mascot[key] <= 0 ? 'border-red-500/50 bg-red-500/10' : 'border-white/5 bg-white/[0.03]'}`}>
              <div className="flex items-center justify-between text-[8px] font-black uppercase tracking-wider text-zinc-400">
                <span>{key === 'fame' ? '🥕 Fame' : key === 'sete' ? '💧 Sete' : '🎮 Svago'}</span>
                <span className={mascot[key] < 20 ? 'text-red-400' : 'text-zinc-200'}>{Math.round(mascot[key])}%</span>
              </div>
              <div className="mt-1 h-1 overflow-hidden rounded-full bg-black/50">
                <div className={`h-full rounded-full transition-all duration-300 ${mascot[key] < 20 ? 'bg-red-500 animate-pulse' : key === 'fame' ? 'bg-rose-500' : key === 'sete' ? 'bg-sky-400' : 'bg-emerald-400'}`} style={{ width: `${Math.min(100, Math.max(0, mascot[key]))}%` }} />
              </div>
            </div>
          ))}
          </div>

          {(mascot.fame <= 0 || mascot.sete <= 0 || mascot.svago <= 0) && (
            <p className="relative mt-2 text-center text-[9px] font-black uppercase tracking-wider text-red-400">
              Stato d&apos;abbandono · −{EXP_DECAY_PER_HOUR_AT_ZERO} XP ogni ora
            </p>
          )}
        </div>
      </div>

      {/* TOAST MESSAGGI */}
      {toastMsg && (
        <div className="w-full max-w-md mt-2 px-4 z-30">
          <div className="bg-amber-500/10 border border-amber-500/40 text-amber-300 text-xs font-black text-center py-2 px-3 rounded-xl shadow-lg">
            {toastMsg}
          </div>
        </div>
      )}

      {/* 🧭 SELETTORE TAB */}
      <div className="w-full max-w-md px-4 mt-3 z-10">
        <div className="grid grid-cols-3 gap-1 bg-zinc-900/90 p-1 rounded-2xl border border-white/10 text-center">
          <button 
            onClick={() => setActiveTab('mascotte')}
            className={`py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all ${activeTab === 'mascotte' ? 'bg-amber-500 text-black shadow-md' : 'text-zinc-400 hover:text-white'}`}
          >
            <span className="whitespace-nowrap">🐾 CAVIA</span>
          </button>
          <button 
            onClick={() => setActiveTab('rivali')}
            className={`py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all ${activeTab === 'rivali' ? 'bg-amber-500 text-black shadow-md' : 'text-zinc-400 hover:text-white'}`}
          >
            <span className="whitespace-nowrap">⚔️ Feccia ({otherMascots.length})</span>
          </button>
          <button 
            onClick={() => setActiveTab('infamie')}
            className={`py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all ${activeTab === 'infamie' ? 'bg-amber-500 text-black shadow-md' : 'text-zinc-400 hover:text-white'}`}
          >
            <span className="whitespace-nowrap">📜 Infamie</span>
          </button>
        </div>
      </div>

      {/* TAB 1: MIA CAVIA & AZIONI */}
      {activeTab === 'mascotte' && (
        <div className="w-full max-w-md px-4 mt-3 space-y-4 z-10">
          
          {/* SCENA VISIVA CAVIA */}
          <div className="relative w-full rounded-3xl overflow-hidden border border-white/10 flex items-center justify-center min-h-[260px] shadow-2xl">
            <img src="/Backgr.png" alt="Camping" className="absolute inset-0 w-full h-full object-cover pointer-events-none" />
            
            <AnimatePresence>
              {speechBubble && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="absolute top-3 z-30 bg-white text-zinc-950 px-3 py-1.5 rounded-xl font-black text-[11px] text-center border-2 border-amber-400">
                  {speechBubble}
                </motion.div>
              )}
            </AnimatePresence>

            <AnimatePresence>
              {particles.map((p) => (
                <motion.div key={p.id} initial={{ opacity: 1, y: 20 }} animate={{ opacity: 0, y: -60 }} transition={{ duration: 1 }} className={`absolute z-30 font-black text-xs ${p.color}`}>
                  {p.text}
                </motion.div>
              ))}
            </AnimatePresence>

            <motion.div ref={mascotRef} animate={mascotControls} onClick={handleMascotTap} className="relative w-48 h-48 flex items-center justify-center cursor-pointer z-10">
              <motion.img 
                animate={{ y: isCriticalState ? [0, -2, 2, 0] : [0, -6, 0] }}
                transition={{ repeat: Infinity, duration: isCriticalState ? 0.25 : 3 }}
                src={currentDef.image} alt={currentDef.name} className={`w-full h-full object-contain pointer-events-none ${isCriticalState ? 'grayscale opacity-70' : ''}`} 
              />
            </motion.div>
          </div>

          {/* MINIGIOCHI */}
          <section aria-labelledby="minigiochi-title" className="bg-zinc-900/80 backdrop-blur-md border border-white/10 p-3.5 rounded-3xl">
            <h2 id="minigiochi-title" className="text-[10px] font-black uppercase tracking-widest text-amber-400 mb-3 text-center">
              Aumenta gli XP con i minigiochi
            </h2>
            <div className="grid grid-cols-3 gap-2">
              <Link href="/scorribanda" className="min-w-0 flex flex-col items-center justify-center gap-2 py-3 px-1 rounded-2xl border border-white/10 bg-zinc-800/80 hover:bg-zinc-700/80 active:scale-[0.98] transition-colors focus-visible:outline-2 focus-visible:outline-amber-400">
                <span className="h-12 flex items-center justify-center" aria-hidden="true">
                  <img src="/grigliata/bistecca_cotta.png" alt="" className="w-12 h-12 object-contain" />
                </span>
                <span className="text-[10px] font-black text-zinc-200">Grigliata</span>
              </Link>
              <Link href="/allenamento" className="min-w-0 flex flex-col items-center justify-center gap-2 py-3 px-1 rounded-2xl border border-white/10 bg-zinc-800/80 hover:bg-zinc-700/80 active:scale-[0.98] transition-colors focus-visible:outline-2 focus-visible:outline-amber-400">
                <span className="h-12 flex items-center justify-center" aria-hidden="true">
                  <img src="/merge/merge_mela.png" alt="" className="w-12 h-12 object-contain" />
                </span>
                <span className="text-[10px] font-black text-zinc-200">Merge</span>
              </Link>
              <Link href="/runner" className="min-w-0 flex flex-col items-center justify-center gap-2 py-3 px-1 rounded-2xl border border-white/10 bg-zinc-800/80 hover:bg-zinc-700/80 active:scale-[0.98] transition-colors focus-visible:outline-2 focus-visible:outline-amber-400">
                <span className="h-12 flex items-center justify-center" aria-hidden="true">
                  <span className="relative block w-[62.4px] h-[41.6px] shrink-0">
                    <img src="/icons/cavallo-run.png" alt="" className="absolute top-0 left-0 w-[41.6px] h-[36.4px] object-contain" />
                    <img src="/icons/coniglio-run.png" alt="" className="absolute bottom-0 right-0 z-10 w-[36.4px] h-[31.2px] object-contain" />
                  </span>
                </span>
                <span className="text-[10px] font-black text-zinc-200">Corsa</span>
              </Link>
            </div>
          </section>

          {/* INVENTARIO */}
          <div className="bg-zinc-900/80 backdrop-blur-md border border-white/10 p-3.5 rounded-3xl">
            <h2 className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-2.5 text-center">Spazzatura Utile (Trascina o Clicca)</h2>
            <div className="grid grid-cols-3 gap-2.5">
              {ITEMS.map((item) => (
                <motion.div
                  key={item.id} drag dragSnapToOrigin={true} onDragEnd={(e: any, info: any) => handleDragEnd(e, info, item)} onClick={() => applyItemToMascot(item)}
                  className="flex flex-col items-center justify-center p-2.5 rounded-2xl border bg-zinc-800/80 border-white/10 cursor-pointer active:bg-zinc-700/80"
                >
                  <img src={item.icon} alt={item.label} className="w-7 h-7 pointer-events-none mb-1" />
                  <span className="text-[9px] font-black text-zinc-300">{item.label}</span>
                  <span className="text-[8px] text-amber-500 font-black">+{item.val}%</span>
                </motion.div>
              ))}
            </div>
          </div>

        </div>
      )}

      {/* TAB 2: FECCIA DEL CAMPEGGIO (RIVALI) */}
      {activeTab === 'rivali' && (
        <div className="w-full max-w-md px-4 mt-3 space-y-3 z-10">
          {otherMascots.length === 0 ? (
            <div className="text-center p-6 bg-zinc-900/50 rounded-2xl border border-white/5">
              <p className="text-xs text-zinc-500 font-medium">Nessun rivale trovato al momento.</p>
            </div>
          ) : (
            otherMascots.map((other, idx) => {
              const otherDef = EVOLUTION_STAGES[other.fase] || EVOLUTION_STAGES[1];
              const oFame = Math.min(100, Math.max(0, other.fame ?? 50));
              const oSete = Math.min(100, Math.max(0, other.sete ?? 50));
              const oSvago = Math.min(100, Math.max(0, other.svago ?? 50));
              
              const displayOwner = (!other.owner_name || other.owner_name === 'Ignoto')
                ? 'Allenatore Anonimo'
                : other.owner_name;

              return (
                <div key={other.id || idx} className="bg-zinc-900/90 border border-white/10 rounded-3xl p-3.5 shadow-lg relative overflow-hidden flex flex-col">
                  
                  <div className="absolute top-0 right-0 bg-zinc-950 text-amber-500 border-b border-l border-white/10 text-[8px] font-black uppercase tracking-widest px-2.5 py-1 rounded-bl-xl">
                    👤 {displayOwner}
                  </div>

                  <div className="flex gap-3 items-center mt-1">
                    <div className="w-16 h-16 bg-black/60 rounded-2xl p-1.5 border border-white/10 relative shrink-0">
                      <img src={otherDef.image} alt={other.nome_mascotte} className="w-full h-full object-contain" />
                      <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-zinc-800 text-zinc-300 border border-white/10 text-[8px] font-black px-2 py-0.2 rounded-full whitespace-nowrap">
                        Fase {other.fase || 1}
                      </span>
                    </div>

                    <div className="flex-1 min-w-0">
                      <h3 className="text-xs font-black text-white truncate">{other.nome_mascotte || 'Anonimo'}</h3>
                      <p className="text-[8px] text-amber-500 font-bold mb-1.5">{other.exp || 0} XP Totali</p>
                      
                      <div className="space-y-1 w-full">
                        <div className="flex items-center gap-1.5 text-[7px] font-black text-zinc-400">
                          <span className="w-7">FAME</span>
                          <div className="flex-1 bg-black/80 h-1.5 rounded-full overflow-hidden">
                            <div className={`h-full ${oFame < 20 ? 'bg-red-500' : 'bg-rose-500'}`} style={{ width: `${Math.round(oFame)}%` }} />
                          </div>
                          <span className="text-[8px] font-bold text-zinc-300 w-6 text-right">{Math.round(oFame)}%</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-[7px] font-black text-zinc-400">
                          <span className="w-7">SETE</span>
                          <div className="flex-1 bg-black/80 h-1.5 rounded-full overflow-hidden">
                            <div className={`h-full ${oSete < 20 ? 'bg-red-500' : 'bg-sky-500'}`} style={{ width: `${Math.round(oSete)}%` }} />
                          </div>
                          <span className="text-[8px] font-bold text-zinc-300 w-6 text-right">{Math.round(oSete)}%</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-[7px] font-black text-zinc-400">
                          <span className="w-7">SVAGO</span>
                          <div className="flex-1 bg-black/80 h-1.5 rounded-full overflow-hidden">
                            <div className={`h-full ${oSvago < 20 ? 'bg-red-500' : 'bg-emerald-500'}`} style={{ width: `${Math.round(oSvago)}%` }} />
                          </div>
                          <span className="text-[8px] font-bold text-zinc-300 w-6 text-right">{Math.round(oSvago)}%</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <button 
                    onClick={() => setSelectedRival(other)}
                    className="w-full mt-3 bg-zinc-950 hover:bg-amber-500 hover:text-black border border-amber-500/30 text-amber-400 text-[9px] font-black uppercase tracking-widest py-2 rounded-xl transition-all active:scale-[0.98] flex items-center justify-center gap-1.5"
                  >
                    <span>⚔️</span><span>PIGNE E CAREZZE</span>
                  </button>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* TAB 3: REGISTRO DELLE INFAMIE */}
      {activeTab === 'infamie' && (
        <div className="w-full max-w-md px-4 mt-3 space-y-2 z-10">
          <h2 className="text-xs font-black uppercase tracking-widest text-red-400 mb-2 flex items-center gap-1.5">
            <span>📜 Registro delle Infamie Subite</span>
          </h2>
          {infamieLogs.length === 0 ? (
            <p className="text-[10px] text-zinc-500 italic text-center p-4 bg-zinc-900/40 rounded-2xl border border-white/5"> Nessun attacco registrato di recente. Tutti ti temono.</p>
          ) : (
            infamieLogs.map((log) => (
              <div key={log.id} className="bg-zinc-900/90 border border-white/5 p-3 rounded-2xl flex items-center justify-between">
                <p className="text-xs text-zinc-300 font-bold">{log.message}</p>
                <span className="text-[8px] text-zinc-500 font-mono ml-2 shrink-0">{new Date(log.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
              </div>
            ))
          )}
        </div>
      )}

      {/* MODAL INTERAZIONE RIVALE */}
      <AnimatePresence>
        {selectedRival && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
            <motion.div initial={{ scale: 0.85, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.85, opacity: 0 }} className="bg-zinc-900 border-2 border-amber-500/50 rounded-3xl p-5 w-full max-w-sm text-center relative shadow-2xl space-y-4">
              <button onClick={() => setSelectedRival(null)} className="absolute top-4 right-4 text-white font-bold text-sm">✕</button>

              <h3 className="text-lg font-black text-white">{selectedRival.nome_mascotte || 'Bestia Ignota'}</h3>
              
              <div className="grid grid-cols-2 gap-2 pt-2">
                <button disabled={rivalActionPending} onClick={() => handleRivalAction(selectedRival, 'pigna')} className="p-3 bg-red-600/20 border border-red-500/40 rounded-2xl text-red-300 font-black text-xs flex flex-col items-center gap-1 active:scale-95 disabled:opacity-50">
                  <span className="text-lg">🎯</span><span className="whitespace-nowrap">Tira Pigna</span><span className="whitespace-nowrap text-[8px] text-red-400/80">-12% Svago</span>
                </button>
                <button disabled={rivalActionPending} onClick={() => handleRivalAction(selectedRival, 'troll')} className="p-3 bg-purple-600/20 border border-purple-500/40 rounded-2xl text-purple-300 font-black text-xs flex flex-col items-center gap-1 active:scale-95 disabled:opacity-50">
                  <span className="text-lg">👻</span><span className="whitespace-nowrap">Spaventa</span><span className="whitespace-nowrap text-[8px] text-purple-400/80">-8% Fame/Svago</span>
                </button>
                <button disabled={rivalActionPending} onClick={() => handleRivalAction(selectedRival, 'birra')} className="p-3 bg-sky-600/20 border border-sky-500/40 rounded-2xl text-sky-300 font-black text-xs flex flex-col items-center gap-1 active:scale-95 disabled:opacity-50">
                  <span className="text-lg">🍺</span><span className="whitespace-nowrap">Offri Birra</span><span className="whitespace-nowrap text-[8px] text-sky-400/80">+25% Sete</span>
                </button>
                <button disabled={rivalActionPending} onClick={() => handleRivalAction(selectedRival, 'cibo')} className="p-3 bg-emerald-600/20 border border-emerald-500/40 rounded-2xl text-emerald-300 font-black text-xs flex flex-col items-center gap-1 active:scale-95 disabled:opacity-50">
                  <span className="text-lg">🥩</span><span className="whitespace-nowrap">Lancia Cibo</span><span className="whitespace-nowrap text-[8px] text-emerald-400/80">+25% Fame</span>
                </button>
                <button disabled={rivalActionPending} onClick={() => handleRivalAction(selectedRival, 'gioca')} className="col-span-2 p-3 bg-amber-600/20 border border-amber-500/40 rounded-2xl text-amber-300 font-black text-xs flex flex-col items-center gap-1 active:scale-95 disabled:opacity-50">
                  <span className="text-lg">🎾</span><span className="whitespace-nowrap">{rivalActionPending ? 'Invio...' : 'Gioca Insieme'}</span><span className="whitespace-nowrap text-[8px] text-amber-400/80">+25% Svago</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
