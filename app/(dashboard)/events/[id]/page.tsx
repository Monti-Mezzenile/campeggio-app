"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import CustomIcon from "@/components/ui/CustomIcon";
import Button from "@/components/ui/Button";

export default function EventPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

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
      <div className="flex items-center justify-between bg-white/80 backdrop-blur-md px-3.5 py-2.5 rounded-2xl border border-white shadow-[0_2px_10px_rgba(0,0,0,0.02)]">
        <div className="flex items-center gap-2">
          <span className="text-xs font-black text-[#1b2b25]/70">{label}</span>
          <span className="text-xs font-extrabold text-[#1b2b25]">
            {giorni[data.getDay()]}
          </span>
          {momento && (
            <span className="text-[10px] font-bold text-[#1b2b25]/50 capitalize">
              ({momento})
            </span>
          )}
        </div>
        {time && (
          <span className="font-mono text-xs font-black bg-[#1b2b25] text-[#ebdec8] px-2.5 py-1 rounded-xl shadow-sm">
            {String(time).slice(0, 5)}
          </span>
        )}
      </div>
    );
  }

  async function loadEvent() {
    setLoading(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      setUser(user);

      const { data: profile } = await supabase
        .from("profiles")
        .select("ruolo")
        .eq("id", user.id)
        .single();

      setIsAdmin(profile?.ruolo === "admin");

      const { data: myData } = await supabase
        .from("event_members")
        .select("*")
        .eq("event_id", id)
        .eq("user_id", user.id)
        .maybeSingle();

      setMyParticipation(myData);
    }

    const { data: eventData, error: eventError } = await supabase
      .from("events")
      .select("*")
      .eq("id", id)
      .single();

    if (eventError) {
      console.error(eventError);
      setLoading(false);
      return;
    }

    setEvent(eventData);

    const { count: partecipanti } = await supabase
      .from("event_members")
      .select("*", { count: "exact", head: true })
      .eq("event_id", id)
      .eq("stato", "partecipo");

    const { data: eventTents } = await supabase
      .from("event_tents")
      .select("tent_id")
      .eq("event_id", id);

    let postiLetto = 0;
    if (eventTents && eventTents.length) {
      const ids = eventTents.map((t) => t.tent_id);
      const { data: tents } = await supabase
        .from("tents")
        .select("posti")
        .in("id", ids);

      postiLetto = (tents || []).reduce((tot, t) => tot + (t.posti || 0), 0);
    }

    const { data: tripCars } = await supabase
      .from("trip_cars")
      .select("posti_disponibili")
      .eq("trip_id", id);

    const { count: attrezzatura } = await supabase
      .from("event_equipment")
      .select("*", { count: "exact", head: true })
      .eq("event_id", id);

    const { count: mediaCount } = await supabase
      .from("media")
      .select("*", { count: "exact", head: true })
      .eq("event_id", id);

    const { count: shoppingItems } = await supabase
      .from("shopping_items")
      .select("*", { count: "exact", head: true })
      .eq("event_id", id);

    const { count: meatItems } = await supabase
      .from("meat_items")
      .select("*", { count: "exact", head: true })
      .eq("event_id", id);

    const shoppingCount = (shoppingItems || 0) + (meatItems || 0);

    const { data: checklists } = await supabase
      .from("checklists")
      .select("id")
      .eq("event_id", id);

    let checklistTotale = 0;
    let checklistCompletata = 0;

    if (checklists && checklists.length) {
      const { data: checklistItems } = await supabase
        .from("checklist_items")
        .select("completato")
        .in(
          "checklist_id",
          checklists.map((c) => c.id)
        );

      checklistTotale = checklistItems?.length || 0;
      checklistCompletata =
        checklistItems?.filter((item) => item.completato).length || 0;
    }

    const postiAuto = (tripCars || []).reduce(
      (tot, car) => tot + (car.posti_disponibili || 0),
      0
    );

    setStats({
      partecipanti: partecipanti || 0,
      tende: eventTents?.length || 0,
      postiLetto,
      auto: tripCars?.length || 0,
      postiAuto,
      attrezzatura: attrezzatura || 0,
      checklistTotale,
      checklistCompletata,
      mediaCount: mediaCount || 0,
      shoppingCount,
    });

    setLoading(false);
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

    const { data: rows, error: findError } = await supabase
      .from("event_members")
      .select("id")
      .eq("event_id", id)
      .eq("user_id", user.id);

    if (findError) {
      alert(findError.message);
      return;
    }

    if (!rows || rows.length === 0) {
      alert("Nessuna partecipazione trovata");
      return;
    }

    const ids = rows.map((row) => row.id);

    const { error } = await supabase
      .from("event_members")
      .delete()
      .in("id", ids);

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

    const { data, error } = await supabase
      .from("events")
      .delete()
      .eq("id", id)
      .select();

    if (error) {
      alert(error.message);
      return;
    }

    if (!data || data.length === 0) {
      alert("Evento non eliminato");
      return;
    }

    router.push("/");
  }

  if (loading) {
    return (
      <main className="min-h-screen p-6 max-w-md mx-auto flex flex-col items-center justify-center">
        <div className="w-16 h-16 rounded-full bg-white/50 backdrop-blur-md flex items-center justify-center shadow-lg animate-pulse mb-3 border border-white">
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
      <main className="min-h-screen p-6 max-w-md mx-auto flex flex-col items-center justify-center text-center">
        <div className="bg-white/70 backdrop-blur-2xl border border-white p-8 rounded-[2.5rem] shadow-sm">
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

  return (
    <main className="min-h-screen p-4 sm:p-6 pb-40 max-w-md mx-auto flex flex-col gap-5 select-none">
      
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

      {/* 🏕️ HERO EVENTO */}
      <section className="relative rounded-[2.5rem] bg-white/90 backdrop-blur-2xl p-6 shadow-sm border border-white overflow-hidden">
        <div className="absolute -right-2 -bottom-2 pointer-events-none">
          <CustomIcon name="tenda-grossa" size={110} />
        </div>

        <div className="relative z-10 space-y-3">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-[#ebdec8] text-[#1b2b25] font-black text-[10px] uppercase tracking-wider border border-white shadow-2xs">
            📍 {event.luogo || "Destinazione Segreta"}
          </div>

          <h1 className="text-3xl font-black text-[#1b2b25] leading-tight tracking-tight">
            {event.titolo}
          </h1>

          <div className="flex items-center gap-2 text-xs font-bold text-[#1b2b25]/70">
            <span>🗓️</span>
            <span>
              {event.data_inizio
                ? `${event.data_inizio}${
                    event.data_fine ? ` → ${event.data_fine}` : ""
                  }`
                : event.data_evento || "Data da definire"}
            </span>
          </div>
        </div>
      </section>

      {/* 🪪 PASS PARTECIPANTE */}
      <section className="rounded-[2.5rem] bg-white/80 backdrop-blur-2xl p-5 shadow-sm border border-white space-y-4">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2.5">
            <CustomIcon name="libro" size={24} className="shrink-0" />
            <h2 className="text-[11px] font-black uppercase tracking-wider text-[#1b2b25]">
              IL TUO PASS SPEDIZIONE
            </h2>
          </div>

          {myParticipation ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-900 border border-emerald-200 text-[10px] font-black uppercase tracking-wider shadow-2xs">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              Confermato
            </span>
          ) : (
            <span className="px-3 py-1 rounded-full bg-amber-100 text-amber-900 border border-amber-200 text-[10px] font-black uppercase tracking-wider">
              In Attesa
            </span>
          )}
        </div>

        {myParticipation ? (
          <div className="space-y-3">
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

            <div className="flex gap-2 pt-1">
              <button
                onClick={() => router.push(`/events/${id}/join`)}
                className="flex-1 py-3 px-4 rounded-2xl bg-[#1b2b25] text-[#ebdec8] text-xs font-black uppercase tracking-wider active:scale-95 transition shadow-md flex items-center justify-center gap-2"
              >
                ✏️ Modifica Dettagli
              </button>

              <button
                onClick={removeParticipation}
                className="w-12 h-12 rounded-2xl bg-red-500/10 text-red-600 border border-red-200 text-sm font-black active:scale-90 transition flex items-center justify-center hover:bg-red-500 hover:text-white"
                title="Rinuncia"
              >
                ❌
              </button>
            </div>
          </div>
        ) : (
          <div className="text-center py-4 px-2 space-y-3">
            <p className="text-xs font-semibold text-[#1b2b25]/70">
              Pronto a unirti al gruppo per questa avventura?
            </p>
            <Button onClick={() => router.push(`/events/${id}/join`)}>
              Entra Nella Spedizione ⛺
            </Button>
          </div>
        )}
      </section>

      {/* 🧩 BENTO GRID - ICONE GIGANTI (60px - 76px) */}
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
          className="group h-32 bg-[#1b2b25] text-[#ebdec8] rounded-[2rem] p-4 border border-[#1b2b25]/20 shadow-sm active:scale-[0.95] transition-all text-left flex justify-between items-center"
        >
          <div className="flex flex-col justify-between h-full">
            <div>
              <span className="text-[8px] font-black uppercase tracking-widest text-[#ebdec8]/50 block">
                MATERIALE
              </span>
              <h3 className="text-xs font-black uppercase tracking-wide">
                Attrezzatura
              </h3>
            </div>

            <div>
              <span className="font-mono text-xs font-black bg-white/20 text-white px-2 py-0.5 rounded-lg backdrop-blur-md">
                {stats.attrezzatura} oggetti
              </span>
              <p className="text-[9px] font-bold text-[#ebdec8]/70 mt-1 leading-tight">
                Kit & campo
              </p>
            </div>
          </div>

          <CustomIcon name="zaino" size={76} className="shrink-0 drop-shadow-md group-hover:scale-105 transition-transform" />
        </button>

        {/* 6. CIBO & SPESA */}
        <button
          onClick={() => router.push(`/events/${id}/shopping`)}
          className="group h-32 bg-[#ebdec8] text-[#1b2b25] rounded-[2rem] p-4 border border-white/80 shadow-sm active:scale-[0.95] transition-all text-left flex justify-between items-center"
        >
          <div className="flex flex-col justify-between h-full">
            <div>
              <span className="text-[8px] font-black uppercase tracking-widest text-[#1b2b25]/50 block">
                ALIMENTI
              </span>
              <h3 className="text-xs font-black uppercase tracking-wide">
                Cibo & Spesa
              </h3>
            </div>

            <div>
              <span className="font-mono text-xs font-black bg-white/80 px-2 py-0.5 rounded-lg">
                {stats.shoppingCount} voci
              </span>
              <p className="text-[9px] font-extrabold text-[#1b2b25]/70 mt-1 leading-tight">
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