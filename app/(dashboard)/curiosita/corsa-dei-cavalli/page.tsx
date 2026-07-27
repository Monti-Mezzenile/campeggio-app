"use client";

import BackButton from "@/components/ui/BackButton";

// --- Utility SVG Icons ---
function TrophyIcon({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 3v4a5 5 0 005 5h4a5 5 0 005-5V3M5 3h14M5 3H3v2a4 4 0 004 4h1m11-6h2a4 4 0 014 4h-1m-5 7v3m-4 0h8m-4 0v3m-4 0h8" />
    </svg>
  );
}

function VolumeUpIcon({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
    </svg>
  );
}

function BeerIcon({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
    </svg>
  );
}

export default function CorsaDeiCavalliPage() {
  return (
    <main className="min-h-screen p-4 sm:p-6 pb-32 max-w-2xl mx-auto text-zinc-900">
      {/* Tasto Indietro */}
      <div className="mb-4">
        <BackButton label="Indietro" />
      </div>

      {/* HEADER BANNER */}
      <div className="relative overflow-hidden bg-white/80 border border-white/90 rounded-3xl p-6 sm:p-8 shadow-xl backdrop-blur-md mb-6">
        <div className="absolute top-0 right-0 -mr-8 -mt-8 w-36 h-36 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-950 text-[10px] font-black uppercase tracking-wider mb-3">
          <span>🐎 Evento Ufficiale</span>
        </div>

        <h1 className="text-3xl sm:text-4xl font-black text-zinc-950 tracking-tight leading-none mb-3">
          La Corsa dei Cavalli
        </h1>

        <p className="text-xs sm:text-sm font-medium text-zinc-600 leading-relaxed">
          Un evento di pura adrenalina e goliardia, orchestrato da un eccezionale <strong className="font-bold text-zinc-900">Maestro Artiere di Scuderia</strong>.
        </p>
      </div>

      {/* REQUISITO ESSENZIALE: AUDIO FANFARA */}
      <div className="bg-amber-500/10 border border-amber-500/30 rounded-3xl p-5 sm:p-6 shadow-md backdrop-blur-md mb-6 space-y-3">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-amber-500 text-amber-950 shadow-md animate-pulse">
            <VolumeUpIcon className="w-6 h-6" />
          </div>
          <div>
            <span className="inline-block text-[10px] font-black uppercase tracking-widest text-amber-800">
              Sottofondo Obbligatorio
            </span>
            <h2 className="text-base font-black text-amber-950 leading-tight">
              La Fanfara dei Bersaglieri
            </h2>
          </div>
        </div>

        <p className="text-xs font-semibold text-amber-900/90 leading-relaxed">
          È condizione vincolante ed essenziale che durante tutta la durata della corsa venga riprodotta a tutto volume per mantenere al massimo la carica drammatica!
        </p>

        {/* Lettore Audio */}
        <div className="pt-2">
          <audio controls className="w-full rounded-xl shadow-inner bg-white/80">
            <source src="/audio/corsa-dei-cavalli.mp3" type="audio/mpeg" />
            Il tuo browser non supporta la riproduzione audio.
          </audio>
        </div>
      </div>

      {/* SHOWCASE CREATIVO DEI 4 CAVALLI IN GARA */}
      <div className="bg-white/80 border border-white/90 rounded-3xl p-5 sm:p-7 shadow-xl backdrop-blur-md mb-6 space-y-5 relative overflow-hidden">
        
        {/* Glow di sfondo alla sezione */}
        <div className="absolute -top-12 -right-12 w-48 h-48 bg-amber-400/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-zinc-200/80 pb-4">
          <div>
            <span className="text-[10px] font-black uppercase tracking-widest text-amber-600 block">
              Griglia di Partenza
            </span>
            <h2 className="text-xl font-black text-zinc-950 tracking-tight">
              I Quattro Cavalli Campioni
            </h2>
          </div>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-zinc-900 text-white text-[10px] font-black uppercase tracking-wider self-start sm:self-auto shadow-sm">
            ⚡ Scegli la tua Fazione
          </span>
        </div>

        {/* GRIGLIA CARDS CAVALLI */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 sm:gap-4">
          
          {/* BASTONI */}
          <div className="group relative bg-gradient-to-b from-amber-500/15 via-amber-500/5 to-transparent border border-amber-500/30 rounded-2xl p-4 flex flex-col items-center justify-between transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl hover:shadow-amber-500/20 hover:border-amber-500/60 overflow-hidden">
            <div className="absolute top-0 right-0 px-2 py-0.5 bg-amber-500/20 text-amber-950 text-[9px] font-black rounded-bl-xl uppercase tracking-wider">
              N° 1
            </div>
            
            <div className="my-3 relative flex items-center justify-center">
              <div className="absolute w-20 h-20 bg-amber-500/20 rounded-full blur-xl group-hover:scale-125 transition-transform" />
              <img 
                src="/corsa/Bastoni.png" 
                alt="Bastoni" 
                className="relative w-24 h-24 sm:w-28 sm:h-28 object-contain drop-shadow-xl group-hover:scale-110 transition-transform duration-300" 
              />
            </div>

            <div className="text-center w-full pt-2 border-t border-amber-500/20">
              <h3 className="text-sm sm:text-base font-black text-zinc-950 uppercase tracking-wider">Bastoni</h3>
              <span className="text-[10px] font-bold text-amber-900/80 block italic">"La Forza Bruta"</span>
            </div>
          </div>

          {/* ORI */}
          <div className="group relative bg-gradient-to-b from-yellow-500/20 via-yellow-500/5 to-transparent border border-yellow-500/30 rounded-2xl p-4 flex flex-col items-center justify-between transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl hover:shadow-yellow-500/20 hover:border-yellow-500/60 overflow-hidden">
            <div className="absolute top-0 right-0 px-2 py-0.5 bg-yellow-500/30 text-yellow-950 text-[9px] font-black rounded-bl-xl uppercase tracking-wider">
              N° 2
            </div>

            <div className="my-3 relative flex items-center justify-center">
              <div className="absolute w-20 h-20 bg-yellow-400/30 rounded-full blur-xl group-hover:scale-125 transition-transform" />
              <img 
                src="/corsa/ori.png" 
                alt="Ori" 
                className="relative w-24 h-24 sm:w-28 sm:h-28 object-contain drop-shadow-xl group-hover:scale-110 transition-transform duration-300" 
              />
            </div>

            <div className="text-center w-full pt-2 border-t border-yellow-500/20">
              <h3 className="text-sm sm:text-base font-black text-zinc-950 uppercase tracking-wider">Ori</h3>
              <span className="text-[10px] font-bold text-yellow-900/80 block italic">"Il Favorito"</span>
            </div>
          </div>

          {/* SPADE */}
          <div className="group relative bg-gradient-to-b from-slate-400/20 via-slate-400/5 to-transparent border border-slate-400/30 rounded-2xl p-4 flex flex-col items-center justify-between transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl hover:shadow-slate-500/20 hover:border-slate-400/60 overflow-hidden">
            <div className="absolute top-0 right-0 px-2 py-0.5 bg-slate-500/20 text-slate-950 text-[9px] font-black rounded-bl-xl uppercase tracking-wider">
              N° 3
            </div>

            <div className="my-3 relative flex items-center justify-center">
              <div className="absolute w-20 h-20 bg-slate-400/20 rounded-full blur-xl group-hover:scale-125 transition-transform" />
              <img 
                src="/corsa/Spade.png" 
                alt="Spade" 
                className="relative w-24 h-24 sm:w-28 sm:h-28 object-contain drop-shadow-xl group-hover:scale-110 transition-transform duration-300" 
              />
            </div>

            <div className="text-center w-full pt-2 border-t border-slate-400/20">
              <h3 className="text-sm sm:text-base font-black text-zinc-950 uppercase tracking-wider">Spade</h3>
              <span className="text-[10px] font-bold text-slate-800 block italic">"L'Affilato"</span>
            </div>
          </div>

          {/* COPPE */}
          <div className="group relative bg-gradient-to-b from-rose-500/20 via-rose-500/5 to-transparent border border-rose-500/30 rounded-2xl p-4 flex flex-col items-center justify-between transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl hover:shadow-rose-500/20 hover:border-rose-500/60 overflow-hidden">
            <div className="absolute top-0 right-0 px-2 py-0.5 bg-rose-500/20 text-rose-950 text-[9px] font-black rounded-bl-xl uppercase tracking-wider">
              N° 4
            </div>

            <div className="my-3 relative flex items-center justify-center">
              <div className="absolute w-20 h-20 bg-rose-500/20 rounded-full blur-xl group-hover:scale-125 transition-transform" />
              <img 
                src="/corsa/coppe.png" 
                alt="Coppe" 
                className="relative w-24 h-24 sm:w-28 sm:h-28 object-contain drop-shadow-xl group-hover:scale-110 transition-transform duration-300" 
              />
            </div>

            <div className="text-center w-full pt-2 border-t border-rose-500/20">
              <h3 className="text-sm sm:text-base font-black text-zinc-950 uppercase tracking-wider">Coppe</h3>
              <span className="text-[10px] font-bold text-rose-900/80 block italic">"Il Sacro Graal"</span>
            </div>
          </div>

        </div>
      </div>

      {/* REGOLAMENTO UFFICIALE */}
      <div className="space-y-4">
        
        {/* FASI DEL GIOCO */}
        <div className="bg-white/80 border border-white/90 rounded-3xl p-6 shadow-md backdrop-blur-md space-y-5">
          
          {/* FASE 1: PREPARAZIONE */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-zinc-900 text-white text-xs font-black flex items-center justify-center shrink-0">
                1
              </span>
              <h3 className="text-sm font-black text-zinc-950 uppercase tracking-wide">
                Preparazione del Campo
              </h3>
            </div>
            <ul className="text-xs sm:text-sm text-zinc-700 space-y-1.5 pl-8 font-medium leading-relaxed list-disc">
              <li>
                Dal mazzo di carte (tipicamente napoletane e soprattutto <strong>GRANDI</strong>) vengono estratti i quattro cavalli, uno per ciascun seme: <strong>Bastoni, Ori, Spade e Coppe</strong>.
              </li>
              <li>
                Vengono disposte <strong>8 Carte coperte in linea</strong> che segnano gli step che i cavalli compiranno durante la gara.
              </li>
              <li>I cavalli vengono schierati sulla linea di partenza.</li>
            </ul>
          </div>

          <hr className="border-zinc-200/80" />

          {/* FASE 2: SCOMMESSE */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-zinc-900 text-white text-xs font-black flex items-center justify-center shrink-0">
                2
              </span>
              <h3 className="text-sm font-black text-zinc-950 uppercase tracking-wide">
                Scommesse e Fazioni
              </h3>
            </div>
            <p className="text-xs sm:text-sm text-zinc-700 pl-8 font-medium leading-relaxed">
              Ogni partecipante o gruppo di partecipanti sceglie ed esprime apertamente la propria lealtà incondizionata a uno dei quattro cavalli in gara.
            </p>
          </div>

          <hr className="border-zinc-200/80" />

          {/* FASE 3: SVOLGIMENTO */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-zinc-900 text-white text-xs font-black flex items-center justify-center shrink-0">
                3
              </span>
              <h3 className="text-sm font-black text-zinc-950 uppercase tracking-wide">
                Svolgimento della Corsa
              </h3>
            </div>
            <ul className="text-xs sm:text-sm text-zinc-700 space-y-2 pl-8 font-medium leading-relaxed">
              <li className="flex items-start gap-2">
                <span className="text-amber-600 font-bold">•</span>
                <span>
                  Il mazziere mescola le carte rimanenti e comincia a girarle una ad una singolarmente.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-amber-600 font-bold">•</span>
                <span>
                  Ogni volta che esce una carta di un determinato seme, il cavallo corrispondente avanza di una posizione verso il traguardo.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-amber-600 font-bold">•</span>
                <span>
                  Quando <strong>tutti e quattro i cavalli superano uno step</strong> (segnato da una delle 8 carte laterali), la carta di quello step viene girata e il seme raffigurato farà avanzare ulteriormente quel cavallo!
                </span>
              </li>
            </ul>
          </div>

        </div>

        {/* TAB VITTORIA & SCONFITTA (FONT CHIARO E BOLD) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          
          {/* TAB VITTORIA */}
          <div className="bg-emerald-600 text-white border-2 border-emerald-400 rounded-3xl p-5 shadow-lg backdrop-blur-md space-y-2">
            <div className="flex items-center gap-2 text-white">
              <TrophyIcon className="w-6 h-6 text-emerald-200" />
              <h3 className="text-base font-black tracking-wider uppercase drop-shadow-sm">
                VITTORIA
              </h3>
            </div>
            <p className="text-xs sm:text-sm font-bold text-emerald-50 leading-relaxed tracking-wide">
              Il primo cavallo che raggiunge la fine del percorso stabilito decreta la vittoria trionfale di tutti i giocatori che avevano scommesso su quel seme!
            </p>
          </div>

          {/* TAB SCONFITTA */}
          <div className="bg-rose-600 text-white border-2 border-rose-400 rounded-3xl p-5 shadow-lg backdrop-blur-md space-y-2">
            <div className="flex items-center gap-2 text-white">
              <BeerIcon className="w-6 h-6 text-rose-200" />
              <h3 className="text-base font-black tracking-wider uppercase drop-shadow-sm">
                SCONFITTA & PENITENZA
              </h3>
            </div>
            <p className="text-xs sm:text-sm font-bold text-rose-50 leading-relaxed tracking-wide">
              L'ultimo cavallo a tagliare il traguardo segna la sconfitta di chi ha creduto in lui. A causa di questo fallimento, ogni suo fedele sostenitore sarà <span className="underline decoration-2 underline-offset-2">costretto a bere!</span>
            </p>
          </div>

        </div>

      </div>
    </main>
  );
}