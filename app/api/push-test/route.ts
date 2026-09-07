import { NextResponse } from 'next/server';
import webpush, { type PushSubscription } from 'web-push';
import { createSupabaseServerClient } from '@/lib/supabase-server';
import { getSupabaseAdmin } from '@/lib/supabase-admin';

export const runtime = 'nodejs';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isPushSubscription(value: unknown): value is PushSubscription {
  if (!isRecord(value) || !isRecord(value.keys)) return false;

  return (
    typeof value.endpoint === 'string' &&
    value.endpoint.startsWith('https://') &&
    typeof value.keys.auth === 'string' &&
    value.keys.auth.length > 0 &&
    typeof value.keys.p256dh === 'string' &&
    value.keys.p256dh.length > 0
  );
}

function getStatusCode(error: unknown) {
  if (typeof error !== 'object' || error === null || !('statusCode' in error)) {
    return null;
  }

  return typeof error.statusCode === 'number' ? error.statusCode : null;
}

export async function POST() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ success: false, reason: 'auth' }, { status: 401 });
  }

  const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;
  if (!vapidPublicKey || !vapidPrivateKey) {
    return NextResponse.json(
      { success: false, reason: 'configuration' },
      { status: 503 }
    );
  }

  let supabaseAdmin: ReturnType<typeof getSupabaseAdmin>;
  try {
    supabaseAdmin = getSupabaseAdmin();
  } catch {
    return NextResponse.json(
      { success: false, reason: 'configuration' },
      { status: 503 }
    );
  }

  const { data, error } = await supabaseAdmin
    .from('push_subscriptions')
    .select('subscription')
    .eq('user_id', user.id)
    .maybeSingle();

  if (error || !isPushSubscription(data?.subscription)) {
    return NextResponse.json(
      { success: false, reason: 'subscription' },
      { status: 404 }
    );
  }

  webpush.setVapidDetails(
    process.env.VAPID_MAILTO || 'mailto:admin@campeggio.com',
    vapidPublicKey,
    vapidPrivateKey
  );

  try {
    await webpush.sendNotification(
      data.subscription,
      JSON.stringify({
        title: '🏕️ Non è una setta, certo',
        body: 'Abbiamo solo ottenuto il permesso di richiamarti quando vogliamo.',
        icon: '/apple-touch-icon.png',
        badge: '/icons/wallace.png',
        tag: `push-test-${user.id}`,
        url: '/mascotte',
      })
    );

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const statusCode = getStatusCode(error);

    if (
      statusCode === 401 ||
      statusCode === 403 ||
      statusCode === 404 ||
      statusCode === 410
    ) {
      await supabaseAdmin
        .from('push_subscriptions')
        .delete()
        .eq('user_id', user.id);

      return NextResponse.json(
        { success: false, reason: 'expired' },
        { status: 410 }
      );
    }

    console.error('Invio push di prova non riuscito');
    return NextResponse.json(
      { success: false, reason: 'delivery' },
      { status: 502 }
    );
  }
}
