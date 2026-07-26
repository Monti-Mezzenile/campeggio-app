"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import LogoutButton from "@/components/ui/LogoutButton";
import { supabase } from "@/lib/supabase";

export default function ProfilePage() {
  const router = useRouter();

  const [profile, setProfile] = useState<any>(null);
  const [myBadges, setMyBadges] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);

  const [nomeConiglio, setNomeConiglio] = useState("");
  const [padreFondatore, setPadreFondatore] = useState(false);

  async function loadProfile() {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setLoading(false);
      return;
    }

    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    setProfile(data);
    setNomeConiglio(data?.nome_coniglio || "");
    setPadreFondatore(data?.padre_fondatore || false);

    const { data: badges } = await supabase
      .from("user_badges")
      .select(`
        badge:badge_id(
          id,
          immagine_url,
          titolo
        )
      `)
      .eq("user_id", user.id);

    setMyBadges(badges || []);
    setLoading(false);
  }

  async function saveProfile() {
    setSaving(true);
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setSaving(false);
      return;
    }

    const { error } = await supabase
      .from("profiles")
      .update({
        nome_coniglio: nomeConiglio,
        padre_fondatore: padreFondatore,
      })
      .eq("id", user.id);

    if (error) {
      alert(error.message);
      setSaving(false);
      return;
    }

    setSaving(false);
    setEditing(false);
    loadProfile();
  }

  useEffect(() => {
    loadProfile();
  }, []);

  if (loading) {
    return (
      <main className="min-h-screen p-6 flex items-center justify-center text-[#FFF4E3]">
        <p className="font-semibold text-sm">Caricamento profilo...</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen p-6 pb-28 max-w-xl mx-auto flex flex-col gap-6">
      
      {/* 1. PROFILO HEADER CON PULSANTE EDIT INTEGRATO */}
      <section className="flex flex-col items-center text-center relative pt-2">
        
        {/* Foto Profilo */}
        <div className="relative mb-3">
          {profile?.avatar_url ? (
            <img
              src={profile.avatar_url}
              alt={profile.nome || "Avatar"}
              className="w-28 h-28 rounded-full object-cover border-4 border-[#6C9A8B]/40 shadow-lg"
            />
          ) : (
            <div className="w-28 h-28 rounded-full bg-[#6C9A8B]/20 flex items-center justify-center text-4xl border-4 border-[#6C9A8B]/40 shadow-lg">
              👤
            </div>
          )}

          {/* Tasto Modifica sovrapposto all'avatar */}
          <button
            onClick={() => setEditing(!editing)}
            title="Modifica profilo"
            className="absolute bottom-0 right-0 bg-[#a63a50] text-[#FFF4E3] p-2 rounded-full shadow-md active:scale-90 transition border-2 border-[#1f2041] text-xs"
          >
            ✏️
          </button>
        </div>

        {/* Nome ed Email */}
        <h1 className="text-2xl font-bold text-[#FFF4E3] tracking-wide">
          {profile?.nome || "Esploratore"}
        </h1>
        <p className="text-xs text-[#FFF4E3]/60 mb-3">{profile?.email}</p>

        {/* Badge Identità */}
        <div className="flex flex-wrap justify-center gap-2">
          <span className="px-3 py-1 rounded-full bg-[#FFF4E3]/15 text-[#FFF4E3] text-xs font-semibold backdrop-blur-sm border border-white/10">
            🐰 {nomeConiglio || "Nessun soprannome"}
          </span>
          <span className="px-3 py-1 rounded-full bg-[#FFF4E3]/15 text-[#FFF4E3] text-xs font-semibold backdrop-blur-sm border border-white/10">
            {padreFondatore ? "🐴 Padre fondatore" : "🐇 Non marchiato"}
          </span>
        </div>
      </section>

      {/* MODIFICA PROFILO (Form a comparsa) */}
      {editing && (
        <section className="rounded-[28px] bg-[#FFF4E3]/95 backdrop-blur-md p-5 shadow-xl border border-white/20 animate-in fade-in duration-200">
          <div className="flex flex-col gap-4">
            <div>
              <label className="text-xs uppercase tracking-widest font-bold text-[#1f2041]/70">
                Nome da coniglio
              </label>
              <input
                value={nomeConiglio}
                onChange={(e) => setNomeConiglio(e.target.value)}
                placeholder="Inserisci nome da coniglio"
                className="mt-2 w-full rounded-2xl p-3 bg-white text-[#1f2041] font-semibold border border-[#1f2041]/10 focus:outline-none focus:ring-2 focus:ring-[#6C9A8B]"
              />
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-[#1f2041]">
                Padre fondatore?
              </span>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setPadreFondatore(true)}
                  className={`px-4 py-2 rounded-full text-xs font-bold transition ${
                    padreFondatore
                      ? "bg-[#6C9A8B] text-[#FFF4E3]"
                      : "bg-white text-[#1f2041]"
                  }`}
                >
                  SI 🐴
                </button>
                <button
                  type="button"
                  onClick={() => setPadreFondatore(false)}
                  className={`px-4 py-2 rounded-full text-xs font-bold transition ${
                    !padreFondatore
                      ? "bg-[#a63a50] text-[#FFF4E3]"
                      : "bg-white text-[#1f2041]"
                  }`}
                >
                  NO 🐇
                </button>
              </div>
            </div>

            <button
              type="button"
              onClick={saveProfile}
              className="w-full rounded-2xl py-3 bg-[#1f2041] text-[#FFF4E3] font-bold uppercase tracking-wide active:scale-95 transition mt-2 shadow-md"
            >
              {saving ? "SALVATAGGIO..." : "SALVA PROFILO"}
            </button>
          </div>
        </section>
      )}

      {/* 2. MEDAGLIERE IN ALTO */}
      <section className="rounded-[28px] bg-[#FFF4E3]/90 backdrop-blur-md p-5 shadow-md border border-white/40">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h2 className="text-xs uppercase tracking-widest font-bold text-[#1f2041]">
              MEDAGLIERE & ONORIFICENZE
            </h2>
            <p className="text-[11px] text-[#1f2041]/60">
              {myBadges.length} {myBadges.length === 1 ? "medaglia sbloccata" : "medaglie sbloccate"}
            </p>
          </div>
          <button
            onClick={() => router.push("/profile/badges")}
            className="text-xs font-bold uppercase text-[#a63a50] hover:underline"
          >
            VEDI TUTTE →
          </button>
        </div>

        {myBadges.length > 0 ? (
          <div className="flex gap-3 overflow-x-auto pb-1 scrollbar-none">
            {myBadges.map((item: any, index: number) => (
              <div
                key={item.badge?.id || index}
                className="flex flex-col items-center gap-1 shrink-0"
              >
                {item.badge?.immagine_url ? (
                  <img
                    src={item.badge.immagine_url}
                    alt={item.badge?.titolo || "Badge"}
                    className="w-14 h-14 rounded-2xl object-cover border border-[#1f2041]/10 shadow-sm"
                  />
                ) : (
                  <div className="w-14 h-14 rounded-2xl bg-[#6C9A8B]/20 border border-[#6C9A8B]/30 flex items-center justify-center text-2xl shadow-inner">
                    🏅
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="p-4 rounded-2xl bg-white/50 text-center border border-[#1f2041]/5">
            <p className="text-xs font-semibold text-[#1f2041]/70">
              Nessuna medaglia ancora conquistata 🌲
            </p>
          </div>
        )}
      </section>

      {/* 3. INVENTARIO E RISORSE (SCHEDE ORIZZONTALI) */}
      <section className="flex flex-col gap-3">
        <h2 className="text-xs uppercase tracking-widest font-bold text-[#FFF4E3]/80 px-1">
          LOGISTICA & EQUIPAGGIAMENTO
        </h2>

        {[
          {
            title: "Tende e Alloggi",
            subtitle: "Gestisci la tua tenda e posti letto",
            icon: "⛺",
            link: "/profile/tents",
          },
          {
            title: "Mezzi di Trasporto",
            subtitle: "Auto disponibili e posti passeggeri",
            icon: "🚗",
            link: "/profile/cars",
          },
          {
            title: "Attrezzatura Personale",
            subtitle: "Kit campeggio e accessori da portare",
            icon: "🎒",
            link: "/profile/equipment",
          },
        ].map((item) => (
          <button
            key={item.title}
            onClick={() => router.push(item.link)}
            className="w-full rounded-[24px] bg-[#FFF4E3]/90 backdrop-blur-md p-4 shadow-sm flex items-center justify-between border border-white/40 active:scale-[0.98] transition hover:bg-[#FFF4E3]"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-[#1f2041]/10 flex items-center justify-center text-2xl shrink-0">
                {item.icon}
              </div>
              <div className="text-left">
                <h3 className="text-sm font-bold text-[#1f2041]">
                  {item.title}
                </h3>
                <p className="text-xs text-[#1f2041]/60">{item.subtitle}</p>
              </div>
            </div>
            <span className="text-xl font-bold text-[#1f2041]/30 pr-1">
              ›
            </span>
          </button>
        ))}
      </section>

      {/* 4. BOTTONE DI LOGOUT */}
      <div className="mt-2">
        <LogoutButton />
      </div>
    </main>
  );
}