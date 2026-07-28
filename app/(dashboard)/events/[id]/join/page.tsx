"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import CustomIcon from "@/components/ui/CustomIcon";

export default function JoinEventPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [event, setEvent] = useState<any>(null);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [scelta, setScelta] = useState<
    "partecipo" | "forse" | "non_posso" | null
  >(null);

  const [arrivoData, setArrivoData] = useState("");
  const [arrivoOra, setArrivoOra] = useState("");
  const [partenzaData, setPartenzaData] = useState("");
  const [partenzaOra, setPartenzaOra] = useState("");

  async function loadData() {
    setLoading(true);
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      setUser(user);
    }

    const { data: eventData, error } = await supabase
      .from("events")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      console.log(error);
      return;
    }

    setEvent(eventData);
    setLoading(false);
  }

  useEffect(() => {
    if (id) {
      loadData();
    }
  }, [id]);

  function generateHours() {
    return Array.from({ length: 30 }).map((_, i) => {
      const totaleMinuti = 9 * 60 + i * 30;
      const ore = Math.floor(totaleMinuti / 60)
        .toString()
        .padStart(2, "0");
      const minuti = (totaleMinuti % 60).toString().padStart(2, "0");
      return `${ore}:${minuti}`;
    });
  }

  // 🗓️ Helper per generare l'elenco dei giorni dell'evento o da Lunedì a Domenica
  function getDaysOptions() {
    const daysOfWeek = [
      "Domenica",
      "Lunedì",
      "Martedì",
      "Mercoledì",
      "Giovedì",
      "Venerdì",
      "Sabato",
    ];

    const fallbackDays = [
      { value: "Lunedì", label: "Lunedì" },
      { value: "Martedì", label: "Martedì" },
      { value: "Mercoledì", label: "Mercoledì" },
      { value: "Giovedì", label: "Giovedì" },
      { value: "Venerdì", label: "Venerdì" },
      { value: "Sabato", label: "Sabato" },
      { value: "Domenica", label: "Domenica" },
    ];

    if (!event?.data_inizio && !event?.data_evento) {
      return fallbackDays;
    }

    const start = new Date(event.data_inizio || event.data_evento);
    const end = event.data_fine ? new Date(event.data_fine) : new Date(start);

    if (isNaN(start.getTime())) {
      return fallbackDays;
    }

    const options = [];
    const current = new Date(start);

    // Genera i giorni dell'evento (almeno 3 giorni di default per permettere la scelta del rientro)
    let count = 0;
    while ((current <= end || options.length < 3) && count < 10) {
      const yyyy = current.getFullYear();
      const mm = String(current.getMonth() + 1).padStart(2, "0");
      const dd = String(current.getDate()).padStart(2, "0");
      const isoDate = `${yyyy}-${mm}-${dd}`;

      const dayName = daysOfWeek[current.getDay()];
      const formattedLabel = `${dayName} (${dd}/${mm})`;

      options.push({ value: isoDate, label: formattedLabel });
      current.setDate(current.getDate() + 1);
      count++;
    }

    return options;
  }

  async function saveParticipation() {
    if (!user || !scelta) {
      alert("Scegli come parteciperai");
      return;
    }
    setSaving(true);

    const payload = {
      event_id: id,
      user_id: user.id,
      stato: scelta,
      arrivo_data: scelta === "partecipo" ? arrivoData || null : null,
      arrivo_ora: scelta === "partecipo" ? arrivoOra || null : null,
      partenza_data: scelta === "partecipo" ? partenzaData || null : null,
      partenza_ora: scelta === "partecipo" ? partenzaOra || null : null,
    };

    const { data: existing, error: checkError } = await supabase
      .from("event_members")
      .select("id")
      .eq("event_id", id)
      .eq("user_id", user.id)
      .maybeSingle();

    if (checkError) {
      console.log(checkError);
      alert(checkError.message);
      setSaving(false);
      return;
    }

    let error;
    if (existing) {
      const result = await supabase
        .from("event_members")
        .update(payload)
        .eq("id", existing.id);
      error = result.error;
    } else {
      const result = await supabase.from("event_members").insert(payload);
      error = result.error;
    }

    if (error) {
      console.log(error);
      alert(error.message);
      setSaving(false);
      return;
    }

    if (scelta === "partecipo" || scelta === "forse") {
      const { data: existingChecklist } = await supabase
        .from("checklists")
        .select("id")
        .eq("event_id", id)
        .eq("user_id", user.id)
        .maybeSingle();

      if (!existingChecklist) {
        await supabase.from("checklists").insert({
          event_id: id,
          user_id: user.id,
        });
      }
    }
    setSaving(false);
    router.push(`/events/${id}`);
  }

  if (loading) {
    return (
      <main className="min-h-screen p-6 max-w-md mx-auto flex flex-col items-center justify-center">
        <div className="w-16 h-16 rounded-full bg-white/50 backdrop-blur-md flex items-center justify-center shadow-lg animate-pulse mb-3 border border-white">
          <CustomIcon name="coniglio" size={36} />
        </div>
        <p className="font-mono text-xs font-bold uppercase tracking-widest text-[#1b2b25]">
          Caricamento RSVP...
        </p>
      </main>
    );
  }

  if (!event) {
    return (
      <main className="min-h-screen p-6 max-w-md mx-auto flex flex-col items-center justify-center text-center">
        <div className="bg-white/60 backdrop-blur-xl border border-white p-8 rounded-[2rem] shadow-sm space-y-3 relative overflow-hidden">
          <CustomIcon name="tenda-grossa" size={60} className="mx-auto opacity-60" />
          <h2 className="text-xl font-black text-[#1b2b25]">
            Evento non trovato
          </h2>
          <button
            onClick={() => router.push("/")}
            className="mt-4 px-5 py-2.5 rounded-xl bg-[#1b2b25] text-[#ebdec8] text-xs font-black uppercase tracking-wider shadow-md"
          >
            Torna alla Home
          </button>
        </div>
      </main>
    );
  }

  const isWinter = event.titolo?.toLowerCase().includes("winter");

  const choices = [
    {
      id: "partecipo",
      status: "🟢",
      title: "CI SARÒ",
      description: "Il richiamo di Monti è troppo forte.",
    },
    {
      id: "forse",
      status: "🟡",
      title: "FORSE",
      description: "Il mio cervello dice sì, il calendario dice boh.",
    },
    {
      id: "non_posso",
      status: "🔴",
      title: "NON POSSO",
      description: "Sono un soffice batuffolo con le orecchie lunghe.",
    },
  ];

  const daysOptions = getDaysOptions();

  return (
    <main className="min-h-screen p-4 sm:p-6 pb-36 max-w-md mx-auto flex flex-col gap-4 select-none">
      {/* 🚀 HEADER TOP BAR & BACK */}
      <header className="flex items-center justify-between pt-1">
        <button
          onClick={() => router.push(`/events/${id}`)}
          className="w-10 h-10 rounded-full bg-white/80 text-[#1b2b25] flex items-center justify-center font-black text-lg shadow-sm backdrop-blur-md active:scale-90 transition border border-white"
        >
          ←
        </button>

        <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/80 backdrop-blur-md border border-white shadow-sm">
          <span className="text-xs font-black text-[#1b2b25] tracking-tight uppercase">
            Conferma Presenza
          </span>
        </div>

        <div className="w-10" />
      </header>

      {/* 🏕️ HERO RSVP CARD */}
      <section className="bg-white/90 backdrop-blur-2xl rounded-[2rem] p-5 border border-white shadow-sm text-center space-y-2 relative overflow-hidden">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-[#1b2b25] text-[#ebdec8] text-2xl shadow-xs border border-white/20">
          {isWinter ? "❄️" : "🏕️"}
        </div>

        <div className="space-y-1">
          <h1 className="text-base sm:text-lg font-black text-[#1b2b25] tracking-tight leading-snug max-w-xs mx-auto">
            {isWinter
              ? "Si vede che sei pronto alle grandi sfide"
              : "Vedo che anche tu hai sentito il richiamo di Monti"}
          </h1>
          <p className="text-xs font-bold text-[#1b2b25]/50 uppercase tracking-wider">
            {event.titolo}
          </p>
        </div>
      </section>

      {/* 🟢🟡🔴 CHOICE CARDS TATTILI */}
      <section className="flex flex-col gap-2.5">
        {choices.map((choice) => (
          <button
            key={choice.id}
            onClick={() => setScelta(choice.id as any)}
            className={`
              rounded-[1.8rem] p-4 text-left border transition-all duration-200 active:scale-[0.98] shadow-2xs
              ${
                scelta === choice.id
                  ? "bg-[#1b2b25] text-[#ebdec8] border-[#ebdec8]/20 shadow-md scale-[1.01]"
                  : "bg-white/80 backdrop-blur-xl border-white hover:bg-white"
              }
            `}
          >
            <div className="flex items-center gap-3">
              <span className="text-2xl shrink-0">{choice.status}</span>
              <div className="min-w-0">
                <h2
                  className={`text-sm font-black uppercase tracking-tight ${
                    scelta === choice.id ? "text-white" : "text-[#1b2b25]"
                  }`}
                >
                  {choice.title}
                </h2>
                <p
                  className={`text-[11px] font-semibold leading-tight mt-0.5 ${
                    scelta === choice.id
                      ? "text-white/80"
                      : "text-[#1b2b25]/60"
                  }`}
                >
                  {choice.description}
                </p>
              </div>
            </div>
          </button>
        ))}
      </section>

      {/* 🏕️ ORGANIZZA IL VIAGGIO (CONDIZIONALE) */}
      {scelta === "partecipo" && (
        <section className="bg-white/90 backdrop-blur-2xl rounded-[2rem] p-5 shadow-sm border border-white space-y-3">
          <div className="flex items-center gap-2.5">
            <span className="text-xl">🏕️</span>
            <div>
              <h2 className="text-xs font-black text-[#1b2b25] leading-none uppercase tracking-wide">
                Logistica Viaggio
              </h2>
              <p className="text-[10px] text-[#1b2b25]/60 font-semibold mt-0.5">
                Specifica orari e date approssimative
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2.5 pt-2 border-t border-[#1b2b25]/10">
            {/* DATA ARRIVO */}
            <div className="space-y-1 min-w-0">
              <label className="text-[10px] font-black uppercase tracking-wider text-[#1b2b25]/60 px-1 block truncate">
                📅 Data Arrivo
              </label>
              <select
                value={arrivoData}
                onChange={(e) => setArrivoData(e.target.value)}
                className="w-full h-11 block min-w-0 bg-white/90 backdrop-blur-md border border-white rounded-xl px-2.5 text-[11px] sm:text-xs font-extrabold text-[#1b2b25] outline-none focus:ring-2 focus:ring-[#1b2b25]/20 shadow-2xs"
              >
                <option value="">Seleziona giorno</option>
                {daysOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            {/* ORA ARRIVO */}
            <div className="space-y-1 min-w-0">
              <label className="text-[10px] font-black uppercase tracking-wider text-[#1b2b25]/60 px-1 block truncate">
                🕘 Ora Arrivo
              </label>
              <select
                value={arrivoOra}
                onChange={(e) => setArrivoOra(e.target.value)}
                className="w-full h-11 block min-w-0 bg-white/90 backdrop-blur-md border border-white rounded-xl px-2.5 text-[11px] sm:text-xs font-extrabold text-[#1b2b25] outline-none focus:ring-2 focus:ring-[#1b2b25]/20 shadow-2xs"
              >
                <option value="">Seleziona ora</option>
                {generateHours().map((ora) => (
                  <option key={ora} value={ora}>
                    {ora}
                  </option>
                ))}
              </select>
            </div>

            {/* DATA PARTENZA */}
            <div className="space-y-1 min-w-0">
              <label className="text-[10px] font-black uppercase tracking-wider text-[#1b2b25]/60 px-1 block truncate">
                📅 Data Partenza
              </label>
              <select
                value={partenzaData}
                onChange={(e) => setPartenzaData(e.target.value)}
                className="w-full h-11 block min-w-0 bg-white/90 backdrop-blur-md border border-white rounded-xl px-2.5 text-[11px] sm:text-xs font-extrabold text-[#1b2b25] outline-none focus:ring-2 focus:ring-[#1b2b25]/20 shadow-2xs"
              >
                <option value="">Seleziona giorno</option>
                {daysOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            {/* ORA PARTENZA */}
            <div className="space-y-1 min-w-0">
              <label className="text-[10px] font-black uppercase tracking-wider text-[#1b2b25]/60 px-1 block truncate">
                🕘 Ora Partenza
              </label>
              <select
                value={partenzaOra}
                onChange={(e) => setPartenzaOra(e.target.value)}
                className="w-full h-11 block min-w-0 bg-white/90 backdrop-blur-md border border-white rounded-xl px-2.5 text-[11px] sm:text-xs font-extrabold text-[#1b2b25] outline-none focus:ring-2 focus:ring-[#1b2b25]/20 shadow-2xs"
              >
                <option value="">Seleziona ora</option>
                {generateHours().map((ora) => (
                  <option key={ora} value={ora}>
                    {ora}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </section>
      )}

      {/* ✅ PULSANTE DI CONFERMA */}
      <div className="mt-4 flex justify-center">
        <button
          onClick={saveParticipation}
          disabled={saving}
          className="w-full py-4 px-8 rounded-2xl bg-[#1b2b25] text-[#ebdec8] text-xs font-black uppercase tracking-wider shadow-md active:scale-95 transition disabled:opacity-50 text-center flex items-center justify-center gap-2"
        >
          {saving ? (
            <span className="animate-pulse">Salvataggio...</span>
          ) : (
            "🚀 Conferma Presenza"
          )}
        </button>
      </div>
    </main>
  );
}