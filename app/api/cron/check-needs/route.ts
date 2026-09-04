import { NextResponse } from 'next/server';
import { timingSafeEqual } from 'node:crypto';
import webpush from 'web-push';
import { getSupabaseAdmin } from '@/lib/supabase-admin';

const DECAY_RATES = { fame: 3.5, sete: 4.5, svago: 3.0 };
const NEED_NOTIFICATION_COOLDOWN_SECONDS = 20 * 60 * 60;

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

    return NextResponse.json(
      { success: true, notificationsSent: sentCount },
      { headers: { 'Cache-Control': 'no-store' } }
    );
  } catch {
    console.error('Esecuzione cron notifiche non riuscita');
    return NextResponse.json({ success: false }, { status: 500 });
  }
}
