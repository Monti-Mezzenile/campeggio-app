import { NextResponse } from 'next/server';
import webpush from 'web-push';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// ✅ CONTROLLO DI SICUREZZA PER IL BUILD
// Imposta le VAPID details solo se le chiavi sono effettivamente presenti.
if (process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(
    process.env.VAPID_MAILTO || 'mailto:admin@campeggio.com',
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
  );
} else {
  console.warn("⚠️ Chiavi VAPID non trovate. Le notifiche Push non funzioneranno.");
}

export async function POST(req: Request) {
  try {
    // 🛑 Se le chiavi non ci sono (es. in locale senza .env), fermati subito
    if (!process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || !process.env.VAPID_PRIVATE_KEY) {
      return NextResponse.json({ success: false, reason: 'Chiavi VAPID non configurate sul server' }, { status: 500 });
    }

    const { receiverUserId, title, message } = await req.json();

    // 1. Recupera la subscription del destinatario
    const { data: subData } = await supabaseAdmin
      .from('push_subscriptions')
      .select('subscription')
      .eq('user_id', receiverUserId)
      .maybeSingle();

    if (!subData || !subData.subscription) {
      return NextResponse.json({ success: false, reason: 'Nessun dispositivo registrato per questo utente' });
    }

    const payload = JSON.stringify({
      title,
      body: message,
      icon: '/icons/wallace.png',
      url: '/mascotte'
    });

    await webpush.sendNotification(subData.subscription, payload);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Errore invio Push:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}