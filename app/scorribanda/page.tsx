'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

interface SpawnItem {
  id: number;
  spotIndex: number;
  type: 'cibo' | 'birra' | 'guardia';
  icon: string;
  points: number;
}

const ITEMS_POOL = [
  { type: 'cibo' as const, icon: '/icons/cosciotto.png', points: 20 },
  { type: 'birra' as const, icon: '/icons/birra.png', points: 30 },
  { type: 'cibo' as const, icon: '/icons/carota.png', points: 15 },
  { type: 'guardia' as const, icon: '/icons/fuoco.png', points: -50 },
];

interface GameStats {
  bestScore: number;
  totalRaids: number;
  totalItemsStolen: number;
}

export default function ScorribandaPage() {
  const [gameState, setGameState] = useState<'START' | 'PLAYING' | 'GAMEOVER'>('START');
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(30);
  const [lives, setLives] = useState(3);
  const [activeItems, setActiveItems] = useState<(SpawnItem | null)[]>([null, null, null, null, null, null]);
  const [expEarned, setExpEarned] = useState(0);
  const [hitFeedback, setHitFeedback] = useState<string | null>(null);

  // Statistiche salvate
  const [stats, setStats] = useState<GameStats>({
    bestScore: 0,
    totalRaids: 0,
    totalItemsStolen: 0,
  });

  const [mascotId, setMascotId] = useState<string | null>(null);
  const [currentExp, setCurrentExp] = useState(0);
  const [loading, setLoading] = useState(true);

  const scoreRef = useRef(0);
  const livesRef = useRef(3);
  const itemsStolenRef = useRef(0);

  // Caricamento Mascotte e Statistiche Locali
  useEffect(() => {
    const initData = async () => {
      setLoading(true);

      // Carica statistiche da localStorage
      const savedStats = localStorage.getItem('scorribanda_stats');
      if (savedStats) {
        try {
          setStats(JSON.parse(savedStats));
        } catch (e) {
          console.error("Errore caricamento stats", e);
        }
      }

      // Carica Mascotte
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase.from('mascots').select('*').eq('user_id', user.id).maybeSingle();
        if (data) {
          setMascotId(data.id);
          setCurrentExp(data.exp || 0);
        }
      }
      setLoading(false);
    };

    initData();
  }, []);

  const startGame = () => {
    setScore(0);
    setTimeLeft(30);
    setLives(3);
    scoreRef.current = 0;
    livesRef.current = 3;
    itemsStolenRef.current = 0;
    setActiveItems([null, null, null, null, null, null]);
    setGameState('PLAYING');
  };

  // Timer di gioco (30s)
  useEffect(() => {
    if (gameState !== 'PLAYING') return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          endGame();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [gameState]);

  // Spawner Oggetti
  useEffect(() => {
    if (gameState !== 'PLAYING') return;

    const spawner = setInterval(() => {
      const spotIndex = Math.floor(Math.random() * 6);
      const randomItem = ITEMS_POOL[Math.floor(Math.random() * ITEMS_POOL.length)];

      setActiveItems((prev) => {
        const copy = [...prev];
        copy[spotIndex] = {
          id: Date.now(),
          spotIndex,
          type: randomItem.type,
          icon: randomItem.icon,
          points: randomItem.points,
        };
        return copy;
      });

      // Sparisci dopo 1.1s
      setTimeout(() => {
        setActiveItems((prev) => {
          const copy = [...prev];
          if (copy[spotIndex]?.spotIndex === spotIndex) {
            copy[spotIndex] = null;
          }
          return copy;
        });
      }, 1100);

    }, 600);

    return () => clearInterval(spawner);
  }, [gameState]);

  const handleSpotClick = (index: number) => {
    if (gameState !== 'PLAYING') return;
    const item = activeItems[index];
    if (!item) return;

    if (item.type === 'guardia') {
      livesRef.current -= 1;
      setLives(livesRef.current);
      triggerHitFeedback('🚨 BECCATO! -1 Vita');

      if (livesRef.current <= 0) {
        endGame();
        return;
      }
    } else {
      scoreRef.current += item.points;
      itemsStolenRef.current += 1;
      setScore(scoreRef.current);
      triggerHitFeedback(`+${item.points} Pts!`);
    }

    setActiveItems((prev) => {
      const copy = [...prev];
      copy[index] = null;
      return copy;
    });
  };

  const triggerHitFeedback = (msg: string) => {
    setHitFeedback(msg);
    setTimeout(() => setHitFeedback(null), 800);
  };

  const endGame = async () => {
    setGameState('GAMEOVER');
    const finalScore = scoreRef.current;
    const gainedXP = Math.max(5, Math.floor(finalScore / 10));
    setExpEarned(gainedXP);

    // Aggiorna Statistiche
    const updatedStats: GameStats = {
      bestScore: Math.max(stats.bestScore, finalScore),
      totalRaids: stats.totalRaids + 1,
      totalItemsStolen: stats.totalItemsStolen + itemsStolenRef.current,
    };
    setStats(updatedStats);
    localStorage.setItem('scorribanda_stats', JSON.stringify(updatedStats));

    // Salva XP nel database Supabase
    if (mascotId && gainedXP > 0) {
      const newExpTotal = currentExp + gainedXP;
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
        <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mb-3" />
        <span className="text-purple-400 font-black text-xs uppercase tracking-widest">Preparazione Raid...</span>
      </div>
    );
  }

  return (
    <div className="relative flex flex-col items-center min-h-dvh bg-zinc-950 text-white select-none p-3 sm:p-5 pb-28 sm:pb-32 overflow-x-hidden">
      
      {/* WRAPPER PRINCIPALE CON SPAZIATURA OTTIMIZZATA PER MOBILE */}
      <div className="w-full max-w-md space-y-3 z-10">
        
        {/* 1. HEADER SUPERIORE */}
        <div className="flex justify-between items-center bg-zinc-900/90 border border-white/10 p-3 rounded-2xl shadow-xl backdrop-blur-md">
          <Link href="/mascotte" className="bg-zinc-800 hover:bg-zinc-700 border border-white/20 text-[10px] font-black px-3.5 py-2 rounded-xl text-zinc-300 transition-all">
            ← MASCOTTE
          </Link>
          <div className="text-right">
            <span className="text-[9px] font-black uppercase text-purple-400 tracking-wider block">
              🥷 SCORRIBANDA AL CAMPEGGIO
            </span>
            <span className="text-[10px] font-black text-amber-400">⚡ {currentExp} XP Totali</span>
          </div>
        </div>

        {/* 2. DASHBOARD STATISTICHE BANDITISMO (SPOSTATA IN ALTO) */}
        <div className="bg-zinc-900/90 border border-white/10 p-3.5 rounded-3xl space-y-2.5 shadow-xl backdrop-blur-md">
          <h3 className="text-[10px] font-black uppercase tracking-widest text-purple-400 flex items-center justify-between">
            <span>📊 Statistiche Banditismo</span>
            <span className="text-[8px] text-zinc-500 font-mono">Salvato in locale</span>
          </h3>

          <div className="grid grid-cols-3 gap-2">
            <div className="bg-zinc-950 p-2.5 rounded-2xl border border-white/5 text-center">
              <span className="text-[8px] font-black text-zinc-400 block uppercase">Record Score</span>
              <span className="text-sm font-black text-amber-400">🏆 {stats.bestScore}</span>
            </div>

            <div className="bg-zinc-950 p-2.5 rounded-2xl border border-white/5 text-center">
              <span className="text-[8px] font-black text-zinc-400 block uppercase">Raid Totali</span>
              <span className="text-sm font-black text-purple-400">⛺ {stats.totalRaids}</span>
            </div>

            <div className="bg-zinc-950 p-2.5 rounded-2xl border border-white/5 text-center">
              <span className="text-[8px] font-black text-zinc-400 block uppercase">Refurtiva</span>
              <span className="text-sm font-black text-emerald-400">🥩 {stats.totalItemsStolen}</span>
            </div>
          </div>
        </div>

        {/* 3. HUD STATUS GIOCO (SOPRA L'ARENA DI GIOCO) */}
        <div className="grid grid-cols-3 gap-2 bg-gradient-to-r from-purple-950/60 via-zinc-900 to-indigo-950/60 p-2.5 rounded-2xl border border-purple-500/30 text-center font-black shadow-lg backdrop-blur-md">
          <div>
            <span className="block text-[8px] text-purple-300 uppercase tracking-wider">Tempo</span>
            <span className={`text-base sm:text-lg ${timeLeft <= 5 ? 'text-red-500 animate-ping' : 'text-amber-400'}`}>{timeLeft}s</span>
          </div>
          <div>
            <span className="block text-[8px] text-purple-300 uppercase tracking-wider">Punti</span>
            <span className="text-base sm:text-lg text-emerald-400">{score}</span>
          </div>
          <div>
            <span className="block text-[8px] text-purple-300 uppercase tracking-wider">Vite</span>
            <span className="text-xs sm:text-sm text-rose-500">{lives > 0 ? '❤️'.repeat(lives) : '💀'}</span>
          </div>
        </div>

        {/* 4. ARENA DI GIOCO 3x2 (POSIZIONATA IN BASSO VICINO AI POLLICI) */}
        <div className="relative w-full h-[340px] bg-zinc-900/90 rounded-3xl border-2 border-purple-500/50 p-3 grid grid-cols-3 grid-rows-2 gap-2.5 shadow-[0_0_30px_rgba(168,85,247,0.15)] overflow-hidden shrink-0">
          
          {/* FEEDBACK POPUP SUI COLPI */}
          {hitFeedback && (
            <div className="absolute top-2 left-1/2 -translate-x-1/2 z-20 bg-purple-500 text-black font-black text-xs px-3 py-1 rounded-full shadow-lg border border-white/40 animate-bounce">
              {hitFeedback}
            </div>
          )}

          {activeItems.map((item, idx) => (
            <div
              key={idx}
              onClick={() => handleSpotClick(idx)}
              className={`relative rounded-2xl flex items-center justify-center cursor-pointer transition-all duration-150 overflow-hidden ${
                item 
                  ? 'bg-purple-900/40 border-2 border-purple-400 shadow-[0_0_20px_rgba(168,85,247,0.4)] scale-95 active:scale-90' 
                  : 'bg-zinc-950/80 border border-white/5 opacity-80'
              }`}
            >
              {/* Texture Sfondo Cespuglio/Tenda */}
              <div className="absolute inset-0 flex items-center justify-center opacity-15 pointer-events-none">
                <span className="text-3xl">⛺</span>
              </div>

              {/* Oggetto o Guardia Spawnata */}
              {item && (
                <div className="relative z-10 flex flex-col items-center justify-center animate-in zoom-in-50 duration-150">
                  <img
                    src={item.icon}
                    alt="Item"
                    className={`w-12 h-12 object-contain drop-shadow-[0_4px_10px_rgba(0,0,0,0.8)] ${
                      item.type === 'guardia' ? 'animate-bounce brightness-125' : 'hover:scale-110'
                    }`}
                    onError={(e) => { (e.target as HTMLImageElement).src = '/icons/carota.png'; }}
                  />
                </div>
              )}
            </div>
          ))}

          {/* OVERLAY SCHERMATA INIZIALE */}
          {gameState === 'START' && (
            <div className="absolute inset-0 bg-zinc-950/90 backdrop-blur-md z-30 flex flex-col items-center justify-center p-5 text-center space-y-3">
              <div className="w-14 h-14 bg-purple-500/20 border-2 border-purple-500 rounded-3xl flex items-center justify-center text-2xl shadow-xl">
                🥷
              </div>
              <div>
                <h2 className="text-lg font-black text-purple-400 uppercase tracking-wide">Raid al Campeggio</h2>
                <p className="text-[10px] text-zinc-400 mt-1 leading-relaxed max-w-xs">
                  Svaligia le tende prima che scadano i 30 secondi. Raccogli cibo e birra ma <b>SCHIVA I FUOCHI/GUARDIANI</b>!
                </p>
              </div>
              <button
                onClick={startGame}
                className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-black py-3 rounded-2xl text-xs uppercase tracking-widest active:scale-95 transition-all shadow-xl border border-purple-400/30"
              >
                🚀 INIZIA IL RAID
              </button>
            </div>
          )}

          {/* OVERLAY GAMEOVER */}
          {gameState === 'GAMEOVER' && (
            <div className="absolute inset-0 bg-zinc-950/95 backdrop-blur-md z-30 flex flex-col items-center justify-center p-5 text-center space-y-3 animate-in fade-in duration-200">
              <h2 className="text-xl font-black text-amber-400 uppercase">Raid Concluso!</h2>
              
              <div className="w-full bg-zinc-900 border border-white/10 p-3 rounded-2xl space-y-1.5">
                <div className="flex justify-between text-xs font-bold text-zinc-400">
                  <span>Punteggio Raggiunto:</span>
                  <span className="text-white font-black">{score}</span>
                </div>
                <div className="flex justify-between text-xs font-bold text-zinc-400">
                  <span>Refurtiva Punti:</span>
                  <span className="text-emerald-400 font-black">+{score} Pts</span>
                </div>
                <div className="border-t border-white/10 pt-1.5 flex justify-between items-center">
                  <span className="text-xs font-black text-amber-400 uppercase">XP Guadagnati:</span>
                  <span className="text-sm font-black text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-lg border border-emerald-500/30">
                    +{expEarned} XP
                  </span>
                </div>
              </div>

              <button
                onClick={startGame}
                className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-black py-3 rounded-2xl text-xs uppercase tracking-widest active:scale-95 transition-all shadow-xl"
              >
                🔄 GIOCA ANCORA
              </button>
            </div>
          )}
        </div>

      </div>

    </div>
  );
}