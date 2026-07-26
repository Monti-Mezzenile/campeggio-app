"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import CustomIcon from "@/components/ui/CustomIcon";

export default function EditEventPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    titolo: "",
    descrizione: "",
    luogo: "",
    data_inizio: "",
    data_fine: "",
    status: "aperto",
  });

  async function loadEvent() {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.push("/");
      return;
    }

    const { data: event, error } = await supabase
      .from("events")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      console.log(error);
      router.push("/");
      return;
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("ruolo")
      .eq("id", user.id)
      .single();

    if (profile?.ruolo !== "admin") {
      alert("Non hai i permessi per modificare questo evento");
      router.push(`/events/${id}`);
      return;
    }

    setForm({
      titolo: event.titolo || "",
      descrizione: event.descrizione || "",
      luogo: event.luogo || "",
      data_inizio: event.data_inizio || "",
      data_fine: event.data_fine || "",
      status: event.status || "aperto",
    });

    setLoading(false);
  }

  async function saveEvent() {
    setSaving(true);

    const { error } = await supabase
      .from("events")
      .update({
        titolo: form.titolo,
        descrizione: form.descrizione,
        luogo: form.luogo,
        data_inizio: form.data_inizio,
        data_fine: form.data_fine,
        status: form.status,
      })
      .eq("id", id);

    if (error) {
      console.log(error);
      alert(error.message);
      setSaving(false);
      return;
    }

    router.push(`/events/${id}`);
  }

  useEffect(() => {
    if (id) {
      loadEvent();
    }
  }, [id]);

  if (loading) {
    return (
      <main className="min-h-screen p-6 max-w-md mx-auto flex flex-col items-center justify-center">
        <div className="w-16 h-16 rounded-full bg-white/50 backdrop-blur-md flex items-center justify-center shadow-lg animate-pulse mb-3 border border-white">
          <CustomIcon name="tenda-grossa" size={36} />
        </div>
        <p className="font-mono text-xs font-bold uppercase tracking-widest text-[#1b2b25]">
          Caricamento Modifica...
        </p>
      </main>
    );
  }

  return (
    <main className="min-h-screen p-4 sm:p-6 pb-36 max-w-md mx-auto flex flex-col gap-5 select-none">
      
      {/* 🚀 HEADER & TOP BAR */}
      <header className="flex items-center justify-between pt-1">
        <button
          onClick={() => router.push(`/events/${id}`)}
          className="w-10 h-10 rounded-full bg-white/80 text-[#1b2b25] flex items-center justify-center font-black text-lg shadow-sm backdrop-blur-md active:scale-90 transition border border-white"
        >
          ←
        </button>

        <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/80 backdrop-blur-md border border-white shadow-sm">
          <span className="text-xs font-black text-[#1b2b25] tracking-tight uppercase">
            Pannello Admin
          </span>
        </div>

        <div className="w-10" />
      </header>

      {/* 🏕️ HERO HEADER */}
      <section className="bg-white/90 backdrop-blur-2xl rounded-[2.5rem] p-6 border border-white shadow-sm flex items-center justify-between relative overflow-hidden">
        <div className="space-y-1 relative z-10">
          <span className="text-[10px] font-black uppercase tracking-wider text-[#1b2b25]/50 bg-[#ebdec8] px-2.5 py-0.5 rounded-full inline-block">
            ✏️ Impostazioni
          </span>
          <h1 className="text-2xl font-black text-[#1b2b25] tracking-tight">
            Modifica Spedizione
          </h1>
          <p className="text-xs font-semibold text-[#1b2b25]/60">
            Aggiorna i dettagli principali del viaggio
          </p>
        </div>

        <CustomIcon name="tenda-grossa" size={64} className="shrink-0 opacity-80" />
      </section>

      {/* 📝 MODULO DI MODIFICA */}
      <section className="bg-white/90 backdrop-blur-2xl rounded-[2.5rem] p-6 border border-white shadow-sm space-y-5">
        
        {/* TITOLO EVENTO */}
        <div className="space-y-1.5">
          <label className="text-[10px] font-black uppercase tracking-wider text-[#1b2b25]/60 px-1 block">
            🏷️ Titolo Evento
          </label>
          <input
            value={form.titolo}
            onChange={(e) => setForm({ ...form, titolo: e.target.value })}
            placeholder="Nome della spedizione..."
            className="w-full bg-white/80 backdrop-blur-md border border-white rounded-2xl px-4 py-3 text-xs font-black text-[#1b2b25] placeholder-[#1b2b25]/40 outline-none focus:ring-2 focus:ring-[#1b2b25]/20 shadow-2xs"
          />
        </div>

        {/* LUOGO */}
        <div className="space-y-1.5">
          <label className="text-[10px] font-black uppercase tracking-wider text-[#1b2b25]/60 px-1 block">
            📍 Destinazione / Luogo
          </label>
          <input
            value={form.luogo}
            onChange={(e) => setForm({ ...form, luogo: e.target.value })}
            placeholder="Luogo del campeggio o escursione..."
            className="w-full bg-white/80 backdrop-blur-md border border-white rounded-2xl px-4 py-3 text-xs font-black text-[#1b2b25] placeholder-[#1b2b25]/40 outline-none focus:ring-2 focus:ring-[#1b2b25]/20 shadow-2xs"
          />
        </div>

        {/* DATE ARRIVO & PARTENZA */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase tracking-wider text-[#1b2b25]/60 px-1 block">
              📅 Arrivo
            </label>
            <input
              type="date"
              value={form.data_inizio}
              onChange={(e) =>
                setForm({ ...form, data_inizio: e.target.value })
              }
              className="w-full bg-white/80 backdrop-blur-md border border-white rounded-2xl px-3 py-3 text-xs font-black text-[#1b2b25] outline-none focus:ring-2 focus:ring-[#1b2b25]/20 shadow-2xs"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase tracking-wider text-[#1b2b25]/60 px-1 block">
              📅 Partenza
            </label>
            <input
              type="date"
              value={form.data_fine}
              onChange={(e) => setForm({ ...form, data_fine: e.target.value })}
              className="w-full bg-white/80 backdrop-blur-md border border-white rounded-2xl px-3 py-3 text-xs font-black text-[#1b2b25] outline-none focus:ring-2 focus:ring-[#1b2b25]/20 shadow-2xs"
            />
          </div>
        </div>

        {/* DESCRIZIONE */}
        <div className="space-y-1.5">
          <label className="text-[10px] font-black uppercase tracking-wider text-[#1b2b25]/60 px-1 block">
            📝 Descrizione & Programma
          </label>
          <textarea
            value={form.descrizione}
            onChange={(e) => setForm({ ...form, descrizione: e.target.value })}
            placeholder="Aggiungi dettagli, orari indicativi o note utili per la truppa..."
            className="w-full bg-white/80 backdrop-blur-md border border-white rounded-2xl p-4 text-xs font-bold text-[#1b2b25] placeholder-[#1b2b25]/40 outline-none focus:ring-2 focus:ring-[#1b2b25]/20 shadow-2xs min-h-28 resize-none"
          />
        </div>

        {/* SELETTORE STATO EVENTO */}
        <div className="space-y-2">
          <label className="text-[10px] font-black uppercase tracking-wider text-[#1b2b25]/60 px-1 block">
            🚀 Stato Spedizione
          </label>

          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => setForm({ ...form, status: "aperto" })}
              className={`py-3 px-2 rounded-2xl text-[10px] font-black uppercase tracking-wider border transition-all ${
                form.status === "aperto"
                  ? "bg-emerald-500 text-white border-emerald-600 shadow-sm scale-[1.02]"
                  : "bg-white/80 text-[#1b2b25] border-white shadow-2xs hover:bg-emerald-50"
              }`}
            >
              🟢 Aperto
            </button>

            <button
              type="button"
              onClick={() => setForm({ ...form, status: "preparazione" })}
              className={`py-3 px-2 rounded-2xl text-[10px] font-black uppercase tracking-wider border transition-all ${
                form.status === "preparazione"
                  ? "bg-amber-500 text-white border-amber-600 shadow-sm scale-[1.02]"
                  : "bg-white/80 text-[#1b2b25] border-white shadow-2xs hover:bg-amber-50"
              }`}
            >
              🟡 Prep
            </button>

            <button
              type="button"
              onClick={() => setForm({ ...form, status: "chiuso" })}
              className={`py-3 px-2 rounded-2xl text-[10px] font-black uppercase tracking-wider border transition-all ${
                form.status === "chiuso"
                  ? "bg-rose-500 text-white border-rose-600 shadow-sm scale-[1.02]"
                  : "bg-white/80 text-[#1b2b25] border-white shadow-2xs hover:bg-rose-50"
              }`}
            >
              🔴 Chiuso
            </button>
          </div>
        </div>

        {/* PULSANTI DI AZIONE */}
        <div className="flex gap-2 pt-2">
          <button
            type="button"
            onClick={() => router.push(`/events/${id}`)}
            className="w-1/3 py-3.5 px-4 rounded-2xl bg-white/80 text-[#1b2b25] border border-white text-xs font-black uppercase tracking-wider active:scale-95 transition shadow-2xs text-center"
          >
            Annulla
          </button>

          <button
            type="button"
            onClick={saveEvent}
            disabled={saving}
            className="w-2/3 py-3.5 px-4 rounded-2xl bg-[#1b2b25] text-[#ebdec8] text-xs font-black uppercase tracking-wider shadow-md active:scale-95 transition disabled:opacity-50 text-center flex items-center justify-center gap-2"
          >
            {saving ? (
              <span className="animate-pulse">Salvataggio...</span>
            ) : (
              "💾 Salva Modifiche"
            )}
          </button>
        </div>

      </section>

    </main>
  );
}