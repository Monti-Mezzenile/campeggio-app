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

    const conferma = confirm("Sei sicuro di voler eliminare questo aneddoto per sempre?");
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

  if (loading) {
    return (
      <main className="min-h-dvh p-4 md:p-6 pb-36 max-w-3xl mx-auto space-y-6 bg-transparent">
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
    <main className="min-h-dvh p-4 sm:p-6 pb-36 max-w-3xl mx-auto select-none space-y-8 text-zinc-900 bg-transparent">
      
      {/* 💡 HERO HEADER COMPATTO */}
      <header className="relative overflow-hidden bg-white/80 border border-white/90 rounded-3xl p-6 shadow-xl backdrop-blur-md text-center">
        <div className="absolute top-0 right-1/2 translate-x-1/2 -mt-10 w-48 h-48 bg-amber-500/15 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-950 text-[10px] font-black uppercase tracking-widest shadow-xs">
            <SparklesIcon className="w-3.5 h-3.5 text-amber-600" />
            <span>Enciclopedia del Disagio</span>
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
              Lore di Campo
            </h1>
          </div>

          <p className="text-xs sm:text-sm font-medium text-zinc-600 max-w-md mx-auto leading-relaxed">
            I miti, le regole assurde e i ricordi compromettenti che hanno plasmato le generazioni del campeggio.
          </p>
        </div>
      </header>

      {/* 📜 CATEGORIA 1: I TESTI SACRI */}
      <section className="space-y-3">
        <div className="flex items-center gap-2 px-2">
          <span className="text-xl">📜</span>
          <h2 className="text-xs font-black uppercase tracking-widest text-zinc-950">
            I Testi Sacri
          </h2>
        </div>

        <div className="grid grid-cols-2 gap-3.5 sm:gap-4">
          
          {/* Card: Storia di Monti */}
          <button
            onClick={() => router.push("/curiosita/storia-monti")}
            className="group relative h-40 rounded-3xl bg-white/80 backdrop-blur-md border border-emerald-500/30 shadow-md flex flex-col justify-between p-4 text-left transition-all hover:-translate-y-1 overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-28 h-28 bg-emerald-500/15 rounded-full blur-2xl group-hover:scale-150 transition-transform pointer-events-none" />
            <div className="relative z-10">
              <span className="text-[9px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-emerald-950 text-emerald-300 shadow-xs">
                Origini
              </span>
            </div>
            <div className="absolute top-2 right-2 w-28 h-28 flex items-center justify-center pointer-events-none opacity-90 group-hover:scale-110 transition-transform">
              <img src="/curiosity/storia.png" alt="Storia" className="w-full h-full object-contain drop-shadow-md" />
            </div>
            <div className="relative z-10 w-full pt-8">
              <h3 className="font-black text-emerald-950 text-sm leading-tight tracking-tight">Storia di Monti</h3>
              <p className="text-[10px] font-bold text-emerald-900/60 mt-0.5">La Filosofia del Campeggio</p>
            </div>
          </button>

          {/* Card: Bucock */}
          <button
            onClick={() => router.push("/curiosita/bookock")}
            className="group relative h-40 rounded-3xl bg-white/80 backdrop-blur-md border border-purple-500/30 shadow-md flex flex-col justify-between p-4 text-left transition-all hover:-translate-y-1 overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-28 h-28 bg-purple-500/15 rounded-full blur-2xl group-hover:scale-150 transition-transform pointer-events-none" />
            <div className="relative z-10">
              <span className="text-[9px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-purple-950 text-purple-300 shadow-xs">
                Tradizioni
              </span>
            </div>
            <div className="absolute top-2 right-2 w-28 h-28 flex items-center justify-center pointer-events-none opacity-90 group-hover:scale-110 transition-transform">
              <img src="/curiosity/bockok.png" alt="Bucock" className="w-full h-full object-contain drop-shadow-md" />
            </div>
            <div className="relative z-10 w-full pt-8">
              <h3 className="font-black text-purple-950 text-sm leading-tight tracking-tight">Bucock</h3>
              <p className="text-[10px] font-bold text-purple-900/60 mt-0.5">L'arte del disagio notturno</p>
            </div>
          </button>
        </div>
      </section>

      {/* ⚖️ CATEGORIA 2: DEMOCRAZIA & DISAGIO (In Evidenza!) */}
      <section className="space-y-3">
        <div className="flex items-center gap-2 px-2">
          <span className="text-xl">⚖️</span>
          <h2 className="text-xs font-black uppercase tracking-widest text-zinc-950">
            Democrazia & Scommesse
          </h2>
        </div>

        <button
          onClick={() => router.push("/curiosita/ruota-del-pentimento")}
          className="group w-full relative rounded-3xl bg-gradient-to-r from-red-600 via-rose-600 to-red-600 p-5 text-left border border-red-400/50 shadow-xl overflow-hidden active:scale-[0.98] transition-all"
        >
          {/* Overlay Sfocato */}
          <div className="absolute top-0 right-0 w-48 h-48 bg-black/20 rounded-full blur-3xl pointer-events-none" />
          
          <div className="flex items-center gap-4 relative z-10">
            {/* Icona Ruota Disegnata con Emoji */}
            <div className="w-16 h-16 shrink-0 bg-white/10 rounded-full flex items-center justify-center border-4 border-white/20 shadow-inner group-hover:rotate-[360deg] transition-transform duration-1000">
              <span className="text-3xl">🎡</span>
            </div>

            <div className="flex-1">
              <span className="inline-block px-2.5 py-1 bg-black/40 text-red-100 text-[9px] font-black uppercase tracking-widest rounded-lg mb-1.5 shadow-sm">
                Rischio Altissimo
              </span>
              <h3 className="text-xl font-black text-white tracking-tight uppercase leading-none mb-1">
                La Ruota dell'Insolenza
              </h3>
              <p className="text-[11px] font-medium text-red-100/90 leading-tight">
                Sei in minoranza? Gira la ruota e sfida il fato. Ma preparati a pagare.
              </p>
            </div>
          </div>
        </button>
      </section>

      {/* 🦄 CATEGORIA 3: ICONOGRAFIA & FOLKLORE */}
      <section className="space-y-3">
        <div className="flex items-center gap-2 px-2">
          <span className="text-xl">🦄</span>
          <h2 className="text-xs font-black uppercase tracking-widest text-zinc-950">
            Iconografia & Folklore
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 sm:gap-4">
          
          {/* Card: Cavallo */}
          <button
            onClick={() => router.push("/curiosita/cavallo")}
            className="group relative h-28 sm:h-32 rounded-3xl bg-white/80 backdrop-blur-md border border-blue-500/30 shadow-md flex items-center justify-between px-5 transition-all hover:-translate-y-1 overflow-hidden"
          >
            <div className="absolute inset-0 bg-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="relative z-10 w-2/3 text-left">
              <h3 className="font-black text-blue-950 text-sm leading-tight tracking-tight">Il Cavallo</h3>
              <p className="text-[10px] font-bold text-blue-900/60 mt-0.5">Mito e Leggenda</p>
            </div>
            <div className="w-16 h-16 relative z-10 group-hover:scale-110 transition-transform drop-shadow-md">
              <img src="/curiosity/cavallo.png" alt="Cavallo" className="w-full h-full object-contain" />
            </div>
          </button>

          {/* Card: Corsa dei Cavalli */}
          <button
            onClick={() => router.push("/curiosita/corsa-dei-cavalli")}
            className="group relative h-28 sm:h-32 rounded-3xl bg-white/80 backdrop-blur-md border border-amber-500/30 shadow-md flex items-center justify-between px-5 transition-all hover:-translate-y-1 overflow-hidden"
          >
            <div className="absolute inset-0 bg-amber-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="relative z-10 w-2/3 text-left">
              <h3 className="font-black text-amber-950 text-sm leading-tight tracking-tight line-clamp-2">La Corsa dei Cavalli</h3>
              <p className="text-[10px] font-bold text-amber-900/60 mt-0.5">Regolamento</p>
            </div>
            <div className="w-16 h-16 relative z-10 group-hover:scale-110 transition-transform drop-shadow-md">
              <img src="/curiosity/corsa.png" alt="Corsa" className="w-full h-full object-contain" />
            </div>
          </button>

          {/* Card: Sviolinata */}
          <button
            onClick={() => router.push("/sviolinata")}
            className="group relative h-28 sm:h-32 rounded-3xl bg-white/80 backdrop-blur-md border border-indigo-500/30 shadow-md flex items-center justify-between px-5 transition-all hover:-translate-y-1 overflow-hidden"
          >
            <div className="absolute inset-0 bg-indigo-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="relative z-10 w-2/3 text-left">
              <h3 className="font-black text-indigo-950 text-sm leading-tight tracking-tight">La Sviolinata</h3>
              <p className="text-[10px] font-bold text-indigo-900/60 mt-0.5">Sarcasmo a 4 corde</p>
            </div>
            <div className="w-16 h-16 relative z-10 group-hover:scale-110 transition-transform drop-shadow-md">
              <img src="/curiosity/violino.png" alt="Sviolinata" className="w-full h-full object-contain" />
            </div>
          </button>

        </div>
      </section>

      {/* 📚 CATEGORIA 4: LE CRONACHE DELLA COMMUNITY */}
      <section className="space-y-4 pt-4 border-t border-zinc-300">
        
        <div className="flex justify-between items-center px-2">
          <div className="flex items-center gap-2">
            <span className="text-xl">📸</span>
            <h2 className="text-xs font-black uppercase tracking-widest text-zinc-950">
              Le Cronache
            </h2>
          </div>

          <button
            onClick={() => router.push("/curiosita/nuova")}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-zinc-950 text-white font-black text-[10px] uppercase tracking-wider transition-all shadow-sm active:scale-95"
          >
            <PlusIcon className="w-3.5 h-3.5 text-amber-400" />
            Aggiungi
          </button>
        </div>

        {curiosita.length === 0 ? (
          <div className="text-center py-8 px-4 rounded-3xl border-2 border-dashed border-zinc-300 bg-white/30 space-y-2">
            <span className="text-3xl opacity-50">🏕️</span>
            <p className="text-zinc-500 font-bold text-xs uppercase tracking-wide">
              Nessun ricordo registrato
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3.5 sm:gap-4">
            {curiosita.map((item) => (
              <div key={item.id} className="relative group">
                <button
                  onClick={() => router.push(`/curiosita/${item.id}`)}
                  className="w-full h-44 rounded-3xl bg-white border border-white/80 overflow-hidden flex flex-col justify-end relative active:scale-95 transition-all duration-300 shadow-md hover:shadow-lg"
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
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-zinc-100 p-4 text-center">
                      <span className="text-4xl opacity-20 mb-1">📖</span>
                    </div>
                  )}

                  <div className="relative w-full p-3 bg-white/95 backdrop-blur-md">
                    <span className="font-bold text-xs line-clamp-2 leading-tight text-left block text-zinc-950">
                      {item.titolo}
                    </span>
                  </div>
                </button>

                {/* Tasto elimina */}
                <button
                  onClick={(e) => deleteCuriosita(item, e)}
                  className="absolute top-2 right-2 w-7 h-7 rounded-full bg-rose-500 text-white shadow-md flex items-center justify-center hover:bg-rose-600 active:scale-90 transition-all z-10 border border-white"
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