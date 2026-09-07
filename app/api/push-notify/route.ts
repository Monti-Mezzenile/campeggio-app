import { NextResponse } from 'next/server';
import webpush, { type PushSubscription } from 'web-push';
import { getSupabaseAdmin } from '@/lib/supabase-admin';
import { createSupabaseServerClient } from '@/lib/supabase-server';

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const PAIR_COOLDOWN_SECONDS = 5;
const GLOBAL_WINDOW_SECONDS = 60;
const GLOBAL_MAX_PUSHES = 10;

const ACTIONS = {
  pigna: {
    title: '🎯 Pigna in faccia!',
    message: (senderName: string) =>
      `${senderName} ti ha tirato una pigna in faccia! (-12% Svago)`,
  },
  birra: {
    title: '🍺 Birra offerta!',
    message: (senderName: string) =>
      `${senderName} ti ha offerto una birra fresca! (+25% Sete)`,
  },
  cibo: {
    title: '🥩 Cibo lanciato!',
    message: (senderName: string) =>
      `${senderName} ti ha lanciato un cosciotto! (+25% Fame)`,
  },
  troll: {
    title: '👻 Spavento notturno!',
    message: (senderName: string) =>
      `${senderName} ti ha spaventato a morte! (-8% Fame e Svago)`,
  },
  gioca: {
    title: '🎾 Ora del gioco!',
    message: (senderName: string) =>
      `${senderName} ha giocato un po' con te! (+25% Svago)`,
  },
} as const;

type ActionType = keyof typeof ACTIONS;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isActionType(value: unknown): value is ActionType {
  return (
    typeof value === 'string' &&
    value.length <= 16 &&
    Object.prototype.hasOwnProperty.call(ACTIONS, value)
  );
}

function isPushSubscription(value: unknown): value is PushSubscription {
  if (!isRecord(value) || !isRecord(value.keys)) return false;

  return (
    typeof value.endpoint === 'string' &&
    value.endpoint.startsWith('https://') &&
    value.endpoint.length <= 4096 &&
    typeof value.keys.auth === 'string' &&
    value.keys.auth.length > 0 &&
    value.keys.auth.length <= 1024 &&
    typeof value.keys.p256dh === 'string' &&
    value.keys.p256dh.length > 0 &&
    value.keys.p256dh.length <= 1024
  );
}

function unavailableResponse() {
  return NextResponse.json(
    { success: false, reason: 'Notifica non disponibile' },
    { status: 404 }
  );
}

export async function POST(request: Request) {
  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ success: false }, { status: 401 });
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ success: false }, { status: 400 });
    }

    if (!isRecord(body)) {
      return NextResponse.json({ success: false }, { status: 400 });
    }

    const { targetMascotId, actionType } = body;
    if (
      typeof targetMascotId !== 'string' ||
      targetMascotId.length !== 36 ||
      !UUID_PATTERN.test(targetMascotId) ||
      !isActionType(actionType)
    ) {
      return NextResponse.json({ success: false }, { status: 400 });
    }

    const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
    const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;
    if (!vapidPublicKey || !vapidPrivateKey) {
      return NextResponse.json({ success: false }, { status: 503 });
    }

    let supabaseAdmin;
    try {
      supabaseAdmin = getSupabaseAdmin();
    } catch {
      return NextResponse.json({ success: false }, { status: 503 });
    }

    const [targetResult, senderResult] = await Promise.all([
      supabaseAdmin
        .from('mascots')
        .select('id, user_id')
        .eq('id', targetMascotId)
        .maybeSingle(),
      supabaseAdmin
        .from('mascots')
        .select('nome_mascotte')
        .eq('user_id', user.id)
        .maybeSingle(),
    ]);

    const targetMascot = targetResult.data;
    if (
      targetResult.error ||
      !targetMascot ||
      typeof targetMascot.user_id !== 'string'
    ) {
      return unavailableResponse();
    }

    if (targetMascot.user_id === user.id) {
      return NextResponse.json({ success: false }, { status: 403 });
    }

    const [ownerResult, subscriptionResult] = await Promise.all([
      supabaseAdmin.auth.admin.getUserById(targetMascot.user_id),
      supabaseAdmin
        .from('push_subscriptions')
        .select('subscription')
        .eq('user_id', targetMascot.user_id)
        .eq('general_enabled', true),
    ]);

    if (
      ownerResult.error ||
      !ownerResult.data.user ||
      subscriptionResult.error ||
      !subscriptionResult.data?.some((item) => isPushSubscription(item.subscription))
    ) {
      return unavailableResponse();
    }

    const { data: rateLimitGranted, error: rateLimitError } =
      await supabaseAdmin.rpc('claim_push_notification_slot', {
        p_sender_user_id: user.id,
        p_receiver_user_id: targetMascot.user_id,
        p_pair_cooldown_seconds: PAIR_COOLDOWN_SECONDS,
        p_sender_window_seconds: GLOBAL_WINDOW_SECONDS,
        p_sender_max_pushes: GLOBAL_MAX_PUSHES,
      });

    if (rateLimitError) {
      return NextResponse.json({ success: false }, { status: 503 });
    }

    if (rateLimitGranted !== true) {
      return NextResponse.json({ success: false }, { status: 429 });
    }

    const rawSenderName = senderResult.data?.nome_mascotte;
    const senderName =
      typeof rawSenderName === 'string' && rawSenderName.trim()
        ? rawSenderName.trim().slice(0, 80)
        : 'Un campeggiatore anonimo';
    const action = ACTIONS[actionType];
    const payload = JSON.stringify({
      title: action.title,
      body: action.message(senderName),
      icon: '/icons/wallace.png',
      url: '/mascotte',
    });

    webpush.setVapidDetails(
      process.env.VAPID_MAILTO || 'mailto:admin@campeggio.com',
      vapidPublicKey,
      vapidPrivateKey
    );
    let delivered = 0;
    for (const item of subscriptionResult.data || []) {
      if (!isPushSubscription(item.subscription)) continue;
      try {
        await webpush.sendNotification(item.subscription, payload);
        delivered++;
      } catch (error: unknown) {
        const statusCode = typeof error === 'object' && error !== null && 'statusCode' in error
          ? error.statusCode
          : null;
        if (statusCode === 404 || statusCode === 410) {
          await supabaseAdmin.from('push_subscriptions').delete()
            .eq('subscription', item.subscription);
        }
      }
    }

    if (delivered === 0) return unavailableResponse();

    return NextResponse.json({ success: true });
  } catch {
    console.error('Invio push non riuscito');
    return NextResponse.json({ success: false }, { status: 500 });
  }
}
