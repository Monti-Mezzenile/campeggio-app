import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import webpush from 'web-push';

// Configurazione chiavi VAPID per le notifiche Push
if (process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(
    'mailto:tuamail@campeggio.app',
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
  );
}

const DECAY_RATES = { fame: 3.5, sete: 4.5, svago: 3.0 };

export async function GET(request: Request) {
  // Verfica secret di Vercel per evitare chiamate esterne non autorizzate
  const authHeader = request.headers.get('authorization');
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  try {
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
            } catch (err: any) {
              // Rimuove iscrizioni scadute o non più valide (es. app disinstallata)
              if (err.statusCode === 410 || err.statusCode === 404) {
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
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}