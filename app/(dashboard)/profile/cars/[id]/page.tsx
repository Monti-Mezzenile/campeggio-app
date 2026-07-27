"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import BackButton from "@/components/ui/BackButton";

// --- Utility SVG per icone di dettaglio e gestione ---
function PencilIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
    </svg>
  );
}

function SaveIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
    </svg>
  );
}

function TrashIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
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

function NoteIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
    </svg>
  );
}

function CameraIcon({ className = "w-5 h-5" }: { className?: string }) {
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

export default function CarDetailPage() {
  const params = useParams();
  const router = useRouter();

  const id = params.id as string;

  const [car, setCar] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  // Form states
  const [modello, setModello] = useState("");
  const [posti, setPosti] = useState<number>(4);
  const [partenza, setPartenza] = useState("");
  const [note, setNote] = useState("");
  const [foto, setFoto] = useState<File | null>(null);
  const [preview, setPreview] = useState("");

  async function loadCar() {
    setLoading(true);

    const { data, error } = await supabase
      .from("cars")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      console.error("Errore caricamento mezzo:", error);
      setLoading(false);
      return;
    }

    setCar(data);
    setModello(data.modello || "");
    setPosti(data.posti_totali || 4);
    setPartenza(data.partenza_predefinita || "");
    setNote(data.note || "");
    setPreview(data.foto || "");

    setLoading(false);
  }

  async function uploadPhoto() {
    if (!foto) {
      return car?.foto || null;
    }

    const extension = foto.name.split(".").pop();
    const fileName = `${crypto.randomUUID()}.${extension}`;

    const { error } = await supabase.storage
      .from("cars")
      .upload(fileName, foto, { upsert: true });

    if (error) {
      console.error("Errore upload foto:", error);
      alert(error.message);
      return null;
    }

    const { data } = supabase.storage
      .from("cars")
      .getPublicUrl(fileName);

    return data.publicUrl;
  }

  async function saveCar() {
    if (!modello.trim()) {
      alert("Inserisci il modello del veicolo");
      return;
    }

    setSaving(true);
    const fotoUrl = await uploadPhoto();

    const { error } = await supabase
      .from("cars")
      .update({
        modello: modello.trim(),
        posti_totali: Number(posti),
        partenza_predefinita: partenza.trim() || null,
        note: note.trim() || null,
        foto: fotoUrl,
      })
      .eq("id", id);

    if (error) {
      console.error("Errore salvataggio:", error);
      alert(error.message);
      setSaving(false);
      return;
    }

    setSaving(false);
    setEditing(false);
    setFoto(null);
    loadCar();
  }

  async function deleteCar() {
    const ok = confirm("Sei sicuro di voler eliminare questo mezzo dal tuo garage?");
    if (!ok) return;

    const { error } = await supabase.from("cars").delete().eq("id", id);

    if (error) {
      alert(error.message);
      return;
    }

    router.push("/profile/cars");
  }

  useEffect(() => {
    if (id) {
      loadCar();
    }
  }, [id]);

  if (loading) {
    return (
      <main className="min-h-screen p-6 pb-28 max-w-xl mx-auto flex flex-col justify-center items-center">
        <div className="w-10 h-10 border-4 border-amber-600/20 border-t-amber-600 rounded-full animate-spin mb-3" />
        <p className="text-xs font-bold text-zinc-700 tracking-wide">
          Recupero dettagli veicolo...
        </p>
      </main>
    );
  }

  if (!car) {
    return (
      <main className="min-h-screen p-6 pb-28 max-w-xl mx-auto flex flex-col items-center justify-center text-center">
        <div className="bg-white/80 border border-white/90 p-8 rounded-3xl backdrop-blur-md shadow-lg">
          <img src="/icons/macchina.png" alt="Non trovato" className="w-16 h-16 mx-auto mb-3 opacity-50" />
          <h2 className="text-lg font-bold text-zinc-900 mb-1">Veicolo Non Trovato</h2>
          <p className="text-xs text-zinc-500 mb-4">Il mezzo cercato potrebbe essere stato rimosso.</p>
          <button
            onClick={() => router.push("/profile/cars")}
            className="px-4 py-2 bg-zinc-900 text-white rounded-xl text-xs font-bold"
          >
            Torna al Garage
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen p-4 sm:p-6 pb-32 max-w-xl mx-auto text-zinc-900">
      {/* Back Button */}
      <div className="mb-4">
        <BackButton label="Garage" />
      </div>

      {/* CARD PRINCIPALE GLASSMORPHIC */}
      <div className="bg-white/80 border border-white/90 rounded-3xl p-5 sm:p-6 shadow-xl backdrop-blur-md space-y-6">
        
        {/* Foto Veicolo o Fallback Icona */}
        <div className="relative w-full h-48 sm:h-56 rounded-2xl overflow-hidden bg-zinc-50/80 border border-zinc-200/80 p-2 flex items-center justify-center shadow-inner group">
          <img
            src={preview || "/icons/macchina.png"}
            alt={car.modello}
            className={`w-full h-full object-contain ${!preview ? "p-4 opacity-80" : ""}`}
          />

          {/* Badge Posti Sovrapposto (se non in modifica) */}
          {!editing && (
            <div className="absolute top-3 right-3 bg-white/90 border border-amber-500/30 text-amber-950 px-3 py-1 rounded-full text-xs font-black shadow-md backdrop-blur-md flex items-center gap-1.5">
              <img src="/icons/profilo.png" alt="Posti" className="w-4 h-4 object-contain" />
              <span>{car.posti_totali} posti</span>
            </div>
          )}
        </div>

        {/* Titolo e Dettagli Principali */}
        {!editing ? (
          <div className="space-y-4">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-950 text-[10px] font-black uppercase tracking-wider mb-2">
                <img src="/icons/macchina.png" alt="Auto" className="w-4 h-4 object-contain" />
                <span>Scheda Mezzo</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-zinc-950 tracking-tight leading-tight">
                {car.modello}
              </h1>
            </div>

            {/* Informazioni Logistiche */}
            <div className="space-y-2.5 pt-1">
              <div className="flex items-center gap-2.5 bg-zinc-100/70 p-3 rounded-2xl border border-zinc-200/60 text-xs font-bold text-zinc-800">
                <div className="p-1.5 bg-amber-500/10 rounded-lg text-amber-800">
                  <img src="/icons/profilo.png" alt="Posti" className="w-4 h-4 object-contain" />
                </div>
                <div>
                  <span className="block text-[10px] uppercase font-black text-zinc-400">Capienza</span>
                  <span>{car.posti_totali} Posti totali per viaggiatori</span>
                </div>
              </div>

              {car.partenza_predefinita && (
                <div className="flex items-center gap-2.5 bg-zinc-100/70 p-3 rounded-2xl border border-zinc-200/60 text-xs font-bold text-zinc-800">
                  <div className="p-1.5 bg-blue-500/10 rounded-lg text-blue-600">
                    <MapPinIcon className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="block text-[10px] uppercase font-black text-zinc-400">Partenza Abituale</span>
                    <span>{car.partenza_predefinita}</span>
                  </div>
                </div>
              )}

              {car.note && (
                <div className="bg-amber-500/5 border border-amber-500/20 p-3.5 rounded-2xl text-xs font-medium text-zinc-700 space-y-1">
                  <span className="text-[10px] font-black uppercase tracking-wider text-amber-900 flex items-center gap-1">
                    <NoteIcon className="w-3.5 h-3.5 text-amber-700" />
                    <span>Note dell'automobilista</span>
                  </span>
                  <p className="italic text-zinc-800">"{car.note}"</p>
                </div>
              )}
            </div>
          </div>
        ) : (
          /* FORM EDITING */
          <div className="space-y-4 pt-1">
            <h2 className="text-lg font-black text-zinc-950 flex items-center gap-2">
              <PencilIcon className="w-5 h-5 text-amber-700" />
              <span>Modifica Dettagli</span>
            </h2>

            {/* Input Foto */}
            <div>
              <label className="block text-[11px] font-black uppercase text-zinc-600 mb-1 tracking-wider">
                Foto Veicolo
              </label>
              <div className="flex items-center gap-2">
                <label className="flex-1 cursor-pointer bg-zinc-50 border border-zinc-200 hover:bg-amber-50/50 p-3 rounded-xl flex items-center justify-center gap-2 text-xs font-bold text-zinc-700 transition-all">
                  <CameraIcon className="w-4 h-4 text-amber-700" />
                  <span>Scegli Nuova Foto</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        setFoto(file);
                        setPreview(URL.createObjectURL(file));
                      }
                    }}
                    className="hidden"
                  />
                </label>
                {foto && (
                  <button
                    type="button"
                    onClick={() => {
                      setFoto(null);
                      setPreview(car.foto || "");
                    }}
                    className="p-3 bg-rose-500/10 text-rose-700 rounded-xl hover:bg-rose-500/20 transition-all"
                  >
                    <XIcon className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            {/* Input Modello */}
            <div>
              <label className="block text-[11px] font-black uppercase text-zinc-600 mb-1 tracking-wider">
                Modello
              </label>
              <input
                value={modello}
                onChange={(e) => setModello(e.target.value)}
                className="w-full bg-white border border-zinc-300 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 rounded-xl p-3 text-sm font-bold text-zinc-900 outline-none transition-all"
              />
            </div>

            {/* Input Posti (Stepper) */}
            <div>
              <label className="block text-[11px] font-black uppercase text-zinc-600 mb-1 tracking-wider">
                Posti Disponibili
              </label>
              <div className="flex items-center bg-zinc-100 rounded-xl border border-zinc-300 p-1 h-12">
                <button
                  type="button"
                  onClick={() => setPosti(Math.max(1, Number(posti) - 1))}
                  className="w-10 h-full rounded-lg bg-white shadow-sm text-zinc-800 font-bold text-lg hover:bg-zinc-50 active:scale-95 transition-all flex items-center justify-center"
                >
                  -
                </button>
                <span className="flex-1 text-center font-black text-zinc-950 text-sm">
                  {posti} posti
                </span>
                <button
                  type="button"
                  onClick={() => setPosti(Number(posti) + 1)}
                  className="w-10 h-full rounded-lg bg-white shadow-sm text-zinc-800 font-bold text-lg hover:bg-zinc-50 active:scale-95 transition-all flex items-center justify-center"
                >
                  +
                </button>
              </div>
            </div>

            {/* Input Partenza */}
            <div>
              <label className="block text-[11px] font-black uppercase text-zinc-600 mb-1 tracking-wider">
                Partenza Abituale
              </label>
              <input
                value={partenza}
                onChange={(e) => setPartenza(e.target.value)}
                placeholder="Es. Torino Nord, Ciriè..."
                className="w-full bg-white border border-zinc-300 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 rounded-xl p-3 text-sm font-semibold text-zinc-900 outline-none transition-all"
              />
            </div>

            {/* Input Note */}
            <div>
              <label className="block text-[11px] font-black uppercase text-zinc-600 mb-1 tracking-wider">
                Note Extra
              </label>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={3}
                placeholder="Dettagli bagagliaio, regole a bordo..."
                className="w-full bg-white border border-zinc-300 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 rounded-xl p-3 text-sm font-medium text-zinc-900 outline-none transition-all resize-none"
              />
            </div>
          </div>
        )}

        {/* AZIONI / PULSANTI */}
        <div className="pt-2 space-y-2.5">
          {/* Tasto Principale Salva / Modifica (Colore Panna / Amber Tenue) */}
          <button
            onClick={editing ? saveCar : () => setEditing(true)}
            disabled={saving}
            className="w-full py-3.5 px-4 rounded-2xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-950 font-black text-xs sm:text-sm tracking-wide shadow-sm active:scale-[0.98] transition-all border border-amber-500/30 backdrop-blur-md flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {saving ? (
              <>
                <div className="w-4 h-4 border-2 border-amber-950/20 border-t-amber-950 rounded-full animate-spin" />
                <span>Salvataggio in corso...</span>
              </>
            ) : editing ? (
              <>
                <SaveIcon className="w-4 h-4 text-amber-900" />
                <span>Salva Modifiche</span>
              </>
            ) : (
              <>
                <PencilIcon className="w-4 h-4 text-amber-900" />
                <span>Modifica Veicolo</span>
              </>
            )}
          </button>

          {/* Annulla Modifica (visibile solo in editing) */}
          {editing && (
            <button
              onClick={() => {
                setEditing(false);
                setFoto(null);
                setPreview(car.foto || "");
              }}
              className="w-full py-2.5 px-4 rounded-2xl bg-zinc-100 hover:bg-zinc-200 text-zinc-700 font-bold text-xs transition-all active:scale-[0.98]"
            >
              Annulla
            </button>
          )}

          {/* Tasto Elimina Mezzo (Stile Red Soft Glass) */}
          {!editing && (
            <button
              onClick={deleteCar}
              className="w-full py-3 px-4 rounded-2xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-700 font-black text-xs transition-all active:scale-[0.98] border border-rose-500/20 flex items-center justify-center gap-2"
            >
              <TrashIcon className="w-4 h-4" />
              <span>Elimina Questo Mezzo</span>
            </button>
          )}
        </div>
      </div>
    </main>
  );
}