'use client';

import React, { useState, useEffect, useRef, useReducer } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { FOOD_NAMES, getDifficulty, cookingTimes, getFoodImagePath, grillReducer, initialGrillGame, type FoodType, type Order } from '@/lib/grill-game';
import styles from './grill.module.css';

interface GameStats { bestScore: number; totalGrillades: number; itemsServed: number }
interface ServingFlight { id: number; orderId: number; food: FoodType; x: number; y: number; dx: number; dy: number }

export default function GrigliataPage() {
  const [game, dispatch] = useReducer(grillReducer, initialGrillGame);
  const { phase: gameState, score, lives, combo: comboStreak, slots, orders } = game;
  const difficulty = getDifficulty(game.elapsed);
  const survivalTime = `${Math.floor(game.elapsed / 60000)}:${String(Math.floor(game.elapsed / 1000) % 60).padStart(2, '0')}`;
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
        const { error: saveError } = await supabase.rpc('submit_grill_score', { p_score: score });
        const { data, error } = await supabase.rpc('get_grill_leaderboard');
        if (!active) return;
        if (error) { setRankingStatus('Classifica non disponibile al momento.'); return; }
        setRanking(data ?? []);
        setRankingStatus(saveError ? 'Punteggio non salvato nella classifica.' : data?.length ? '' : 'Nessun punteggio in classifica: accedi e gioca per partecipare.');
      } catch {
        if (active) setRankingStatus('Classifica non disponibile al momento.');
      }
    }
    void loadRanking();
    return () => { active = false; };
  }, [gameState, score]);
  const [expEarned, setExpEarned] = useState(0);
  const [feedback, setFeedback] = useState<{ msg: string; isError: boolean } | null>(null);
  const [stats, setStats] = useState<GameStats>({ bestScore: 0, totalGrillades: 0, itemsServed: 0 });
  const [mascotId, setMascotId] = useState<string | null>(null);
  const [currentExp, setCurrentExp] = useState(0);
  const [loading, setLoading] = useState(true);
  const [guideOpen, setGuideOpen] = useState(true);
  const [flights, setFlights] = useState<ServingFlight[]>([]);
  const [servedOrders, setServedOrders] = useState<(Order & { arrived: boolean })[]>([]);
  const plateRefs = useRef(new Map<number, HTMLDivElement>());
  const displayOrders = [...orders, ...servedOrders].sort((a, b) => a.id - b.id);
  const feedbackTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const rewardRunRef = useRef(0);
  const flightIdRef = useRef(0);
  const clickedSlotsRef = useRef(new Set<number>());
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    const init = async () => {
      try {
        try {
          const saved = localStorage.getItem('grigliata_stats');
          if (saved) setStats(JSON.parse(saved));
        } catch { /* Storage may be unavailable in private browsing. */ }
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data } = await supabase.from('mascots').select('*').eq('user_id', user.id).maybeSingle();
          if (data && mountedRef.current) { setMascotId(data.id); setCurrentExp(data.exp || 0); }
        }
      } catch (error) { console.error('Caricamento grigliata:', error); }
      finally { if (mountedRef.current) setLoading(false); }
    };
    void init();
    return () => { mountedRef.current = false; if (feedbackTimer.current) clearTimeout(feedbackTimer.current); };
  }, []);

  useEffect(() => {
    if (gameState !== 'PLAYING') return;
    let last = performance.now();
    const timer = window.setInterval(() => {
      const now = performance.now();
      dispatch({ type: 'TICK', milliseconds: now - last, random: Math.random() });
      last = now;
    }, 100);
    return () => window.clearInterval(timer);
  }, [gameState]);

  useEffect(() => {
    if (gameState !== 'GAMEOVER' || rewardRunRef.current === game.run) return;
    rewardRunRef.current = game.run;
    const updated = {
      bestScore: Math.max(stats.bestScore, score), totalGrillades: stats.totalGrillades + 1,
      itemsServed: stats.itemsServed + game.served,
    };
    setStats(updated);
    try { localStorage.setItem('grigliata_stats', JSON.stringify(updated)); } catch { /* Optional local record. */ }
    const gainedXP = Math.max(12, Math.floor(score / 4) + Math.floor(game.elapsed / 1000 / 3));
    setExpEarned(gainedXP);
    if (mascotId) {
      void (async () => {
        const { data, error } = await supabase.rpc('increment_mascot_exp', { p_delta: gainedXP });
        if (!error && data !== null && mountedRef.current) { setCurrentExp(data); }
      })();
    }
  }, [gameState, game.run, game.served, score, game.elapsed, mascotId, stats]);

  const startGame = () => {
    clickedSlotsRef.current.clear();
    setFlights([]); setServedOrders([]); setFeedback(null);
    setExpEarned(0);
    dispatch({ type: 'START', random: Math.random() });
  };
  const triggerFeedback = (msg: string, isError = false) => {
    if (feedbackTimer.current) clearTimeout(feedbackTimer.current);
    setFeedback({ msg, isError });
    feedbackTimer.current = setTimeout(() => setFeedback(null), 1200);
  };
  const handlePlaceFood = (food: FoodType) => {
    if (gameState !== 'PLAYING') return;
    if (slots.every(Boolean)) { triggerFeedback('Griglia piena', true); return; }
    dispatch({ type: 'PLACE', food });
  };
  const handleSlotClick = (index: number, button: HTMLButtonElement) => {
    const item = slots[index];
    if (gameState !== 'PLAYING' || !item || clickedSlotsRef.current.has(item.id)) return;
    if (item.state === 'bruciato') {
      clickedSlotsRef.current.add(item.id);
      dispatch({ type: 'DISCARD', index });
      triggerFeedback('−1 vita', true);
      return;
    }
    if (item.state === 'crudo') { triggerFeedback('Aspetta il dorato'); return; }
    const matchingOrder = orders.find(order => order.foodType === item.foodType);
    if (!matchingOrder) { triggerFeedback('Nessun ordine per questo cibo', true); return; }
    clickedSlotsRef.current.add(item.id);
    const from = button.getBoundingClientRect();
    const to = plateRefs.current.get(matchingOrder.id)?.getBoundingClientRect();
    setServedOrders(prev => [...prev, { ...matchingOrder, arrived: !to }]);
    if (to) {
      const x = from.left + from.width / 2 - 32, y = from.top + from.height / 2 - 32;
      setFlights(prev => [...prev, { id: ++flightIdRef.current, orderId: matchingOrder.id, food: item.foodType, x, y,
        dx: to.left + to.width / 2 - 32 - x, dy: to.top + to.height / 2 - 32 - y }]);
    }
    dispatch({ type: 'SERVE', index });
    triggerFeedback(`+${Math.round(35 * (1 + comboStreak * 0.2))} · Combo ${comboStreak + 1}`);
  };

  if (loading) {
    return (
      <div className="min-h-dvh bg-zinc-950 flex flex-col items-center justify-center p-4">
        <div className="w-12 h-12 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mb-3" />
        <span className="text-amber-400 font-black text-xs uppercase tracking-widest">Accensione Carbonella...</span>
      </div>
    );
  }

  if (guideOpen) {
    return (
      <main className={styles.guide}>
        <Link href="/mascotte" className={styles.back}>← Cavia</Link>
        <header className={styles.guideHeader}>
          <img src="/grigliata/ui_trofeo.png" alt="" width={48} height={48} />
          <h1>Grigliata del panico</h1>
          <p>Tre mosse. La griglia è tua.</p>
        </header>
        <section className={styles.guidePanel} aria-label="1. Guarda gli ordini e scegli il cibo">
          <h2>1. GUARDA L’ORDINE</h2>
          <p className="text-sm text-zinc-300 mt-1">Controlla i piatti, poi scegli lo stesso cibo dal vassoio.</p>
          <div className={styles.guideScene}>
            <div className="flex flex-col items-center gap-1">
              <div className={styles.guideTray}>
                <img src="/grigliata/griglia_piatto.png" alt="Piatto dell’ordine" />
                <img src={getFoodImagePath('salsiccia', 'cotto')} alt="Salsiccia richiesta" />
              </div>
              <span className="text-xs text-amber-300 font-bold">Ordine: salsiccia</span>
            </div>
            <span className={styles.arrow} aria-hidden="true">→</span>
            <div className="flex flex-col items-center gap-1">
              <div className={styles.guideTray}>
                <img src="/grigliata/griglia_vassoio.png" alt="Vassoio" />
                <img src={getFoodImagePath('salsiccia', 'crudo')} alt="Scegli la salsiccia cruda" />
              </div>
              <span className="text-xs text-amber-300 font-bold">Tocca la salsiccia</span>
            </div>
          </div>
        </section>
        <section className={`${styles.guidePanel} ${styles.goldenPanel}`} aria-label="2. Aspetta il dorato">
          <h2>2. ASPETTA IL DORATO</h2>
          <div className={styles.guideScene}>
            <img src={getFoodImagePath('salsiccia', 'crudo')} alt="Cruda" className={styles.guideAsset} />
            <span className={styles.arrow} aria-hidden="true">→</span>
            <img src={getFoodImagePath('salsiccia', 'cotto')} alt="Cotta e pronta" className={`${styles.guideAsset} ${styles.guideReady}`} />
          </div>
        </section>
        <section className={styles.guidePanel} aria-label="3. Servi">
          <h2>3. SERVI</h2>
          <div className={styles.guideScene}>
            <img src={getFoodImagePath('salsiccia', 'cotto')} alt="Tocca il cibo cotto" className={`${styles.guideAsset} ${styles.guideServing}`} />
            <span className={styles.arrow} aria-hidden="true">→</span>
            <div className={styles.guideTray}>
              <img src="/grigliata/griglia_piatto.png" alt="Piatto" />
              <img src={getFoodImagePath('salsiccia', 'cotto')} alt="Ordine servito" />
              <span className={styles.check} aria-label="Ordine completato">✓</span>
            </div>
          </div>
        </section>
        <button className={styles.startButton} onClick={() => {
          setGuideOpen(false); startGame();
        }}>HO CAPITO, ACCENDO LA GRIGLIA</button>
      </main>
    );
  }

  return (
    <div className="relative flex flex-col items-center min-h-dvh bg-zinc-950 text-white select-none pt-3 sm:pt-6 px-3 sm:px-5 pb-6 overflow-x-hidden">
      
      {/* ANIMAZIONE RALLENTATA SPRITE SHEET */}
      <style>{`
        @keyframes grillSpriteAnim {
          0% { transform: translateX(0%); }
          100% { transform: translateX(-100%); }
        }
        .animate-grill-sheet {
          animation: grillSpriteAnim 2.2s steps(6) infinite;
        }
      `}</style>

      <div className="w-full max-w-md space-y-3 z-10">

        {/* 1. HEADER */}
        <div className="flex justify-between items-center bg-zinc-900/90 border border-white/10 p-3 rounded-2xl shadow-xl backdrop-blur-md">
          <Link href="/mascotte" className="bg-zinc-800 hover:bg-zinc-700 border border-white/20 text-[10px] font-black px-3 py-2 rounded-xl text-zinc-300">
            ← MASCOTTE
          </Link>
          <div className="text-right">
            <span className="text-[9px] font-black uppercase text-amber-500 tracking-wider block">
              🥩 GRIGLIATA DEL PANICO
            </span>
            <span className="text-[10px] font-black text-amber-400 flex items-center justify-end gap-1">
              <img src="/grigliata/ui_xp.png" className="w-6 h-6 shrink-0 object-contain" alt="xp" />
              {currentExp} XP
            </span>
          </div>
        </div>

        {/* 2. DASHBOARD CON ASSET PNG */}
        {gameState === 'START' && <div className="bg-zinc-900/90 border border-white/10 p-3 rounded-2xl shadow-xl backdrop-blur-md">
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="bg-zinc-950 p-2 rounded-xl border border-white/5 flex flex-col items-center justify-center">
              <span className="text-[10px] font-black text-zinc-300 uppercase flex flex-col items-center gap-1 mb-1">
                <img src="/grigliata/ui_trofeo.png" className="w-[26px] h-[26px] shrink-0 object-contain" alt="trofeo" /> Record
              </span>
              <span className="text-xs font-black text-amber-400">{stats.bestScore}</span>
            </div>
            <div className="bg-zinc-950 p-2 rounded-xl border border-white/5 flex flex-col items-center justify-center">
              <span className="text-[10px] font-black text-zinc-300 uppercase flex flex-col items-center gap-1 mb-1">
                <img src="/grigliata/ui_stella.png" className="w-[26px] h-[26px] shrink-0 object-contain" alt="combo" /> Combo
              </span>
              <span className="text-xs font-black text-amber-400">x{(1 + comboStreak * 0.2).toFixed(1)}</span>
            </div>
            <div className="bg-zinc-950 p-2 rounded-xl border border-white/5 flex flex-col items-center justify-center">
              <span className="text-[10px] font-black text-zinc-300 uppercase flex flex-col items-center gap-1 mb-1">
                <img src="/grigliata/ui_premio.png" className="w-[26px] h-[26px] shrink-0 object-contain" alt="serviti" /> Serviti
              </span>
              <span className="text-xs font-black text-emerald-400">{stats.itemsServed}</span>
            </div>
          </div>
        </div>}

        {/* 3. HUD STATO GIOCO */}
        <div className="grid grid-cols-3 gap-x-1.5 gap-y-3 bg-gradient-to-r from-amber-950/60 via-zinc-900 to-orange-950/60 p-2.5 rounded-2xl border border-amber-500/30 text-center font-black text-xs shadow-lg">
          <div className="flex flex-col items-center gap-1">
            <span className="text-[10px] text-amber-300 uppercase flex flex-col items-center gap-1">
              <img src="/grigliata/ui_timer.png" className="w-6 h-6 shrink-0 object-contain" alt="" /> Tempo di sopravvivenza
            </span>
            <span className="text-amber-400">{survivalTime}</span>
          </div>
          <div className="flex flex-col items-center gap-1">
            <span className="text-[10px] text-amber-300 uppercase flex flex-col items-center gap-1">
              <img src="/grigliata/ui_trofeo.png" className="w-6 h-6 shrink-0 object-contain" alt="" /> Punti
            </span>
            <span className="text-emerald-400">{score}</span>
          </div>
          <div className="flex flex-col items-center justify-center gap-2">
            <span className="text-[10px] text-amber-300 uppercase">Vite</span>
            <div className="flex gap-1.5" aria-label={`${lives} vite rimaste`}>
              {Array.from({ length: lives }).map((_, i) => (
                <img key={i} src="/grigliata/ui_cuore.png" className="w-6 h-6 shrink-0 object-contain" alt="cuore" />
              ))}
            </div>
          </div>
        </div>

        {/* Each order keeps its own plate through the serving animation. */}
        <section className={styles.orders} aria-label="Ordini">
          <div className={styles.orderHeading}>
            <h2>Ordini {orders.length}/{difficulty.maxOrders}</h2>
            <span>Combo {comboStreak} · Serviti {game.served}</span>
          </div>
          <div className={styles.orderGrid}>
            {displayOrders.map(order => {
              const served = 'arrived' in order;
              const arrived = served && order.arrived === true;
              return (
                <div key={order.id} className={`${styles.orderCard} ${arrived ? styles.orderServed : ''}`} data-order-food={order.foodType}
                  onAnimationEnd={event => {
                    if (event.target === event.currentTarget && arrived)
                      setServedOrders(prev => prev.filter(item => item.id !== order.id));
                  }}>
                  <span>{FOOD_NAMES[order.foodType]}</span>
                  <div className={styles.plate} ref={element => {
                    if (element) plateRefs.current.set(order.id, element);
                    else plateRefs.current.delete(order.id);
                  }} aria-label={`Piatto ${arrived ? 'servito' : 'vuoto'}: ${FOOD_NAMES[order.foodType]}`}>
                    <img src="/grigliata/griglia_piatto.png" alt="" />
                    <img className={styles.orderReference} src={getFoodImagePath(order.foodType, 'cotto')}
                      alt={`Da servire: ${FOOD_NAMES[order.foodType]}`} width={22} height={22} />
                    {arrived && <img src={getFoodImagePath(order.foodType, 'cotto')} alt={`${FOOD_NAMES[order.foodType]} servita`} className={styles.platedFood} />}
                  </div>
                  {served ? <span className={styles.servedLabel} aria-live="polite">{arrived ? '✓ Servito!' : 'In arrivo…'}</span> :
                    <div className={styles.orderTime} role="progressbar" aria-label={`Tempo ordine ${FOOD_NAMES[order.foodType]}`} aria-valuenow={Math.ceil(order.timeLeft / 1000)} aria-valuemin={0} aria-valuemax={20}>
                      <div style={{ width: `${order.timeLeft / order.maxTime * 100}%`, background: order.timeLeft < 5000 ? '#fb7185' : '#fbbf24' }} />
                    </div>}
                </div>
              );
            })}
            {displayOrders.length === 0 && <p className={styles.waiting}>Nuovi piatti in arrivo…</p>}
          </div>
        </section>

        {/* 5. ARENA GRIGLIA ANIMATA CON OPACITÀ ALL'85% */}
        <div className={`relative w-full h-[210px] min-[380px]:h-[260px] sm:h-[320px] rounded-3xl border-2 border-amber-600/60 shadow-[0_0_35px_rgba(217,119,6,0.3)] overflow-hidden flex items-center justify-center bg-zinc-950`}>
          
          {/* SPRITE SHEET ANIMATA CON OPACITA ALL'85% */}
          <div className="absolute inset-0 w-full h-full overflow-hidden z-0 opacity-85">
            <img
              src="/grigliata/griglia_sheet.png"
              alt="Griglia Animata"
              className="h-full max-w-none object-cover animate-grill-sheet"
              style={{ width: '600%' }}
            />
          </div>

          {/* POPUP FEEDBACK */}
          {feedback && (
            <div className={`absolute top-3 left-1/2 -translate-x-1/2 z-30 font-black text-[11px] px-3.5 py-1.5 rounded-full shadow-2xl border text-center animate-bounce ${
              feedback.isError ? 'bg-rose-600 text-white border-rose-400' : 'bg-emerald-500 text-black border-white'
            }`}>
              {feedback.msg}
            </div>
          )}

          {/* Six touch targets; only the food image and ready/burnt cue change. */}
          <div className={styles.grillSlots}>
            {slots.map((slot, index) => (
              <button key={index} type="button" data-slot={index} data-state={slot?.state ?? 'empty'}
                disabled={gameState !== 'PLAYING' || !slot}
                aria-label={slot ? `${FOOD_NAMES[slot.foodType]} ${slot.state}${slot.state === 'bruciato' ? ': rimuovi, perdi una vita' : ''}` : `Spazio ${index + 1} libero`}
                onClick={event => handleSlotClick(index, event.currentTarget)}
                className={`${styles.slot} ${slot ? styles[slot.state] : styles.emptySlot}`}>
                {slot ? <>
                  <img key={`${slot.id}-${slot.state}`} src={getFoodImagePath(slot.foodType, slot.state)} alt={FOOD_NAMES[slot.foodType]} />
                  {slot.state === 'cotto' && <span className={styles.readyMark}>✓</span>}
                  {slot.state === 'bruciato' && <span className={styles.burntMark}>✕ −1 ♥</span>}
                  {slot.state === 'crudo' && <div className={styles.cookProgress}><div style={{ width: `${Math.min(100, slot.elapsed / cookingTimes(game.elapsed).ready * 100)}%` }} /></div>}
                </> : <span aria-hidden="true">+</span>}
              </button>
            ))}
          </div>

          {/* OVERLAY START */}
          {gameState === 'START' && (
            <div className="absolute inset-0 bg-zinc-950/95 backdrop-blur-md z-40 flex flex-col items-center justify-center p-5 text-center space-y-3">
              <img src="/grigliata/ui_trofeo.png" className="w-12 h-12 object-contain" alt="trofeo" />
              <div>
                <h2 className="text-lg font-black text-amber-400 uppercase">Grigliata del Panico</h2>
                <p className="text-[10px] text-zinc-400 mt-1 leading-relaxed max-w-xs">
                  Scegli, aspetta il dorato, tocca per servire. Resisti più che puoi: la partita finisce quando perdi le tre vite.
                </p>
              </div>
              <button
                onClick={() => startGame()}
                className="w-full bg-gradient-to-r from-amber-600 to-orange-600 text-white font-black py-3 rounded-2xl text-xs uppercase tracking-widest active:scale-95 shadow-xl border border-amber-400/30"
              >
                🔥 ACCENDI I CARBONI
              </button>
              <button className="text-sm text-amber-200 underline min-h-11" onClick={() => setGuideOpen(true)}>Rivedi le tre mosse</button>
            </div>
          )}


        </div>

        {/* 6. SELEZIONE CIBI CRUDI */}
        <div className={`${styles.foodTray} bg-zinc-900/95 border border-white/10 p-3 rounded-3xl shadow-xl backdrop-blur-md`}>
          <span className="text-xs font-black uppercase tracking-wider text-amber-400 block mb-2 text-center">
            Scegli un alimento
          </span>
          <div className="grid grid-cols-3 gap-2">
            {difficulty.allowedFoods.map((food) => (
              <button
                key={food}
                onClick={() => handlePlaceFood(food)}
                disabled={gameState !== 'PLAYING'}
                className="bg-zinc-950 hover:bg-zinc-800 active:scale-95 disabled:opacity-50 border border-white/10 rounded-2xl p-2 flex flex-col items-center justify-center transition-all"
              >
                <img
                  src={getFoodImagePath(food, 'crudo')}
                  alt={food}
                  className="w-14 h-14 object-contain mb-1"
                />
                <span className="text-xs font-bold text-zinc-300">{FOOD_NAMES[food]}</span>
              </button>
            ))}
          </div>
        </div>

      </div>
          {/* OVERLAY GAMEOVER */}
          <dialog ref={gameOverRef} className={styles.gameOverDialog} aria-labelledby="gameover-title" onCancel={event => event.preventDefault()}>
            <div className="flex flex-col gap-3 p-5 text-center">
              <h2 id="gameover-title" className="text-xl font-black text-rose-500 uppercase">La brace si spegne… ci riprovi?</h2>
              <div className="w-full bg-zinc-900 border border-white/10 p-3 rounded-2xl space-y-1.5 text-xs">
                <div className="flex justify-between text-zinc-400">
                  <span>Punteggio Totale:</span>
                  <span className="text-white font-black">{score}</span>
                </div>
                <div className="flex justify-between text-zinc-400">
                  <span>Tempo sopravvissuto:</span>
                  <span className="text-amber-400 font-black">{survivalTime}</span>
                </div>
                <div className="flex justify-between text-zinc-400">
                  <span>Cibi serviti:</span><span className="text-white font-black">{game.served}</span>
                </div>
                <div className="flex justify-between text-zinc-400">
                  <span>Record personale:</span><span className="text-amber-400 font-black">{Math.max(stats.bestScore, score)}</span>
                </div>
                <div className="border-t border-white/10 pt-1.5 flex justify-between items-center">
                  <span className="font-black text-amber-400 uppercase flex items-center gap-1">
                    <img src="/grigliata/ui_xp.png" className="w-6 h-6 shrink-0 object-contain" alt="xp" /> XP Guadagnati:
                  </span>
                  <span className="font-black text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-lg border border-emerald-500/30">
                    +{expEarned} XP
                  </span>
                </div>
              </div>

              <section className={styles.ranking} aria-label="Classifica dei profili">
                <h3>Classifica grigliatori</h3>
                {rankingStatus && <p role="status">{rankingStatus}</p>}
                <ol>{ranking.map((entry, index) => <li key={entry.user_id}>
                  <span>{index + 1}. {entry.nome || 'Grigliatore'}</span><strong>{entry.best_score}</strong>
                </li>)}</ol>
              </section>
              <div className="grid grid-cols-2 gap-2">
              <button autoFocus
                onClick={() => startGame()}
                className="w-full bg-gradient-to-r from-amber-600 to-orange-600 text-white font-black py-3 rounded-2xl text-xs uppercase tracking-widest active:scale-95 shadow-xl"
              >
                Riprova
              </button>
              <Link href="/mascotte" className="bg-zinc-800 text-white font-black py-3 rounded-2xl text-xs uppercase">Esci</Link>
              </div>
            </div>
          </dialog>
      {flights.map(flight => (
        <img key={flight.id} src={getFoodImagePath(flight.food, 'cotto')} alt="" aria-hidden="true"
          className={styles.servingFlight} style={{ left: flight.x, top: flight.y, '--dx': `${flight.dx}px`, '--dy': `${flight.dy}px` } as React.CSSProperties}
          onAnimationEnd={() => { setServedOrders(prev => prev.map(order => order.id === flight.orderId ? { ...order, arrived: true } : order)); setFlights(prev => prev.filter(item => item.id !== flight.id)); }} />
      ))}
    </div>
  );
}