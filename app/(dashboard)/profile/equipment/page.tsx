"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import BackButton from "@/components/ui/BackButton";

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
  { id: "Vestiti e Oggetti Personali", label: "Vestiti e Oggetti Personali", icon: "👕", color: "bg-blue-500/15 text-blue-950 border-blue-500/30" },
  { id: "Cucina e Bagno", label: "Cucina e Bagno", icon: "🍳", color: "bg-orange-500/15 text-orange-950 border-orange-500/30" },
  { id: "Persona e Comfort", label: "Persona e Comfort", icon: "🛋️", color: "bg-emerald-500/15 text-emerald-950 border-emerald-500/30" },
  { id: "Divertimento ed Extra", label: "Divertimento ed Extra", icon: "🎲", color: "bg-purple-500/15 text-purple-950 border-purple-500/30" },
  { id: "Altro", label: "Altro", icon: "📦", color: "bg-zinc-500/15 text-zinc-950 border-zinc-500/30" },
];

export default function EquipmentPage() {
  const [equipment, setEquipment] = useState<EquipmentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Item in fase di modifica (null = nuovo inserimento)
  const [editingItem, setEditingItem] = useState<EquipmentItem | null>(null);

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

  function resetForm() {
    setNome("");
    setCategoria("Attrezzatura Campeggio");
    setQuantita(1);
    setNote("");
    setEditingItem(null);
    setShowForm(false);
  }

  function startEdit(item: EquipmentItem) {
    setEditingItem(item);
    setNome(item.nome);
    setCategoria(item.categoria);
    setQuantita(item.quantita || 1);
    setNote(item.note || "");
    setShowForm(true);
  }

  async function saveEquipment() {
    if (!nome.trim()) {
      alert("Inserisci un nome per l'oggetto!");
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

      if (editingItem) {
        // --- MODIFICA OGGETTO ESISTENTE ---
        const { data, error } = await supabase
          .from("equipment")
          .update({
            nome: nome.trim(),
            categoria,
            quantita: Number(quantita) || 1,
            note: note.trim(),
          })
          .eq("id", editingItem.id)
          .select()
          .single();

        if (error) {
          alert(error.message);
          setSaving(false);
          return;
        }

        if (data) {
          setEquipment((prev) =>
            prev.map((item) => (item.id === data.id ? data : item))
          );
        }
      } else {
        // --- CREAZIONE NUOVO OGGETTO ---
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
          setSaving(false);
          return;
        }

        if (data) {
          setEquipment((prev) => [data, ...prev]);
        }
      }

      resetForm();
    } catch (err) {
      console.error("Errore salvataggio:", err);
    } finally {
      setSaving(false);
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
      if (editingItem?.id === id) resetForm();
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
      <main className="min-h-screen p-4 sm:p-6 pb-28 max-w-xl mx-auto flex flex-col justify-center items-center">
        <div className="w-10 h-10 border-4 border-amber-600/20 border-t-amber-600 rounded-full animate-spin mb-3" />
        <p className="text-xs font-bold text-zinc-800 tracking-wide">
          Apertura inventario attrezzatura...
        </p>
      </main>
    );
  }

  return (
    <main className="min-h-screen p-3 sm:p-5 pb-32 max-w-xl mx-auto text-zinc-900">
      {/* Back Button */}
      <div className="mb-3">
        <BackButton label="Profilo" />
      </div>

      {/* Header Pagina */}
      <div className="flex items-center justify-between gap-3 mb-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-amber-900/10 border border-amber-900/20 text-amber-950 text-[10px] font-black uppercase tracking-wider mb-1 backdrop-blur-md">
            <span>🧰 Personal Kit</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-zinc-950 tracking-tight flex items-center gap-2">
            La Mia Attrezzatura
          </h1>
          {equipment.length > 0 && (
            <p className="text-xs font-bold text-zinc-600 mt-0.5 flex items-center gap-2">
              <span>{totalTypesCount} voci</span>
              <span>•</span>
              <span className="text-amber-800 font-extrabold">{totalPiecesCount} pezzi totali 🎒</span>
            </p>
          )}
        </div>

        {/* Pulsante Apri Form */}
        <button
          onClick={() => {
            if (showForm) resetForm();
            else setShowForm(true);
          }}
          className={`h-10 px-3.5 rounded-xl font-extrabold text-xs shadow-xs active:scale-95 transition-all flex items-center gap-1.5 shrink-0 border ${
            showForm
              ? "bg-zinc-900 text-white border-zinc-800"
              : "bg-amber-500/20 hover:bg-amber-500/30 text-amber-950 border-amber-500/30"
          }`}
        >
          <span>{showForm ? "✕" : "➕"}</span>
          <span className="hidden sm:inline">{showForm ? "Chiudi" : "Aggiungi"}</span>
        </button>
      </div>

      {/* FORM AGGIUNTA / MODIFICA OGGETTO */}
      {showForm && (
        <div className="mb-5 bg-white border border-amber-500/30 rounded-2xl p-4 shadow-lg backdrop-blur-md space-y-3 transition-all">
          <div className="flex items-center justify-between border-b border-zinc-100 pb-2">
            <h2 className="text-xs font-black uppercase text-zinc-900 flex items-center gap-1.5">
              <span>{editingItem ? "✏️" : "➕"}</span>
              <span>{editingItem ? "Modifica Oggetto" : "Aggiungi Oggetto"}</span>
            </h2>
            <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-950">
              {editingItem ? "Editing" : "Nuovo"}
            </span>
          </div>

          {/* Nome Oggetto */}
          <div>
            <label className="block text-[10px] font-black text-zinc-700 mb-1 uppercase tracking-wide">
              Nome Oggetto *
            </label>
            <input
              placeholder="es. Torcia frontale, Maglietta termica..."
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              className="w-full bg-zinc-50 border border-zinc-200 focus:border-amber-500 focus:bg-white rounded-xl p-2.5 text-sm font-semibold text-zinc-900 outline-none transition-all placeholder:text-zinc-400"
            />
          </div>

          {/* Categoria e Quantità */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] font-black text-zinc-700 mb-1 uppercase tracking-wide">
                Categoria
              </label>
              <select
                value={categoria}
                onChange={(e) => setCategoria(e.target.value)}
                className="w-full bg-zinc-50 border border-zinc-200 focus:border-amber-500 focus:bg-white rounded-xl p-2.5 text-xs font-bold text-zinc-900 outline-none cursor-pointer"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.icon} {cat.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-black text-zinc-700 mb-1 uppercase tracking-wide">
                Quantità
              </label>
              <div className="flex items-center bg-zinc-100 rounded-xl border border-zinc-200 p-1 h-[40px]">
                <button
                  type="button"
                  onClick={() => setQuantita(Math.max(1, quantita - 1))}
                  className="w-8 h-full rounded-lg bg-white shadow-2xs text-zinc-800 font-bold text-sm active:scale-95 transition-all flex items-center justify-center"
                >
                  -
                </button>
                <span className="flex-1 text-center font-black text-zinc-900 text-xs">
                  {quantita} {quantita === 1 ? "pezzo" : "pezzi"}
                </span>
                <button
                  type="button"
                  onClick={() => setQuantita(quantita + 1)}
                  className="w-8 h-full rounded-lg bg-white shadow-2xs text-zinc-800 font-bold text-sm active:scale-95 transition-all flex items-center justify-center"
                >
                  +
                </button>
              </div>
            </div>
          </div>

          {/* Note */}
          <div>
            <label className="block text-[10px] font-black text-zinc-700 mb-1 uppercase tracking-wide">
              Note
            </label>
            <input
              placeholder="es. Riposto nello zaino blu..."
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full bg-zinc-50 border border-zinc-200 focus:border-amber-500 focus:bg-white rounded-xl p-2.5 text-xs font-medium text-zinc-900 outline-none transition-all placeholder:text-zinc-400"
            />
          </div>

          {/* Pulsanti Azione Form */}
          <div className="flex gap-2 pt-1">
            <button
              onClick={saveEquipment}
              disabled={saving}
              className="flex-1 py-2.5 px-4 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-950 border border-amber-500/30 font-black text-xs tracking-wide shadow-xs active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-1.5"
            >
              {saving ? (
                <span>Salvataggio...</span>
              ) : (
                <>
                  <span>📦</span>
                  <span>{editingItem ? "Salva Modifiche" : "Aggiungi all'Inventario"}</span>
                </>
              )}
            </button>

            {editingItem && (
              <button
                onClick={resetForm}
                className="py-2.5 px-3 rounded-xl bg-zinc-100 hover:bg-zinc-200 text-zinc-700 font-bold text-xs transition-all"
              >
                Annulla
              </button>
            )}
          </div>
        </div>
      )}

      {/* BARRA FILTRI CATEGORIA */}
      {equipment.length > 0 && (
        <div className="mb-4 overflow-x-auto no-scrollbar flex items-center gap-1.5 pb-1">
          <button
            onClick={() => setSelectedFilter("Tutti")}
            className={`px-3 py-1 rounded-full text-xs font-extrabold transition-all shrink-0 border ${
              selectedFilter === "Tutti"
                ? "bg-zinc-950 text-white border-zinc-950 shadow-2xs"
                : "bg-white/80 text-zinc-700 border-white hover:bg-white"
            }`}
          >
            Tutti ({equipment.length})
          </button>

          {CATEGORIES.map((cat) => {
            const count = equipment.filter((i) => i.categoria === cat.id).length;
            if (count === 0) return null;

            const isSelected = selectedFilter === cat.id;

            return (
              <button
                key={cat.id}
                onClick={() => setSelectedFilter(cat.id)}
                className={`px-2.5 py-1 rounded-full text-xs font-extrabold transition-all shrink-0 border flex items-center gap-1 ${
                  isSelected
                    ? "bg-zinc-950 text-white border-zinc-950 shadow-2xs"
                    : "bg-white/80 text-zinc-800 border-white hover:bg-white"
                }`}
              >
                <span>{cat.icon}</span>
                <span>{cat.label}</span>
                <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-zinc-200/60 text-zinc-900 font-black">
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      )}

      {/* STATO VUOTO */}
      {equipment.length === 0 && !showForm && (
        <div className="bg-white/80 border border-white rounded-2xl p-6 text-center text-zinc-900 shadow-sm backdrop-blur-md">
          <div className="w-14 h-14 mx-auto mb-2 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-2xl">
            🎒
          </div>
          <h3 className="text-sm font-black text-zinc-900 mb-0.5">
            Inventario Vuoto
          </h3>
          <p className="text-xs text-zinc-600 max-w-xs mx-auto mb-4">
            Non hai ancora registrato nessun oggetto personale. Aggiungi il tuo primo kit!
          </p>
          <button
            onClick={() => setShowForm(true)}
            className="py-2 px-4 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-950 border border-amber-500/30 text-xs font-black transition-all active:scale-95 shadow-xs"
          >
            Aggiungi Oggetto
          </button>
        </div>
      )}

      {/* LISTA COMPATTA AD ELENCO */}
      <div className="flex flex-col gap-2">
        {filteredEquipment.map((item) => {
          const meta = getCategoryMeta(item.categoria);
          const isDeleting = deletingId === item.id;
          const isBeingEdited = editingItem?.id === item.id;

          return (
            <div
              key={item.id}
              className={`bg-white/90 border rounded-xl p-2.5 sm:p-3 backdrop-blur-md shadow-2xs flex items-center justify-between gap-2.5 transition-all ${
                isBeingEdited
                  ? "border-amber-500 ring-2 ring-amber-500/20"
                  : "border-slate-200/80 hover:border-slate-300"
              }`}
            >
              {/* SX: Icona, Titolo e Note */}
              <div className="flex items-center gap-2.5 min-w-0 flex-1">
                <span
                  className="text-lg shrink-0 p-1.5 rounded-lg bg-zinc-100/80 border border-zinc-200/60"
                  title={meta.label}
                >
                  {meta.icon}
                </span>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-xs sm:text-sm font-black text-zinc-900 truncate">
                      {item.nome}
                    </span>
                    <span className="text-[10px] font-black px-1.5 py-0.2 rounded-md bg-zinc-900 text-white shrink-0">
                      x{item.quantita}
                    </span>
                  </div>

                  {item.note && (
                    <p className="text-[11px] font-medium text-zinc-500 truncate leading-tight mt-0.5">
                      {item.note}
                    </p>
                  )}
                </div>
              </div>

              {/* DX: Pulsanti Azione (Modifica & Elimina) */}
              <div className="flex items-center gap-1 shrink-0">
                <button
                  onClick={() => startEdit(item)}
                  className="w-8 h-8 rounded-lg bg-zinc-100 hover:bg-zinc-200 text-zinc-700 flex items-center justify-center text-xs font-bold transition-all active:scale-90"
                  title="Modifica"
                >
                  ✏️
                </button>

                <button
                  onClick={() => deleteEquipment(item.id)}
                  disabled={isDeleting}
                  className="w-8 h-8 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200/60 flex items-center justify-center text-xs font-bold transition-all active:scale-90 disabled:opacity-50"
                  title="Elimina"
                >
                  {isDeleting ? "..." : "✕"}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </main>
  );
}