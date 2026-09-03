import { NextResponse } from 'next/server';
import { timingSafeEqual } from 'node:crypto';
import webpush from 'web-push';
import { getSupabaseAdmin } from '@/lib/supabase-admin';

const DECAY_RATES = { fame: 3.5, sete: 4.5, svago: 3.0 };

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

export async function GET(request: Request) {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) {
    return new NextResponse('Service unavailable', { status: 503 });
  }

  const authHeader = request.headers.get('authorization');
  if (!hasValidBearerToken(authHeader, cronSecret)) {
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

      const needs = [];
      if (currentFame <= 25) needs.push("Fame 🥕");
      if (currentSete <= 25) needs.push("Sete 💧");
      if (currentSvago <= 25) needs.push("Noia 🎮");

      if (needs.length > 0) {
        // Recupera i token push dell'utente
        const { data: subs } = await supabase
          .from('push_subscriptions')
          .select('subscription')
          .eq('user_id', mascot.user_id);

        if (subs && subs.length > 0) {
          const payload = JSON.stringify({
            title: `⚠️ ${mascot.nome_mascotte || 'La tua mascotte'} ha bisogno di te!`,
            message: `Attenzione: ha troppa ${needs.join(' e ')}. Entra nel campeggio prima che sia troppo tardi!`,
            icon: '/tamagotchi/fase1_coniglio_piccolo.png'
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
    }

    return NextResponse.json({ success: true, notificationsSent: sentCount });
  } catch {
    console.error('Esecuzione cron notifiche non riuscita');
    return NextResponse.json({ success: false }, { status: 500 });
  }
}
