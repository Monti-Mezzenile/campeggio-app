"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import BackButton from "@/components/ui/BackButton";

// --- SVG Icons con dimensioni rigide forzate (w-4 h-4 shrink-0) ---
function SparklesIcon({ className = "" }: { className?: string }) {
  return (
    <svg className={`w-3.5 h-3.5 shrink-0 ${className}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456z" />
    </svg>
  );
}

function PhotoIcon({ className = "" }: { className?: string }) {
  return (
    <svg className={`w-3.5 h-3.5 shrink-0 ${className}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
    </svg>
  );
}

function MusicWaveIcon({ className = "" }: { className?: string }) {
  return (
    <svg className={`w-3.5 h-3.5 shrink-0 ${className}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 .895-2 3-2 3 .895 3 2zm12 0c0 1.105-1.343 2-3 2s-3-.895-3-2 .895-2 3-2 3 .895 3 2zM9 10l12-3" />
    </svg>
  );
}

function UploadCloudIcon({ className = "" }: { className?: string }) {
  return (
    <svg className={`w-4 h-4 shrink-0 ${className}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 16.5V9.75m0 0l3 3m-3-3l-3 3M6.75 19.5a4.5 4.5 0 01-1.41-8.775 5.25 5.25 0 0110.233-2.33 3 3 0 013.758 3.848A3.752 3.752 0 0118 19.5H6.75z" />
    </svg>
  );
}

function TrashIcon({ className = "" }: { className?: string }) {
  return (
    <svg className={`w-3.5 h-3.5 shrink-0 ${className}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
    </svg>
  );
}

function PenIcon({ className = "" }: { className?: string }) {
  return (
    <svg className={`w-3.5 h-3.5 shrink-0 ${className}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
    </svg>
  );
}

export default function NuovaCuriositaPage() {
  const router = useRouter();

  const [titolo, setTitolo] = useState("");
  const [contenuto, setContenuto] = useState("");
  const [immagine, setImmagine] = useState<File | null>(null);
  const [audio, setAudio] = useState<File | null>(null);
  const [preview, setPreview] = useState("");
  const [saving, setSaving] = useState(false);

  function handleImage(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setImmagine(file);
    setPreview(URL.createObjectURL(file));
  }

  function handleAudio(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setAudio(file);
  }

  function removeImage() {
    setImmagine(null);
    setPreview("");
  }

  function removeAudio() {
    setAudio(null);
  }

  async function uploadFile(file: File, folder: string) {
    const filename = `${folder}/${Date.now()}-${file.name}`;

    const { error } = await supabase.storage
      .from("curiosities")
      .upload(filename, file);

    if (error) {
      console.log("ERRORE UPLOAD FILE:", error);
      throw new Error("Errore caricamento file: " + error.message);
    }

    const { data } = supabase.storage
      .from("curiosities")
      .getPublicUrl(filename);

    return data.publicUrl;
  }

  async function createCuriosita() {
    if (!titolo.trim() || !contenuto.trim()) {
      alert("Inserisci titolo e contenuto");
      return;
    }

    try {
      setSaving(true);

      let immagine_url = "";
      let audio_url = "";

      if (immagine) {
        immagine_url = await uploadFile(immagine, "immagini");
      }

      if (audio) {
        audio_url = await uploadFile(audio, "audio");
      }

      const { error } = await supabase.from("curiosities").insert({
        titolo,
        contenuto,
        immagine_url,
        audio_url,
        tipo: "community",
        ordine: 0,
      });

      if (error) {
        throw error;
      }

      router.push("/curiosita");
    } catch (error: any) {
      console.log(error);
      alert(error.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="min-h-screen p-3 sm:p-5 pb-24 max-w-3xl mx-auto select-none space-y-3 text-zinc-950">
      
      {/* Tasto Indietro */}
      <div>
        <BackButton label="Indietro" />
      </div>

      {/* HEADER COMPATTO */}
      <header className="relative overflow-hidden bg-white/85 border border-white/90 rounded-2xl p-3.5 sm:p-4 shadow-sm backdrop-blur-xl">
        <div className="relative z-10 flex items-center justify-between gap-3">
          <div className="space-y-0.5">
            <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-500/10 border border-amber-500/20 text-amber-950 text-[9px] font-black uppercase tracking-wider">
              <SparklesIcon className="text-amber-700" />
              <span>Studio Archivio</span>
            </div>

            <h1 className="text-lg sm:text-xl font-black tracking-tight bg-gradient-to-br from-zinc-950 via-zinc-900 to-amber-950 bg-clip-text text-transparent">
              NUOVA CURIOSITÀ
            </h1>
          </div>

          <span className="shrink-0 text-[9px] font-black uppercase tracking-wider bg-zinc-950 text-amber-400 px-2.5 py-1 rounded-xl border border-amber-500/30">
            Bozza
          </span>
        </div>
      </header>

      {/* GRID COMPATTA A DUE COLONNE */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-start">
        
        {/* MEDIA STUDIO (5 COLS) */}
        <section className="md:col-span-5 space-y-3">
          
          {/* COPERTINA */}
          <div className="bg-white/80 border border-white/90 rounded-2xl p-3 shadow-sm backdrop-blur-xl space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <div className="p-1 rounded-lg bg-amber-500/20 text-amber-950">
                  <PhotoIcon className="text-amber-950" />
                </div>
                <h2 className="text-[10px] font-black uppercase tracking-wider text-zinc-950">
                  Copertina
                </h2>
              </div>
              <span className="text-[8px] font-bold text-zinc-400 uppercase">Opzionale</span>
            </div>

            {!preview ? (
              <label className="group relative border border-dashed border-amber-500/30 hover:border-amber-500/60 bg-amber-500/5 rounded-xl p-2.5 flex flex-col items-center justify-center gap-1 cursor-pointer transition-all min-h-[80px]">
                <div className="p-1.5 rounded-lg bg-white border border-amber-500/20 shadow-2xs group-hover:scale-105 transition-transform">
                  <UploadCloudIcon className="text-amber-950" />
                </div>
                <span className="text-[9px] font-black text-amber-950 uppercase tracking-wide block">
                  Carica Foto
                </span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImage}
                  className="hidden"
                />
              </label>
            ) : (
              <div className="relative rounded-xl overflow-hidden border border-white/80 shadow-2xs group">
                <img
                  src={preview}
                  alt="Preview"
                  className="w-full h-24 object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/80 via-transparent to-transparent opacity-90" />
                <div className="absolute bottom-1.5 left-2 right-2 flex items-center justify-between text-white">
                  <span className="text-[8px] font-bold bg-zinc-950/70 px-1.5 py-0.5 rounded border border-white/20 truncate max-w-[90px]">
                    {immagine?.name}
                  </span>
                  <button
                    type="button"
                    onClick={removeImage}
                    className="p-1 rounded-md bg-rose-600 hover:bg-rose-700 text-white transition-colors shadow-2xs"
                  >
                    <TrashIcon />
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* AUDIO */}
          <div className="bg-white/80 border border-white/90 rounded-2xl p-3 shadow-sm backdrop-blur-xl space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <div className="p-1 rounded-lg bg-amber-500/20 text-amber-950">
                  <MusicWaveIcon className="text-amber-950" />
                </div>
                <h2 className="text-[10px] font-black uppercase tracking-wider text-zinc-950">
                  Audio MP3
                </h2>
              </div>
              <span className="text-[8px] font-bold text-zinc-400 uppercase">Opzionale</span>
            </div>

            {!audio ? (
              <label className="group border border-amber-500/20 bg-white/90 hover:bg-white rounded-xl p-2 flex items-center justify-between cursor-pointer transition-all shadow-2xs">
                <div className="flex items-center gap-2">
                  <div className="p-1 rounded-lg bg-amber-500/15 text-amber-950">
                    <UploadCloudIcon className="text-amber-950" />
                  </div>
                  <span className="text-[9px] font-black text-zinc-950 uppercase">
                    Sfoglia Audio
                  </span>
                </div>
                <input
                  type="file"
                  accept="audio/*"
                  onChange={handleAudio}
                  className="hidden"
                />
              </label>
            ) : (
              <div className="bg-amber-500/15 border border-amber-500/30 rounded-xl p-1.5 flex items-center justify-between">
                <div className="flex items-center gap-1.5 truncate">
                  <div className="p-1 rounded-lg bg-amber-500 text-amber-950 shrink-0">
                    <MusicWaveIcon className="text-amber-950" />
                  </div>
                  <span className="text-[9px] font-black text-amber-950 truncate">
                    {audio.name}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={removeAudio}
                  className="p-1 rounded-md bg-white/80 hover:bg-rose-500 hover:text-white text-zinc-700 transition-colors shrink-0"
                >
                  <TrashIcon />
                </button>
              </div>
            )}
          </div>

        </section>

        {/* TESTO & SALVATAGGIO (7 COLS) */}
        <section className="md:col-span-7 space-y-3">
          <div className="bg-white/80 border border-white/90 rounded-2xl p-3.5 shadow-sm backdrop-blur-xl space-y-2.5">
            
            {/* HEADER SEZIONE CON ICONA PENNA CORRETTA */}
            <div className="flex items-center gap-1.5 pb-1.5 border-b border-amber-500/10">
              <div className="p-1 rounded-lg bg-amber-500/20 text-amber-950">
                <PenIcon className="text-amber-950" />
              </div>
              <span className="text-[10px] font-black uppercase tracking-wider text-amber-950">
                Testo del Racconto
              </span>
            </div>

            {/* TITOLO */}
            <div className="space-y-1">
              <label className="text-[9px] font-black uppercase tracking-wider text-zinc-950 block">
                Titolo
              </label>
              <input
                type="text"
                value={titolo}
                onChange={(e) => setTitolo(e.target.value)}
                placeholder="Inserisci titolo..."
                className="w-full bg-white/90 border border-amber-500/20 focus:border-amber-500 rounded-xl p-2 text-xs font-bold text-zinc-950 placeholder:text-zinc-400 focus:outline-none focus:ring-1 focus:ring-amber-500/30 transition-all shadow-2xs"
              />
            </div>

            {/* CONTENUTO */}
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="text-[9px] font-black uppercase tracking-wider text-zinc-950 block">
                  Contenuto
                </label>
                <span className="text-[8px] font-bold text-zinc-400">
                  {contenuto.length} char
                </span>
              </div>
              <textarea
                value={contenuto}
                onChange={(e) => setContenuto(e.target.value)}
                placeholder="Scrivi qui la curiosità..."
                className="w-full bg-white/90 border border-amber-500/20 focus:border-amber-500 rounded-xl p-2 h-32 text-xs font-medium text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-1 focus:ring-amber-500/30 transition-all shadow-2xs resize-none leading-relaxed"
              />
            </div>

            {/* TASTO SALVA */}
            <button
              type="button"
              onClick={createCuriosita}
              disabled={saving}
              className="w-full bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 hover:from-amber-400 hover:to-amber-500 text-amber-950 font-black uppercase tracking-wider rounded-xl p-2.5 text-xs shadow-sm border border-amber-300/60 transition-all disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-1.5"
            >
              {saving ? (
                <>
                  <div className="w-3 h-3 border-2 border-amber-950 border-t-transparent rounded-full animate-spin" />
                  <span>Salvataggio...</span>
                </>
              ) : (
                <>
                  <SparklesIcon className="text-amber-950" />
                  <span>Pubblica Curiosità</span>
                </>
              )}
            </button>

          </div>
        </section>

      </div>

    </main>
  );
}