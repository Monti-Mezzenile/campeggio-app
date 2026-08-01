"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import Card from "@/components/ui/Card";
import CustomIcon from "@/components/ui/CustomIcon";

interface EventItem {
  id: string | number;
  titolo: string;
  luogo?: string;
  data_inizio?: string;
  data_evento?: string;
  descrizione?: string;
}

interface VideoItem {
  id: string | number;
  titolo: string;
  descrizione?: string;
  url: string;
  thumbnail_url?: string;
  categoria?: string;
  durata?: string;
  anno?: number | string;
}

// 🎯 Helper per formattare la data in "LUGLIO 2026"
function formatMonthYear(dateStr?: string) {
  if (!dateStr) return "DATA TBD";
  const cleanStr = dateStr.split("T")[0];
  const parts = cleanStr.split("-").map(Number);
  if (parts.length < 3 || parts.some(isNaN)) return dateStr;

  const date = new Date(parts[0], parts[1] - 1, parts[2]);
  return date
    .toLocaleDateString("it-IT", { month: "long", year: "numeric" })
    .toUpperCase();
}

// 🎯 Helper per estrarre l'anno
function getEventYear(dateStr?: string): string {
  if (!dateStr) return "TBD";
  const cleanStr = dateStr.split("T")[0];
  const parts = cleanStr.split("-").map(Number);
  if (parts.length > 0 && !isNaN(parts[0])) return parts[0].toString();
  return "TBD";
}

// 🎯 Helper per parse data senza offset UTC
function parseLocalDate(dateStr?: string) {
  if (!dateStr) return 0;
  const cleanStr = dateStr.split("T")[0];
  const parts = cleanStr.split("-").map(Number);
  if (parts.length < 3 || parts.some(isNaN)) return new Date(dateStr).getTime();
  return new Date(parts[0], parts[1] - 1, parts[2]).getTime();
}

