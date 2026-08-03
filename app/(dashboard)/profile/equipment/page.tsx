"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import BackButton from "@/components/ui/BackButton";

interface EquipmentItem {
  id: string;
  nome: string;
  categoria: string;
  quantita: number;
  stagione?: "estivo" | "invernale" | "entrambi" | null;
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

const SEASONS = [
  { id: "estivo", label: "Estivo", icon: "☀️" },
  { id: "invernale", label: "Invernale", icon: "❄️" },
  { id: "entrambi", label: "Entrambi", icon: "🔄" },
];

export default function EquipmentPage() {
  const [equipment, setEquipment] = useState<EquipmentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Stati per la gestione Form
  const [isAdding, setIsAdding] = useState(false);
  const [editingItem, setEditingItem] = useState<EquipmentItem | null>(null);

  // Campi del Form
  const [nome, setNome] = useState("");
  const [categoria, setCategoria] = useState("Attrezzatura Campeggio");
  const [quantita, setQuantita] = useState(1);
  const [stagione, setStagione] = useState<"estivo" | "invernale" | "entrambi" | null>(null);
  const [note, setNote] = useState("");

  // Filter States
  const [selectedFilter, setSelectedFilter] = useState<string>("Tutti");
  const [seasonFilter, setSeasonFilter] = useState<string>("tutti");

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
    setStagione(null); 
    setNote("");
    setEditingItem(null);
    setIsAdding(false);
  }

