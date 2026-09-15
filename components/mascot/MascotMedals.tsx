'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { MEDALS, type Medal, type MedalState } from '@/lib/mascot-medals';
import { supabase } from '@/lib/supabase';
import { getMascotPose } from '@/lib/mascot-evolution';
import styles from './MascotMedals.module.css';

function MedalArt({ medal, locked = false }: { medal: Medal; locked?: boolean }) {
  return <span className={`${styles.art} ${locked ? styles.locked : ''}`}>
    {medal.image ? <Image src={medal.image} alt="" fill sizes="(max-width: 640px) 120px, 160px" /> : <span className={styles.placeholder}>🐴</span>}
  </span>;
}

export default function MascotMedals({ userId, readOnly = false }: { userId: string; readOnly?: boolean }) {
  const [data, setData] = useState<MedalState | null>(null);
  const [error, setError] = useState('');
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<Medal | null>(null);
  const [category, setCategory] = useState('Tutti');
  const [busy, setBusy] = useState(false);
  const [step, setStep] = useState<'intro' | 'audit' | null>(null);
  const [newMedal, setNewMedal] = useState<Medal | null>(null);
  const known = useRef<Set<string> | null>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  const notice = useRef<HTMLDialogElement>(null);
  const load = useCallback(async () => {
    const { data: state, error: failure } = await supabase.rpc('get_mascot_medals', { p_user: userId });
    if (failure || !state) { setError('Il medagliere non è disponibile. Riprova tra poco.'); return; }
    setError(''); setData(state);
    if (!readOnly) {
      const ids = Object.keys(state.earned);
      if (known.current) { const added = ids.find(id => !known.current!.has(id)); if (added) setNewMedal(MEDALS.find(m => m.id === added) || null); }
      known.current = new Set(ids);
      if (state.launched_at) setStep(!state.intro_seen ? 'intro' : !state.audit_seen && state.audit ? 'audit' : null);
    }
  }, [userId, readOnly]);
  useEffect(() => {
    const initialLoad = window.setTimeout(() => void load(), 0);
    const refresh = () => { void load(); };
    window.addEventListener('mascot-medals-changed', refresh);
    window.addEventListener('focus', refresh);
    return () => { clearTimeout(initialLoad); window.removeEventListener('mascot-medals-changed', refresh); window.removeEventListener('focus', refresh); };
  }, [load]);
  useEffect(() => { if (open) dialog.current?.showModal(); else dialog.current?.close(); }, [open]);
  useEffect(() => { if (step) notice.current?.showModal(); else notice.current?.close(); }, [step]);
  useEffect(() => {
    if (!open && !step) return;
    const old = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = old; };
  }, [open, step]);

  async function configure(change: { p_seen?: string; p_featured?: string[] }) {
    if (busy) return;
    setBusy(true); setError('');
    try {
      const { data: state, error: failure } = await supabase.rpc('configure_mascot_medals', change);
      if (failure || !state) throw failure;
      setData(state);
      if (change.p_seen) setStep(change.p_seen === 'intro' && !state.audit_seen && state.audit ? 'audit' : null);
    } catch { setError('Salvataggio non riuscito. Riprova: i tuoi distintivi sono al sicuro.'); }
    finally { setBusy(false); }
  }
  const featured = (data?.featured || []).map(id => MEDALS.find(m => m.id === id)).filter((m): m is Medal => !!m);
  const earned = data?.earned || {};
  const collected = MEDALS.filter(m => earned[m.id]).sort((a, b) => Date.parse(earned[b.id]) - Date.parse(earned[a.id]));
  const displayed = featured.length ? featured : collected.slice(0, 3);
  const count = collected.length;
  const audit = data?.audit;
  const active = !!data?.launched_at;
  return <section className={readOnly ? styles.rivalSummary : styles.section} aria-label={readOnly ? 'Distintivi della cavia' : 'Il tuo medagliere'}>
    {readOnly ? <>
      <div className={styles.rivalHeading}>
        <h2>Distintivi <span>{data ? count : '…'}</span></h2>
        <button type="button" onClick={() => { setSelected(null); setOpen(true); }} aria-label="Apri tutti i distintivi di questa cavia">Vedi tutti <span aria-hidden="true">↗</span></button>
      </div>
      <div className={styles.rivalMedals}>
        {displayed.map(medal => <button key={medal.id} type="button" title={medal.name} aria-label={medal.name} onClick={() => { setSelected(medal); setOpen(true); }}><MedalArt medal={medal} /></button>)}
        {displayed.length === 0 && <p>{data ? 'Una reputazione ancora da costruire.' : 'Caricamento distintivi…'}</p>}
        {count > displayed.length && <button type="button" className={styles.moreMedals} onClick={() => { setSelected(null); setOpen(true); }} aria-label={`Altri ${count - displayed.length} distintivi`}>+{count - displayed.length}</button>}
      </div>
    </> : <>
    <div className={styles.heading}><div><small>ONORI DI DUBBIA PROVENIENZA</small><h2>Il medagliere</h2></div><span className={styles.count}>{count}<small> / {MEDALS.length}</small></span></div>
    <div className={styles.featured}>
      {[0, 1, 2].map(i => <button type="button" key={i} className={styles.slot} onClick={() => { setSelected(featured[i] || null); setOpen(true); }} aria-label={featured[i]?.name || `Posto ${i + 1} per un distintivo`}>
        {featured[i] ? <MedalArt medal={featured[i]} /> : <><span className={styles.empty}>✧</span><small>{readOnly ? 'Nessun distintivo' : 'La gloria aspetta'}</small></>}
      </button>)}
    </div>
    <button type="button" className={styles.catalogButton} onClick={() => { setSelected(null); setOpen(true); }}>Apri il medagliere <span>→</span></button>
    {!readOnly && <p className={styles.caption}>{active ? 'Scegli fino a 3 distintivi da esporre. Gli altri potranno ammirarli. O rosicare.' : 'Il registro aprirà con il lancio. Puoi già scoprire le imprese.'}</p>}
    </>}
    {error && <p role="alert" className={styles.error}>{error} <button type="button" onClick={() => void load()}>Riprova</button></p>}
    {newMedal && !step && <button className={styles.unlocked} onClick={() => { setSelected(newMedal); setNewMedal(null); setOpen(true); }}><MedalArt medal={newMedal} /><span>NUOVO DISTINTIVO!<strong>{newMedal.name}</strong></span></button>}

    <dialog ref={dialog} className={styles.dialog} onCancel={() => { setOpen(false); setSelected(null); }} onClose={() => setOpen(false)}>
      <div className={styles.dialogHeader}><div><small>ARCHIVIO DELLE IMPRESE DISCUTIBILI</small><h2>{selected ? 'Verbale di gloria' : readOnly ? 'La sua leggenda, a pezzi' : 'La tua leggenda, a pezzi'}</h2></div><button autoFocus type="button" onClick={() => { setOpen(false); setSelected(null); }} aria-label="Chiudi medagliere">✕</button></div>
      {selected ? <div className={styles.detail}>
        <button type="button" className={styles.back} onClick={() => setSelected(null)}>← Tutti i distintivi</button>
        <MedalArt medal={selected} locked={!earned[selected.id]} />
        <small className={styles.eyebrow}>{selected.category}</small><h3>{selected.name}</h3><p className={styles.quip}>«{selected.quip}»</p>
        <div className={styles.requirement}><strong>Come si conquista</strong><p>{selected.requirement}</p></div>
        <Progress medal={selected} data={data} readOnly={readOnly} />
        {earned[selected.id] ? <><p className={styles.date}>Conquistato il {new Date(earned[selected.id]).toLocaleDateString('it-IT', { timeZone: 'Europe/Rome' })}</p>
          {!readOnly && <button disabled={busy || (!data?.featured.includes(selected.id) && featured.length >= 3)} className={styles.primary} onClick={() => void configure({ p_featured: data?.featured.includes(selected.id) ? data.featured.filter(id => id !== selected.id) : [...(data?.featured || []), selected.id] })}>{data?.featured.includes(selected.id) ? 'Togli dalla vetrina' : featured.length >= 3 ? 'Libera uno dei 3 posti in vetrina' : 'Esponi sulla cavia'}</button>}</>
          : <p className={styles.caption}>{selected.category === 'Finanza' ? 'Distintivo riservato all’evento della verifica fiscale.' : 'Ogni impresa comincia da qualche parte. Anche questa.'}</p>}
      </div> : <>
        <p className={styles.introText}>{readOnly ? 'Le imprese di questa cavia.' : 'Le medaglie raccontano ciò che combini. Nessun bonus XP: solo gloria, sospetti e pessime abitudini.'}</p>
        <p className={styles.launch}>{active ? `Conteggi dal ${new Date(data!.launched_at!).toLocaleString('it-IT', { timeZone: 'Europe/Rome', dateStyle: 'short', timeStyle: 'short' })} · ora italiana` : 'Conteggi ancora fermi · apertura con il lancio'}. Le azioni precedenti non contano. I distintivi della Finanza ricordano l’evento.</p>
        <div className={styles.filters} aria-label="Categorie">{['Tutti', ...new Set(MEDALS.map(m => m.category))].map(c => <button type="button" key={c} aria-pressed={c === category} onClick={() => setCategory(c)}>{c}</button>)}</div>
        <div className={styles.grid}>{MEDALS.filter(m => category === 'Tutti' || m.category === category).sort((a, b) => readOnly ? Number(!!earned[b.id]) - Number(!!earned[a.id]) : 0).map(m => <button type="button" key={m.id} className={`${styles.card} ${earned[m.id] ? styles.earned : ''}`} onClick={() => setSelected(m)}>
          <span className={styles.status}>{earned[m.id] ? '✓ CONQUISTATO' : 'DA CONQUISTARE'}</span><MedalArt medal={m} locked={!earned[m.id]} /><h3>{m.name}</h3><Progress medal={m} data={data} readOnly={readOnly} /><span className={styles.discover}>Scopri il requisito →</span>
        </button>)}</div>
      </>}
      {error && <p className={styles.error} role="alert">{error}</p>}
    </dialog>

    <dialog ref={notice} className={`${styles.dialog} ${styles.notice}`} onCancel={e => e.preventDefault()} aria-labelledby="medal-story-title">
      {step === 'intro' ? <>
        <span className={styles.chapter}>COMUNICATO UFFICIALE DEL BOSCO · 01</span>
        <div className={styles.heroMedals}>{['carota-identita', 'indagato-grigliata', 'problema-condominiale'].map(id => <MedalArt key={id} medal={MEDALS.find(m => m.id === id)!} />)}</div>
        <h2 id="medal-story-title">Finalmente, delle prove<br />contro la tua cavia.</h2>
        <p>Il Consiglio del Bosco ha aperto l’<strong>Archivio delle Imprese Discutibili</strong>. Perché certe gesta meritano una medaglia. Altre almeno un fascicolo.</p>
        <div className={styles.storyList}><p><b>01 · COMBINA QUALCOSA</b> Cura la cavia, gioca, soccorri i vicini. O diventa il loro problema.</p><p><b>02 · LASCIA TRACCIA</b> Ogni distintivo ha un requisito e un contatore consultabile nel medagliere.</p><p><b>03 · METTITI IN MOSTRA</b> Scegline tre da esporre sulla cavia. La reputazione è un problema degli altri.</p></div>
        <p className={styles.launch}>Si parte da zero dall’apertura del registro. Nessun recupero delle vecchie azioni, nessun XP bonus. I giorni si contano con l’orario italiano.</p>
        <button autoFocus disabled={busy} className={styles.primary} onClick={() => void configure({ p_seen: 'intro' })}>{busy ? 'Apertura fascicolo…' : 'Accetto questa discutibile onorificenza →'}</button>
      </> : step === 'audit' && <>
        <span className={styles.chapter}>GUARDIA DI FINANZA DEL BOSCO · 02</span>
        <div className={styles.auditArt}><MedalArt medal={MEDALS.find(m => m.id === 'indagato-grigliata')!} /></div>
        <h2 id="medal-story-title">La verifica fiscale<br />delle cavie.</h2>
        <p className={styles.quip}>«Lei non alleva una cavia.<br />Gestisce una società offshore.»</p>
        <p>Una quantità sospetta di grigliate ha fatto scattare il controllo. Le vecchie ricompense distribuivano troppi XP: il Bosco presenta il conto.</p>
        {audit?.status === 'pending' ? <div className={styles.requirement}><strong>Fascicolo in lavorazione</strong><p>Il tuo verbale non è ancora pronto. Ti verrà mostrato qui appena il controllo sarà concluso.</p></div> : audit && <>
          <div className={styles.stamp}>{audit.status === 'corrected' ? 'PLUSVALENZA DA SALSICCIA' : 'FEDINA CULINARIA PULITA'}</div>
          <AuditCounter audit={audit} />
          <p className={styles.caption}>{audit.status === 'corrected' ? 'Correzione straordinaria delle vecchie ricompense. Il prelievo è già registrato: questo verbale non può addebitartelo due volte.' : 'Nessuna correzione sul tuo conto. Puoi tornare alla griglia con la coscienza sorprendentemente pulita.'}</p>
          {audit.after_phase < audit.before_phase && <div className={styles.regression}><Image width={95} height={95} src={getMascotPose(audit.before_phase, 0)} alt={`Prima: fase ${audit.before_phase}`} /><span>→</span><Image width={95} height={95} src={getMascotPose(audit.after_phase, 0)} alt={`Dopo: fase ${audit.after_phase}`} /><p>Da fase {audit.before_phase} a fase {audit.after_phase}.<br />Anche l’evoluzione deve presentare le ricevute.</p></div>}
        </>}
        <button autoFocus disabled={busy} className={styles.primary} onClick={() => void configure({ p_seen: 'audit' })}>{busy ? 'Archiviazione…' : audit?.status === 'pending' ? 'Ho capito, attendo il verbale' : 'Firmo. Ma il commercialista era una pigna.'}</button>
      </>}
      {error && <p className={styles.error} role="alert">{error}</p>}
    </dialog>
  </section>;
}
function Progress({ medal, data, readOnly }: { medal: Medal; data: MedalState | null; readOnly: boolean }) {
  const unlocked = !!data?.earned[medal.id];
  if (readOnly) return <span className={styles.caption}>{unlocked ? 'Conquistato' : 'Da conquistare'}</span>;
  const n = unlocked ? medal.target : Math.min(medal.target, data?.progress[medal.id] || 0);
  return <div className={styles.progress}><div role="progressbar" aria-label={medal.name} aria-valuenow={n} aria-valuemin={0} aria-valuemax={medal.target}><span style={{ width: `${n / medal.target * 100}%` }} /></div><small>{n} / {medal.target}</small></div>;
}
function AuditCounter({ audit }: { audit: NonNullable<MedalState['audit']> }) {
  const [xp, setXp] = useState(audit.before_xp);
  useEffect(() => {
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let frame: number;
    const start = performance.now();
    const animate = (now: number) => { const progress = reduceMotion ? 1 : Math.min(1, (now - start) / 2200); setXp(Math.round(audit.before_xp + (audit.after_xp - audit.before_xp) * progress)); if (progress < 1) frame = requestAnimationFrame(animate); };
    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, [audit]);
  return <div className={styles.auditNumbers}><small>SALDO DOPO IL CONTROLLO</small><strong aria-hidden="true">{xp.toLocaleString('it-IT')} <small>XP</small></strong><span className="sr-only">Saldo: {audit.after_xp} XP</span><span>{audit.before_xp.toLocaleString('it-IT')} XP − {audit.removed.toLocaleString('it-IT')} XP</span></div>;
}
