"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import BackButton from "@/components/ui/BackButton";
import CustomIcon from "@/components/ui/CustomIcon";

export default function EditTentPage() {
  const params = useParams();
  const tentId = params.tentId as string;

  const [nome, setNome] = useState("");
  const [marca, setMarca] = useState("");
  const [modello, setModello] = useState("");
  const [posti, setPosti] = useState<number>(3);
  const [note, setNote] = useState("");
  const [existingFoto, setExistingFoto] = useState<string>("");

  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  async function loadTent() {
    try {
      const { data, error } = await supabase
        .from("tents")
        .select("*")
        .eq("id", tentId)
        .maybeSingle();

      if (error || !data) {
        console.error("Errore caricamento tenda:", error);
        setErrorMsg("Tenda non trovata o non accessibile.");
        setLoading(false);
        return;
      }

      setNome(data.nome || "");
      setMarca(data.marca || "");
      setModello(data.modello || "");
      setPosti(Number(data.posti) || 3);
      setNote(data.note || "");
      setExistingFoto(data.foto || "");
      setPreviewUrl(data.foto || null);
    } catch (err) {
      console.error("Errore inatteso:", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (tentId) {
      loadTent();
    }
  }, [tentId]);

  // Gestione Selezione Nuova Foto
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      setPreviewUrl(URL.createObjectURL(selectedFile));
    }
  };

  // Rimuovi o cambia Foto
  const removePhoto = () => {
    setFile(null);
    setPreviewUrl(null);
    setExistingFoto("");
  };

  async function saveTent() {
    if (!nome.trim()) {
      setErrorMsg("Inserisci un nome per la tua tenda!");
      return;
    }

    if (!posti || posti <= 0) {
      setErrorMsg("Inserisci un numero di posti valido.");
      return;
    }

    setSaving(true);
    setErrorMsg(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Utente non autenticato.");

      let finalFotoUrl = existingFoto;

      // 1. Upload nuova foto (se l'utente l'ha cambiata)
      if (file) {
        const fileExt = file.name.split(".").pop();
        const fileName = `${user.id}-${Date.now()}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from("tents")
          .upload(fileName, file);

        if (uploadError) {
          throw new Error("Errore upload foto: " + uploadError.message);
        }

        const { data } = supabase.storage
          .from("tents")
          .getPublicUrl(fileName);

        finalFotoUrl = data.publicUrl;
      } else if (!previewUrl) {
        finalFotoUrl = "";
      }

      // 2. Update eseguito con .select() senza .single() per prevenire il crash PGRST116
      const { data, error } = await supabase
        .from("tents")
        .update({
          nome: nome.trim(),
          marca: marca.trim(),
          modello: modello.trim(),
          posti: Number(posti),
          note: note.trim(),
          foto: finalFotoUrl,
        })
        .eq("id", tentId)
        .select();

      if (error) {
        throw new Error("Aggiornamento fallito: " + error.message);
      }

      // Se l'array è vuoto, Supabase ha bloccato l'aggiornamento (permessi RLS mancanti)
      if (!data || data.length === 0) {
        throw new Error(
          "Modifica non riuscita: non disponi dei permessi RLS per aggiornare questa tenda."
        );
      }

      // 3. Forziamo il caricamento aggirando la cache di Next.js
      window.location.href = "/profile/tents";
      
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || "Errore durante il salvataggio.");
      setSaving(false);
    }
  }

  async function deleteTent() {
    const confirmDelete = confirm(
      "Sei sicuro di voler eliminare definitivamente questa tenda dal tuo profilo?"
    );
    if (!confirmDelete) return;

    setDeleting(true);
    try {
      const { error } = await supabase.from("tents").delete().eq("id", tentId);
      if (error) throw error;

      // Aggiriamo la cache anche in caso di eliminazione
      window.location.href = "/profile/tents";
      
    } catch (err: any) {
      alert("Errore eliminazione: " + err.message);
      setDeleting(false);
    }
  }

  if (loading) {
    return (
      <div className="w-full py-16 p-4 sm:p-6 max-w-xl mx-auto flex flex-col justify-center items-center">
        <div className="w-10 h-10 border-4 border-amber-600/20 border-t-amber-600 rounded-full animate-spin mb-3" />
        <p className="text-xs font-bold text-zinc-800 tracking-wide">
          Caricamento scheda tenda...
        </p>
      </div>
    );
  }

  return (
    <div className="w-full p-4 sm:p-6 max-w-xl mx-auto text-zinc-900">
      {/* Back Button */}
      <div className="mb-4">
        <BackButton label="Le mie tende" />
      </div>

      {/* Header Pagina */}
      <div className="mb-6">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-900/10 border border-amber-900/20 text-amber-950 text-[11px] font-black uppercase tracking-wider mb-2 backdrop-blur-md">
          <span>✏️ Edit Equipment</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-black text-zinc-950 tracking-tight flex items-center gap-3">
          <CustomIcon name="tenda-grossa" size={40} />
          <span>Modifica Tenda</span>
        </h1>
        <p className="text-xs font-semibold text-zinc-600 mt-1">
          Aggiorna le caratteristiche o la foto della tua tenda personale.
        </p>
      </div>

      {/* LIVE PREVIEW CARD */}
      <div className="mb-6">
        <span className="text-[11px] font-black uppercase text-zinc-500 tracking-wider mb-2 block px-1">
          👁️ Anteprima scheda
        </span>
        <div className="bg-white/90 border border-amber-500/30 rounded-2xl p-3.5 shadow-md backdrop-blur-md">
          <div className="flex gap-3 items-center">
            {previewUrl ? (
              <div className="w-20 h-20 rounded-xl overflow-hidden bg-white border border-zinc-200 shrink-0 p-1">
                <img
                  src={previewUrl}
                  alt="Preview"
                  className="w-full h-full object-contain"
                />
              </div>
            ) : (
              <div className="w-20 h-20 rounded-xl bg-amber-50 border border-amber-200/80 shrink-0 flex items-center justify-center overflow-hidden">
                <CustomIcon name="tenda-grossa" size={58} />
              </div>
            )}

            <div className="flex-1 min-w-0">
              <h2 className="text-base font-extrabold text-zinc-900 truncate">
                {nome.trim() || "Nome della tua tenda"}
              </h2>
              <p className="text-xs text-zinc-500 truncate font-medium">
                {marca || modello ? `${marca} ${modello}`.trim() : "Marca & Modello"}
              </p>

              <div className="mt-2 flex items-center gap-2">
                <span className="inline-flex items-center gap-1 text-[11px] font-extrabold px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-950 border border-amber-500/30">
                  🛏️ {posti || 0} Posti
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* FORM CARD */}
      <div className="bg-white/80 border border-white/90 rounded-3xl p-5 sm:p-6 shadow-xl backdrop-blur-md space-y-5">
        {errorMsg && (
          <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-700 text-xs font-bold flex items-center gap-2">
            <span>⚠️</span>
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Nome Tenda */}
        <div>
          <label className="block text-xs font-bold text-zinc-800 mb-1.5 uppercase tracking-wide">
            Nome Tenda <span className="text-rose-500">*</span>
          </label>
          <input
            placeholder="es. La Mia Reggia, Quechua Verde..."
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            className="w-full bg-white/90 border border-zinc-300 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 rounded-xl p-3 text-sm font-semibold text-zinc-900 outline-none transition-all placeholder:text-zinc-400 placeholder:font-normal"
          />
        </div>

        {/* Marca & Modello */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-bold text-zinc-800 mb-1.5 uppercase tracking-wide">
              Marca
            </label>
            <input
              placeholder="es. Decathlon, Ferrino"
              value={marca}
              onChange={(e) => setMarca(e.target.value)}
              className="w-full bg-white/90 border border-zinc-300 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 rounded-xl p-3 text-sm font-medium text-zinc-900 outline-none transition-all placeholder:text-zinc-400 placeholder:font-normal"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-zinc-800 mb-1.5 uppercase tracking-wide">
              Modello
            </label>
            <input
              placeholder="es. Arpenaz 3+, Ultralight"
              value={modello}
              onChange={(e) => setModello(e.target.value)}
              className="w-full bg-white/90 border border-zinc-300 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 rounded-xl p-3 text-sm font-medium text-zinc-900 outline-none transition-all placeholder:text-zinc-400 placeholder:font-normal"
            />
          </div>
        </div>

        {/* Selettore Posti Letto */}
        <div>
          <label className="block text-xs font-bold text-zinc-800 mb-1.5 uppercase tracking-wide">
            Capienza Posti Letto <span className="text-rose-500">*</span>
          </label>
          <div className="flex items-center gap-3">
            <div className="flex items-center bg-zinc-100 rounded-xl border border-zinc-300 p-1">
              <button
                type="button"
                onClick={() => setPosti(Math.max(1, posti - 1))}
                className="w-9 h-9 rounded-lg bg-white shadow-sm text-zinc-800 font-bold text-lg hover:bg-zinc-50 active:scale-95 transition-all flex items-center justify-center"
              >
                -
              </button>
              <span className="w-12 text-center font-black text-zinc-900 text-base">
                {posti}
              </span>
              <button
                type="button"
                onClick={() => setPosti(posti + 1)}
                className="w-9 h-9 rounded-lg bg-white shadow-sm text-zinc-800 font-bold text-lg hover:bg-zinc-50 active:scale-95 transition-all flex items-center justify-center"
              >
                +
              </button>
            </div>

            <div className="flex gap-1.5 flex-1 overflow-x-auto no-scrollbar">
              {[2, 3, 4, 6, 8].map((num) => (
                <button
                  key={num}
                  type="button"
                  onClick={() => setPosti(num)}
                  className={`px-3 py-2 rounded-xl text-xs font-bold transition-all border shrink-0 ${
                    posti === num
                      ? "bg-amber-500 text-zinc-950 border-amber-600 shadow-sm"
                      : "bg-white text-zinc-600 border-zinc-200 hover:border-zinc-300"
                  }`}
                >
                  {num}P
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Gestione Foto */}
        <div>
          <label className="block text-xs font-bold text-zinc-800 mb-1.5 uppercase tracking-wide">
            Foto della Tenda
          </label>

          {previewUrl ? (
            <div className="relative rounded-2xl overflow-hidden border border-zinc-200 bg-white p-2 flex items-center gap-3">
              <img
                src={previewUrl}
                alt="Foto Tenda"
                className="w-20 h-20 object-contain rounded-xl bg-zinc-50 border border-zinc-100"
              />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-zinc-800 truncate">
                  {file ? file.name : "Foto caricata"}
                </p>
                <p className="text-[10px] text-zinc-500 mt-0.5">
                  {file
                    ? `${(file.size / (1024 * 1024)).toFixed(2)} MB`
                    : "Immagine esistente"}
                </p>
                <button
                  type="button"
                  onClick={removePhoto}
                  className="mt-2 text-xs font-bold text-rose-600 hover:text-rose-700 underline"
                >
                  Rimuovi o sostituisci foto
                </button>
              </div>
            </div>
          ) : (
            <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-zinc-300 hover:border-amber-500 rounded-2xl cursor-pointer bg-zinc-50/50 hover:bg-amber-50/30 transition-all p-4 text-center">
              <div className="w-10 h-10 rounded-full bg-amber-500/10 flex items-center justify-center text-amber-800 mb-1.5">
                📷
              </div>
              <p className="text-xs font-bold text-zinc-800">
                Clicca per caricare una foto
              </p>
              <p className="text-[10px] text-zinc-500 mt-0.5">
                PNG, JPG o WEBP (consigliata immagine su sfondo chiaro)
              </p>
              <input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />
            </label>
          )}
        </div>

        {/* Note Aggiuntive */}
        <div>
          <label className="block text-xs font-bold text-zinc-800 mb-1.5 uppercase tracking-wide">
            Note o Caratteristiche
          </label>
          <textarea
            placeholder="es. Manca un picchetto, teli impermeabili inclusi..."
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={3}
            className="w-full bg-white/90 border border-zinc-300 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 rounded-xl p-3 text-sm font-medium text-zinc-900 outline-none transition-all placeholder:text-zinc-400 placeholder:font-normal resize-none"
          />
        </div>

        {/* Bottone Salvataggio */}
        <button
          onClick={saveTent}
          disabled={saving || deleting}
          className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-zinc-950 font-black text-sm tracking-wide shadow-lg shadow-amber-500/25 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed border border-amber-300/40 flex items-center justify-center gap-2.5"
        >
          {saving ? (
            <>
              <div className="w-5 h-5 border-2 border-zinc-950/20 border-t-zinc-950 rounded-full animate-spin" />
              <span>Salvataggio modifiche...</span>
            </>
          ) : (
            <>
              <CustomIcon name="tenda-grossa" size={24} />
              <span>Salva Modifiche Tenda</span>
            </>
          )}
        </button>

        {/* Danger Zone */}
        <div className="pt-4 border-t border-zinc-200/80 flex justify-center">
          <button
            type="button"
            onClick={deleteTent}
            disabled={saving || deleting}
            className="py-2.5 px-4 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-700 font-bold text-xs border border-rose-500/20 transition-all active:scale-95 disabled:opacity-50 flex items-center gap-1.5"
          >
            <span>🗑️</span>
            <span>{deleting ? "Eliminazione..." : "Elimina questa tenda"}</span>
          </button>
        </div>
      </div>
    </div>
  );
}