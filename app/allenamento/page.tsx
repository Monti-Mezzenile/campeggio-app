'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import styles from '../scorribanda/grill.module.css';
import {
  MERGE_ITEMS, BOMB, ROCK, ICE, WIDTH, HEIGHT, RED_LINE, STEP,
  itemIcon, itemName, itemRadius, createMergeGame, dropItem, activateMagnet, stepMerge, rainSchedule,
  type MergeGame,
} from '@/lib/merge-game';

interface Stats { maxScore: number; totalMerges: number; totalGames: number }
interface Rank { user_id: string; nome: string; best_score: number }
const formatTime = (ms: number) => `${Math.floor(ms / 60000)}:${String(Math.floor(ms / 1000) % 60).padStart(2, '0')}`;

function drawGame(ctx: CanvasRenderingContext2D, game: MergeGame, images: Map<string, HTMLImageElement>) {
  ctx.clearRect(0, 0, WIDTH, HEIGHT);
  ctx.fillStyle = game.feverUntil > game.elapsed ? '#211307' : '#09090b';
  ctx.fillRect(0, 0, WIDTH, HEIGHT);
  ctx.lineWidth = game.overflow ? 3 : 1.5;
  ctx.strokeStyle = game.overflow ? '#fb7185' : '#fb718566';
  ctx.setLineDash([6, 4]); ctx.beginPath(); ctx.moveTo(8, RED_LINE); ctx.lineTo(WIDTH - 8, RED_LINE); ctx.stroke(); ctx.setLineDash([]);
  const drawItem = (type: number, x: number, y: number, radius: number) => {
    const img = images.get(itemIcon(type));
    if (img?.complete && img.naturalWidth > 0) ctx.drawImage(img, x - radius, y - radius, radius * 2, radius * 2);
    else {
      ctx.fillStyle = type < 0 ? '#94a3b8' : '#fbbf24'; ctx.beginPath(); ctx.arc(x, y, radius, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#09090b'; ctx.font = '10px sans-serif'; ctx.textAlign = 'center'; ctx.fillText(itemName(type), x, y + 3);
    }
  };
  for (const body of game.bodies) {
    const radius = itemRadius(body.type);
    drawItem(body.type, body.x, body.y, radius);
    if (body.frozenUntil > game.elapsed) {
      ctx.fillStyle = '#38bdf855'; ctx.strokeStyle = '#38bdf8'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(body.x, body.y, radius + 2, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    }
  }
  if (game.phase === 'PLAYING') {
    const radius = itemRadius(game.current), x = Math.max(radius + 8, Math.min(WIDTH - radius - 8, game.aim));
    ctx.strokeStyle = '#fbbf2433'; ctx.setLineDash([3, 5]); ctx.beginPath(); ctx.moveTo(x, 40); ctx.lineTo(x, HEIGHT - 12); ctx.stroke(); ctx.setLineDash([]);
    ctx.globalAlpha = game.elapsed >= game.dropReadyAt ? 0.9 : 0.3;
    drawItem(game.current, x, radius + 10, radius); ctx.globalAlpha = 1;
  }
  if (game.incoming) {
    const { x, type } = game.incoming;
    ctx.fillStyle = '#fb923c'; ctx.font = '900 18px sans-serif'; ctx.textAlign = 'center'; ctx.fillText('↓', x, 75);
    ctx.globalAlpha = 0.7; drawItem(type, x, 28, 16); ctx.globalAlpha = 1;
  }
  if (game.noticeUntil > game.elapsed) {
    ctx.fillStyle = '#09090bd9'; ctx.fillRect(42, HEIGHT - 40, WIDTH - 84, 30);
    ctx.fillStyle = '#fde68a'; ctx.font = '900 12px sans-serif'; ctx.textAlign = 'center'; ctx.fillText(game.notice, WIDTH / 2, HEIGHT - 20);
  }
}

export default function MergePage() {
  const [phase, setPhase] = useState<'GUIDE' | 'PLAYING' | 'GAMEOVER'>('GUIDE');
  const [view, setView] = useState(() => createMergeGame(() => 0.5));
  const [stats, setStats] = useState<Stats>({ maxScore: 0, totalMerges: 0, totalGames: 0 });
  const [ranking, setRanking] = useState<Rank[]>([]);
  const [rankingStatus, setRankingStatus] = useState('');
  const [xp, setXp] = useState(0);
  const [saveStatus, setSaveStatus] = useState('');
  const gameRef = useRef<MergeGame | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const imagesRef = useRef(new Map<string, HTMLImageElement>());
  const runRef = useRef(0);
  const savedRunRef = useRef(0);

  useEffect(() => {
    try {
      const saved = localStorage.getItem('merge_game_stats');
      if (saved) {
        const parsed = JSON.parse(saved);
        // eslint-disable-next-line react-hooks/set-state-in-effect -- Synchronize the persisted browser record after hydration.
        if (['maxScore', 'totalMerges', 'totalGames'].every(key => Number.isFinite(parsed[key]) && parsed[key] >= 0)) setStats(parsed);
      }
    } catch { /* The game works without local storage. */ }
    for (const path of [...MERGE_ITEMS.map(item => item.icon), itemIcon(BOMB), itemIcon(ROCK), itemIcon(ICE)]) {
      const image = new Image();
      image.src = path; imagesRef.current.set(path, image);
    }
  }, []);

  useEffect(() => {
    if (phase === 'GAMEOVER') dialogRef.current?.showModal();
    else dialogRef.current?.close();
  }, [phase]);

  useEffect(() => {
    if (phase !== 'PLAYING') return;
    const game = gameRef.current, ctx = canvasRef.current?.getContext('2d');
    if (!game || !ctx) return;
    let frame = 0, previous = 0, accumulator = 0, lastUi = 0;
    const animate = (timestamp: number) => {
      if (document.hidden) { previous = 0; accumulator = 0; frame = requestAnimationFrame(animate); return; }
      accumulator += previous ? Math.min(100, timestamp - previous) : STEP;
      previous = timestamp;
      while (accumulator >= STEP && game.phase === 'PLAYING') { stepMerge(game); accumulator -= STEP; }
      drawGame(ctx, game, imagesRef.current);
      if (timestamp - lastUi >= 100 || game.phase === 'GAMEOVER') { setView({ ...game }); lastUi = timestamp; }
      if (game.phase === 'GAMEOVER') { setPhase('GAMEOVER'); return; }
      frame = requestAnimationFrame(animate);
    };
    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, [phase]);

  useEffect(() => {
    if (phase !== 'GAMEOVER' || savedRunRef.current === runRef.current) return;
    savedRunRef.current = runRef.current;
    const run = runRef.current;
    const updated = { maxScore: Math.max(stats.maxScore, view.score), totalMerges: stats.totalMerges + view.merges, totalGames: stats.totalGames + 1 };
    setStats(updated);
    try { localStorage.setItem('merge_game_stats', JSON.stringify(updated)); } catch { /* Optional local record. */ }
    setRanking([]); setRankingStatus('Caricamento classifica…'); setSaveStatus('');
    const gained = Math.max(5, Math.floor(view.score / 25));
    setXp(gained);
    const currentRun = () => runRef.current === run;
    void (async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) { if (currentRun()) setRankingStatus('Accedi per partecipare alla classifica dei profili.'); return; }
        const { error: saveError } = await supabase.rpc('submit_merge_score', { p_score: view.score });
        const { error: xpError } = await supabase.rpc('increment_mascot_exp', { p_delta: gained });
        if (currentRun()) setSaveStatus([saveError ? 'Punteggio non salvato online.' : '', xpError ? 'XP non accreditati: mascotte non disponibile o errore di rete.' : ''].filter(Boolean).join(' '));
        const entries: Rank[] = [];
        for (let offset = 0; ; offset += 100) {
          const { data, error } = await supabase.rpc('get_merge_leaderboard').range(offset, offset + 99);
          if (!currentRun()) return;
          if (error) { setRankingStatus('Classifica non disponibile al momento.'); return; }
          entries.push(...(data ?? []));
          if (!data || data.length < 100) break;
        }
        setRanking(entries); setRankingStatus(entries.length ? '' : 'Nessun risultato registrato.');
      } catch { if (currentRun()) setRankingStatus('Connessione non disponibile. Record salvato sul dispositivo.'); }
    })();
  }, [phase, stats, view]);

  const start = () => {
    runRef.current++;
    const game = createMergeGame(); gameRef.current = game;
    setView({ ...game }); setXp(0); setPhase('PLAYING');
  };
  const aim = (clientX: number) => {
    const rect = canvasRef.current?.getBoundingClientRect(), game = gameRef.current;
    if (!rect || !game || game.phase !== 'PLAYING') return;
    game.aim = Math.max(8, Math.min(WIDTH - 8, (clientX - rect.left) * WIDTH / rect.width));
  };
  const rain = rainSchedule(view.elapsed);
  const fever = view.feverUntil > view.elapsed;
  const cooldown = Math.max(0, Math.ceil((view.magnetReadyAt - view.elapsed) / 1000));

  if (phase === 'GUIDE') return <main className={styles.guide}>
    <Link href="/mascotte" className={styles.back}>← Cavia</Link>
    <header className={styles.guideHeader}><h1>Merge</h1><p>Fai spazio. Unisci. Resisti.</p></header>
    <section className={styles.guidePanel}>
      <h2>1. SCEGLI DOVE</h2><p className="text-sm text-zinc-300">Sposta il dito e rilascialo per far cadere l’oggetto.</p>
    </section>
    <section className={`${styles.guidePanel} ${styles.goldenPanel}`}>
      <h2>2. UNISCI GLI UGUALI</h2>
      <div className={styles.guideScene}>
        <img src={itemIcon(0)} alt="Carota" width={48} height={48} /><span>+</span>
        <img src={itemIcon(0)} alt="Carota" width={48} height={48} /><span className={styles.arrow}>→</span>
        <img src={itemIcon(1)} alt="Mela" width={56} height={56} />
      </div>
      <p className="text-sm text-zinc-300">Non tenere la pila oltre la linea rossa per 2 secondi.</p>
    </section>
    <section className={styles.guidePanel}>
      <h2>3. OCCHIO ALLA PIOGGIA!</h2>
      <p className="text-sm text-zinc-300 mt-1">Da 45s arrivano ondate di oggetti automatici. La freccia anticipa dove cadranno.</p>
      <div className="flex items-center justify-center gap-5 my-2">
        <img src={itemIcon(BOMB)} alt="Bomba" width={38} height={38} />
        <img src="/merge/merge_calamita.png" alt="Calamita" width={38} height={38} />
        <img src={itemIcon(ICE)} alt="Ghiaccio" width={38} height={38} />
      </div>
      <p className="text-xs text-zinc-400">Bomba: libera spazio. Calamita: avvicina gli uguali. Ghiaccio: blocca le fusioni per 6s. Attento a massi e vento!</p>
    </section>
    <button className={styles.startButton} onClick={start}>HO CAPITO, SI FONDE!</button>
  </main>;

  return <main className="min-h-dvh bg-zinc-950 text-white px-3 py-4 select-none">
    <div className="max-w-md mx-auto space-y-3">
      <header className="flex justify-between items-center bg-zinc-900 border border-white/10 rounded-2xl p-3">
        <Link href="/mascotte" className="text-xs font-black text-zinc-300 py-2">← CAVIA</Link>
        <h1 className="font-black text-amber-400">MERGE</h1>
        <span className="text-xs text-amber-200">Record <strong>{stats.maxScore}</strong></span>
      </header>
      <section className="bg-zinc-900 border border-white/10 rounded-2xl p-3 space-y-2" aria-label="Punteggio e bonus">
        <div className="grid grid-cols-4 gap-1 text-center text-[10px] text-zinc-400">
          <div>PUNTI<strong className="block text-base text-amber-400">{view.score}</strong></div>
          <div>FUSIONI<strong className="block text-base text-emerald-400">{view.merges}</strong></div>
          <div>TEMPO<strong className="block text-base text-white">{formatTime(view.elapsed)}</strong></div>
          <div>PROSSIMO<img className="w-7 h-7 mx-auto object-contain" src={itemIcon(view.next)} alt={itemName(view.next)} /></div>
        </div>
        <div className="flex justify-between text-[10px] text-amber-300"><span>{fever ? 'FRENESIA · PUNTI ×2' : 'FRENESIA · UNISCI 10 COPPIE'}</span><span>{fever ? `${Math.ceil((view.feverUntil - view.elapsed) / 1000)}s` : `${view.fever}%`}</span></div>
        <div className="h-1.5 rounded-full bg-zinc-800 overflow-hidden"><div className="h-full bg-amber-400 transition-[width]" style={{ width: `${fever ? 100 : view.fever}%` }} /></div>
      </section>
      <div className={`h-10 flex items-center justify-center rounded-xl border text-xs font-bold ${rain.active || rain.warning ? 'bg-orange-950 border-orange-500 text-orange-300' : 'bg-zinc-900 border-white/10 text-zinc-400'}`} role="status">
        {rain.active ? `↓ PIOGGIA DI PROVVISTE · ONDATA ${rain.wave + 1}` : rain.warning ? `Pioggia in ${Math.ceil((rain.nextStart - view.elapsed) / 1000)}s… prepara spazio!` : `Prossima pioggia tra ${Math.ceil((rain.nextStart - view.elapsed) / 1000)}s`}
      </div>
      <section className="relative rounded-3xl border-2 border-amber-500/40 bg-zinc-900 p-2">
        {view.overflow > 0 && <div className="absolute top-2 inset-x-8 z-10 rounded-full bg-rose-600 text-white text-center text-xs font-black p-1 pointer-events-none">PILA TROPPO ALTA! {Math.max(1, Math.ceil((2000 - view.overflow) / 1000))}s</div>}
        <canvas ref={canvasRef} width={WIDTH} height={HEIGHT} aria-label="Merge: sposta il dito e rilascialo per far cadere un oggetto"
          className="block w-full h-auto max-w-[360px] aspect-[360/460] mx-auto rounded-2xl touch-none cursor-crosshair"
          onPointerDown={event => { if (event.button !== 0 || !event.isPrimary) return; event.currentTarget.setPointerCapture(event.pointerId); aim(event.clientX); }}
          onPointerMove={event => { if (event.isPrimary) aim(event.clientX); }}
          onPointerUp={event => {
            if (!event.currentTarget.hasPointerCapture(event.pointerId)) return;
            event.currentTarget.releasePointerCapture(event.pointerId); aim(event.clientX);
            const game = gameRef.current;
            if (game && dropItem(game, game.aim)) setView({ ...game });
          }} />
        <button disabled={phase !== 'PLAYING' || cooldown > 0} onClick={() => { const game = gameRef.current; if (game && activateMagnet(game)) setView({ ...game }); }}
          className="mt-2 w-full h-11 flex justify-center items-center gap-2 rounded-xl bg-amber-400 text-zinc-950 font-black text-xs disabled:bg-zinc-800 disabled:text-zinc-500">
          <img src="/merge/merge_calamita.png" alt="" width={24} height={24} />{cooldown ? `CALAMITA · ${cooldown}s` : 'ATTIVA CALAMITA'}
        </button>
      </section>
    </div>
    <dialog ref={dialogRef} className={styles.gameOverDialog} aria-labelledby="merge-end" onCancel={event => event.preventDefault()}>
      <div className="p-5 space-y-3 text-center">
        <h2 id="merge-end" className="text-xl font-black text-rose-400">Pila traboccata… rifacciamo spazio?</h2>
        <div className="bg-zinc-950 rounded-2xl p-3 space-y-2 text-xs">
          {[['Punteggio totale', view.score], ['Record personale', Math.max(stats.maxScore, view.score)], ['Tempo sopravvissuto', formatTime(view.elapsed)], ['Fusioni', view.merges], ['XP guadagnati', `+${xp}`]].map(([label, value]) => <div key={label} className="flex justify-between"><span className="text-zinc-400">{label}</span><strong className="text-amber-300">{value}</strong></div>)}
        </div>
        <section className={styles.ranking} aria-label="Classifica Merge di tutti i profili"><h3>Classifica Merge</h3>
          {rankingStatus && <p role="status">{rankingStatus}</p>}
          {saveStatus && <p role="status">{saveStatus}</p>}
          <ol>{ranking.map((entry, index) => <li key={entry.user_id}><span>{index + 1}. {entry.nome || 'Giocatore'}</span><strong>{entry.best_score}</strong></li>)}</ol>
        </section>
        <div className="grid grid-cols-2 gap-2">
          <button autoFocus onClick={start} className="rounded-2xl py-3 font-black text-xs uppercase bg-amber-400 text-black">Riprova</button>
          <Link href="/mascotte" className="rounded-2xl py-3 font-black text-xs uppercase bg-zinc-800 text-white">Esci</Link>
        </div>
      </div>
    </dialog>
  </main>;
}
