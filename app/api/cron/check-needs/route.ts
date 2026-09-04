import { NextResponse } from 'next/server';
import { timingSafeEqual } from 'node:crypto';
import webpush from 'web-push';
import { getSupabaseAdmin } from '@/lib/supabase-admin';

const DECAY_RATES = { fame: 3.5, sete: 4.5, svago: 3.0 };
const NEED_NOTIFICATION_COOLDOWN_SECONDS = 20 * 60 * 60;
const MILLISECONDS_PER_DAY = 24 * 60 * 60 * 1000;

const EVENT_REMINDERS = {
  7: {
    key: 'days_7',
    title: '🏕️ Monti si avvicina!',
    body: (eventName: string) =>
      `${eventName} è tra una settimana. È il momento di ricordarsi dove hai nascosto la tenda.`,
  },
  3: {
    key: 'days_3',
    title: '🔥 Mancano solo 3 giorni!',
    body: (eventName: string) =>
      `${eventName} è quasi qui. Lo zaino, purtroppo, non si preparerà da solo.`,
  },
  1: {
    key: 'days_1',
    title: '🎒 Domani si parte!',
    body: (eventName: string) =>
      `${eventName} ci aspetta. Ultimo controllo: tenda, sacco a pelo e dignità.`,
  },
  0: {
    key: 'day_0',
    title: '🐇 È il giorno dei Monti!',
    body: (eventName: string, location: string | null) =>
      `${eventName} comincia oggi. ${location ? `Il campo chiama da ${location}!` : 'Il campo chiama: ci vediamo tra le tende!'}`,
  },
} as const;

type ReminderDay = keyof typeof EVENT_REMINDERS;

type EventRow = {
  id: string;
  titolo: string | null;
  luogo: string | null;
  data_inizio: string | null;
  data_evento: string | null;
};

export const runtime = 'nodejs';

function hasValidBearerToken(authHeader: string | null, expectedSecret: string) {
  if (!authHeader?.startsWith('Bearer ')) return false;

  const receivedSecret = authHeader.slice('Bearer '.length);
  const receivedBuffer = Buffer.from(receivedSecret);
  const expectedBuffer = Buffer.from(expectedSecret);

  return (
    receivedBuffer.length === expectedBuffer.length &&
    timingSafeEqual(receivedBuffer, expectedBuffer)
  );
}

function getStatusCode(error: unknown) {
  if (typeof error !== 'object' || error === null || !('statusCode' in error)) {
    return null;
  }

  return typeof error.statusCode === 'number' ? error.statusCode : null;
}

function getRomeCalendarDay(date: Date) {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Europe/Rome',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date);
  const values = Object.fromEntries(
    parts.map((part) => [part.type, part.value])
  );

  return Date.UTC(
    Number(values.year),
    Number(values.month) - 1,
    Number(values.day)
  );
}

function parseEventCalendarDay(value: string | null) {
  if (!value) return null;
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(value);
  if (!match) return null;

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const timestamp = Date.UTC(year, month - 1, day);
  const parsed = new Date(timestamp);

  if (
    parsed.getUTCFullYear() !== year ||
    parsed.getUTCMonth() !== month - 1 ||
    parsed.getUTCDate() !== day
  ) {
    return null;
  }

  return timestamp;
}

function isAuthorizedCronRequest(request: Request, cronSecret?: string) {
  if (cronSecret) {
    return hasValidBearerToken(
      request.headers.get('authorization'),
      cronSecret
    );
  }

  // Vercel identifica sempre le invocazioni pianificate con questo user-agent.
  // Il claim atomico nel database limita comunque ogni mascotte a una notifica
  // per stato critico durante la finestra di cooldown.
  return (
    process.env.VERCEL === '1' &&
    request.headers.get('user-agent') === 'vercel-cron/1.0'
  );
}

