'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { getPushDeviceId } from '@/lib/push-notifications';
import { supabase } from '@/lib/supabase';

const FIRST_SEEN_KEY = 'monti-special-notifications-first-seen';
const SEVEN_DAYS = 7 * 24 * 60 * 60 * 1000;

export default function NotificationChannelReminder() {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    let mounted = true;
    const checkChannels = async () => {
      const now = Date.now();
      const firstSeen = Number(localStorage.getItem(FIRST_SEEN_KEY));
      if (!firstSeen) {
        localStorage.setItem(FIRST_SEEN_KEY, String(now));
        return;
      }
      if (now - firstSeen < SEVEN_DAYS) return;

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase
        .from('push_subscriptions')
        .select('godo_enabled, news_712_enabled')
        .eq('user_id', user.id)
        .eq('device_id', getPushDeviceId())
        .maybeSingle();

      if (mounted && data?.godo_enabled !== true && data?.news_712_enabled !== true) setIsOpen(true);
    };

    void checkChannels();
    return () => { mounted = false; };
  }, []);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[125] flex items-center justify-center bg-black/80 p-4 backdrop-blur-md" role="dialog" aria-modal="true" aria-labelledby="channel-reminder-title">
      <div className="relative w-full max-w-sm overflow-hidden rounded-[2rem] border border-amber-300/20 bg-[#15231e] p-6 text-[#ebdec8] shadow-2xl">
        <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-amber-400/15 to-transparent" />
        <div className="relative flex justify-center gap-3">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-white/10 bg-black/20"><Image src="/icons/godo.png" alt="" width={52} height={52} className="h-13 w-13 object-contain" /></div>
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-white/10 bg-black/20"><Image src="/icons/terra.png" alt="" width={52} height={52} className="h-13 w-13 object-contain" /></div>
        </div>
        <h2 id="channel-reminder-title" className="relative mt-5 text-center text-xl font-black">Ti stai perdendo il peggio</h2>
        <p className="relative mt-3 text-center text-sm font-medium leading-relaxed text-[#ebdec8]/75">Sono passati sette giorni e non hai ancora attivato né i giudizi di GODO né i dispacci da Terra 712. Una serenità francamente sospetta.</p>
        <Link href="/profile" onClick={() => setIsOpen(false)} className="relative mt-5 block w-full rounded-2xl bg-[#ebdec8] px-4 py-3 text-center text-sm font-black text-[#1b2b25]">Scegli le notifiche</Link>
        <button type="button" onClick={() => setIsOpen(false)} className="relative mt-2 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-xs font-black">Continua a vivere nell&apos;ignoranza</button>
      </div>
    </div>
  );
}
