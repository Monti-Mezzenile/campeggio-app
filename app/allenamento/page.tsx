'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

interface GameStats {
  maxReps: number;
  maxCombo: number;
  totalLifts: number;
}

export default function AllenamentoPage() {
  const [gameState, setGameState] = useState<'START' | 'PLAYING' | 'GAMEOVER'>('START');
  const [reps, setReps] = useState(0);
  const [combo, setCombo] = useState(0);
  const [misses, setMisses] = useState(0);
  const [expEarned, setExpEarned] = useState(0);

  // Stato animazione Tartaruga (su / giù)
  const [isLifting, setIsLifting] = useState(false);
  const [hitFeedback, setHitFeedback] = useState<string | null>(null);

  // Statistiche salvate in locale
  const [stats, setStats] = useState<GameStats>({
    maxReps: 0,
    maxCombo: 0,
    totalLifts: 0,
  });

  const [mascotId, setMascotId] = useState<string | null>(null);
  const [currentExp, setCurrentExp] = useState(0);
  const [loading, setLoading] = useState(true);

  // Fisica della barra oscillante
  const [barPosition, setBarPosition] = useState(50);
  const directionRef = useRef<1 | -1>(1);
  const speedRef = useRef(1.2);
  const barPosRef = useRef(50);
  const requestRef = useRef<number>(0);
  const maxComboSessionRef = useRef(0);

  // Caricamento Dati
  useEffect(() => {
    const initData = async () => {
      setLoading(true);

      // Carica stats da localStorage
      const savedStats = localStorage.getItem('allenamento_stats');
      if (savedStats) {
        try {
          setStats(JSON.parse(savedStats));
        } catch (e) {
          console.error("Errore caricamento stats allenamento", e);
        }
      }

      // Carica Mascotte da Supabase
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
    setReps(0);
    setCombo(0);
    setMisses(0);
    setIsLifting(false);
    speedRef.current = 1.2;
    barPosRef.current = 50;
    maxComboSessionRef.current = 0;
    setBarPosition(50);
    setGameState('PLAYING');
  };

  // Loop di animazione della barra
  useEffect(() => {
    if (gameState !== 'PLAYING') return;

    const animateBar = () => {
      barPosRef.current += directionRef.current * speedRef.current;

      if (barPosRef.current >= 95) {
        barPosRef.current = 95;
        directionRef.current = -1;
      } else if (barPosRef.current <= 5) {
        barPosRef.current = 5;
        directionRef.current = 1;
      }

      setBarPosition(barPosRef.current);
      requestRef.current = requestAnimationFrame(animateBar);
    };

    requestRef.current = requestAnimationFrame(animateBar);
    return () => cancelAnimationFrame(requestRef.current);
  }, [gameState]);

  const handleLift = () => {
    if (gameState !== 'PLAYING') return;

    // Target zone verde tra 40% e 60%
    const isHit = barPosRef.current >= 40 && barPosRef.current <= 60;

    if (isHit) {
      const newReps = reps + 1;
      const newCombo = combo + 1;
      setReps(newReps);
      setCombo(newCombo);

      if (newCombo > maxComboSessionRef.current) {
        maxComboSessionRef.current = newCombo;
      }

      // Attiva animazione TARTARUGA SU
      setIsLifting(true);
      setTimeout(() => setIsLifting(false), 350);

      // Incrementa gradualmente la velocità della barra
      speedRef.current = Math.min(3.8, speedRef.current + 0.12);

      triggerFeedback(`💪 SOLLEVATO! +1`);
    } else {
      const newMisses = misses + 1;
      setMisses(newMisses);
      setCombo(0);

      triggerFeedback(`❌ CRAMPO!`);

      if (newMisses >= 3) {
        endGame(reps);
      }
    }
  };

  const triggerFeedback = (msg: string) => {
    setHitFeedback(msg);
    setTimeout(() => setHitFeedback(null), 700);
  };

  const endGame = async (finalReps = reps) => {
    setGameState('GAMEOVER');
    const gainedXP = Math.max(5, finalReps * 3);
    setExpEarned(gainedXP);

    // Aggiorna e salva statistiche locali
    const updatedStats: GameStats = {
      maxReps: Math.max(stats.maxReps, finalReps),
      maxCombo: Math.max(stats.maxCombo, maxComboSessionRef.current),
      totalLifts: stats.totalLifts + finalReps,
    };
    setStats(updatedStats);
    localStorage.setItem('allenamento_stats', JSON.stringify(updatedStats));

    // Salva XP su Supabase
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
        <div className="w-12 h-12 border-4 border-sky-400 border-t-transparent rounded-full animate-spin mb-3" />
        <span className="text-sky-400 font-black text-xs uppercase tracking-widest">Preparazione Pesi...</span>
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
            <span className="text-[9px] font-black uppercase text-sky-400 tracking-wider block">
              🏋️ PALESTRA DEL CAMPEGGIO
            </span>
            <span className="text-[10px] font-black text-amber-400">⚡ {currentExp} XP Totali</span>
          </div>
        </div>

        {/* 2. DASHBOARD STATISTICHE ALLENAMENTO (SPOSTATA IN ALTO) */}
        <div className="bg-zinc-900/90 border border-white/10 p-3.5 rounded-3xl space-y-2.5 shadow-xl backdrop-blur-md">
          <h3 className="text-[10px] font-black uppercase tracking-widest text-sky-400 flex items-center justify-between">
            <span>📊 Registro Palestra</span>
            <span className="text-[8px] text-zinc-500 font-mono">Salvato in locale</span>
          </h3>

          <div className="grid grid-cols-3 gap-2">
            <div className="bg-zinc-950 p-2.5 rounded-2xl border border-white/5 text-center">
              <span className="text-[8px] font-black text-zinc-400 block uppercase">Record Reps</span>
              <span className="text-sm font-black text-sky-400">🏆 {stats.maxReps}</span>
            </div>

            <div className="bg-zinc-950 p-2.5 rounded-2xl border border-white/5 text-center">
              <span className="text-[8px] font-black text-zinc-400 block uppercase">Max Combo</span>
              <span className="text-sm font-black text-amber-400">🔥 {stats.maxCombo}</span>
            </div>

            <div className="bg-zinc-950 p-2.5 rounded-2xl border border-white/5 text-center">
              <span className="text-[8px] font-black text-zinc-400 block uppercase">Totale Pesi</span>
              <span className="text-sm font-black text-emerald-400">🏋️ {stats.totalLifts}</span>
            </div>
          </div>
        </div>

        {/* 3. HUD STATO GIOCO (SOPRA L'ARENA) */}
        <div className="grid grid-cols-3 gap-2 bg-gradient-to-r from-sky-950/60 via-zinc-900 to-blue-950/60 p-2.5 rounded-2xl border border-sky-500/30 text-center font-black shadow-lg backdrop-blur-md">
          <div>
            <span className="block text-[8px] text-sky-300 uppercase tracking-wider">Ripetizioni</span>
            <span className="text-base sm:text-lg text-sky-400">{reps}</span>
          </div>
          <div>
            <span className="block text-[8px] text-sky-300 uppercase tracking-wider">Combo</span>
            <span className="text-base sm:text-lg text-amber-400">🔥 {combo}</span>
          </div>
          <div>
            <span className="block text-[8px] text-sky-300 uppercase tracking-wider">Errori</span>
            <span className="text-base sm:text-lg text-rose-500">{misses}/3</span>
          </div>
        </div>

        {/* 4. ARENA DI GIOCO (POSIZIONATA IN BASSO VICINO AI POLLICI) */}
        <div className="relative w-full bg-zinc-900/90 rounded-3xl border-2 border-sky-500/50 p-4 sm:p-5 shadow-[0_0_30px_rgba(56,189,248,0.15)] flex flex-col items-center gap-4 overflow-hidden shrink-0 backdrop-blur-md">
          
          {/* POPUP FEEDBACK SU SOLLEVAMENTO */}
          {hitFeedback && (
            <div className="absolute top-3 z-20 bg-sky-400 text-black font-black text-xs px-3.5 py-1 rounded-full shadow-lg border border-white/40 animate-bounce">
              {hitFeedback}
            </div>
          )}

          {/* AREA PERSONAGGIO TARTARUGA (SU / GIÙ) */}
          <div className="relative w-40 h-40 sm:w-44 sm:h-44 bg-zinc-950/80 rounded-2xl border border-white/10 flex items-center justify-center overflow-hidden p-2">
            <img
              src={isLifting ? '/allenamento/tartaruga_su.png' : '/allenamento/tartaruga_giu.png'}
              alt="Tartaruga Allenamento"
              className={`w-full h-full object-contain transition-transform duration-100 ${
                isLifting ? 'scale-110 -translate-y-2' : 'scale-100'
              }`}
              onError={(e) => {
                (e.target as HTMLImageElement).src = '/icons/coniglio.png';
              }}
            />
          </div>

          {/* BARRA DI POTENZA */}
          <div className="w-full space-y-1">
            <div className="flex justify-between text-[9px] font-black text-zinc-400 uppercase">
              <span>Timing</span>
              <span className="text-emerald-400">Zona Perfetta (40%-60%)</span>
            </div>
            
            <div className="relative w-full h-7 bg-black/80 rounded-xl border border-white/10 overflow-hidden">
              {/* TARGET ZONE VERDE */}
              <div className="absolute left-[40%] w-[20%] h-full bg-emerald-500/40 border-x-2 border-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.5)]" />

              {/* BARRA GIALLA OSCILLANTE */}
              <div
                className="absolute top-0 bottom-0 w-3 bg-amber-400 shadow-[0_0_12px_rgba(251,191,36,1)] rounded-full transition-none"
                style={{ left: `${barPosition}%` }}
              />
            </div>
          </div>

          {/* TASTO AZIONE SOLLEVA PESI */}
          <button
            onClick={handleLift}
            disabled={gameState !== 'PLAYING'}
            className="w-full bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-black font-black py-3.5 rounded-2xl text-xs uppercase tracking-widest active:scale-95 transition-all shadow-xl disabled:opacity-40"
          >
            🏋️ SOLLEVA PESI!
          </button>

          {/* OVERLAY SCHERMATA INIZIALE */}
          {gameState === 'START' && (
            <div className="absolute inset-0 bg-zinc-950/90 backdrop-blur-md z-30 flex flex-col items-center justify-center p-5 text-center space-y-3">
              <div className="w-14 h-14 bg-sky-500/20 border-2 border-sky-400 rounded-3xl flex items-center justify-center text-2xl shadow-xl">
                🏋️
              </div>
              <div>
                <h2 className="text-lg font-black text-sky-400 uppercase tracking-wide">Allenamento Tartaruga</h2>
                <p className="text-[10px] text-zinc-400 mt-1 leading-relaxed max-w-xs">
                  Schiaccia "SOLLEVA PESI" quando la barra gialla si trova al centro della <b>ZONA VERDE</b>!
                </p>
              </div>
              <button
                onClick={startGame}
                className="w-full bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-black font-black py-3.5 rounded-2xl text-xs uppercase tracking-widest active:scale-95 transition-all shadow-xl"
              >
                🚀 INIZIA SESSIONE
              </button>
            </div>
          )}

          {/* OVERLAY GAMEOVER */}
          {gameState === 'GAMEOVER' && (
            <div className="absolute inset-0 bg-zinc-950/95 backdrop-blur-md z-30 flex flex-col items-center justify-center p-5 text-center space-y-3 animate-in fade-in duration-200">
              <h2 className="text-xl font-black text-rose-500 uppercase">Esausto!</h2>
              
              <div className="w-full bg-zinc-900 border border-white/10 p-3 rounded-2xl space-y-1.5">
                <div className="flex justify-between text-xs font-bold text-zinc-400">
                  <span>Ripetizioni Completate:</span>
                  <span className="text-white font-black">{reps}</span>
                </div>
                <div className="flex justify-between text-xs font-bold text-zinc-400">
                  <span>Miglior Combo:</span>
                  <span className="text-amber-400 font-black">🔥 {maxComboSessionRef.current}</span>
                </div>
                <div className="border-t border-white/10 pt-1.5 flex justify-between items-center">
                  <span className="text-xs font-black text-sky-400 uppercase">XP Guadagnati:</span>
                  <span className="text-sm font-black text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-lg border border-emerald-500/30">
                    +{expEarned} XP
                  </span>
                </div>
              </div>

              <button
                onClick={startGame}
                className="w-full bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-black font-black py-3 rounded-2xl text-xs uppercase tracking-widest active:scale-95 transition-all shadow-xl"
              >
                🔄 RIPROVA
              </button>
            </div>
          )}
        </div>

      </div>

    </div>
  );
}