'use client';

import { useEffect, useRef, useState, type CSSProperties } from 'react';
import styles from './EvolutionSequence.module.css';

type EvolutionForm = { name: string; image: string };
type Props = {
  from: EvolutionForm;
  to: EvolutionForm;
  audioContext?: AudioContext | null;
  onComplete: () => void;
};

// Unlock audio during the feeding gesture; playback starts with the animation,
// after the new phase has been saved, rather than during the database request.
export function prepareEvolutionAudio(): AudioContext | null {
  try {
    const context = new AudioContext();
    void context.resume().catch(() => {});
    return context;
  } catch {
    return null;
  }
}

export default function EvolutionSequence({ from, to, audioContext, onComplete }: Props) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const finishRef = useRef<() => void>(() => {});
  const continueRef = useRef<HTMLButtonElement>(null);
  const [finished, setFinished] = useState(false);
  const [running, setRunning] = useState(false);
  const [revealed, setRevealed] = useState(false);
  useEffect(() => { if (finished) continueRef.current?.focus(); }, [finished]);

  useEffect(() => {
    const dialog = dialogRef.current;
    const previousFocus = document.activeElement;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    dialog?.showModal();
    const controller = new AbortController();
    let cancelled = false;
    let settled = false;
    let source: AudioBufferSourceNode | undefined;
    // A slow or unavailable audio file must never trap the user on a black screen.
    const loadTimer = window.setTimeout(() => controller.abort(), 4000);
    const context = audioContext ?? prepareEvolutionAudio();

    const finish = () => {
      settled = true;
      controller.abort();
      window.clearTimeout(loadTimer);
      window.clearTimeout(revealTimer);
      window.clearTimeout(completeTimer);
      source?.stop();
      setRunning(true);
      setRevealed(true);
      setFinished(true);
    };
    finishRef.current = finish;

    // The visual timeline starts independently: blocked iOS audio must not stall it.
    const visualFrame = requestAnimationFrame(() => setRunning(true));
    const revealTimer = window.setTimeout(() => setRevealed(true), 14000);
    const completeTimer = window.setTimeout(finish, 17000);
    const start = async () => {
      try {
        if (context) {
          const response = await fetch('/audio/trasformazione.mp3', { signal: controller.signal });
          if (!response.ok) throw new Error('Audio unavailable');
          const buffer = await context.decodeAudioData(await response.arrayBuffer());
          if (cancelled || settled) return;
          source = context.createBufferSource();
          const gain = context.createGain();
          source.buffer = buffer;
          source.connect(gain);
          gain.connect(context.destination);
          const now = context.currentTime;
          gain.gain.setValueAtTime(0.8, now);
          gain.gain.setValueAtTime(0.8, now + 16.5);
          gain.gain.linearRampToValueAtTime(0, now + 17);
          source.start(now);
          source.stop(now + 17);
        }
      } catch {
        // The visual sequence still works if audio is unavailable or blocked.
      }
      if (cancelled || settled) return;
      window.clearTimeout(loadTimer);
    };
    void start();

    return () => {
      cancelled = true;
      cancelAnimationFrame(visualFrame);
      finishRef.current = () => {};
      controller.abort();
      window.clearTimeout(loadTimer);
      window.clearTimeout(revealTimer);
      window.clearTimeout(completeTimer);
      source?.stop();
      source?.disconnect();
      if (!audioContext) void context?.close().catch(() => {});
      dialog?.close();
      document.body.style.overflow = previousOverflow;
      if (previousFocus instanceof HTMLElement && previousFocus.isConnected) previousFocus.focus();
    };
  }, [audioContext]);

  return (
    <dialog
      ref={dialogRef}
      className={styles.overlay}
      data-running={running}
      data-revealed={revealed}
      data-finished={finished}
      aria-labelledby="evolution-title"
      onCancel={(event) => { event.preventDefault(); if (finished) onComplete(); else finishRef.current(); }}
    >
      {!finished && (
        <button autoFocus type="button" className={styles.skip} onClick={() => finishRef.current()}>
          Salta animazione <span aria-hidden="true">→</span>
        </button>
      )}
      <div className={styles.content}>
        <p className={styles.eyebrow}>{revealed ? 'Evoluzione completata' : 'Una nuova forma sta nascendo'}</p>
        <div className={styles.stage} aria-hidden="true">
          <div className={styles.aura} />
          <div className={styles.orbits}>
            {[0, 1, 2].map((orbit) => (
              <div key={orbit} className={styles.orbitPlane} style={{ '--tilt': `${-32 + orbit * 52}deg`, '--orbit-duration': `${3.6 - orbit * 0.55}s` } as CSSProperties}>
                <div className={styles.orbitTrack} />
                {Array.from({ length: 9 }, (_, index) => (
                  <div key={index} className={styles.orbitMover} style={{ '--lag': `${-index * 0.065 - orbit * 0.7}s`, '--trail-opacity': 1 - index * 0.095, '--size': `${13 - index}px` } as CSSProperties}>
                    <span className={styles.geometry} data-shape={orbit} />
                  </div>
                ))}
              </div>
            ))}
          </div>
          <div className={styles.ring} />
          <div className={styles.ringTwo} />
          {Array.from({ length: 28 }, (_, index) => (
            <span key={index} className={styles.particle} style={{
              '--angle': `${index * (360 / 28)}deg`,
              '--delay': `${(index % 7) * 0.15}s`,
            } as CSSProperties} />
          ))}
          <div className={styles.oldForm}>
            <img src={from.image} alt="" className={styles.sprite} />
          </div>
          <div className={styles.newForm}>
            <img src={to.image} alt="" className={styles.sprite} />
          </div>
          <div className={styles.burst} />
        </div>
        <div className={styles.caption} aria-live="polite" aria-atomic="true">
          <p className={styles.label}>{revealed ? 'Si è evoluta in…' : 'Sta succedendo qualcosa…'}</p>
          <h2 id="evolution-title" className={styles.title}>{revealed ? to.name : from.name}</h2>
          <p className={styles.description}>{revealed ? 'La tua cavia ha una nuova forma.' : 'La tua cavia sta cambiando forma.'}</p>
        </div>
        {finished && (
          <button ref={continueRef} type="button" className={styles.continueButton} onClick={onComplete}>
            Continua <span aria-hidden="true">→</span>
          </button>
        )}
      </div>
    </dialog>
  );
}
