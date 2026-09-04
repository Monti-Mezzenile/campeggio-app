'use client';

import { useEffect } from 'react';
import { syncPushSubscription } from '@/lib/push-notifications';
import { supabase } from '@/lib/supabase';

export default function PushNotificationManager() {
  useEffect(() => {
    let isMounted = true;

    const syncForCurrentUser = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!isMounted || !user) return;

        // Non mostra prompt automatici: sincronizza soltanto gli utenti che
        // hanno già concesso il permesso tramite il pulsante nella mascotte.
        await syncPushSubscription(user.id);
      } catch (error) {
        console.error('Sincronizzazione notifiche push non riuscita', error);
      }
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
        void syncPushSubscription(session.user.id).catch((error) => {
          console.error('Sincronizzazione notifiche push non riuscita', error);
        });
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  return null;
}
