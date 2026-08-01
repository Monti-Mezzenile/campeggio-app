'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

// ⚙️ FISICA
const GRAVITY = 0.65;
const JUMP_FORCE = 13.5;
const OBSTACLE_SPEED = 5.5;

// 🛤️ ALTEZZA DELLA STRADA STERRATA NEL VIDEO (in pixel)
const GROUND_Y = 56;

// 🛑 OSTACOLI PERICOLOSI
const HAZARDS = [
  { id: 'fuoco', icon: '/icons/fuoco.png', width: 55, height: 65, isCollectible: false },
  { id: 'ceppo', icon: '/icons/ceppo.png', width: 65, height: 50, isCollectible: false },
  { id: 'sasso', icon: '/icons/sasso.png', width: 58, height: 45, isCollectible: false },
];

// 🎁 OGGETTI BONUS
const COLLECTIBLES = [
  { id: 'carota', icon: '/icons/carota.png', width: 45, height: 45, points: 15, isCollectible: true },
  { id: 'birra', icon: '/icons/birra.png', width: 42, height: 48, points: 25, isCollectible: true },
  { id: 'lattina', icon: '/icons/lattina.png', width: 40, height: 42, points: 10, isCollectible: true },
];

interface Entity {
  id: number;
  x: number;
  yOffset: number; // 0 = strada sterrata, >0 = in aria
  width: number;
  height: number;
  icon: string;
  isCollectible: boolean;
  points?: number;
}

interface DustParticle {
  id: number;
  x: number;
  y: number;
  size: number;
}

