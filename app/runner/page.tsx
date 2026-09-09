'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import styles from '../scorribanda/grill.module.css';
import runnerStyles from './runner.module.css';
import { HAZARDS, COLLECTIBLES, getRunnerLighting, getSpriteFrame, getRunnerPace } from '@/lib/runner-visuals';

// ⚙️ FISICA E COSTANTI
const GRAVITY = 0.65;
const JUMP_FORCE = 13.0;
const GROUND_Y = 56;

function RunnerIcon({ icon, label, sprite = false, frame = 0, className = '' }: {
  icon: string; label: string; sprite?: boolean; frame?: number; className?: string;
}) {
  return <span className={`${runnerStyles.icon} ${className}`} role="img" aria-label={label}>
    <img src={icon} alt="" draggable={false} className={sprite ? runnerStyles.spriteSheet : runnerStyles.singleIcon}
      style={sprite ? { transform: `translateX(-${frame * 25}%)` } : undefined} />
  </span>;
}

interface Entity {
  id: number;
  x: number;
  yOffset: number;
  width: number;
  height: number;
  icon: string;
  isCollectible: boolean;
  points?: number;
  type?: 'point' | 'shield' | 'sprint' | 'magnet';
  isSprite?: boolean;
  speedMultiplier?: number;
}

interface DustParticle {
  id: number;
  x: number;
  y: number;
  size: number;
}

interface FloatingText {
  id: number;
  x: number;
  y: number;
  text: string;
  color: string;
  opacity: number;
}

