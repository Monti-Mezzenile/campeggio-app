"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/lib/supabase";

interface FriendProfile {
  id: string;
  nome: string;
  full_name?: string;
  avatar_url?: string;
  motto?: string;
  ruolo?: string | null;
  padre_fondatore?: boolean;
  nome_coniglio?: string;
  badges?: any[];
  tents?: any[];
  cars?: any[];
}

export default function CommunitySection() {
  const [friends, setFriends] = useState<FriendProfile[]>([]);
  const [selectedFriend, setSelectedFriend] = useState<FriendProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadCommunity() {
      setLoading(true);

      try {
        const { data: profiles, error: profilesErr } = await supabase
          .from("profiles")
          .select("*");

        if (profilesErr) {
          console.error("Errore caricamento profili:", profilesErr.message || profilesErr);
          setLoading(false);
          return;
        }

        if (!profiles || profiles.length === 0) {
          setFriends([]);
          setLoading(false);
          return;
        }

        const [badgesRes, tentsRes, carsRes, mascotsRes] = await Promise.allSettled([
          supabase.from("user_badges").select("*, badges(*)"),
          supabase.from("tents").select("*"),
          supabase.from("cars").select("*"),
          supabase.from("mascots").select("user_id, nome_mascotte, nome"),
        ]);

        const userBadges =
          badgesRes.status === "fulfilled" && !badgesRes.value.error
            ? badgesRes.value.data
            : [];
        const tents =
          tentsRes.status === "fulfilled" && !tentsRes.value.error
            ? tentsRes.value.data
            : [];
        const cars =
          carsRes.status === "fulfilled" && !carsRes.value.error
            ? carsRes.value.data
            : [];
        const mascots =
          mascotsRes.status === "fulfilled" && !mascotsRes.value.error
            ? mascotsRes.value.data
            : [];

        const formatted = profiles.map((p: any) => {
          const myBadges = userBadges
            ?.filter((ub: any) => ub.user_id === p.id)
            .map((ub: any) => ub.badges)
            .filter(Boolean);

          const myTents = tents?.filter((t: any) => t.user_id === p.id) || [];
          const myCars = cars?.filter((c: any) => c.user_id === p.id) || [];
          const myMascot = mascots?.find((m: any) => m.user_id === p.id);

          const isPadreFondatore =
            p.padre_fondatore === true ||
            String(p.padre_fondatore).toUpperCase() === "TRUE";

          const rawRuolo = (p.titolo_campo || p.ruolo || "").trim();
          const isSystemRole = ["user", "admin"].includes(rawRuolo.toLowerCase());
          const cleanRuolo = isSystemRole || !rawRuolo ? null : rawRuolo;

          const mascotName = p.nome_coniglio || myMascot?.nome_mascotte || myMascot?.nome || null;
          const userMotto = p.motto || p.bio || null;

          return {
            id: p.id,
            nome: p.nome || p.full_name || "Campeggiatore",
            full_name: p.full_name || p.nome || "",
            avatar_url: p.avatar_url,
            motto: userMotto,
            ruolo: cleanRuolo,
            padre_fondatore: isPadreFondatore,
            nome_coniglio: mascotName,
            badges: myBadges || [],
            tents: myTents,
            cars: myCars,
          };
        });

        setFriends(formatted);
      } catch (err) {
        console.error("Errore imprevisto community:", err);
      } finally {
        setLoading(false);
      }
    }

    loadCommunity();
  }, []);

  if (loading) {
    return (
      <section className="space-y-2">
        <h3 className="text-xs font-black uppercase tracking-widest text-[#EFE8DB]/80 px-1">
          LA COMPAGNIA
        </h3>
        <div className="flex gap-3 overflow-x-auto pb-2 no-scrollbar">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="w-36 h-48 rounded-3xl bg-[#15241D]/60 border border-white/10 animate-pulse shrink-0"
            />
          ))}
        </div>
      </section>
    );
  }

  return (
    <section className="space-y-3">
      {/* INTESTAZIONE SEZIONE */}
      <div className="flex items-center justify-between px-1">
        <h3 className="text-xs font-black uppercase tracking-widest text-[#EFE8DB]">
          LA COMPAGNIA ({friends.length})
        </h3>
      </div>

      {/* RASTRELLIERA TESSERINI */}
      <div className="flex gap-3 overflow-x-auto pb-3 pt-1 no-scrollbar -mx-1 px-1">
        {friends.map((friend) => {
          const totalBadges = friend.badges?.length || 0;
          const totalTents = friend.tents?.length || 0;
          const totalCars = friend.cars?.length || 0;

          return (
            <motion.div
              key={friend.id}
              whileTap={{ scale: 0.95 }}
              onClick={() => setSelectedFriend(friend)}
              className="w-36 shrink-0 bg-[#EFE8DB] rounded-[2rem] border-2 border-[#D8CEBC] p-3 shadow-xl hover:border-[#4A7261] transition cursor-pointer flex flex-col items-center text-center relative overflow-hidden group select-none"
            >
              {/* ICONA CAVALLO / CONIGLIO IN ALTO */}
              <div className="absolute top-2.5 right-2.5 w-7 h-7 flex items-center justify-center">
                <img
                  src={friend.padre_fondatore ? "/icons/cavallo.png" : "/icons/coniglio.png"}
                  alt={friend.padre_fondatore ? "Padre Fondatore" : "Coniglio"}
                  className="w-6 h-6 object-contain filter drop-shadow-md"
                />
              </div>

              {/* AVATAR PROFILO */}
              <div className="relative mb-2 mt-1">
                {friend.avatar_url ? (
                  <img
                    src={friend.avatar_url}
                    alt={friend.nome}
                    className="w-14 h-14 rounded-2xl object-cover border-2 border-[#15241D] shadow-md"
                  />
                ) : (
                  <div className="w-14 h-14 rounded-2xl bg-[#15241D] text-[#EFE8DB] font-black text-xl flex items-center justify-center border-2 border-[#15241D] shadow-md">
                    {friend.nome.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>

              {/* NOME COMPLETO */}
              <h4 className="text-xs font-black text-[#15241D] truncate w-full">
                {friend.nome}
              </h4>

              {/* NOME DA CONIGLIO */}
              <p className="text-[10px] font-extrabold text-[#4A7261] truncate w-full mb-2">
                {friend.nome_coniglio ? `🐰 ${friend.nome_coniglio}` : (friend.ruolo || "Campeggiatore")}
              </p>

              {/* PANNELLO ICONE (MEDAGLIA, TENDA, MACCHINA) */}
              <div className="w-full bg-[#15241D] rounded-xl p-1.5 mt-auto border border-[#15241D]/20 shadow-inner flex items-center justify-around text-[10px] font-black text-[#EFE8DB]">
                <div className="flex items-center gap-1" title="Spille">
                  <img src="/icons/medaglia.png" alt="Medaglie" className="w-4 h-4 object-contain" />
                  <span>{totalBadges}</span>
                </div>
                <span className="text-white/20">|</span>
                <div className="flex items-center gap-1" title="Tende">
                  <img src="/icons/tenda-grossa.png" alt="Tende" className="w-4 h-4 object-contain" />
                  <span>{totalTents}</span>
                </div>
                <span className="text-white/20">|</span>
                <div className="flex items-center gap-1" title="Auto">
                  <img src="/icons/macchina.png" alt="Auto" className="w-4 h-4 object-contain" />
                  <span>{totalCars}</span>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* MODAL DETTAGLIATO */}
      <AnimatePresence>
        {selectedFriend && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4 overscroll-contain">
            <motion.div
              initial={{ scale: 0.92, opacity: 0, y: 15 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.92, opacity: 0, y: 15 }}
              className="bg-[#EFE8DB] border-2 border-[#D8CEBC] rounded-[2.5rem] w-full max-w-sm overflow-hidden shadow-2xl relative flex flex-col max-h-[85dvh] my-auto text-[#15241D]"
            >
              {/* TASTO CHIUSURA IN ALTO A DESTRA */}
              <button
                onClick={() => setSelectedFriend(null)}
                className="absolute right-3.5 top-3.5 z-20 w-7 h-7 rounded-full bg-[#15241D] text-[#EFE8DB] font-black text-xs flex items-center justify-center hover:bg-[#20362C] transition shadow-md border border-white/10"
              >
                ✕
              </button>

              {/* HEADER TESSERINO COMPATTO (FOTO A SINISTRA, DATI A DESTRA) */}
              <div className="p-4 pr-12 bg-[#EFE8DB] border-b border-[#D8CEBC] relative shrink-0 flex items-center gap-3.5 text-left">
                
                {/* FOTO PROFILO + BADGE STEMMA OVERLAY */}
                <div className="relative shrink-0">
                  {selectedFriend.avatar_url ? (
                    <img
                      src={selectedFriend.avatar_url}
                      alt={selectedFriend.nome}
                      className="w-16 h-16 rounded-2xl object-cover border-2 border-[#15241D] shadow-md"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-2xl bg-[#15241D] text-[#EFE8DB] font-black text-2xl flex items-center justify-center border-2 border-[#15241D] shadow-md">
                      {selectedFriend.nome.charAt(0).toUpperCase()}
                    </div>
                  )}

                  {/* STEMMA BADGE COMPATTO IN BASSO A DESTRA DELL'AVATAR */}
                  <div
                    className="absolute -bottom-1 -right-1 bg-[#15241D] p-1 rounded-lg border border-[#EFE8DB] shadow-md flex items-center justify-center"
                    title={selectedFriend.padre_fondatore ? "Padre Fondatore" : "Campeggiatore"}
                  >
                    <img
                      src={selectedFriend.padre_fondatore ? "/icons/cavallo.png" : "/icons/coniglio.png"}
                      alt="Stemma"
                      className="w-4 h-4 object-contain"
                    />
                  </div>
                </div>

                {/* INFO UTENTE A DESTRA */}
                <div className="flex-1 min-w-0 space-y-1">
                  {/* NOME COMPLETO */}
                  <h2 className="text-base font-black text-[#15241D] leading-tight truncate">
                    {selectedFriend.full_name || selectedFriend.nome}
                  </h2>

                  {/* RUOLO / NOME CONIGLIO / TITOLO */}
                  <div className="flex flex-wrap items-center gap-1.5 text-[10px] font-black">
                    {selectedFriend.nome_coniglio && (
                      <span className="bg-[#15241D] text-[#EFE8DB] px-2 py-0.5 rounded-md inline-flex items-center gap-1 truncate max-w-full">
                        <img src="/icons/coniglio.png" alt="Coniglio" className="w-3.5 h-3.5 object-contain" />
                        <span className="truncate">{selectedFriend.nome_coniglio}</span>
                      </span>
                    )}

                    {selectedFriend.ruolo && (
                      <span className="text-[#15241D] bg-[#4A7261]/20 border border-[#4A7261]/30 px-2 py-0.5 rounded-md truncate">
                        🏷️ {selectedFriend.ruolo}
                      </span>
                    )}

                    <span className="text-[#4A7261] font-bold">
                      {selectedFriend.padre_fondatore ? "• Padre Fondatore" : "• Campeggiatore"}
                    </span>
                  </div>

                  {/* MOTTO COMPATTO */}
                  {selectedFriend.motto && (
                    <p className="text-[10px] italic text-[#15241D]/80 truncate pt-0.5">
                      “{selectedFriend.motto}”
                    </p>
                  )}
                </div>

              </div>

              {/* CORPO TESSERINO */}
              <div className="p-4 space-y-5 overflow-y-auto custom-scrollbar flex-1 min-h-0 touch-auto pb-6 bg-[#15241D] text-white">
                
                {/* 🎖️ SPILLE & ONOREFICENZE */}
                <div className="space-y-2.5">
                  <div className="flex items-center gap-2">
                    <img src="/icons/medaglia.png" alt="Medaglia" className="w-5 h-5 object-contain" />
                    <h4 className="text-[11px] font-black uppercase tracking-wider text-[#EFE8DB]">
                      SPILLE ({selectedFriend.badges?.length || 0})
                    </h4>
                  </div>

                  {selectedFriend.badges && selectedFriend.badges.length > 0 ? (
                    <div className="grid grid-cols-3 gap-2.5 pt-1">
                      {selectedFriend.badges.map((b: any) => (
                        <div key={b.id || b.titolo} className="bg-[#22352B] border border-white/10 rounded-2xl p-2.5 flex flex-col items-center text-center shadow-md">
                          <div className="w-11 h-11 rounded-xl bg-[#15241D] border border-[#4A7261]/40 p-1 flex items-center justify-center shrink-0 shadow-sm relative overflow-hidden">
                            {b.immagine_url || b.foto ? (
                              <img src={b.immagine_url || b.foto} alt={b.titolo} className="w-full h-full object-cover rounded-lg" />
                            ) : (
                              <img src="/icons/medaglia.png" alt="Badge" className="w-6 h-6 object-contain" />
                            )}
                          </div>
                          
                          <p className="text-[10px] font-black text-[#EFE8DB] mt-1.5 line-clamp-1 w-full">
                            {b.titolo}
                          </p>
                          {b.descrizione && (
                            <p className="text-[8px] font-medium text-white/50 line-clamp-1 w-full">
                              {b.descrizione}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-[10px] font-bold text-white/40 italic bg-[#22352B] p-3 rounded-2xl text-center border border-white/5">
                      Nessuna spilla appuntata sulla giacca.
                    </p>
                  )}
                </div>

                {/* 🎪 TENDE IN DOTAZIONE */}
                <div className="space-y-2.5">
                  <div className="flex items-center gap-2">
                    <img src="/icons/tenda-grossa.png" alt="Tenda" className="w-5 h-5 object-contain" />
                    <h4 className="text-[11px] font-black uppercase tracking-wider text-[#EFE8DB]">
                      TENDE ({selectedFriend.tents?.length || 0})
                    </h4>
                  </div>

                  {selectedFriend.tents && selectedFriend.tents.length > 0 ? (
                    <div className="space-y-3">
                      {selectedFriend.tents.map((tent: any) => {
                        const tentPhoto = tent.foto_url || tent.foto || tent.immagine;
                        return (
                          <div key={tent.id} className="bg-[#22352B] border border-white/10 rounded-2xl p-3.5 space-y-2.5 shadow-md">
                            {tentPhoto && (
                              <div className="w-full h-32 rounded-xl overflow-hidden border border-white/10">
                                <img src={tentPhoto} alt={tent.nome || "Tenda"} className="w-full h-full object-cover" />
                              </div>
                            )}

                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <h5 className="text-sm font-black text-[#EFE8DB] leading-snug">
                                  {tent.nome || tent.marca || "Tenda Campeggio"}
                                </h5>
                                {tent.marca && (
                                  <p className="text-[10px] font-bold text-[#A1B2A8]">Marca: {tent.marca}</p>
                                )}
                              </div>
                              {tent.posti && (
                                <span className="text-xs font-black bg-[#4A7261] text-white px-2.5 py-1 rounded-lg shrink-0 shadow-xs">
                                  👥 {tent.posti} Posti
                                </span>
                              )}
                            </div>

                            {tent.note && (
                              <div className="bg-[#15241D]/80 border border-white/5 p-2.5 rounded-xl text-xs text-white/90 italic leading-relaxed break-words">
                                📝 "{tent.note}"
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-[10px] font-bold text-white/40 italic bg-[#22352B] p-3 rounded-2xl text-center border border-white/5">
                      Nessuna tenda registrata.
                    </p>
                  )}
                </div>

                {/* 🚗 PARCO MACCHINE */}
                <div className="space-y-2.5">
                  <div className="flex items-center gap-2">
                    <img src="/icons/macchina.png" alt="Auto" className="w-5 h-5 object-contain" />
                    <h4 className="text-[11px] font-black uppercase tracking-wider text-[#EFE8DB]">
                      PARCO AUTO ({selectedFriend.cars?.length || 0})
                    </h4>
                  </div>

                  {selectedFriend.cars && selectedFriend.cars.length > 0 ? (
                    <div className="space-y-3">
                      {selectedFriend.cars.map((car: any) => {
                        const carPhoto = car.foto_url || car.foto || car.immagine;
                        return (
                          <div key={car.id} className="bg-[#22352B] border border-white/10 rounded-2xl p-3.5 space-y-2.5 shadow-md">
                            {carPhoto && (
                              <div className="w-full h-32 rounded-xl overflow-hidden border border-white/10">
                                <img src={carPhoto} alt={car.modello} className="w-full h-full object-cover" />
                              </div>
                            )}

                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <h5 className="text-sm font-black text-[#EFE8DB] leading-snug">
                                  {car.modello} {car.marca ? `(${car.marca})` : ""}
                                </h5>
                                {car.targa && (
                                  <p className="text-[10px] font-mono text-[#A1B2A8] font-bold">🪪 TARGA: {car.targa}</p>
                                )}
                              </div>
                              {(car.posti || car.posti_totali) && (
                                <span className="text-xs font-black bg-[#4A7261] text-white px-2.5 py-1 rounded-lg shrink-0 shadow-xs">
                                  💺 {car.posti || car.posti_totali} Posti
                                </span>
                              )}
                            </div>

                            {car.partenza_predefinita && (
                              <div className="flex items-center gap-1.5 text-xs font-bold text-[#EFE8DB] bg-[#15241D]/60 px-2.5 py-1 rounded-lg border border-white/5">
                                <span>📍</span>
                                <span>Partenza: {car.partenza_predefinita}</span>
                              </div>
                            )}

                            {car.note && (
                              <div className="bg-[#15241D]/80 border border-white/5 p-2.5 rounded-xl text-xs text-white/90 italic leading-relaxed break-words">
                                📝 "{car.note}"
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-[10px] font-bold text-white/40 italic bg-[#22352B] p-3 rounded-2xl text-center border border-white/5">
                      Nessun veicolo in garage.
                    </p>
                  )}
                </div>

              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </section>
  );
}