export default function RunnerPage() {
  const [gameState, setGameState] = useState<'START' | 'PLAYING' | 'GAMEOVER'>('START');
  const [score, setScore] = useState(0); 
  const [itemsCollectedCount, setItemsCollectedCount] = useState(0);
  const [expEarned, setExpEarned] = useState(0);
  const [mascotImg, setMascotImg] = useState('/tamagotchi/fase1_coniglio_piccolo.png');
  const [mascotId, setMascotId] = useState<string | null>(null);
  const [currentExp, setCurrentExp] = useState(0);
  const [loading, setLoading] = useState(true);

  // Statistiche e Classifica Personale Top 5
  const [topScores, setTopScores] = useState<number[]>([]);
  const [totalRuns, setTotalRuns] = useState(0);
  const [totalItemsCollected, setTotalItemsCollected] = useState(0);

  // Fisica Mascotte
  const [mascotY, setMascotY] = useState(0);
  const [entities, setEntities] = useState<Entity[]>([]);
  const [dustList, setDustList] = useState<DustParticle[]>([]);

  // Refs per 60fps
  const mascotYRef = useRef(0);
  const velocityRef = useRef(0);
  const isJumpingRef = useRef(false);
  const entitiesRef = useRef<Entity[]>([]);
  const dustRef = useRef<DustParticle[]>([]);
  const requestRef = useRef<number>(0);
  const lastSpawnTime = useRef<number>(0);
  const scoreRef = useRef(0);
  const itemsCollectedRef = useRef(0);

  // 1️⃣ CARICAMENTO MASCOTTE E STATISTICHE LOCAL STORAGE
  useEffect(() => {
    const fetchMascot = async () => {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        // Carica dati mascotte
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

        // Carica Top 5 Score e Statistiche salvate
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
    if (gameState === 'PLAYING' && !isJumpingRef.current) {
      velocityRef.current = JUMP_FORCE;
      isJumpingRef.current = true;
    }
  };

  const startGame = () => {
    scoreRef.current = 0;
    itemsCollectedRef.current = 0;
    setScore(0);
    setItemsCollectedCount(0);
    setExpEarned(0);
    mascotYRef.current = 0;
    velocityRef.current = 0;
    isJumpingRef.current = false;
    entitiesRef.current = [];
    dustRef.current = [];
    setMascotY(0);
    setEntities([]);
    setDustList([]);
    setGameState('PLAYING');
    lastSpawnTime.current = Date.now();
  };

  useEffect(() => {
    if (gameState !== 'PLAYING') return;

    const updateGame = () => {
      mascotYRef.current += velocityRef.current;
      velocityRef.current -= GRAVITY;

      if (mascotYRef.current <= 0) {
        mascotYRef.current = 0;
        velocityRef.current = 0;
        isJumpingRef.current = false;
      }
      setMascotY(mascotYRef.current);

      // POLVERE SULLA STRADA STERRATA
      if (mascotYRef.current === 0 && Math.random() < 0.35) {
        dustRef.current.push({
          id: Date.now() + Math.random(),
          x: 60 + Math.random() * 15,
          y: Math.random() * 4,
          size: Math.random() * 5 + 3,
        });
      }

      dustRef.current = dustRef.current
        .map((d) => ({ ...d, x: d.x - OBSTACLE_SPEED * 0.8, y: d.y + 0.3, size: d.size * 0.92 }))
        .filter((d) => d.size > 0.8);
      setDustList([...dustRef.current]);

      const now = Date.now();
      if (now - lastSpawnTime.current > Math.random() * 700 + 1200) {
        const isBonus = Math.random() < 0.4;
        
        if (isBonus) {
          const item = COLLECTIBLES[Math.floor(Math.random() * COLLECTIBLES.length)];
          const inAir = Math.random() < 0.5;
          entitiesRef.current.push({
            id: now,
            x: 520,
            yOffset: inAir ? 65 : 0,
            width: item.width,
            height: item.height,
            icon: item.icon,
            isCollectible: true,
            points: item.points
          });
        } else {
          const hazard = HAZARDS[Math.floor(Math.random() * HAZARDS.length)];
          entitiesRef.current.push({
            id: now,
            x: 520,
            yOffset: 0,
            width: hazard.width,
            height: hazard.height,
            icon: hazard.icon,
            isCollectible: false
          });
        }
        lastSpawnTime.current = now;
      }

      const nextEntities: Entity[] = [];
      let gameOverTriggered = false;

      const mascotLeft = 40;
      const mascotRight = 100;
      const mascotBottom = mascotYRef.current;
      const mascotTop = mascotYRef.current + 80;

      for (const ent of entitiesRef.current) {
        ent.x -= OBSTACLE_SPEED;
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
            scoreRef.current += ent.points || 15;
            itemsCollectedRef.current += 1;
            setItemsCollectedCount(itemsCollectedRef.current);
            continue; 
          } else {
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
      
      scoreRef.current += 1;
      setScore(scoreRef.current); 

      requestRef.current = requestAnimationFrame(updateGame);
    };

    requestRef.current = requestAnimationFrame(updateGame);
    return () => cancelAnimationFrame(requestRef.current);
  }, [gameState]);

  const endGame = async () => {
    setGameState('GAMEOVER');
    const finalScore = scoreRef.current;
    const gained = Math.floor(finalScore / 15);
    setExpEarned(gained);

    const { data: { user } } = await supabase.auth.getUser();

    // Aggiorna Top 5 High Scores
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
      const newExpTotal = currentExp + gained;
      setCurrentExp(newExpTotal);
      await supabase.from('mascots').update({
        exp: newExpTotal,
        last_updated_at: new Date().toISOString()
      }).eq('id', mascotId);
    }
  };

  if (loading) {
    return (
      <div className="min-h-dvh bg-zinc-950 flex flex-col items-center justify-center p-4">
        <div className="relative flex items-center justify-center">
          <div className="absolute w-28 h-28 bg-amber-500/20 rounded-full blur-2xl animate-pulse" />
          <img src="/tamagotchi/fase1_coniglio_piccolo.png" alt="Loading..." className="w-24 h-24 object-contain animate-bounce z-10" onError={(e) => { (e.target as HTMLImageElement).src = '/icons/coniglio.png'; }} />
        </div>
      </div>
    );
  }

  const mascotRotation = velocityRef.current > 0 
    ? -15 
    : mascotY > 0 
      ? 10 
      : Math.sin(Date.now() / 60) * 4;

  const personalRecord = topScores.length > 0 ? topScores[0] : 0;

  return (
    <div className="relative flex flex-col items-center min-h-dvh bg-zinc-950 text-white overflow-x-hidden select-none p-3 sm:p-5 pb-12">
      
      {/* SFONDO GENERALE */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <img src="/runner-bg.png" alt="Sfondo" className="w-full h-full object-cover blur-sm scale-105 opacity-60 brightness-75" onError={(e) => { (e.target as HTMLImageElement).src = '/Backgr.png'; }} />
      </div>

      {/* 🧭 BARRA SUPERIORE & STATISTICHE LIVE SOPRA L'ARENA */}
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

        {/* PANNELLO LIVE DELLA CORSA IN CORSO */}
        <div className="grid grid-cols-2 gap-2 bg-zinc-900/80 border border-white/10 backdrop-blur-md p-2.5 rounded-2xl shadow-xl">
          <div className="flex items-center justify-between bg-black/40 px-3 py-1.5 rounded-xl border border-white/5">
            <span className="text-[10px] font-black text-zinc-400 uppercase tracking-wider">SCORE</span>
            <span className="text-base font-black text-amber-400">{score}</span>
          </div>
          <div className="flex items-center justify-between bg-black/40 px-3 py-1.5 rounded-xl border border-white/5">
            <span className="text-[10px] font-black text-zinc-400 uppercase tracking-wider">BONUS</span>
            <span className="text-base font-black text-emerald-400">🎁 {itemsCollectedCount}</span>
          </div>
        </div>
      </div>

      {/* 🎮 ARENA DI GIOCO */}
      <div 
        onClick={handleJump} 
        className="relative w-full max-w-xl h-[380px] sm:h-[400px] rounded-3xl overflow-hidden border-2 border-amber-500/50 shadow-2xl bg-black z-10 shrink-0 cursor-pointer"
      >
        
        {/* VIDEO SFONDO */}
        <video autoPlay loop muted playsInline className="absolute inset-0 w-full h-full object-cover opacity-95 brightness-105 pointer-events-none">
          <source src="/runner-bg.mp4" type="video/mp4" />
        </video>

        {/* SFUMATURA SUPERIORE */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-transparent pointer-events-none" />

        {/* 👥 OMBRA DELLA MASCOTTE */}
        <div 
          className="absolute left-[68px] sm:left-[82px] w-8 h-2.5 bg-black/85 rounded-full blur-[1px] pointer-events-none transition-all z-10"
          style={{
            bottom: `${GROUND_Y - 3}px`,
            transform: `scale(${Math.max(0.15, 1 - mascotY / 130)})`,
            opacity: Math.max(0.2, 1 - mascotY / 100),
          }}
        />

        {/* 💨 PARTICELLE DI POLVERE SULLA STRADA */}
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

        {/* 🐰 MASCOTTE SULLA STRADA */}
        <div 
          className="absolute left-8 w-24 h-24 sm:w-28 sm:h-28 z-20 pointer-events-none" 
          style={{ 
            bottom: `${mascotY + GROUND_Y}px`,
            transform: `rotate(${mascotRotation}deg)`,
            transition: mascotY === 0 ? 'none' : 'transform 0.08s ease-out'
          }}
        >
          <img 
            src={mascotImg} 
            alt="Mascotte" 
            className="w-full h-full object-contain filter drop-shadow-[0_6px_8px_rgba(0,0,0,0.8)]" 
          />
        </div>

        {/* 💣 ENTITÀ SULLA STRADA */}
        {entities.map((ent) => (
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
            <img 
              src={ent.icon} 
              alt="Item" 
              className={`w-full h-full object-contain ${ent.isCollectible ? 'drop-shadow-[0_0_15px_rgba(245,158,11,1)] animate-pulse' : 'drop-shadow-[0_6px_6px_rgba(0,0,0,0.8)]'}`} 
              onError={(e) => { (e.target as HTMLImageElement).src = '/icons/warning.png'; }} 
            />
          </div>
        ))}

        {/* 🏁 START OVERLAY (SOLO DENTRO L'ARENA) */}
        {gameState === 'START' && (
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm z-30 flex flex-col items-center justify-center p-5 text-center">
            <h1 className="text-2xl font-black uppercase text-amber-400 tracking-tight mb-2">Corsa Clandestina</h1>
            <p className="text-xs text-zinc-300 font-medium max-w-xs mb-5 leading-relaxed">
              Meno chiacchiere, più riflessi. Schiva gli ostacoli, arraffa birre e carote.
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

        {/* 💥 GAMEOVER OVERLAY (SOLO DENTRO L'ARENA) */}
        {gameState === 'GAMEOVER' && (
          <div className="absolute inset-0 bg-black/85 backdrop-blur-md z-30 flex flex-col items-center justify-center p-5 text-center animate-in zoom-in-95">
            <h2 className="text-2xl font-black uppercase text-red-500 mb-1">SCHIANTO.</h2>
            <p className="text-xs text-zinc-400 font-medium mb-3">Riflessi da bradipo!</p>
            
            <div className="mb-4 p-3 bg-black/60 rounded-2xl border border-white/10 w-full max-w-xs space-y-1">
              <div className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest">Score Corsa: {score}</div>
              <div className="text-xs text-emerald-400 font-bold">Bonus Raccolti: +{itemsCollectedCount}</div>
              <div className="text-sm font-black text-amber-400 pt-1 border-t border-white/10">+{expEarned} XP GUADAGNATI</div>
            </div>

            <button 
              onClick={(e) => {
                e.stopPropagation();
                startGame();
              }}
              className="bg-red-600 hover:bg-red-500 text-white font-black px-6 py-3 rounded-2xl text-xs uppercase tracking-widest active:scale-95 transition-all shadow-xl border border-red-400 flex items-center gap-2"
            >
              <span>🔄</span>
              <span>GIOCA ANCORA</span>
            </button>
          </div>
        )}

      </div>

      {/* 📊 TABELLA STATISTICHE & TOP 5 SOTTO L'ARENA (SEMPRE VISIBILE E CONSULTABILE) */}
      <div className="w-full max-w-xl z-20 mt-4 space-y-3">
        
        {/* TOP 5 MIGLIORI PUNTEGGI */}
        <div className="bg-zinc-900/90 border border-white/10 backdrop-blur-md p-4 rounded-3xl shadow-xl">
          <div className="flex items-center justify-between border-b border-white/10 pb-2 mb-3">
            <h3 className="text-xs font-black uppercase tracking-widest text-amber-400 flex items-center gap-1.5">
              <span>🏆 Top 5 Migliori Score</span>
            </h3>
            <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300">
              Classifica Personale
            </span>
          </div>

          {topScores.length === 0 ? (
            <p className="text-xs text-zinc-500 italic text-center py-2">
              Nessuna corsa completata. Premi Play per registrare il tuo primo record!
            </p>
          ) : (
            <div className="space-y-1.5">
              {topScores.map((s, idx) => {
                const badges = ['🥇', '🥈', '🥉', '4°', '5°'];
                const colors = [
                  'border-amber-500/40 bg-amber-500/10 text-amber-300',
                  'border-zinc-400/30 bg-zinc-400/10 text-zinc-300',
                  'border-orange-600/30 bg-orange-600/10 text-orange-300',
                  'border-white/5 bg-black/40 text-zinc-400',
                  'border-white/5 bg-black/40 text-zinc-400',
                ];

                return (
                  <div
                    key={idx}
                    className={`flex items-center justify-between px-3 py-2 rounded-xl border text-xs font-black ${colors[idx] || colors[3]}`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-sm">{badges[idx]}</span>
                      <span className="uppercase text-[10px] tracking-wider font-bold">
                        {idx === 0 ? 'Miglior Corsa' : `Posizione ${idx + 1}`}
                      </span>
                    </div>
                    <span className="text-sm font-black tracking-wide">{s} PTS</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* RIEPILOGO STATISTICHE GENERALI */}
        <div className="grid grid-cols-3 gap-2">
          <div className="bg-zinc-900/80 border border-white/10 backdrop-blur-md p-3 rounded-2xl text-center">
            <span className="block text-[9px] font-black uppercase text-zinc-400 tracking-wider mb-0.5">Corse Totali</span>
            <span className="text-base font-black text-white">{totalRuns} 🏃</span>
          </div>

          <div className="bg-zinc-900/80 border border-white/10 backdrop-blur-md p-3 rounded-2xl text-center">
            <span className="block text-[9px] font-black uppercase text-zinc-400 tracking-wider mb-0.5">Bonus Totali</span>
            <span className="text-base font-black text-emerald-400">{totalItemsCollected} 🎁</span>
          </div>

          <div className="bg-zinc-900/80 border border-white/10 backdrop-blur-md p-3 rounded-2xl text-center">
            <span className="block text-[9px] font-black uppercase text-zinc-400 tracking-wider mb-0.5">Max Score</span>
            <span className="text-base font-black text-amber-400">{personalRecord} ⚡</span>
          </div>
        </div>

      </div>

    </div>
  );
}