'use client';

import { useEffect, useRef } from 'react';
import styles from '@/app/scorribanda/grill.module.css';

export default function GamePause({ paused, onPause, onResume, onFinish, score, xp, buttonClassName = '' }: {
  paused: boolean; onPause: () => void; onResume: () => void; onFinish: () => void; score: number; xp: number; buttonClassName?: string;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    if (paused) dialog.current?.showModal();
    else dialog.current?.close();
  }, [paused]);
  return <>
    <button type="button" onClick={onPause} className={`rounded-xl border border-white/20 bg-zinc-800 px-3 py-2 text-xs font-black text-white ${buttonClassName}`}>Ⅱ Pausa</button>
    <dialog ref={dialog} className={styles.gameOverDialog} aria-label="Partita in pausa" onCancel={event => { event.preventDefault(); onResume(); }}>
      <div className="p-5 text-center space-y-4">
        <h2 className="text-xl font-black text-amber-300">Il disastro può aspettare.</h2>
        <p className="text-sm text-zinc-300">Partita in pausa. Prenditi fiato.</p>
        <p className="font-bold text-white">{Math.floor(score)} punti · +{xp} XP maturati</p>
        <button type="button" onClick={onResume} className={styles.startButton}>Riprendi</button>
        <button type="button" onClick={() => { dialog.current?.close(); onFinish(); }} className="w-full rounded-xl bg-zinc-800 p-3 font-bold text-white">Termina e salva</button>
        <p className="text-xs text-zinc-400">Conservi punti e XP guadagnati e passi al riepilogo. Per salvarli, usa questo tasto prima di chiudere la pagina.</p>
      </div>
    </dialog>
  </>;
}
