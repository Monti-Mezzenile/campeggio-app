'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import GamePause from '@/components/games/GamePause';
import { useGameMusic } from '@/components/games/useGameMusic';
import { supabase } from '@/lib/supabase';
import styles from '../scorribanda/grill.module.css';
import layout from './merge.module.css';
import {
  MERGE_ITEMS, BOMB, ROCK, ICE, WIDTH, HEIGHT, RED_LINE, STEP,
  itemIcon, itemName, itemRadius, createMergeGame, dropItem, activateMagnet, stepMerge, rainSchedule,
  type MergeGame,
} from '@/lib/merge-game';

interface Stats { maxScore: number; totalMerges: number; totalGames: number }
interface Rank { user_id: string; nome: string; best_score: number }

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  life: number;
  maxLife: number;
  size: number;
}

interface FloatingText {
  text: string;
  x: number;
  y: number;
  vy: number;
  life: number;
  maxLife: number;
  color: string;
  fontSize: number;
}

const formatTime = (ms: number) => `${Math.floor(ms / 60000)}:${String(Math.floor(ms / 1000) % 60).padStart(2, '0')}`;

function getDropInterval(elapsedMs: number): number {
  return Math.max(400, 2200 - Math.floor(elapsedMs / 1000) * 25);
}

function spawnMergeEffects(particles: Particle[], floatingTexts: FloatingText[], x: number, y: number, points: number, isFever: boolean) {
  const colors = ['#f59e0b', '#fbbf24', '#fef08a', '#38bdf8', '#f43f5e', '#ffffff'];
  for (let i = 0; i < 20; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 2.5 + Math.random() * 5.5;
    particles.push({
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - 1.5,
      color: colors[Math.floor(Math.random() * colors.length)],
      life: 0,
      maxLife: 22 + Math.random() * 14,
      size: 3 + Math.random() * 4,
    });
  }

  floatingTexts.push({
    text: `MERGE! +${points}`,
    x: Math.max(65, Math.min(WIDTH - 65, x)),
    y: Math.max(80, y - 10),
    vy: -1.4,
    life: 0,
    maxLife: 42,
    color: isFever ? '#fef08a' : '#fbbf24',
    fontSize: 17,
  });
}

