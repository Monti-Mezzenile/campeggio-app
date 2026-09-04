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

  const registration = await navigator.serviceWorker.register('/sw.js', {
    scope: '/',
  });

  let permission = Notification.permission;
  if (permission === 'default' && requestPermission) {
    permission = await Notification.requestPermission();
  }

  if (permission === 'denied') return 'denied';
  if (permission !== 'granted') return 'permission-required';

  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  if (!publicKey) {
    throw new Error('Chiave VAPID pubblica non configurata');
  }

  const existingSubscription =
    await registration.pushManager.getSubscription();
  const subscription =
    existingSubscription ??
    (await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(publicKey),
    }));

  const { error } = await supabase.from('push_subscriptions').upsert({
    user_id: userId,
    subscription: subscription.toJSON(),
  });

  if (error) throw error;

  return 'subscribed';
}

async function removeBrowserPushSubscription() {
  const registration = await navigator.serviceWorker.ready;
  const subscription = await registration.pushManager.getSubscription();
  await subscription?.unsubscribe();
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
