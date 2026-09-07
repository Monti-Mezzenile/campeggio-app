'use client';

import Image from 'next/image';
import { useEffect, useState } from 'react';
import { getPushDeviceId, syncPushSubscription } from '@/lib/push-notifications';
import { supabase } from '@/lib/supabase';

type Channel = 'godo' | 'news_712';

const CHANNELS = {
  godo: {
    label: 'Con affetto, GODO',
    icon: '/icons/godo.png',
    column: 'godo_enabled',
    eyebrow: 'OROSCOPO DEL DISAGIO',
    description: 'Monti ci tiene a dirti cosa pensa di te. A giorni alterni, alle 08:45, Monti commenterà con affetto le disgrazie che ti aspettano.',
    accent: 'from-lime-400/25 via-emerald-500/10 to-transparent',
  },
  news_712: {
    label: '712 NEWS',
    icon: '/icons/terra.png',
    column: 'news_712_enabled',
    eyebrow: 'SEGNALE INTERDIMENSIONALE',
    description: 'Ogni tre giorni alle 19:00 riceverai un dispaccio da Terra 712, dove le vostre altre versioni stanno prendendo decisioni discutibili.',
    accent: 'from-cyan-400/25 via-indigo-500/10 to-transparent',
  },
} as const;

export default function NotificationChannelControls({
  userId,
  generalEnabled,
}: {
  userId: string | null;
  generalEnabled: boolean;
}) {
  const [enabled, setEnabled] = useState<Record<Channel, boolean>>({
    godo: false,
    news_712: false,
  });
  const [selected, setSelected] = useState<Channel | null>(null);
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) return;

    const loadPreferences = async () => {
      const { data } = await supabase
        .from('push_subscriptions')
        .select('godo_enabled, news_712_enabled')
        .eq('user_id', userId)
        .eq('device_id', getPushDeviceId())
        .maybeSingle();

      setEnabled({
        godo: data?.godo_enabled === true,
        news_712: data?.news_712_enabled === true,
      });
    };

    void loadPreferences();
  }, [userId]);

  useEffect(() => {
    if (!generalEnabled) setEnabled({ godo: false, news_712: false });
  }, [generalEnabled]);

  const toggleChannel = async () => {
    if (!selected || !userId || pending) return;
    setPending(true);
    setMessage(null);

    try {
      const nextEnabled = !enabled[selected];
      if (nextEnabled) {
        if (!generalEnabled) {
          setMessage('Prima attiva la campanella delle notifiche generali.');
          return;
        }
        const pushStatus = await syncPushSubscription(userId, true);
        if (pushStatus !== 'subscribed') {
          setMessage(
            pushStatus === 'denied'
              ? 'Le notifiche sono bloccate nelle impostazioni del dispositivo.'
              : 'Prima devi consentire le notifiche su questo dispositivo.'
          );
          return;
        }
      }

      const config = CHANNELS[selected];
      const { error } = await supabase
        .from('push_subscriptions')
        .update({ [config.column]: nextEnabled })
        .eq('user_id', userId)
        .eq('device_id', getPushDeviceId());
      if (error) throw error;

      setEnabled((current) => ({ ...current, [selected]: nextEnabled }));
      setMessage(nextEnabled ? 'Canale attivato su questo dispositivo.' : 'Canale disattivato su questo dispositivo.');
    } catch (error) {
      console.error('Aggiornamento canale notifiche non riuscito', error);
      setMessage('Operazione non riuscita. Riprova tra poco.');
    } finally {
      setPending(false);
    }
  };

  return (
    <>
      {(Object.keys(CHANNELS) as Channel[]).map((channel) => {
        const config = CHANNELS[channel];
        const isEnabled = enabled[channel];
        return (
          <button
            key={channel}
            type="button"
            onClick={() => {
              setSelected(channel);
              setMessage(null);
            }}
            className={`relative flex h-10 w-10 items-center justify-center rounded-full border bg-white/65 shadow-sm backdrop-blur-md transition active:scale-90 ${isEnabled ? 'border-emerald-500/50' : 'border-red-500/40'}`}
            aria-label={`${config.label}: ${isEnabled ? 'attivo' : 'non attivo'}`}
            title={config.label}
          >
            <Image src={config.icon} alt="" width={27} height={27} className="h-7 w-7 object-contain" />
            <span className={`absolute right-0 top-0 h-2.5 w-2.5 rounded-full ring-2 ring-white ${isEnabled ? 'bg-emerald-500 shadow-[0_0_8px_#22c55e]' : 'bg-red-500 shadow-[0_0_8px_#ef4444]'}`} />
          </button>
        );
      })}

      {selected && (
        <div className="fixed inset-0 z-[130] flex items-center justify-center bg-black/80 p-4 backdrop-blur-md" role="dialog" aria-modal="true">
          <div className="relative w-full max-w-sm overflow-hidden rounded-[2rem] border border-white/15 bg-[#101915] p-6 text-[#ebdec8] shadow-2xl">
            <div className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${CHANNELS[selected].accent}`} />
            <button type="button" onClick={() => setSelected(null)} className="absolute right-4 top-4 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-sm" aria-label="Chiudi">✕</button>
            <div className="relative">
              <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full border border-white/15 bg-black/25 shadow-inner">
                <Image src={selected === 'news_712' ? '/icons/712.png' : CHANNELS[selected].icon} alt="" width={82} height={82} className="h-20 w-20 object-contain drop-shadow-xl" />
              </div>
              <p className="mt-5 text-center text-[9px] font-black tracking-[0.24em] text-amber-300/80">{CHANNELS[selected].eyebrow}</p>
              <h2 className="mt-1 text-center text-2xl font-black">{CHANNELS[selected].label}</h2>
              <p className="mt-3 text-center text-sm font-medium leading-relaxed text-[#ebdec8]/75">{CHANNELS[selected].description}</p>
              {message && <p className="mt-4 rounded-xl border border-white/10 bg-black/20 p-3 text-center text-xs font-bold">{message}</p>}
              <button type="button" disabled={pending || (!generalEnabled && !enabled[selected])} onClick={toggleChannel} className={`mt-5 w-full rounded-2xl px-4 py-3 text-sm font-black shadow-lg transition active:scale-[0.98] disabled:opacity-50 ${enabled[selected] ? 'bg-red-500/90 text-white' : 'bg-[#ebdec8] text-[#1b2b25]'}`}>
                {pending ? 'Collegamento...' : !generalEnabled ? 'Attiva prima la campanella generale' : enabled[selected] ? 'Disattiva su questo dispositivo' : `Attiva ${CHANNELS[selected].label}`}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
