"use client";

import BackButton from "@/components/ui/BackButton";

// --- SVG Icons Minimal & Affilate ---
function FlameIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.362 5.214A8.252 8.252 0 0112 21 8.25 8.25 0 016.038 7.048 8.287 8.287 0 009 9.6a8.983 8.983 0 003.361-6.867 8.21 8.21 0 003 2.48z" />
    </svg>
  );
}

function CardsIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 6h12M6 10h12M6 14h8" />
    </svg>
  );
}

function CrownIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 3l3 6 5-2-2 10H6L4 7l5 2 3-6z" />
    </svg>
  );
}

function ShieldIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
    </svg>
  );
}

export default function BucockPage() {
  return (
    <main className="min-h-screen p-4 sm:p-6 pb-32 max-w-3xl mx-auto select-none space-y-8 text-zinc-950">
      
      {/* Tasto Indietro */}
      <div>
        <BackButton label="Indietro" />
      </div>

      {/* HERO SHOWCASE CON CARTA GIGANTE */}
      <header className="relative overflow-hidden bg-white/85 border border-white/90 rounded-[2.5rem] p-6 sm:p-9 shadow-2xl backdrop-blur-xl">
        
        {/* Glow cromatico d'atmosfera */}
        <div className="absolute -top-16 -right-16 w-80 h-80 bg-amber-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-16 -left-16 w-80 h-80 bg-amber-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col md:flex-row items-center justify-between gap-8 relative z-10">
          
          {/* Testi Principali */}
          <div className="flex-1 space-y-4 text-center md:text-left">
            <div className="space-y-1">
              <h1 className="text-5xl sm:text-6xl md:text-7xl font-black tracking-tight leading-none bg-gradient-to-br from-zinc-950 via-zinc-900 to-amber-950 bg-clip-text text-transparent">
                BUCOCK
              </h1>
              <p className="text-xs sm:text-sm font-black text-amber-900 tracking-wider uppercase">
                Manuale Ufficiale & Sacre Leggi del Tavolo
              </p>
            </div>

            <p className="text-xs sm:text-sm text-zinc-600 font-medium leading-relaxed max-w-md">
              Il rituale alcolico supremo di Monti. Strategia, spietatezza e goliardia pura attorno alla Corona del Destino.
            </p>

            {/* Badges Info */}
            <div className="pt-1 flex flex-wrap justify-center md:justify-start gap-2 text-[11px] font-black text-amber-950">
              <span className="px-3.5 py-1.5 rounded-2xl bg-amber-500/10 border border-amber-500/20">
                Goliardia Pura
              </span>
              <span className="px-3.5 py-1.5 rounded-2xl bg-amber-500/10 border border-amber-500/20">
                Nessuna Pietà
              </span>
            </div>
          </div>

          {/* CARTA GIGANTE PROTAGONISTA (retro.png) */}
          <div className="relative group shrink-0 my-2 md:my-0">
            {/* Bagliore dinamico attorno alla carta */}
            <div className="absolute inset-0 bg-gradient-to-tr from-amber-500/40 to-amber-300/30 rounded-[2rem] blur-2xl group-hover:scale-125 transition-transform duration-500" />

            <div className="relative w-52 sm:w-64 rounded-[2rem] p-2 bg-gradient-to-b from-amber-200 via-amber-400 to-amber-600 shadow-2xl transform -rotate-3 hover:rotate-0 hover:scale-105 transition-all duration-500">
              <div className="w-full rounded-[1.5rem] overflow-hidden bg-zinc-950 border border-white/30 shadow-inner">
                <img 
                  src="/bucock/retro.png" 
                  alt="Retro Carta Bucock" 
                  className="w-full h-auto object-cover group-hover:scale-105 transition-transform duration-500"
                />
              </div>
              
              {/* Seal Badge */}
              <div className="absolute -bottom-3 right-1/2 translate-x-1/2 px-3 py-1 rounded-full bg-zinc-950 text-amber-400 text-[9px] font-black uppercase tracking-widest border border-amber-500/40 shadow-lg whitespace-nowrap">
                Sigillo di Monti
              </div>
            </div>
          </div>

        </div>
      </header>

      {/* I TRE PILASTRI DELL'ONESTÀ E DELLA SPIETATEZZA */}
      <section className="space-y-3">
        
        {/* TAB INTESTAZIONE SEZIONE */}
        <div className="bg-white/80 border border-white/90 rounded-3xl p-4 shadow-md backdrop-blur-xl flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-amber-500/20 text-amber-950 border border-amber-500/30">
              <FlameIcon />
            </div>
            <div>
              <h2 className="text-xs sm:text-sm font-black uppercase tracking-wider text-zinc-950 leading-tight">
                I Tre Pilastri dell'Onestà e della Spietatezza
              </h2>
              <p className="text-[10px] text-zinc-500 font-bold">
                Le tre regole fondamentali inviolabili di Bucock
              </p>
            </div>
          </div>
          <span className="text-[10px] font-black uppercase tracking-widest text-amber-950 bg-amber-500/15 px-3 py-1 rounded-full border border-amber-500/25 self-start sm:self-auto">
            Dogmi del Tavolo
          </span>
        </div>

        {/* TAB PREMESSA GUIDA */}
        <div className="bg-white/60 border border-white/80 rounded-2xl p-3 px-4 shadow-xs backdrop-blur-md">
          <p className="text-xs text-zinc-700 font-semibold italic text-center">
            Prima che la prima carta venga sfiorata, questi tre comandi devono essere scolpiti nella mente di ogni partecipante.
          </p>
        </div>

        {/* CARDS PILASTRI */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 pt-1">
          
          {/* PILASTRO 1 */}
          <div className="bg-white/80 border border-white/90 rounded-3xl p-5 shadow-md backdrop-blur-xl space-y-2 relative overflow-hidden group hover:bg-white/95 transition-all">
            <span className="text-4xl font-black text-amber-500/20 absolute top-2 right-3 pointer-events-none group-hover:scale-110 transition-transform">
              01
            </span>
            <span className="inline-block text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md bg-amber-500/15 text-amber-950 border border-amber-500/20">
              Autonomia
            </span>
            <h3 className="text-xs font-black uppercase tracking-wider text-amber-950 leading-snug">
              1. La Libertà dello Spirito (e del Bicchiere)
            </h3>
            <p className="text-xs text-zinc-700 font-medium leading-relaxed">
              Ogni giocatore è unico padrone del proprio destino alcolico. Ciascuno è libero di scegliere cosa versare nel proprio bicchiere e quanto bere a ogni singola penitenza o sorso. <strong>Non si giudica la bevanda, si giudica l'attitudine.</strong>
            </p>
          </div>

          {/* PILASTRO 2 */}
          <div className="bg-white/80 border border-white/90 rounded-3xl p-5 shadow-md backdrop-blur-xl space-y-2 relative overflow-hidden group hover:bg-white/95 transition-all">
            <span className="text-4xl font-black text-amber-500/20 absolute top-2 right-3 pointer-events-none group-hover:scale-110 transition-transform">
              02
            </span>
            <span className="inline-block text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md bg-amber-500/15 text-amber-950 border border-amber-500/20">
              Immobilità
            </span>
            <h3 className="text-xs font-black uppercase tracking-wider text-amber-950 leading-snug">
              2. Il Sigillo del Tavolo
            </h3>
            <p className="text-xs text-zinc-700 font-medium leading-relaxed">
              Una volta posata la prima carta, la sedia diventa il tuo universo. <strong>È severamente vietato alzarsi dal tavolo per qualsiasi motivo</strong>, fosse anche per andare in bagno o rispondere a una chiamata d'emergenza. Chi abbandona il cerchio, abbandona l'onore.
            </p>
          </div>

          {/* PILASTRO 3 */}
          <div className="bg-white/80 border border-white/90 rounded-3xl p-5 shadow-md backdrop-blur-xl space-y-2 relative overflow-hidden group hover:bg-white/95 transition-all">
            <span className="text-4xl font-black text-amber-500/20 absolute top-2 right-3 pointer-events-none group-hover:scale-110 transition-transform">
              03
            </span>
            <span className="inline-block text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md bg-amber-500/15 text-amber-950 border border-amber-500/20">
              Senza Clemenza
            </span>
            <h3 className="text-xs font-black uppercase tracking-wider text-amber-950 leading-snug">
              3. Pietà è Sinonimo di Sconfitta
            </h3>
            <p className="text-xs text-zinc-700 font-medium leading-relaxed">
              Si gioca per ridere, si gioca per goliardia, ma la clemenza non è ammessa. Se un compagno commette un errore, va punito senza esitazione. <strong>La spietatezza è l'unico carburante che rende Bucock indimenticabile.</strong>
            </p>
          </div>

        </div>
      </section>

      {/* LA PREPARAZIONE DEL RITUALE */}
      <section className="bg-amber-500/10 border border-amber-500/30 rounded-3xl p-5 sm:p-6 shadow-md backdrop-blur-xl space-y-3">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-amber-500 text-amber-950 shadow-sm">
            <CrownIcon />
          </div>
          <div>
            <span className="text-[10px] font-black uppercase tracking-widest text-amber-900 block">
              Fase Iniziale
            </span>
            <h2 className="text-base font-black text-amber-950 leading-tight">
              La Preparazione del Rituale
            </h2>
          </div>
        </div>

        <p className="text-xs sm:text-sm text-amber-950 font-medium leading-relaxed">
          Al centro del campo di battaglia viene collocato un singolo bicchiere vuoto: <strong className="font-black text-amber-950">il Calice del Giudizio</strong>. Attorno a esso, le carte vengono sparpagliate a faccia in giù in modo del tutto casuale e caotico, a formare la <strong className="font-black text-amber-950">Corona del Destino</strong>.
        </p>

        <div className="pt-2 border-t border-amber-500/20 flex flex-wrap items-center justify-between gap-2 text-[11px] font-black text-amber-950">
          <span className="px-3 py-1 rounded-xl bg-white/80 border border-amber-500/30 shadow-xs">
            Inizio: Giocatore più giovane
          </span>
          <span className="px-3 py-1 rounded-xl bg-white/80 border border-amber-500/30 shadow-xs">
            Turnazione: Senso Orario
          </span>
        </div>
      </section>

      {/* IL CODICE DELLE CARTE (1 - 10) */}
      <section className="space-y-3">
        
        {/* TAB INTESTAZIONE CODICE CARTE */}
        <div className="bg-white/80 border border-white/90 rounded-3xl p-4 shadow-md backdrop-blur-xl flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-amber-500/20 text-amber-950 border border-amber-500/30">
              <CardsIcon />
            </div>
            <div>
              <h2 className="text-xs sm:text-sm font-black uppercase tracking-wider text-zinc-950 leading-tight">
                Il Codice delle Carte
              </h2>
              <p className="text-[10px] text-zinc-500 font-bold">
                Effetti e poteri dei numeri da 1 a 10
              </p>
            </div>
          </div>
          <span className="text-[10px] font-black uppercase tracking-widest text-amber-950 bg-amber-500/15 px-3 py-1 rounded-full border border-amber-500/25">
            Numeri 1-10
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          
          {/* CARTA 1 */}
          <div className="bg-white/80 border border-white/90 rounded-3xl p-4 shadow-sm backdrop-blur-md space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="w-7 h-7 rounded-2xl bg-amber-500/20 border border-amber-500/30 text-amber-950 font-black text-xs flex items-center justify-center shrink-0">
                1
              </span>
              <h3 className="text-xs font-black text-zinc-950 uppercase tracking-wide">
                La Scintilla
              </h3>
            </div>
            <p className="text-xs text-zinc-700 font-medium leading-relaxed">
              Regali <strong>1 bevuta</strong> a un giocatore a tua scelta. Un semplice assaggio di ciò che lo attende.
            </p>
          </div>

          {/* CARTA 2 */}
          <div className="bg-white/80 border border-white/90 rounded-3xl p-4 shadow-sm backdrop-blur-md space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="w-7 h-7 rounded-2xl bg-amber-500/20 border border-amber-500/30 text-amber-950 font-black text-xs flex items-center justify-center shrink-0">
                2
              </span>
              <h3 className="text-xs font-black text-zinc-950 uppercase tracking-wide">
                Il Doppio Colpo
              </h3>
            </div>
            <p className="text-xs text-zinc-700 font-medium leading-relaxed">
              Regali <strong>2 bevute</strong>. Puoi scagliarle contro un unico sfortunato o dividere il fardello distribuendo 1 bevuta a due persone diverse.
            </p>
          </div>

          {/* CARTA 3 */}
          <div className="bg-white/80 border border-white/90 rounded-3xl p-4 shadow-sm backdrop-blur-md space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="w-7 h-7 rounded-2xl bg-amber-500/20 border border-amber-500/30 text-amber-950 font-black text-xs flex items-center justify-center shrink-0">
                3
              </span>
              <h3 className="text-xs font-black text-zinc-950 uppercase tracking-wide">
                La Trinità
              </h3>
            </div>
            <p className="text-xs text-zinc-700 font-medium leading-relaxed">
              Regali <strong>3 bevute</strong>. Sei il signore del destino: assegna le 3 bevute come meglio credi (3 a uno solo, 2 a uno e 1 a un altro, oppure 1 a tre compagni).
            </p>
          </div>

          {/* CARTA 4 */}
          <div className="bg-rose-500/10 border border-rose-500/30 rounded-3xl p-4 shadow-sm backdrop-blur-md space-y-2">
            <div className="flex items-center gap-2">
              <span className="w-7 h-7 rounded-2xl bg-rose-600 text-white font-black text-xs flex items-center justify-center shrink-0 shadow-xs">
                4
              </span>
              <h3 className="text-xs font-black text-rose-950 uppercase tracking-wide">
                La Solenne Umiliazione
              </h3>
            </div>
            <p className="text-xs text-rose-950 font-semibold leading-relaxed">
              Il potere del 4 si subisce! Chi lo pesca deve immediatamente alzarsi in piedi, guardare il tavolo negli occhi e recitare la sentenza:
            </p>
            <div className="bg-white/90 p-2.5 rounded-2xl border border-rose-200 text-center shadow-xs">
              <span className="text-xs font-black text-rose-950 tracking-wide uppercase">
                "Sono un babbo e bevo."
              </span>
            </div>
          </div>

          {/* CARTA 5 */}
          <div className="bg-white/80 border border-white/90 rounded-3xl p-4 shadow-sm backdrop-blur-md space-y-1.5 sm:col-span-2">
            <div className="flex items-center gap-2">
              <span className="w-7 h-7 rounded-2xl bg-amber-500/20 border border-amber-500/30 text-amber-950 font-black text-xs flex items-center justify-center shrink-0">
                5
              </span>
              <h3 className="text-xs font-black text-zinc-950 uppercase tracking-wide">
                Il Potere del Pollice
              </h3>
            </div>
            <p className="text-xs text-zinc-700 font-medium leading-relaxed">
              Chi pesca il 5 diventa il <strong>Signore del Pollice</strong>. In qualsiasi momento può appoggiare con discrezione il pollice sul bordo del tavolo. Tutti gli altri devono imitarlo immediatamente: <strong>l'ultimo che appoggia il pollice beve.</strong> Il potere resta nelle sue mani finché non viene pescato un nuovo 5.
            </p>
          </div>

          {/* CARTA 6 */}
          <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-3xl p-4 shadow-sm backdrop-blur-md space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="w-7 h-7 rounded-2xl bg-emerald-600 text-white font-black text-xs flex items-center justify-center shrink-0 shadow-xs">
                6
              </span>
              <h3 className="text-xs font-black text-emerald-950 uppercase tracking-wide">
                La Salvezza (Bonus Bagno)
              </h3>
            </div>
            <p className="text-xs text-emerald-950 font-medium leading-relaxed">
              L'unica chiave di fuga dalla legge di ferro del Tavolo. Ricevi l'inestimabile <strong>BONUS BAGNO</strong>. Puoi conservarlo o usarlo subito per l'unica sosta fisiologica consentita.
            </p>
          </div>

          {/* CARTA 7 */}
          <div className="bg-white/80 border border-white/90 rounded-3xl p-4 shadow-sm backdrop-blur-md space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="w-7 h-7 rounded-2xl bg-amber-500/20 border border-amber-500/30 text-amber-950 font-black text-xs flex items-center justify-center shrink-0">
                7
              </span>
              <h3 className="text-xs font-black text-zinc-950 uppercase tracking-wide">
                La Cascata
              </h3>
            </div>
            <p className="text-xs text-zinc-700 font-medium leading-relaxed">
              Chi pesca il 7 inizia a bere. Contestualmente, <strong>tutti al tavolo devono iniziare a bere con lui</strong>. Nessuno può smettere finché colui che ha pescato la carta non stacca le labbra dal bicchiere!
            </p>
          </div>

          {/* CARTA 8 */}
          <div className="bg-amber-500/15 border border-amber-500/40 rounded-3xl p-5 shadow-md backdrop-blur-xl space-y-3 sm:col-span-2">
            <div className="flex items-center justify-between border-b border-amber-500/25 pb-2.5">
              <div className="flex items-center gap-2.5">
                <span className="w-8 h-8 rounded-2xl bg-amber-500 text-amber-950 font-black text-sm flex items-center justify-center shrink-0 shadow-sm">
                  8
                </span>
                <div>
                  <h3 className="text-sm font-black text-amber-950 uppercase tracking-wide">
                    Il Ritual del Bucock
                  </h3>
                  <span className="text-[10px] font-bold text-amber-900 block">
                    La carta da cui il gioco prende il nome
                  </span>
                </div>
              </div>
            </div>

            <p className="text-xs text-amber-950 font-semibold leading-relaxed">
              Qui la tavolata si trasforma in pura follia teatrale.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs text-amber-950">
              <div className="bg-white/80 p-3.5 rounded-2xl border border-amber-200/80 space-y-1">
                <span className="font-black block uppercase text-[10px] text-amber-900 border-b border-amber-200 pb-1">
                  1. La Maschera
                </span>
                <p className="font-medium pt-0.5">Tutti formano due cerchi con pollice e indice tenendo le altre tre dita a cresta e portandole agli occhi (la maschera del Gallo).</p>
              </div>

              <div className="bg-white/80 p-3.5 rounded-2xl border border-amber-200/80 space-y-1">
                <span className="font-black block uppercase text-[10px] text-amber-900 border-b border-amber-200 pb-1">
                  2. Il Passaggio
                </span>
                <p className="font-medium pt-0.5">
                  • Giocatore Lontano: muovi due braccia a cerniera urlando <strong>"BUCOOOCK!"</strong><br />
                  • Giocatore Vicino: muovi solo il braccio del lato dicendo <strong>"BOOOOCK!"</strong>
                </p>
              </div>

              <div className="bg-white/80 p-3.5 rounded-2xl border border-amber-200/80 space-y-1">
                <span className="font-black block uppercase text-[10px] text-amber-900 border-b border-amber-200 pb-1">
                  3. La Condanna
                </span>
                <p className="font-medium pt-0.5">Il Bucook vola finché qualcuno non cede. Il primo che ride o sbaglia il movimento/verso, <strong>beve!</strong></p>
              </div>
            </div>
          </div>

          {/* CARTA 9 */}
          <div className="bg-white/80 border border-white/90 rounded-3xl p-4 shadow-sm backdrop-blur-md space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="w-7 h-7 rounded-2xl bg-amber-500/20 border border-amber-500/30 text-amber-950 font-black text-xs flex items-center justify-center shrink-0">
                9
              </span>
              <h3 className="text-xs font-black text-zinc-950 uppercase tracking-wide">
                Il Decreto (Potere della Regola)
              </h3>
            </div>
            <p className="text-xs text-zinc-700 font-medium leading-relaxed">
              Diventi il Legislatore. Puoi inventare e promulgare una <strong>regola arbitraria</strong> in vigore fino a fine partita (es. "Vietato chiamarsi per nome"). Chi la infrange, beve immediatamente.
            </p>
          </div>

          {/* CARTA 10 */}
          <div className="bg-white/80 border border-white/90 rounded-3xl p-4 shadow-sm backdrop-blur-md space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="w-7 h-7 rounded-2xl bg-amber-500/20 border border-amber-500/30 text-amber-950 font-black text-xs flex items-center justify-center shrink-0">
                10
              </span>
              <h3 className="text-xs font-black text-zinc-950 uppercase tracking-wide">
                L'Inganno (Potere della Domanda)
              </h3>
            </div>
            <p className="text-xs text-zinc-700 font-medium leading-relaxed">
              Diventi una trappola vivente. Chiunque risponda a una tua qualsiasi domanda è costretto a bere! (Consiglio: fai domande banali come "Che ora è?" per cogliere gli sprovveduti).
            </p>
          </div>

        </div>
      </section>

      {/* LE FIGURE SACRE & SEZIONE DEI RE */}
      <section className="space-y-3">
        
        {/* TAB INTESTAZIONE FIGURE SACRE */}
        <div className="bg-white/80 border border-white/90 rounded-3xl p-4 shadow-md backdrop-blur-xl flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-amber-500/20 text-amber-950 border border-amber-500/30">
              <ShieldIcon />
            </div>
            <div>
              <h2 className="text-xs sm:text-sm font-black uppercase tracking-wider text-zinc-950 leading-tight">
                Le Figure Sacre
              </h2>
              <p className="text-[10px] text-zinc-500 font-bold">
                Effetti speciali per Fante, Donna e il Calice del Re
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          
          {/* FANTE */}
          <div className="bg-white/80 border border-white/90 rounded-3xl p-5 shadow-sm backdrop-blur-md space-y-1.5">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-black text-zinc-950 uppercase tracking-wide">
                FANTE
              </h3>
              <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-blue-500/10 text-blue-900 border border-blue-500/20">
                Uomini
              </span>
            </div>
            <p className="text-xs font-bold text-zinc-800">
              La Chiamata degli Uomini
            </p>
            <p className="text-xs text-zinc-600 font-medium leading-relaxed">
              Tutti i maschi al tavolo devono immediatamente effettuare una bevuta.
            </p>
          </div>

          {/* DONNA */}
          <div className="bg-white/80 border border-white/90 rounded-3xl p-5 shadow-sm backdrop-blur-md space-y-1.5">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-black text-zinc-950 uppercase tracking-wide">
                DONNA
              </h3>
              <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-rose-500/10 text-rose-900 border border-rose-500/20">
                Donne
              </span>
            </div>
            <p className="text-xs font-bold text-zinc-800">
              La Chiamata delle Donne
            </p>
            <p className="text-xs text-zinc-600 font-medium leading-relaxed">
              Tutte le femmine al tavolo devono immediatamente effettuare una bevuta.
            </p>
          </div>

          {/* RE — LA MALEDIZIONE DEL CALICE */}
          <div className="bg-gradient-to-br from-amber-500/25 via-amber-500/15 to-amber-500/5 border-2 border-amber-500/40 rounded-[2.2rem] p-6 sm:p-7 shadow-xl backdrop-blur-xl space-y-6 sm:col-span-2 relative overflow-hidden">
            
            <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/20 rounded-full blur-3xl pointer-events-none" />

            <div className="flex flex-col md:flex-row items-center justify-between gap-6 border-b border-amber-500/30 pb-5">
              
              <div className="space-y-2 text-center md:text-left">
                <span className="inline-block text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full bg-amber-500 text-amber-950 shadow-xs">
                  Ammissione Finale
                </span>
                <h3 className="text-2xl sm:text-3xl font-black text-amber-950 uppercase tracking-tight leading-none">
                  RE — La Maledizione del Calice
                </h3>
                <p className="text-xs font-bold text-amber-900/90">
                  Gestione del bicchiere vuoto al centro e verdetto di fine partita
                </p>
              </div>

              {/* IMMAGINE CARTE.PNG */}
              <div className="relative group shrink-0">
                <div className="absolute inset-0 bg-amber-500/35 rounded-full blur-2xl group-hover:scale-125 transition-transform duration-500" />
                <img 
                  src="/bucock/carte.png" 
                  alt="Le Carte del Re" 
                  className="relative w-48 h-48 sm:w-56 sm:h-56 object-contain drop-shadow-2xl group-hover:scale-105 transition-transform duration-300" 
                />
              </div>

            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              
              {/* PRIMI 3 RE */}
              <div className="bg-white/85 p-5 rounded-2xl border border-amber-300/80 space-y-2 shadow-xs">
                <span className="text-xs font-black text-amber-950 uppercase tracking-wider block border-b border-amber-200 pb-1">
                  🧪 I Primi Tre Re (1°, 2°, 3°)
                </span>
                <p className="text-xs text-zinc-700 font-medium leading-relaxed">
                  Chi pesca uno dei primi tre Re deve versare all'interno del calice centrale una quantità a sua scelta di un qualsiasi alcolico presente al tavolo. <strong className="text-amber-950">Nasce così un intruglio ignobile e spietato.</strong>
                </p>
              </div>

              {/* QUARTO RE */}
              <div className="bg-zinc-950 text-white p-5 rounded-2xl border border-amber-500/60 space-y-2 shadow-xl">
                <span className="text-xs font-black text-amber-400 uppercase tracking-wider block border-b border-amber-500/30 pb-1">
                  💀 Il Quarto Re (La Condanna Finale)
                </span>
                <p className="text-xs text-zinc-300 font-semibold leading-relaxed">
                  Colui che ha la sventura di pescare il quarto e ultimo Re deve prendere il <strong className="text-amber-300">Calice del Giudizio</strong>, scolare interamente l'intruglio davanti a tutti e decretare la fine ufficiale della partita a Bucock.
                </p>
              </div>

            </div>

          </div>

        </div>
      </section>

    </main>
  );
}