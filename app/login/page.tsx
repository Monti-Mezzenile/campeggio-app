"use client";

import { useEffect, useState, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Button from "@/components/ui/Button";

export default function LoginPage() {
  const router = useRouter();
  const signupVideoRef = useRef<HTMLVideoElement>(null);

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
    if (isSignUp && signupVideoRef.current) {
      signupVideoRef.current.currentTime = 0;
      signupVideoRef.current.play().catch(() => {});
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
      <main className="fixed inset-0 h-[100dvh] w-full bg-[#0d1b1e] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-white/20 border-t-white rounded-full animate-spin" />
      </main>
    );
  }

  return (
    <main className="fixed inset-0 h-[100dvh] w-full overflow-hidden flex flex-col justify-between items-center px-4 pt-[calc(env(safe-area-inset-top)+0.75rem)] pb-[calc(env(safe-area-inset-bottom)+0.75rem)] bg-[#0d1b1e] select-none">
      
      {/* 🎥 VIDEO 1: LOGIN */}
      <video
        autoPlay
        muted
        playsInline
        loop
        preload="auto"
        className={`fixed inset-0 w-full h-full object-cover scale-105 transition-opacity duration-1000 pointer-events-none ${
          !isSignUp ? "opacity-100 z-0" : "opacity-0 z-0"
        }`}
      >
        <source src="/videos/monti-login.mp4" type="video/mp4" />
      </video>

      {/* 🎥 VIDEO 2: CREA ACCOUNT */}
      <video
        ref={signupVideoRef}
        autoPlay
        muted
        playsInline
        preload="auto"
        className={`fixed inset-0 w-full h-full object-cover scale-105 transition-opacity duration-1000 pointer-events-none ${
          isSignUp ? "opacity-100 z-0" : "opacity-0 z-0"
        }`}
      >
        <source src="/videos/monti-crea.mp4" type="video/mp4" />
      </video>

      {/* OVERLAY SFUMATO (Sfumatura scura solo in alto e in basso per la leggibilità del testo) */}
      <div className="fixed inset-0 bg-gradient-to-b from-black/80 via-transparent to-black/70 pointer-events-none z-0" />

      {/* BLOCCO SUPERIORE: LOGO + TAB + INPUTS */}
      <div className="relative z-10 max-w-sm w-full flex flex-col items-center gap-2.5">
        
        {/* LOGO MONTI */}
        <div className="relative w-44 sm:w-52 h-12 sm:h-14 shrink-0 filter drop-shadow-[0_4px_12px_rgba(0,0,0,0.8)]">
          <Image
            src="/images/logo-monti.png"
            alt="MONTI Logo"
            fill
            priority
            className="object-contain"
          />
        </div>

        {/* TAB SWITCHER DEDICATO (LOGIN vs REGISTRAZIONE) */}
        <div className="w-full p-1 bg-black/50 backdrop-blur-xl rounded-2xl border border-white/15 flex items-center shadow-2xl">
          <button
            type="button"
            onClick={() => {
              setIsSignUp(false);
              setErrorMsg(null);
            }}
            className={`flex-1 py-1.5 text-xs font-black uppercase tracking-wider rounded-xl transition-all duration-300 flex items-center justify-center gap-1.5 ${
              !isSignUp
                ? "bg-white/20 text-white shadow-md border border-white/20 backdrop-blur-md"
                : "text-white/40 hover:text-white/80"
            }`}
          >
            <span>🔑</span>
            <span>Accedi</span>
          </button>
          
          <button
            type="button"
            onClick={() => {
              setIsSignUp(true);
              setErrorMsg(null);
            }}
            className={`flex-1 py-1.5 text-xs font-black uppercase tracking-wider rounded-xl transition-all duration-300 flex items-center justify-center gap-1.5 ${
              isSignUp
                ? "bg-emerald-500/80 text-white shadow-lg shadow-emerald-950/40 border border-emerald-400/40 backdrop-blur-md"
                : "text-white/40 hover:text-white/80"
            }`}
          >
            <span>⛺</span>
            <span>Registrati</span>
          </button>
        </div>

        {/* CARD FORM COMPATTA IN ALTO */}
        <div className={`w-full bg-black/40 backdrop-blur-xl border rounded-2xl p-3.5 shadow-2xl transition-all duration-500 space-y-2.5 ${
          isSignUp ? "border-emerald-500/40 shadow-emerald-950/30" : "border-white/15"
        }`}>
          <form onSubmit={handleSubmit} className="w-full space-y-2">
            <input
              type="email"
              placeholder="Email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3.5 py-2 bg-black/40 border border-white/15 rounded-xl text-[#FFF4E3] placeholder-[#FFF4E3]/40 focus:outline-none focus:border-emerald-400/80 backdrop-blur-md text-base transition-all"
            />
            <input
              type="password"
              placeholder="Password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3.5 py-2 bg-black/40 border border-white/15 rounded-xl text-[#FFF4E3] placeholder-[#FFF4E3]/40 focus:outline-none focus:border-emerald-400/80 backdrop-blur-md text-base transition-all"
            />

            {errorMsg && (
              <p className="text-rose-300 text-xs text-center font-bold bg-rose-950/60 py-1 px-2 rounded-lg border border-rose-500/40 backdrop-blur-md">
                ⚠️ {errorMsg}
              </p>
            )}

            <Button
              type="submit"
              disabled={authLoading}
              className={`w-full py-2.5 rounded-xl font-black text-xs uppercase tracking-wider transition-all duration-300 shadow-lg flex items-center justify-center gap-2 ${
                isSignUp
                  ? "bg-emerald-500 hover:bg-emerald-400 text-slate-950 border border-emerald-300 shadow-emerald-950/50"
                  : "bg-white/20 hover:bg-white/30 text-[#FFF4E3] border border-white/30 backdrop-blur-md"
              }`}
            >
              <span>
                {authLoading
                  ? "Verifica..."
                  : isSignUp
                  ? "Crea Account Spedizione"
                  : "Accedi al Campo"}
              </span>
            </Button>
          </form>
        </div>
      </div>

      {/* FOOTER IN BASSO (Citazione e claim ancorati al fondo) */}
      <div className="relative z-10 text-center space-y-1 max-w-xs">
        <p className="text-[#FFF4E3]/80 text-[10px] italic font-medium drop-shadow-md leading-tight">
          "Il caos era la legge della natura; l'ordine era il sogno dell'uomo."
        </p>
        <p className="text-[9px] text-[#FFF4E3]/50 tracking-widest uppercase font-black">
          Solo per veri sopravvissuti
        </p>
      </div>
    </main>
  );
}