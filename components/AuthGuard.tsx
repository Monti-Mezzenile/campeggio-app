"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    // Se siamo già sulla pagina di login, non serve controllare nulla
    if (pathname === "/login") {
      setChecking(false);
      return;
    }

    // 1. Controllo iniziale della sessione
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        router.replace("/login");
      } else {
        setChecking(false);
      }
    };

    checkSession();

    // 2. Ascolta in tempo reale i cambiamenti di autenticazione
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_OUT" || !session) {
        if (pathname !== "/login") {
          router.replace("/login");
        }
      } else if (session) {
        setChecking(false);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [router, pathname]);

  if (checking && pathname !== "/login") {
    return (
      <main className="min-h-screen flex items-center justify-center bg-slate-900 text-white font-sans p-6 text-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-amber-400 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-semibold tracking-wide">Verifica accesso in corso...</p>
        </div>
      </main>
    );
  }

  return <>{children}</>;
}