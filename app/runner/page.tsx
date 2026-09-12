'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import GamePause from '@/components/games/GamePause';
import { useGameMusic } from '@/components/games/useGameMusic';
import { EVOLUTION_STAGES, getStageFromExp } from '@/lib/mascot-evolution';
import RunnerLandscape from '@/components/games/RunnerLandscape';
import { supabase } from '@/lib/supabase';
import styles from '../scorribanda/grill.module.css';
import runnerStyles from './runner.module.css';
import { HAZARDS, COLLECTIBLES, getRunnerLighting, getSpriteFrame, getRunnerPace, laneFloor, clampLane, runnerContact, runnerHorizontalContact, runnerWave, runnerWaveInterval, getMascotRunSheet, getMascotRunFrame } from '@/lib/runner-visuals';

// ⚙️ FISICA E COSTANTI
const GRAVITY = 0.65;
const JUMP_FORCE = 12;

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
  targetLane?: number;
  switchAt?: number;
  laneChangeSpeed?: number;
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
  const [gameState, setGameState] = useState<'START' | 'PLAYING' | 'PAUSED' | 'GAMEOVER'>('START');
  const playMusic = useGameMusic('/audio/giochi/runner.mp3', gameState === 'PLAYING');
  const [score, setScore] = useState(0);
  const [itemsCollectedCount, setItemsCollectedCount] = useState(0);
  const [expEarned, setExpEarned] = useState(0);
  const [mascotImg, setMascotImg] = useState('/tamagotchi/fase1_coniglio_piccolo.png');
  const [mascotPhase, setMascotPhase] = useState(1);
  const [spriteFailed, setSpriteFailed] = useState(false);
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
  const [lane, setLane] = useState(1);
  const laneRef = useRef(1);
  const floorRef = useRef(laneFloor(1));
  const [floor, setFloor] = useState(laneFloor(1));
  const roadRef = useRef(0);
  const playerNode = useRef<HTMLDivElement>(null);
  const entityNodes = useRef(new Map<number, HTMLDivElement>());
  const uiTickRef = useRef(0);
  const waveIndexRef = useRef(0);
  const nextWaveRef = useRef(40000);
  const [waveWarning, setWaveWarning] = useState('');

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
  const jumpCountRef = useRef(0); // One jump; landing resets it.
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
          const fase = getStageFromExp(data.exp || 0);
          setMascotPhase(fase);
          setMascotImg((EVOLUTION_STAGES[fase] || EVOLUTION_STAGES[1]).image);
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
      if (jumpCountRef.current < 1) {
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
        }
      }
    }
  };

  const moveLane = (direction: number) => {
    if (gameState !== 'PLAYING') return;
    laneRef.current = clampLane(laneRef.current + direction);
    setLane(laneRef.current);
  };
  useEffect(() => {
    if (gameState !== 'PLAYING') return;
    const onKey = (event: KeyboardEvent) => {
      if (event.target instanceof Element && event.target.closest('button, a, input, textarea, dialog')) return;
      if (!['ArrowUp', 'ArrowDown', ' '].includes(event.key)) return;
      event.preventDefault();
      if (event.repeat) return;
      if (event.key === ' ') handleJump();
      else moveLane(event.key === 'ArrowUp' ? -1 : 1);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameState]);

  const startGame = () => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    playMusic(true);
    laneRef.current = 1; floorRef.current = laneFloor(1);
    setLane(1); setFloor(laneFloor(1));
    roadRef.current = 0; uiTickRef.current = 0;
    waveIndexRef.current = 0; nextWaveRef.current = 40000; setWaveWarning('');
    endingRef.current = false;
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

  const endingRef = useRef(false);
  const pausedAtRef = useRef(0);
  const pauseGame = () => { pausedAtRef.current = Date.now(); setGameState('PAUSED'); };
  const resumeGame = () => {
    playMusic();
    const duration = Date.now() - pausedAtRef.current;
    sprintEndTimeRef.current += duration;
    magnetEndTimeRef.current += duration;
    lastFrameTimeRef.current = null;
    setGameState('PLAYING');
  };
  const endGame = async (voluntary = false) => {
    if (endingRef.current) return;
    endingRef.current = true;
    if (!voluntary) {
      triggerHaptic([100, 50, 100]);
      triggerScreenShake();
    }
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
      const updateUi = timestamp - uiTickRef.current >= 100;
      if (updateUi) { uiTickRef.current = timestamp; setElapsedMs(elapsedRef.current); }

      const now = Date.now();
      const isSprintActive = sprintEndTimeRef.current > now;
      const isMagnetActive = magnetEndTimeRef.current > now;

      if (updateUi) setSprintTimeLeft(isSprintActive ? Math.ceil((sprintEndTimeRef.current - now) / 1000) : 0);
      if (updateUi) setMagnetTimeLeft(isMagnetActive ? Math.ceil((magnetEndTimeRef.current - now) / 1000) : 0);

      // Velocità Progressiva + Moltiplicatore Peperoncino
      const pace = getRunnerPace(elapsedRef.current, isSprintActive);
      const currentSpeed = pace.speed;
      roadRef.current = roadRef.current + currentSpeed * frameScale;
      const targetFloor = laneFloor(laneRef.current);
      floorRef.current += Math.sign(targetFloor - floorRef.current) * Math.min(Math.abs(targetFloor - floorRef.current), 8 * frameScale);
      if (updateUi) setFloor(floorRef.current);

      // Fisica Mascotte
      // Do not integrate gravity while grounded: frame durations shorter than 1/60 s
      // otherwise produce tiny upward offsets and alternate the landing pose.
      if (mascotYRef.current > 0 || velocityRef.current > 0) {
        mascotYRef.current += velocityRef.current * frameScale - (GRAVITY * frameScale * (frameScale - 1)) / 2;
        velocityRef.current -= GRAVITY * frameScale;
      }

      if (mascotYRef.current <= 0) {
        mascotYRef.current = 0;
        velocityRef.current = 0;
        jumpCountRef.current = 0;
      }

      if (updateUi) setMascotY(mascotYRef.current);
      
      // A gentle two-second sway on the ground; tilt gradually through a jump.
      const rotation = mascotYRef.current > 0
        ? Math.max(-10, Math.min(8, -velocityRef.current * 0.8))
        : Math.sin(elapsedRef.current / 320) * 1.2;
      if (updateUi) setMascotRotation(rotation);
      if (playerNode.current) {
        const bottom = Math.min(mascotYRef.current + floorRef.current, (arenaRef.current?.clientHeight ?? 304) - 92);
        playerNode.current.style.transform = `translate3d(0, ${-bottom}px, 0) rotate(${rotation}deg)`;
        playerNode.current.style.zIndex = String(30 - Math.round(floorRef.current / 10));
      }

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
      if (updateUi) setDustList([...dustRef.current]);

      // Gestione Testi Fluttuanti
      floatingTextsRef.current = floatingTextsRef.current
        .map((ft) => ({
          ...ft,
          y: ft.y + 1.2 * frameScale,
          opacity: ft.opacity - 0.02 * frameScale,
        }))
        .filter((ft) => ft.opacity > 0);
      if (updateUi) setFloatingTexts([...floatingTextsRef.current]);

      // Every grounded object shares the road's displacement. Only mobile hazards overtake it.
      const arenaWidth = arenaRef.current?.clientWidth ?? 530;
      const spawnHazard = (hazardIndex: number, lane: number, offset = 0, targetLane = lane, switchFraction = 0.65, synchronizeSpeed = false) => {
        const hazard = HAZARDS[hazardIndex];
        const switchAt = arenaWidth * switchFraction;
        entitiesRef.current.push({
          ...hazard, id: Math.random(), x: arenaWidth + 24 + offset,
          yOffset: laneFloor(lane), width: hazard.width * 0.96, height: hazard.height * 0.96,
          isCollectible: false, targetLane, switchAt,
          speedMultiplier: synchronizeSpeed ? 1 : (hazard.speedMultiplier ?? 1),
          laneChangeSpeed: Math.max(1.5, Math.abs(laneFloor(targetLane) - laneFloor(lane)) * currentSpeed * 1.15 / Math.max(60, switchAt - 120)),
        });
      };
      const introducing = waveIndexRef.current < 8;
      setWaveWarning(introducing && elapsedRef.current >= nextWaveRef.current - 3000
        ? runnerWave(waveIndexRef.current, elapsedRef.current).label : '');
      if (elapsedRef.current >= nextWaveRef.current) {
        const wave = runnerWave(waveIndexRef.current, elapsedRef.current);
        wave.hazards.forEach(item => spawnHazard(item.hazard, item.lane, item.offset, item.targetLane, item.switchFraction, !introducing));
        wave.pickups?.forEach(pickup => {
          const item = COLLECTIBLES[pickup.item];
          entitiesRef.current.push({ ...item, id: Math.random(), x: arenaWidth + 24 + pickup.offset,
            yOffset: laneFloor(pickup.lane), width: item.width * 0.96, height: item.height * 0.96, isCollectible: true });
        });
        waveIndexRef.current++;
        const waveLength = Math.max(0, ...wave.hazards.map(item => item.offset), ...(wave.pickups ?? []).map(item => item.offset));
        // Give the entire formation time to pass before adding random traffic.
        nextSpawnAtRef.current = elapsedRef.current + Math.max(6000, (arenaWidth + waveLength + 150) / (currentSpeed * 60) * 1000);
        nextWaveRef.current = Math.max(
          elapsedRef.current + runnerWaveInterval(waveIndexRef.current),
          nextSpawnAtRef.current + 16000,
        );
        setWaveWarning('');
      } else if (elapsedRef.current >= nextSpawnAtRef.current && elapsedRef.current < nextWaveRef.current - 6000) {
        const spawnLane = Math.floor(Math.random() * 3);
        if (Math.random() < 0.48) {
          const item = COLLECTIBLES[Math.floor(Math.random() * COLLECTIBLES.length)];
          entitiesRef.current.push({
            ...item, id: Math.random(), x: arenaWidth + 24, yOffset: laneFloor(spawnLane),
            width: item.width * 0.96, height: item.height * 0.96, isCollectible: true,
          });
        } else spawnHazard(Math.floor(Math.random() * HAZARDS.length), spawnLane);
        nextSpawnAtRef.current = elapsedRef.current + pace.spawnDelay + Math.random() * 600;
      }

      // Collisioni & Aggiornamento Entità
      const nextEntities: Entity[] = [];
      let gameOverTriggered = false;

      for (const ent of entitiesRef.current) {
        const speedMultiplier = ent.speedMultiplier || 1;
        const magnetic = isMagnetActive && ent.isCollectible && Math.abs(ent.yOffset - floorRef.current) < 16 && mascotYRef.current <= 2 && ent.x < 320;
        ent.x -= (currentSpeed * speedMultiplier + (magnetic ? 4 : 0)) * frameScale;
        if (ent.targetLane !== undefined && ent.x < (ent.switchAt ?? 0)) {
          const target = laneFloor(ent.targetLane);
          ent.yOffset += Math.sign(target - ent.yOffset) * Math.min(Math.abs(target - ent.yOffset), (ent.laneChangeSpeed ?? 1.5) * frameScale);
        }
        const isColliding = runnerHorizontalContact(ent.x, ent.width, ent.isCollectible) &&
          runnerContact(floorRef.current, mascotYRef.current, ent.yOffset, ent.isCollectible, ent.height);

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
              addFloatingText('SCUDO ATTIVO! 🛡️', ent.x, ent.yOffset + 20, '#38bdf8');
            } else if (ent.type === 'sprint') {
              sprintEndTimeRef.current = Date.now() + 5000;
              addFloatingText('SUPER SPRINT! ⚡', ent.x, ent.yOffset + 20, '#ef4444');
            } else if (ent.type === 'magnet') {
              magnetEndTimeRef.current = Date.now() + 7000;
              addFloatingText('CALAMITA! 🧲', ent.x, ent.yOffset + 20, '#a855f7');
            } else {
              addFloatingText(`+${pts}${isSprintActive ? ' (x2)' : ''}`, ent.x, ent.yOffset + 20, '#f59e0b');
            }
            continue;
          } else {
            // Se in Sprint siamo invincibili!
            if (isSprintActive) {
              addFloatingText('TRAVOLTO! 💥', ent.x, ent.yOffset + 20, '#f97316');
              triggerHaptic(40);
              continue;
            }

            // Se lo Scudo è attivo, assorbe il colpo
            if (shieldActiveRef.current) {
              shieldActiveRef.current = false;
              setActiveShield(false);
              triggerScreenShake();
              triggerHaptic([50, 50]);
              addFloatingText('SCUDO DISTRUTTO! 🛡️💥', ent.x, ent.yOffset + 20, '#38bdf8');
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
      for (const entity of nextEntities) {
        const node = entityNodes.current.get(entity.id);
        if (node) {
          node.style.transform = `translate3d(${entity.x}px, ${-entity.yOffset}px, 0)`;
          node.style.zIndex = String(30 - Math.round(entity.yOffset / 10));
        }
      }
      if (updateUi || nextEntities.length !== entityNodes.current.size) setEntities([...nextEntities]);

      scoreRef.current += frameScale * (isSprintActive ? 2 : 1);
      if (updateUi) setScore(Math.floor(scoreRef.current));

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
        <h2>1. EVITA</h2>
        <div className={styles.ruleGrid}>
          {HAZARDS.map(item => <div key={item.id} className={styles.ruleItem}>
            <RunnerIcon icon={item.icon} label={item.id.replaceAll('_', ' ')} sprite={item.isSprite} className={`${styles.ruleIcon} ${runnerStyles.ruleIcon}`} />
            <div><strong>{item.id.replaceAll('_', ' ')}</strong><p>{item.id === 'maialino' ? 'In branco cambia corsia: segui la freccia!' : item.isSprite ? 'Rotola più veloce della strada.' : 'Cambia corsia o salta: un urto ferma la corsa.'}</p></div>
          </div>)}
          <div className={styles.ruleItem}><img src="/runner/notte.png" alt="" className={`${styles.ruleIcon} ${runnerStyles.ruleIcon}`} /><div><strong>Notte</strong><p>Ogni 45 secondi cambia la luce. Le ondate sono annunciate!</p></div></div>
        </div>
      </section>
      <section className={`${styles.guidePanel} ${styles.goldenPanel}`}>
        <h2>2. RACCOGLI</h2>
        <div className={styles.ruleGrid}>
          {COLLECTIBLES.map(item => <div key={item.id} className={styles.ruleItem}>
            <RunnerIcon icon={item.icon} label={item.id} className={`${styles.ruleIcon} ${runnerStyles.ruleIcon}`} />
            <div><strong>{item.id}</strong><p>{item.type === 'shield' ? 'Ti salva da un urto.' : item.type === 'sprint' ? 'Invincibile e punti ×2 per 5s.' : item.type === 'magnet' ? 'Attira i bonus della tua corsia per 7s.' : `Raccoglila: +${item.points} punti.`}</p></div>
          </div>)}
        </div>
      </section>
      <button className={styles.startButton} onClick={() => { setGuideOpen(false); startGame(); }}>HO CAPITO, SI CORRE!</button>
    </main>;
  }

  const personalRecord = topScores.length > 0 ? topScores[0] : 0;

  return (
    <div style={{ touchAction: gameState === 'PLAYING' ? 'none' : 'auto' }} className={`${styles.gameSafeArea} relative flex flex-col items-center min-h-dvh bg-zinc-950 text-white overflow-x-hidden select-none`}>

      {/* SFONDO GENERALE */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <img src="/runner-bg.png" alt="Sfondo" className="w-full h-full object-cover blur-sm scale-105 opacity-60 brightness-75" onError={(e) => { (e.target as HTMLImageElement).src = '/Backgr.png'; }} />
      </div>

      {/* 🧭 BARRA SUPERIORE */}
      <div className="w-full max-w-xl z-20 space-y-2 mb-3">
        <div className="flex justify-between items-center">
          <Link href="/mascotte" onClick={event => { if (gameState === 'PLAYING') { event.preventDefault(); pauseGame(); } }} className="bg-zinc-900/90 border border-white/20 text-[11px] font-black px-3.5 py-2 rounded-2xl hover:bg-zinc-800 transition-colors shadow-lg backdrop-blur-md uppercase tracking-wider text-zinc-300">
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
        style={{ height: 'clamp(240px, calc(40dvh - 8.8px), 304px)', minHeight: 240, flexShrink: 0 }}
        className={`relative w-full max-w-xl rounded-3xl overflow-hidden border-2 ${sprintTimeLeft > 0 ? 'border-red-500 shadow-red-500/40' : 'border-amber-500/50'} shadow-2xl bg-black z-10 shrink-0 cursor-pointer`}
      >

        {screenShake && <div className={runnerStyles.impactFlash} aria-hidden="true" />}
        <RunnerLandscape distanceRef={roadRef} darkness={lighting.darkness} playing={gameState === 'PLAYING'} />
        <span className={runnerStyles.timeOfDay}>{lighting.darkness >= 0.5 ? '☾' : '☀'} {lighting.label}</span>
        <div className={runnerStyles.waveWarning} role="status">{waveWarning}</div>

        {/* 💨 PARTICELLE DI POLVERE */}
        {dustList.map((d) => (
          <div
            key={d.id}
            className="absolute bg-amber-200/50 rounded-full blur-[1px] pointer-events-none z-10"
            style={{
              left: `${d.x}px`,
              bottom: `${d.y + floor}px`,
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
        <div ref={playerNode}
          className="absolute left-8 w-[91.2px] h-[91.2px] z-20 pointer-events-none flex items-center justify-center"
          style={{
            bottom: 0,
            transform: `translate3d(0, -${mascotY + floor}px, 0) rotate(${mascotRotation}deg)`,
            willChange: 'transform',
            zIndex: 30 - Math.round(floor / 10)
          }}
        >
          {activeShield && (
            <div className="absolute -inset-3 rounded-full border-2 border-sky-400 bg-sky-400/20 blur-sm animate-pulse z-0" />
          )}
          {sprintTimeLeft > 0 && (
            <div className="absolute -inset-4 rounded-full bg-red-500/30 blur-md animate-ping z-0" />
          )}
          {getMascotRunSheet(mascotPhase) && !spriteFailed ? <span className={runnerStyles.mascotSprite}>
            <img src={getMascotRunSheet(mascotPhase)!} alt="La tua cavia in corsa" draggable={false}
              onError={() => setSpriteFailed(true)}
              style={{ transform: `translateX(-${getMascotRunFrame(elapsedMs, mascotY > 2) * 25}%)` }} />
          </span> : <img src={mascotImg} alt="Mascotte" className="w-full h-full object-contain relative z-10" />}

        </div>

        {/* 💣 ENTITÀ SULLA STRADA */}
        {entities.map((ent) => {
          return (
            <div
              key={ent.id}
              ref={node => { if (node) entityNodes.current.set(ent.id, node); else entityNodes.current.delete(ent.id); }}
              className="absolute flex items-end justify-center pointer-events-none z-20 transition-none"
              style={{
                left: 0, bottom: 0,
                transform: `translate3d(${ent.x}px, ${-ent.yOffset}px, 0)`,
                willChange: 'transform',
                width: `${ent.width}px`,
                height: `${ent.height}px`,
                zIndex: 30 - Math.round(ent.yOffset / 10)
              }}
            >
              {ent.isCollectible && (
                <div className="absolute -inset-2 rounded-full bg-amber-300/60 blur-md animate-pulse" />
              )}

              {ent.targetLane !== undefined && Math.abs(laneFloor(ent.targetLane) - ent.yOffset) > 3 && <span className={runnerStyles.pigArrow}>{laneFloor(ent.targetLane) > ent.yOffset ? '↑' : '↓'}</span>}
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
              Tre corsie, un salto. Raccogli a terra e schiva il traffico suino!
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

      <div className={runnerStyles.controls} aria-label="Comandi corsa">
        <div className={runnerStyles.controlLabel}><span>CONTROL DECK</span><span>● PLAYER 01</span></div>
        <div className={runnerStyles.controlLayout}>
          <div className={runnerStyles.directionPad}>
            <button disabled={gameState !== 'PLAYING' || lane === 0} onClick={() => moveLane(-1)} aria-label="Corsia superiore"><span aria-hidden="true">▲</span><small>SU</small></button>
            <button disabled={gameState !== 'PLAYING' || lane === 2} onClick={() => moveLane(1)} aria-label="Corsia inferiore"><span aria-hidden="true">▼</span><small>GIÙ</small></button>
          </div>
          <div className={runnerStyles.actionPad}>
          <button className={runnerStyles.jumpButton} disabled={gameState !== 'PLAYING'} onClick={handleJump}><span aria-hidden="true">↥</span><small>SALTA</small></button>
            {(gameState === 'PLAYING' || gameState === 'PAUSED') && <GamePause buttonClassName={runnerStyles.pauseButton} paused={gameState === 'PAUSED'} onPause={pauseGame} onResume={resumeGame} onFinish={() => { void endGame(true); }} score={score} xp={Math.floor(score / 15)} />}
          </div>
        </div>
      </div>

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