export default function HistoryAndVideosPage() {
  const [activeTab, setActiveTab] = useState<"events" | "videos">("events");
  const [events, setEvents] = useState<EventItem[]>([]);
  const [videos, setVideos] = useState<VideoItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      const [eventsRes, videosRes] = await Promise.all([
        supabase.from("events").select("*"),
        supabase.from("videos").select("*").order("titolo", { ascending: true }),
      ]);

      if (eventsRes.error)
        console.error("Errore eventi:", eventsRes.error.message || eventsRes.error);
      if (videosRes.error)
        console.error("Errore video:", videosRes.error.message || videosRes.error);

      // 🎯 Ordinamento: DAL PIÙ VECCHIO AL PIÙ RECENTE
      const rawEvents = eventsRes.data || [];
      const sorted = [...rawEvents].sort((a, b) => {
        const timeA = parseLocalDate(a.data_inizio || a.data_evento);
        const timeB = parseLocalDate(b.data_inizio || b.data_evento);
        return timeA - timeB;
      });

      setEvents(sorted);
      setVideos(videosRes.data || []);
      setLoading(false);
    }

    loadData();
  }, []);

  const getPlatformInfo = (url: string) => {
    if (!url) return { name: "Video", bg: "bg-amber-500/90 text-zinc-950", icon: "🔗" };
    const l = url.toLowerCase();

    if (l.includes("youtube.com") || l.includes("youtu.be")) {
      return { name: "YouTube", bg: "bg-red-600 text-white", icon: "▶" };
    }
    if (l.includes("vimeo.com")) {
      return { name: "Vimeo", bg: "bg-sky-500 text-white", icon: "💧" };
    }
    if (l.includes("frame.io")) {
      return { name: "Frame.io", bg: "bg-purple-600 text-white", icon: "🎞️" };
    }

    return { name: "Link", bg: "bg-amber-400 text-zinc-950", icon: "🌐" };
  };

  const filteredEvents = useMemo(() => {
    return events.filter(
      (e) =>
        e.titolo.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (e.luogo && e.luogo.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  }, [events, searchQuery]);

  // 🎯 Raggruppamento per Anno
  const eventsByYear = useMemo(() => {
    const groups: { [year: string]: EventItem[] } = {};
    filteredEvents.forEach((ev) => {
      const year = getEventYear(ev.data_inizio || ev.data_evento);
      if (!groups[year]) groups[year] = [];
      groups[year].push(ev);
    });
    return groups;
  }, [filteredEvents]);

  // 🎯 Statistiche Passaporto
  const stats = useMemo(() => {
    const total = events.length;
    const winterCount = events.filter(
      (e) =>
        e.titolo?.toLowerCase().includes("winter") ||
        e.luogo?.toLowerCase().includes("winter")
    ).length;

    return { total, winterCount };
  }, [events]);

  const filteredVideos = useMemo(() => {
    return videos.filter(
      (v) =>
        v.titolo.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (v.descrizione && v.descrizione.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  }, [videos, searchQuery]);

  return (
    <main className="min-h-dvh p-4 md:p-6 pb-36 max-w-4xl mx-auto space-y-6 select-none bg-transparent">
      {/* 📖 HERO HEADER COMPATTO ORIZZONTALE */}
      <header className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-zinc-900/90 via-zinc-950/85 to-black/90 border border-amber-400/30 p-4 sm:p-5 shadow-xl backdrop-blur-2xl">
        <div className="absolute -top-10 -right-10 w-40 h-40 bg-amber-500/15 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex items-center gap-3.5 sm:gap-5 text-left">
          <div className="relative shrink-0 group">
            <div className="absolute inset-0 bg-amber-400/25 rounded-full blur-xl scale-125 transition-all duration-300 group-hover:scale-150" />
            <img
              src="/icons/libro.png"
              alt="Il Libro dei Ricordi"
              className="relative h-16 sm:h-20 w-auto object-contain drop-shadow-[0_8px_16px_rgba(0,0,0,0.7)] transition-transform duration-300 group-hover:scale-105"
            />
          </div>

          <div className="space-y-0.5 min-w-0">
            <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-400/10 border border-amber-400/25 text-amber-300 text-[9px] font-black uppercase tracking-wider shadow-2xs">
              <span>✨ Archivio & Videoteca</span>
            </div>

            <h1
              className="text-2xl sm:text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#ebdec8] via-amber-200 to-[#ebdec8] leading-tight tracking-wide"
              style={{ fontFamily: "var(--font-caveat)" }}
            >
              Il Libro dei Ricordi
            </h1>

            <p className="text-[11px] sm:text-xs text-amber-100/75 font-medium line-clamp-2 leading-tight">
              Perché di cazzate ne abbiamo fatte tante e devono essere ricordate.
            </p>
          </div>
        </div>
      </header>

      {/* 🔘 TAB SWITCHER COMPATTO */}
      <div className="relative max-w-md mx-auto p-1.5 rounded-2xl bg-zinc-950/80 backdrop-blur-2xl border border-amber-400/30 shadow-[0_8px_32px_rgba(0,0,0,0.5)]">
        <div className="grid grid-cols-2 gap-1.5 relative z-10">
          <button
            onClick={() => setActiveTab("events")}
            className={`relative py-2 px-3 rounded-xl text-xs font-bold transition-all duration-300 flex items-center justify-center gap-1.5 overflow-hidden ${
              activeTab === "events"
                ? "bg-gradient-to-r from-amber-400 via-amber-300 to-amber-200 text-zinc-950 shadow-[0_0_15px_rgba(251,191,36,0.35)] scale-[1.01]"
                : "text-amber-100/70 hover:text-white hover:bg-white/5"
            }`}
          >
            <span className="text-sm">📚</span>
            <span>Diario Spedizioni</span>
            <span
              className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono transition-colors ${
                activeTab === "events"
                  ? "bg-zinc-950/20 text-zinc-900"
                  : "bg-amber-400/10 text-amber-300 border border-amber-400/20"
              }`}
            >
              {events.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab("videos")}
            className={`relative py-2 px-3 rounded-xl text-xs font-bold transition-all duration-300 flex items-center justify-center gap-1.5 overflow-hidden ${
              activeTab === "videos"
                ? "bg-gradient-to-r from-amber-400 via-amber-300 to-amber-200 text-zinc-950 shadow-[0_0_15px_rgba(251,191,36,0.35)] scale-[1.01]"
                : "text-amber-100/70 hover:text-white hover:bg-white/5"
            }`}
          >
            <span className="text-sm">🎬</span>
            <span>Galleria Video</span>
            <span
              className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono transition-colors ${
                activeTab === "videos"
                  ? "bg-zinc-950/20 text-zinc-900"
                  : "bg-amber-400/10 text-amber-300 border border-amber-400/20"
              }`}
            >
              {videos.length}
            </span>
          </button>
        </div>
      </div>

      {/* 🔍 BARRA DI RICERCA */}
      <div className="relative max-w-md mx-auto">
        <input
          type="text"
          placeholder={
            activeTab === "events"
              ? "Cerca evento o luogo..."
              : "Cerca video per titolo..."
          }
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full px-4 py-2.5 pl-9 rounded-xl bg-black/70 border border-amber-400/30 text-xs text-[#ebdec8] placeholder-zinc-400 focus:outline-none focus:border-amber-300 backdrop-blur-xl transition-all shadow-inner"
        />
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 text-xs">
          🔍
        </span>
        {searchQuery && (
          <button
            onClick={() => setSearchQuery("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white text-xs"
          >
            ✕
          </button>
        )}
      </div>

      {/* ⌛ STATO DI CARICAMENTO */}
      {loading ? (
        <div className="space-y-3 pt-2 max-w-2xl mx-auto">
          {[1, 2, 3].map((n) => (
            <div
              key={n}
              className="h-28 w-full bg-black/40 border border-amber-400/20 rounded-3xl animate-pulse backdrop-blur-md"
            />
          ))}
        </div>
      ) : (
        <>
          {/* ==================== TAB 1: DIARIO SPEDIZIONI ==================== */}
          {activeTab === "events" && (
            <div className="space-y-6 max-w-2xl mx-auto animate-in fade-in duration-300">
              {/* 🏕️ PASSAPORTO / RECAP COMPATTO (SENZA LUOGHI) */}
              {!searchQuery && (
                <div className="grid grid-cols-2 gap-2 bg-black/60 border border-amber-400/20 p-3 rounded-2xl backdrop-blur-xl text-center">
                  <div className="flex flex-col items-center border-r border-amber-400/15">
                    <span className="text-[10px] text-amber-200/60 uppercase font-black tracking-wider">
                      Spedizioni
                    </span>
                    <span className="text-lg font-black text-[#ebdec8] font-mono">
                      {stats.total}
                    </span>
                  </div>
                  <div className="flex flex-col items-center">
                    <span className="text-[10px] text-cyan-300/80 uppercase font-black tracking-wider">
                      Ed. Winter ❄️
                    </span>
                    <span className="text-lg font-black text-cyan-200 font-mono">
                      {stats.winterCount}
                    </span>
                  </div>
                </div>
              )}

              {filteredEvents.length === 0 ? (
                <div className="text-center py-10 p-6 rounded-3xl bg-black/50 border border-amber-400/20 text-[#ebdec8] backdrop-blur-md">
                  🔍 Nessuna spedizione trovata per "{searchQuery}"
                </div>
              ) : (
                /* LISTA RAGGRUPPATA E ORDINATA PER ANNO (DAL MENO RECENTE AL PIÙ RECENTE) */
                Object.keys(eventsByYear)
                  .sort((a, b) => Number(a) - Number(b))
                  .map((year) => (
                    <div key={year} className="space-y-4">
                      
                      {/* ⛺ HEADER ANNO IN TINTA #EBDEC8 */}
                      <div className="flex items-center gap-3 px-1 pt-3">
                        <div className="flex items-center gap-2.5 bg-[#ebdec8] text-[#1b2b25] px-4 py-2 rounded-2xl border-2 border-[#ebdec8]/40 shadow-[0_4px_16px_rgba(235,222,200,0.25)]">
                          <CustomIcon name="tenda-grossa" size={26} />
                          <span className="font-black text-lg tracking-widest mt-0.5">
                            {year}
                          </span>
                        </div>
                        <div className="h-[3px] flex-1 bg-gradient-to-r from-[#ebdec8]/80 via-[#ebdec8]/20 to-transparent rounded-full" />
                      </div>

                      {/* Griglia di Card Evento */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                        {eventsByYear[year].map((event) => {
                          const isWinter =
                            event.titolo?.toLowerCase().includes("winter") ||
                            event.luogo?.toLowerCase().includes("winter");

                          const rawDate = event.data_inizio || event.data_evento;
                          const dateFormatted = formatMonthYear(rawDate);

                          return (
                            <Link
                              key={event.id}
                              href={`/events/${event.id}`}
                              className="block group"
                            >
                              <div
                                className={`relative h-full min-h-[140px] rounded-3xl p-4 overflow-hidden border-2 transition-all duration-300 group-hover:-translate-y-1 active:scale-[0.98] flex flex-col justify-between shadow-xl ${
                                  isWinter
                                    ? "bg-gradient-to-br from-[#0c2340] via-[#143258] to-[#09172a] border-cyan-400/60 text-cyan-50 shadow-cyan-950/50 group-hover:border-cyan-300"
                                    : "bg-gradient-to-br from-[#6b1d2f] via-[#4a1220] to-[#2a0811] border-amber-400/60 text-[#ebdec8] shadow-black/50 group-hover:border-amber-300"
                                }`}
                              >
                                {/* Filigrana di Sfondo */}
                                <div className="absolute -right-4 -bottom-4 opacity-20 text-6xl pointer-events-none group-hover:scale-110 group-hover:rotate-6 transition-transform duration-500">
                                  {isWinter ? "❄️" : "🔥"}
                                </div>

                                {/* Top Bar Card */}
                                <div className="flex items-center justify-between z-10">
                                  {isWinter ? (
                                    <span className="bg-cyan-500/25 text-cyan-200 border border-cyan-300/50 text-[9px] font-black px-2 py-0.5 rounded-md flex items-center gap-1 uppercase tracking-wider shadow-xs">
                                      ❄️ WINTER CAMP
                                    </span>
                                  ) : (
                                    <span className="bg-amber-500/25 text-amber-200 border border-amber-400/50 text-[9px] font-black px-2 py-0.5 rounded-md flex items-center gap-1 uppercase tracking-wider shadow-xs">
                                      🔥 SPEDIZIONE
                                    </span>
                                  )}

                                  <span className="text-xs font-black opacity-70 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform">
                                    ↗
                                  </span>
                                </div>

                                {/* Info Principali */}
                                <div className="z-10 my-2">
                                  <h3 className="font-black text-base uppercase tracking-wide leading-snug line-clamp-1 group-hover:text-white transition-colors">
                                    {event.titolo}
                                  </h3>

                                  {event.descrizione && (
                                    <p className="text-[11px] opacity-80 line-clamp-2 mt-1 leading-tight font-medium">
                                      {event.descrizione}
                                    </p>
                                  )}
                                </div>

                                {/* Bottom Details: LUOGO INTERO NON TRONCATO */}
                                <div className="z-10 pt-2 border-t border-white/15 flex items-start justify-between gap-2 text-[11px] font-mono">
                                  {event.luogo ? (
                                    <span className="opacity-90 font-semibold flex items-start gap-1 leading-tight">
                                      <span className="shrink-0">📍</span>
                                      <span>{event.luogo}</span>
                                    </span>
                                  ) : (
                                    <span />
                                  )}
                                  <span className="font-bold tracking-tight opacity-95 text-[10px] shrink-0 whitespace-nowrap pt-0.5">
                                    📅 {dateFormatted}
                                  </span>
                                </div>
                              </div>
                            </Link>
                          );
                        })}
                      </div>
                    </div>
                  ))
              )}
            </div>
          )}

          {/* ==================== TAB 2: GALLERIA VIDEO ==================== */}
          {activeTab === "videos" && (
            <div className="animate-in fade-in duration-300">
              {filteredVideos.length === 0 ? (
                <div className="text-center py-10 p-6 rounded-3xl bg-black/50 border border-amber-400/20 text-[#ebdec8] backdrop-blur-md">
                  🎬 Nessun video trovato per "{searchQuery}"
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {filteredVideos.map((vid) => {
                    const platform = getPlatformInfo(vid.url);

                    return (
                      <a
                        key={vid.id}
                        href={vid.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block group"
                      >
                        <Card className="p-0 overflow-hidden bg-black/70 border border-amber-400/25 hover:border-amber-300/80 backdrop-blur-xl transition-all duration-300 group-hover:-translate-y-1 group-hover:shadow-[0_8px_20px_rgba(251,191,36,0.15)] shadow-md relative rounded-2xl">
                          <div className="relative aspect-video bg-zinc-950 overflow-hidden">
                            {vid.thumbnail_url ? (
                              <img
                                src={vid.thumbnail_url}
                                alt={vid.titolo}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-85 group-hover:opacity-100"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center bg-zinc-900 text-xl">
                                🎬
                              </div>
                            )}

                            <div
                              className={`absolute top-1.5 left-1.5 flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-extrabold tracking-wider uppercase backdrop-blur-md shadow-sm z-10 ${platform.bg}`}
                            >
                              <span className="text-[9px]">{platform.icon}</span>
                              <span className="hidden sm:inline">{platform.name}</span>
                            </div>

                            <div className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 backdrop-blur-[1px]">
                              <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-300 text-zinc-950 text-[10px] font-bold shadow-md transform scale-90 group-hover:scale-100 transition-transform">
                                <span>Guarda</span>
                                <span>↗</span>
                              </div>
                            </div>

                            {vid.durata && (
                              <span className="absolute bottom-1 right-1 px-1.5 py-0.2 rounded bg-black/80 text-[9px] text-zinc-200 font-mono backdrop-blur-sm border border-white/10">
                                {vid.durata}
                              </span>
                            )}
                          </div>

                          <div className="p-2.5 space-y-1">
                            <h3 className="text-xs sm:text-sm font-bold text-[#ebdec8] group-hover:text-amber-300 transition-colors line-clamp-1 leading-snug">
                              {vid.titolo}
                            </h3>
                            {vid.descrizione && (
                              <p className="text-[11px] text-zinc-400 line-clamp-1 leading-normal">
                                {vid.descrizione}
                              </p>
                            )}
                          </div>
                        </Card>
                      </a>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </>
      )}
    </main>
  );
}