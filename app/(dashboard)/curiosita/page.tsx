"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

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

  const ufficiali = [
    {
      titolo: "Storia di Monti",
      immagine: "/curiosity/storia.png",
      link: "/curiosita/storia-monti",
    },
    {
      titolo: "La corsa dei cavalli",
      immagine: "/curiosity/corsa.png",
      link: "/curiosita/corsa-dei-cavalli",
    },
    {
      titolo: "Bookock",
      immagine: "/curiosity/bockok.png",
      link: "/curiosita/bookock",
    },
    {
      titolo: "Cavallo",
      immagine: "/curiosity/cavallo.png",
      link: "/curiosita/cavallo",
    },
  ];

  if (loading) {
    return (
      <main className="min-h-screen p-4 md:p-6 pb-28 max-w-3xl mx-auto space-y-6">
        <div className="flex justify-center pt-4">
          <div className="h-10 w-36 bg-white/40 animate-pulse rounded-full backdrop-blur-md border border-white" />
        </div>
        <div className="grid grid-cols-2 gap-3 pt-4">
          {[1, 2, 3, 4].map((n) => (
            <div key={n} className="h-28 bg-white/40 border border-white animate-pulse rounded-3xl backdrop-blur-md" />
          ))}
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen p-4 md:p-6 pb-28 max-w-3xl mx-auto select-none space-y-6">
      
      {/* 💡 HEADER COMPATTO CON SCRITTA RIDOTTA */}
      <header className="text-center space-y-1 pt-1">
        <div className="inline-flex items-center justify-center p-2 rounded-full bg-white/60 border border-white backdrop-blur-md shadow-sm group">
          <img 
            src="/icons/lampadina.png" 
            alt="Curiosità" 
            className="h-6 w-6 object-contain group-hover:scale-110 transition-transform duration-300"
          />
        </div>

        <div>
          <h1
            className="text-3xl sm:text-4xl font-bold text-[#1b2b25] tracking-wide"
            style={{ fontFamily: "var(--font-caveat)" }}
          >
            Curiosità
          </h1>
          <p className="text-[11px] font-semibold text-[#1b2b25]/70 max-w-xs mx-auto">
            Miti, storie e tradizioni che rendono unico il nostro campeggio
          </p>
        </div>
      </header>

      {/* 🏕️ SEZIONE PILASTRI UFFICIALI (Icone grandi, opacizzate, parte superiore in evidenza) */}
      <section className="space-y-2.5">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-[10px] font-black uppercase tracking-widest text-[#1b2b25]/60">
            I Pilastri di MONTI
          </h2>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:gap-4">
          {ufficiali.map((item) => (
            <button
              key={item.titolo}
              onClick={() => router.push(item.link)}
              className="group relative h-28 sm:h-32 rounded-[1.8rem] bg-white/70 backdrop-blur-xl border border-white shadow-sm flex flex-col items-center justify-end p-3 active:scale-95 transition-all duration-300 hover:shadow-md hover:bg-white/90 overflow-hidden"
            >
              {/* Immagine grande, opacizzata e ancorata in alto (object-top) */}
              <img
                src={item.immagine}
                alt={item.titolo}
                className="absolute -top-1 sm:-top-2 h-24 sm:h-28 w-24 sm:w-28 object-contain object-top opacity-75 group-hover:opacity-95 group-hover:scale-105 transition-all duration-300 drop-shadow-xs"
              />
              
              {/* Testo in sovrapposizione in basso */}
              <span className="relative z-10 font-black text-[#1b2b25] text-xs sm:text-sm text-center leading-tight line-clamp-1 drop-shadow-sm">
                {item.titolo}
              </span>
            </button>
          ))}
        </div>
      </section>

      {/* ✨ SEZIONE COMMUNITY */}
      <section className="space-y-3 pt-1">
        
        {/* Header Community */}
        <div className="flex justify-between items-center bg-white/60 backdrop-blur-xl p-3 sm:p-3.5 rounded-[1.8rem] border border-white shadow-sm">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-[#ebdec8]/60 border border-white">
              <img 
                src="/icons/profilo.png" 
                alt="Community" 
                className="h-4 w-4 sm:h-5 sm:w-5 object-contain"
              />
            </div>
            <div>
              <h2 className="text-xs sm:text-sm font-black text-[#1b2b25] leading-none uppercase tracking-wide">
                Community
              </h2>
              <p className="text-[10px] text-[#1b2b25]/60 font-semibold mt-0.5">
                Aneddoti e ricordi condivisi
              </p>
            </div>
          </div>

          <button
            onClick={() => router.push("/curiosita/nuova")}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#1b2b25] text-[#ebdec8] font-black text-xs hover:scale-105 active:scale-95 transition-all shadow-md"
          >
            <span className="text-xs leading-none">➕</span>
            <span>Aggiungi</span>
          </button>
        </div>

        {/* Empty State / Grid */}
        {curiosita.length === 0 ? (
          <div className="text-center py-8 px-4 rounded-[1.8rem] bg-white/50 border border-white backdrop-blur-xl shadow-sm space-y-2">
            <img 
              src="/icons/tenda-grossa.png" 
              alt="Nessuna Curiosità" 
              className="h-14 w-auto mx-auto opacity-70"
            />
            <p className="text-[#1b2b25] font-black text-xs">
              Nessuna curiosità per ora
            </p>
            <p className="text-[#1b2b25]/60 text-[11px] font-semibold">
              Tocca "Aggiungi" e condividi la prima!
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
            {curiosita.map((item) => (
              <div key={item.id} className="relative group">
                <button
                  onClick={() => router.push(`/curiosita/${item.id}`)}
                  className="w-full aspect-square rounded-[1.8rem] bg-white/70 backdrop-blur-xl border border-white overflow-hidden flex flex-col justify-end relative active:scale-95 transition-all duration-300 shadow-sm hover:shadow-md group-hover:-translate-y-1"
                >
                  {item.immagine_url ? (
                    <>
                      <img
                        src={item.immagine_url}
                        alt={item.titolo}
                        className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-[#1b2b25]/90 via-[#1b2b25]/20 to-transparent" />
                    </>
                  ) : (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#ebdec8]/40 p-4 text-center">
                      <span className="text-3xl opacity-60 mb-1">📝</span>
                    </div>
                  )}

                  <div className="relative w-full p-2.5 backdrop-blur-md bg-white/60 border-t border-white/60">
                    <span className="font-bold text-xs line-clamp-2 leading-tight text-left block text-[#1b2b25]">
                      {item.titolo}
                    </span>
                  </div>
                </button>

                <button
                  onClick={(e) => deleteCuriosita(item, e)}
                  className="absolute top-2 right-2 w-7 h-7 rounded-full bg-red-500/80 text-white backdrop-blur-md shadow-md flex items-center justify-center hover:bg-red-600 hover:scale-110 active:scale-90 transition-all z-10"
                  title="Elimina"
                >
                  <span className="text-xs font-bold">✕</span>
                </button>
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}