"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

// --- SVG ICONS ---
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

function BookIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18c-2.305 0-4.408.867-6 2.292m0-14.25v14.25" />
    </svg>
  );
}

function ScaleIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v18m0-18L7.5 7.5M12 3l4.5 4.5M4.5 19.5h15M6 12l-3 4.5h6L6 12zm12 0l-3 4.5h6L18 12z" />
    </svg>
  );
}

function ToolsIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M11.42 15.17L17.25 21A2.652 2.652 0 0021 17.25l-5.877-5.877M11.42 15.17l2.496-3.03c.317-.384.74-.626 1.208-.766M11.42 15.17l-4.655 5.653a2.548 2.548 0 01-3.582-3.582l5.653-4.655m3.03-2.496l.766-1.208c.14-.468.382-.89.766-1.208l3.03-2.496m-8.156 8.156L3.97 10.457a2.548 2.548 0 010-3.582l1.9-1.9a2.548 2.548 0 013.582 0l2.487 2.487" />
    </svg>
  );
}

function TrophyIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 18.75h-9m9 0a3 3 0 013 3h-15a3 3 0 013-3m9 0v-3.375c0-.621-.504-1.125-1.125-1.125h-6.75A1.125 1.125 0 016 15.375V18.75m9 0h-9M3.75 6h16.5M4.5 6V4.875C4.5 4.115 5.115 3.5 5.875 3.5h12.25c.76 0 1.375.615 1.375 1.375V6m-15 0A2.25 2.25 0 001.5 8.25v1.5a2.25 2.25 0 002.25 2.25H4.5m15-6A2.25 2.25 0 0121.75 8.25v1.5a2.25 2.25 0 01-2.25 2.25H19.5" />
    </svg>
  );
}

function CameraIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0zM18.75 10.5h.008v.008h-.008V10.5z" />
    </svg>
  );
}

function SpeakerIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M19.114 5.636a9 9 0 010 12.728M16.463 8.287a5.25 5.25 0 010 7.426M11.25 4.5l-4.5 4.5H3v6h3.75l4.5 4.5V4.5z" />
    </svg>
  );
}

function MusicIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 9l10.5-3m0 0v12m0-12L9 9m10.5 12A2.25 2.25 0 1117.25 18a2.25 2.25 0 012.25 2.25zm-10.5 0A2.25 2.25 0 116.75 18a2.25 2.25 0 012.25 2.25z" />
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

    const conferma = confirm("Sei sicuro di voler eliminare questo aneddoto?");
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
          <div className="h-12 w-48 bg-[#f4efe6]/60 animate-pulse rounded-full backdrop-blur-md border border-white" />
        </div>
        <div className="grid grid-cols-2 gap-4 pt-4">
          {[1, 2, 3, 4].map((n) => (
            <div key={n} className="h-36 bg-[#f4efe6]/60 border border-white animate-pulse rounded-3xl backdrop-blur-md" />
          ))}
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-dvh p-4 sm:p-6 pb-36 max-w-3xl mx-auto select-none space-y-6 text-[#1c2421] bg-transparent">
      
      {/* 💡 HERO HEADER */}
      <header className="relative overflow-hidden bg-[#f4efe6]/95 border border-[#e2dacb] rounded-[2rem] p-6 shadow-xl backdrop-blur-md text-center">
        <div className="absolute top-0 right-1/2 translate-x-1/2 -mt-10 w-48 h-48 bg-[#507c6c]/15 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#1c2421]/10 border border-[#1c2421]/15 text-[#1c2421] text-[10px] font-black uppercase tracking-widest shadow-xs">
            <SparklesIcon className="w-3.5 h-3.5 text-[#507c6c]" />
            <span>Enciclopedia del Disagio</span>
          </div>

          <div className="flex items-center justify-center gap-3 pt-1">
            <div className="p-2 rounded-2xl bg-[#507c6c]/15 border border-[#507c6c]/30 shadow-xs">
              <img 
                src="/icons/lampadina.png" 
                alt="Curiosità" 
                className="h-7 w-7 object-contain drop-shadow-sm"
              />
            </div>
            <h1 className="text-3xl sm:text-4xl font-black text-[#1c2421] tracking-tight">
              Curiosità
            </h1>
          </div>

          <p className="text-xs sm:text-sm font-semibold text-[#1c2421]/70 max-w-md mx-auto leading-relaxed">
            Storie sacre, tradizioni discutibili e i tool per sopravvivere alla democrazia del campeggio.
          </p>
        </div>
      </header>

      {/* 📜 TAB 1: I TESTI SACRI */}
      <section className="bg-[#f4efe6]/95 border border-[#e2dacb] rounded-[2rem] p-4 sm:p-5 shadow-lg backdrop-blur-md space-y-3">
        <div className="flex items-center gap-2 px-1">
          <div className="p-1.5 rounded-xl bg-[#507c6c]/15 text-[#507c6c]">
            <BookIcon className="w-4 h-4" />
          </div>
          <h2 className="text-xs font-black uppercase tracking-widest text-[#1c2421]">
            I Testi Sacri
          </h2>
        </div>

        <div className="grid grid-cols-2 gap-3.5 sm:gap-4">
          
          {/* Card: Storia di Monti */}
          <button
            onClick={() => router.push("/curiosita/storia-monti")}
            className="group relative h-40 rounded-2xl bg-white border border-[#e2dacb] shadow-sm flex flex-col justify-between p-4 text-left transition-all hover:-translate-y-1 overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-28 h-28 bg-[#507c6c]/10 rounded-full blur-2xl group-hover:scale-150 transition-transform pointer-events-none" />
            <div className="relative z-10">
              <span className="text-[9px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-[#1c2421] text-white shadow-xs">
                Origini
              </span>
            </div>
            <div className="absolute top-2 right-2 w-28 h-28 flex items-center justify-center pointer-events-none opacity-90 group-hover:scale-110 transition-transform">
              <img src="/curiosity/storia.png" alt="Storia" className="w-full h-full object-contain drop-shadow-md" />
            </div>
            <div className="relative z-10 w-full pt-8">
              <h3 className="font-black text-[#1c2421] text-sm leading-tight tracking-tight">Storia di Monti</h3>
              <p className="text-[10px] font-bold text-[#1c2421]/60 mt-0.5">La Filosofia Fondante</p>
            </div>
          </button>

          {/* Card: Il Cavallo */}
          <button
            onClick={() => router.push("/curiosita/cavallo")}
            className="group relative h-40 rounded-2xl bg-white border border-[#e2dacb] shadow-sm flex flex-col justify-between p-4 text-left transition-all hover:-translate-y-1 overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-28 h-28 bg-[#507c6c]/10 rounded-full blur-2xl group-hover:scale-150 transition-transform pointer-events-none" />
            <div className="relative z-10">
              <span className="text-[9px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-[#1c2421] text-white shadow-xs">
                Mito
              </span>
            </div>
            <div className="absolute top-2 right-2 w-28 h-28 flex items-center justify-center pointer-events-none opacity-90 group-hover:scale-110 transition-transform">
              <img src="/curiosity/cavallo.png" alt="Cavallo" className="w-full h-full object-contain drop-shadow-md" />
            </div>
            <div className="relative z-10 w-full pt-8">
              <h3 className="font-black text-[#1c2421] text-sm leading-tight tracking-tight">Il Cavallo</h3>
              <p className="text-[10px] font-bold text-[#1c2421]/60 mt-0.5">La Mascotte di Monti</p>
            </div>
          </button>

        </div>
      </section>

      {/* ⚖️ TAB 2: DEMOCRAZIA & DISSENSO */}
      <section className="bg-[#f4efe6]/95 border border-[#e2dacb] rounded-[2rem] p-4 sm:p-5 shadow-lg backdrop-blur-md space-y-3">
        <div className="flex items-center gap-2 px-1">
          <div className="p-1.5 rounded-xl bg-[#507c6c]/15 text-[#507c6c]">
            <ScaleIcon className="w-4 h-4" />
          </div>
          <h2 className="text-xs font-black uppercase tracking-widest text-[#1c2421]">
            Democrazia & Dissenso
          </h2>
        </div>

        <button
          onClick={() => router.push("/curiosita/ruota-del-pentimento")}
          className="group w-full relative rounded-2xl bg-[#1c2421] p-4 sm:p-5 text-left border border-black shadow-md overflow-hidden active:scale-[0.98] transition-all"
        >
          <div className="absolute top-0 right-0 w-48 h-48 bg-[#507c6c]/30 rounded-full blur-3xl pointer-events-none" />
          
          <div className="flex items-center gap-4 relative z-10">
            <div className="w-14 h-14 shrink-0 bg-[#f4efe6]/10 rounded-2xl flex items-center justify-center border border-white/10 shadow-inner group-hover:rotate-[360deg] transition-transform duration-1000">
              <img src="/icons/lampadina.png" alt="Insolenza" className="w-8 h-8 object-contain" />
            </div>

            <div className="flex-1">
              <span className="inline-block px-2.5 py-0.5 bg-[#507c6c] text-white text-[9px] font-black uppercase tracking-widest rounded-full mb-1 shadow-xs">
                Rischio Altissimo
              </span>
              <h3 className="text-lg font-black text-white tracking-tight uppercase leading-none mb-1">
                La Ruota dell'Insolenza
              </h3>
              <p className="text-[11px] font-medium text-[#f4efe6]/80 leading-tight">
                Sei in minoranza? Gira la ruota e sfida il decreto del Popolo.
              </p>
            </div>
          </div>
        </button>
      </section>

      {/* 🛠️ TAB 3: TOOL & UTILITY */}
      <section className="bg-[#f4efe6]/95 border border-[#e2dacb] rounded-[2rem] p-4 sm:p-5 shadow-lg backdrop-blur-md space-y-3">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-xl bg-[#507c6c]/15 text-[#507c6c]">
              <ToolsIcon className="w-4 h-4" />
            </div>
            <h2 className="text-xs font-black uppercase tracking-widest text-[#1c2421]">
              Tool & Utility
            </h2>
          </div>
          <span className="text-[10px] font-bold text-[#1c2421]/50 uppercase tracking-wider">Interattivi</span>
        </div>

        <div className="grid grid-cols-2 gap-3.5 sm:gap-4">
          
          {/* Tool 1: I Pezzi */}
          <button
            onClick={() => router.push("/suoni")}
            className="group relative h-40 rounded-2xl bg-[#507c6c] text-white p-4 text-left shadow-md overflow-hidden transition-all hover:-translate-y-1 active:scale-95 border border-[#42695c] flex flex-col justify-between"
          >
            <div className="absolute -bottom-4 -right-4 w-24 h-24 bg-white/10 rounded-full blur-xl group-hover:scale-150 transition-transform" />
            <div className="flex justify-between items-center relative z-10 w-full">
              <span className="text-[9px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full bg-[#1c2421]/40 text-white border border-white/10">
                Soundboard
              </span>
              <div className="p-1.5 rounded-xl bg-white/15 backdrop-blur-md">
                <SpeakerIcon className="w-4 h-4 text-white" />
              </div>
            </div>
            <div className="relative z-10 w-full">
              <h3 className="font-black text-white text-base leading-none tracking-tight">I Pezzi</h3>
              <p className="text-[10px] font-medium text-white/80 mt-1.5 leading-tight">Hit, Urla & Audio Cult da sparare a cassa</p>
            </div>
          </button>

          {/* Tool 2: La Sviolinata */}
          <button
            onClick={() => router.push("/sviolinata")}
            className="group relative h-40 rounded-2xl bg-[#1c2421] text-white p-4 text-left shadow-md overflow-hidden transition-all hover:-translate-y-1 active:scale-95 border border-black flex flex-col justify-between"
          >
            <div className="absolute -bottom-4 -right-4 w-24 h-24 bg-[#507c6c]/20 rounded-full blur-xl group-hover:scale-150 transition-transform" />
            <div className="flex justify-between items-center relative z-10 w-full">
              <span className="text-[9px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full bg-[#507c6c]/40 text-white border border-white/10">
                Generator
              </span>
              <div className="p-1.5 rounded-xl bg-white/10 backdrop-blur-md">
                <MusicIcon className="w-4 h-4 text-white" />
              </div>
            </div>
            <div className="relative z-10 w-full">
              <h3 className="font-black text-white text-base leading-none tracking-tight">La Sviolinata</h3>
              <p className="text-[10px] font-medium text-[#f4efe6]/80 mt-1.5 leading-tight">
                Dedicato al sapientino di turno che sa sempre tutto lui.
              </p>
            </div>
          </button>

        </div>
      </section>

      {/* 🎭 TAB 4: TRADIZIONI & GIOCHI */}
      <section className="bg-[#f4efe6]/95 border border-[#e2dacb] rounded-[2rem] p-4 sm:p-5 shadow-lg backdrop-blur-md space-y-3">
        <div className="flex items-center gap-2 px-1">
          <div className="p-1.5 rounded-xl bg-[#507c6c]/15 text-[#507c6c]">
            <TrophyIcon className="w-4 h-4" />
          </div>
          <h2 className="text-xs font-black uppercase tracking-widest text-[#1c2421]">
            Tradizioni & Giochi
          </h2>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3.5 sm:gap-4">
          
          {/* Bucock */}
          <button
            onClick={() => router.push("/curiosita/bookock")}
            className="group relative h-36 rounded-2xl bg-white border border-[#e2dacb] shadow-sm flex flex-col justify-between p-4 text-left transition-all hover:-translate-y-1 overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-24 h-24 bg-[#507c6c]/10 rounded-full blur-2xl group-hover:scale-150 transition-transform pointer-events-none" />
            <div className="relative z-10">
              <span className="text-[9px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-[#1c2421] text-white shadow-xs">
                Gioco
              </span>
            </div>
            <div className="absolute top-1 right-1 w-24 h-24 flex items-center justify-center pointer-events-none opacity-90 group-hover:scale-110 transition-transform">
              <img src="/curiosity/bockok.png" alt="Bucock" className="w-full h-full object-contain drop-shadow-md" />
            </div>
            <div className="relative z-10 w-full pt-6">
              <h3 className="font-black text-[#1c2421] text-xs sm:text-sm leading-tight tracking-tight">Bucock</h3>
              <p className="text-[10px] font-bold text-[#1c2421]/60 mt-0.5">Disagio notturno</p>
            </div>
          </button>

          {/* Corsa dei Cavalli */}
          <button
            onClick={() => router.push("/curiosita/corsa-dei-cavalli")}
            className="group relative h-36 rounded-2xl bg-white border border-[#e2dacb] shadow-sm flex flex-col justify-between p-4 text-left transition-all hover:-translate-y-1 overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-24 h-24 bg-[#507c6c]/10 rounded-full blur-2xl group-hover:scale-150 transition-transform pointer-events-none" />
            <div className="relative z-10">
              <span className="text-[9px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-[#1c2421] text-white shadow-xs">
                Gara
              </span>
            </div>
            <div className="absolute top-1 right-1 w-24 h-24 flex items-center justify-center pointer-events-none opacity-90 group-hover:scale-110 transition-transform">
              <img src="/curiosity/corsa.png" alt="Corsa" className="w-full h-full object-contain drop-shadow-md" />
            </div>
            <div className="relative z-10 w-full pt-6">
              <h3 className="font-black text-[#1c2421] text-xs sm:text-sm leading-tight tracking-tight">Corsa Cavalli</h3>
              <p className="text-[10px] font-bold text-[#1c2421]/60 mt-0.5">Regolamento</p>
            </div>
          </button>

          {/* NEW: L'Asta degli Avanzi */}
          <button
            onClick={() => router.push("/curiosita/asta")}
            className="group relative h-36 rounded-2xl bg-white border border-[#e2dacb] shadow-sm flex flex-col justify-between p-4 text-left transition-all hover:-translate-y-1 overflow-hidden col-span-2 sm:col-span-1"
          >
            <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/15 rounded-full blur-2xl group-hover:scale-150 transition-transform pointer-events-none" />
            <div className="relative z-10">
              <span className="text-[9px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-amber-600 text-white shadow-xs">
                Finale
              </span>
            </div>
            <div className="absolute top-2 right-3 text-3xl pointer-events-none group-hover:scale-125 transition-transform">
              🃏
            </div>
            <div className="relative z-10 w-full pt-6">
              <h3 className="font-black text-[#1c2421] text-xs sm:text-sm leading-tight tracking-tight">Asta del Bottino</h3>
              <p className="text-[10px] font-bold text-[#1c2421]/60 mt-0.5">Spartizione degli avanzi</p>
            </div>
          </button>

        </div>
      </section>

      {/* 📸 TAB 5: LE CRONACHE DELLA COMMUNITY */}
      <section className="bg-[#f4efe6]/95 border border-[#e2dacb] rounded-[2rem] p-4 sm:p-5 shadow-lg backdrop-blur-md space-y-4">
        
        <div className="flex justify-between items-center px-1">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-xl bg-[#507c6c]/15 text-[#507c6c]">
              <CameraIcon className="w-4 h-4" />
            </div>
            <h2 className="text-xs font-black uppercase tracking-widest text-[#1c2421]">
              Le Cronache
            </h2>
          </div>

          <button
            onClick={() => router.push("/curiosita/nuova")}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#1c2421] text-white font-black text-[10px] uppercase tracking-wider transition-all shadow-sm active:scale-95"
          >
            <PlusIcon className="w-3.5 h-3.5 text-[#507c6c]" />
            Aggiungi
          </button>
        </div>

        {curiosita.length === 0 ? (
          <div className="text-center py-8 px-4 rounded-2xl border-2 border-dashed border-[#e2dacb] bg-white/50 space-y-2">
            <img src="/icons/tenda-grossa.png" alt="Tenda" className="h-10 w-auto mx-auto opacity-60" />
            <p className="text-[#1c2421]/60 font-bold text-xs uppercase tracking-wide">
              Nessun ricordo registrato
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3.5 sm:gap-4">
            {curiosita.map((item) => (
              <div key={item.id} className="relative group">
                <button
                  onClick={() => router.push(`/curiosita/${item.id}`)}
                  className="w-full h-44 rounded-2xl bg-white border border-[#e2dacb] overflow-hidden flex flex-col justify-end relative active:scale-95 transition-all duration-300 shadow-sm hover:shadow-md"
                >
                  {item.immagine_url ? (
                    <>
                      <img
                        src={item.immagine_url}
                        alt={item.titolo}
                        className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-[#1c2421]/90 via-[#1c2421]/20 to-transparent" />
                    </>
                  ) : (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#f4efe6] p-4 text-center">
                      <BookIcon className="w-8 h-8 text-[#1c2421]/30 mb-1" />
                    </div>
                  )}

                  <div className="relative w-full p-3 bg-white/95 backdrop-blur-md">
                    <span className="font-bold text-xs line-clamp-2 leading-tight text-left block text-[#1c2421]">
                      {item.titolo}
                    </span>
                  </div>
                </button>

                {/* Tasto elimina */}
                <button
                  onClick={(e) => deleteCuriosita(item, e)}
                  className="absolute top-2 right-2 w-7 h-7 rounded-full bg-rose-600 text-white shadow-md flex items-center justify-center hover:bg-rose-700 active:scale-90 transition-all z-10 border border-white"
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