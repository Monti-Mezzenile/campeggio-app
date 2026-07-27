"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import BackButton from "@/components/ui/BackButton";

// --- Utility SVG per icone interfaccia ---
function CameraIcon({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  );
}

function XIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
  );
}

function EyeIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
    </svg>
  );
}

function MapPinIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  );
}

function SaveIcon({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
    </svg>
  );
}

export default function NewCarPage() {
  const router = useRouter();

  // Form State
  const [modello, setModello] = useState("");
  const [posti, setPosti] = useState<number>(3);
  const [partenza, setPartenza] = useState("");
  const [note, setNote] = useState("");

  // Foto & Preview State
  const [foto, setFoto] = useState<File | null>(null);
  const [preview, setPreview] = useState("");

  const [saving, setSaving] = useState(false);

  // Gestione File con pulizia Object URL
  function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (preview) {
      URL.revokeObjectURL(preview);
    }

    setFoto(file);
    setPreview(URL.createObjectURL(file));
  }

  function removePhoto() {
    if (preview) {
      URL.revokeObjectURL(preview);
    }
    setFoto(null);
    setPreview("");
  }

  async function saveCar() {
    if (!modello.trim()) {
      alert("Inserisci il modello del tuo mezzo!");
      return;
    }

    if (!posti || posti < 1) {
      alert("Inserisci almeno 1 posto disponibile per i passeggeri");
      return;
    }

    setSaving(true);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        alert("Utente non autenticato");
        setSaving(false);
        return;
      }

      let fotoUrl: string | null = null;

      // Upload Foto su Supabase Storage
      if (foto) {
        const extension = foto.name.split(".").pop();
        const fileName = `${user.id}/${crypto.randomUUID()}.${extension}`;

        const { error: uploadError } = await supabase.storage
          .from("cars")
          .upload(fileName, foto);

        if (uploadError) {
          alert(uploadError.message);
          setSaving(false);
          return;
        }

        const { data } = supabase.storage
          .from("cars")
          .getPublicUrl(fileName);

        fotoUrl = data.publicUrl;
      }

      // Insert su Tabella 'cars'
      const { error } = await supabase.from("cars").insert({
        user_id: user.id,
        modello: modello.trim(),
        posti_totali: Number(posti),
        partenza_predefinita: partenza.trim() || null,
        note: note.trim() || null,
        foto: fotoUrl,
      });

      if (error) {
        console.error("Errore salvataggio auto:", error);
        alert(error.message);
        setSaving(false);
        return;
      }

      router.push("/profile/cars");
      router.refresh();
    } catch (err: any) {
      console.error("Errore inatteso:", err);
      alert("Si è verificato un errore durante il salvataggio.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="min-h-screen p-4 sm:p-6 pb-32 max-w-xl mx-auto text-zinc-900">
      {/* Back Button */}
      <div className="mb-4">
        <BackButton label="I miei mezzi" />
      </div>

      {/* Header Pagina con Icona Gigante */}
      <div className="mb-8 flex items-center gap-4 sm:gap-5">
        <div className="w-16 h-16 sm:w-20 sm:h-20 shrink-0 bg-blue-50/80 border border-blue-100 rounded-3xl flex items-center justify-center p-3 shadow-sm backdrop-blur-sm">
          <img 
            src="/icons/macchina.png" 
            alt="Auto" 
            className="w-full h-full object-contain drop-shadow-sm" 
          />
        </div>
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-950 text-[10px] font-black uppercase tracking-wider mb-1.5">
            <span>🏁 Aggiunta Veicolo</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-zinc-950 tracking-tight leading-none">
            Nuovo Veicolo
          </h1>
        </div>
      </div>

      <div className="bg-white/80 border border-white/90 rounded-3xl p-5 sm:p-6 shadow-xl backdrop-blur-md space-y-5">
        
        {/* Sezione Caricamento Foto */}
        <div>
          <label className="block text-xs font-bold text-zinc-800 mb-1.5 uppercase tracking-wide">
            Foto del Veicolo
          </label>

          {preview ? (
            <div className="relative w-full h-48 sm:h-56 rounded-2xl overflow-hidden bg-zinc-50 border border-zinc-200 p-2 flex items-center justify-center group shadow-inner">
              <img
                src={preview}
                alt="Anteprima"
                className="w-full h-full object-contain"
              />
              <button
                type="button"
                onClick={removePhoto}
                className="absolute top-3 right-3 bg-zinc-900/80 hover:bg-rose-600 text-white rounded-full px-3 py-1.5 text-xs font-black shadow-lg transition-all active:scale-90 flex items-center justify-center gap-1.5 backdrop-blur-sm"
              >
                <XIcon className="w-3.5 h-3.5" />
                <span>Rimuovi foto</span>
              </button>
            </div>
          ) : (
            <label className="w-full h-36 border-2 border-dashed border-zinc-300 hover:border-amber-500 hover:bg-amber-50/30 rounded-2xl flex flex-col items-center justify-center cursor-pointer bg-zinc-50/50 transition-all p-4 text-center">
              <div className="w-10 h-10 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-700 flex items-center justify-center mb-2">
                <CameraIcon className="w-5 h-5" />
              </div>
              <span className="text-xs font-bold text-zinc-800">
                Carica una foto del veicolo
              </span>
              <span className="text-[10px] text-zinc-500 mt-1">
                PNG, JPG o WEBP (opzionale)
              </span>
              <input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="hidden"
              />
            </label>
          )}
        </div>

        {/* Modello */}
        <div>
          <label className="block text-xs font-bold text-zinc-800 mb-1 uppercase tracking-wide">
            Modello Veicolo <span className="text-rose-500">*</span>
          </label>
          <input
            value={modello}
            onChange={(e) => setModello(e.target.value)}
            placeholder="Es. Fiat Panda, VW Golf, Ford Transit..."
            className="w-full bg-white border border-zinc-300 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 rounded-xl p-3.5 text-sm font-bold text-zinc-900 outline-none transition-all placeholder:font-normal placeholder:text-zinc-400"
          />
        </div>

        {/* Posti Passeggero (Stepper) */}
        <div>
          <label className="block text-xs font-bold text-zinc-800 mb-1 uppercase tracking-wide">
            Posti Passeggero Disponibili <span className="text-rose-500">*</span>
          </label>
          <div className="flex items-center bg-zinc-100 rounded-xl border border-zinc-300 p-1 h-[48px]">
            <button
              type="button"
              onClick={() => setPosti(Math.max(1, posti - 1))}
              className="w-11 h-full rounded-lg bg-white shadow-sm text-zinc-800 font-bold text-xl hover:bg-zinc-50 active:scale-95 transition-all flex items-center justify-center"
            >
              -
            </button>
            <span className="flex-1 text-center font-black text-zinc-950 text-base">
              {posti} {posti === 1 ? "posto passeggero" : "posti passeggeri"}
            </span>
            <button
              type="button"
              onClick={() => setPosti(posti + 1)}
              className="w-11 h-full rounded-lg bg-white shadow-sm text-zinc-800 font-bold text-xl hover:bg-zinc-50 active:scale-95 transition-all flex items-center justify-center"
            >
              +
            </button>
          </div>
          <p className="text-[10px] font-semibold text-zinc-500 mt-1.5 flex items-center gap-1.5">
            <span className="text-amber-600 text-sm">💡</span>
            <span>
              Indica solo i posti per i compagni di viaggio (escluso il conducente).
            </span>
          </p>
        </div>

        {/* Partenza Predefinita */}
        <div>
          <label className="block text-xs font-bold text-zinc-800 mb-1 uppercase tracking-wide">
            Città / Punto di Partenza Abituale
          </label>
          <input
            value={partenza}
            onChange={(e) => setPartenza(e.target.value)}
            placeholder="Es. Torino Nord, Milano Lambrate..."
            className="w-full bg-white border border-zinc-300 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 rounded-xl p-3.5 text-sm font-semibold text-zinc-900 outline-none transition-all placeholder:font-normal placeholder:text-zinc-400"
          />
        </div>

        {/* Note */}
        <div>
          <label className="block text-xs font-bold text-zinc-800 mb-1 uppercase tracking-wide">
            Note o Dettagli Extra
          </label>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Es. Ampio bagagliaio, portapacchi sul tetto, non si fuma in auto..."
            rows={3}
            className="w-full bg-white border border-zinc-300 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 rounded-xl p-3.5 text-sm font-medium text-zinc-900 outline-none transition-all placeholder:font-normal placeholder:text-zinc-400 resize-none"
          />
        </div>

        {/* LIVE PREVIEW BOX */}
        {(modello || preview) && (
          <div className="pt-3 border-t border-zinc-200/80">
            <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase text-amber-950 mb-2 tracking-wider">
              <EyeIcon className="w-3.5 h-3.5 text-amber-700" />
              <span>Anteprima Scheda Garage</span>
            </span>
            <div className="bg-white/90 border border-amber-500/30 rounded-2xl p-3 backdrop-blur-md shadow-sm">
              <div className="flex items-center gap-3">
                <div className="w-16 h-16 rounded-xl bg-zinc-50 border border-zinc-200 overflow-hidden shrink-0 flex items-center justify-center">
                  {preview ? (
                    <img
                      src={preview}
                      alt="Preview"
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    <img src="/icons/macchina.png" alt="Auto fallback" className="w-8 h-8 opacity-60 object-contain" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1">
                    <h4 className="text-sm font-black text-zinc-950 truncate">
                      {modello || "Nome Modello"}
                    </h4>
                    {/* Badge Preview con Colore Panna / Amber */}
                    <span className="shrink-0 text-[10px] font-black px-1.5 py-0.5 rounded-md bg-amber-500/20 text-amber-950 border border-amber-500/30 flex items-center gap-1">
                      <img src="/icons/profilo.png" alt="Posti" className="w-3 h-3 object-contain shrink-0" />
                      <span>{posti}</span>
                    </span>
                  </div>
                  {partenza && (
                    <p className="text-[11px] font-semibold text-zinc-600 truncate mt-1 flex items-center gap-1">
                      <MapPinIcon className="w-3.5 h-3.5 text-blue-500 inline shrink-0" />
                      <span className="truncate">{partenza}</span>
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Pulsante Salvataggio (Stile Panna / Amber Tenue) */}
        <button
          disabled={saving}
          onClick={saveCar}
          className="w-full py-4 px-5 rounded-2xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-950 font-black text-sm tracking-wide shadow-sm active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-2 border border-amber-500/30 mt-4"
        >
          {saving ? (
            <>
              <div className="w-5 h-5 border-2 border-amber-950/20 border-t-amber-950 rounded-full animate-spin" />
              <span>Salvataggio In Corso...</span>
            </>
          ) : (
            <>
              <SaveIcon className="w-5 h-5" />
              <span>Salva Veicolo Nel Garage</span>
            </>
          )}
        </button>
      </div>
    </main>
  );
}