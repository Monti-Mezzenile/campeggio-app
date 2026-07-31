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
  const [expEarned, setExpEarned] = useState(0);
  const [mascotImg, setMascotImg] = useState('/tamagotchi/fase1_coniglio_piccolo.png');
  const [mascotId, setMascotId] = useState<string | null>(null);
  const [currentExp, setCurrentExp] = useState(0);
  const [loading, setLoading] = useState(true);

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

  // 1️⃣ CARICAMENTO MASCOTTE
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
      }
      setLoading(false);
    };
    fetchMascot();
  }, []);

  const handleJump = () => {
    if (gameState === 'START') {
      startGame();
      return;
    }
    if (gameState === 'PLAYING' && !isJumpingRef.current) {
      velocityRef.current = JUMP_FORCE;
      isJumpingRef.current = true;
    }
  };

  const startGame = () => {
    scoreRef.current = 0;
    setScore(0);
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
          size: Math.random() * 6 + 4,
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
    const gained = Math.floor(scoreRef.current / 15);
    setExpEarned(gained);

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

  return (
    <div onClick={handleJump} className="relative flex flex-col items-center justify-center min-h-dvh bg-zinc-950 text-white overflow-hidden select-none cursor-pointer p-4">
      
      {/* SFONDO GENERALE */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <img src="/runner-bg.png" alt="Sfondo" className="w-full h-full object-cover blur-sm scale-105 opacity-65 brightness-75" onError={(e) => { (e.target as HTMLImageElement).src = '/Backgr.png'; }} />
      </div>

      {/* BARRA SUPERIORE */}
      <div className="w-full max-w-xl flex justify-between items-center mb-4 z-20">
        <Link href="/mascotte" onClick={(e) => e.stopPropagation()} className="bg-zinc-900/90 border border-white/20 text-xs font-bold px-4 py-2.5 rounded-2xl hover:bg-zinc-800 transition-colors shadow-lg backdrop-blur-md uppercase tracking-wider text-zinc-300">
          ← FUGGI AL CAMPO
        </Link>
        <div className="bg-amber-500/20 border border-amber-500/40 backdrop-blur-md px-5 py-2 rounded-2xl font-black text-amber-400 text-sm tracking-wider shadow-lg flex items-center gap-2">
          <span>SCORE:</span>
          <span className="text-lg">{score}</span>
        </div>
      </div>

      {/* ARENA DI GIOCO */}
      <div className="relative w-full max-w-xl h-[400px] rounded-3xl overflow-hidden border-2 border-amber-500/50 shadow-2xl bg-black z-10">
        
        {/* VIDEO NIDO E LUMINOSO (Senza oscuramenti pesanti) */}
        <video autoPlay loop muted playsInline className="absolute inset-0 w-full h-full object-cover opacity-95 brightness-105 pointer-events-none">
          <source src="/runner-bg.mp4" type="video/mp4" />
        </video>

        {/* SFUMATURA LEGGERA SOLO IN ALTO PER LEGGIBILITÀ */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-transparent pointer-events-none" />

        {/* 👥 OMBRA DINAMICA POSIZIONATA SULLA STRADA STERRATA */}
        <div 
          className="absolute left-10 w-20 h-3 bg-black/80 rounded-full blur-[1.5px] pointer-events-none transition-all z-10"
          style={{
            bottom: `${GROUND_Y - 4}px`,
            transform: `scale(${Math.max(0.2, 1 - mascotY / 140)})`,
            opacity: Math.max(0.15, 1 - mascotY / 110),
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

        {/* 🐰 MASCOTTE ESATTAMENTE SULLA STRADA STERRATA */}
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
      </div>

      {/* START MODAL */}
      {gameState === 'START' && (
        <div className="absolute z-30 flex flex-col items-center gap-4 bg-zinc-900/95 backdrop-blur-xl p-6 rounded-3xl border border-white/20 text-center max-w-xs shadow-2xl">
          <h1 className="text-2xl font-black uppercase text-amber-400 tracking-tight">Corsa Clandestina</h1>
          <p className="text-xs text-zinc-300 leading-relaxed font-medium">
            Meno chiacchiere, più riflessi. Schiva il fuoco e i ceppi, arraffa birre e carote per fare punti. Se ti schianti, peggio per te.
          </p>
          <button className="w-full bg-amber-500 text-black font-black py-3.5 rounded-2xl text-xs uppercase tracking-widest active:scale-95 transition-transform shadow-lg">
            TAPPA E CORRI
          </button>
        </div>
      )}

      {/* GAMEOVER MODAL */}
      {gameState === 'GAMEOVER' && (
        <div className="absolute z-30 flex flex-col items-center gap-3 bg-zinc-900/95 backdrop-blur-xl p-6 rounded-3xl border border-red-500/40 text-center max-w-xs animate-in zoom-in-95 shadow-2xl">
          <h2 className="text-2xl font-black uppercase text-red-500">SCHIANTO.</h2>
          <p className="text-xs text-zinc-400 font-medium">Riflessi da bradipo. Almeno ti sei portato a casa qualche spicciolo di EXP.</p>
          
          <div className="my-2 p-3.5 bg-black/60 rounded-2xl border border-white/10 w-full">
            <div className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest">Score Totale: {score}</div>
            <div className="text-lg font-black text-amber-400 mt-1">+{expEarned} XP GUADAGNATI</div>
          </div>

          <button onClick={startGame} className="w-full bg-red-600 text-white font-black py-3.5 rounded-2xl text-xs uppercase tracking-widest active:scale-95 transition-transform shadow-lg">
            ALZATI E RIPROVA
          </button>
        </div>
      )}

    </div>
  );
}