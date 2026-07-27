"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

// --- SVG Icons ---
function PlusIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
    </svg>
  );
}

function TrashIcon({ className = "w-3.5 h-3.5" }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
    </svg>
  );
}

function SparklesIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456z" />
    </svg>
  );
}

export default function CuriositaPage() {
  const router = useRouter();
  const [curiosita, setCuriosita] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  async function loadCuriosita() {
    const { data, error } = await supabase
      .from("curiosities")
      .select("*")
      .eq("tipo", "community")
      .order("created_at", { ascending: false });

    if (error) {
      console.error(error);
      return;
    }

    setCuriosita(data || []);
    setLoading(false);
  }

  useEffect(() => {
    loadCuriosita();
  }, []);

  async function deleteCuriosita(item: any, e: React.MouseEvent) {
    e.stopPropagation();

    const conferma = confirm("Vuoi davvero eliminare questo ricordo?");
    if (!conferma) return;

    if (item.immagine_url) {
      const path = item.immagine_url.split("/curiosities/")[1];
      if (path) {
        await supabase.storage.from("curiosities").remove([path]);
      }
    }

    if (item.audio_url) {
      const path = item.audio_url.split("/curiosities/")[1];
      if (path) {
        await supabase.storage.from("curiosities").remove([path]);
      }
    }

    const { error } = await supabase.from("curiosities").delete().eq("id", item.id);

    if (error) {
      alert(error.message);
      return;
    }

    loadCuriosita();
  }

  // PILASTRI UFFICIALI (Con Bucock aggiornato)
  const ufficiali = [
    {
      titolo: "Storia di Monti",
      sottotitolo: "Le Origini & La Filosofia",
      immagine: "/curiosity/storia.png",
      link: "/curiosita/storia-monti",
      badge: "Storia",
      glowColor: "bg-emerald-500/15",
    },
    {
      titolo: "La corsa dei cavalli",
      sottotitolo: "Regolamento & Fanfara",
      immagine: "/curiosity/corsa.png",
      link: "/curiosita/corsa-dei-cavalli",
      badge: "Evento",
      glowColor: "bg-amber-500/15",
    },
    {
      titolo: "Bucock",
      sottotitolo: "Tradizioni & Aneddoti",
      immagine: "/curiosity/bockok.png",
      link: "/curiosita/bookock",
      badge: "Mito",
      glowColor: "bg-purple-500/15",
    },
    {
      titolo: "Cavallo",
      sottotitolo: "La Mascotte di Monti",
      immagine: "/curiosity/cavallo.png",
      link: "/curiosita/cavallo",
      badge: "Mascotte",
      glowColor: "bg-blue-500/15",
    },
  ];

  if (loading) {
    return (
      <main className="min-h-screen p-4 md:p-6 pb-28 max-w-3xl mx-auto space-y-6">
        <div className="flex justify-center pt-6">
          <div className="h-12 w-48 bg-white/50 animate-pulse rounded-full backdrop-blur-md border border-white" />
        </div>
        <div className="grid grid-cols-2 gap-4 pt-4">
          {[1, 2, 3, 4].map((n) => (
            <div key={n} className="h-36 bg-white/50 border border-white animate-pulse rounded-3xl backdrop-blur-md" />
          ))}
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen p-4 sm:p-6 pb-32 max-w-3xl mx-auto select-none space-y-7 text-zinc-900">
      
      {/* 💡 HERO HEADER COMPATTO CON GLOW GLASS */}
      <header className="relative overflow-hidden bg-white/80 border border-white/90 rounded-3xl p-6 sm:p-7 shadow-xl backdrop-blur-md text-center">
        <div className="absolute top-0 right-1/2 translate-x-1/2 -mt-10 w-48 h-48 bg-amber-500/15 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-950 text-[10px] font-black uppercase tracking-widest shadow-xs">
            <SparklesIcon className="w-3.5 h-3.5 text-amber-600" />
            <span>Storie & Leggende</span>
          </div>

          <div className="flex items-center justify-center gap-3 pt-1">
            <div className="p-2 rounded-2xl bg-amber-500/10 border border-amber-500/20 shadow-sm">
              <img 
                src="/icons/lampadina.png" 
                alt="Curiosità" 
                className="h-7 w-7 object-contain drop-shadow-sm"
              />
            </div>
            <h1 className="text-3xl sm:text-4xl font-black text-zinc-950 tracking-tight">
              Curiosità
            </h1>
          </div>

          <p className="text-xs sm:text-sm font-medium text-zinc-600 max-w-md mx-auto leading-relaxed">
            Un riassunto piacevole di traumi, sbornie e regole insensate che abbiamo scambiato per tradizioni.
          </p>
        </div>
      </header>

      {/* 🏕️ SEZIONE PILASTRI UFFICIALI (CARD 3D CREATIVE) */}
      <section className="space-y-3">
        <div className="px-2">
          <h2 className="text-xs font-black uppercase tracking-wider text-zinc-200">
            I Pilastri di MONTI
          </h2>
        </div>

        <div className="grid grid-cols-2 gap-3.5 sm:gap-4">
          {ufficiali.map((item) => (
            <button
              key={item.titolo}
              onClick={() => router.push(item.link)}
              className="group relative h-36 sm:h-40 rounded-3xl bg-white/80 backdrop-blur-md border border-white/90 shadow-md flex flex-col justify-between p-3.5 sm:p-4 text-left transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl hover:bg-white/95 overflow-hidden"
            >
              {/* Glow di Sfondo tematico */}
              <div className={`absolute top-0 right-0 w-28 h-28 ${item.glowColor} rounded-full blur-2xl group-hover:scale-150 transition-transform pointer-events-none`} />

              {/* Badge Top Left */}
              <div className="flex justify-between items-start w-full relative z-10">
                <span className="text-[9px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-zinc-900 text-white shadow-xs">
                  {item.badge}
                </span>
              </div>

              {/* Immagine grande ancorata e con zoom integrato */}
              <div className="absolute top-1 right-1 sm:top-2 sm:right-2 w-24 h-24 sm:w-28 sm:h-28 flex items-center justify-center pointer-events-none">
                <img
                  src={item.immagine}
                  alt={item.titolo}
                  className="w-full h-full object-contain opacity-85 group-hover:opacity-100 group-hover:scale-110 transition-all duration-300 drop-shadow-md"
                />
              </div>

              {/* Dettagli Testuali in Basso */}
              <div className="relative z-10 pt-8 w-full">
                <h3 className="font-black text-zinc-950 text-xs sm:text-sm leading-tight tracking-tight drop-shadow-xs line-clamp-1">
                  {item.titolo}
                </h3>
                <p className="text-[10px] font-bold text-zinc-500 line-clamp-1 mt-0.5">
                  {item.sottotitolo}
                </p>
              </div>
            </button>
          ))}
        </div>
      </section>

      {/* ✨ SEZIONE COMMUNITY */}
      <section className="space-y-4 pt-2">
        
        {/* Header Community Glassmorphic */}
        <div className="flex justify-between items-center bg-white/80 backdrop-blur-md p-3.5 sm:p-4 rounded-3xl border border-white/90 shadow-md">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-amber-500/15 border border-amber-500/30 shadow-xs">
              <img 
                src="/icons/profilo.png" 
                alt="Community" 
                className="h-5 w-5 sm:h-6 sm:w-6 object-contain"
              />
            </div>
            <div>
              <h2 className="text-xs sm:text-sm font-black text-zinc-950 uppercase tracking-wide leading-none">
                Ricordi Community
              </h2>
              <p className="text-[11px] text-zinc-500 font-medium mt-1">
                Aneddoti e storie condivise dai ragazzi
              </p>
            </div>
          </div>

          <button
            onClick={() => router.push("/curiosita/nuova")}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-2xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-950 border border-amber-500/40 font-black text-xs transition-all shadow-sm active:scale-95"
          >
            <PlusIcon className="w-4 h-4 text-amber-900" />
            <span>Aggiungi</span>
          </button>
        </div>

        {/* Empty State / Grid */}
        {curiosita.length === 0 ? (
          <div className="text-center py-10 px-4 rounded-3xl bg-white/60 border border-white/80 backdrop-blur-md shadow-sm space-y-3">
            <div className="w-16 h-16 mx-auto bg-amber-500/10 rounded-2xl flex items-center justify-center border border-amber-500/20">
              <img 
                src="/icons/tenda-grossa.png" 
                alt="Nessuna Curiosità" 
                className="h-10 w-auto opacity-80 drop-shadow-xs"
              />
            </div>
            <div>
              <p className="text-zinc-950 font-black text-sm">
                Ancora nessun ricordo registrato
              </p>
              <p className="text-zinc-500 text-xs font-medium mt-0.5">
                Sii il primo a tramandare un aneddoto di Monti!
              </p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3.5 sm:gap-4">
            {curiosita.map((item) => (
              <div key={item.id} className="relative group">
                <button
                  onClick={() => router.push(`/curiosita/${item.id}`)}
                  className="w-full aspect-square rounded-3xl bg-white/80 backdrop-blur-md border border-white/90 overflow-hidden flex flex-col justify-end relative active:scale-95 transition-all duration-300 shadow-md hover:shadow-xl group-hover:-translate-y-1"
                >
                  {item.immagine_url ? (
                    <>
                      <img
                        src={item.immagine_url}
                        alt={item.titolo}
                        className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/90 via-zinc-950/20 to-transparent" />
                    </>
                  ) : (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-amber-500/10 p-4 text-center">
                      <span className="text-3xl opacity-70 mb-1">📖</span>
                    </div>
                  )}

                  <div className="relative w-full p-3 backdrop-blur-md bg-white/80 border-t border-white/80">
                    <span className="font-bold text-xs line-clamp-2 leading-tight text-left block text-zinc-950">
                      {item.titolo}
                    </span>
                  </div>
                </button>

                {/* Tasto elimina stile glass rotondo */}
                <button
                  onClick={(e) => deleteCuriosita(item, e)}
                  className="absolute top-2.5 right-2.5 w-7 h-7 rounded-full bg-rose-600/90 text-white backdrop-blur-md shadow-md flex items-center justify-center hover:bg-rose-700 hover:scale-110 active:scale-90 transition-all z-10 border border-rose-400/40"
                  title="Elimina"
                >
                  <TrashIcon />
                </button>
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}