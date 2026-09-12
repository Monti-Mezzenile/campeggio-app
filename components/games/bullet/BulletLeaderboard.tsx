'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import styles from './BulletHell.module.css';

type Entry = { user_id: string; nome: string; best_score: number };

export default function BulletLeaderboard({ score }: { score: number }) {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [status, setStatus] = useState('Caricamento classifica…');
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    let active = true;
    async function load() {
      setStatus('Caricamento classifica…');
      setFailed(false);
      try {
        const { error: saveError } = await supabase.rpc('submit_bullet_score', { p_score: score });
        if (!active) return;
        const rows: Entry[] = [];
        for (let offset = 0; ; offset += 100) {
          const { data, error } = await supabase.rpc('get_bullet_leaderboard').range(offset, offset + 99);
          if (!active) return;
          if (error) throw error;
          rows.push(...(data ?? []));
          if (!data || data.length < 100) break;
        }
        setEntries(rows);
        setFailed(Boolean(saveError));
        setStatus(saveError ? 'Punteggio non salvato. Riprova.' : rows.length ? '' : 'Nessuna partita registrata.');
      } catch {
        if (active) { setFailed(true); setStatus('Classifica non disponibile al momento.'); }
      }
    }
    void load();
    return () => { active = false; };
  }, [score, attempt]);

  return <section className={styles.leaderboard} aria-label="Classifica generale Bullet Hell">
    <h4>Classifica generale</h4>
    <p>Miglior punteggio di ogni giocatore</p>
    {status && <p role="status">{status}</p>}
    {failed && <button type="button" onClick={() => setAttempt(n => n + 1)}>Riprova</button>}
    {entries.length > 0 && <ol>{entries.map((entry, index) => <li key={entry.user_id}>
      <span className={styles.rank}>{index + 1}</span>
      <span className={styles.playerName}>{entry.nome || 'Giocatore'}</span>
      <strong>{entry.best_score.toLocaleString('it-IT')}</strong>
    </li>)}</ol>}
  </section>;
}
