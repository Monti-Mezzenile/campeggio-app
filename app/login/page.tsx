"use client";

import { useEffect, useState, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Button from "@/components/ui/Button";

export default function LoginPage() {
  const router = useRouter();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);
  const [authLoading, setAuthLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    async function initAuth() {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (session && isMounted) {
          router.replace("/");
          return;
        }
      } catch (e) {
        console.error("Errore sessione:", e);
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    initAuth();
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN" && session && isMounted) {
        router.replace("/");
      }
    });
    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [router]);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.load();
      videoRef.current.play();
    }
  }, [isSignUp]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setAuthLoading(true);
    setErrorMsg(null);
    if (isSignUp) {
      const { error } = await supabase.auth.signUp({
        email,
        password,
      });
      if (error) {
        setErrorMsg("Errore registrazione: " + error.message);
        setAuthLoading(false);
      } else {
        router.replace("/profile");
      }
    } else {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) {
        setErrorMsg("Credenziali non valide o utente non trovato.");
        setAuthLoading(false);
      }
    }
  }

  if (loading) {
    return (
      <main className="min-h-[100dvh] w-full bg-[#0d1b1e] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-white/20 border-t-white rounded-full animate-spin" />
      </main>
    );
  }

  return (
    <main className="relative min-h-[100dvh] w-full overflow-hidden flex items-center justify-center px-4 pt-[calc(env(safe-area-inset-top)+1rem)] pb-[calc(env(safe-area-inset-bottom)+1rem)] bg-[#0d1b1e] select-none">
      {/* VIDEO BACKGROUND - Ancorato fisicamente allo schermo intero */}
      <video
        ref={videoRef}
        autoPlay
        muted
        playsInline
        loop={!isSignUp}
        preload="metadata"
        className="fixed inset-0 w-full h-full object-cover scale-105 transition-all duration-700 pointer-events-none"
      >
        <source
          src={isSignUp ? "/videos/monti-crea.mp4" : "/videos/monti-login.mp4"}
          type="video/mp4"
        />
      </video>

      {/* OVERLAY GLASS */}
      <div className="fixed inset-0 bg-black/50 backdrop-blur-[2px] pointer-events-none" />

      {/* CONTENT CONTAINER */}
      <div className="relative z-10 text-center max-w-sm w-full flex flex-col items-center justify-center gap-4 px-4 py-4 max-h-full">
        {/* LOGO */}
        <div className="relative w-56 h-20 flex items-center justify-center shrink-0">
          <Image
            src="/images/logo-monti.png"
            alt="MONTI Logo"
            width={220}
            height={80}
            priority
            className="object-contain drop-shadow-2xl"
          />
        </div>

        {/* DESCRIZIONE */}
        <div className="space-y-2 shrink-0">
          <p className="text-[#FFF4E3] text-xs sm:text-sm leading-relaxed drop-shadow-md font-medium">
            {isSignUp
              ? "Unisciti alla spedizione. Crea le tue credenziali da campo."
              : "Perché dopo anni di campeggi improvvisati era ora di fingere di essere organizzati."}
          </p>
          <p className="text-[#FFF4E3]/90 text-[11px] italic font-medium border-l-2 border-[#FFF4E3]/30 pl-3 text-left">
            "Il caos era la legge della natura; l'ordine era il sogno dell'uomo."
            <span className="block text-[9px] text-[#FFF4E3]/60 not-italic mt-0.5 font-normal">
              — Henry Adams
            </span>
          </p>
        </div>

        {/* FORM LOGIN / REGISTRAZIONE */}
        <form onSubmit={handleSubmit} className="w-full space-y-2.5 pt-1 shrink-0">
          <input
            type="email"
            placeholder="Email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-4 py-2.5 bg-white/10 border border-[#FFF4E3]/30 rounded-xl text-[#FFF4E3] placeholder-[#FFF4E3]/50 focus:outline-none focus:border-[#FFF4E3] backdrop-blur-md text-sm"
          />
          <input
            type="password"
            placeholder="Password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-4 py-2.5 bg-white/10 border border-[#FFF4E3]/30 rounded-xl text-[#FFF4E3] placeholder-[#FFF4E3]/50 focus:outline-none focus:border-[#FFF4E3] backdrop-blur-md text-sm"
          />
          {errorMsg && (
            <p className="text-red-400 text-xs text-center font-medium bg-red-950/40 py-1 rounded-lg border border-red-500/30">
              {errorMsg}
            </p>
          )}
          <Button
            type="submit"
            disabled={authLoading}
            className="w-full bg-white/20 border border-[#FFF4E3]/40 text-[#FFF4E3] backdrop-blur-md shadow-lg hover:bg-white/30 active:scale-98 transition py-2.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2"
          >
            <span>
              {authLoading
                ? "Elaborazione..."
                : isSignUp
                ? "Crea Account"
                : "Accedi"}
            </span>
          </Button>
        </form>

        {/* LINK SWITCH LOGIN / REGISTRAZIONE */}
        <div className="pt-1 border-t border-[#FFF4E3]/10 w-full shrink-0">
          <button
            type="button"
            onClick={() => {
              setIsSignUp(!isSignUp);
              setErrorMsg(null);
            }}
            className="text-xs text-[#FFF4E3]/80 hover:text-white underline font-medium transition"
          >
            {isSignUp
              ? "Hai già un account? Accedi qui"
              : "Non hai un account? Registrati"}
          </button>
        </div>
        <p className="text-[10px] text-[#FFF4E3]/70 tracking-wider uppercase font-bold shrink-0">
          Solo per veri sopravvissuti
        </p>
      </div>
    </main>
  );
}