  function startEdit(item: EquipmentItem) {
    setIsAdding(false);
    setEditingItem(item);
    setNome(item.nome);
    setCategoria(item.categoria);
    setQuantita(item.quantita || 1);
    setStagione(item.stagione || null);
    setNote(item.note || "");
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
        const { data, error } = await supabase
          .from("equipment")
          .update({
            nome: nome.trim(),
            categoria,
            quantita: Number(quantita) || 1,
            stagione,
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
        const newItem = {
          user_id: user.id,
          nome: nome.trim(),
          categoria,
          quantita: Number(quantita) || 1,
          stagione,
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

  const totalTypesCount = equipment.length;
  const totalPiecesCount = equipment.reduce(
    (acc, curr) => acc + (Number(curr.quantita) || 1),
    0
  );

  const filteredEquipment = equipment.filter((item) => {
    const matchCategory =
      selectedFilter === "Tutti" || item.categoria === selectedFilter;

    const matchSeason =
      seasonFilter === "tutti" ||
      item.stagione === "entrambi" ||
      item.stagione === seasonFilter;

    return matchCategory && matchSeason;
  });

  const getCategoryMeta = (catName: string) => {
    return (
      CATEGORIES.find((c) => c.id === catName) || {
        label: catName,
        icon: "📦",
        color: "bg-zinc-500/15 text-zinc-950 border-zinc-500/30",
      }
    );
  };

  const getSeasonBadge = (stg?: string | null) => {
    switch (stg) {
      case "estivo":
        return { label: "Estivo", icon: "☀️", color: "bg-amber-100 text-amber-800" };
      case "invernale":
        return { label: "Invernale", icon: "❄️", color: "bg-blue-100 text-blue-800" };
      case "entrambi":
        return { label: "Tutto l'anno", icon: "🔄", color: "bg-zinc-100 text-zinc-700" };
      default:
        return null;
    }
  };

  const renderForm = (isEdit: boolean) => (
    <div
      className={
        isEdit
          ? "space-y-3 pt-4 mt-2 border-t border-amber-500/30 animate-in fade-in slide-in-from-top-2"
          : "mb-5 bg-white border border-amber-500/30 rounded-2xl p-4 shadow-lg backdrop-blur-md space-y-3 transition-all animate-in fade-in"
      }
    >
      <div className="flex items-center justify-between border-b border-zinc-100 pb-2">
        <h2 className="text-xs font-black uppercase text-zinc-900 flex items-center gap-1.5">
          <span>{isEdit ? "✏️" : "➕"}</span>
          <span>{isEdit ? "Modifica Oggetto" : "Aggiungi Oggetto"}</span>
        </h2>
        <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-950">
          {isEdit ? "Editing" : "Nuovo"}
        </span>
      </div>

      <div>
        <label className="block text-[10px] font-black text-zinc-700 mb-1 uppercase tracking-wide">
          Nome Oggetto *
        </label>
        <input
          placeholder="es. Torcia frontale, Sacco a pelo..."
          value={nome}
          onChange={(e) => setNome(e.target.value)}
          className="w-full bg-zinc-50 border border-zinc-200 focus:border-amber-500 focus:bg-white rounded-xl p-2.5 text-sm font-semibold text-zinc-900 outline-none transition-all placeholder:text-zinc-400"
        />
      </div>

      <div>
        <div className="flex items-center justify-between mb-1">
          <label className="block text-[10px] font-black text-zinc-700 uppercase tracking-wide">
            Stagione <span className="text-zinc-400 font-normal">(Opzionale)</span>
          </label>
          {stagione && (
            <button
              type="button"
              onClick={() => setStagione(null)}
              className="text-[10px] font-bold text-amber-800 hover:underline"
            >
              Rimuovi tag
            </button>
          )}
        </div>
        <div className="grid grid-cols-3 gap-1.5 p-1 bg-zinc-100 rounded-xl border border-zinc-200">
          {SEASONS.map((s) => {
            const isSelected = stagione === s.id;
            return (
              <button
                key={s.id}
                type="button"
                onClick={() =>
                  setStagione(isSelected ? null : (s.id as "estivo" | "invernale" | "entrambi"))
                }
                className={`py-1.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1 ${
                  isSelected
                    ? "bg-white text-zinc-900 shadow-2xs border border-zinc-200 font-extrabold"
                    : "text-zinc-500 hover:text-zinc-800"
                }`}
              >
                <span>{s.icon}</span>
                <span>{s.label}</span>
              </button>
            );
          })}
        </div>
      </div>

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
              <span>{isEdit ? "Salva Modifiche" : "Aggiungi all'Inventario"}</span>
            </>
          )}
        </button>

        <button
          onClick={resetForm}
          className="py-2.5 px-3 rounded-xl bg-zinc-100 hover:bg-zinc-200 text-zinc-700 font-bold text-xs transition-all"
        >
          Annulla
        </button>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="w-full py-16 p-4 sm:p-6 max-w-xl mx-auto flex flex-col justify-center items-center">
        <div className="w-10 h-10 border-4 border-amber-600/20 border-t-amber-600 rounded-full animate-spin mb-3" />
        <p className="text-xs font-bold text-zinc-800 tracking-wide">
          Apertura inventario attrezzatura...
        </p>
      </div>
    );
  }

  return (
    <div className="w-full p-3 sm:p-5 max-w-xl mx-auto text-zinc-900">
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

        <button
          onClick={() => {
            if (isAdding) {
              setIsAdding(false);
            } else {
              resetForm();
              setIsAdding(true);
            }
          }}
          className={`h-10 px-3.5 rounded-xl font-extrabold text-xs shadow-xs active:scale-95 transition-all flex items-center gap-1.5 shrink-0 border ${
            isAdding
              ? "bg-zinc-900 text-white border-zinc-800"
              : "bg-amber-500/20 hover:bg-amber-500/30 text-amber-950 border-amber-500/30"
          }`}
        >
          <span>{isAdding ? "✕" : "➕"}</span>
          <span className="hidden sm:inline">{isAdding ? "Annulla" : "Aggiungi"}</span>
        </button>
      </div>

      {/* FORM AGGIUNTA NUOVO OGGETTO */}
      {isAdding && renderForm(false)}

      {/* SELEZIONE FILTRO STAGIONALE */}
      {equipment.length > 0 && (
        <div className="mb-3 grid grid-cols-3 gap-1.5 bg-zinc-200/60 p-1 rounded-2xl border border-zinc-300/40 backdrop-blur-md">
          <button
            onClick={() => setSeasonFilter("tutti")}
            className={`py-1.5 px-2 rounded-xl text-xs font-extrabold transition-all flex items-center justify-center gap-1 ${
              seasonFilter === "tutti"
                ? "bg-zinc-950 text-white shadow-2xs"
                : "text-zinc-700 hover:bg-white/40"
            }`}
          >
            <span>🎒</span>
            <span>Tutti</span>
          </button>
          <button
            onClick={() => setSeasonFilter("estivo")}
            className={`py-1.5 px-2 rounded-xl text-xs font-extrabold transition-all flex items-center justify-center gap-1 ${
              seasonFilter === "estivo"
                ? "bg-amber-500 text-amber-950 shadow-2xs"
                : "text-zinc-700 hover:bg-white/40"
            }`}
          >
            <span>☀️</span>
            <span>Estivo</span>
          </button>
          <button
            onClick={() => setSeasonFilter("invernale")}
            className={`py-1.5 px-2 rounded-xl text-xs font-extrabold transition-all flex items-center justify-center gap-1 ${
              seasonFilter === "invernale"
                ? "bg-blue-600 text-white shadow-2xs"
                : "text-zinc-700 hover:bg-white/40"
            }`}
          >
            <span>❄️</span>
            <span>Invernale</span>
          </button>
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
            Tutte Categorie
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
      {filteredEquipment.length === 0 && !isAdding && (
        <div className="bg-white/80 border border-white rounded-2xl p-6 text-center text-zinc-900 shadow-sm backdrop-blur-md">
          <div className="w-14 h-14 mx-auto mb-2 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-2xl">
            🎒
          </div>
          <h3 className="text-sm font-black text-zinc-900 mb-0.5">
            Nessun Oggetto Trovato
          </h3>
          <p className="text-xs text-zinc-600 max-w-xs mx-auto mb-4">
            Non ci sono oggetti che corrispondono ai filtri selezionati.
          </p>
          <button
            onClick={() => {
              setSelectedFilter("Tutti");
              setSeasonFilter("tutti");
            }}
            className="py-2 px-4 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-950 border border-amber-500/30 text-xs font-black transition-all active:scale-95 shadow-xs"
          >
            Reset Filtri
          </button>
        </div>
      )}

      {/* LISTA COMPATTA AD ELENCO */}
      <div className="flex flex-col gap-2">
        {filteredEquipment.map((item) => {
          const meta = getCategoryMeta(item.categoria);
          const seasonBadge = getSeasonBadge(item.stagione);
          const isDeleting = deletingId === item.id;
          const isBeingEdited = editingItem?.id === item.id;

          return (
            <div
              key={item.id}
              className={`bg-white/90 border rounded-xl p-2.5 sm:p-3 backdrop-blur-md shadow-2xs flex flex-col transition-all ${
                isBeingEdited
                  ? "border-amber-500 ring-2 ring-amber-500/20"
                  : "border-slate-200/80 hover:border-slate-300"
              }`}
            >
              <div className="flex items-center justify-between gap-2.5">
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
                      {seasonBadge && (
                        <span
                          className={`text-[9px] font-extrabold px-1.5 py-0.2 rounded-md shrink-0 flex items-center gap-0.5 ${seasonBadge.color}`}
                        >
                          <span>{seasonBadge.icon}</span>
                          <span>{seasonBadge.label}</span>
                        </span>
                      )}
                    </div>

                    {item.note && (
                      <p className="text-[11px] font-medium text-zinc-500 truncate leading-tight mt-0.5">
                        {item.note}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => startEdit(item)}
                    className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold transition-all active:scale-90 ${
                      isBeingEdited 
                        ? "bg-amber-100 text-amber-700" 
                        : "bg-zinc-100 hover:bg-zinc-200 text-zinc-700"
                    }`}
                    title="Modifica"
                  >
                    ✏️
                  </button>

                  <button
                    onClick={() => deleteEquipment(item.id)}
                    disabled={isDeleting || isBeingEdited}
                    className="w-8 h-8 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200/60 flex items-center justify-center text-xs font-bold transition-all active:scale-90 disabled:opacity-30 disabled:pointer-events-none"
                    title="Elimina"
                  >
                    {isDeleting ? "..." : "✕"}
                  </button>
                </div>
              </div>

              {isBeingEdited && renderForm(true)}
            </div>
          );
        })}
      </div>
    </div>
  );
}