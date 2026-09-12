'use client';

import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { Gamepad2, Zap, Swords, Volume2, VolumeX } from 'lucide-react';
import { useGameMusic } from '@/components/games/useGameMusic';
import { supabase } from '@/lib/supabase';
import { mountBulletGame, type BulletController, type BulletSnapshot } from '@/lib/bullet/runtime';
import styles from './BulletHell.module.css';
import BulletModeMenu from './BulletModeMenu';
import type { CoopConnection } from '@/lib/bullet/coop-session';
import BulletLeaderboard from './BulletLeaderboard';
import { upgradeIcon } from '@/lib/bullet/upgrade-icons';

const formatTime = (seconds: number) => `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;

export default function BulletHell({ onClose }: { onClose: () => void }) {
  const [mode, setMode] = useState<'single' | CoopConnection | null>(null);
  useEffect(() => () => {
    if (mode && mode !== 'single') { mode.close(); void supabase.rpc('close_bullet_room', { p_id: mode.room.id }); }
  }, [mode]);
  if (!mode) return <BulletModeMenu onSingle={() => setMode('single')} onCoop={setMode} onClose={onClose} />;
  return <BulletHellGame connection={mode === 'single' ? undefined : mode} onClose={() => { setMode(null); }} />;
}

function BulletHellGame({ onClose, connection }: { onClose: () => void; connection?: CoopConnection }) {
  const root = useRef<HTMLElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const joystick = useRef<HTMLDivElement>(null);
  const controller = useRef<BulletController | null>(null);
  const finished = useRef(false);
  const lastRun = useRef('');
  const [snapshot, setSnapshot] = useState<BulletSnapshot | null>(null);
  const [error, setError] = useState('');
  const [reward, setReward] = useState('');
  const [best, setBest] = useState(0);
  const [loadingAttempt, setLoadingAttempt] = useState(0);
  const [muted, setMuted] = useState(false);
  const [starting, setStarting] = useState(false);
  const playMusic = useGameMusic('/audio/giochi/bullet.mp3', snapshot?.state === 'playing' && !muted);

  useEffect(() => {
    const abort = new AbortController();
    const saveRun = async (run: BulletSnapshot) => {
      try {
        const previous = Number(localStorage.getItem('monti-bullet-best-score') || 0);
        const next = Math.max(Number.isFinite(previous) ? previous : 0, run.score);
        localStorage.setItem('monti-bullet-best-score', String(next));
        setBest(next);
      } catch { /* A local record is optional in private browsing. */ }
      const currentRun = () => !abort.signal.aborted && (!run.runId || run.runId === lastRun.current);
      if (run.xp <= 0) { setReward('Nessun XP maturato in questa partita.'); return; }
      setReward('Salvataggio XP della cavia…');
      try {
        const { data, error: saveError } = await supabase.rpc('increment_mascot_exp', { p_delta: run.xp });
        if (!currentRun()) return;
        setReward(!saveError && data !== null ? `+${run.xp} XP assegnati alla cavia!` : 'XP non salvati: verifica la connessione e di avere una cavia.');
      } catch {
        if (currentRun()) setReward('Connessione interrotta: salvataggio XP non confermato.');
      }
    };
    const receive = (run: BulletSnapshot) => {
      if (abort.signal.aborted) return;
      if (run.runId && run.runId !== lastRun.current) {
        lastRun.current = run.runId; finished.current = false; setReward('');
      }
      setSnapshot(run);
      if (run.state === 'over' && !finished.current) {
        finished.current = true;
        void saveRun(run);
      }
    };
    void mountBulletGame(canvas.current!, root.current!, receive, abort.signal, joystick.current!, connection).then(game => {
      if (abort.signal.aborted) game.destroy();
      else controller.current = game;
    }).catch(reason => {
      if (!abort.signal.aborted) setError(reason instanceof Error ? reason.message : 'Impossibile caricare il gioco.');
    });
    return () => { abort.abort(); controller.current?.destroy(); controller.current = null; };
  }, [loadingAttempt, connection]);

  const start = async () => {
    if (starting || (connection && (connection.role !== 'host' || !snapshot?.peerConnected))) return;
    setStarting(true);
    if (!muted) playMusic(true);
    try {
      if (connection) {
        const { error } = await supabase.rpc('start_bullet_room', { p_id: connection.room.id });
        if (error) throw error;
      }
      finished.current = false; setReward(''); controller.current?.start();
    } catch { setError('Impossibile avviare la stanza. Verifica la connessione.'); }
    finally { setStarting(false); }
  };
  const state = snapshot?.state;
  const togglePause = () => { if (state === 'paused' && !muted) playMusic(); controller.current?.pause(); };
  const chooseUpgrade = (id: string) => { if (!muted) playMusic(); controller.current?.choose(id); };
  const saving = reward === 'Salvataggio XP della cavia…';

  return <section ref={root} className={styles.game} aria-label="Bullet Hell: la rivolta della cavia">
    {snapshot && state === 'ready' && <div className={`${styles.overlay} ${styles.intro}`}>
      <h1 className={styles.srOnly}>Bullet Hell</h1>
      <img className={styles.introPoster} src="/locandinegiochi/bullet.jpeg" alt="Bullet Hell: la rivolta della cavia" width={2048} height={2048} />
      <div className={styles.visualRules}>
        <div><Gamepad2 aria-hidden="true" /><strong>Muoviti</strong><span>Joystick</span></div>
        <div><Zap aria-hidden="true" /><strong>Speciale</strong><span>Pulsante rosso</span></div>
        <div><Swords aria-hidden="true" /><strong>Resisti</strong><span>Ondate infinite</span></div>
      </div>
      {connection && <div className={styles.roomInfo}>
        <p>Codice stanza</p><strong>{connection.room.code}</strong>
        <p>{connection.role === 'host' ? 'Tu sei il coniglio rosa. Condividi il codice.' : 'Tu sei il coniglio azzurro.'}</p>
        <p role="status">{snapshot.peerConnected ? connection.role === 'host' ? 'Compagno pronto!' : 'In attesa che il creatore inizi…' : 'In attesa del compagno…'}</p>
      </div>}
      {connection?.role !== 'guest' && <button type="button" className={styles.primary} disabled={starting || Boolean(connection && !snapshot.peerConnected)} onClick={() => void start()}>GIOCA <span aria-hidden="true">→</span></button>}
      <div className={styles.menuTools}>
        <button type="button" onClick={() => setMuted(value => !value)} aria-pressed={!muted} aria-label={muted ? 'Attiva musica' : 'Disattiva musica'}>{muted ? <VolumeX aria-hidden="true" /> : <Volume2 aria-hidden="true" />}<span>{muted ? 'Audio off' : 'Audio on'}</span></button>
        <button type="button" onClick={onClose}>{connection ? '← Esci dalla stanza' : '← Modalità di gioco'}</button>
      </div>
    </div>}
    {connection && snapshot?.state !== 'ready' && <div className={styles.coopBar} role="status">
      <span>{connection.role === 'host' ? '● Rosa' : '● Azzurro'} · Compagno {snapshot?.teammateHp ?? 0}/{snapshot?.teammateMaxHp ?? 100} ♥</span>
      <span>{!snapshot?.peerConnected ? 'Compagno scollegato · partita in pausa' : snapshot.downed ? 'Il compagno può rianimarti restando vicino' : snapshot.teammateHp === 0 ? 'Resta vicino al compagno per rianimarlo' : 'Cooperativa'}</span>
    </div>}
    <div className={styles.hud}>
      <div className={styles.scoreRow}>
        <div className={styles.survival}><span>RESISTENZA</span><strong>{formatTime(snapshot?.seconds ?? 0)}</strong></div>
        <div className={styles.score}><span>PUNTI</span><strong>{(snapshot?.score ?? 0).toLocaleString('it-IT')}</strong></div>
        <div className={styles.kills}><strong>{snapshot?.kills ?? 0}</strong><span>ABBATTUTI</span></div>
      </div>
      <div className={styles.vitals}>
        <div className={`${styles.vitalCard} ${(snapshot?.hp ?? 100) <= (snapshot?.maxHp ?? 100) * 0.25 ? styles.lowHealth : ''}`}>
          <div className={styles.vitalLabel}><span>SALUTE</span><strong>{snapshot?.hp ?? 100}<small> / {snapshot?.maxHp ?? 100}</small></strong></div>
          <div className={styles.healthTrack} role="progressbar" aria-label="Salute" aria-valuemin={0} aria-valuemax={snapshot?.maxHp ?? 100} aria-valuenow={snapshot?.hp ?? 100}><span style={{ width: `${100 * (snapshot?.hp ?? 100) / (snapshot?.maxHp ?? 100)}%` }} /></div>
        </div>
        <div className={styles.vitalCard}>
          <div className={styles.vitalLabel}><span>LIVELLO <b>{snapshot?.level ?? 1}</b></span><small>{Math.floor(snapshot?.exp ?? 0)} / {snapshot?.expToNext ?? 100}</small></div>
          <div className={styles.expTrack} role="progressbar" aria-label="Esperienza per il prossimo livello" aria-valuemin={0} aria-valuemax={snapshot?.expToNext ?? 100} aria-valuenow={snapshot?.exp ?? 0}><span style={{ width: `${100 * (snapshot?.exp ?? 0) / (snapshot?.expToNext ?? 100)}%` }} /></div>
        </div>
      </div>
    </div>
    <div className={styles.waveStrip} aria-live="polite"><strong>ONDATA {snapshot?.wave.number ?? 1}</strong><span>{snapshot?.wave.breather ? 'Riorganizzati' : snapshot?.wave.title ?? 'Sciame'}</span><small>{snapshot?.wave.secondsLeft ?? 40}s</small></div>
    <div className={styles.arena}>
      {snapshot && snapshot.bosses.length > 0 && <div className={styles.bossHud}>
        {snapshot.bosses.map(boss => <div key={boss.id} className={styles.bossRow}>
          <div><strong>{boss.name}</strong><span>{boss.attacking ? 'ATTACCO IN ARRIVO' : boss.enraged ? 'FURIA' : 'BOSS'}</span></div>
          <div className={styles.bossTrack} role="progressbar" aria-label={`Salute ${boss.name}`} aria-valuemin={0} aria-valuemax={boss.maxHp} aria-valuenow={boss.hp}><span style={{ width: `${100 * boss.hp / boss.maxHp}%` }} /></div>
        </div>)}
      </div>}
      <canvas ref={canvas} className={styles.canvas} tabIndex={state === 'ready' ? -1 : 0} aria-label="Arena di gioco. Muoviti con WASD o frecce, Spazio per lo speciale, Escape per la pausa. Su telefono usa il joystick sotto l’arena." />
      {!snapshot && !error && <div className={styles.overlay} role="status"><p>Preparazione del bosco…</p></div>}
      {error && <div className={styles.overlay} role="alert"><h3>Il bosco non si apre</h3><p>{error}</p><button type="button" onClick={() => { setError(''); setLoadingAttempt(n => n + 1); }}>Riprova</button><button type="button" onClick={onClose}>{connection ? 'Esci dalla stanza' : 'Modalità di gioco'}</button></div>}
      {snapshot && state === 'paused' && <div className={styles.overlay}>
        <button type="button" className={styles.soundToggle} onClick={() => setMuted(value => !value)} aria-label={muted ? 'Attiva musica' : 'Disattiva musica'}>{muted ? <VolumeX /> : <Volume2 />}</button>
        <span className={styles.tag}>PRENDI FIATO</span><h3>Al riparo.</h3>
        <p>{snapshot.kills} nemici abbattuti · {snapshot.xp} XP maturati</p>
        <button type="button" className={styles.primary} disabled={Boolean(connection && !snapshot.peerConnected)} onClick={togglePause}>Riprendi la partita</button>
        <button type="button" className={styles.secondary} onClick={() => controller.current?.finish()}>Termina e riscuoti XP</button>
      </div>}
      {snapshot && state === 'upgrade' && <div className={`${styles.overlay} ${styles.upgrades}`}>
        <span className={styles.tag}>LIVELLO {snapshot.level}</span><h3>Scegli come<br />fare danni.</h3>
        {connection && <p>Il potenziamento scelto vale per entrambi.</p>}
        <div className={styles.choices}>{snapshot.choices.map(choice => <button type="button" key={choice.id} onClick={() => chooseUpgrade(choice.id)}>
          <img className={styles.upgradeIcon} src={upgradeIcon(choice.id)} alt="" width={56} height={56} draggable={false} />
          <div className={styles.upgradeCopy}><strong>{choice.label}<small>{choice.maxLevel ? `${choice.level} / ${choice.maxLevel}` : 'CURA'}</small></strong>
          {choice.maxLevel > 0 && <span className={styles.tierDots} aria-hidden="true">{[1, 2, 3].map(tier => <i key={tier} className={tier <= choice.level ? styles.tierFilled : ''} />)}</span>}
          <span>{choice.description}</span></div>
        </button>)}</div>
      </div>}
      {snapshot && state === 'over' && <div className={styles.overlay}>
        <span className={styles.tag}>FINE DELLA CORSA</span>
        <h3>{snapshot.hp > 0 ? 'Per oggi basta.' : 'Ti hanno preso.'}</h3>
        <p>{formatTime(snapshot.seconds)} di resistenza · {snapshot.kills} nemici<br />{snapshot.score.toLocaleString('it-IT')} punti · Record: {best.toLocaleString('it-IT')}</p>
        <strong className={styles.reward}>+{snapshot.xp} XP</strong><p role="status">{reward}</p>
        <BulletLeaderboard score={snapshot.score} />
        {connection?.role === 'guest' ? <p>Il creatore può avviare un’altra rivolta.</p> : <button type="button" className={styles.primary} disabled={starting || saving || Boolean(connection && !snapshot.peerConnected)} onClick={() => void start()}>Un’altra rivolta</button>}
        <button type="button" className={styles.secondary} disabled={saving} onClick={onClose}>{connection ? 'Esci dalla stanza' : 'Modalità di gioco'}</button>
      </div>}
      {snapshot && state === 'playing' && <div className={styles.statusEffects}>
        {snapshot.shield > 0 && <span>Scudo {snapshot.shield}s</span>}{snapshot.speed > 0 && <span>Caffè {snapshot.speed}s</span>}
      </div>}
    </div>
    <div className={styles.gamepad}>
      <div ref={joystick} className={styles.joystick} role="group" aria-label="Joystick di movimento" aria-disabled={state !== 'playing'}>
        <span className={styles.joystickKnob} aria-hidden="true" />
      </div>
      <div className={styles.specialControl}>
        <span className={styles.specialStatus} aria-live="polite">{state !== 'playing' ? 'SPECIALE' : snapshot?.specialIn ? `${snapshot.specialIn}s` : 'PRONTA'}</span>
        <div className={`${styles.specialRing} ${state === 'playing' && snapshot?.specialIn === 0 ? styles.specialReady : ''}`} style={{ '--charge': `${(snapshot?.specialCharge ?? 1) * 360}deg` } as CSSProperties}>
        <button type="button" className={styles.special} aria-label={snapshot?.specialIn ? `Mossa speciale in ricarica: ${snapshot.specialIn} secondi` : 'Mossa speciale'} disabled={state !== 'playing'} aria-disabled={state !== 'playing' || (snapshot?.specialIn ?? 0) > 0} onPointerDown={event => event.preventDefault()} onClick={() => { if (state === 'playing' && snapshot?.specialIn === 0) controller.current?.special(); }} />
        </div>
      </div>
      <div className={styles.padActions}>
        <button type="button" className={styles.pause} aria-label={state === 'paused' ? 'Riprendi la partita' : 'Pausa'} disabled={state !== 'playing' && state !== 'paused'} onClick={togglePause}>
          <span aria-hidden="true" className={state === 'paused' ? styles.resumeIcon : styles.pauseIcon} />
        </button>
      </div>
    </div>
  </section>;
}
