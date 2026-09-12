'use client';
import { useEffect, useRef, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { connectCoop, type CoopConnection, type CoopRoom } from '@/lib/bullet/coop-session';
import styles from './BulletHell.module.css';

export default function BulletModeMenu({ onSingle, onCoop, onClose }: {
  onSingle: () => void; onCoop: (connection: CoopConnection) => void; onClose: () => void;
}) {
  const [multi, setMulti] = useState(false);
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const request = useRef<AbortController | null>(null);
  const handedOff = useRef(false);
  useEffect(() => () => { if (!handedOff.current) request.current?.abort(); }, []);
  const open = async (create: boolean) => {
    if (busy) return;
    setBusy(true); setError('');
    const abort = new AbortController(); request.current = abort;
    let room: CoopRoom | null = null;
    try {
      const { data, error } = create ? await supabase.rpc('create_bullet_room') : await supabase.rpc('join_bullet_room', { p_code: code.trim().toUpperCase() });
      if (error) throw error;
      room = data as CoopRoom;
      if (!room?.id) throw new Error('Impossibile aprire la stanza.');
      if (abort.signal.aborted) throw new Error('Operazione annullata');
      const connection = await connectCoop(room, create ? 'host' : 'guest', abort.signal);
      handedOff.current = true; onCoop(connection);
    } catch (reason) {
      if (room) void supabase.rpc('close_bullet_room', { p_id: room.id });
      if (!abort.signal.aborted) setError(reason instanceof Error ? reason.message : (reason as { message?: string })?.message || 'Connessione non disponibile. Riprova.');
    } finally { if (!abort.signal.aborted) setBusy(false); }
  };
  return <section className={`${styles.game} ${styles.modeMenu}`} aria-label="Modalità Bullet Hell">
    <img className={styles.modePoster} src="/locandinegiochi/bullet.jpeg" alt="Bullet Hell: la rivolta della cavia" width={2048} height={2048} />
    <h1>{multi ? 'Insieme nel bosco' : 'Come vuoi giocare?'}</h1>
    {!multi ? <>
      <button className={styles.primary} onClick={onSingle}>Single player</button>
      <button className={styles.secondary} onClick={() => setMulti(true)}>Multiplayer · 2 giocatori</button>
    </> : <>
      <p>Coniglio rosa per chi crea, azzurro per chi entra. Salute e speciale personali, potenziamenti di squadra. Rianima il compagno restando vicino per 3 secondi.</p>
      <button className={styles.primary} disabled={busy} onClick={() => void open(true)}>Crea una partita</button>
      <form className={styles.joinForm} onSubmit={event => { event.preventDefault(); void open(false); }}>
        <label htmlFor="bullet-room-code">Hai già un codice?</label>
        <input id="bullet-room-code" value={code} onChange={event => setCode(event.target.value.replace(/[^a-f0-9]/gi, '').toUpperCase())} maxLength={6} autoCapitalize="characters" autoComplete="off" spellCheck={false} placeholder="ABC123" disabled={busy} required minLength={6} />
        <button className={styles.secondary} disabled={busy || code.length !== 6}>Entra con il codice</button>
      </form>
      {busy && <p role="status">Connessione alla stanza…</p>}
      {error && <p role="alert">{error}</p>}
      <button disabled={busy} onClick={() => { setMulti(false); setError(''); }}>← Modalità di gioco</button>
    </>}
    <button disabled={busy} onClick={onClose}>← Cavia</button>
  </section>;
}
