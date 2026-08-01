"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function MediaGrid({
  eventId,
  reloadKey,
}: {
  eventId: string;
  reloadKey: number;
}) {
  const [media, setMedia] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  // Stato per l'elemento aperto a tutto schermo (indice della lista)
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  async function loadUser() {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    setUser(user);

    if (user) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("ruolo")
        .eq("id", user.id)
        .single();

      setIsAdmin(profile?.ruolo === "admin");
    }
  }

  async function loadMedia() {
    setLoading(true);

    const { data, error } = await supabase
      .from("media")
      .select(`
        *,
        profiles:user_id(
          nome
        )
      `)
      .eq("event_id", eventId)
      .order("created_at", { ascending: false });

    if (error) {
      console.log("ERRORE MEDIA:", error);
      setLoading(false);
      return;
    }

    const withUrls = await Promise.all(
      (data || []).map(async (item) => {
        const { data: signed } = await supabase.storage
          .from("event-media")
          .createSignedUrl(item.url, 60 * 60);

        return {
          ...item,
          signedUrl: signed?.signedUrl,
        };
      })
    );

    setMedia(withUrls);
    setLoading(false);
  }

  async function deleteMedia(item: any, e: React.MouseEvent) {
    // 🛑 Impedisce l'apertura del visore a tutto schermo quando si clicca il cestino
    e.stopPropagation();

    const ok = confirm("Eliminare questo file?");

    if (!ok) {
      return;
    }

    const { error: storageError } = await supabase.storage
      .from("event-media")
      .remove([item.url]);

    if (storageError) {
      alert(storageError.message);
      return;
    }

    const { error: dbError } = await supabase
      .from("media")
      .delete()
      .eq("id", item.id);

    if (dbError) {
      alert(dbError.message);
      return;
    }

    // Se l'elemento eliminato era quello aperto nel visore, chiudi il visore
    setSelectedIndex(null);
    loadMedia();
  }

  const handlePrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (selectedIndex !== null && selectedIndex > 0) {
      setSelectedIndex(selectedIndex - 1);
    }
  };

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (selectedIndex !== null && selectedIndex < media.length - 1) {
      setSelectedIndex(selectedIndex + 1);
    }
  };

  useEffect(() => {
    if (eventId) {
      loadUser();
      loadMedia();
    }
  }, [eventId, reloadKey]);

  if (loading) {
    return (
      <div className="grid grid-cols-3 gap-2">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="aspect-square bg-slate-100 rounded-xl animate-pulse"
          />
        ))}
      </div>
    );
  }

  if (media.length === 0) {
    return (
      <div className="bg-white border rounded-xl p-5 text-center text-gray-500 text-sm">
        Nessuna foto o video ancora 📸
      </div>
    );
  }

  const selectedMedia = selectedIndex !== null ? media[selectedIndex] : null;

  return (
    <>
      {/* 🖼️ GRIGLIA MEDIA */}
      <div className="grid grid-cols-3 gap-2">
        {media.map((item, index) => (
          <div
            key={item.id}
            onClick={() => setSelectedIndex(index)}
            className="aspect-square rounded-xl overflow-hidden bg-gray-100 relative cursor-pointer hover:opacity-90 active:scale-95 transition"
          >
            {item.tipo === "foto" ? (
              <img
                src={item.signedUrl}
                alt={item.nome_file || "Foto"}
                className="w-full h-full object-cover"
                loading="lazy"
              />
            ) : (
              <div className="w-full h-full relative flex items-center justify-center bg-black">
                <video
                  src={item.signedUrl}
                  className="w-full h-full object-cover opacity-80"
                  muted
                />
                <span className="absolute text-white text-xl drop-shadow-md">
                  ▶️
                </span>
              </div>
            )}

            {/* 🗑️ PULSANTE ELIMINA */}
            {(user?.id === item.user_id || isAdmin) && (
              <button
                onClick={(e) => deleteMedia(item, e)}
                className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-7 h-7 flex items-center justify-center text-xs shadow-md z-10 hover:bg-red-600 transition"
                title="Elimina"
              >
                🗑️
              </button>
            )}
          </div>
        ))}
      </div>

      {/* 🔍 VISORE FULLSCREEN (EDGE-TO-EDGE) */}
      {selectedMedia && (
        <div
          onClick={() => setSelectedIndex(null)}
          className="fixed inset-0 z-[999] bg-black/95 backdrop-blur-xl flex items-center justify-center animate-in fade-in duration-200 select-none"
        >
          {/* Tasto Chiusura (X) */}
          <button
            onClick={() => setSelectedIndex(null)}
            className="absolute top-4 right-4 sm:top-6 sm:right-6 w-11 h-11 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center text-xl font-bold backdrop-blur-md transition z-50"
          >
            ✕
          </button>

          {/* Freccia Indietro */}
          {selectedIndex! > 0 && (
            <button
              onClick={handlePrev}
              className="absolute left-2 sm:left-6 w-12 h-12 rounded-full bg-black/40 hover:bg-black/60 text-white flex items-center justify-center text-3xl pb-1 font-black backdrop-blur-md transition z-50"
            >
              ‹
            </button>
          )}

          {/* Freccia Avanti */}
          {selectedIndex! < media.length - 1 && (
            <button
              onClick={handleNext}
              className="absolute right-2 sm:right-6 w-12 h-12 rounded-full bg-black/40 hover:bg-black/60 text-white flex items-center justify-center text-3xl pb-1 font-black backdrop-blur-md transition z-50"
            >
              ›
            </button>
          )}

          {/* Contenuto Media a Tutto Schermo */}
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative w-full h-full flex items-center justify-center p-2"
          >
            {selectedMedia.tipo === "video" ? (
              <video
                src={selectedMedia.signedUrl}
                controls
                autoPlay
                className="w-full h-full object-contain"
              />
            ) : (
              <img
                src={selectedMedia.signedUrl}
                alt={selectedMedia.nome_file || "Foto ingrandita"}
                className="w-full h-full object-contain"
              />
            )}
          </div>

          {/* Contatore + Nome Caricatore */}
          <div className="absolute bottom-6 text-white/80 text-[11px] font-bold tracking-widest bg-black/40 px-4 py-1.5 rounded-full backdrop-blur-md pointer-events-none z-50 flex items-center gap-2">
            <span>
              {selectedIndex! + 1} / {media.length}
            </span>
            {selectedMedia.profiles?.nome && (
              <span className="opacity-70 font-normal">
                • {selectedMedia.profiles.nome}
              </span>
            )}
          </div>
        </div>
      )}
    </>
  );
}