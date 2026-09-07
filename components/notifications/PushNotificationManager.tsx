'use client';

import Image from 'next/image';
import { useEffect, useState } from 'react';
import {
  activateAndTestPush,
  isPushDisabled,
  type PushSubscriptionStatus,
  syncPushSubscription,
} from '@/lib/push-notifications';
import { supabase } from '@/lib/supabase';

export default function PushNotificationManager() {
  const [userId, setUserId] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [permissionStatus, setPermissionStatus] =
    useState<PushSubscriptionStatus>('permission-required');
  const [activating, setActivating] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const syncForUser = async (currentUserId: string) => {
      try {
        if (isPushDisabled(currentUserId)) {
          if (!isMounted) return;
          setUserId(currentUserId);
          setPermissionStatus('permission-required');
          setIsOpen(false);
          return;
        }

        const status = await syncPushSubscription(currentUserId);
        if (!isMounted) return;

        setUserId(currentUserId);
        setPermissionStatus(status);
        if (
          status !== 'subscribed' &&
          status !== 'unsupported' &&
          sessionStorage.getItem(`monti-push-dismissed-${currentUserId}`) !== '1'
        ) {
          setIsOpen(true);
        }
      } catch (error) {
        console.error('Sincronizzazione notifiche push non riuscita', error);
        if (!isMounted) return;
        setUserId(currentUserId);
        setMessage('Le notifiche devono essere ricollegate a questo dispositivo.');
        if (
          sessionStorage.getItem(`monti-push-dismissed-${currentUserId}`) !== '1'
        ) {
          setIsOpen(true);
        }
      }
    };

    const syncForCurrentUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (isMounted && user) void syncForUser(user.id);
    };

    void syncForCurrentUser();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (
        isMounted &&
        session?.user &&
        (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED')
      ) {
        void syncForUser(session.user.id);
      }

      if (isMounted && event === 'SIGNED_OUT') {
        setUserId(null);
        setIsOpen(false);
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const dismissPrompt = () => {
    if (userId) sessionStorage.setItem(`monti-push-dismissed-${userId}`, '1');
    setIsOpen(false);
  };

  const activateNotifications = async () => {
    if (!userId || activating) return;

    setActivating(true);
    setMessage(null);

    try {
      const status = await activateAndTestPush(userId);

      if (status === 'sent') {
        sessionStorage.removeItem(`monti-push-dismissed-${userId}`);
        setMessage('Test inviato! Le notifiche sono attive su questo dispositivo.');
        setTimeout(() => setIsOpen(false), 1800);
      } else if (status === 'denied') {
        setPermissionStatus('denied');
        setMessage('Le notifiche sono bloccate nelle impostazioni del browser o del telefono.');
      } else if (status === 'unsupported') {
        setMessage('Questo browser non supporta le notifiche push.');
      } else if (status === 'configuration') {
        setMessage('La configurazione notifiche sul server non è completa.');
      } else {
        setMessage('Non sono riuscito a consegnare il test. Riprova tra poco.');
      }
    } catch (error) {
      console.error('Attivazione notifiche push non riuscita', error);
      setMessage(
        error instanceof Error
          ? error.message
          : 'Attivazione non riuscita. Controlla la connessione e riprova.'
      );
    } finally {
      setActivating(false);
    }
  };

  if (!isOpen || !userId) return null;

  const permissionDenied = permissionStatus === 'denied';

  return (
    <div
      className="fixed inset-0 z-[120] flex items-center justify-center bg-black/75 p-4 backdrop-blur-md"
      role="dialog"
      aria-modal="true"
      aria-labelledby="push-monti-title"
    >
      <div className="w-full max-w-sm rounded-3xl border border-[#ebdec8]/30 bg-[#1b2b25] p-6 text-[#ebdec8] shadow-2xl">
        <Image
          src="/icons/wallace.png"
          alt="Notifiche MONTI"
          width={80}
          height={80}
          className="mx-auto mb-4 h-20 w-20 object-contain drop-shadow-lg"
        />

        <h2
          id="push-monti-title"
          className="text-center text-xl font-black tracking-tight"
        >
          {permissionDenied ? 'Notifiche bloccate' : 'Resta nel campo'}
        </h2>

        <p className="mt-3 text-center text-sm font-medium leading-relaxed text-[#ebdec8]/85">
          {permissionDenied
            ? 'Riattiva le notifiche dalle impostazioni del browser o del telefono.'
            : 'Attiva le notifiche per ricevere richiami dalla mascotte e promemoria quando un Monti si avvicina.'}
        </p>

        {message && (
          <p className="mt-4 rounded-2xl border border-amber-400/30 bg-amber-400/10 p-3 text-center text-xs font-bold leading-relaxed text-amber-200">
            {message}
          </p>
        )}

        <div className="mt-5 space-y-2">
          {!permissionDenied && (
            <button
              type="button"
              onClick={activateNotifications}
              disabled={activating}
              className="w-full rounded-2xl bg-[#ebdec8] px-4 py-3 text-sm font-black text-[#1b2b25] shadow-lg active:scale-[0.98] disabled:opacity-60"
            >
              {activating ? 'Attivazione...' : '🔔 Attiva notifiche'}
            </button>
          )}

          <button
            type="button"
            onClick={dismissPrompt}
            className="w-full rounded-2xl border border-[#ebdec8]/20 bg-white/10 px-4 py-3 text-xs font-black text-[#ebdec8] active:scale-[0.98]"
          >
            {permissionDenied ? 'Ho capito' : 'Non ora'}
          </button>
        </div>
      </div>
    </div>
  );
}