export async function GET(request: Request) {
  const cronSecret = process.env.CRON_SECRET;
  if (!isAuthorizedCronRequest(request, cronSecret)) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;
  if (!vapidPublicKey || !vapidPrivateKey) {
    return NextResponse.json({ success: false }, { status: 503 });
  }

  let supabase: ReturnType<typeof getSupabaseAdmin>;
  try {
    supabase = getSupabaseAdmin();
  } catch {
    return NextResponse.json({ success: false }, { status: 503 });
  }

  try {
    webpush.setVapidDetails(
      process.env.VAPID_MAILTO || 'mailto:tuamail@campeggio.app',
      vapidPublicKey,
      vapidPrivateKey
    );

    // 1. Recupera tutte le mascotte
    const { data: mascots, error } = await supabase.from('mascots').select('*');
    if (error) throw error;

    const now = new Date();
    let sentCount = 0;
    let mascotNotificationsSent = 0;
    let eventNotificationsSent = 0;

    for (const mascot of mascots || []) {
      const lastUpdate = mascot.last_updated_at ? new Date(mascot.last_updated_at) : new Date();
      const hoursPassed = Math.max(0, (now.getTime() - lastUpdate.getTime()) / (1000 * 60 * 60));

      // Calcola i livelli attuali con il decadimento
      const currentFame = Math.max(0, (mascot.fame ?? 100) - hoursPassed * DECAY_RATES.fame);
      const currentSete = Math.max(0, (mascot.sete ?? 100) - hoursPassed * DECAY_RATES.sete);
      const currentSvago = Math.max(0, (mascot.svago ?? 100) - hoursPassed * DECAY_RATES.svago);

      const needs: Array<{ key: string; label: string }> = [];
      if (currentFame <= 25) needs.push({ key: 'fame', label: 'Fame 🥕' });
      if (currentSete <= 25) needs.push({ key: 'sete', label: 'Sete 💧' });
      if (currentSvago <= 25) needs.push({ key: 'svago', label: 'Noia 🎮' });

      if (needs.length > 0) {
        // Recupera i token push dell'utente
        const { data: subs, error: subscriptionsError } = await supabase
          .from('push_subscriptions')
          .select('subscription')
          .eq('user_id', mascot.user_id);

        if (subscriptionsError || !subs?.length) continue;

        const needSignature = needs.map((need) => need.key).join(',');
        const { data: notificationClaimed, error: claimError } =
          await supabase.rpc('claim_mascot_need_notification', {
            p_mascot_id: mascot.id,
            p_need_signature: needSignature,
            p_cooldown_seconds: NEED_NOTIFICATION_COOLDOWN_SECONDS,
          });

        if (claimError || notificationClaimed !== true) continue;

        const payload = JSON.stringify({
          title: `⚠️ ${mascot.nome_mascotte || 'La tua mascotte'} ha bisogno di te!`,
          body: `Attenzione: ${needs.map((need) => need.label).join(' e ')} sono a un livello critico. Entra nel campeggio!`,
          icon: '/tamagotchi/fase1_coniglio_piccolo.png',
          tag: `mascot-needs-${mascot.id}`,
          url: '/mascotte',
        });

        for (const subItem of subs) {
          try {
            await webpush.sendNotification(subItem.subscription, payload);
            sentCount++;
            mascotNotificationsSent++;
          } catch (err: unknown) {
            // Rimuove iscrizioni scadute o non più valide (es. app disinstallata)
            const statusCode = getStatusCode(err);
            if (statusCode === 410 || statusCode === 404) {
              await supabase
                .from('push_subscriptions')
                .delete()
                .eq('subscription', subItem.subscription);
            }
          }
        }
      }
    }

    const { data: events, error: eventsError } = await supabase
      .from('events')
      .select('id, titolo, luogo, data_inizio, data_evento');
    if (eventsError) throw eventsError;

    const today = getRomeCalendarDay(now);
    const dueEvents = ((events || []) as EventRow[]).flatMap((event) => {
      const startDay = parseEventCalendarDay(
        event.data_inizio || event.data_evento
      );
      if (startDay === null) return [];

      const daysUntilStart = Math.round(
        (startDay - today) / MILLISECONDS_PER_DAY
      );
      if (!(daysUntilStart in EVENT_REMINDERS)) return [];

      return [{
        event,
        reminder: EVENT_REMINDERS[daysUntilStart as ReminderDay],
      }];
    });

    if (dueEvents.length > 0) {
      const { data: subscriptions, error: eventSubscriptionsError } =
        await supabase
          .from('push_subscriptions')
          .select('user_id, subscription');
      if (eventSubscriptionsError) throw eventSubscriptionsError;

      for (const { event, reminder } of dueEvents) {
        const eventName = event.titolo?.trim().slice(0, 100) || 'Il prossimo Monti';
        const location = event.luogo?.trim().slice(0, 80) || null;
        const payload = JSON.stringify({
          title: reminder.title,
          body: reminder.body(eventName, location),
          icon: '/apple-touch-icon.png',
          badge: '/icons/wallace.png',
          tag: `event-reminder-${event.id}-${reminder.key}`,
          url: `/events/${event.id}`,
        });

        for (const subscription of subscriptions || []) {
          const { data: notificationClaimed, error: claimError } =
            await supabase.rpc('claim_event_push_notification', {
              p_event_id: event.id,
              p_user_id: subscription.user_id,
              p_reminder_key: reminder.key,
            });

          if (claimError || notificationClaimed !== true) continue;

          try {
            await webpush.sendNotification(subscription.subscription, payload);
            sentCount++;
            eventNotificationsSent++;
          } catch (error: unknown) {
            const statusCode = getStatusCode(error);
            if (statusCode === 410 || statusCode === 404) {
              await supabase
                .from('push_subscriptions')
                .delete()
                .eq('subscription', subscription.subscription);
            }
          }
        }
      }
    }

    return NextResponse.json(
      {
        success: true,
        notificationsSent: sentCount,
        mascotNotificationsSent,
        eventNotificationsSent,
      },
      { headers: { 'Cache-Control': 'no-store' } }
    );
  } catch {
    console.error('Esecuzione cron notifiche non riuscita');
    return NextResponse.json({ success: false }, { status: 500 });
  }
}
