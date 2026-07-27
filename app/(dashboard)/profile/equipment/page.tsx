"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import BackButton from "@/components/ui/BackButton";
import CustomIcon from "@/components/ui/CustomIcon";

interface EquipmentItem {
  id: string;
  nome: string;
  categoria: string;
  quantita: number;
  note?: string;
  created_at?: string;
}

// Configurazione Categorie con Icone e Colori dedicati
const CATEGORIES = [
  { id: "Attrezzatura Campeggio", label: "Attrezzatura Campeggio", icon: "🎪", color: "bg-amber-500/15 text-amber-950 border-amber-500/30" },
  { id: "Cucina e Bagno", label: "Cucina e Bagno", icon: "🍳", color: "bg-orange-500/15 text-orange-950 border-orange-500/30" },
  { id: "Persona e Comfort", label: "Persona e Comfort", icon: "🛋️", color: "bg-emerald-500/15 text-emerald-950 border-emerald-500/30" },
  { id: "Divertimento ed Extra", label: "Divertimento ed Extra", icon: "🎲", color: "bg-purple-500/15 text-purple-950 border-purple-500/30" },
  { id: "Altro", label: "Altro", icon: "📦", color: "bg-zinc-500/15 text-zinc-950 border-zinc-500/30" },
];

export default function EquipmentPage() {
  const [equipment, setEquipment] = useState<EquipmentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Form State
  const [showForm, setShowForm] = useState(false);
  const [nome, setNome] = useState("");
  const [categoria, setCategoria] = useState("Attrezzatura Campeggio");
  const [quantita, setQuantita] = useState(1);
  const [note, setNote] = useState("");

  // Filter State
  const [selectedFilter, setSelectedFilter] = useState<string>("Tutti");

  async function loadEquipment() {
    setLoading(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from("equipment")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Errore caricamento attrezzatura:", error);
      }

      setEquipment(data || []);
    } catch (err) {
      console.error("Errore inatteso:", err);
    } finally {
      setLoading(false);
    }
  }

  async function addEquipment() {
    if (!nome.trim()) {
      alert("Inserisci un nome per l'oggetto!");
      return;
    }

    setAdding(true);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        alert("Utente non autenticato");
        setAdding(false);
        return;
      }

      const newItem = {
        user_id: user.id,
        nome: nome.trim(),
        categoria,
        quantita: Number(quantita) || 1,
        note: note.trim(),
      };

      const { data, error } = await supabase
        .from("equipment")
        .insert(newItem)
        .select()
        .single();

      if (error) {
        alert(error.message);
        setAdding(false);
        return;
      }

      if (data) {
        setEquipment((prev) => [data, ...prev]);
      }

      // Reset form
      setNome("");
      setCategoria("Attrezzatura Campeggio");
      setQuantita(1);
      setNote("");
      setShowForm(false);
    } catch (err) {
      console.error("Errore inserimento:", err);
    } finally {
      setAdding(false);
    }
  }

  async function deleteEquipment(id: string) {
    const ok = confirm("Vuoi davvero rimuovere questo oggetto dal tuo inventario?");
    if (!ok) return;

    setDeletingId(id);

    try {
      const { error } = await supabase.from("equipment").delete().eq("id", id);

      if (error) {
        alert(error.message);
        setDeletingId(null);
        return;
      }

      setEquipment((prev) => prev.filter((item) => item.id !== id));
    } catch (err) {
      console.error("Errore eliminazione:", err);
    } finally {
      setDeletingId(null);
    }
  }

  useEffect(() => {
    loadEquipment();
  }, []);

  // Calcoli Statistici
  const totalTypesCount = equipment.length;
  const totalPiecesCount = equipment.reduce(
    (acc, curr) => acc + (Number(curr.quantita) || 1),
    0
  );

  // Filtraggio
  const filteredEquipment =
    selectedFilter === "Tutti"
      ? equipment
      : equipment.filter((item) => item.categoria === selectedFilter);

  const getCategoryMeta = (catName: string) => {
    return (
      CATEGORIES.find((c) => c.id === catName) || {
        label: catName,
        icon: "📦",
        color: "bg-zinc-500/15 text-zinc-950 border-zinc-500/30",
      }
    );
  };

  if (loading) {
    return (
      <main className="min-h-screen p-4 sm:p-6 pb-28 max-w-3xl mx-auto flex flex-col justify-center items-center">
        <div className="w-10 h-10 border-4 border-amber-600/20 border-t-amber-600 rounded-full animate-spin mb-3" />
        <p className="text-xs font-bold text-zinc-800 tracking-wide">
          Apertura inventario attrezzatura...
        </p>
      </main>
    );
  }

  return (
    <main className="min-h-screen p-4 sm:p-6 pb-32 max-w-3xl mx-auto text-zinc-900">
      {/* Back Button */}
      <div className="mb-4">
        <BackButton label="Profilo" />
      </div>

      {/* Header Pagina */}
      <div className="flex items-center justify-between gap-3 mb-6">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-900/10 border border-amber-900/20 text-amber-950 text-[11px] font-black uppercase tracking-wider mb-1.5 backdrop-blur-md">
            <span>🧰 Personal Kit</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-zinc-950 tracking-tight flex items-center gap-2">
            La Mia Attrezzatura
          </h1>
          {equipment.length > 0 && (
            <p className="text-xs font-bold text-zinc-700 mt-1 flex items-center gap-2">
              <span>{totalTypesCount} {totalTypesCount === 1 ? "oggetto" : "oggetti"}</span>
              <span>•</span>
              <span className="text-amber-800 font-extrabold">{totalPiecesCount} pezzi totali 🎒</span>
            </p>
          )}
        </div>

        {/* Pulsante Apri Form */}
        <button
          onClick={() => setShowForm(!showForm)}
          className={`h-12 px-4 rounded-2xl font-extrabold text-xs shadow-lg active:scale-95 transition-all flex items-center gap-2 shrink-0 border ${
            showForm
              ? "bg-zinc-900 text-white border-zinc-800"
              : "bg-amber-500/20 hover:bg-amber-500/30 text-amber-950 border border-amber-500/30 border-amber-300/40 shadow-amber-500/20"
          }`}
        >
          <span>{showForm ? "✕" : "➕"}</span>
          <span className="hidden sm:inline">{showForm ? "Chiudi" : "Aggiungi"}</span>
        </button>
      </div>

      {/* FORM AGGIUNTA OGGETTO (Espandibile) */}
      {showForm && (
        <div className="mb-8 bg-white/90 border border-amber-500/30 rounded-3xl p-5 sm:p-6 shadow-xl backdrop-blur-md space-y-4 transition-all">
          <div className="flex items-center justify-between border-b border-zinc-200/80 pb-3">
            <h2 className="text-base font-extrabold text-zinc-900 flex items-center gap-2">
              <span>➕</span>
              <span>Aggiungi Nuovo Oggetto</span>
            </h2>
            <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-950">
              Nuovo
            </span>
          </div>

          {/* Nome Oggetto */}
          <div>
            <label className="block text-xs font-bold text-zinc-800 mb-1 uppercase tracking-wide">
              Nome Oggetto <span className="text-rose-500">*</span>
            </label>
            <input
              placeholder="es. Torcia frontale, Sedia da campeggio, Gavetta..."
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              className="w-full bg-white border border-zinc-300 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 rounded-xl p-3 text-sm font-semibold text-zinc-900 outline-none transition-all placeholder:text-zinc-400 placeholder:font-normal"
            />
          </div>

          {/* Categoria e Quantità (Grid 2 Colonne) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-zinc-800 mb-1 uppercase tracking-wide">
                Categoria
              </label>
              <select
                value={categoria}
                onChange={(e) => setCategoria(e.target.value)}
                className="w-full bg-white border border-zinc-300 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 rounded-xl p-3 text-sm font-bold text-zinc-900 outline-none transition-all cursor-pointer"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.icon} {cat.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-zinc-800 mb-1 uppercase tracking-wide">
                Quantità Pezzi
              </label>
              <div className="flex items-center bg-zinc-100 rounded-xl border border-zinc-300 p-1 h-[46px]">
                <button
                  type="button"
                  onClick={() => setQuantita(Math.max(1, quantita - 1))}
                  className="w-9 h-full rounded-lg bg-white shadow-sm text-zinc-800 font-bold text-lg hover:bg-zinc-50 active:scale-95 transition-all flex items-center justify-center"
                >
                  -
                </button>
                <span className="flex-1 text-center font-black text-zinc-900 text-sm">
                  {quantita} {quantita === 1 ? "pezzo" : "pezzi"}
                </span>
                <button
                  type="button"
                  onClick={() => setQuantita(quantita + 1)}
                  className="w-9 h-full rounded-lg bg-white shadow-sm text-zinc-800 font-bold text-lg hover:bg-zinc-50 active:scale-95 transition-all flex items-center justify-center"
                >
                  +
                </button>
              </div>
            </div>
          </div>

          {/* Note */}
          <div>
            <label className="block text-xs font-bold text-zinc-800 mb-1 uppercase tracking-wide">
              Note o Dettagli
            </label>
            <textarea
              placeholder="es. Batterie AAA non incluse, riposto nello zaino blu..."
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={2}
              className="w-full bg-white border border-zinc-300 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 rounded-xl p-3 text-sm font-medium text-zinc-900 outline-none transition-all placeholder:text-zinc-400 placeholder:font-normal resize-none"
            />
          </div>

          {/* Tasto Salvataggio */}
          <button
            onClick={addEquipment}
            disabled={adding}
            className="w-full py-3.5 px-5 rounded-2xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-950 border border-amber-500/30 font-black text-sm tracking-wide shadow-md active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-2 border border-amber-300/40"
          >
            {adding ? (
              <>
                <div className="w-4 h-4 border-2 border-zinc-950/20 border-t-zinc-950 rounded-full animate-spin" />
                <span>Salvataggio...</span>
              </>
            ) : (
              <>
                <span>📦</span>
                <span>Salva Nell'Inventario</span>
              </>
            )}
          </button>
        </div>
      )}

      {/* BARRA FILTRI CATEGORIA (Scroll Orizzontale) */}
      {equipment.length > 0 && (
        <div className="mb-5 overflow-x-auto no-scrollbar flex items-center gap-2 pb-1">
          {/* Opzione Tutti */}
          <button
            onClick={() => setSelectedFilter("Tutti")}
            className={`px-3.5 py-1.5 rounded-full text-xs font-extrabold transition-all shrink-0 border ${
              selectedFilter === "Tutti"
                ? "bg-zinc-950 text-white border-zinc-950 shadow-sm"
                : "bg-white/80 text-zinc-700 border-white/90 hover:bg-white"
            }`}
          >
            Tutti ({equipment.length})
          </button>

          {CATEGORIES.map((cat) => {
            const count = equipment.filter((i) => i.categoria === cat.id).length;
            if (count === 0) return null; // Nascondi se vuoto per pulizia

            const isSelected = selectedFilter === cat.id;

            return (
              <button
                key={cat.id}
                onClick={() => setSelectedFilter(cat.id)}
                className={`px-3 py-1.5 rounded-full text-xs font-extrabold transition-all shrink-0 border flex items-center gap-1.5 ${
                  isSelected
                    ? "bg-zinc-950 text-white border-zinc-950 shadow-sm"
                    : "bg-white/80 text-zinc-800 border-white/90 hover:bg-white"
                }`}
              >
                <span>{cat.icon}</span>
                <span>{cat.label}</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-zinc-200/60 text-zinc-900 font-black">
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      )}

      {/* STATO VUOTO */}
      {equipment.length === 0 && !showForm && (
        <div className="bg-white/80 border border-white/90 rounded-3xl p-8 text-center text-zinc-900 shadow-lg backdrop-blur-md">
          <div className="w-20 h-20 mx-auto mb-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-3xl">
            🎒
          </div>
          <h3 className="text-lg font-bold text-zinc-900 mb-1">
            Inventario Vuoto
          </h3>
          <p className="text-xs text-zinc-600 max-w-xs mx-auto mb-5">
            Non hai ancora registrato nessun oggetto personali. Aggiungi il tuo primo kit da campeggio!
          </p>
          <button
            onClick={() => setShowForm(true)}
            className="py-2.5 px-5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-950 border border-amber-500/30 text-xs font-bold transition-all active:scale-95 shadow-md"
          >
            Aggiungi il tuo primo oggetto
          </button>
        </div>
      )}

      {/* LISTA CARD ATTREZZATURA */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
        {filteredEquipment.map((item) => {
          const meta = getCategoryMeta(item.categoria);
          const isDeleting = deletingId === item.id;

          return (
            <div
              key={item.id}
              className="bg-white/80 border border-white/90 rounded-2xl p-4 backdrop-blur-md shadow-md flex flex-col justify-between hover:shadow-lg transition-all text-zinc-900"
            >
              <div>
                {/* Header Card: Categoria Badge + Quantità */}
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span
                    className={`inline-flex items-center gap-1 text-[10px] font-black px-2.5 py-0.5 rounded-md border ${meta.color}`}
                  >
                    <span>{meta.icon}</span>
                    <span>{meta.label}</span>
                  </span>

                  <span className="text-xs font-black px-2 py-0.5 rounded-md bg-zinc-900 text-white shadow-xs">
                    x{item.quantita}
                  </span>
                </div>

                {/* Titolo Oggetto */}
                <h2 className="text-base font-black text-zinc-950 leading-tight">
                  {item.nome}
                </h2>

                {/* Note se presenti */}
                {item.note && (
                  <p className="text-xs text-zinc-600 mt-2 italic bg-zinc-100/80 p-2 rounded-xl border border-zinc-200/60 line-clamp-3">
                    "{item.note}"
                  </p>
                )}
              </div>

              {/* Footer con Azione Eliminazione */}
              <div className="flex justify-end pt-3 mt-3 border-t border-zinc-200/60">
                <button
                  onClick={() => deleteEquipment(item.id)}
                  disabled={isDeleting}
                  className="py-1 px-2.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-700 font-bold text-xs border border-rose-500/20 transition-all active:scale-95 disabled:opacity-50 flex items-center gap-1"
                  title="Elimina oggetto"
                >
                  {isDeleting ? (
                    <span className="text-[10px]">Eliminazione...</span>
                  ) : (
                    <>
                      <span>🗑️</span>
                      <span>Rimuovi</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </main>
  );
}