export default function RunnerPage() {
  const [gameState, setGameState] = useState<'START' | 'PLAYING' | 'GAMEOVER'>('START');
  const [score, setScore] = useState(0);
  const [itemsCollectedCount, setItemsCollectedCount] = useState(0);
  const [expEarned, setExpEarned] = useState(0);
  const [mascotImg, setMascotImg] = useState('/tamagotchi/fase1_coniglio_piccolo.png');
  const [mascotId, setMascotId] = useState<string | null>(null);
  const [, setCurrentExp] = useState(0);
  const [loading, setLoading] = useState(true);

  // Stato Power-up attivi per la UI
  const [activeShield, setActiveShield] = useState(false);
  const [sprintTimeLeft, setSprintTimeLeft] = useState(0);
  const [magnetTimeLeft, setMagnetTimeLeft] = useState(0);

  // Juiciness: Screen Shake & Floating Texts
  const [screenShake, setScreenShake] = useState(false);
  const [floatingTexts, setFloatingTexts] = useState<FloatingText[]>([]);
  const [elapsedMs, setElapsedMs] = useState(0);
  const elapsedRef = useRef(0);
  const arenaRef = useRef<HTMLDivElement>(null);
  const lighting = getRunnerLighting(elapsedMs);

  const [guideOpen, setGuideOpen] = useState(true);
  const gameOverRef = useRef<HTMLDialogElement>(null);
  const [ranking, setRanking] = useState<{ user_id: string; nome: string; best_score: number }[]>([]);
  const [rankingStatus, setRankingStatus] = useState('');

  useEffect(() => {
    if (gameState === 'GAMEOVER') gameOverRef.current?.showModal();
    else gameOverRef.current?.close();
  }, [gameState]);

  useEffect(() => {
    if (gameState !== 'GAMEOVER') return;
    let active = true;
    async function loadRanking() {
      setRanking([]);
      setRankingStatus('Caricamento classifica…');
      try {
        const { error: saveError } = await supabase.rpc('submit_runner_score', { p_score: score });
        const entries: { user_id: string; nome: string; best_score: number }[] = [];
        for (let offset = 0; ; offset += 100) {
          const { data, error } = await supabase.rpc('get_runner_leaderboard').range(offset, offset + 99);
          if (!active) return;
          if (error) { setRankingStatus('Classifica non disponibile al momento.'); return; }
          entries.push(...(data ?? []));
          if (!data || data.length < 100) break;
        }
        setRanking(entries);
        setRankingStatus(saveError ? 'Punteggio non salvato nella classifica.' : entries.length ? '' : 'Nessuna corsa registrata.');
      } catch {
        if (active) setRankingStatus('Classifica non disponibile al momento.');
      }
    }
    void loadRanking();
    return () => { active = false; };
  }, [gameState, score]);

  const [topScores, setTopScores] = useState<number[]>([]);
  const [totalRuns, setTotalRuns] = useState(0);
  const [totalItemsCollected, setTotalItemsCollected] = useState(0);

  // Fisica & Stato gioco
  const [mascotY, setMascotY] = useState(0);
  const [mascotRotation, setMascotRotation] = useState(0);
  const [entities, setEntities] = useState<Entity[]>([]);
  const [dustList, setDustList] = useState<DustParticle[]>([]);

  // Refs per Loop di Gioco 60fps
  const mascotYRef = useRef(0);
  const velocityRef = useRef(0);
  const jumpCountRef = useRef(0); // 0 = terra, 1 = primo salto, 2 = doppio salto
  const entitiesRef = useRef<Entity[]>([]);
  const dustRef = useRef<DustParticle[]>([]);
  const floatingTextsRef = useRef<FloatingText[]>([]);
  const requestRef = useRef<number>(0);
  const nextSpawnAtRef = useRef(2100);
  const scoreRef = useRef(0);
  const itemsCollectedRef = useRef(0);
  const lastFrameTimeRef = useRef<number | null>(null);

  // Refs Power-Up
  const shieldActiveRef = useRef(false);
  const sprintEndTimeRef = useRef(0);
  const magnetEndTimeRef = useRef(0);

  const triggerHaptic = (pattern: number | number[]) => {
    if (typeof window !== 'undefined' && 'navigator' in window && window.navigator?.vibrate) {
      window.navigator.vibrate(pattern);
    }
  };

  const triggerScreenShake = () => {
    setScreenShake(true);
    setTimeout(() => setScreenShake(false), 300);
  };

  const addFloatingText = (text: string, x: number, y: number, color: string = '#f59e0b') => {
    const newText: FloatingText = {
      id: Date.now() + Math.random(),
      x,
      y,
      text,
      color,
      opacity: 1,
    };
    floatingTextsRef.current.push(newText);
  };

  // Caricamento dati iniziali
  useEffect(() => {
    const fetchMascot = async () => {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase.from('mascots').select('*').eq('user_id', user.id).maybeSingle();
        if (data) {
          setMascotId(data.id);
          setCurrentExp(data.exp || 0);
          const fase = data.fase || 1;
          const stageImages: Record<number, string> = {
            1: '/tamagotchi/fase1_coniglio_piccolo.png',
            2: '/tamagotchi/fase2_coniglio_medio.png',
            3: '/tamagotchi/fase3_lepre.png',
            4: '/tamagotchi/fase4_lepre_muscolosa.png',
            5: '/tamagotchi/fase5_lepre_centauro.png.png',
            6: '/tamagotchi/fase6_pony.png',
            7: '/tamagotchi/fase7_cavallo_medio.png',
            8: '/tamagotchi/fase8_cavallo_grande.png',
            9: '/tamagotchi/fase9_cavallo_supremo.png',
          };
          setMascotImg(stageImages[fase] || stageImages[1]);
        }

        const savedScores = localStorage.getItem(`runner_top_scores_${user.id}`);
        if (savedScores) setTopScores(JSON.parse(savedScores));

        const savedRuns = localStorage.getItem(`runner_total_runs_${user.id}`);
        if (savedRuns) setTotalRuns(parseInt(savedRuns, 10));

        const savedItems = localStorage.getItem(`runner_total_items_${user.id}`);
        if (savedItems) setTotalItemsCollected(parseInt(savedItems, 10));
      }
      setLoading(false);
    };
    fetchMascot();
  }, []);

  const handleJump = () => {
    if (gameState === 'PLAYING') {
      if (jumpCountRef.current < 2) {
        velocityRef.current = JUMP_FORCE;
        jumpCountRef.current += 1;
        triggerHaptic(20);

        // Effetto polvere al salto
        if (mascotYRef.current === 0) {
          for (let i = 0; i < 4; i++) {
            dustRef.current.push({
              id: Date.now() + Math.random(),
              x: 65 + Math.random() * 20,
              y: Math.random() * 5,
              size: Math.random() * 6 + 4,
            });
          }
        } else {
          // Salto doppio in aria
          addFloatingText('DOPPIO SALTO!', 70, mascotYRef.current + GROUND_Y + 40, '#38bdf8');
        }
      }
    }
  };

  useEffect(() => {
    if (gameState !== 'PLAYING') return;
    const onPointerDown = (event: PointerEvent) => {
      if (!event.isPrimary || event.button !== 0) return;
      if (event.target instanceof Element && event.target.closest('a, button, input, select, textarea, dialog')) return;
      event.preventDefault();
      handleJump();
    };
    document.addEventListener('pointerdown', onPointerDown, { passive: false });
    return () => document.removeEventListener('pointerdown', onPointerDown);
    // Jump uses the current physics refs; reinstall only when entering/leaving a run.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameState]);

  const startGame = () => {
    scoreRef.current = 0;
    elapsedRef.current = 0;
    setElapsedMs(0);
    itemsCollectedRef.current = 0;
    jumpCountRef.current = 0;
    shieldActiveRef.current = false;
    sprintEndTimeRef.current = 0;
    magnetEndTimeRef.current = 0;

    setActiveShield(false);
    setSprintTimeLeft(0);
    setMagnetTimeLeft(0);
    setScore(0);
    setItemsCollectedCount(0);
    setExpEarned(0);
    mascotYRef.current = 0;
    velocityRef.current = 0;
    entitiesRef.current = [];
    dustRef.current = [];
    floatingTextsRef.current = [];
    setMascotY(0);
    setMascotRotation(0);
    setEntities([]);
    setDustList([]);
    setFloatingTexts([]);
    setGameState('PLAYING');
    nextSpawnAtRef.current = 2100;
    lastFrameTimeRef.current = null;
  };

  const endGame = async () => {
    triggerHaptic([100, 50, 100]);
    triggerScreenShake();
    const finalScore = Math.floor(scoreRef.current);
    setScore(finalScore);
    setGameState('GAMEOVER');
    const gained = Math.floor(finalScore / 15);
    setExpEarned(gained);

    const { data: { user } } = await supabase.auth.getUser();

    const updatedScores = [...topScores, finalScore]
      .sort((a, b) => b - a)
      .slice(0, 5);
    setTopScores(updatedScores);

    const newTotalRuns = totalRuns + 1;
    const newTotalItems = totalItemsCollected + itemsCollectedRef.current;
    setTotalRuns(newTotalRuns);
    setTotalItemsCollected(newTotalItems);

    if (user) {
      localStorage.setItem(`runner_top_scores_${user.id}`, JSON.stringify(updatedScores));
      localStorage.setItem(`runner_total_runs_${user.id}`, newTotalRuns.toString());
      localStorage.setItem(`runner_total_items_${user.id}`, newTotalItems.toString());
    }

    if (mascotId && gained > 0) {
      const { data: newExpTotal, error } = await supabase.rpc('increment_mascot_exp', {
        p_delta: gained,
      });
      if (error) console.error('Errore salvataggio XP runner:', error);
      if (!error && newExpTotal !== null) {
        setCurrentExp(newExpTotal);
      }
    }
  };

  useEffect(() => {
    if (gameState !== 'PLAYING') return;

    const updateGame = (timestamp: number) => {
      const previousTimestamp = lastFrameTimeRef.current ?? timestamp - 1000 / 60;
      const frameScale = Math.min((timestamp - previousTimestamp) / (1000 / 60), 3);
      lastFrameTimeRef.current = timestamp;

      elapsedRef.current += frameScale * (1000 / 60);
      setElapsedMs(elapsedRef.current);

      const now = Date.now();
      const isSprintActive = sprintEndTimeRef.current > now;
      const isMagnetActive = magnetEndTimeRef.current > now;

      setSprintTimeLeft(isSprintActive ? Math.ceil((sprintEndTimeRef.current - now) / 1000) : 0);
      setMagnetTimeLeft(isMagnetActive ? Math.ceil((magnetEndTimeRef.current - now) / 1000) : 0);

      // Velocità Progressiva + Moltiplicatore Peperoncino
      const pace = getRunnerPace(elapsedRef.current, isSprintActive);
      const currentSpeed = pace.speed;

      // Fisica Mascotte
      mascotYRef.current += velocityRef.current * frameScale - (GRAVITY * frameScale * (frameScale - 1)) / 2;
      velocityRef.current -= GRAVITY * frameScale;

      if (mascotYRef.current <= 0) {
        mascotYRef.current = 0;
        velocityRef.current = 0;
        jumpCountRef.current = 0;
      }

      setMascotY(mascotYRef.current);
      setMascotRotation(velocityRef.current > 0 ? -15 : mascotYRef.current > 0 ? 10 : Math.sin(timestamp / 60) * 4);

      // Particelle di Polvere
      if (mascotYRef.current === 0 && Math.random() < 0.35) {
        dustRef.current.push({
          id: Date.now() + Math.random(),
          x: 60 + Math.random() * 15,
          y: Math.random() * 4,
          size: Math.random() * 5 + 3,
        });
      }

      dustRef.current = dustRef.current
        .map((d) => ({
          ...d,
          x: d.x - currentSpeed * 0.8 * frameScale,
          y: d.y + 0.3 * frameScale,
          size: d.size * Math.pow(0.92, frameScale),
        }))
        .filter((d) => d.size > 0.8);
      setDustList([...dustRef.current]);

      // Gestione Testi Fluttuanti
      floatingTextsRef.current = floatingTextsRef.current
        .map((ft) => ({
          ...ft,
          y: ft.y + 1.2 * frameScale,
          opacity: ft.opacity - 0.02 * frameScale,
        }))
        .filter((ft) => ft.opacity > 0);
      setFloatingTexts([...floatingTextsRef.current]);

      // Spawn Entità
      if (elapsedRef.current >= nextSpawnAtRef.current) {
        const isBonus = Math.random() < 0.42;

        if (isBonus) {
          const item = COLLECTIBLES[Math.floor(Math.random() * COLLECTIBLES.length)];
          const inAir = Math.random() < 0.5;
          entitiesRef.current.push({
            id: now,
            x: (arenaRef.current?.clientWidth ?? 530) + 16,
            yOffset: inAir ? 65 : 0,
            width: item.width,
            height: item.height,
            icon: item.icon,
            isCollectible: true,
            points: item.points,
            type: item.type,
          });
        } else {
          const hazard = HAZARDS[Math.floor(Math.random() * HAZARDS.length)];
          entitiesRef.current.push({
            id: now,
            x: (arenaRef.current?.clientWidth ?? 530) + 16,
            yOffset: 0,
            width: hazard.width,
            height: hazard.height,
            icon: hazard.icon,
            isCollectible: false,
            isSprite: hazard.isSprite,
            speedMultiplier: hazard.speedMultiplier || 1,
          });
        }
        nextSpawnAtRef.current = elapsedRef.current + pace.spawnDelay + Math.random() * 600;
      }

      // Collisioni & Aggiornamento Entità
      const nextEntities: Entity[] = [];
      let gameOverTriggered = false;

      const mascotLeft = 40;
      const mascotRight = 95;
      const mascotBottom = mascotYRef.current;
      const mascotTop = mascotYRef.current + 80;

      for (const ent of entitiesRef.current) {
        const speedMultiplier = ent.speedMultiplier || 1;

        // Calamita attira i bonus
        if (isMagnetActive && ent.isCollectible && ent.x < 320) {
          ent.x -= (currentSpeed * speedMultiplier + 4) * frameScale;
          if (ent.yOffset > mascotYRef.current) ent.yOffset -= 3 * frameScale;
          else if (ent.yOffset < mascotYRef.current) ent.yOffset += 3 * frameScale;
        } else {
          ent.x -= currentSpeed * speedMultiplier * frameScale;
        }

        const entLeft = ent.x;
        const entRight = ent.x + ent.width;
        const entBottom = ent.yOffset;
        const entTop = ent.yOffset + ent.height;

        const isColliding =
          entLeft < mascotRight &&
          entRight > mascotLeft &&
          mascotBottom < entTop - 10 &&
          mascotTop > entBottom + 10;

        if (isColliding) {
          if (ent.isCollectible) {
            triggerHaptic(30);
            const pts = ent.points || 15;
            scoreRef.current += isSprintActive ? pts * 2 : pts;
            itemsCollectedRef.current += 1;
            setItemsCollectedCount(itemsCollectedRef.current);

            // Effetti Powerup
            if (ent.type === 'shield') {
              shieldActiveRef.current = true;
              setActiveShield(true);
              addFloatingText('SCUDO ATTIVO! 🛡️', ent.x, ent.yOffset + GROUND_Y + 20, '#38bdf8');
            } else if (ent.type === 'sprint') {
              sprintEndTimeRef.current = Date.now() + 5000;
              addFloatingText('SUPER SPRINT! ⚡', ent.x, ent.yOffset + GROUND_Y + 20, '#ef4444');
            } else if (ent.type === 'magnet') {
              magnetEndTimeRef.current = Date.now() + 7000;
              addFloatingText('CALAMITA! 🧲', ent.x, ent.yOffset + GROUND_Y + 20, '#a855f7');
            } else {
              addFloatingText(`+${pts}${isSprintActive ? ' (x2)' : ''}`, ent.x, ent.yOffset + GROUND_Y + 20, '#f59e0b');
            }
            continue;
          } else {
            // Se in Sprint siamo invincibili!
            if (isSprintActive) {
              addFloatingText('TRAVOLTO! 💥', ent.x, ent.yOffset + GROUND_Y + 20, '#f97316');
              triggerHaptic(40);
              continue;
            }

            // Se lo Scudo è attivo, assorbe il colpo
            if (shieldActiveRef.current) {
              shieldActiveRef.current = false;
              setActiveShield(false);
              triggerScreenShake();
              triggerHaptic([50, 50]);
              addFloatingText('SCUDO DISTRUTTO! 🛡️💥', ent.x, ent.yOffset + GROUND_Y + 20, '#38bdf8');
              continue;
            }

            // Game Over
            gameOverTriggered = true;
            break;
          }
        }
        if (ent.x > -80) nextEntities.push(ent);
      }

      if (gameOverTriggered) {
        endGame();
        return;
      }

      entitiesRef.current = nextEntities;
      setEntities([...nextEntities]);

      scoreRef.current += frameScale * (isSprintActive ? 2 : 1);
      setScore(Math.floor(scoreRef.current));

      requestRef.current = requestAnimationFrame(updateGame);
    };

    requestRef.current = requestAnimationFrame(updateGame);
    return () => cancelAnimationFrame(requestRef.current);
  }, [gameState]);

  if (loading) {
    return (
      <div className="min-h-dvh bg-zinc-950 flex flex-col items-center justify-center p-4">
        <div className="relative flex items-center justify-center">
          <div className="absolute w-28 h-28 bg-amber-500/20 rounded-full blur-2xl animate-pulse" />
          <img src="/tamagotchi/fase1_coniglio_piccolo.png" alt="Loading..." className="w-24 h-24 object-contain animate-bounce z-10" onError={(e) => { (e.target as HTMLImageElement).src = '/icons/carota.png'; }} />
        </div>
      </div>
    );
  }

  if (guideOpen) {
    return <main className={`${styles.guide} ${runnerStyles.compactGuide}`}>
      <Link href="/mascotte" className={styles.back}>← Mascotte</Link>
      <header className={styles.guideHeader}>
        <h1>Corsa clandestina</h1>
        <p>Salta. Schiva. Raccogli.</p>
      </header>
      <section className={styles.guidePanel}>
        <h2>1. TOCCA OVUNQUE</h2>
        <p>Un tocco per saltare, un altro in aria per il doppio salto.</p>
      </section>
      <section className={styles.guidePanel}>
        <h2>2. EVITA</h2>
        <div className={styles.ruleGrid}>
          {HAZARDS.map(item => <div key={item.id} className={styles.ruleItem}>
            <RunnerIcon icon={item.icon} label={item.id.replaceAll('_', ' ')} sprite={item.isSprite} className={`${styles.ruleIcon} ${runnerStyles.ruleIcon}`} />
            <div><strong>{item.id.replaceAll('_', ' ')}</strong><p>{item.isSprite ? 'Corre verso di te: saltalo!' : 'Saltalo: un urto ferma la corsa.'}</p></div>
          </div>)}
          <div className={styles.ruleItem}><img src="/runner/notte.png" alt="" className={`${styles.ruleIcon} ${runnerStyles.ruleIcon}`} /><div><strong>Notte</strong><p>La pista si oscura: occhi aperti!</p></div></div>
        </div>
      </section>
      <section className={`${styles.guidePanel} ${styles.goldenPanel}`}>
        <h2>3. RACCOGLI</h2>
        <div className={styles.ruleGrid}>
          {COLLECTIBLES.map(item => <div key={item.id} className={styles.ruleItem}>
            <RunnerIcon icon={item.icon} label={item.id} className={`${styles.ruleIcon} ${runnerStyles.ruleIcon}`} />
            <div><strong>{item.id}</strong><p>{item.type === 'shield' ? 'Ti salva da un urto.' : item.type === 'sprint' ? 'Invincibile e punti ×2 per 5s.' : item.type === 'magnet' ? 'Attira i bonus per 7s.' : `Raccoglila: +${item.points} punti.`}</p></div>
          </div>)}
        </div>
      </section>
      <button className={styles.startButton} onClick={() => { setGuideOpen(false); startGame(); }}>HO CAPITO, SI CORRE!</button>
    </main>;
  }

  const personalRecord = topScores.length > 0 ? topScores[0] : 0;

  return (
    <div style={{ touchAction: gameState === 'PLAYING' ? 'none' : 'auto' }} className="relative flex flex-col items-center min-h-dvh bg-zinc-950 text-white overflow-x-hidden select-none pt-14 sm:pt-8 pt-[calc(3.5rem+env(safe-area-inset-top))] px-3 sm:px-5 pb-28 sm:pb-32">

      {/* SFONDO GENERALE */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <img src="/runner-bg.png" alt="Sfondo" className="w-full h-full object-cover blur-sm scale-105 opacity-60 brightness-75" onError={(e) => { (e.target as HTMLImageElement).src = '/Backgr.png'; }} />
      </div>

      {/* 🧭 BARRA SUPERIORE */}
      <div className="w-full max-w-xl z-20 space-y-2 mb-3">
        <div className="flex justify-between items-center">
          <Link href="/mascotte" className="bg-zinc-900/90 border border-white/20 text-[11px] font-black px-3.5 py-2 rounded-2xl hover:bg-zinc-800 transition-colors shadow-lg backdrop-blur-md uppercase tracking-wider text-zinc-300">
            ← MASCOTTE
          </Link>

          <div className="bg-amber-500/20 border border-amber-500/40 backdrop-blur-md px-3.5 py-1.5 rounded-2xl font-black text-amber-400 text-xs tracking-wider shadow-lg flex items-center gap-1.5">
            <span>🏆 RECORD:</span>
            <span className="text-sm font-black text-white">{personalRecord}</span>
          </div>
        </div>
      </div>

      {/* 🕹️ PANNELLO LIVE SCORE E POWER-UPS */}
      <div className="w-full max-w-xl z-20 mb-2 space-y-1.5">
        <div className="grid grid-cols-2 gap-2 bg-zinc-900/90 border border-white/10 backdrop-blur-md p-2 rounded-2xl shadow-xl">
          <div className="flex items-center justify-between bg-black/40 px-3 py-1 rounded-xl border border-white/5">
            <span className="text-[10px] font-black text-zinc-400 uppercase tracking-wider">SCORE</span>
            <span className="text-base font-black text-amber-400">{score}</span>
          </div>
          <div className="flex items-center justify-between bg-black/40 px-3 py-1 rounded-xl border border-white/5">
            <span className="text-[10px] font-black text-zinc-400 uppercase tracking-wider">BONUS</span>
            <span className="text-base font-black text-emerald-400">🎁 {itemsCollectedCount}</span>
          </div>
        </div>

        <div className={runnerStyles.powerBar} aria-label="Power-up">
          {[
            { icon: '/runner/scudo.png', name: 'Scudo', value: activeShield ? 'Attivo' : '—', active: activeShield },
            { icon: '/runner/peperoncino.png', name: 'Sprint', value: sprintTimeLeft > 0 ? `${sprintTimeLeft}s` : '—', active: sprintTimeLeft > 0 },
            { icon: '/runner/calamita.png', name: 'Calamita', value: magnetTimeLeft > 0 ? `${magnetTimeLeft}s` : '—', active: magnetTimeLeft > 0 },
          ].map(power => <div key={power.name} className={`${runnerStyles.powerSlot} ${power.active ? runnerStyles.powerActive : ''}`}>
            <img src={power.icon} alt="" width={24} height={24} />
            <span>{power.name}</span><strong>{power.value}</strong>
          </div>)}
        </div>
      </div>

      {/* 🎮 ARENA DI GIOCO */}
      <div ref={arenaRef}
        className={`relative w-full max-w-xl h-[360px] sm:h-[400px] rounded-3xl overflow-hidden border-2 ${sprintTimeLeft > 0 ? 'border-red-500 shadow-red-500/40' : 'border-amber-500/50'} shadow-2xl bg-black z-10 shrink-0 cursor-pointer`}
      >

        {screenShake && <div className={runnerStyles.impactFlash} aria-hidden="true" />}
        {/* VIDEO SFONDO */}
        <video autoPlay loop muted playsInline poster="/runner-bg.png"
          className="absolute inset-0 w-full h-full object-cover pointer-events-none">
          <source src="/runner-bg.mp4" type="video/mp4" />
        </video>

        <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-transparent pointer-events-none" />
        <span className={runnerStyles.timeOfDay}>{lighting.darkness >= 0.5 ? '☾' : '☀'} {lighting.label}</span>

        {/* 👥 OMBRA DELLA MASCOTTE */}
        <div
          className="absolute left-[68px] sm:left-[82px] w-8 h-2.5 bg-black/85 rounded-full blur-[1px] pointer-events-none transition-all z-10"
          style={{
            bottom: `${GROUND_Y - 3}px`,
            transform: `scale(${Math.max(0.15, 1 - mascotY / 130)})`,
            opacity: Math.max(0.2, 1 - mascotY / 100),
          }}
        />

        {/* 💨 PARTICELLE DI POLVERE */}
        {dustList.map((d) => (
          <div
            key={d.id}
            className="absolute bg-amber-200/50 rounded-full blur-[1px] pointer-events-none z-10"
            style={{
              left: `${d.x}px`,
              bottom: `${d.y + GROUND_Y}px`,
              width: `${d.size}px`,
              height: `${d.size}px`,
            }}
          />
        ))}

        {/* 💬 TESTI FLUTTUANTI JUICINESS */}
        {floatingTexts.map((ft) => (
          <div
            key={ft.id}
            className="absolute font-black text-xs z-40 pointer-events-none drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)]"
            style={{
              left: `${ft.x}px`,
              bottom: `${ft.y}px`,
              color: ft.color,
              opacity: ft.opacity,
            }}
          >
            {ft.text}
          </div>
        ))}

        {/* 🐰 MASCOTTE SULLA STRADA */}
        <div
          className="absolute left-8 w-24 h-24 sm:w-28 sm:h-28 z-20 pointer-events-none flex items-center justify-center"
          style={{
            bottom: `${mascotY + GROUND_Y}px`,
            transform: `rotate(${mascotRotation}deg)`,
            transition: mascotY === 0 ? 'none' : 'transform 0.08s ease-out'
          }}
        >
          {activeShield && (
            <div className="absolute -inset-3 rounded-full border-2 border-sky-400 bg-sky-400/20 blur-sm animate-pulse z-0" />
          )}
          {sprintTimeLeft > 0 && (
            <div className="absolute -inset-4 rounded-full bg-red-500/30 blur-md animate-ping z-0" />
          )}
          <img
            src={mascotImg}
            alt="Mascotte"
            className="w-full h-full object-contain relative z-10 filter drop-shadow-[0_6px_8px_rgba(0,0,0,0.8)]"
          />
        </div>

        {/* 💣 ENTITÀ SULLA STRADA */}
        {entities.map((ent) => {
          return (
            <div
              key={ent.id}
              className="absolute flex items-end justify-center pointer-events-none z-20 transition-none"
              style={{
                left: `${ent.x}px`,
                bottom: `${ent.yOffset + GROUND_Y}px`,
                width: `${ent.width}px`,
                height: `${ent.height}px`
              }}
            >
              {ent.isCollectible && (
                <div className="absolute -inset-2 rounded-full bg-amber-300/60 blur-md animate-pulse" />
              )}

              <RunnerIcon icon={ent.icon} label={ent.isCollectible ? 'Bonus da raccogliere' : 'Ostacolo'}
                sprite={ent.isSprite} frame={getSpriteFrame(elapsedMs)}
                className={`${runnerStyles.entityIcon} ${ent.isSprite ? runnerStyles.faceLeft : ''}`} />
            </div>
          );
        })}

        {/* 🏁 START OVERLAY */}
        {gameState === 'START' && (
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm z-30 flex flex-col items-center justify-center p-5 text-center">
            <h1 className="text-2xl font-black uppercase text-amber-400 tracking-tight mb-2">Corsa Clandestina</h1>
            <p className="text-xs text-zinc-300 font-medium max-w-xs mb-5 leading-relaxed">
              Fai doppio salto, raccogli super power-up e schiva maialini e sassi rotolanti!
            </p>
            <button
              onClick={(e) => {
                e.stopPropagation();
                startGame();
              }}
              className="bg-amber-500 hover:bg-amber-400 text-black font-black px-6 py-3.5 rounded-2xl text-xs uppercase tracking-widest active:scale-95 transition-all shadow-xl border border-amber-300 flex items-center gap-2"
            >
              <span>▶️</span>
              <span>GIOCA ORA</span>
            </button>
          </div>
        )}

      </div>

      <div className={runnerStyles.touchZone} aria-hidden="true">
        <span className={runnerStyles.touchArrow}>↑ ↑</span>
        <strong>TOCCA OVUNQUE PER SALTARE</strong>
        <span>Due tocchi, doppio salto</span>
      </div>

      <div className={runnerStyles.nightTint} style={{ opacity: lighting.darkness * 0.58 }} aria-hidden="true" />

      <dialog ref={gameOverRef} className={styles.gameOverDialog} aria-labelledby="runner-gameover-title" onCancel={event => event.preventDefault()}>
        <div className="flex flex-col gap-3 p-5 text-center">
          <h2 id="runner-gameover-title" className="text-xl font-black text-rose-500 uppercase">Corsa finita… si riparte?</h2>
          <div className="bg-zinc-900 border border-white/10 p-3 rounded-2xl space-y-2 text-xs">
            <div className="flex justify-between"><span>Punteggio totale</span><strong>{score}</strong></div>
            <div className="flex justify-between"><span>Record personale</span><strong>{Math.max(personalRecord, score)}</strong></div>
            <div className="flex justify-between"><span>Bonus raccolti</span><strong>{itemsCollectedCount}</strong></div>
            <div className="flex justify-between text-amber-400"><span>XP guadagnati</span><strong>+{expEarned} XP</strong></div>
          </div>
          <section className={styles.ranking} aria-label="Classifica di tutti i profili">
            <h3>Classifica corridori</h3>
            {rankingStatus && <p role="status">{rankingStatus}</p>}
            <ol>{ranking.map((entry, index) => <li key={entry.user_id}>
              <span>{index + 1}. {entry.nome || 'Corridore'}</span><strong>{entry.best_score}</strong>
            </li>)}</ol>
          </section>
          <div className="grid grid-cols-2 gap-2">
            <button autoFocus onClick={startGame} className="bg-amber-500 text-black font-black py-3 rounded-2xl text-xs uppercase">Riprova</button>
            <Link href="/mascotte" className="bg-zinc-800 text-white font-black py-3 rounded-2xl text-xs uppercase">Esci</Link>
          </div>
        </div>
      </dialog>
    </div>
  );
}
