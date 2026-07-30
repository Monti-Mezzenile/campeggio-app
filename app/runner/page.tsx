'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

// ⚙️ FISICA E GIOCO
const GRAVITY = 0.6;
const JUMP_FORCE = -12;
const OBSTACLE_SPEED = 5;

// 🪵 OSTACOLI DIVERSIFICATI
const OBSTACLE_TYPES = [
  { id: 'fuoco', icon: '/icons/fuoco.png', width: 38, height: 44 }, // <-- Sostituito falo.png con fuoco.png
  { id: 'ceppo', icon: '/icons/ceppo.png', width: 46, height: 36 },
  { id: 'sasso', icon: '/icons/sasso.png', width: 40, height: 32 },
  { id: 'lattina', icon: '/icons/lattina.png', width: 28, height: 30 },
];

interface Obstacle {
  id: number;
  x: number;
  width: number;
  height: number;
  icon: string;
}

export default function RunnerPage() {
  const [gameState, setGameState] = useState<'START' | 'PLAYING' | 'GAMEOVER'>('START');
  const [score, setScore] = useState(0);
  const [expEarned, setExpEarned] = useState(0);
  const [mascotImg, setMascotImg] = useState('/tamagotchi/fase1_coniglio_piccolo.png');
  const [mascotId, setMascotId] = useState<string | null>(null);
  const [currentExp, setCurrentExp] = useState(0);

  // Fisica Mascotte
  const [mascotY, setMascotY] = useState(0); 
  const [velocity, setVelocity] = useState(0);
  const [isJumping, setIsJumping] = useState(false);

  // Ostacoli attivi
  const [obstacles, setObstacles] = useState<Obstacle[]>([]);

  const gameRef = useRef<HTMLDivElement>(null);
  const requestRef = useRef<number>(0);
  const lastObstacleTime = useRef<number>(0);

  // 1️⃣ CARICAMENTO MASCOTTE
  useEffect(() => {
    const fetchMascot = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

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
    };
    fetchMascot();
  }, []);

  // 2️⃣ AZIONE SALTO
  const handleJump = () => {
    if (gameState === 'START') {
      startGame();
      return;
    }
    if (gameState === 'PLAYING' && !isJumping) {
      setVelocity(JUMP_FORCE);
      setIsJumping(true);
    }
  };

  const startGame = () => {
    setScore(0);
    setExpEarned(0);
    setMascotY(0);
    setVelocity(0);
    setObstacles([]);
    setIsJumping(false);
    setGameState('PLAYING');
    lastObstacleTime.current = Date.now();
  };

  // 3️⃣ GAME LOOP
  useEffect(() => {
    if (gameState !== 'PLAYING') return;

    const updateGame = () => {
      // Fisica del Salto
      setMascotY((prevY) => {
        const nextY = prevY + velocity;
        if (nextY <= 0) {
          setIsJumping(false);
          return 0;
        }
        return nextY;
      });

      setVelocity((prevVel) => prevVel + GRAVITY);

      // SPAWN CASUALE DI OSTACOLI DIVERSI
      const now = Date.now();
      if (now - lastObstacleTime.current > Math.random() * 800 + 1300) {
        // Scegli un ostacolo a caso dall'array OBSTACLE_TYPES
        const randomObstacle = OBSTACLE_TYPES[Math.floor(Math.random() * OBSTACLE_TYPES.length)];
        
        setObstacles((prev) => [
          ...prev,
          {
            id: now,
            x: 360,
            width: randomObstacle.width,
            height: randomObstacle.height,
            icon: randomObstacle.icon,
          }
        ]);
        lastObstacleTime.current = now;
      }

      // MOVIMENTO E COLLISIONI
      setObstacles((prev) => {
        const nextObstacles: Obstacle[] = [];
        for (const obs of prev) {
          const newX = obs.x - OBSTACLE_SPEED;

          // Bounding Box Mascotte (X: 40px - 90px, Y: mascotY)
          const mascotLeft = 45;
          const mascotRight = 85;
          const obstacleLeft = newX;
          const obstacleRight = newX + obs.width;

          if (
            obstacleLeft < mascotRight &&
            obstacleRight > mascotLeft &&
            mascotY < obs.height - 8
          ) {
            endGame();
            return prev;
          }

          if (newX > -50) {
            nextObstacles.push({ ...obs, x: newX });
          }
        }
        return nextObstacles;
      });

      setScore((prev) => prev + 1);

      requestRef.current = requestAnimationFrame(updateGame);
    };

    requestRef.current = requestAnimationFrame(updateGame);
    return () => cancelAnimationFrame(requestRef.current);
  }, [gameState, velocity, mascotY]);

  // 4️⃣ GAMEOVER & SALVATAGGIO
  const endGame = async () => {
    setGameState('GAMEOVER');
    const gained = Math.floor(score / 10);
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

  return (
    <div 
      onClick={handleJump}
      className="relative flex flex-col items-center justify-center min-h-dvh bg-zinc-950 text-white overflow-hidden select-none cursor-pointer"
    >
      {/* 🎬 VIDEO DI SFONDO */}
      <video
        autoPlay
        loop
        muted
        playsInline
        className="absolute inset-0 w-full h-full object-cover opacity-60 pointer-events-none"
      >
        <source src="/runner-bg.mp4" type="video/mp4" />
      </video>

      <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-transparent to-zinc-950/80 pointer-events-none" />

      {/* Header Info */}
      <div className="absolute top-12 left-0 right-0 px-6 flex justify-between items-center z-20">
        <Link href="/mascotte" onClick={(e) => e.stopPropagation()} className="bg-zinc-900/80 backdrop-blur-md border border-white/20 text-xs font-bold px-4 py-2 rounded-xl hover:bg-zinc-800 transition-colors">
          ← Torna al Campo
        </Link>
        <div className="bg-amber-500/20 border border-amber-500/40 backdrop-blur-md px-4 py-1.5 rounded-xl font-black text-amber-400 text-sm tracking-wider">
          PUNTI: {score}
        </div>
      </div>

      {/* 🕹️ AREA DI CORSA */}
      <div ref={gameRef} className="relative w-full max-w-md h-80 overflow-hidden border-b-4 border-amber-500/60 z-10">
        
        {/* MASCOTTE */}
        <div
          className="absolute left-10 w-16 h-16 transition-transform duration-75"
          style={{ bottom: `${mascotY}px` }}
        >
          <img
            src={mascotImg}
            alt="Mascotte"
            className={`w-full h-full object-contain drop-shadow-[0_10px_10px_rgba(0,0,0,0.8)] ${isJumping ? 'rotate-[-12deg]' : 'animate-bounce'}`}
          />
        </div>

        {/* OSTACOLI VARI (Fuoco, Ceppo, Sasso, Lattina) */}
        {obstacles.map((obs) => (
          <div
            key={obs.id}
            className="absolute bottom-0 flex items-end justify-center pointer-events-none"
            style={{ left: `${obs.x}px`, width: `${obs.width}px`, height: `${obs.height}px` }}
          >
            <img 
              src={obs.icon} 
              alt="Ostacolo" 
              className="w-full h-full object-contain drop-shadow-[0_5px_5px_rgba(0,0,0,0.7)]" 
              onError={(e) => {
                // Fallback nel caso in cui un'icona non fosse ancora caricata nella cartella public
                (e.target as HTMLImageElement).src = '/icons/warning.png';
              }}
            />
          </div>
        ))}
      </div>

      {/* 🏁 POPUP STATO GIOCO */}
      {gameState === 'START' && (
        <div className="absolute z-30 flex flex-col items-center gap-4 bg-zinc-900/90 backdrop-blur-md p-6 rounded-3xl border border-white/20 text-center max-w-xs shadow-2xl">
          <h1 className="text-2xl font-black uppercase text-amber-400 tracking-tight">Fuga nel Bosco</h1>
          <p className="text-xs text-zinc-300">Schiva ceppi, fuoco, sassi e lattine sparate sul percorso! Guadagna EXP per far evolvere il tuo animale.</p>
          <button className="w-full bg-amber-500 text-black font-black py-3 rounded-2xl text-sm uppercase tracking-wider active:scale-95 transition-transform">
            TAP PER CORRERE
          </button>
        </div>
      )}

      {gameState === 'GAMEOVER' && (
        <div className="absolute z-30 flex flex-col items-center gap-3 bg-zinc-900/95 backdrop-blur-md p-6 rounded-3xl border border-red-500/40 text-center max-w-xs animate-in zoom-in-95 shadow-2xl">
          <h2 className="text-2xl font-black uppercase text-red-500">Impatto Violento!</h2>
          <p className="text-xs text-zinc-400">Potevi saltare meglio, ma la mascotte torna comunque a casa con un po' di esperienza.</p>
          
          <div className="my-2 p-3 bg-black/50 rounded-2xl border border-white/10 w-full">
            <div className="text-[10px] text-zinc-400 font-bold uppercase">Punteggio: {score}</div>
            <div className="text-lg font-black text-amber-400">+{expEarned} XP GUADAGNATI</div>
          </div>

          <button onClick={startGame} className="w-full bg-amber-500 text-black font-black py-3 rounded-2xl text-sm uppercase tracking-wider active:scale-95 transition-transform">
            RICOINICIA CORSA
          </button>
        </div>
      )}

    </div>
  );
}