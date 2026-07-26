"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import LogoutButton from "@/components/ui/LogoutButton";
import { supabase } from "@/lib/supabase";
import CustomIcon, { IconName } from "@/components/ui/CustomIcon";

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
      <main className="min-h-screen p-6 max-w-md mx-auto flex flex-col items-center justify-center">
        <div className="w-16 h-16 rounded-full bg-white/50 backdrop-blur-md flex items-center justify-center shadow-lg animate-pulse mb-3 border border-white">
          <CustomIcon name="coniglio" size={32} />
        </div>
        <p className="font-mono text-xs font-bold uppercase tracking-widest text-[#1b2b25]">
          Caricamento...
        </p>
      </main>
    );
  }

  return (
    <main className="min-h-screen p-4 sm:p-6 pb-28 max-w-md mx-auto flex flex-col gap-6 select-none">
      
      {/* 🚀 HEADER CON BADGE STATO E ICONA CUSTOM */}
      <header className="flex items-center justify-between pt-2">
        <button
          onClick={() => router.back()}
          className="w-10 h-10 rounded-full bg-white/60 text-[#1b2b25] flex items-center justify-center font-black text-lg shadow-sm backdrop-blur-md active:scale-90 transition border border-white"
        >
          ←
        </button>

        {/* Badge Creativo con CustomIcon "tenda-grossa" */}
        <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/60 backdrop-blur-md border border-white shadow-sm">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
          </span>
          <span
            className="text-lg font-bold text-[#1b2b25] tracking-wide"
            style={{ fontFamily: "var(--font-caveat)" }}
          >
            Diario di Campo
          </span>
          <CustomIcon name="tenda-grossa" size={18} />
        </div>

        <button
          onClick={() => setEditing(!editing)}
          className="w-10 h-10 rounded-full bg-white/60 text-[#1b2b25] flex items-center justify-center text-sm shadow-sm backdrop-blur-md active:scale-95 transition border border-white"
        >
          {editing ? "❌" : "✏️"}
        </button>
      </header>

      {/* 🪪 1. CARD PROFILO */}
      <section className="relative rounded-[2.5rem] bg-white/70 backdrop-blur-2xl p-6 shadow-[0_8px_30px_rgba(0,0,0,0.06)] border border-white text-center">
        
        {/* Foto Profilo + Icona Sovrapposta Senza Riquadro (Più grande) */}
        <div className="relative mx-auto w-24 h-24 mb-4">
          {profile?.avatar_url ? (
            <img
              src={profile.avatar_url}
              alt={profile.nome || "Avatar"}
              className="w-full h-full rounded-[2rem] object-cover border-4 border-white shadow-md"
            />
          ) : (
            <div className="w-full h-full rounded-[2rem] bg-[#ebdec8] flex items-center justify-center border-4 border-white shadow-md">
              <CustomIcon name={padreFondatore ? "cavallo" : "coniglio"} size={50} />
            </div>
          )}

          {/* Icona libera senza box bianco e più grande */}
          <div className="absolute -bottom-2 -right-2 drop-shadow-md transform hover:scale-110 transition-transform">
            <CustomIcon name={padreFondatore ? "cavallo" : "coniglio"} size={36} />
          </div>
        </div>

        {/* Info Principali */}
        <h2 className="text-2xl font-black text-[#1b2b25] tracking-tight leading-none">
          {profile?.nome || "Esploratore"}
        </h2>
        <p className="text-xs font-mono text-[#1b2b25]/50 mt-1.5 mb-4">
          {profile?.email}
        </p>

        {/* Badges di Identità */}
        <div className="flex flex-wrap items-center justify-center gap-2">
          <span className="px-3 py-1.5 rounded-xl bg-amber-100 text-amber-900 border border-amber-200/50 text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 shadow-sm">
            <span>🐰</span> {nomeConiglio || "Nessun soprannome"}
          </span>
          <span className={`px-3 py-1.5 rounded-xl border text-[10px] font-black uppercase tracking-wider shadow-sm flex items-center gap-1.5 ${
            padreFondatore ? "bg-emerald-100 text-emerald-900 border-emerald-200" : "bg-white text-zinc-500 border-zinc-200"
          }`}>
            <CustomIcon name={padreFondatore ? "cavallo" : "coniglio"} size={14} />
            {padreFondatore ? "Padre Fondatore" : "Non Marchiato"}
          </span>
        </div>

        {/* FORM MODIFICA FLUIDO */}
        {editing && (
          <div className="mt-6 pt-5 border-t border-[#1b2b25]/10 space-y-4 animate-in fade-in slide-in-from-top-2 text-left">
            <div>
              <label className="text-[10px] uppercase tracking-widest font-black text-[#1b2b25]/70 block mb-1.5">
                Nome da Coniglio
              </label>
              <input
                value={nomeConiglio}
                onChange={(e) => setNomeConiglio(e.target.value)}
                placeholder="Inserisci soprannome..."
                className="w-full rounded-2xl px-4 py-3 bg-white/80 text-[#1b2b25] font-bold text-sm shadow-inner border border-white focus:outline-none focus:ring-2 focus:ring-amber-400"
              />
            </div>

            <div className="flex items-center justify-between bg-white/50 p-3 rounded-2xl border border-white">
              <span className="text-xs font-black text-[#1b2b25]">
                Padre Fondatore?
              </span>
              <div className="flex gap-1">
                <button
                  type="button"
                  onClick={() => setPadreFondatore(true)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all flex items-center gap-1 ${
                    padreFondatore ? "bg-[#1b2b25] text-white shadow-md" : "bg-transparent text-[#1b2b25]/50 hover:bg-white"
                  }`}
                >
                  <CustomIcon name="cavallo" size={14} /> SI
                </button>
                <button
                  type="button"
                  onClick={() => setPadreFondatore(false)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all flex items-center gap-1 ${
                    !padreFondatore ? "bg-red-500 text-white shadow-md" : "bg-transparent text-[#1b2b25]/50 hover:bg-white"
                  }`}
                >
                  <CustomIcon name="coniglio" size={14} /> NO
                </button>
              </div>
            </div>

            <button
              type="button"
              onClick={saveProfile}
              disabled={saving}
              className="w-full rounded-2xl py-3.5 bg-gradient-to-r from-amber-400 to-amber-500 text-amber-950 font-black text-xs uppercase tracking-wider active:scale-95 transition shadow-md border border-amber-300"
            >
              {saving ? "Salvataggio..." : "Salva Profilo"}
            </button>
          </div>
        )}
      </section>

      {/* ⛺ 2. HUB RISORSE (Bento Grid Pulita) */}
      <section className="rounded-[2.5rem] bg-white/40 backdrop-blur-xl p-5 shadow-sm border border-white space-y-5">
        
        {/* Onorificenze */}
        <div>
          <div className="flex justify-between items-center mb-3 px-1">
            <h2 className="text-[10px] font-black uppercase tracking-widest text-[#1b2b25]/60 flex items-center gap-1.5">
              <span>🏅</span> Onorificenze ({myBadges.length})
            </h2>
            <button
              onClick={() => router.push("/profile/badges")}
              className="text-[10px] font-bold uppercase text-[#1b2b25] hover:opacity-70"
            >
              Vedi →
            </button>
          </div>

          {myBadges.length > 0 ? (
            <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide -mx-2 px-3">
              {myBadges.map((item: any, index: number) => (
                <div key={item.badge?.id || index} className="shrink-0 group">
                  {item.badge?.immagine_url ? (
                    <img
                      src={item.badge.immagine_url}
                      alt={item.badge?.titolo || "Badge"}
                      className="w-14 h-14 rounded-[1rem] object-cover border-2 border-white shadow-sm group-hover:scale-110 transition-transform"
                    />
                  ) : (
                    <div className="w-14 h-14 rounded-[1rem] bg-white border-2 border-white/50 flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
                      <CustomIcon name="medaglia" size={28} />
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white/50 p-4 rounded-2xl text-center border border-white border-dashed">
              <p className="text-xs font-semibold text-[#1b2b25]/50">
                Nessuna medaglia conquistata 🌲
              </p>
            </div>
          )}
        </div>

        {/* Griglia Bento */}
        <div className="grid grid-cols-2 gap-3 pt-2 border-t border-white/60">
          
          {/* 1. Le tue tende */}
          <button
            onClick={() => router.push("/profile/tents")}
            className="col-span-2 group h-24 bg-gradient-to-br from-[#ebdec8] to-[#e0cca9] rounded-[1.5rem] p-4 flex items-center justify-between border border-white shadow-sm active:scale-[0.98] transition-all overflow-hidden relative"
          >
            <div className="absolute -right-2 -bottom-4 opacity-30 group-hover:scale-110 transition-transform">
              <CustomIcon name="tenda-grossa" size={100} />
            </div>
            <div className="text-left z-10">
              <h3 className="text-sm font-black uppercase text-[#1b2b25] leading-tight">
                Le tue tende
              </h3>
              <p className="text-[10px] font-semibold text-[#1b2b25]/60 mt-0.5">
                Alloggi & posti letto
              </p>
            </div>
            <div className="w-10 h-10 rounded-full bg-white/50 flex items-center justify-center z-10 backdrop-blur-sm group-hover:bg-white transition-colors">
              <span className="text-[#1b2b25] font-black">→</span>
            </div>
          </button>

          {/* 2. I Miei Mezzi */}
          <button
            onClick={() => router.push("/profile/cars")}
            className="group h-28 bg-white/70 rounded-[1.5rem] p-4 flex flex-col justify-end border border-white shadow-sm active:scale-[0.95] transition-all text-left relative overflow-hidden"
          >
            <div className="absolute -right-2 -bottom-3 opacity-30 group-hover:scale-110 transition-transform">
              <CustomIcon name="macchina" size={85} />
            </div>
            <div className="z-10">
              <h3 className="text-xs font-black uppercase text-[#1b2b25] leading-tight">
                I Miei Mezzi
              </h3>
              <p className="text-[9px] font-semibold text-[#1b2b25]/50 mt-0.5">
                Posti auto disponibili
              </p>
            </div>
          </button>

          {/* 3. Equipaggiamenti */}
          <button
            onClick={() => router.push("/profile/equipment")}
            className="group h-28 bg-[#1b2b25] text-[#ebdec8] rounded-[1.5rem] p-4 flex flex-col justify-end border border-[#1b2b25]/20 shadow-sm active:scale-[0.95] transition-all text-left relative overflow-hidden"
          >
            <div className="absolute -right-2 -bottom-3 opacity-55 group-hover:scale-110 transition-transform">
              <CustomIcon name="zaino" size={85} />
            </div>
            <div className="z-10">
              <h3 className="text-xs font-black uppercase leading-tight">
                Equipaggiamenti
              </h3>
              <p className="text-[9px] font-semibold text-[#ebdec8]/70 mt-0.5">
                Kit & accessori
              </p>
            </div>
          </button>

        </div>
      </section>

      {/* 🚪 3. ACCOUNT & LOGOUT */}
      <section className="bg-red-500/10 backdrop-blur-md border border-red-500/20 rounded-[2rem] p-4 flex items-center justify-between shadow-sm">
        <div className="text-left">
          <p className="text-xs font-bold text-red-950">Account & Sessione</p>
          <p className="text-[10px] text-red-900/60">Disconnetti il tuo profilo</p>
        </div>
        
        <div className="shrink-0">
          <LogoutButton />
        </div>
      </section>

    </main>
  );
}