'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/supabase';

// --- LOGICA DEL MAZZO DA POKER (52 CARTE) ---
const SUITS = [
  { symbol: '♥️', name: 'Cuori', color: 'text-rose-600', weight: 4 },
  { symbol: '♦️', name: 'Quadri', color: 'text-rose-600', weight: 3 },
  { symbol: '♣️', name: 'Fiori', color: 'text-[#1c2421]', weight: 2 },
  { symbol: '♠️', name: 'Picche', color: 'text-[#1c2421]', weight: 1 }
];

const VALUES = [
  { label: '2', weight: 2 }, { label: '3', weight: 3 }, { label: '4', weight: 4 },
  { label: '5', weight: 5 }, { label: '6', weight: 6 }, { label: '7', weight: 7 },
  { label: '8', weight: 8 }, { label: '9', weight: 9 }, { label: '10', weight: 10 },
  { label: 'J', weight: 11 }, { label: 'Q', weight: 12 }, { label: 'K', weight: 13 },
  { label: 'A', weight: 14 }
];

interface DrawRecord {
  id: string;
  user_id: string;
  nome: string;
  carta_label: string;
  carta_seme: string;
  score: number;
}

export default function AstaPage() {
  const [user, setUser] = useState<any>(null);
  const [userName, setUserName] = useState('Esploratore');
  const [leaderboard, setLeaderboard] = useState<DrawRecord[]>([]);
  const [myDraw, setMyDraw] = useState<DrawRecord | null>(null);
  
  const [isFlipping, setIsFlipping] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

  // 1. CARICAMENTO DATI (il loader si attiva solo alla prima apertura)
  useEffect(() => {
    fetchData(true);
  }, []);

  const fetchData = async (isFirstLoad = false) => {
    if (isFirstLoad) setInitialLoading(true);

    const { data: { user: currentUser } } = await supabase.auth.getUser();
    if (currentUser) {
      setUser(currentUser);
      const { data: profile } = await supabase.from('profiles').select('nome').eq('id', currentUser.id).single();
      if (profile?.nome) setUserName(profile.nome);
    }

    const { data: draws } = await supabase
      .from('asta_bottino')
      .select('*')
      .order('score', { ascending: false });

    if (draws) {
      setLeaderboard(draws);
      if (currentUser) {
        const mine = draws.find(d => d.user_id === currentUser.id);
        if (mine) setMyDraw(mine);
      }
    }

    if (isFirstLoad) setInitialLoading(false);
  };

  // 2. PESCA LA CARTA
  const handleDrawCard = async () => {
    if (!user || isFlipping || myDraw) return;
    setIsFlipping(true);

    const fullDeck = [];
    for (const v of VALUES) {
      for (const s of SUITS) {
        fullDeck.push({ label: v.label, suit: s, score: (v.weight * 10) + s.weight });
      }
    }

    const drawnSignatures = leaderboard.map(d => `${d.carta_label}-${d.carta_seme}`);
    const availableDeck = fullDeck.filter(c => !drawnSignatures.includes(`${c.label}-${c.suit.symbol}`));

    if (availableDeck.length === 0) {
      alert("Il mazzo è finito! Non ci sono più carte disponibili.");
      setIsFlipping(false);
      return;
    }

    const randomIndex = Math.floor(Math.random() * availableDeck.length);
    const drawnCard = availableDeck[randomIndex];

    const { data, error } = await supabase.from('asta_bottino').insert([{
      user_id: user.id,
      nome: userName,
      carta_label: drawnCard.label,
      carta_seme: drawnCard.suit.symbol,
      score: drawnCard.score
    }]).select().single();

    if (error) {
      console.error(error);
      alert("Errore nella pescata. Risulti aver già pescato!");
      setIsFlipping(false);
      return;
    }

    // Aggiorna localmente per mostrare subito la carta senza refresh
    setTimeout(() => {
      setMyDraw(data);
      fetchData(false); // Aggiorna la classifica in background
      setIsFlipping(false);
    }, 1000);
  };

  // 3. RESET ASTA
  const handleResetAsta = async () => {
    if (confirm("Vuoi davvero azzerare il tavolo e resettare le pescate di tutti?")) {
      await supabase.from('asta_bottino').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      setMyDraw(null);
      fetchData(false);
    }
  };

  if (initialLoading) {
    return (
      <div className="min-h-dvh bg-transparent flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-[#507c6c] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const getSuitColor = (seme: string) => {
    return seme === '♥️' || seme === '♦️' ? 'text-rose-600' : 'text-[#1c2421]';
  };

  return (
    <main className="min-h-dvh bg-transparent p-4 sm:p-6 pb-24 font-sans select-none flex flex-col items-center">
      
      <div className="w-full max-w-md space-y-5">
        
        {/* HEADER */}
        <header className="flex justify-between items-center bg-[#f4efe6]/90 border border-[#e2dacb] p-3 rounded-2xl shadow-sm backdrop-blur-md">
          <Link href="/curiosita" className="bg-white hover:bg-zinc-50 border border-[#e2dacb] text-[10px] font-black px-3.5 py-2 rounded-xl text-[#1c2421] transition-all">
            ← RITORNA
          </Link>
          <div className="text-right">
            <span className="text-[10px] font-black uppercase text-[#507c6c] tracking-wider block flex items-center gap-1.5">
              <span>🃏</span> L'Asta degli Avanzi
            </span>
          </div>
        </header>

        {/* LORE / INTRO */}
        <div className="bg-[#1c2421] border border-[#1c2421]/20 p-5 rounded-[2rem] text-center shadow-lg relative overflow-hidden transition-all duration-500">
          <div className="absolute top-0 right-0 w-32 h-32 bg-[#507c6c]/20 rounded-full blur-2xl pointer-events-none" />
          
          <h1 className="text-xl sm:text-2xl font-black text-[#f4efe6] uppercase tracking-tight mb-1">
            Spartizione del Bottino
          </h1>
          
          <AnimatePresence>
            {!myDraw && (
              <motion.div 
                initial={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <p className="text-xs text-[#f4efe6]/70 leading-relaxed font-medium pt-1">
                  Le tende sono smontate. Nel frigo portatile giacciono le ultime reliquie: 
                  mezza senape, due uova e l'ultima birra intatta.
                  <span className="block mt-2 text-[10px] text-[#507c6c] uppercase font-bold">
                    L'Asso comanda, la carta più alta sceglie per prima.
                  </span>
                </p>
              </motion.div>
            )}
          </AnimatePresence>

          {myDraw && (
            <p className="text-xs font-bold text-[#507c6c] uppercase tracking-widest mt-1">
              Hai pescato la tua carta
            </p>
          )}
        </div>

        {/* ZONA TAVOLO (Layout Flex con altezza minima per evitare sovrapposizioni) */}
        <div className="min-h-[380px] p-6 flex flex-col items-center justify-between bg-[#f4efe6]/60 border border-[#e2dacb] rounded-[2rem] backdrop-blur-sm shadow-inner relative">
          
          {/* CARTA 3D */}
          <div className="flex-1 flex items-center justify-center py-2">
            <div className="w-36 h-52 relative cursor-pointer z-10" onClick={handleDrawCard}>
              <motion.div
                className="w-full h-full relative"
                animate={{ rotateY: myDraw || isFlipping ? 180 : 0 }}
                transition={{ duration: 0.8, ease: "easeInOut" }}
                style={{ transformStyle: 'preserve-3d' }}
              >
                
                {/* DORSO CARTA */}
                <div 
                  className="absolute w-full h-full bg-[#1c2421] border-4 border-white rounded-2xl shadow-xl flex items-center justify-center"
                  style={{ backfaceVisibility: 'hidden' }}
                >
                  <div className="w-[85%] h-[85%] border-2 border-[#507c6c]/40 border-dashed rounded-xl flex items-center justify-center opacity-80">
                    <span className="text-4xl grayscale brightness-200">⛺</span>
                  </div>
                </div>

                {/* FRONTE CARTA */}
                <div 
                  className="absolute w-full h-full bg-white rounded-2xl shadow-xl flex flex-col p-3 border-4 border-zinc-100"
                  style={{ transform: 'rotateY(180deg)', backfaceVisibility: 'hidden' }}
                >
                  {myDraw ? (
                    <>
                      <div className={`text-2xl font-black ${getSuitColor(myDraw.carta_seme)} leading-none`}>
                        {myDraw.carta_label}<br/>
                        <span className="text-xl">{myDraw.carta_seme}</span>
                      </div>

                      <div className={`flex-1 flex items-center justify-center text-6xl ${getSuitColor(myDraw.carta_seme)}`}>
                        {myDraw.carta_seme}
                      </div>

                      <div className={`text-2xl font-black ${getSuitColor(myDraw.carta_seme)} leading-none rotate-180 self-end`}>
                        {myDraw.carta_label}<br/>
                        <span className="text-xl">{myDraw.carta_seme}</span>
                      </div>
                    </>
                  ) : (
                    <div className="flex-1 flex items-center justify-center">
                      <div className="w-8 h-8 border-4 border-[#1c2421]/20 border-t-[#1c2421] rounded-full animate-spin" />
                    </div>
                  )}
                </div>
              </motion.div>
            </div>
          </div>

          {/* BOTTONE IN BASSO (Integrato nel flusso flex) */}
          <div className="w-full pt-4">
            <button 
              onClick={handleDrawCard}
              disabled={!!myDraw || isFlipping}
              className={`w-full font-black py-3.5 rounded-2xl text-xs uppercase tracking-widest transition-all shadow-sm border ${
                myDraw 
                  ? 'bg-zinc-200/80 text-zinc-400 border-zinc-300 cursor-not-allowed'
                  : isFlipping
                    ? 'bg-[#507c6c]/20 text-[#507c6c] border-[#507c6c]/30 cursor-wait animate-pulse'
                    : 'bg-[#507c6c] hover:bg-[#42695c] text-white active:scale-95 border-[#42695c]'
              }`}
            >
              {myDraw ? 'Hai già pescato' : isFlipping ? 'Il destino decide...' : '🃏 Pesca la tua carta'}
            </button>
          </div>

        </div>

        {/* CLASSIFICA */}
        <div className="bg-white/80 border border-[#e2dacb] rounded-[2rem] p-5 shadow-sm backdrop-blur-md">
          <div className="flex justify-between items-center mb-4 border-b border-[#e2dacb]/60 pb-3">
            <h3 className="text-xs font-black uppercase tracking-widest text-[#1c2421] flex items-center gap-2">
              <span>🏆</span> Ordine di Scelta
            </h3>
            <span className="text-[10px] text-[#1c2421]/50 font-mono bg-[#1c2421]/5 px-2 py-0.5 rounded-lg border border-[#1c2421]/10">
              {leaderboard.length}/52 Carte
            </span>
          </div>

          {leaderboard.length === 0 ? (
            <p className="text-xs text-[#1c2421]/50 font-medium text-center py-6 bg-white/50 rounded-2xl border border-dashed border-[#e2dacb]">
              Nessuno ha ancora pescato.<br/> Fatti avanti esploratore!
            </p>
          ) : (
            <div className="space-y-2">
              {leaderboard.map((draw, index) => (
                <div 
                  key={draw.id} 
                  className={`flex items-center justify-between p-3 rounded-2xl border transition-all ${
                    draw.user_id === user?.id 
                      ? 'bg-[#507c6c]/10 border-[#507c6c]/30 shadow-sm' 
                      : 'bg-white border-[#e2dacb]'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className={`w-6 text-center font-black text-sm ${index === 0 ? 'text-amber-500 text-lg drop-shadow-sm' : index === 1 ? 'text-zinc-400' : index === 2 ? 'text-orange-600' : 'text-[#1c2421]/40'}`}>
                      {index + 1}°
                    </span>
                    <span className={`text-xs font-bold ${draw.user_id === user?.id ? 'text-[#1c2421]' : 'text-[#1c2421]/80'}`}>
                      {draw.nome}
                    </span>
                  </div>
                  
                  <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-zinc-50 shadow-inner border border-zinc-200 ${getSuitColor(draw.carta_seme)}`}>
                    <span className="text-[11px] font-black">{draw.carta_label}</span>
                    <span className="text-sm leading-none drop-shadow-sm">{draw.carta_seme}</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {leaderboard.length > 0 && (
            <div className="mt-6 text-center border-t border-[#e2dacb]/60 pt-4">
              <button onClick={handleResetAsta} className="text-[9px] text-rose-600/70 hover:text-rose-600 font-bold uppercase tracking-widest underline underline-offset-4">
                ⚠️ Azzera Tavolo (Fine Evento)
              </button>
            </div>
          )}
        </div>

      </div>
    </main>
  );
}