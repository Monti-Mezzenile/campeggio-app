'use client';

import { supabase } from '@/lib/supabase';

export type PushSubscriptionStatus =
  | 'subscribed'
  | 'permission-required'
  | 'denied'
  | 'unsupported';

export type PushActivationStatus =
  | 'sent'
  | 'permission-required'
  | 'denied'
  | 'unsupported'
  | 'configuration'
  | 'subscription'
  | 'delivery';

const pushDisabledKey = (userId: string) => `monti-push-disabled-${userId}`;

export function isPushDisabled(userId: string) {
  return localStorage.getItem(pushDisabledKey(userId)) === '1';
}

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let index = 0; index < rawData.length; index += 1) {
    outputArray[index] = rawData.charCodeAt(index);
  }

  return outputArray;
}

export async function syncPushSubscription(
  userId: string,
  requestPermission = false
): Promise<PushSubscriptionStatus> {
  if (
    typeof window === 'undefined' ||
    !('serviceWorker' in navigator) ||
    !('PushManager' in window) ||
    !('Notification' in window)
  ) {
    return 'unsupported';
  }

  if (!requestPermission && isPushDisabled(userId)) {
    return 'permission-required';
  }

  let permission = Notification.permission;
  if (permission === 'default' && requestPermission) {
    try {
      // Deve essere la prima operazione asincrona dopo il click: alcuni
      // browser, soprattutto iOS, perdono altrimenti il gesto utente.
      permission = await Notification.requestPermission();
    } catch {
      throw new Error('Il browser non ha aperto la richiesta di autorizzazione.');
    }
  }

  if (permission === 'denied') return 'denied';
  if (permission !== 'granted') return 'permission-required';

  let registration: ServiceWorkerRegistration;
  try {
    registration = await navigator.serviceWorker.register('/sw.js', {
      scope: '/',
    });
  } catch {
    throw new Error('Il service worker delle notifiche non è disponibile.');
  }

  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  if (!publicKey) {
    throw new Error('Chiave VAPID pubblica non configurata');
  }

  let subscription: PushSubscription;
  try {
    const existingSubscription =
      await registration.pushManager.getSubscription();
    subscription =
      existingSubscription ??
      (await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey),
      }));
  } catch {
    throw new Error('Il dispositivo non è riuscito a creare la subscription push.');
  }

  const { error } = await supabase.from('push_subscriptions').upsert({
    user_id: userId,
    subscription: subscription.toJSON(),
  }, { onConflict: 'user_id' });

  if (error) {
    console.error('Salvataggio subscription push non riuscito', error);
    throw new Error('La subscription non è stata salvata sul server.');
  }

  return 'subscribed';
}

async function removeBrowserPushSubscription() {
  const registration = await navigator.serviceWorker.getRegistration();
  if (!registration) return;

  const subscription = await registration.pushManager.getSubscription();
  await subscription?.unsubscribe();
}

export async function deactivatePush(userId: string) {
  if (
    typeof window !== 'undefined' &&
    'serviceWorker' in navigator &&
    'PushManager' in window
  ) {
    await removeBrowserPushSubscription();
  }

  const { error } = await supabase
    .from('push_subscriptions')
    .delete()
    .eq('user_id', userId);

  if (error) {
    console.error('Rimozione subscription push non riuscita', error);
    throw new Error('Non sono riuscito a disattivare le notifiche sul server.');
  }

  localStorage.setItem(pushDisabledKey(userId), '1');
}

async function requestPushTest() {
  const response = await fetch('/api/push-test', { method: 'POST' });
  const result = await response.json().catch(() => null) as {
    success?: boolean;
    reason?: PushActivationStatus | 'expired';
  } | null;

  return {
    ok: response.ok && result?.success === true,
    reason: result?.reason || 'delivery',
  };
}

export async function activateAndTestPush(
  userId: string
): Promise<PushActivationStatus> {
  const subscriptionStatus = await syncPushSubscription(userId, true);
  if (subscriptionStatus !== 'subscribed') return subscriptionStatus;

  localStorage.removeItem(pushDisabledKey(userId));

  let testResult = await requestPushTest();
  if (testResult.ok) return 'sent';

  if (testResult.reason === 'expired') {
    await removeBrowserPushSubscription();
    const repairedStatus = await syncPushSubscription(userId, true);
    if (repairedStatus !== 'subscribed') return repairedStatus;

    testResult = await requestPushTest();
    if (testResult.ok) return 'sent';
  }

  return testResult.reason === 'expired' ? 'subscription' : testResult.reason;
}
