"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import BackButton from "@/components/ui/BackButton";

export default function CuriositaDettaglioPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [curiosita, setCuriosita] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [titolo, setTitolo] = useState("");
  const [contenuto, setContenuto] = useState("");

  async function loadCuriosita() {
    const { data, error } = await supabase
      .from("curiosities")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      console.log(error);
      setLoading(false);
      return;
    }

    setCuriosita(data);
    setTitolo(data.titolo || "");
    setContenuto(data.contenuto || "");
    setLoading(false);
  }

  useEffect(() => {
    if (id) {
      loadCuriosita();
    }
  }, [id]);

  async function deleteCuriosita() {
    const conferma = confirm("Eliminare questa curiosità?");
    if (!conferma) return;

    const { error } = await supabase
      .from("curiosities")
      .delete()
      .eq("id", id);

    if (error) {
      alert(error.message);
      return;
    }

    // Usiamo window.location per invalidare la cache del client
    window.location.href = "/curiosita";
  }

  async function saveCuriosita() {
    const cleanTitle = titolo.trim();
    const cleanContent = contenuto.trim();

    if (!cleanTitle || !cleanContent) {
      alert("Inserisci titolo e contenuto");
      return;
    }

    setSaving(true);
    const { data, error } = await supabase
      .from("curiosities")
      .update({
        titolo: cleanTitle,
        contenuto: cleanContent,
      })
      .eq("id", id)
      .eq("tipo", "community")
      .select("*")
      .single();

    setSaving(false);

    if (error) {
      alert(error.message);
      return;
    }

    setCuriosita(data);
    setEditing(false);
  }

  function toggleEditing() {
    if (editing) {
      setTitolo(curiosita.titolo || "");
      setContenuto(curiosita.contenuto || "");
    }
    setEditing((current) => !current);
  }

  if (loading) {
    return (
      <div className="w-full py-16 p-4 sm:p-6 max-w-2xl mx-auto flex flex-col justify-center items-center">
        <div className="w-10 h-10 border-4 border-amber-600/20 border-t-amber-600 rounded-full animate-spin mb-3" />
        <p className="text-xs font-bold text-zinc-800 tracking-wide">
          Caricamento curiosità...
        </p>
      </div>
    );
  }

  if (!curiosita) {
    return (
      <div className="w-full py-16 p-4 sm:p-6 max-w-2xl mx-auto text-center">
        <div className="mb-4">
          <BackButton label="Curiosità" />
        </div>
        <p className="text-sm font-bold text-zinc-700">
          Curiosità non trovata o rimossa.
        </p>
      </div>
    );
  }

  return (
    <div className="w-full p-4 sm:p-6 max-w-2xl mx-auto text-zinc-900">
      {/* Back Button */}
      <div className="mb-4">
        <BackButton label="Curiosità" />
      </div>

      {/* Immagine di copertina */}
      {curiosita.immagine_url && (
        <div className="w-full h-64 sm:h-80 rounded-3xl overflow-hidden mb-6 border border-zinc-200/80 shadow-sm bg-zinc-100">
          <img
            src={curiosita.immagine_url}
            alt={curiosita.titolo}
            className="w-full h-full object-cover"
          />
        </div>
      )}

      {/* Titolo e modifica collaborativa */}
      <div className="mb-4 flex items-start justify-between gap-3">
        {editing ? (
          <input
            type="text"
            value={titolo}
            onChange={(event) => setTitolo(event.target.value)}
            className="min-w-0 flex-1 rounded-2xl border border-white/90 bg-white/80 px-4 py-3 text-xl font-black text-zinc-950 shadow-sm outline-none focus:ring-2 focus:ring-amber-500/30"
          />
        ) : (
          <h1 className="min-w-0 flex-1 text-2xl sm:text-3xl font-black text-zinc-950 tracking-tight leading-snug">
            {curiosita.titolo}
          </h1>
        )}

        {curiosita.tipo === "community" && (
          <button
            type="button"
            onClick={toggleEditing}
            className="shrink-0 whitespace-nowrap rounded-xl border border-amber-500/30 bg-amber-500/15 px-3 py-2 text-[10px] font-black uppercase tracking-wider text-amber-950 active:scale-95"
          >
            {editing ? "Annulla" : "Modifica"}
          </button>
        )}
      </div>

      {/* Sezione Audio */}
      {curiosita.audio_url && (
        <section className="bg-purple-500/10 border border-purple-500/20 rounded-3xl p-4 sm:p-5 mb-6 backdrop-blur-md">
          <h2 className="font-extrabold text-xs uppercase tracking-wider text-purple-950 mb-3 flex items-center gap-1.5">
            <span>🎧</span>
            <span>Ascolta l'Audio</span>
          </h2>
          <audio controls className="w-full rounded-xl">
            <source src={curiosita.audio_url} />
          </audio>
        </section>
      )}

      {/* Contenuto Testuale */}
      <section className="bg-white/80 border border-white/90 rounded-3xl p-5 sm:p-6 shadow-sm backdrop-blur-md">
        {editing ? (
          <div className="space-y-3">
            <textarea
              value={contenuto}
              onChange={(event) => setContenuto(event.target.value)}
              rows={12}
              className="w-full resize-y rounded-2xl border border-zinc-200 bg-white/90 p-4 text-sm font-medium leading-relaxed text-zinc-800 outline-none focus:ring-2 focus:ring-amber-500/30"
            />
            <button
              type="button"
              onClick={saveCuriosita}
              disabled={saving}
              className="w-full whitespace-nowrap rounded-2xl bg-amber-500 px-4 py-3 text-xs font-black uppercase tracking-wider text-amber-950 shadow-sm active:scale-[0.98] disabled:opacity-50"
            >
              {saving ? "Salvataggio..." : "Salva modifiche"}
            </button>
          </div>
        ) : (
          <p className="whitespace-pre-line leading-relaxed text-sm sm:text-base font-medium text-zinc-800">
            {curiosita.contenuto}
          </p>
        )}
      </section>

      {/* Tasto Elimina (se inserito dalla community) */}
      {curiosita.tipo === "community" && (
        <button
          onClick={deleteCuriosita}
          className="mt-6 w-full py-4 px-6 rounded-2xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-700 border border-rose-500/20 font-bold text-xs tracking-wide transition-all active:scale-[0.98] flex items-center justify-center gap-2"
        >
          <span>🗑️</span>
          <span>Elimina questa curiosità</span>
        </button>
      )}
    </div>
  );
}
