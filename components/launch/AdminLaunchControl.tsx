'use client';

import { useEffect, useState } from 'react';
import { LockKeyhole, LockKeyholeOpen } from 'lucide-react';
import { supabase } from '@/lib/supabase';

export default function AdminLaunchControl({ userId }: { userId: string | null }) {
  const [expanded, setExpanded] = useState(false);
  const [locked, setLocked] = useState<boolean | null>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    const refresh = async () => {
      const { data, error } = await supabase.from('app_runtime_settings')
        .select('is_locked').eq('id', 'launch_gate').single();
      if (!active) return;
      setLocked(error ? null : data.is_locked);
      setError(error ? 'Stato non disponibile. Riapri questa sezione per riprovare.' : null);
    };
    void refresh();
    const channel = supabase.channel('admin_launch_control')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'app_runtime_settings', filter: 'id=eq.launch_gate' }, () => { void refresh(); })
      .subscribe();
    window.addEventListener('focus', refresh);
    return () => {
      active = false;
      window.removeEventListener('focus', refresh);
      void supabase.removeChannel(channel);
    };
  }, [expanded]);

  const toggle = async () => {
    if (locked === null || pending || !userId) return;
    setPending(true);
    setError(null);
    try {
      const { data, error } = await supabase.from('app_runtime_settings')
        .update({ is_locked: !locked, updated_at: new Date().toISOString(), updated_by: userId })
        .eq('id', 'launch_gate').select('is_locked').single();
      if (error) throw error;
      setLocked(data.is_locked);
    } catch {
      setError('Modifica non riuscita. Riprova.');
    } finally {
      setPending(false);
    }
  };

  const Icon = locked === false ? LockKeyholeOpen : LockKeyhole;
  return (
    <>
      <button type="button" onClick={() => setExpanded(!expanded)}
        aria-label="Gestisci apertura app" title="Gestisci apertura app"
        aria-expanded={expanded} aria-controls="admin-launch-settings"
        className={`absolute right-16 top-4 z-20 flex h-10 w-10 items-center justify-center rounded-full border shadow-sm transition active:scale-95 ${locked === false ? 'border-emerald-200 bg-emerald-100 text-emerald-900' : 'border-amber-200 bg-amber-100 text-amber-900'}`}>
        <Icon size={18} aria-hidden="true" />
      </button>
      {expanded && (
        <div id="admin-launch-settings" className="mt-12 rounded-2xl border border-[#1b2b25]/10 bg-white/70 p-4 text-left text-[#1b2b25]">
          <p className="text-xs font-black" aria-live="polite">{locked === null ? 'Verifica stato app…' : locked ? 'App bloccata per gli utenti' : 'App aperta a tutti gli utenti'}</p>
          <p className="mt-2 text-xs leading-relaxed">Puoi bloccare e sbloccare l’app quando vuoi. La scelta resta salvata e gli admin mantengono l’accesso.</p>
          <button type="button" onClick={toggle} disabled={locked === null || pending || !userId}
            className="mt-3 rounded-xl bg-[#1b2b25] px-4 py-2 text-xs font-bold text-white disabled:opacity-50">
            {pending ? 'Salvataggio…' : locked === false ? 'Blocca app' : 'Sblocca app'}
          </button>
          {error && <p role="alert" className="mt-2 text-xs font-bold text-red-700">{error}</p>}
        </div>
      )}
    </>
  );
}
