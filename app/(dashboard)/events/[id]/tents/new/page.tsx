"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import BackButton from "@/components/ui/BackButton";
import CustomIcon from "@/components/ui/CustomIcon";

export default function NewTentPage() {
  const params = useParams();
  const router = useRouter();
  const eventId = params.id as string;

  const [nome, setNome] = useState("");
  const [marca, setMarca] = useState("");
  const [modello, setModello] = useState("");
  const [posti, setPosti] = useState("");
  const [note, setNote] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Gestione anteprima foto
  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      setPreviewUrl(URL.createObjectURL(selectedFile));
    }
  }

  async function createTent() {
    if (!nome.trim()) {
      alert("Inserisci un nome per la tenda");
      return;
    }

    if (!posti || Number(posti) <= 0) {
      alert("Inserisci un numero di posti valido");
      return;
    }

    setLoading(true);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        alert("Devi essere autenticato per creare una tenda");
        setLoading(false);
        return;
      }

      let fotoUrl = "";

      // UPLOAD FOTO SU SUPABASE STORAGE
      if (file) {
        const fileExt = file.name.split(".").pop();
        const fileName = `${user.id}-${Date.now()}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from("tents")
          .upload(fileName, file);

        if (uploadError) {
          console.error("Errore upload foto:", uploadError);
          alert(`Errore upload immagine: ${uploadError.message}`);
          setLoading(false);
          return;
        }

        const { data } = supabase.storage
          .from("tents")
          .getPublicUrl(fileName);

        fotoUrl = data.publicUrl;
      }

      // 1. CREA TENDA NEL PROFILO UTENTE
      const { data: tent, error: tentError } = await supabase
        .from("tents")
        .insert({
          user_id: user.id,
          nome: nome.trim(),
          marca: marca.trim() || null,
          modello: modello.trim() || null,
          posti: Number(posti),
          note: note.trim() || null,
          foto: fotoUrl || null,
        })
        .select()
        .single();

      if (tentError || !tent) {
        console.error("Errore creazione tenda:", tentError);
        alert(tentError?.message || "Errore durante la creazione della tenda");
        setLoading(false);
        return;
      }

      // 2. COLLEGA LA NUOVA TENDA ALL'EVENTO
      const { error: eventTentError } = await supabase
        .from("event_tents")
        .insert({
          event_id: eventId,
          tent_id: tent.id,
        });

      if (eventTentError) {
        console.error("Errore associazione evento:", eventTentError);
        alert(eventTentError.message);
        setLoading(false);
        return;
      }

      // Redirect alla lista tende dell'evento
      router.push(`/events/${eventId}/tents`);
    } catch (err) {
      console.error("Errore inatteso:", err);
      alert("Si è verificato un errore inatteso.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen p-4 sm:p-6 pb-32 max-w-2xl mx-auto text-zinc-100">
      {/* Back Button */}
      <div className="mb-6">
        <BackButton label="Torna a Selezione Tende" />
      </div>

      {/* Header Titolo */}
      <div className="mb-8">
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white flex items-center gap-4">
          <CustomIcon name="tenda-grossa" size={48} />
          <span>Nuova Tenda per Evento</span>
        </h1>
        <p className="text-sm text-zinc-400 mt-2">
          Crea una nuova tenda nel tuo profilo e assegnala subito a questo evento.
        </p>
      </div>

      {/* Form Card Glassmorphic */}
      <div className="bg-zinc-900/70 border border-zinc-800 rounded-3xl p-6 backdrop-blur-xl shadow-xl flex flex-col gap-5">
        {/* Nome Tenda */}
        <div>
          <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-2">
            Nome Tenda *
          </label>
          <input
            type="text"
            placeholder="es. Tenda Bertoni 4 Posti"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            className="w-full bg-zinc-950/60 border border-zinc-800 rounded-2xl px-4 py-3.5 text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-amber-500/50 transition-colors text-sm"
          />
        </div>

        {/* Marca e Modello */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-2">
              Marca
            </label>
            <input
              type="text"
              placeholder="es. Quechua, Ferrino"
              value={marca}
              onChange={(e) => setMarca(e.target.value)}
              className="w-full bg-zinc-950/60 border border-zinc-800 rounded-2xl px-4 py-3.5 text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-amber-500/50 transition-colors text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-2">
              Modello
            </label>
            <input
              type="text"
              placeholder="es. 2 Seconds3 XL"
              value={modello}
              onChange={(e) => setModello(e.target.value)}
              className="w-full bg-zinc-950/60 border border-zinc-800 rounded-2xl px-4 py-3.5 text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-amber-500/50 transition-colors text-sm"
            />
          </div>
        </div>

        {/* Numero Posti */}
        <div>
          <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-2">
            Numero Posti Letto *
          </label>
          <input
            type="number"
            min="1"
            max="20"
            placeholder="es. 4"
            value={posti}
            onChange={(e) => setPosti(e.target.value)}
            className="w-full bg-zinc-950/60 border border-zinc-800 rounded-2xl px-4 py-3.5 text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-amber-500/50 transition-colors text-sm"
          />
        </div>

        {/* Foto Tenda */}
        <div>
          <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-2">
            Foto Tenda (Opzionale)
          </label>
          
          {previewUrl && (
            <div className="mb-3 h-48 rounded-2xl overflow-hidden bg-zinc-950 border border-zinc-800 relative">
              <img
                src={previewUrl}
                alt="Anteprima"
                className="w-full h-full object-cover"
              />
              <button
                type="button"
                onClick={() => {
                  setFile(null);
                  setPreviewUrl(null);
                }}
                className="absolute top-2 right-2 bg-zinc-900/80 text-rose-400 p-2 rounded-xl text-xs font-bold border border-zinc-700/60 hover:bg-zinc-900"
              >
                ✖️ Rimuovi
              </button>
            </div>
          )}

          <input
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="w-full text-xs text-zinc-400 file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-zinc-800 file:text-amber-400 hover:file:bg-zinc-700 file:cursor-pointer cursor-pointer bg-zinc-950/40 border border-zinc-800 rounded-2xl p-2"
          />
        </div>

        {/* Note */}
        <div>
          <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-2">
            Note o Istruzioni
          </label>
          <textarea
            rows={3}
            placeholder="es. Manca un picchetto, abside molto grande..."
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="w-full bg-zinc-950/60 border border-zinc-800 rounded-2xl px-4 py-3.5 text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-amber-500/50 transition-colors text-sm resize-none"
          />
        </div>

        {/* Bottone di Creazione */}
        <button
          onClick={createTent}
          disabled={loading}
          className="mt-2 w-full py-4 px-5 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-zinc-950 font-bold text-sm shadow-lg shadow-amber-500/15 active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <div className="w-4 h-4 border-2 border-zinc-950/20 border-t-zinc-950 rounded-full animate-spin" />
              <span>Creazione e associazione in corso...</span>
            </>
          ) : (
            <>
              <span>➕</span>
              <span>Crea Tenda e Porta all'Evento</span>
            </>
          )}
        </button>
      </div>
    </main>
  );
}