'use client';

import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

export default function LaunchGate() {
  const pathname = usePathname();
  const [checking, setChecking] = useState(true);
  const [isLocked, setIsLocked] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [unlocking, setUnlocking] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    const loadGate = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!mounted) return;
      if (!user) {
        setChecking(false);
        return;
      }

      const [{ data: profile }, { data: settings, error }] = await Promise.all([
        supabase.from('profiles').select('ruolo').eq('id', user.id).maybeSingle(),
        supabase.from('app_runtime_settings').select('is_locked').eq('id', 'launch_gate').maybeSingle(),
      ]);
      if (!mounted) return;

      setIsAdmin(profile?.ruolo === 'admin');
      setIsLocked(error ? true : settings?.is_locked === true);
      setChecking(false);
    };

    void loadGate();

    const channel = supabase
      .channel('launch_gate_realtime')
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'app_runtime_settings', filter: 'id=eq.launch_gate' },
        (payload) => {
          if (!mounted) return;
          const updated = payload.new as { is_locked?: boolean };
          setIsLocked(updated.is_locked === true);
        }
      )
      .subscribe();

    return () => {
      mounted = false;
      void supabase.removeChannel(channel);
    };
  }, []);

  const unlockApp = async () => {
    if (!isAdmin || unlocking) return;
    setUnlocking(true);
    setErrorMessage(null);

    const { data: { user } } = await supabase.auth.getUser();
    const { error } = await supabase
      .from('app_runtime_settings')
      .update({
        is_locked: false,
        updated_at: new Date().toISOString(),
        updated_by: user?.id || null,
      })
      .eq('id', 'launch_gate');

    if (error) {
      console.error('Sblocco app non riuscito', error);
      setErrorMessage('Non sono riuscito ad aprire il campo. Riprova.');
    } else {
      setIsLocked(false);
    }
    setUnlocking(false);
  };

  if (pathname === '/login') return null;

  if (checking) {
    return <div className="fixed inset-0 z-[200] bg-[#0d1b1e]" aria-label="Verifica apertura app" />;
  }

  if (!isLocked) return null;

  if (isAdmin) {
    return (
      <div className="fixed inset-x-3 top-[calc(0.75rem+env(safe-area-inset-top))] z-[200] mx-auto flex max-w-md items-center gap-3 rounded-2xl border border-amber-300/40 bg-zinc-950/95 p-3 text-white shadow-2xl backdrop-blur-xl">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-400/15 text-lg">🔒</span>
        <div className="min-w-0 flex-1">
          <p className="text-[9px] font-black uppercase tracking-widest text-amber-300">Anteprima admin</p>
          <p className="truncate text-xs font-bold text-zinc-300">L’app è bloccata per gli altri utenti</p>
        </div>
        <button type="button" onClick={unlockApp} disabled={unlocking} className="shrink-0 rounded-xl bg-amber-300 px-3 py-2 text-[10px] font-black uppercase text-zinc-950 active:scale-95 disabled:opacity-60">
          {unlocking ? 'Apertura…' : 'Apri il campo'}
        </button>
        {errorMessage && <p className="absolute left-3 right-3 top-full mt-2 rounded-xl bg-red-600 p-2 text-center text-[10px] font-bold">{errorMessage}</p>}
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-[#0d1b1e]/95 p-5 text-[#ebdec8] backdrop-blur-xl" role="dialog" aria-modal="true" aria-labelledby="launch-gate-title">
      <div className="relative w-full max-w-sm overflow-hidden rounded-[2.5rem] border border-amber-300/25 bg-[#17261f] p-7 text-center shadow-2xl">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-amber-400/15 to-transparent" />
        <div className="relative mx-auto flex h-28 w-28 items-center justify-center rounded-full border border-white/10 bg-black/20">
          <Image src="/icons/tenda-grossa.png" alt="Campo chiuso" width={92} height={92} className="h-24 w-24 object-contain drop-shadow-xl" priority />
          <span className="absolute -bottom-1 -right-1 flex h-10 w-10 items-center justify-center rounded-full border-4 border-[#17261f] bg-amber-400 text-xl">🔒</span>
        </div>
        <p className="relative mt-6 text-[9px] font-black uppercase tracking-[0.28em] text-amber-300/80">Preparativi in corso</p>
        <h1 id="launch-gate-title" className="relative mt-2 text-3xl font-black tracking-tight">Il campo è ancora chiuso</h1>
        <p className="relative mt-4 text-sm font-medium leading-relaxed text-[#ebdec8]/75">Stiamo sistemando le ultime cose prima della presentazione. Torna più tardi: Monti aprirà quando sarà tutto abbastanza discutibile.</p>
        <div className="relative mt-6 inline-flex items-center gap-2 rounded-full border border-amber-300/20 bg-black/20 px-4 py-2 text-[10px] font-black uppercase tracking-wider text-amber-200">
          <span className="h-2 w-2 animate-pulse rounded-full bg-amber-300" />
          In attesa dell&apos;apertura
        </div>
      </div>
    </div>
  );
}
