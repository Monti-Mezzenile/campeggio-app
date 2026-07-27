"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import BackButton from "@/components/ui/BackButton";

interface Badge {
  id: string;
  titolo: string;
  descrizione?: string;
  tipo?: string;
  immagine_url?: string;
  created_at?: string;
}

interface UserBadge {
  id: string;
  badge: Badge;
}

export default function BadgesPage() {
  const [badges, setBadges] = useState<Badge[]>([]);
  const [myBadges, setMyBadges] = useState<UserBadge[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [user, setUser] = useState<any>(null);

  // Tab State: "gilet" | "catalogo"
  const [activeTab, setActiveTab] = useState<"gilet" | "catalogo">("gilet");

  // Modal & Admin Form
  const [selectedBadge, setSelectedBadge] = useState<Badge | null>(null);
  const [adding, setAdding] = useState(false);

  // Form Nuova Medaglia (Admin)
  const [titolo, setTitolo] = useState("");
  const [descrizione, setDescrizione] = useState("");
  const [tipo, setTipo] = useState("speciale");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState("");
  const [uploading, setUploading] = useState(false);

  async function loadData() {
    setLoading(true);
    try {
      const {
        data: { user: currentUser },
      } = await supabase.auth.getUser();

      if (!currentUser) {
        setLoading(false);
        return;
      }

      setUser(currentUser);

      const { data: profile } = await supabase
        .from("profiles")
        .select("ruolo")
        .eq("id", currentUser.id)
        .single();

      setIsAdmin(profile?.ruolo === "admin");

      const { data: badgeData } = await supabase
        .from("badges")
        .select("*")
        .order("created_at", { ascending: false });

      setBadges(badgeData || []);

      const { data: userBadgeData } = await supabase
        .from("user_badges")
        .select(`
          id,
          badge:badge_id(*)
        `)
        .eq("user_id", currentUser.id);

      setMyBadges((userBadgeData as any) || []);
    } catch (err) {
      console.error("Errore caricamento medagliere:", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = e.target.files?.[0];
    if (!selected) return;

    setFile(selected);
    setPreview(URL.createObjectURL(selected));
  }

  const isOwned = (badgeId: string) => {
    return myBadges.some((mb) => mb.badge?.id === badgeId);
  };

  const getUserBadgeRelationId = (badgeId: string) => {
    return myBadges.find((mb) => mb.badge?.id === badgeId)?.id;
  };

  async function addMyBadge(badgeId: string) {
    if (!user) return;

    try {
      const { error } = await supabase.from("user_badges").insert({
        user_id: user.id,
        badge_id: badgeId,
      });

      if (error) {
        alert(error.message);
        return;
      }

      setSelectedBadge(null);
      loadData();
    } catch (err: any) {
      alert("Errore aggiunta: " + err.message);
    }
  }

  async function removeMyBadge(userBadgeId: string) {
    const ok = confirm("Staccare questa medaglia dal gilet?");
    if (!ok) return;

    try {
      const { error } = await supabase
        .from("user_badges")
        .delete()
        .eq("id", userBadgeId);

      if (error) {
        alert(error.message);
        return;
      }

      if (selectedBadge && getUserBadgeRelationId(selectedBadge.id) === userBadgeId) {
        setSelectedBadge(null);
      }

      loadData();
    } catch (err: any) {
      alert("Errore rimozione: " + err.message);
    }
  }

  async function deleteBadge(badgeId: string, immagine_url?: string) {
    if (!isAdmin) return;

    const ok = confirm("Eliminare definitivamente questa medaglia dal catalogo?");
    if (!ok) return;

    try {
      await supabase.from("user_badges").delete().eq("badge_id", badgeId);
      await supabase.from("badges").delete().eq("id", badgeId);

      if (immagine_url) {
        const fileName = immagine_url.split("/badges/")[1];
        if (fileName) {
          await supabase.storage.from("badges").remove([fileName]);
        }
      }

      setSelectedBadge(null);
      loadData();
    } catch (err: any) {
      alert("Errore eliminazione: " + err.message);
    }
  }

  async function createBadge() {
    if (!titolo.trim()) {
      alert("Inserisci un titolo per la medaglia!");
      return;
    }

    setUploading(true);

    try {
      let immagine_url = "";

      if (file) {
        const fileExt = file.name.split(".").pop();
        const fileName = `${Date.now()}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from("badges")
          .upload(fileName, file);

        if (uploadError) {
          alert(uploadError.message);
          setUploading(false);
          return;
        }

        const { data: urlData } = supabase.storage
          .from("badges")
          .getPublicUrl(fileName);

        immagine_url = urlData.publicUrl;
      }

      await supabase.from("badges").insert({
        titolo: titolo.trim(),
        descrizione: descrizione.trim(),
        tipo,
        immagine_url,
      });

      setTitolo("");
      setDescrizione("");
      setTipo("speciale");
      setFile(null);
      setPreview("");
      setAdding(false);

      loadData();
    } catch (err: any) {
      alert("Errore creazione: " + err.message);
    } finally {
      setUploading(false);
    }
  }

  const totalBadgesCount = badges.length;
  const ownedBadgesCount = myBadges.length;
  const percentage = totalBadgesCount > 0 ? Math.round((ownedBadgesCount / totalBadgesCount) * 100) : 0;

  // Frasi "cattive" & dinamiche in base alle medaglie
  const getMotivationalQuote = (count: number) => {
    if (count === 0) return "Praticamente un fantasma. Vuoi iniziare a combinare qualcosa o sei qui solo per fare presenza?";
    if (count <= 2) return "Un timido inizio. Ma per ora il tuo gilet fa più tristezza che rispetto.";
    if (count <= 5) return "Ok, ti stai svegliando. Ma siamo ancora ben lontani dal poterti definire una leggenda.";
    if (count <= 9) return "Niente male, la gente comincia a notarti. Non adagiarti sugli allori adesso!";
    if (count <= 14) return "Rispetto. Stai riempiendo questo gilet come un vero veterano. Chi ti ferma più?";
    return "Livello dio. Praticamente hai più metallo addosso tu che un carrello della spesa. Tutti muti!";
  };

  if (loading) {
    return (
      <main className="min-h-screen p-6 max-w-xl mx-auto flex flex-col justify-center items-center">
        <div className="w-8 h-8 border-3 border-[#639885]/30 border-t-[#639885] rounded-full animate-spin mb-2" />
        <p className="text-[11px] font-black text-zinc-800 uppercase tracking-widest">
          Preparazione Gilet...
        </p>
      </main>
    );
  }

  return (
    <main className="min-h-screen p-3 sm:p-5 pb-28 max-w-lg mx-auto">
      {/* Back Button */}
      <div className="mb-3">
        <BackButton label="Profilo" />
      </div>

      {/* HEADER COMPATTO CON PULSANTE ADMIN DISCRETO */}
      <div className="flex items-center justify-between gap-2 mb-3 bg-white/80 backdrop-blur-md p-3.5 rounded-2xl border border-zinc-200 shadow-sm">
        <div>
          <h1 className="text-xl font-black text-zinc-900 tracking-tight leading-none">
            Medagliere
          </h1>
          <p className="text-[11px] font-bold text-zinc-500 mt-0.5">
            I tuoi trofei e spille sul gilet
          </p>
        </div>

        {isAdmin && (
          <button
            onClick={() => setAdding(!adding)}
            className="w-8 h-8 rounded-xl bg-[#639885] hover:bg-[#528271] text-white font-black text-xs flex items-center justify-center shadow transition-all shrink-0"
            title="Gestisci Medaglie"
          >
            {adding ? "✕" : "⚡"}
          </button>
        )}
      </div>

      {/* BOX PROGRESIONE CON FRASE PROVOCATORIA */}
      <div className="bg-white/80 backdrop-blur-md border border-zinc-200 rounded-2xl p-3.5 mb-4 shadow-sm">
        <div className="flex justify-between items-center mb-1.5">
          <span className="text-[10px] font-black text-zinc-900 uppercase tracking-wider">
            Stato Collezione
          </span>
          <span className="text-[10px] font-black text-[#528271] bg-[#639885]/15 px-2 py-0.5 rounded-md">
            {ownedBadgesCount} / {totalBadgesCount} ({percentage}%)
          </span>
        </div>

        {/* Progress Bar Mini */}
        <div className="w-full bg-zinc-100 h-2 rounded-full overflow-hidden border border-zinc-200 mb-2">
          <div
            className="bg-[#639885] h-full transition-all duration-500"
            style={{ width: `${percentage}%` }}
          />
        </div>

        {/* Frase cattiva/ironica */}
        <p className="text-[11px] font-bold text-zinc-600 italic leading-snug">
          "{getMotivationalQuote(ownedBadgesCount)}"
        </p>
      </div>

      {/* FORM CREAZIONE ADMIN COMPATTO */}
      {adding && isAdmin && (
        <section className="bg-white border border-zinc-200 rounded-2xl p-4 mb-4 shadow-lg text-xs space-y-3">
          <h2 className="font-black text-zinc-900 uppercase border-b pb-1">
            Crea Medaglia
          </h2>
          <input
            placeholder="Titolo"
            value={titolo}
            onChange={(e) => setTitolo(e.target.value)}
            className="w-full bg-zinc-50 border border-zinc-200 rounded-lg p-2 font-bold outline-none"
          />
          <textarea
            placeholder="Descrizione"
            value={descrizione}
            onChange={(e) => setDescrizione(e.target.value)}
            rows={2}
            className="w-full bg-zinc-50 border border-zinc-200 rounded-lg p-2 font-medium outline-none resize-none"
          />
          <div className="flex gap-2">
            <select
              value={tipo}
              onChange={(e) => setTipo(e.target.value)}
              className="bg-zinc-50 border border-zinc-200 rounded-lg p-2 font-bold"
            >
              <option value="speciale">⭐ Speciale</option>
              <option value="evento">🏕️ Evento</option>
            </select>
            <input
              type="file"
              accept="image/*"
              onChange={handleFile}
              className="text-[10px] text-zinc-700 file:py-1 file:px-2 file:rounded-lg file:border-0 file:bg-[#639885] file:text-white"
            />
          </div>
          <button
            onClick={createBadge}
            disabled={uploading}
            className="w-full py-2 rounded-xl bg-[#639885] text-white font-black uppercase shadow"
          >
            {uploading ? "Salvataggio..." : "Pubblica"}
          </button>
        </section>
      )}

      {/* TABS SWITCH: GILET / CATALOGO */}
      <div className="grid grid-cols-2 gap-1.5 p-1 bg-zinc-200/60 rounded-2xl mb-4 font-black text-xs backdrop-blur-md">
        <button
          onClick={() => setActiveTab("gilet")}
          className={`py-2 px-3 rounded-xl transition-all flex items-center justify-center gap-2 ${
            activeTab === "gilet"
              ? "bg-[#639885] text-white shadow-md"
              : "text-zinc-600 hover:text-zinc-900"
          }`}
        >
          <img src="/icons/gilet.png" alt="Gilet" className="w-4 h-4 object-contain" />
          <span>Gilet ({ownedBadgesCount})</span>
        </button>

        <button
          onClick={() => setActiveTab("catalogo")}
          className={`py-2 px-3 rounded-xl transition-all flex items-center justify-center gap-2 ${
            activeTab === "catalogo"
              ? "bg-[#639885] text-white shadow-md"
              : "text-zinc-600 hover:text-zinc-900"
          }`}
        >
          <img src="/icons/libro.png" alt="Catalogo" className="w-4 h-4 object-contain" />
          <span>Catalogo ({totalBadgesCount})</span>
        </button>
      </div>

      {/* TAB 1: IL GILET VERDE TRASPARENTE */}
      {activeTab === "gilet" && (
        <div className="relative bg-[#639885]/85 backdrop-blur-md border-2 border-[#528271]/60 rounded-3xl p-5 sm:p-6 shadow-xl min-h-[360px] overflow-hidden text-white">
          <div className="absolute inset-2 border-2 border-dashed border-white/20 rounded-2xl pointer-events-none" />

          <div className="relative z-10">
            <div className="flex justify-between items-center mb-5 border-b border-white/20 pb-2">
              <span className="text-[11px] font-black text-emerald-100 uppercase tracking-widest flex items-center gap-2">
                <img src="/icons/gilet.png" alt="Gilet" className="w-4 h-4 object-contain" />
                Spille & Patch
              </span>
              <span className="text-[10px] font-extrabold text-white bg-black/20 px-2.5 py-0.5 rounded-full border border-white/20">
                {ownedBadgesCount} / {totalBadgesCount}
              </span>
            </div>

            {myBadges.length === 0 ? (
              <div className="py-16 text-center text-emerald-50">
                <img src="/icons/gilet.png" alt="Gilet" className="w-10 h-10 mx-auto mb-2 opacity-60 object-contain" />
                <p className="text-xs font-black uppercase tracking-wider">
                  Nessuna medaglia applicata
                </p>
                <p className="text-[11px] font-semibold text-emerald-100/80 max-w-xs mx-auto mt-1">
                  Passa al "Catalogo" per scegliere e cucire i tuoi trofei!
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-4 sm:grid-cols-5 gap-4">
                {myBadges.map((item) => {
                  const badge = item.badge;
                  if (!badge) return null;

                  return (
                    <div
                      key={item.id}
                      onClick={() => setSelectedBadge(badge)}
                      className="group relative flex flex-col items-center justify-center cursor-pointer active:scale-90 transition-transform"
                      title={badge.titolo}
                    >
                      <div className="relative w-16 h-16 sm:w-18 sm:h-18 rounded-2xl overflow-hidden bg-white/20 p-1 border-2 border-amber-300 shadow-md group-hover:border-white transition-all flex items-center justify-center backdrop-blur-sm">
                        {badge.immagine_url ? (
                          <img
                            src={badge.immagine_url}
                            alt={badge.titolo}
                            className="w-full h-full object-cover rounded-xl"
                          />
                        ) : (
                          <span className="text-3xl">🏅</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: CATALOGO PICCOLO A SCORRIMENTO */}
      {activeTab === "catalogo" && (
        <div className="bg-white/90 backdrop-blur-md border border-zinc-200 rounded-3xl p-4 shadow-sm">
          <div className="flex items-center gap-1.5 mb-3">
            <img src="/icons/libro.png" alt="Libro" className="w-4 h-4 object-contain" />
            <p className="text-[11px] font-extrabold text-zinc-600 uppercase tracking-wider">
              Scorri e seleziona per cucire sul gilet:
            </p>
          </div>

          {badges.length === 0 ? (
            <div className="py-8 text-center text-xs font-bold text-zinc-400">
              Nessuna medaglia disponibile.
            </div>
          ) : (
            <div className="flex gap-3 overflow-x-auto pb-3 scrollbar-thin scrollbar-thumb-zinc-300">
              {badges.map((badge) => {
                const owned = isOwned(badge.id);

                return (
                  <div
                    key={badge.id}
                    onClick={() => setSelectedBadge(badge)}
                    className={`shrink-0 w-28 rounded-2xl p-2.5 text-center flex flex-col items-center justify-between border-2 transition-all cursor-pointer active:scale-95 ${
                      owned
                        ? "bg-[#639885]/15 border-[#639885] shadow-sm"
                        : "bg-zinc-50 border-zinc-200 hover:border-zinc-400"
                    }`}
                  >
                    <div className="w-12 h-12 rounded-xl overflow-hidden bg-white p-1 border border-zinc-200 flex items-center justify-center mb-1.5">
                      {badge.immagine_url ? (
                        <img
                          src={badge.immagine_url}
                          alt={badge.titolo}
                          className={`w-full h-full object-cover rounded-lg ${
                            !owned ? "opacity-50 grayscale" : ""
                          }`}
                        />
                      ) : (
                        <span className="text-xl">🏅</span>
                      )}
                    </div>

                    <p className="text-[10px] font-black text-zinc-900 line-clamp-2 leading-tight mb-1">
                      {badge.titolo}
                    </p>

                    <span
                      className={`text-[9px] font-black px-2 py-0.5 rounded-full ${
                        owned
                          ? "bg-[#639885] text-white"
                          : "bg-zinc-200 text-zinc-700"
                      }`}
                    >
                      {owned ? "✓ Cucita" : "+ Seleziona"}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* POP-UP DETTAGLIO MEDAGLIA */}
      {selectedBadge && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-white border border-zinc-200 rounded-3xl p-5 w-full max-w-xs text-center shadow-2xl relative text-zinc-900">
            <span className="inline-block px-2.5 py-0.5 rounded-full bg-[#639885]/15 text-[#528271] text-[10px] font-black uppercase tracking-wider mb-2">
              {selectedBadge.tipo === "evento" ? "🏕️ Evento" : "⭐ Speciale"}
            </span>

            <div className="w-20 h-20 mx-auto mb-2 rounded-2xl overflow-hidden bg-[#639885] p-1 border-2 border-amber-300 shadow-md flex items-center justify-center">
              {selectedBadge.immagine_url ? (
                <img
                  src={selectedBadge.immagine_url}
                  alt={selectedBadge.titolo}
                  className="w-full h-full object-cover rounded-xl"
                />
              ) : (
                <span className="text-4xl">🏅</span>
              )}
            </div>

            <h3 className="text-lg font-black text-zinc-900 leading-tight">
              {selectedBadge.titolo}
            </h3>

            {selectedBadge.descrizione ? (
              <p className="text-xs font-semibold text-zinc-600 mt-1.5 bg-zinc-100 p-2.5 rounded-xl border border-zinc-200">
                "{selectedBadge.descrizione}"
              </p>
            ) : (
              <p className="text-[11px] text-zinc-400 mt-1 italic">
                Nessuna descrizione specificata.
              </p>
            )}

            <div className="mt-4 space-y-2">
              {isOwned(selectedBadge.id) ? (
                <button
                  onClick={() => {
                    const userBadgeRelId = getUserBadgeRelationId(selectedBadge.id);
                    if (userBadgeRelId) removeMyBadge(userBadgeRelId);
                  }}
                  className="w-full py-2.5 px-3 rounded-xl bg-rose-100 hover:bg-rose-200 text-rose-900 font-black text-xs border border-rose-300 transition-all"
                >
                  ✕ Stacca Dal Gilet
                </button>
              ) : (
                <button
                  onClick={() => addMyBadge(selectedBadge.id)}
                  className="w-full py-3 px-3 rounded-xl bg-[#639885] hover:bg-[#528271] text-white font-black text-xs uppercase tracking-wider shadow-md active:scale-95 transition-all flex items-center justify-center gap-1.5"
                >
                  <span>🪡</span>
                  <span>Cuci Sul Gilet</span>
                </button>
              )}

              {isAdmin && (
                <button
                  onClick={() => deleteBadge(selectedBadge.id, selectedBadge.immagine_url)}
                  className="w-full py-1 text-rose-700 hover:underline font-bold text-[11px]"
                >
                  Elimina dal catalogo
                </button>
              )}

              <button
                onClick={() => setSelectedBadge(null)}
                className="w-full py-2 px-3 rounded-xl bg-zinc-100 hover:bg-zinc-200 text-zinc-800 font-bold text-xs transition-all"
              >
                Chiudi
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}