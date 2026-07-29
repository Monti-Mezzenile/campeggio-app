"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import LogoutButton from "@/components/ui/LogoutButton";
import { supabase } from "@/lib/supabase";
import CustomIcon from "@/components/ui/CustomIcon";

export default function ProfilePage() {
  const router = useRouter();

  const [profile, setProfile] = useState<any>(null);
  const [myBadges, setMyBadges] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [editing, setEditing] = useState(false);

  // Campi del Profilo
  const [nome, setNome] = useState("");
  const [titoloCampo, setTitoloCampo] = useState("");
  const [motto, setMotto] = useState("");
  const [nomeConiglio, setNomeConiglio] = useState("");
  const [padreFondatore, setPadreFondatore] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

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
    setNome(data?.nome || "");
    setTitoloCampo(data?.titolo_campo || "Mastro Fuochista");
    setMotto(data?.motto || "Sempre pronto alla grigliata.");
    setNomeConiglio(data?.nome_coniglio || "");
    setPadreFondatore(data?.padre_fondatore || false);
    setAvatarUrl(data?.avatar_url || null);

    // Usa l'asterisco per portare dentro tutte le colonne (tipo, categoria, ecc.) senza errori
    const { data: badges } = await supabase
      .from("user_badges")
      .select(`
        badge:badge_id(
          *
        )
      `)
      .eq("user_id", user.id);

    setMyBadges(badges || []);
    setLoading(false);
  }

  // 📷 CARICAMENTO NUOVA FOTO SU SUPABASE STORAGE
  async function handleAvatarUpload(event: React.ChangeEvent<HTMLInputElement>) {
    try {
      setUploading(true);
      if (!event.target.files || event.target.files.length === 0) return;

      const file = event.target.files[0];
      const fileExt = file.name.split(".").pop();
      const filePath = `avatars/${Math.random()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const {
        data: { publicUrl },
      } = supabase.storage.from("avatars").getPublicUrl(filePath);

      setAvatarUrl(publicUrl);
    } catch (error: any) {
      alert("Errore nel caricamento dell'immagine: " + error.message);
    } finally {
      setUploading(false);
    }
  }

  // 💾 SALVATAGGIO COMPLETO PROFILO
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
        nome: nome,
        titolo_campo: titoloCampo,
        motto: motto,
        nome_coniglio: nomeConiglio,
        padre_fondatore: padreFondatore,
        avatar_url: avatarUrl,
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
      <main className="min-h-dvh p-6 max-w-md mx-auto flex flex-col items-center justify-center bg-transparent">
        <div className="w-16 h-16 rounded-full bg-white/50 backdrop-blur-md flex items-center justify-center shadow-lg animate-pulse mb-3 border border-white">
          <CustomIcon name="coniglio" size={32} />
        </div>
        <p className="font-mono text-xs font-bold uppercase tracking-widest text-[#1b2b25]">
          Ispezione Tesserino...
        </p>
      </main>
    );
  }

  // --- CALCOLO LIVELLO (SOLO ESTIVE E INVERNALI) ---
  const validLevelBadges = myBadges.filter((item: any) => {
    const badge = item.badge;
    if (!badge) return false;

    // Controlliamo in automatico titolo, tipo, categoria o stagione
    const testStr = String(badge.tipo || badge.categoria || badge.stagione || badge.titolo || "").toLowerCase();
    
    const isSpecial = testStr.includes("special");
    const isMainEvent = testStr.includes("estiv") || testStr.includes("invernal");

    // Valida se è estiva o invernale, ma SCARTA le speciali
    return isMainEvent && !isSpecial;
  });

  const levelNumber = Math.max(1, validLevelBadges.length);
  const matricola = profile?.id ? `#MNT-${profile.id.slice(0, 4).toUpperCase()}` : "#MNT-0000";

  return (
    <main className="min-h-dvh p-4 sm:p-6 pb-36 max-w-md mx-auto flex flex-col gap-6 select-none bg-transparent">
      {/* 🚀 HEADER CON BADGE STATO E ICONA CUSTOM */}
      <header className="flex items-center justify-between pt-2">
        <button
          onClick={() => router.back()}
          className="w-10 h-10 rounded-full bg-white/60 text-[#1b2b25] flex items-center justify-center font-black text-lg shadow-sm backdrop-blur-md active:scale-90 transition border border-white"
        >
          ←
        </button>

        {/* Badge Creativo */}
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

      {/* 🪪 1. CARD PROFILO (TESSERINO DA CAMPO) */}
      <section className="relative rounded-[2.5rem] bg-gradient-to-b from-white/90 to-white/60 backdrop-blur-2xl p-6 shadow-[0_8px_30px_rgba(0,0,0,0.08)] border border-white text-center overflow-hidden">
        
        {/* Matricola identificativa in alto a destra */}
        <div className="absolute top-4 right-4 bg-[#1b2b25]/10 px-2.5 py-1 rounded-full text-[9px] font-mono font-bold text-[#1b2b25]/60 tracking-wider uppercase border border-black/5">
          {matricola}
        </div>

        {/* Foto Profilo con Gestione Immagine Custom */}
        <div className="relative mx-auto w-24 h-24 mb-3 mt-1">
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt={nome || "Avatar"}
              className="w-full h-full rounded-[2rem] object-cover border-4 border-white shadow-md ring-1 ring-black/5"
            />
          ) : (
            <div className="w-full h-full rounded-[2rem] bg-[#ebdec8] flex items-center justify-center border-4 border-white shadow-md">
              <CustomIcon name={padreFondatore ? "cavallo" : "coniglio"} size={50} />
            </div>
          )}

          {/* Icona status nell'angolo */}
          <div className="absolute -bottom-2 -right-2 drop-shadow-md transform hover:scale-110 transition-transform">
            <CustomIcon name={padreFondatore ? "cavallo" : "coniglio"} size={36} />
          </div>
        </div>

        {/* NOME COMPLETO */}
        <h2 className="text-2xl font-black text-[#1b2b25] tracking-tight leading-tight">
          {profile?.nome || "Esploratore Ignoto"}
        </h2>

        {/* RUOLO / TITOLO DA CAMPO */}
        <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-[#1b2b25]/10 text-[#1b2b25] font-black text-[10px] uppercase tracking-widest mt-1 mb-2">
          <span>⛺</span> {profile?.titolo_campo || "Mastro Fuochista"}
        </div>

        {/* MOTTO PERSONALE */}
        <p className="text-xs italic font-medium text-[#1b2b25]/75 max-w-xs mx-auto mb-4 bg-white/40 py-1.5 px-3 rounded-xl border border-white/60">
          "{profile?.motto || "Sempre pronto alla grigliata."}"
        </p>

        {/* BADGES DI IDENTITÀ & LIVELLO */}
        <div className="flex flex-wrap items-center justify-center gap-2 pt-1 border-t border-[#1b2b25]/10">
          {/* Livello di Sopravvivenza (Conta solo Estive/Invernali) */}
          <span className="px-3 py-1.5 rounded-xl bg-emerald-100 text-emerald-950 border border-emerald-200 text-[10px] font-black uppercase tracking-wider flex items-center gap-1 shadow-sm">
            <span>🔥</span> Lvl. {levelNumber} Vet.
          </span>

          {/* Soprannome Coniglio */}
          <span className="px-3 py-1.5 rounded-xl bg-amber-100 text-amber-900 border border-amber-200/50 text-[10px] font-black uppercase tracking-wider flex items-center gap-1 shadow-sm">
            <span>🐰</span> {nomeConiglio || "Nessun soprannome"}
          </span>

          {/* Padre Fondatore */}
          <span
            className={`px-3 py-1.5 rounded-xl border text-[10px] font-black uppercase tracking-wider shadow-sm flex items-center gap-1.5 ${
              padreFondatore
                ? "bg-purple-100 text-purple-900 border-purple-200"
                : "bg-white/80 text-zinc-500 border-zinc-200"
            }`}
          >
            <CustomIcon name={padreFondatore ? "cavallo" : "coniglio"} size={14} />
            {padreFondatore ? "Padre Fondatore" : "Non Marchiato"}
          </span>
        </div>

        {/* ✏️ FORM MODIFICA FLUIDO E COMPLETO */}
        {editing && (
          <div className="mt-6 pt-5 border-t border-[#1b2b25]/10 space-y-4 animate-in fade-in slide-in-from-top-2 text-left">
            <h3 className="text-[11px] font-black uppercase tracking-widest text-[#1b2b25]/60 text-center mb-1">
              Modifica Dati Tesserino
            </h3>

            {/* CARICAMENTO FOTO */}
            <div>
              <label className="text-[10px] uppercase tracking-widest font-black text-[#1b2b25]/70 block mb-1">
                Foto Profilo
              </label>
              <label className="flex items-center justify-center gap-2 w-full rounded-2xl px-4 py-3 bg-white/90 text-[#1b2b25] font-bold text-xs shadow-inner border border-white cursor-pointer hover:bg-white transition">
                <span>{uploading ? "Caricamento in corso..." : "📷 Scegli o Scatta Foto"}</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarUpload}
                  disabled={uploading}
                  className="hidden"
                />
              </label>
            </div>

            {/* NOME COMPLETO */}
            <div>
              <label className="text-[10px] uppercase tracking-widest font-black text-[#1b2b25]/70 block mb-1">
                Nome & Cognome
              </label>
              <input
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                placeholder="Es. Mario Rossi"
                className="w-full rounded-2xl px-4 py-2.5 bg-white/90 text-[#1b2b25] font-bold text-xs shadow-inner border border-white focus:outline-none focus:ring-2 focus:ring-amber-400"
              />
            </div>

            {/* RANGO / TITOLO DA CAMPO */}
            <div>
              <label className="text-[10px] uppercase tracking-widest font-black text-[#1b2b25]/70 block mb-1">
                Ruolo / Mansione da Campo
              </label>
              <input
                value={titoloCampo}
                onChange={(e) => setTitoloCampo(e.target.value)}
                placeholder="Es. Mastro Fuochista, Luppolo Sommelier..."
                className="w-full rounded-2xl px-4 py-2.5 bg-white/90 text-[#1b2b25] font-bold text-xs shadow-inner border border-white focus:outline-none focus:ring-2 focus:ring-amber-400"
              />
            </div>

            {/* MOTTO PERSONALE */}
            <div>
              <label className="text-[10px] uppercase tracking-widest font-black text-[#1b2b25]/70 block mb-1">
                Motto / Frase d'Ordinanza
              </label>
              <input
                value={motto}
                onChange={(e) => setMotto(e.target.value)}
                placeholder="Es. Chi dorme non piglia salsicce..."
                className="w-full rounded-2xl px-4 py-2.5 bg-white/90 text-[#1b2b25] font-bold text-xs shadow-inner border border-white focus:outline-none focus:ring-2 focus:ring-amber-400"
              />
            </div>

            {/* NOME CONIGLIO */}
            <div>
              <label className="text-[10px] uppercase tracking-widest font-black text-[#1b2b25]/70 block mb-1">
                Nome da Coniglio
              </label>
              <input
                value={nomeConiglio}
                onChange={(e) => setNomeConiglio(e.target.value)}
                placeholder="Inserisci soprannome..."
                className="w-full rounded-2xl px-4 py-2.5 bg-white/90 text-[#1b2b25] font-bold text-xs shadow-inner border border-white focus:outline-none focus:ring-2 focus:ring-amber-400"
              />
            </div>

            {/* PADRE FONDATORE */}
            <div className="flex items-center justify-between bg-white/60 p-3 rounded-2xl border border-white">
              <span className="text-xs font-black text-[#1b2b25]">
                Padre Fondatore?
              </span>
              <div className="flex gap-1">
                <button
                  type="button"
                  onClick={() => setPadreFondatore(true)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all flex items-center gap-1 ${
                    padreFondatore
                      ? "bg-[#1b2b25] text-white shadow-md"
                      : "bg-transparent text-[#1b2b25]/50 hover:bg-white"
                  }`}
                >
                  <CustomIcon name="cavallo" size={14} /> SI
                </button>
                <button
                  type="button"
                  onClick={() => setPadreFondatore(false)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all flex items-center gap-1 ${
                    !padreFondatore
                      ? "bg-red-500 text-white shadow-md"
                      : "bg-transparent text-[#1b2b25]/50 hover:bg-white"
                  }`}
                >
                  <CustomIcon name="coniglio" size={14} /> NO
                </button>
              </div>
            </div>

            <button
              type="button"
              onClick={saveProfile}
              disabled={saving || uploading}
              className="w-full rounded-2xl py-3.5 bg-gradient-to-r from-amber-400 to-amber-500 text-amber-950 font-black text-xs uppercase tracking-wider active:scale-95 transition shadow-md border border-amber-300"
            >
              {saving ? "Aggiornamento Tesserino..." : "Salva Tesserino"}
            </button>
          </div>
        )}
      </section>

      {/* ⛺ 2. HUB RISORSE (Bento Grid) */}
      <section className="rounded-[2.5rem] bg-white/40 backdrop-blur-xl p-5 shadow-sm border border-white space-y-5">
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