"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import CustomIcon from "@/components/ui/CustomIcon";

export default function EventPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const [isAdmin, setIsAdmin] = useState(false);
  const [event, setEvent] = useState<any>(null);
  const [user, setUser] = useState<any>(null);
  const [myParticipation, setMyParticipation] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // --- STATI MEDIA CAPSULA DEL TEMPO ---
  const [media, setMedia] = useState<any[]>([]);
  const [activeMediaTab, setActiveMediaTab] = useState<"all" | "photo" | "video">("all");
  const [selectedMedia, setSelectedMedia] = useState<{ url: string; isVideo: boolean } | null>(null);

  const [stats, setStats] = useState({
    partecipanti: 0,
    tende: 0,
    postiLetto: 0,
    auto: 0,
    postiAuto: 0,
    attrezzatura: 0,
    checklistTotale: 0,
    checklistCompletata: 0,
    mediaCount: 0,
    shoppingCount: 0,
  });

  const isWinter = event?.titolo?.toLowerCase().includes("winter");

  // 🎯 CALCOLO SE L'EVENTO È NEL PASSATO
  const isPast = useMemo(() => {
    if (!event) return false;
    const dateStr = event.data_inizio || event.data_evento;
    if (!dateStr) return false;

    const eventDate = new Date(dateStr);
    eventDate.setHours(23, 59, 59, 999);

    return eventDate.getTime() < new Date().getTime();
  }, [event]);

  // 🛠️ HELPER MEDIA ROBUSTI (SDK Ufficiale Supabase Storage)
  function getMediaType(item: any): "photo" | "video" {
    const rawType = (item.type || item.media_type || item.file_type || "").toLowerCase();
    const rawUrl = (item.url || item.file_url || item.path || item.storage_path || "").toLowerCase();

    if (
      rawType.includes("video") ||
      rawUrl.endsWith(".mp4") ||
      rawUrl.endsWith(".mov") ||
      rawUrl.endsWith(".webm") ||
      rawUrl.includes("youtube.com") ||
      rawUrl.includes("vimeo.com")
    ) {
      return "video";
    }
    return "photo";
  }

  function getMediaUrl(item: any): string {
    const rawUrl = item.url || item.file_url || item.path || item.storage_path || "";
    if (!rawUrl) return "";

    if (rawUrl.startsWith("http://") || rawUrl.startsWith("https://") || rawUrl.startsWith("blob:")) {
      return rawUrl;
    }

    const cleanPath = rawUrl.startsWith("/") ? rawUrl.slice(1) : rawUrl;
    const { data } = supabase.storage.from("event-media").getPublicUrl(cleanPath);

    return data.publicUrl;
  }

  // Contatori Foto/Video dinamici
  const photosCount = useMemo(
    () => media.filter((m) => getMediaType(m) === "photo").length,
    [media]
  );
  const videosCount = useMemo(
    () => media.filter((m) => getMediaType(m) === "video").length,
    [media]
  );

  const filteredMedia = useMemo(() => {
    if (activeMediaTab === "all") return media;
    return media.filter((m) => getMediaType(m) === activeMediaTab);
  }, [media, activeMediaTab]);

  // --- HELPER BADGE PASS DINAMICO ---
  function renderPassBadge(stato: string | undefined) {
    switch (stato) {
      case "partecipo":
      case "ci_saro":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/40 text-[10px] font-black uppercase tracking-wider shadow-2xs backdrop-blur-md">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400"></span>
            </span>
            Confermato
          </span>
        );
      case "forse":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-400/40 text-[10px] font-black uppercase tracking-wider shadow-2xs backdrop-blur-md">
            <span className="w-2 h-2 rounded-full bg-amber-400"></span>
            In Dubbio
          </span>
        );
      case "non_partecipo":
      case "non_ci_saro":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-500/20 text-rose-300 border border-rose-400/40 text-[10px] font-black uppercase tracking-wider shadow-2xs backdrop-blur-md">
            <span className="w-2 h-2 rounded-full bg-rose-400"></span>
            Non Partecipo
          </span>
        );
      default:
        return (
          <span className="px-3 py-1 rounded-full bg-white/10 text-[#ebdec8]/80 border border-[#ebdec8]/30 text-[10px] font-black uppercase tracking-wider backdrop-blur-md">
            In Attesa
          </span>
        );
    }
  }

  function formatArrivalDeparture(date: string, time: string, label: string) {
    if (!date) return null;

    const data = new Date(date);
    const giorni = ["Domenica", "Lunedì", "Martedì", "Mercoledì", "Giovedì", "Venerdì", "Sabato"];

    let momento = "";
    if (time) {
      const ora = parseInt(time.split(":")[0]);
      if (ora < 5) momento = "notte";
      else if (ora < 12) momento = "mattina";
      else if (ora < 18) momento = "pomeriggio";
      else momento = "sera";
    }

    return (
      <div className="flex items-center justify-between bg-white/10 backdrop-blur-md px-3.5 py-2.5 rounded-2xl border border-[#ebdec8]/30 shadow-xs">
        <div className="flex items-center gap-2">
          <span className="text-xs font-black text-[#ebdec8]/80">{label}</span>
          <span className="text-xs font-extrabold text-[#ebdec8]">
            {isNaN(data.getDay()) ? date : giorni[data.getDay()]}
          </span>
          {momento && (
            <span className="text-[10px] font-bold text-[#ebdec8]/60 capitalize">
              ({momento})
            </span>
          )}
        </div>
        {time && (
          <span className="font-mono text-xs font-black bg-[#ebdec8] text-[#1b2b25] px-2.5 py-1 rounded-xl shadow-sm">
            {String(time).slice(0, 5)}
          </span>
        )}
      </div>
    );
  }

  const loadEvent = useCallback(async (showLoader = false) => {
    if (!id) return;
    if (showLoader) setLoading(true);

    try {
      // 1. Dati Utente Corrente
      const { data: { user: currentUser } } = await supabase.auth.getUser();

      if (currentUser) {
        setUser(currentUser);

        const [{ data: profile }, { data: myData }] = await Promise.all([
          supabase
            .from("profiles")
            .select("ruolo")
            .eq("id", currentUser.id)
            .maybeSingle(),
          supabase
            .from("event_members")
            .select("*")
            .eq("event_id", id)
            .eq("user_id", currentUser.id)
            .maybeSingle(),
        ]);

        setIsAdmin(profile?.ruolo === "admin");
        setMyParticipation(myData);
      }

      // 2. Dettagli Evento Principale
      const { data: eventData, error: eventError } = await supabase
        .from("events")
        .select("*")
        .eq("id", id)
        .maybeSingle();

      if (eventError || !eventData) {
        console.error("Evento non trovato o errore:", eventError);
        setEvent(null);
        return;
      }

      setEvent(eventData);

      // 3. Recupera TUTTI i viaggi (trips) collegati a questo evento
      const { data: tripsData, error: tripsErr } = await supabase
        .from("trips")
        .select("id")
        .eq("event_id", id);

      if (tripsErr) console.error("Errore recupero trips:", tripsErr);

      const tripIds = (tripsData || []).map((t) => t.id);

      // 4. Query Parallele per Statistiche e Media (Utilizzando .in() per supportare molteplici trip)
      const [
        partecipantiRes,
        eventTentsRes,
        tripCarsRes,
        attrezzaturaRes,
        mediaRes,
        shoppingItemsRes,
        meatItemsRes,
        checklistsRes,
      ] = await Promise.all([
        supabase
          .from("event_members")
          .select("*", { count: "exact", head: true })
          .eq("event_id", id)
          .eq("stato", "partecipo"),
        supabase.from("event_tents").select("tent_id").eq("event_id", id),
        tripIds.length > 0
          ? supabase.from("trip_cars").select("posti_disponibili").in("trip_id", tripIds)
          : Promise.resolve({ data: [] }),
        supabase
          .from("event_equipment")
          .select("*", { count: "exact", head: true })
          .eq("event_id", id),
        supabase
          .from("media")
          .select("*")
          .eq("event_id", id),
        supabase
          .from("shopping_items")
          .select("*", { count: "exact", head: true })
          .eq("event_id", id),
        supabase
          .from("meat_items")
          .select("*", { count: "exact", head: true })
          .eq("event_id", id),
        supabase.from("checklists").select("id").eq("event_id", id),
      ]);

      const carsList = tripCarsRes.data || [];

      if (mediaRes.data) {
        setMedia(mediaRes.data);
      }

      // Calcolo Posti Letto
      let postiLetto = 0;
      const tentIds = eventTentsRes.data?.map((t) => t.tent_id).filter(Boolean) || [];
      if (tentIds.length > 0) {
        const { data: tents } = await supabase
          .from("tents")
          .select("posti")
          .in("id", tentIds);
        postiLetto = (tents || []).reduce((tot, t) => tot + (t.posti || 0), 0);
      }

      // Calcolo Checklist Items
      let checklistTotale = 0;
      let checklistCompletata = 0;
      const checklistIds = checklistsRes.data?.map((c) => c.id).filter(Boolean) || [];
      if (checklistIds.length > 0) {
        const { data: checklistItems } = await supabase
          .from("checklist_items")
          .select("completato")
          .in("checklist_id", checklistIds);

        checklistTotale = checklistItems?.length || 0;
        checklistCompletata =
          checklistItems?.filter((item) => item.completato).length || 0;
      }

      // Calcolo Posti Auto (Posti liberi + guidatore per auto)
      const postiAuto = carsList.reduce(
        (tot, car) => tot + ((car.posti_disponibili || 0) + 1),
        0
      );

      const shoppingCount = (shoppingItemsRes.count || 0) + (meatItemsRes.count || 0);

      setStats({
        partecipanti: partecipantiRes.count || 0,
        tende: eventTentsRes.data?.length || 0,
        postiLetto,
        auto: carsList.length,
        postiAuto,
        attrezzatura: attrezzaturaRes.count || 0,
        checklistTotale,
        checklistCompletata,
        mediaCount: mediaRes.data?.length || 0,
        shoppingCount,
      });
    } catch (err) {
      console.error("Errore generale caricamento evento:", err);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (!id) return;

    loadEvent(true);

    const handleFocus = () => loadEvent(false);
    window.addEventListener("focus", handleFocus);
    document.addEventListener("visibilitychange", handleFocus);

    return () => {
      window.removeEventListener("focus", handleFocus);
      document.removeEventListener("visibilitychange", handleFocus);
    };
  }, [id, loadEvent]);

  async function removeParticipation() {
    if (!user) return;

    const ok = window.confirm(
      "Vuoi davvero annullare la tua iscrizione a questa spedizione?"
    );
    if (!ok) return;

    const { error } = await supabase
      .from("event_members")
      .delete()
      .eq("event_id", id)
      .eq("user_id", user.id);

    if (error) {
      alert(error.message);
      return;
    }

    setMyParticipation(null);
    router.push("/");
  }

  async function deleteEvent() {
    const ok = confirm("Sei sicuro di voler eliminare questo evento?");
    if (!ok) return;

    const { error } = await supabase.from("events").delete().eq("id", id);

    if (error) {
      alert(error.message);
      return;
    }

    router.push("/");
  }

  if (loading) {
    return (
      <main className="min-h-dvh p-6 max-w-md mx-auto flex flex-col items-center justify-center bg-transparent">
        <div className="w-16 h-16 rounded-full bg-white/60 backdrop-blur-md flex items-center justify-center shadow-lg animate-pulse mb-3 border border-white">
          <CustomIcon name="tenda-grossa" size={36} />
        </div>
        <p className="font-mono text-xs font-bold uppercase tracking-widest text-[#1b2b25]">
          Caricamento Spedizione...
        </p>
      </main>
    );
  }

  if (!event) {
    return (
      <main className="min-h-dvh p-6 max-w-md mx-auto flex flex-col items-center justify-center text-center bg-transparent">
        <div className="bg-white/80 backdrop-blur-2xl border border-white p-8 rounded-[2.5rem] shadow-sm">
          <CustomIcon name="tenda-grossa" size={76} className="mx-auto mb-3 opacity-60" />
          <h2 className="text-xl font-black text-[#1b2b25]">
            Spedizione Non Trovata
          </h2>
          <button
            onClick={() => router.push("/")}
            className="mt-5 px-6 py-3 rounded-2xl bg-[#1b2b25] text-[#ebdec8] text-xs font-black uppercase tracking-wider shadow-md active:scale-95 transition"
          >
            Torna all'Accampamento
          </button>
        </div>
      </main>
    );
  }

  const percentChecklist =
    stats.checklistTotale > 0
      ? Math.round((stats.checklistCompletata / stats.checklistTotale) * 100)
      : 0;

  const displayDate =
    event.data_inizio
      ? `${event.data_inizio}${event.data_fine ? ` → ${event.data_fine}` : ""}`
      : event.data_evento || event.date || "Data da definire";

  return (
    <main className="min-h-dvh p-4 sm:p-6 pb-40 max-w-md mx-auto flex flex-col gap-5 select-none bg-transparent">
      
      {/* 🚀 BARRA TOP & ACTIONS */}
      <header className="flex items-center justify-between pt-1">
        <button
          onClick={() => router.push("/")}
          className="w-10 h-10 rounded-full bg-white/80 text-[#1b2b25] flex items-center justify-center font-black text-lg shadow-sm backdrop-blur-md active:scale-90 transition border border-white"
        >
          ←
        </button>

        <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/80 backdrop-blur-md border border-white shadow-sm">
          <span className="text-xs font-black text-[#1b2b25] tracking-tight uppercase">
            {isPast ? "Archivio Storico" : "Spedizione MONTI"}
          </span>
        </div>

        {isAdmin ? (
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => router.push(`/events/${id}/edit`)}
              className="w-9 h-9 rounded-full bg-white/80 text-[#1b2b25] flex items-center justify-center text-xs shadow-sm backdrop-blur-md active:scale-90 transition border border-white"
            >
              ✏️
            </button>
            <button
              onClick={deleteEvent}
              className="w-9 h-9 rounded-full bg-red-500/80 text-white flex items-center justify-center text-xs shadow-sm backdrop-blur-md active:scale-90 transition border border-red-300"
            >
              🗑️
            </button>
          </div>
        ) : (
          <div className="w-10" />
        )}
      </header>

      {/* 🏕️ HERO EVENTO */}
      <section
        className={`relative overflow-hidden rounded-[2.5rem] border-2 border-white/90 p-6 sm:p-7 shadow-xl backdrop-blur-2xl transition-all duration-500 ${
          isWinter
            ? "bg-gradient-to-br from-slate-900/90 via-sky-950/85 to-slate-900/90 text-white border-sky-300/30 shadow-sky-950/20"
            : "bg-gradient-to-br from-white/95 via-white/90 to-[#ebdec8]/60 text-[#1b2b25] shadow-black/5"
        }`}
      >
        <div
          className={`absolute -top-12 -right-12 w-48 h-48 rounded-full blur-3xl pointer-events-none ${
            isWinter ? "bg-sky-400/20" : "bg-amber-400/25"
          }`}
        />
        <div
          className={`absolute -bottom-10 -left-10 w-36 h-36 rounded-full blur-2xl pointer-events-none ${
            isWinter ? "bg-blue-600/15" : "bg-emerald-500/15"
          }`}
        />

        <div className="absolute -right-3 -bottom-3 pointer-events-none group">
          <div
            className={`absolute inset-0 rounded-full blur-2xl scale-125 transition-all duration-700 ${
              isWinter ? "bg-sky-400/30" : "bg-[#ebdec8]/80"
            }`}
          />
          {isWinter ? (
            <img
              src="/icons/tenda-snow.png"
              alt="Tenda Snow"
              className="relative w-[120px] h-[120px] sm:w-[135px] sm:h-[135px] object-contain drop-shadow-[0_10px_20px_rgba(0,0,0,0.25)] transition-transform duration-500 hover:scale-105"
            />
          ) : (
            <div className="relative transform transition-transform duration-500 hover:scale-105 drop-shadow-[0_10px_20px_rgba(0,0,0,0.15)]">
              <CustomIcon name="tenda-grossa" size={130} />
            </div>
          )}
        </div>

        <div className="relative z-10 space-y-3.5 max-w-[78%]">
          <div className="flex flex-wrap items-center gap-2">
            <div
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border shadow-xs backdrop-blur-md ${
                isWinter
                  ? "bg-sky-500/20 text-sky-200 border-sky-400/30"
                  : "bg-[#1b2b25] text-[#ebdec8] border-white/20"
              }`}
            >
              <span>
                {isWinter ? "❄️ Spedizione Winter" : "🏕️ Spedizione MONTI"}
              </span>
            </div>

            <div
              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border shadow-xs backdrop-blur-md ${
                isWinter
                  ? "bg-white/10 text-white/90 border-white/20"
                  : "bg-white/80 text-[#1b2b25] border-white shadow-2xs"
              }`}
            >
              <span>📍 {event.luogo || "Destinazione Segreta"}</span>
            </div>
          </div>

          <div className="space-y-1">
            <h1
              className={`text-3xl sm:text-4xl font-black tracking-tight leading-[1.1] drop-shadow-xs ${
                isWinter ? "text-white" : "text-[#1b2b25]"
              }`}
            >
              {event.titolo || event.title || "Spedizione"}
            </h1>
          </div>

          <div
            className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-2xl border text-xs font-black shadow-xs backdrop-blur-md ${
              isWinter
                ? "bg-white/10 border-white/20 text-sky-100"
                : "bg-white/70 border-white text-[#1b2b25]"
            }`}
          >
            <span className="text-sm">🗓️</span>
            <span>{displayDate}</span>
          </div>
        </div>
      </section>

      {/* ========================================================================================= */}
      {/* 🚀 BIFORCAZIONE: LAYOUT FUTURO (Bento Grid) VS PASSATO (Capsula Foto/Video)               */}
      {/* ========================================================================================= */}

      {!isPast ? (
        <>
          {/* 🪪 PASS PARTECIPANTE */}
          <section className="rounded-[2.5rem] bg-white/10 backdrop-blur-md p-5 shadow-lg border-2 border-[#ebdec8] space-y-4">
            <div className="flex items-center justify-between px-1">
              <div className="flex items-center gap-2.5">
                <CustomIcon name="libro" size={24} className="shrink-0" />
                <h2 className="text-[11px] font-black uppercase tracking-wider text-[#ebdec8]">
                  IL TUO PASS SPEDIZIONE
                </h2>
              </div>
              {renderPassBadge(myParticipation?.stato)}
            </div>

            {myParticipation ? (
              <div className="space-y-3">
                {(myParticipation.arrivo_data || myParticipation.partenza_data) && (
                  <div className="space-y-2">
                    {formatArrivalDeparture(
                      myParticipation.arrivo_data,
                      myParticipation.arrivo_ora,
                      "Camping Arrivo:"
                    )}
                    {formatArrivalDeparture(
                      myParticipation.partenza_data,
                      myParticipation.partenza_ora,
                      "Auto Partenza:"
                    )}
                  </div>
                )}

                <div className="flex gap-2 pt-1">
                  <button
                    onClick={() => router.push(`/events/${id}/join`)}
                    className="flex-1 py-3 px-4 rounded-2xl bg-[#ebdec8] text-[#1b2b25] text-xs font-black uppercase tracking-wider active:scale-95 transition shadow-md flex items-center justify-center gap-2"
                  >
                    ✏️ Modifica Dettagli
                  </button>
                  <button
                    onClick={removeParticipation}
                    className="w-12 h-12 rounded-2xl bg-rose-500/20 text-rose-300 border border-rose-400/40 text-sm font-black active:scale-90 transition flex items-center justify-center hover:bg-rose-500 hover:text-white shrink-0"
                    title="Annulla Iscrizione"
                  >
                    ❌
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-center py-4 px-2 space-y-3">
                <p className="text-xs font-semibold text-[#ebdec8]/80 mb-2">
                  Pronto a unirti al gruppo per questa avventura?
                </p>
                <button
                  onClick={() => router.push(`/events/${id}/join`)}
                  className="w-full flex items-center justify-center gap-2 py-3 px-6 rounded-2xl bg-[#ebdec8] text-[#1b2b25] text-xs font-black uppercase tracking-wider active:scale-95 transition shadow-md"
                >
                  <CustomIcon name="tenda-grossa" size={20} />
                  Entra Nella Spedizione
                </button>
              </div>
            )}
          </section>

          {/* 🧩 BENTO GRID PIANIFICAZIONE */}
          <section className="grid grid-cols-2 gap-3 items-stretch">
            {/* 1. PARTECIANTI */}
            <button
              onClick={() => router.push(`/events/${id}/participants`)}
              className="col-span-2 group overflow-hidden bg-white/90 backdrop-blur-2xl rounded-[2rem] p-4 border border-white border-l-4 border-l-[#1b2b25] shadow-sm flex items-center justify-between active:scale-[0.98] transition-all"
            >
              <div className="flex items-center gap-3.5 min-w-0">
                <CustomIcon name="profilo" size={48} className="shrink-0 group-hover:scale-105 transition-transform" />
                <div className="text-left min-w-0">
                  <span className="text-[9px] font-black uppercase tracking-widest text-[#1b2b25]/40 block">
                    GRUPPO
                  </span>
                  <h3 className="text-base font-black uppercase text-[#1b2b25] tracking-tight truncate">
                    Partecipanti ({stats.partecipanti})
                  </h3>
                  <p className="text-[10px] font-bold text-[#1b2b25]/60 truncate">
                    Tutti gli iscritti al viaggio
                  </p>
                </div>
              </div>
              <span className="text-[#1b2b25] font-black text-xl pr-1 shrink-0">→</span>
            </button>

            {/* 2. CHECKLIST */}
            <button
              onClick={() => router.push(`/events/${id}/checklist`)}
              className="col-span-2 group overflow-hidden bg-white/90 backdrop-blur-2xl rounded-[2rem] p-4 border border-white border-l-4 border-l-emerald-500 shadow-sm active:scale-[0.98] transition-all text-left space-y-2"
            >
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[9px] font-black uppercase tracking-widest text-emerald-700 block">
                    ORGANIZZAZIONE
                  </span>
                  <h3 className="text-xs font-black uppercase text-[#1b2b25]">
                    Checklist Personale
                  </h3>
                </div>
                <span className="font-mono text-xs font-black text-emerald-900 bg-emerald-100 px-2.5 py-1 rounded-xl border border-emerald-200">
                  {stats.checklistCompletata}/{stats.checklistTotale} ({percentChecklist}%)
                </span>
              </div>

              <div className="w-full h-2 rounded-full bg-slate-100 border border-slate-200 overflow-hidden shadow-inner">
                <div
                  className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                  style={{ width: `${percentChecklist}%` }}
                />
              </div>
            </button>

            {/* 3. TENDE */}
            <button
              onClick={() => router.push(`/events/${id}/tents`)}
              className="group overflow-hidden h-32 bg-white/90 backdrop-blur-2xl rounded-[2rem] p-3.5 border border-white border-l-4 border-l-teal-500 shadow-sm active:scale-[0.95] transition-all text-left flex justify-between items-center"
            >
              <div className="flex flex-col justify-between h-full min-w-0 pr-1">
                <div>
                  <span className="text-[9px] font-black uppercase tracking-widest text-teal-700 block">
                    ALLOGGI
                  </span>
                  <h3 className="text-xs font-black uppercase text-[#1b2b25] truncate">
                    Tende ({stats.tende})
                  </h3>
                </div>

                <div className="space-y-1">
                  <div className="text-sm font-black text-[#1b2b25]">
                    {stats.postiLetto} <span className="text-[10px] font-bold text-[#1b2b25]/60">posti</span>
                  </div>
                  <span className={`inline-block px-1.5 py-0.5 rounded-md text-[8px] font-black uppercase border whitespace-nowrap ${
                    stats.postiLetto >= stats.partecipanti
                      ? "bg-emerald-100 text-emerald-900 border-emerald-200"
                      : "bg-amber-100 text-amber-900 border-amber-200"
                  }`}>
                    {stats.postiLetto >= stats.partecipanti ? "✓ Posti OK" : `Mancano ${stats.partecipanti - stats.postiLetto}`}
                  </span>
                </div>
              </div>
              <CustomIcon name="tenda-grossa" size={54} className="shrink-0 drop-shadow-sm group-hover:scale-105 transition-transform" />
            </button>

            {/* 4. AUTO */}
            <button
              onClick={() => router.push(`/events/${id}/cars`)}
              className="group overflow-hidden h-32 bg-white/90 backdrop-blur-2xl rounded-[2rem] p-3.5 border border-white border-l-4 border-l-sky-500 shadow-sm active:scale-[0.95] transition-all text-left flex justify-between items-center"
            >
              <div className="flex flex-col justify-between h-full min-w-0 pr-1">
                <div>
                  <span className="text-[9px] font-black uppercase tracking-widest text-sky-700 block">
                    TRASPORTI
                  </span>
                  <h3 className="text-xs font-black uppercase text-[#1b2b25] truncate">
                    Auto ({stats.auto})
                  </h3>
                </div>

                <div className="space-y-1">
                  <div className="text-sm font-black text-[#1b2b25]">
                    {stats.postiAuto} <span className="text-[10px] font-bold text-[#1b2b25]/60">passaggi</span>
                  </div>
                  <span className={`inline-block px-1.5 py-0.5 rounded-md text-[8px] font-black uppercase border whitespace-nowrap ${
                    stats.postiAuto >= stats.partecipanti
                      ? "bg-emerald-100 text-emerald-900 border-emerald-200"
                      : "bg-amber-100 text-amber-900 border-amber-200"
                  }`}>
                    {stats.postiAuto >= stats.partecipanti ? "✓ Passaggi OK" : `Mancano ${stats.partecipanti - stats.postiAuto}`}
                  </span>
                </div>
              </div>
              <CustomIcon name="macchina" size={54} className="shrink-0 drop-shadow-sm group-hover:scale-105 transition-transform" />
            </button>

            {/* 5. EQUIPAGGIAMENTO */}
            <button
              onClick={() => router.push(`/events/${id}/equipment`)}
              className="group overflow-hidden h-32 bg-white/90 backdrop-blur-2xl rounded-[2rem] p-3.5 border border-white border-l-4 border-l-[#9a5328] shadow-sm active:scale-[0.95] transition-all text-left flex justify-between items-center"
            >
              <div className="flex flex-col justify-between h-full min-w-0 pr-1">
                <div>
                  <span className="text-[8px] font-black uppercase tracking-widest text-[#9a5328] block">
                    MATERIALE
                  </span>
                  <h3 className="text-xs font-black uppercase text-[#1b2b25] tracking-tight truncate">
                    Attrezzatura
                  </h3>
                </div>

                <div>
                  <span className="font-mono text-xs font-black bg-[#9a5328]/10 text-[#9a5328] px-2 py-0.5 rounded-lg border border-[#9a5328]/20 inline-block">
                    {stats.attrezzatura} oggetti
                  </span>
                  <p className="text-[9px] font-bold text-[#1b2b25]/60 mt-1 leading-tight truncate">
                    Kit & campo
                  </p>
                </div>
              </div>
              <CustomIcon name="zaino" size={54} className="shrink-0 drop-shadow-sm group-hover:scale-105 transition-transform" />
            </button>

            {/* 6. CIBO & SPESA */}
            <button
              onClick={() => router.push(`/events/${id}/shopping`)}
              className="group overflow-hidden h-32 bg-white/90 backdrop-blur-2xl rounded-[2rem] p-3.5 border border-white border-l-4 border-l-orange-500 shadow-sm active:scale-[0.95] transition-all text-left flex justify-between items-center"
            >
              <div className="flex flex-col justify-between h-full min-w-0 pr-1">
                <div>
                  <span className="text-[8px] font-black uppercase tracking-widest text-orange-700 block">
                    ALIMENTI
                  </span>
                  <h3 className="text-xs font-black uppercase text-[#1b2b25] tracking-tight whitespace-nowrap">
                    Cibo & Spesa
                  </h3>
                </div>

                <div>
                  <span className="font-mono text-xs font-black bg-orange-100 text-orange-900 px-2 py-0.5 rounded-lg border border-orange-200 inline-block">
                    {stats.shoppingCount} voci
                  </span>
                  <p className="text-[9px] font-extrabold text-[#1b2b25]/60 mt-1 leading-tight whitespace-nowrap">
                    Grigliata & menu
                  </p>
                </div>
              </div>
              <CustomIcon name="carrello" size={54} className="shrink-0 drop-shadow-sm group-hover:scale-105 transition-transform" />
            </button>

            {/* 7. SPESE */}
            <button
              onClick={() => router.push(`/events/${id}/expenses`)}
              className="group overflow-hidden h-28 bg-white/90 backdrop-blur-2xl rounded-[2rem] p-3.5 border border-white border-l-4 border-l-amber-500 shadow-sm active:scale-[0.95] transition-all text-left flex justify-between items-center"
            >
              <div className="flex flex-col justify-between h-full min-w-0 pr-1">
                <div>
                  <span className="text-[8px] font-black uppercase tracking-widest text-amber-700 block">
                    CONTABILITÀ
                  </span>
                  <h3 className="text-xs font-black uppercase text-[#1b2b25] truncate">
                    Spese
                  </h3>
                </div>
                <p className="text-[9px] font-bold text-[#1b2b25]/50 truncate">
                  Scontrini & saldi
                </p>
              </div>
              <CustomIcon name="soldi" size={48} className="shrink-0 drop-shadow-sm group-hover:scale-105 transition-transform" />
            </button>

            {/* 8. GALLERIA */}
            <button
              onClick={() => router.push(`/events/${id}/media`)}
              className="group overflow-hidden h-28 bg-white/90 backdrop-blur-2xl rounded-[2rem] p-3.5 border border-white border-l-4 border-l-indigo-500 shadow-sm active:scale-[0.95] transition-all text-left flex justify-between items-center"
            >
              <div className="flex flex-col justify-between h-full min-w-0 pr-1">
                <div>
                  <span className="text-[8px] font-black uppercase tracking-widest text-indigo-700 block">
                    GALLERIA
                  </span>
                  <h3 className="text-xs font-black uppercase text-[#1b2b25] truncate">
                    Ricordi
                  </h3>
                </div>
                <p className="text-[9px] font-bold text-[#1b2b25]/50 truncate">
                  {stats.mediaCount} elementi
                </p>
              </div>
              <CustomIcon name="foto" size={48} className="shrink-0 drop-shadow-sm group-hover:scale-105 transition-transform" />
            </button>
          </section>
        </>
      ) : (
        /* ========================================================= */
        /* 📸 LAYOUT EVENTO PASSATO (CAPSULA FOTOGRAFICA/MEDIA)      */
        /* ========================================================= */
        <section className="bg-black/40 border border-amber-400/20 backdrop-blur-xl rounded-[2.5rem] p-5 shadow-2xl space-y-4">
          
          <div className="flex flex-col gap-1.5 text-center mb-5">
            <h2 className="text-lg font-black uppercase tracking-wider text-[#ebdec8]">
              Capsula dei Ricordi
            </h2>
            <p className="text-xs text-[#ebdec8]/60 font-medium">
              Sfoglia foto e video salvati in questa spedizione.
            </p>
          </div>

          {/* TAB DI FILTRAGGIO MEDIA */}
          <div className="flex items-center justify-center gap-1.5 bg-black/60 p-1.5 rounded-2xl border border-amber-400/20 text-[11px] font-bold mb-4 w-fit mx-auto">
            <button
              onClick={() => setActiveMediaTab("all")}
              className={`px-3 py-1.5 rounded-xl transition-colors ${
                activeMediaTab === "all"
                  ? "bg-amber-400 text-zinc-950"
                  : "text-amber-100/70 hover:text-white"
              }`}
            >
              Tutti ({media.length})
            </button>
            <button
              onClick={() => setActiveMediaTab("photo")}
              className={`px-3 py-1.5 rounded-xl transition-colors ${
                activeMediaTab === "photo"
                  ? "bg-amber-400 text-zinc-950"
                  : "text-amber-100/70 hover:text-white"
              }`}
            >
              Foto ({photosCount})
            </button>
            <button
              onClick={() => setActiveMediaTab("video")}
              className={`px-3 py-1.5 rounded-xl transition-colors ${
                activeMediaTab === "video"
                  ? "bg-amber-400 text-zinc-950"
                  : "text-amber-100/70 hover:text-white"
              }`}
            >
              Video ({videosCount})
            </button>
          </div>

          {/* GRIGLIA MEDIA */}
          {filteredMedia.length === 0 ? (
            <div className="text-center py-10 rounded-2xl bg-black/40 border border-white/10 text-[#ebdec8]/60">
              <div className="text-3xl mb-2 opacity-50">📷</div>
              Nessun ricordo caricato per questa spedizione. <br />
              <button 
                onClick={() => router.push(`/events/${id}/media`)}
                className="mt-3 text-amber-400 underline font-bold"
              >
                Vai alla galleria per caricarne uno!
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {filteredMedia.map((item) => {
                const isVideo = getMediaType(item) === "video";
                const fullUrl = getMediaUrl(item);

                return (
                  <div
                    key={item.id}
                    className="group relative aspect-square rounded-2xl overflow-hidden bg-black/80 border border-amber-400/25 shadow-lg cursor-pointer transition-transform duration-300 hover:scale-[1.02]"
                    onClick={() => {
                      console.log("🔍 Apertura media URL:", fullUrl);
                      setSelectedMedia({ url: fullUrl, isVideo });
                    }}
                  >
                    {!isVideo ? (
                      <img
                        src={fullUrl}
                        alt={item.caption || "Ricordo evento"}
                        className="w-full h-full object-cover transition-opacity duration-300 group-hover:opacity-90"
                        onError={() => {
                          console.error("❌ Errore caricamento immagine thumbnail:", fullUrl);
                        }}
                      />
                    ) : (
                      <div className="relative w-full h-full bg-zinc-900 flex items-center justify-center">
                        <video
                          src={fullUrl}
                          className="w-full h-full object-cover opacity-60 pointer-events-none"
                          muted
                          playsInline
                        />
                        <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                          <div className="w-12 h-12 rounded-full bg-amber-400/90 text-zinc-950 flex items-center justify-center shadow-lg pl-1 text-xl">
                            ▶️
                          </div>
                        </div>
                      </div>
                    )}

                    {item.caption && (
                      <div className="absolute inset-x-0 bottom-0 p-2 bg-gradient-to-t from-black/90 via-black/40 to-transparent text-[10px] text-amber-100 truncate">
                        {item.caption}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* PULSANTE GESTIONE MEDIA */}
          <button
            onClick={() => router.push(`/events/${id}/media`)}
            className="w-full mt-4 py-3.5 rounded-2xl bg-[#ebdec8] text-[#1b2b25] text-xs font-black uppercase tracking-wider active:scale-95 transition shadow-md flex justify-center items-center gap-2"
          >
            📸 Aggiungi o Gestisci Ricordi
          </button>
        </section>
      )}

      {/* 🔍 LIGHTBOX UNIFICATO A SCHERMO INTERO (FOTO & VIDEO) */}
      {selectedMedia && (
        <div
          className="fixed inset-0 z-50 bg-black/95 backdrop-blur-xl flex items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={() => setSelectedMedia(null)}
        >
          <button
            onClick={() => setSelectedMedia(null)}
            className="absolute top-5 right-5 w-10 h-10 rounded-full bg-white/20 text-white font-bold text-lg flex items-center justify-center hover:bg-white/30 transition-colors z-50"
          >
            ✕
          </button>

          {selectedMedia.isVideo ? (
            <video
              src={selectedMedia.url}
              controls
              autoPlay
              className="max-w-full max-h-[85vh] rounded-2xl shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            />
          ) : (
            <img
              src={selectedMedia.url}
              alt="Ricordo ingrandito"
              className="max-w-full max-h-[85vh] object-contain rounded-2xl shadow-2xl"
              onClick={(e) => e.stopPropagation()}
              onError={() => {
                console.error("❌ Impossibile caricare l'immagine da:", selectedMedia.url);
              }}
            />
          )}
        </div>
      )}

    </main>
  );
}