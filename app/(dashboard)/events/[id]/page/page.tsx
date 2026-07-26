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

  const [form, setForm] = useState({
    arrivo_data: "",
    arrivo_ora: "",
    partenza_data: "",
    partenza_ora: "",
  });

  async function loadData() {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.push("/");
      return;
    }

    setUser(user);

    const { data: eventData, error: eventError } = await supabase
      .from("events")
      .select("*")
      .eq("id", id)
      .single();

    if (eventError) {
      console.log(eventError);
      return;
    }

    setEvent(eventData);

    const { data: member } = await supabase
      .from("event_members")
      .select("*")
      .eq("event_id", id)
      .eq("user_id", user.id)
      .maybeSingle();

    if (member) {
      setForm({
        arrivo_data: member.arrivo_data || "",
        arrivo_ora: member.arrivo_ora || "",
        partenza_data: member.partenza_data || "",
        partenza_ora: member.partenza_ora || "",
      });
    }

    setLoading(false);
  }

  async function save() {
    setSaving(true);

    const { error } = await supabase.from("event_members").upsert({
      event_id: id,
      user_id: user.id,
      stato: "partecipo",
      arrivo_data: form.arrivo_data,
      arrivo_ora: form.arrivo_ora,
      partenza_data: form.partenza_data,
      partenza_ora: form.partenza_ora,
    });

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
      loadData();
    }
  }, [id]);

  if (loading) {
    return (
      <main className="min-h-screen p-6 max-w-md mx-auto flex flex-col items-center justify-center">
        <div className="w-16 h-16 rounded-full bg-white/50 backdrop-blur-md flex items-center justify-center shadow-lg animate-pulse mb-3 border border-white">
          <CustomIcon name="tenda" size={36} />
        </div>
        <p className="font-mono text-xs font-bold uppercase tracking-widest text-[#1b2b25]">
          Caricamento orari...
        </p>
      </main>
    );
  }

  const isWinter = event?.titolo?.toLowerCase().includes("winter");

  return (
    <main className="min-h-screen p-4 sm:p-6 pb-36 max-w-md mx-auto flex flex-col gap-4 select-none">
      
      {/* 🚀 HEADER & NAVIGATION */}
      <header className="flex items-center justify-between pt-1">
        <button
          onClick={() => router.push(`/events/${id}`)}
          className="w-10 h-10 rounded-full bg-white/80 text-[#1b2b25] flex items-center justify-center font-black text-lg shadow-sm backdrop-blur-md active:scale-90 transition border border-white"
        >
          ←
        </button>

        <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/80 backdrop-blur-md border border-white shadow-sm">
          <span className="text-xs font-black text-[#1b2b25] tracking-tight uppercase">
            Logistica Partecipazione
          </span>
        </div>

        <div className="w-10" />
      </header>

      {/* 🏕️ HERO RSVP CARD (COMPATTA E BILANCIATA) */}
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
            {event?.titolo}
          </p>
        </div>
      </section>

      {/* 📅 FORM ARRIVO & PARTENZA */}
      <section className="bg-white/90 backdrop-blur-2xl rounded-[2rem] p-5 border border-white shadow-sm space-y-5">
        
        {/* SEZIONE ARRIVO */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 border-b border-[#1b2b25]/10 pb-2">
            <span className="text-lg">🛬</span>
            <h2 className="text-xs font-black text-[#1b2b25] uppercase tracking-wider">
              Quando arrivi?
            </h2>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase tracking-wider text-[#1b2b25]/60 px-1">
                Data
              </label>
              <input
                type="date"
                value={form.arrivo_data}
                onChange={(e) =>
                  setForm({
                    ...form,
                    arrivo_data: e.target.value,
                  })
                }
                className="w-full bg-white/80 backdrop-blur-md border border-white rounded-xl px-3 py-2.5 text-xs font-black text-[#1b2b25] outline-none focus:ring-2 focus:ring-[#1b2b25]/20 shadow-2xs"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase tracking-wider text-[#1b2b25]/60 px-1">
                Ora
              </label>
              <input
                type="time"
                value={form.arrivo_ora}
                onChange={(e) =>
                  setForm({
                    ...form,
                    arrivo_ora: e.target.value,
                  })
                }
                className="w-full bg-white/80 backdrop-blur-md border border-white rounded-xl px-3 py-2.5 text-xs font-black text-[#1b2b25] outline-none focus:ring-2 focus:ring-[#1b2b25]/20 shadow-2xs"
              />
            </div>
          </div>
        </div>

        {/* SEZIONE PARTENZA */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 border-b border-[#1b2b25]/10 pb-2">
            <span className="text-lg">🛫</span>
            <h2 className="text-xs font-black text-[#1b2b25] uppercase tracking-wider">
              Quando riparti?
            </h2>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase tracking-wider text-[#1b2b25]/60 px-1">
                Data
              </label>
              <input
                type="date"
                value={form.partenza_data}
                onChange={(e) =>
                  setForm({
                    ...form,
                    partenza_data: e.target.value,
                  })
                }
                className="w-full bg-white/80 backdrop-blur-md border border-white rounded-xl px-3 py-2.5 text-xs font-black text-[#1b2b25] outline-none focus:ring-2 focus:ring-[#1b2b25]/20 shadow-2xs"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase tracking-wider text-[#1b2b25]/60 px-1">
                Ora
              </label>
              <input
                type="time"
                value={form.partenza_ora}
                onChange={(e) =>
                  setForm({
                    ...form,
                    partenza_ora: e.target.value,
                  })
                }
                className="w-full bg-white/80 backdrop-blur-md border border-white rounded-xl px-3 py-2.5 text-xs font-black text-[#1b2b25] outline-none focus:ring-2 focus:ring-[#1b2b25]/20 shadow-2xs"
              />
            </div>
          </div>
        </div>

        {/* PULSANTE CONFERMA */}
        <button
          onClick={save}
          disabled={saving}
          className="w-full py-4 px-6 rounded-2xl bg-[#1b2b25] text-[#ebdec8] text-xs font-black uppercase tracking-wider shadow-md active:scale-95 transition disabled:opacity-50 text-center flex items-center justify-center gap-2 mt-2"
        >
          {saving ? (
            <span className="animate-pulse">Salvataggio...</span>
          ) : (
            "🏕️ Conferma Partecipazione"
          )}
        </button>

      </section>

    </main>
  );
}