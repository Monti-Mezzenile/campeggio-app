"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Button from "@/components/ui/Button";

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // ⚡ 1. Controllo immediato sessione
    async function checkSession() {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (session) {
        // Se già loggato, via diretti agli eventi!
        router.replace("/events");
      } else {
        setLoading(false);
      }
    }

    checkSession();

    // ⚡ 2. Listener per OAuth Callback
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (session) {
        router.replace("/events");
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [router]);

  async function loginWithGoogle() {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      alert(error.message);
    }
  }

  // Loader ultraleggero durante il check sessione iniziale
  if (loading) {
    return (
      <main className="min-h-screen bg-[#1b2b25] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-white/20 border-t-white rounded-full animate-spin" />
      </main>
    );
  }

  return (
    <main className="relative min-h-screen overflow-hidden flex items-center justify-center p-4 select-none">
      
      {/* 🎬 VIDEO BACKGROUND OTTIMIZZATO */}
      <video
        autoPlay
        muted
        loop
        playsInline
        preload="metadata"
        className="absolute inset-0 w-full h-full object-cover scale-105"
      >
        <source src="/videos/monti-login.mp4" type="video/mp4" />
      </video>

      {/* OVERLAY GLASS */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-[2px]" />

      {/* 📦 CONTENT CONTAINER */}
      <div className="relative z-10 text-center max-w-sm w-full flex flex-col items-center justify-center gap-6 px-4 py-8">
        
        {/* LOGO OTTIMIZZATO */}
        <div className="relative w-64 h-24 flex items-center justify-center">
          <Image
            src="/images/logo-monti.png"
            alt="MONTI Logo"
            width={260}
            height={100}
            priority
            className="object-contain drop-shadow-2xl"
          />
        </div>

        {/* DESCRIZIONE */}
        <div className="space-y-3">
          <p className="text-[#FFF4E3] text-sm leading-relaxed drop-shadow-md font-medium">
            Perché dopo anni di campeggi improvvisati era ora di fingere di essere organizzati.
          </p>

          <p className="text-[#FFF4E3]/90 text-xs italic font-medium border-l-2 border-[#FFF4E3]/30 pl-3 text-left">
            "Il caos era la legge della natura; l'ordine era il sogno dell'uomo."
            <span className="block text-[10px] text-[#FFF4E3]/60 not-italic mt-0.5 font-normal">
              — Henry Adams
            </span>
          </p>
        </div>

        {/* BOTTONE LOGIN */}
        <div className="w-full space-y-2 pt-2">
          <Button
            onClick={loginWithGoogle}
            className="w-full bg-white/15 border border-[#FFF4E3]/40 text-[#FFF4E3] backdrop-blur-md shadow-lg hover:bg-white/25 active:scale-98 transition py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2"
          >
            <span>🐰</span>
            <span>Accedi con Google</span>
          </Button>

          <p className="text-[10px] text-[#FFF4E3]/70 tracking-wider uppercase font-bold">
            Solo per veri sopravvissuti
          </p>
        </div>

      </div>
    </main>
  );
}