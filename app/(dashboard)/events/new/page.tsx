"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";

export default function NewEventPage() {
  const router = useRouter();

  const [checking, setChecking] = useState(true);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    titolo: "",
    descrizione: "",
    luogo: "",
    data_inizio: "",
    data_fine: "",
    status: "aperto",
  });

  async function checkAdmin() {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.push("/");
      return;
    }

    const { data: profile, error } = await supabase
      .from("profiles")
      .select("ruolo")
      .eq("id", user.id)
      .single();

    if (error || profile?.ruolo !== "admin") {
      alert("Non hai i permessi per creare eventi");
      router.push("/");
      return;
    }

    setChecking(false);
  }

  async function createEvent() {
    if (!form.titolo.trim()) {
      alert("Inserisci almeno il titolo dell'evento!");
      return;
    }

    setSaving(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setSaving(false);
      return;
    }

    const { data: event, error } = await supabase
      .from("events")
      .insert({
        titolo: form.titolo,
        descrizione: form.descrizione,
        luogo: form.luogo,
        data_inizio: form.data_inizio,
        data_fine: form.data_fine,
        status: form.status,
        creato_da: user.id,
      })
      .select()
      .single();

    if (error) {
      console.log(error);
      alert(error.message);
      setSaving(false);
      return;
    }

    await supabase.from("event_members").insert({
      event_id: event.id,
      user_id: user.id,
      stato: "confermato",
    });

    router.push(`/events/${event.id}`);
  }

  useEffect(() => {
    checkAdmin();
  }, []);

  if (checking) {
    return (
      <main className="min-h-screen p-3 max-w-sm mx-auto flex flex-col items-center justify-center">
        <div className="w-10 h-10 rounded-full bg-white/80 backdrop-blur-xl flex items-center justify-center shadow-xs animate-pulse mb-2 border border-white">
          <span className="text-lg">🏕️</span>
        </div>
        <p className="font-mono text-[9px] font-bold uppercase tracking-widest text-[#1b2b25]/70">
          Verifica permessi admin...
        </p>
      </main>
    );
  }

  const statusOptions = [
    { id: "aperto", label: "🟢 Aperto", color: "border-emerald-500 bg-emerald-50 text-emerald-900" },
    { id: "preparazione", label: "🟡 In prep.", color: "border-amber-500 bg-amber-50 text-amber-900" },
    { id: "chiuso", label: "🔴 Chiuso", color: "border-rose-500 bg-rose-50 text-rose-900" },
  ];

  return (
    <main className="min-h-screen p-2.5 sm:p-3 pb-20 max-w-sm sm:max-w-md mx-auto flex flex-col gap-2 select-none">
      
      {/* 🚀 HEADER TOP BAR */}
      <header className="flex items-center justify-between pt-0.5">
        <button
          onClick={() => router.back()}
          className="w-7 h-7 rounded-full bg-white/80 text-[#1b2b25] flex items-center justify-center font-black text-xs shadow-xs backdrop-blur-md active:scale-90 transition border border-white"
        >
          ←
        </button>

        <div className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-white/80 backdrop-blur-md border border-white shadow-xs">
          <span className="text-[9px] font-black text-[#1b2b25] tracking-tight uppercase">
            Admin Zone
          </span>
        </div>

        <div className="w-7" />
      </header>

      {/* 🏕️ HERO BANNER */}
      <section className="bg-white/90 backdrop-blur-2xl rounded-xl px-3 py-2.5 border border-white shadow-xs border-l-4 border-l-emerald-500 flex items-center justify-between relative overflow-hidden">
        <div className="space-y-0.5 relative z-10">
          <span className="text-[8px] font-black uppercase tracking-wider text-emerald-800 bg-emerald-100 border border-emerald-200 px-1.5 py-0.2 rounded-full inline-block">
            ✨ Pannello di Controllo
          </span>
          <h1 className="text-base font-black text-[#1b2b25] tracking-tight leading-none">
            Nuovo Evento
          </h1>
          <p className="text-[10px] font-bold text-[#1b2b25]/60 leading-tight">
            Pianifica date, luogo e dettagli generali
          </p>
        </div>

        <span className="text-3xl opacity-90 shrink-0 drop-shadow-xs">🏕️</span>
      </section>

      {/* 📋 FORM CONTAINER */}
      <section className="bg-white/90 backdrop-blur-2xl rounded-xl p-3 border border-white shadow-xs flex flex-col gap-2.5">
        
        {/* TITOLO EVENTO */}
        <div>
          <label className="text-[9px] font-black uppercase tracking-wider text-[#1b2b25]/70 block mb-1">
            Titolo Evento
          </label>
          <input
            value={form.titolo}
            onChange={(e) => setForm({ ...form, titolo: e.target.value })}
            className="w-full bg-white/80 border border-white/90 rounded-xl px-2.5 py-1.5 text-xs font-bold text-[#1b2b25] placeholder-[#1b2b25]/40 focus:outline-hidden shadow-2xs"
            placeholder="Es. Winter Monti 2026"
          />
        </div>

        {/* DESCRIZIONE */}
        <div>
          <label className="text-[9px] font-black uppercase tracking-wider text-[#1b2b25]/70 block mb-1">
            Descrizione & Note
          </label>
          <textarea
            value={form.descrizione}
            onChange={(e) => setForm({ ...form, descrizione: e.target.value })}
            className="w-full bg-white/80 border border-white/90 rounded-xl p-2 text-xs font-medium text-[#1b2b25] placeholder-[#1b2b25]/40 focus:outline-hidden shadow-2xs min-h-[60px] resize-y"
            placeholder="Aggiungi dettagli sulle attività, regole o info utili..."
          />
        </div>

        {/* LUOGO */}
        <div>
          <label className="text-[9px] font-black uppercase tracking-wider text-[#1b2b25]/70 block mb-1">
            📍 Luogo / Location
          </label>
          <input
            value={form.luogo}
            onChange={(e) => setForm({ ...form, luogo: e.target.value })}
            className="w-full bg-white/80 border border-white/90 rounded-xl px-2.5 py-1.5 text-xs font-bold text-[#1b2b25] placeholder-[#1b2b25]/40 focus:outline-hidden shadow-2xs"
            placeholder="Es. Baita Cervino, Valle d'Aosta"
          />
        </div>

        {/* DATE GRID */}
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-[9px] font-black uppercase tracking-wider text-[#1b2b25]/70 block mb-1">
              📅 Inizio (Arrivo)
            </label>
            <input
              type="date"
              value={form.data_inizio}
              onChange={(e) => setForm({ ...form, data_inizio: e.target.value })}
              className="w-full bg-white/80 border border-white/90 rounded-xl px-2 py-1 text-xs font-bold text-[#1b2b25] focus:outline-hidden shadow-2xs"
            />
          </div>

          <div>
            <label className="text-[9px] font-black uppercase tracking-wider text-[#1b2b25]/70 block mb-1">
              📅 Fine (Partenza)
            </label>
            <input
              type="date"
              value={form.data_fine}
              onChange={(e) => setForm({ ...form, data_fine: e.target.value })}
              className="w-full bg-white/80 border border-white/90 rounded-xl px-2 py-1 text-xs font-bold text-[#1b2b25] focus:outline-hidden shadow-2xs"
            />
          </div>
        </div>

        {/* STATO EVENTO (PILLOLE GRAFICHE) */}
        <div>
          <label className="text-[9px] font-black uppercase tracking-wider text-[#1b2b25]/70 block mb-1.5">
            Stato Iniziale Evento
          </label>
          <div className="grid grid-cols-3 gap-1.5">
            {statusOptions.map((opt) => {
              const isSelected = form.status === opt.id;
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setForm({ ...form, status: opt.id })}
                  className={`py-1.5 px-1 rounded-xl text-[10px] font-black border transition-all text-center ${
                    isSelected
                      ? `${opt.color} shadow-2xs border-l-4 font-black`
                      : "bg-white/60 border-white text-[#1b2b25]/60 hover:bg-white"
                  }`}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* PULSANTE CREA EVENTO */}
        <button
          onClick={createEvent}
          disabled={saving}
          className="mt-1 w-full bg-[#1b2b25] text-white rounded-xl py-2.5 px-3 text-xs font-black active:scale-98 transition shadow-xs disabled:opacity-50 flex items-center justify-center gap-1.5"
        >
          {saving ? (
            <>
              <span className="inline-block w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              <span>Creazione in corso...</span>
            </>
          ) : (
            <>
              <span>🏕️</span>
              <span>Crea Evento</span>
            </>
          )}
        </button>

      </section>

    </main>
  );
}