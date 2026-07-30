'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

// ⚙️ PARAMETRI FISICA CORRETTI
const GRAVITY = 0.65;        // Spinta verso il basso
const JUMP_FORCE = 13.5;     // Spinta verso l'alto (POSITIVA)
const OBSTACLE_SPEED = 5.5;  // Velocità scorrimento

// 🪵 OSTACOLI INGRANDITI (Pixel-Width/Height aumentati)
const OBSTACLE_TYPES = [
  { id: 'fuoco', icon: '/icons/fuoco.png', width: 55, height: 65 },
  { id: 'ceppo', icon: '/icons/ceppo.png', width: 65, height: 50 },
  { id: 'sasso', icon: '/icons/sasso.png', width: 58, height: 45 },
  { id: 'lattina', icon: '/icons/lattina.png', width: 42, height: 45 },
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

  // 🎯 STATI FISICA
  const [mascotY, setMascotY] = useState(0); // 0 = A terra
  const [obstacles, setObstacles] = useState<Obstacle[]>([]);

  // Ref per evitare problemi di closure durante il loop a 60fps
  const mascotYRef = useRef(0);
  const velocityRef = useRef(0);
  const isJumpingRef = useRef(false);
  const obstaclesRef = useRef<Obstacle[]>([]);
  const requestRef = useRef<number>(0);
  const lastObstacleTime = useRef<number>(0);

  // 1️⃣ CARICAMENTO MASCOTTE DA SUPABASE
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

  // 2️⃣ IMPULSO SALTO CORRETTO
  const handleJump = () => {
    if (gameState === 'START') {
      startGame();
      return;
    }
    if (gameState === 'PLAYING' && !isJumpingRef.current) {
      velocityRef.current = JUMP_FORCE; // Spinta verso l'alto
      isJumpingRef.current = true;
    }
  };

  const startGame = () => {
    setScore(0);
    setExpEarned(0);
    mascotYRef.current = 0;
    velocityRef.current = 0;
    isJumpingRef.current = false;
    obstaclesRef.current = [];
    setMascotY(0);
    setObstacles([]);
    setGameState('PLAYING');
    lastObstacleTime.current = Date.now();
  };

  // 3️⃣ GAME LOOP CON REF (Zero lag, zero effetto "volo")
  useEffect(() => {
    if (gameState !== 'PLAYING') return;

    const updateGame = () => {
      // 🏃‍♂️ FISICA ALTEZZA
      mascotYRef.current += velocityRef.current;
      velocityRef.current -= GRAVITY; // La gravità tira GIÙ

      // Impatto con il terreno
      if (mascotYRef.current <= 0) {
        mascotYRef.current = 0;
        velocityRef.current = 0;
        isJumpingRef.current = false;
      }

      setMascotY(mascotYRef.current);

      // 🪵 GENERAZIONE OSTACOLI
      const now = Date.now();
      if (now - lastObstacleTime.current > Math.random() * 800 + 1400) {
        const randomObstacle = OBSTACLE_TYPES[Math.floor(Math.random() * OBSTACLE_TYPES.length)];
        obstaclesRef.current.push({
          id: now,
          x: 380, // Genera subito fuori dal bordo destro
          width: randomObstacle.width,
          height: randomObstacle.height,
          icon: randomObstacle.icon,
        });
        lastObstacleTime.current = now;
      }

      // 💥 MOVIMENTO ED EVENTUALE COLLISIONE
      const updatedObstacles: Obstacle[] = [];
      let collided = false;

      // Area personaggio (Grandezza aumentata)
      const mascotLeft = 40;
      const mascotRight = 100;

      for (const obs of obstaclesRef.current) {
        obs.x -= OBSTACLE_SPEED;

        const obstacleLeft = obs.x;
        const obstacleRight = obs.x + obs.width;

        // Bounding Box Collision
        if (
          obstacleLeft < mascotRight &&
          obstacleRight > mascotLeft &&
          mascotYRef.current < obs.height - 12
        ) {
          collided = true;
          break;
        }

        if (obs.x > -80) {
          updatedObstacles.push(obs);
        }
      }

      if (collided) {
        endGame();
        return;
      }

      obstaclesRef.current = updatedObstacles;
      setObstacles([...updatedObstacles]);
      setScore((prev) => prev + 1);

      requestRef.current = requestAnimationFrame(updateGame);
    };

    requestRef.current = requestAnimationFrame(updateGame);
    return () => cancelAnimationFrame(requestRef.current);
  }, [gameState]);

  // 4️⃣ GAMEOVER & EXP SAVE
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
      className="relative flex flex-col items-center justify-center min-h-dvh bg-zinc-950 text-white overflow-hidden select-none cursor-pointer p-4"
    >
      {/* Header Bar */}
      <div className="w-full max-w-md flex justify-between items-center mb-4 z-20">
        <Link 
          href="/mascotte" 
          onClick={(e) => e.stopPropagation()} 
          className="bg-zinc-900/90 border border-white/20 text-xs font-bold px-4 py-2.5 rounded-2xl hover:bg-zinc-800 transition-colors shadow-lg"
        >
          ← Torna al Campo
        </Link>
        <div className="bg-amber-500/20 border border-amber-500/40 backdrop-blur-md px-4 py-2 rounded-2xl font-black text-amber-400 text-sm tracking-wider shadow-lg">
          PUNTI: {score}
        </div>
      </div>

      {/* 🕹️ BOX DI GIOCO INQUADRATO (Niente sfondi zoomati) */}
      <div className="relative w-full max-w-md h-96 rounded-3xl overflow-hidden border-2 border-amber-500/50 shadow-2xl bg-black">
        
        {/* 🎬 VIDEO DI SFONDO ADATTATO AL RIPUADRO */}
        <video
          autoPlay
          loop
          muted
          playsInline
          className="absolute inset-0 w-full h-full object-cover opacity-75 pointer-events-none"
        >
          <source src="/runner-bg.mp4" type="video/mp4" />
        </video>

        {/* Overlay ombra sul fondo per dare contrasto all'atterraggio */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30 pointer-events-none" />

        {/* 🐰 MASCOTTE INGRANDITA (w-28 h-28) */}
        <div
          className="absolute left-8 w-24 h-24 sm:w-28 sm:h-28 transition-transform duration-75 z-10"
          style={{ bottom: `${mascotY + 12}px` }} // +12px offset dal bordo inferiore
        >
          <img
            src={mascotImg}
            alt="Mascotte"
            className={`w-full h-full object-contain drop-shadow-[0_12px_12px_rgba(0,0,0,0.9)] ${
              isJumpingRef.current ? 'rotate-[-10deg]' : 'animate-bounce'
            }`}
          />
        </div>

        {/* 🪵 OSTACOLI INGRANDITI */}
        {obstacles.map((obs) => (
          <div
            key={obs.id}
            className="absolute bottom-3 flex items-end justify-center pointer-events-none z-10"
            style={{ 
              left: `${obs.x}px`, 
              width: `${obs.width}px`, 
              height: `${obs.height}px` 
            }}
          >
            <img 
              src={obs.icon} 
              alt="Ostacolo" 
              className="w-full h-full object-contain drop-shadow-[0_6px_6px_rgba(0,0,0,0.8)]" 
              onError={(e) => {
                (e.target as HTMLImageElement).src = '/icons/warning.png';
              }}
            />
          </div>
        ))}
      </div>

      {/* 🏁 OVERLAY SCHERMATE STATO */}
      {gameState === 'START' && (
        <div className="absolute z-30 flex flex-col items-center gap-4 bg-zinc-900/95 backdrop-blur-xl p-6 rounded-3xl border border-white/20 text-center max-w-xs shadow-2xl">
          <h1 className="text-2xl font-black uppercase text-amber-400 tracking-tight">Fuga nel Bosco</h1>
          <p className="text-xs text-zinc-300 leading-relaxed">Tocca ovunque per saltare gli ostacoli. Accumula punti per far evolvere la tua mascotte!</p>
          <button className="w-full bg-amber-500 text-black font-black py-3.5 rounded-2xl text-xs uppercase tracking-wider active:scale-95 transition-transform shadow-lg">
            TAP PER INIZIARE
          </button>
        </div>
      )}

      {gameState === 'GAMEOVER' && (
        <div className="absolute z-30 flex flex-col items-center gap-3 bg-zinc-900/95 backdrop-blur-xl p-6 rounded-3xl border border-red-500/40 text-center max-w-xs animate-in zoom-in-95 shadow-2xl">
          <h2 className="text-2xl font-black uppercase text-red-500">Impatto Violento!</h2>
          <p className="text-xs text-zinc-400">La tua mascotte si è schiantata, ma ha portato a casa un po' di esperienza.</p>
          
          <div className="my-2 p-3.5 bg-black/60 rounded-2xl border border-white/10 w-full">
            <div className="text-[10px] text-zinc-400 font-bold uppercase">Punteggio: {score}</div>
            <div className="text-lg font-black text-amber-400">+{expEarned} XP GUADAGNATI</div>
          </div>

          <button onClick={startGame} className="w-full bg-amber-500 text-black font-black py-3.5 rounded-2xl text-xs uppercase tracking-wider active:scale-95 transition-transform shadow-lg">
            RIPROVA SUBITO
          </button>
        </div>
      )}

    </div>
  );
}