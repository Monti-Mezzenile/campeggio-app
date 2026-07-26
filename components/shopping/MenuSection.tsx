"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";

export default function MenuSection({
  eventId,
  menu,
  setMenu,
  canEditMenu,
}: {
  eventId: string;
  menu: any;
  setMenu: (value: any) => void;
  canEditMenu: boolean;
}) {
  const [editingMenu, setEditingMenu] = useState(false);
  const [savingMenu, setSavingMenu] = useState(false);
  const [menuSaved, setMenuSaved] = useState(false);

  async function saveMenu() {
    setSavingMenu(true);

    const { error } = await supabase
      .from("event_menus")
      .update({
        venerdi_cena: menu?.venerdi_cena || "",
        sabato_pranzo: menu?.sabato_pranzo || "",
        sabato_cena: menu?.sabato_cena || "",
        domenica_pranzo: menu?.domenica_pranzo || "",
        updated_at: new Date(),
      })
      .eq("event_id", eventId);

    if (error) {
      alert(error.message);
      setSavingMenu(false);
      return;
    }

    setSavingMenu(false);
    setEditingMenu(false);
    setMenuSaved(true);

    setTimeout(() => {
      setMenuSaved(false);
    }, 3000);
  }

  const pasti = [
    { key: "venerdi_cena", titolo: "🍕 Venerdì cena" },
    { key: "sabato_pranzo", titolo: "🥪 Sabato pranzo" },
    { key: "sabato_cena", titolo: "🍖 Sabato cena" },
    { key: "domenica_pranzo", titolo: "☕ Domenica pranzo" },
  ];

  return (
    <div className="flex flex-col gap-2">
      <div className="grid grid-cols-1 gap-1.5">
        {pasti.map((pasto) => (
          <div
            key={pasto.key}
            className="bg-white/80 backdrop-blur-md border border-white rounded-xl p-2 shadow-2xs"
          >
            <h3 className="text-[10px] font-black uppercase text-[#1b2b25]/70 mb-1">
              {pasto.titolo}
            </h3>

            {canEditMenu && editingMenu ? (
              <textarea
                value={menu?.[pasto.key] || ""}
                onChange={(e) =>
                  setMenu({
                    ...menu,
                    [pasto.key]: e.target.value,
                  })
                }
                className="w-full bg-white border border-white rounded-lg p-1.5 text-xs text-[#1b2b25] focus:outline-hidden min-h-[42px] resize-y"
                placeholder="Inserisci il menù..."
              />
            ) : (
              <div className="bg-white/60 border border-white/60 rounded-lg p-1.5 text-xs font-medium text-[#1b2b25] whitespace-pre-line min-h-[30px]">
                {menu?.[pasto.key] || (
                  <span className="text-[#1b2b25]/40 italic">Da definire</span>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {canEditMenu && (
        <div className="mt-0.5 flex flex-col gap-1">
          {!editingMenu ? (
            <button
              onClick={() => setEditingMenu(true)}
              className="w-full bg-[#1b2b25] text-white rounded-xl py-1.5 text-xs font-black active:scale-98 transition shadow-2xs"
            >
              ✏️ Modifica menù
            </button>
          ) : (
            <button
              onClick={saveMenu}
              disabled={savingMenu}
              className="w-full bg-[#1b2b25] text-white rounded-xl py-1.5 text-xs font-black active:scale-98 transition shadow-2xs disabled:opacity-50"
            >
              {savingMenu ? "Salvataggio..." : "💾 Salva menù"}
            </button>
          )}

          {menuSaved && (
            <div className="text-center text-emerald-700 text-[10px] font-black">
              ✅ Menù salvato con successo!
            </div>
          )}
        </div>
      )}
    </div>
  );
}