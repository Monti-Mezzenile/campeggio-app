"use client";

import { useEffect, useState } from "react";
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
    const giorni = [
      "Domenica",
      "Lunedì",
      "Martedì",
      "Mercoledì",
      "Giovedì",
      "Venerdì",
      "Sabato",
    ];

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

  async function loadEvent() {
    if (!id) return;
    setLoading(true);

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
        setLoading(false);
        return;
      }

      setEvent(eventData);

      // 3. Esecuzione Parallela delle Query Statistiche
      const [
        partecipantiRes,
        eventTentsRes,
        tripCarsRes,
        attrezzaturaRes,
        mediaCountRes,
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
        supabase.from("trip_cars").select("posti_disponibili").eq("trip_id", id),
        supabase
          .from("event_equipment")
          .select("*", { count: "exact", head: true })
          .eq("event_id", id),
        supabase
          .from("media")
          .select("*", { count: "exact", head: true })
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

      // Calcolo Posti Letto
      let postiLetto = 0;
      const tentIds = eventTentsRes.data?.map((t) => t.tent_id) || [];
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
      const checklistIds = checklistsRes.data?.map((c) => c.id) || [];
      if (checklistIds.length > 0) {
        const { data: checklistItems } = await supabase
          .from("checklist_items")
          .select("completato")
          .in("checklist_id", checklistIds);

        checklistTotale = checklistItems?.length || 0;
        checklistCompletata =
          checklistItems?.filter((item) => item.completato).length || 0;
      }

      // Calcolo Posti Auto
      const postiAuto = (tripCarsRes.data || []).reduce(
        (tot, car) => tot + (car.posti_disponibili || 0),
        0
      );

      const shoppingCount =
        (shoppingItemsRes.count || 0) + (meatItemsRes.count || 0);

      setStats({
        partecipanti: partecipantiRes.count || 0,
        tende: eventTentsRes.data?.length || 0,
        postiLetto,
        auto: tripCarsRes.data?.length || 0,
        postiAuto,
        attrezzatura: attrezzaturaRes.count || 0,
        checklistTotale,
        checklistCompletata,
        mediaCount: mediaCountRes.count || 0,
        shoppingCount,
      });
    } catch (err) {
      console.error("Errore generale caricamento evento:", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (id) {
      loadEvent();
    }
  }, [id]);

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
            Spedizione MONTI
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

      {/* 🏕️ HERO EVENTO CREATIVO & SCENOGRAFICO */}
      <section
        className={`relative overflow-hidden rounded-[2.5rem] border-2 border-white/90 p-6 sm:p-7 shadow-xl backdrop-blur-2xl transition-all duration-500 ${
          isWinter
            ? "bg-gradient-to-br from-slate-900/90 via-sky-950/85 to-slate-900/90 text-white border-sky-300/30 shadow-sky-950/20"
            : "bg-gradient-to-br from-white/95 via-white/90 to-[#ebdec8]/60 text-[#1b2b25] shadow-black/5"
        }`}
      >
        {/* Glow d'ambiente dinamico (Winter vs Summer) */}
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

        {/* Tenda Icona 3D Ancorata con Aura */}
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

        {/* Contenuto Principale */}
        <div className="relative z-10 space-y-3.5 max-w-[78%]">
          {/* Stamp / Badges */}
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

          {/* Titolo Principale Impattante */}
          <div className="space-y-1">
            <h1
              className={`text-3xl sm:text-4xl font-black tracking-tight leading-[1.1] drop-shadow-xs ${
                isWinter ? "text-white" : "text-[#1b2b25]"
              }`}
            >
              {event.titolo || event.title || "Spedizione"}
            </h1>
          </div>

          {/* Data Badge Glassmorphic */}
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

      {/* 🪪 PASS PARTECIPANTE - GLASS & PANNA OUTLINE */}
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
                  "🏕️ Arrivo:"
                )}
                {formatArrivalDeparture(
                  myParticipation.partenza_data,
                  myParticipation.partenza_ora,
                  "🚗 Partenza:"
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

      {/* 🧩 BENTO GRID - ICONE GIGANTI */}
      <section className="grid grid-cols-2 gap-3 items-stretch">
        {/* 1. PARTECIPANTI */}
        <button
          onClick={() => router.push(`/events/${id}/participants`)}
          className="col-span-2 group bg-white/90 backdrop-blur-2xl rounded-[2rem] p-4 border border-white border-l-4 border-l-[#1b2b25] shadow-sm flex items-center justify-between active:scale-[0.98] transition-all"
        >
          <div className="flex items-center gap-3.5">
            <CustomIcon name="profilo" size={60} className="shrink-0 group-hover:scale-105 transition-transform" />
            <div className="text-left">
              <span className="text-[9px] font-black uppercase tracking-widest text-[#1b2b25]/40 block">
                GRUPPO
              </span>
              <h3 className="text-base font-black uppercase text-[#1b2b25] tracking-tight">
                Partecipanti ({stats.partecipanti})
              </h3>
              <p className="text-[10px] font-bold text-[#1b2b25]/60">
                Tutti gli iscritti al viaggio
              </p>
            </div>
          </div>
          <span className="text-[#1b2b25] font-black text-xl pr-1">→</span>
        </button>

        {/* 2. CHECKLIST */}
        <button
          onClick={() => router.push(`/events/${id}/checklist`)}
          className="col-span-2 group bg-white/90 backdrop-blur-2xl rounded-[2rem] p-4 border border-white border-l-4 border-l-emerald-500 shadow-sm active:scale-[0.98] transition-all text-left space-y-2"
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
          className="group h-32 bg-white/90 backdrop-blur-2xl rounded-[2rem] p-4 border border-white border-l-4 border-l-teal-500 shadow-sm active:scale-[0.95] transition-all text-left flex justify-between items-center"
        >
          <div className="flex flex-col justify-between h-full">
            <div>
              <span className="text-[9px] font-black uppercase tracking-widest text-teal-700 block">
                ALLOGGI
              </span>
              <h3 className="text-xs font-black uppercase text-[#1b2b25]">
                Tende ({stats.tende})
              </h3>
            </div>

            <div className="space-y-1">
              <div className="text-base font-black text-[#1b2b25]">
                {stats.postiLetto} <span className="text-[10px] font-bold text-[#1b2b25]/60">posti</span>
              </div>
              <span className={`inline-block px-1.5 py-0.5 rounded-md text-[8px] font-black uppercase border ${
                stats.postiLetto >= stats.partecipanti
                  ? "bg-emerald-100 text-emerald-900 border-emerald-200"
                  : "bg-amber-100 text-amber-900 border-amber-200"
              }`}>
                {stats.postiLetto >= stats.partecipanti ? "✓ Posti OK" : `Mancano ${stats.partecipanti - stats.postiLetto}`}
              </span>
            </div>
          </div>

          <CustomIcon name="tenda-grossa" size={76} className="shrink-0 drop-shadow-sm group-hover:scale-105 transition-transform" />
        </button>

        {/* 4. AUTO */}
        <button
          onClick={() => router.push(`/events/${id}/cars`)}
          className="group h-32 bg-white/90 backdrop-blur-2xl rounded-[2rem] p-4 border border-white border-l-4 border-l-sky-500 shadow-sm active:scale-[0.95] transition-all text-left flex justify-between items-center"
        >
          <div className="flex flex-col justify-between h-full">
            <div>
              <span className="text-[9px] font-black uppercase tracking-widest text-sky-700 block">
                TRASPORTI
              </span>
              <h3 className="text-xs font-black uppercase text-[#1b2b25]">
                Auto ({stats.auto})
              </h3>
            </div>

            <div className="space-y-1">
              <div className="text-base font-black text-[#1b2b25]">
                {stats.postiAuto} <span className="text-[10px] font-bold text-[#1b2b25]/60">passaggi</span>
              </div>
              <span className={`inline-block px-1.5 py-0.5 rounded-md text-[8px] font-black uppercase border ${
                stats.postiAuto >= stats.partecipanti
                  ? "bg-emerald-100 text-emerald-900 border-emerald-200"
                  : "bg-amber-100 text-amber-900 border-amber-200"
              }`}>
                {stats.postiAuto >= stats.partecipanti ? "✓ Passaggi OK" : `Mancano ${stats.partecipanti - stats.postiAuto}`}
              </span>
            </div>
          </div>

          <CustomIcon name="macchina" size={76} className="shrink-0 drop-shadow-sm group-hover:scale-105 transition-transform" />
        </button>

        {/* 5. EQUIPAGGIAMENTO */}
        <button
          onClick={() => router.push(`/events/${id}/equipment`)}
          className="group h-32 bg-white/90 backdrop-blur-2xl rounded-[2rem] p-4 border border-white border-l-4 border-l-[#9a5328] shadow-sm active:scale-[0.95] transition-all text-left flex justify-between items-center"
        >
          <div className="flex flex-col justify-between h-full">
            <div>
              <span className="text-[8px] font-black uppercase tracking-widest text-[#9a5328] block">
                MATERIALE
              </span>
              <h3 className="text-xs font-black uppercase text-[#1b2b25] tracking-wide">
                Attrezzatura
              </h3>
            </div>

            <div>
              <span className="font-mono text-xs font-black bg-[#9a5328]/10 text-[#9a5328] px-2 py-0.5 rounded-lg border border-[#9a5328]/20">
                {stats.attrezzatura} oggetti
              </span>
              <p className="text-[9px] font-bold text-[#1b2b25]/60 mt-1 leading-tight">
                Kit & campo
              </p>
            </div>
          </div>

          <CustomIcon name="zaino" size={76} className="shrink-0 drop-shadow-sm group-hover:scale-105 transition-transform" />
        </button>

        {/* 6. CIBO & SPESA */}
        <button
          onClick={() => router.push(`/events/${id}/shopping`)}
          className="group h-32 bg-white/90 backdrop-blur-2xl rounded-[2rem] p-4 border border-white border-l-4 border-l-orange-500 shadow-sm active:scale-[0.95] transition-all text-left flex justify-between items-center"
        >
          <div className="flex flex-col justify-between h-full">
            <div>
              <span className="text-[8px] font-black uppercase tracking-widest text-orange-700 block">
                ALIMENTI
              </span>
              <h3 className="text-xs font-black uppercase text-[#1b2b25] tracking-wide">
                Cibo & Spesa
              </h3>
            </div>

            <div>
              <span className="font-mono text-xs font-black bg-orange-100 text-orange-900 px-2 py-0.5 rounded-lg border border-orange-200">
                {stats.shoppingCount} voci
              </span>
              <p className="text-[9px] font-extrabold text-[#1b2b25]/60 mt-1 leading-tight">
                Grigliata & menu
              </p>
            </div>
          </div>

          <CustomIcon name="carrello" size={76} className="shrink-0 drop-shadow-sm group-hover:scale-105 transition-transform" />
        </button>

        {/* 7. SPESE */}
        <button
          onClick={() => router.push(`/events/${id}/expenses`)}
          className="group h-28 bg-white/90 backdrop-blur-2xl rounded-[2rem] p-4 border border-white border-l-4 border-l-amber-500 shadow-sm active:scale-[0.95] transition-all text-left flex justify-between items-center"
        >
          <div className="flex flex-col justify-between h-full">
            <div>
              <span className="text-[8px] font-black uppercase tracking-widest text-amber-700 block">
                CONTABILITÀ
              </span>
              <h3 className="text-xs font-black uppercase text-[#1b2b25]">
                Spese
              </h3>
            </div>
            <p className="text-[9px] font-bold text-[#1b2b25]/50">
              Scontrini & saldi
            </p>
          </div>

          <CustomIcon name="soldi" size={64} className="shrink-0 drop-shadow-sm group-hover:scale-105 transition-transform" />
        </button>

        {/* 8. RICORDI */}
        <button
          onClick={() => router.push(`/events/${id}/media`)}
          className="group h-28 bg-white/90 backdrop-blur-2xl rounded-[2rem] p-4 border border-white border-l-4 border-l-indigo-500 shadow-sm active:scale-[0.95] transition-all text-left flex justify-between items-center"
        >
          <div className="flex flex-col justify-between h-full">
            <div>
              <span className="text-[8px] font-black uppercase tracking-widest text-indigo-700 block">
                GALLERIA
              </span>
              <h3 className="text-xs font-black uppercase text-[#1b2b25]">
                Ricordi
              </h3>
            </div>
            <p className="text-[9px] font-bold text-[#1b2b25]/50">
              {stats.mediaCount} elementi
            </p>
          </div>

          <CustomIcon name="foto" size={64} className="shrink-0 drop-shadow-sm group-hover:scale-105 transition-transform" />
        </button>
      </section>
    </main>
  );
}