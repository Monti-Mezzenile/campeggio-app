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

      {/* Titolo */}
      <h1 className="text-2xl sm:text-3xl font-black text-zinc-950 tracking-tight mb-4 leading-snug">
        {curiosita.titolo}
      </h1>

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
        <p className="whitespace-pre-line leading-relaxed text-sm sm:text-base font-medium text-zinc-800">
          {curiosita.contenuto}
        </p>
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