function drawGame(
  ctx: CanvasRenderingContext2D,
  game: MergeGame,
  images: Map<string, HTMLImageElement>,
  nextAutoDropAt: number,
  particles: Particle[],
  floatingTexts: FloatingText[],
  shakeFrames: number
) {
  ctx.save();

  // Screen shake al merge o all'impatto
  if (shakeFrames > 0) {
    const shakeX = (Math.random() - 0.5) * 7;
    const shakeY = (Math.random() - 0.5) * 7;
    ctx.translate(shakeX, shakeY);
  }

  ctx.clearRect(0, 0, WIDTH, HEIGHT);

  // Sfondo dinamico con gradiente sferico d'ambiente
  const isFever = game.feverUntil > game.elapsed;
  const bgGrad = ctx.createLinearGradient(0, 0, 0, HEIGHT);
  if (isFever) {
    bgGrad.addColorStop(0, '#3b1700');
    bgGrad.addColorStop(0.5, '#1e0a02');
    bgGrad.addColorStop(1, '#09090b');
  } else {
    bgGrad.addColorStop(0, '#151520');
    bgGrad.addColorStop(0.5, '#0e0e14');
    bgGrad.addColorStop(1, '#070709');
  }
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  // Aura luminosa di sfondo al centro del canvas
  const auraGrad = ctx.createRadialGradient(WIDTH / 2, HEIGHT / 2, 10, WIDTH / 2, HEIGHT / 2, WIDTH * 0.7);
  auraGrad.addColorStop(0, isFever ? 'rgba(245, 158, 11, 0.18)' : 'rgba(56, 189, 248, 0.06)');
  auraGrad.addColorStop(1, 'transparent');
  ctx.fillStyle = auraGrad;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  // Pulsazione d'emergenza in caso di overflow
  if (game.overflow > 0) {
    const pulse = (Math.sin(game.elapsed / 90) + 1) / 2;
    ctx.fillStyle = `rgba(244, 63, 94, ${0.12 + pulse * 0.18})`;
    ctx.fillRect(0, 0, WIDTH, HEIGHT);
  }

  // Linea limite rossa al neon
  ctx.save();
  ctx.lineWidth = game.overflow ? 3 : 2;
  ctx.strokeStyle = game.overflow ? '#f43f5e' : 'rgba(251, 113, 133, 0.65)';
  ctx.shadowColor = '#f43f5e';
  ctx.shadowBlur = game.overflow ? 14 : 6;
  ctx.setLineDash([6, 4]);
  ctx.beginPath();
  ctx.moveTo(8, RED_LINE);
  ctx.lineTo(WIDTH - 8, RED_LINE);
  ctx.stroke();
  ctx.restore();

  // Barra del timer di caduta automatica lucida
  if (game.phase === 'PLAYING') {
    const currentInterval = getDropInterval(game.elapsed);
    const remaining = Math.max(0, nextAutoDropAt - game.elapsed);
    const progress = Math.min(1, remaining / currentInterval);

    ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
    ctx.fillRect(12, 6, WIDTH - 24, 6);

    const timerGrad = ctx.createLinearGradient(0, 0, WIDTH, 0);
    if (progress < 0.25) {
      timerGrad.addColorStop(0, '#ef4444');
      timerGrad.addColorStop(1, '#f87171');
    } else if (progress < 0.5) {
      timerGrad.addColorStop(0, '#f59e0b');
      timerGrad.addColorStop(1, '#fbbf24');
    } else {
      timerGrad.addColorStop(0, '#0284c7');
      timerGrad.addColorStop(1, '#38bdf8');
    }
    ctx.fillStyle = timerGrad;
    ctx.fillRect(12, 6, (WIDTH - 24) * progress, 6);
  }

  // Rendering degli elementi con bagliori e ombre
  const drawItem = (type: number, x: number, y: number, radius: number) => {
    const img = images.get(itemIcon(type));
    ctx.save();
    ctx.shadowColor = isFever ? 'rgba(245, 158, 11, 0.65)' : 'rgba(0, 0, 0, 0.6)';
    ctx.shadowBlur = isFever ? 12 : 8;
    ctx.shadowOffsetY = 4;

    if (img?.complete && img.naturalWidth > 0) {
      ctx.drawImage(img, x - radius, y - radius, radius * 2, radius * 2);
    } else {
      ctx.fillStyle = type < 0 ? '#94a3b8' : '#fbbf24';
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#09090b';
      ctx.font = 'bold 10px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(itemName(type), x, y + 3);
    }
    ctx.restore();
  };

  // Rendering oggetti fermi sul campo
  for (const body of game.bodies) {
    const radius = itemRadius(body.type);
    drawItem(body.type, body.x, body.y, radius);
    if (body.frozenUntil > game.elapsed) {
      ctx.save();
      ctx.fillStyle = 'rgba(56, 189, 248, 0.35)';
      ctx.strokeStyle = '#38bdf8';
      ctx.shadowColor = '#38bdf8';
      ctx.shadowBlur = 8;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(body.x, body.y, radius + 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    }
  }

  // Traiettoria e mirino di caduta
  if (game.phase === 'PLAYING') {
    const radius = itemRadius(game.current);
    const x = Math.max(radius + 8, Math.min(WIDTH - radius - 8, game.aim));

    ctx.save();
    const lineGrad = ctx.createLinearGradient(0, 42, 0, HEIGHT - 12);
    lineGrad.addColorStop(0, isFever ? 'rgba(245, 158, 11, 0.85)' : 'rgba(251, 191, 36, 0.55)');
    lineGrad.addColorStop(1, 'rgba(251, 191, 36, 0.05)');
    ctx.strokeStyle = lineGrad;
    ctx.lineWidth = 2;
    ctx.setLineDash([6, 4]);
    ctx.lineDashOffset = -(game.elapsed / 20) % 10;
    ctx.beginPath();
    ctx.moveTo(x, 42);
    ctx.lineTo(x, HEIGHT - 12);
    ctx.stroke();
    ctx.restore();

    ctx.globalAlpha = game.elapsed >= game.dropReadyAt ? 1 : 0.4;
    drawItem(game.current, x, radius + 10, radius);
    ctx.globalAlpha = 1;
  }

  // Indicatore Pioggia imminente
  if (game.incoming) {
    const { x, type } = game.incoming;
    const bounceY = Math.sin(game.elapsed / 100) * 4;
    ctx.save();
    ctx.fillStyle = '#fb923c';
    ctx.shadowColor = '#fb923c';
    ctx.shadowBlur = 8;
    ctx.font = '900 20px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('↓', x, 78 + bounceY);
    ctx.restore();
    ctx.globalAlpha = 0.85;
    drawItem(type, x, 28, 16);
    ctx.globalAlpha = 1;
  }

  // Particelle
  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    p.x += p.vx;
    p.y += p.vy;
    p.vy += 0.14;
    p.life++;

    const alpha = Math.max(0, 1 - p.life / p.maxLife);
    if (alpha <= 0) {
      particles.splice(i, 1);
      continue;
    }

    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = p.color;
    ctx.shadowColor = p.color;
    ctx.shadowBlur = 6;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size * alpha, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  // Testi fluttuanti (Punti / MERGE!)
  for (let i = floatingTexts.length - 1; i >= 0; i--) {
    const ft = floatingTexts[i];
    ft.y += ft.vy;
    ft.life++;

    const alpha = Math.max(0, 1 - ft.life / ft.maxLife);
    if (alpha <= 0) {
      floatingTexts.splice(i, 1);
      continue;
    }

    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.font = `900 ${ft.fontSize}px system-ui, sans-serif`;
    ctx.textAlign = 'center';
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 4;
    ctx.strokeText(ft.text, ft.x, ft.y);
    ctx.fillStyle = ft.color;
    ctx.shadowColor = ft.color;
    ctx.shadowBlur = 8;
    ctx.fillText(ft.text, ft.x, ft.y);
    ctx.restore();
  }

  // Banner fluttuante degli avvisi
  if (game.noticeUntil > game.elapsed) {
    const remaining = game.noticeUntil - game.elapsed;
    const alpha = Math.min(1, remaining / 250);
    ctx.save();
    ctx.globalAlpha = alpha;

    const pillW = 200, pillH = 28;
    const pillX = (WIDTH - pillW) / 2;
    const pillY = 14;

    ctx.fillStyle = 'rgba(24, 24, 27, 0.95)';
    ctx.strokeStyle = isFever ? '#f59e0b' : '#fbbf24';
    ctx.lineWidth = 2;
    ctx.shadowColor = isFever ? '#f59e0b' : '#fbbf24';
    ctx.shadowBlur = 10;

    ctx.beginPath();
    if (typeof ctx.roundRect === 'function') {
      ctx.roundRect(pillX, pillY, pillW, pillH, 14);
    } else {
      ctx.rect(pillX, pillY, pillW, pillH);
    }
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = isFever ? '#fef08a' : '#fde68a';
    ctx.font = '900 12px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(game.notice, WIDTH / 2, pillY + 18);
    ctx.restore();
  }

  ctx.restore();
}

export default function MergePage() {
  const [phase, setPhase] = useState<'GUIDE' | 'PLAYING' | 'PAUSED' | 'GAMEOVER'>('GUIDE');
  const playMusic = useGameMusic('/audio/giochi/merge.mp3', phase === 'PLAYING');
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

  const moveDirRef = useRef<-1 | 0 | 1>(0);
  const nextAutoDropAtRef = useRef<number>(2200);

  // Refs per FX visivi
  const prevScoreRef = useRef<number>(0);
  const particlesRef = useRef<Particle[]>([]);
  const floatingTextsRef = useRef<FloatingText[]>([]);
  const shakeRef = useRef<number>(0);

  useEffect(() => {
    try {
      const saved = localStorage.getItem('merge_game_stats');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (['maxScore', 'totalMerges', 'totalGames'].every(key => Number.isFinite(parsed[key]) && parsed[key] >= 0)) setStats(parsed);
      }
    } catch { /* Local storage fallback */ }
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
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof Element && e.target.closest('button, a, input, textarea, select')) return;
      if (['ArrowLeft', 'ArrowRight'].includes(e.key)) e.preventDefault();
      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') moveDirRef.current = -1;
      if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') moveDirRef.current = 1;
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      if ((e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') && moveDirRef.current === -1) moveDirRef.current = 0;
      if ((e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') && moveDirRef.current === 1) moveDirRef.current = 0;
    };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
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

      while (accumulator >= STEP && game.phase === 'PLAYING') {
        if (moveDirRef.current !== 0) {
          const radius = itemRadius(game.current);
          const moveSpeed = 5.5;
          game.aim = Math.max(radius + 8, Math.min(WIDTH - radius - 8, game.aim + moveDirRef.current * moveSpeed));
        }

        stepMerge(game);
        accumulator -= STEP;

        if (game.elapsed >= nextAutoDropAtRef.current && game.elapsed >= game.dropReadyAt) {
          if (dropItem(game, game.aim)) {
            const currentInterval = getDropInterval(game.elapsed);
            nextAutoDropAtRef.current = game.elapsed + currentInterval;
          }
        }
      }

      // Rileva Merge per innescare gli effetti visivi esplosivi
      if (game.score > prevScoreRef.current) {
        const deltaPoints = game.score - prevScoreRef.current;
        shakeRef.current = 8;

        const lastBody = game.bodies[game.bodies.length - 1];
        const targetX = lastBody ? lastBody.x : WIDTH / 2;
        const targetY = lastBody ? lastBody.y : HEIGHT / 2;

        spawnMergeEffects(particlesRef.current, floatingTextsRef.current, targetX, targetY, deltaPoints, game.feverUntil > game.elapsed);
        prevScoreRef.current = game.score;
      }

      if (shakeRef.current > 0) shakeRef.current--;

      drawGame(ctx, game, imagesRef.current, nextAutoDropAtRef.current, particlesRef.current, floatingTextsRef.current, shakeRef.current);

      if (timestamp - lastUi >= 100 || game.phase === 'GAMEOVER') {
        setView({ ...game });
        lastUi = timestamp;
      }

      if (game.phase === 'GAMEOVER') {
        setPhase('GAMEOVER');
        return;
      }
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
    try { localStorage.setItem('merge_game_stats', JSON.stringify(updated)); } catch { /* Optional local record */ }
    setRanking([]); setRankingStatus('Caricamento classifica…'); setSaveStatus('');
    const gained = Math.floor(view.score / 25);
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
    playMusic(true);
    runRef.current++;
    moveDirRef.current = 0;
    const game = createMergeGame();
    gameRef.current = game;
    prevScoreRef.current = 0;
    particlesRef.current = [];
    floatingTextsRef.current = [];
    nextAutoDropAtRef.current = 2200;
    setView({ ...game }); setXp(0); setPhase('PLAYING');
  };

  const rain = rainSchedule(view.elapsed);
  const fever = view.feverUntil > view.elapsed;
  const cooldown = Math.max(0, Math.ceil((view.magnetReadyAt - view.elapsed) / 1000));
  const currentIntervalSec = (getDropInterval(view.elapsed) / 1000).toFixed(1);

  if (phase === 'GUIDE') return <main className={styles.guide}>
    <Link href="/mascotte" className={styles.back}>← Cavia</Link>
    <header className={styles.guideHeader}><h1>Merge</h1><p>Fai spazio. Unisci. Resisti.</p></header>
    <section className={styles.guidePanel}>
      <h2>1. MUOVI E FAI CADERE</h2>
      <p className="text-sm text-zinc-300">
        Usa le frecce ◄ ► per posizionare l’oggetto. <strong>Attenzione:</strong> gli oggetti CADONO DA SOLI a velocità sempre maggiore! Scegli il punto e lascia cadere.
      </p>
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
      <div className={styles.ruleGrid}>
        {[
          { icon: itemIcon(BOMB), name: 'Bomba', rule: 'Esplode e libera spazio attorno a sé.' },
          { icon: '/merge/merge_calamita.png', name: 'Calamita', rule: 'Tocca il pulsante: avvicina gli uguali.' },
          { icon: itemIcon(ICE), name: 'Ghiaccio', rule: 'Blocca le fusioni del cibo toccato per 6s.' },
          { icon: itemIcon(ROCK), name: 'Masso', rule: 'Occupa spazio e non si fonde.' },
          { icon: '/merge/tornado.png', name: 'Vento', rule: 'Una raffica sposta la pila.' },
          { icon: '/merge/merge_peperoncino.png', name: 'Frenesia', rule: 'Dopo 10 fusioni: punti ×2 per 8s.' },
        ].map(item => <div key={item.name} className={styles.ruleItem}>
          <img src={item.icon} alt="" className={styles.ruleIcon} />
          <div><strong>{item.name}</strong><p>{item.rule}</p></div>
        </div>)}
      </div>
    </section>
    <button className={styles.startButton} onClick={start}>HO CAPITO, SI FONDE!</button>
  </main>;

  return <main className={layout.gamePage}>
    <div className={layout.gameLayout}>
      <header className="flex justify-between items-center bg-zinc-900/90 border border-amber-500/20 backdrop-blur-md rounded-2xl p-3 shadow-[0_0_15px_rgba(245,158,11,0.1)]">
        <Link href="/mascotte" onClick={event => { if (phase === 'PLAYING') { event.preventDefault(); moveDirRef.current = 0; setPhase('PAUSED'); } }} className="text-xs font-black text-zinc-300 py-2 hover:text-amber-400 transition-colors">← CAVIA</Link>
        <h1 className="font-black text-amber-400 tracking-wider text-base drop-shadow-[0_0_8px_rgba(245,158,11,0.5)]">MERGE</h1>
        {(phase === 'PLAYING' || phase === 'PAUSED') && <GamePause paused={phase === 'PAUSED'} onPause={() => { moveDirRef.current = 0; setPhase('PAUSED'); }} onResume={() => { playMusic(); setPhase('PLAYING'); }} onFinish={() => { const game = gameRef.current; if (game) { game.phase = 'GAMEOVER'; setView({ ...game }); setPhase('GAMEOVER'); } }} score={view.score} xp={Math.floor(view.score / 25)} />}
        <span className="text-xs text-amber-200">Record <strong className="text-amber-400 font-extrabold">{stats.maxScore}</strong></span>
      </header>

      <section className="bg-zinc-900/90 border border-white/10 rounded-2xl p-3 space-y-2.5 shadow-[0_4px_20px_rgba(0,0,0,0.5)]" aria-label="Punteggio e bonus">
        <div className="grid grid-cols-4 gap-1.5 text-center text-[10px] text-zinc-400">
          <div className="bg-zinc-950/60 p-1.5 rounded-xl border border-white/5">PUNTI<strong className="block text-base font-black text-amber-400 drop-shadow">{view.score}</strong></div>
          <div className="bg-zinc-950/60 p-1.5 rounded-xl border border-white/5">CADUTA<strong className="block text-base font-black text-sky-400 drop-shadow">{currentIntervalSec}s</strong></div>
          <div className="bg-zinc-950/60 p-1.5 rounded-xl border border-white/5">TEMPO<strong className="block text-base font-black text-white drop-shadow">{formatTime(view.elapsed)}</strong></div>
          <div className="bg-zinc-950/60 p-1.5 rounded-xl border border-white/5">PROSSIMO<img className="w-7 h-7 mx-auto object-contain drop-shadow" src={itemIcon(view.next)} alt={itemName(view.next)} /></div>
        </div>

        <div className="flex justify-between text-[10px] text-amber-300 font-bold px-1">
          <span>{fever ? '🔥 FRENESIA · PUNTI ×2' : '⚡ FRENESIA · UNISCI 10 COPPIE'}</span>
          <span>{fever ? `${Math.ceil((view.feverUntil - view.elapsed) / 1000)}s` : `${view.fever}%`}</span>
        </div>
        <div className="h-2 rounded-full bg-zinc-950 border border-amber-500/20 overflow-hidden p-0.5">
          <div className={`h-full rounded-full transition-all duration-300 ${fever ? 'bg-gradient-to-r from-amber-500 via-yellow-300 to-amber-500 shadow-[0_0_12px_rgba(245,158,11,0.8)] animate-pulse' : 'bg-amber-400'}`} style={{ width: `${fever ? 100 : view.fever}%` }} />
        </div>
      </section>

      <div className={`h-10 flex items-center justify-center rounded-xl border text-xs font-black transition-all shadow-md ${rain.active || rain.warning ? 'bg-orange-950/90 border-orange-500 text-orange-200 shadow-[0_0_15px_rgba(249,115,22,0.3)] animate-pulse' : 'bg-zinc-900/90 border-white/10 text-zinc-300'}`} role="status">
        {rain.active ? `↓ PIOGGIA DI PROVVISTE · ONDATA ${rain.wave + 1}` : rain.warning ? `⚠️ Pioggia in ${Math.ceil((rain.nextStart - view.elapsed) / 1000)}s… prepara spazio!` : `Prossima pioggia tra ${Math.ceil((rain.nextStart - view.elapsed) / 1000)}s`}
      </div>

      {/* ARENA E CONTROLLI */}
      <section className={`${layout.arena} relative rounded-3xl border-2 border-amber-500/40 bg-zinc-950 p-2 shadow-[0_0_25px_rgba(245,158,11,0.15)]`}>
        {view.overflow > 0 && <div className="absolute top-2 inset-x-8 z-10 rounded-full bg-rose-600/90 border border-rose-400 text-white text-center text-xs font-black p-1.5 shadow-[0_0_15px_rgba(225,29,72,0.6)] pointer-events-none animate-bounce">PILA TROPPO ALTA! {Math.max(1, Math.ceil((2000 - view.overflow) / 1000))}s</div>}

        <div className={layout.canvasViewport}>
          <canvas ref={canvasRef} width={WIDTH} height={HEIGHT} aria-label="Merge Game Arena" className={layout.canvas} />
        </div>

        {/* CONTROLLI GLOSSY */}
        <div className="mt-2.5 grid shrink-0 grid-cols-2 gap-2">
          <button
            onPointerDown={(e) => { e.preventDefault(); moveDirRef.current = -1; }}
            onPointerUp={() => { moveDirRef.current = 0; }}
            onPointerLeave={() => { moveDirRef.current = 0; }}
            onPointerCancel={() => { moveDirRef.current = 0; }}
            className="h-12 bg-gradient-to-b from-zinc-800 to-zinc-900 active:from-amber-500 active:to-amber-600 active:text-black border border-white/15 active:border-amber-300 rounded-xl font-black text-xl flex items-center justify-center transition-all shadow-lg active:scale-95 touch-none"
            aria-label="Sposta a sinistra"
          >
            ◄
          </button>

          <button
            onPointerDown={(e) => { e.preventDefault(); moveDirRef.current = 1; }}
            onPointerUp={() => { moveDirRef.current = 0; }}
            onPointerLeave={() => { moveDirRef.current = 0; }}
            onPointerCancel={() => { moveDirRef.current = 0; }}
            className="h-12 bg-gradient-to-b from-zinc-800 to-zinc-900 active:from-amber-500 active:to-amber-600 active:text-black border border-white/15 active:border-amber-300 rounded-xl font-black text-xl flex items-center justify-center transition-all shadow-lg active:scale-95 touch-none"
            aria-label="Sposta a destra"
          >
            ►
          </button>
        </div>

        {/* PULSANTE CALAMITA GLOSSY */}
        <button disabled={phase !== 'PLAYING' || cooldown > 0} onClick={() => { const game = gameRef.current; if (game && activateMagnet(game)) setView({ ...game }); }}
          className="mt-2 w-full h-11 shrink-0 flex justify-center items-center gap-2 rounded-xl bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 text-zinc-950 font-black text-xs disabled:from-zinc-800 disabled:to-zinc-900 disabled:text-zinc-500 shadow-[0_0_15px_rgba(251,191,36,0.3)] disabled:shadow-none border border-amber-300/40 disabled:border-white/5 active:scale-[0.98] transition-all">
          <img src="/merge/merge_calamita.png" alt="" width={22} height={22} className="drop-shadow" />{cooldown ? `CALAMITA · ${cooldown}s` : 'ATTIVA CALAMITA'}
        </button>
      </section>
    </div>

    <dialog ref={dialogRef} className={styles.gameOverDialog} aria-labelledby="merge-end" onCancel={event => event.preventDefault()}>
      <div className="p-5 space-y-3 text-center">
        <h2 id="merge-end" className="text-xl font-black text-rose-400">Turno finito. Rifacciamo spazio?</h2>
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