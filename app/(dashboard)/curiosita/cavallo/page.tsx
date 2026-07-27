"use client";

import BackButton from "@/components/ui/BackButton";

// --- SVG Icons Minimal & Affilate (0 Emoji) ---
function CoinIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-6h6m6 0a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

function HandIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M7 11.5V14m0 0v2.5m0-2.5h10m-10 0H4.5m15 0a2.5 2.5 0 00-2.5-2.5H16M7 11.5A2.5 2.5 0 019.5 9h5A2.5 2.5 0 0117 11.5M7 11.5V7a2 2 0 012-2h6a2 2 0 012 2v4.5" />
    </svg>
  );
}

function MegaphoneIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 013 10c0-1.602.941-2.984 2.302-3.632M13 12H3m10-7l7 3.5V15.5L13 19V5z" />
    </svg>
  );
}

function ShieldAlertIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m0-10.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285zM12 15.75h.007v.008H12v-.008z" />
    </svg>
  );
}

function DrinkIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19 14.5M14.25 3.104c.251.023.501.05.75.082M19 14.5a3.75 3.75 0 01-3.75 3.75H8.75A3.75 3.75 0 015 14.5m14 0V21a.75.75 0 01-.75.75H5.75A.75.75 0 015 21v-6.5" />
    </svg>
  );
}

export default function CavalloPage() {
  return (
    <main className="min-h-screen p-4 sm:p-6 pb-32 max-w-3xl mx-auto select-none space-y-8 text-zinc-950">
      
      {/* Tasto Indietro */}
      <div>
        <BackButton label="Indietro" />
      </div>

      {/* HERO SHOWCASE CLUB DEL CAVALLO */}
      <header className="relative overflow-hidden bg-white/85 border border-white/90 rounded-[2.5rem] p-6 sm:p-9 shadow-2xl backdrop-blur-xl">
        
        {/* Glow cromatico d'atmosfera */}
        <div className="absolute -top-16 -right-16 w-80 h-80 bg-amber-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-16 -left-16 w-80 h-80 bg-amber-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col md:flex-row items-center justify-between gap-8 relative z-10">
          
          {/* Testi Principali */}
          <div className="flex-1 space-y-4 text-center md:text-left">
            <div className="space-y-1">
              <h1 className="text-4xl sm:text-5xl md:text-6xl font-black tracking-tight leading-none bg-gradient-to-br from-zinc-950 via-zinc-900 to-amber-950 bg-clip-text text-transparent">
                CLUB DEL CAVALLO
              </h1>
              <p className="text-xs sm:text-sm font-black text-amber-900 tracking-wider uppercase">
                Il Rito del Ramino & La Legge della Mano Sbagliata
              </p>
            </div>

            <p className="text-xs sm:text-sm text-zinc-600 font-medium leading-relaxed max-w-md">
              Stato mentale permanente, patto di sangue sociale e disciplina collettiva. A Monti l'attenzione non può mai calare.
            </p>

            {/* Badges Info */}
            <div className="pt-1 flex flex-wrap justify-center md:justify-start gap-2 text-[11px] font-black text-amber-950">
              <span className="px-3.5 py-1.5 rounded-2xl bg-amber-500/10 border border-amber-500/20">
                Patto Inviolabile
              </span>
              <span className="px-3.5 py-1.5 rounded-2xl bg-amber-500/10 border border-amber-500/20">
                Vigilanza Costante
              </span>
            </div>
          </div>

          {/* EMBLEMA CON IMMAGINE CAVALLO.PNG */}
          <div className="relative group shrink-0 my-2 md:my-0">
            <div className="absolute inset-0 bg-gradient-to-tr from-amber-500/40 to-amber-300/30 rounded-full blur-2xl group-hover:scale-125 transition-transform duration-500" />

            <div className="relative w-40 h-40 sm:w-48 sm:h-48 rounded-full p-2 bg-gradient-to-b from-amber-200 via-amber-400 to-amber-600 shadow-2xl flex items-center justify-center transform -rotate-3 hover:rotate-0 hover:scale-105 transition-all duration-500">
              <div className="w-full h-full rounded-full bg-zinc-950 border border-white/30 flex items-center justify-center p-3 text-center shadow-inner overflow-hidden">
                <img 
                  src="/curiosity/cavallo.png" 
                  alt="Club del Cavallo" 
                  className="w-full h-full object-contain drop-shadow-xl group-hover:scale-110 transition-transform duration-500" 
                />
              </div>

              {/* Tag Circolare */}
              <div className="absolute -bottom-2 px-3 py-1 rounded-full bg-zinc-950 text-amber-400 text-[9px] font-black uppercase tracking-widest border border-amber-500/40 shadow-lg whitespace-nowrap">
                Monti Brotherhood
              </div>
            </div>
          </div>

        </div>
      </header>

      {/* RITUALE D'INIZIAZIONE: IL LANCIO DEL RAMINO */}
      <section className="space-y-3">
        
        {/* TAB INTESTAZIONE */}
        <div className="bg-white/80 border border-white/90 rounded-3xl p-4 shadow-md backdrop-blur-xl flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-amber-500/20 text-amber-950 border border-amber-500/30">
              <CoinIcon />
            </div>
            <div>
              <h2 className="text-xs sm:text-sm font-black uppercase tracking-wider text-zinc-950 leading-tight">
                Il Ritual d'Iniziazione
              </h2>
              <p className="text-[10px] text-zinc-500 font-bold">
                Il gesto solenne che segna il punto di non ritorno
              </p>
            </div>
          </div>
          <span className="text-[10px] font-black uppercase tracking-widest text-amber-950 bg-amber-500/15 px-3 py-1 rounded-full border border-amber-500/25">
            Ingresso Ufficiale
          </span>
        </div>

        {/* CONTENUTO RITO */}
        <div className="bg-white/80 border border-white/90 rounded-3xl p-5 sm:p-6 shadow-md backdrop-blur-xl space-y-4">
          <p className="text-xs sm:text-sm text-zinc-700 font-medium leading-relaxed">
            Non ci si ritrova nel Club del Cavallo per caso, né ci si può semplicemente "iscrivere". L'ingresso nella fratellanza richiede un atto solenne e irriverente:
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
            
            {/* STEP 1 */}
            <div className="bg-amber-500/10 border border-amber-500/25 p-4 rounded-2xl space-y-1.5">
              <span className="text-[10px] font-black uppercase tracking-widest text-amber-900 block">
                Passo 01
              </span>
              <h3 className="text-xs font-black text-amber-950 uppercase">
                La Moneta
              </h3>
              <p className="text-[11px] text-zinc-700 font-medium leading-relaxed">
                Stringere tra le dita un ramino da 1, 2 o 5 centesimi.
              </p>
            </div>

            {/* STEP 2 */}
            <div className="bg-amber-500/10 border border-amber-500/25 p-4 rounded-2xl space-y-1.5">
              <span className="text-[10px] font-black uppercase tracking-widest text-amber-900 block">
                Passo 02
              </span>
              <h3 className="text-xs font-black text-amber-950 uppercase">
                Il Volta-Spalle
              </h3>
              <p className="text-[11px] text-zinc-700 font-medium leading-relaxed">
                Voltare le spalle al gruppo o al tavolo principale.
              </p>
            </div>

            {/* STEP 3 */}
            <div className="bg-amber-500/10 border border-amber-500/25 p-4 rounded-2xl space-y-1.5">
              <span className="text-[10px] font-black uppercase tracking-widest text-amber-900 block">
                Passo 03
              </span>
              <h3 className="text-xs font-black text-amber-950 uppercase">
                Il Lancio Sacro
              </h3>
              <p className="text-[11px] text-zinc-700 font-medium leading-relaxed">
                Pronunciare l'impegno d'onore e lanciare la moneta all'indietro sopra la spalla.
              </p>
            </div>

          </div>

          <div className="p-3.5 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-center">
            <p className="text-xs font-black text-amber-950 uppercase tracking-wide">
              Nel preciso istante in cui la moneta tocca terra, sei membro del Club del Cavallo fino a fine soggiorno.
            </p>
          </div>
        </div>

      </section>

      {/* ONORE, DISCIPLINA & LEGGE DELLA MANO SBAGLIATA */}
      <section className="space-y-3">
        
        {/* TAB INTESTAZIONE */}
        <div className="bg-white/80 border border-white/90 rounded-3xl p-4 shadow-md backdrop-blur-xl flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-amber-500/20 text-amber-950 border border-amber-500/30">
              <HandIcon />
            </div>
            <div>
              <h2 className="text-xs sm:text-sm font-black uppercase tracking-wider text-zinc-950 leading-tight">
                La Legge della Mano Sbagliata
              </h2>
              <p className="text-[10px] text-zinc-500 font-bold">
                Il dogma fondamentale del Club del Cavallo
              </p>
            </div>
          </div>
          <span className="text-[10px] font-black uppercase tracking-widest text-amber-950 bg-amber-500/15 px-3 py-1 rounded-full border border-amber-500/25">
            Dogma Assoluto
          </span>
        </div>

        {/* BOX DOGMA CENTRALE */}
        <div className="bg-gradient-to-br from-amber-500/20 via-amber-500/10 to-amber-500/5 border-2 border-amber-500/40 rounded-3xl p-5 sm:p-6 shadow-xl backdrop-blur-xl space-y-4">
          
          <div className="bg-white/90 p-4 rounded-2xl border border-amber-300 text-center space-y-1 shadow-xs">
            <span className="text-[10px] font-black uppercase tracking-widest text-amber-800 block">
              Regola D'Oro
            </span>
            <p className="text-xs sm:text-sm font-black text-amber-950 uppercase tracking-tight">
              Un vero membro non deve MAI portare un bicchiere alle labbra con la propria mano dominante.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            
            {/* DESTRIMANI */}
            <div className="bg-white/80 p-4 rounded-2xl border border-white/90 space-y-1 shadow-xs">
              <span className="text-xs font-black text-zinc-950 uppercase block">
                Se sei Destrimano
              </span>
              <p className="text-xs text-zinc-700 font-medium leading-relaxed">
                Il tuo bicchiere dovrà essere impugnato, sollevato e svuotato <strong>esclusivamente con la mano SINISTRA</strong>.
              </p>
            </div>

            {/* MANCINI */}
            <div className="bg-white/80 p-4 rounded-2xl border border-white/90 space-y-1 shadow-xs">
              <span className="text-xs font-black text-zinc-950 uppercase block">
                Se sei Mancino
              </span>
              <p className="text-xs text-zinc-700 font-medium leading-relaxed">
                La tua sola salvezza sarà impugnare e bere <strong>esclusivamente con la mano DESTRA</strong>.
              </p>
            </div>

          </div>

        </div>

      </section>

      {/* LA CHIAMATA E LA PENITENZA DEL CAVALLO */}
      <section className="space-y-3">
        
        {/* TAB INTESTAZIONE */}
        <div className="bg-white/80 border border-white/90 rounded-3xl p-4 shadow-md backdrop-blur-xl flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-amber-500/20 text-amber-950 border border-amber-500/30">
              <MegaphoneIcon />
            </div>
            <div>
              <h2 className="text-xs sm:text-sm font-black uppercase tracking-wider text-zinc-950 leading-tight">
                La Chiamata & La Penitenza
              </h2>
              <p className="text-[10px] text-zinc-500 font-bold">
                Cosa accade quando vieni sorpreso in fallo
              </p>
            </div>
          </div>
        </div>

        {/* ACCUSA E CHIAMATA */}
        <div className="bg-white/80 border border-white/90 rounded-3xl p-5 shadow-md backdrop-blur-xl space-y-3">
          <p className="text-xs text-zinc-700 font-medium leading-relaxed">
            Appena un membro impugna il proprio drink con la mano sbagliata, chiunque lo noti deve puntargli il dito contro e tuonare a gran voce:
          </p>

          <div className="bg-amber-500 p-4 rounded-2xl text-center shadow-md">
            <span className="text-2xl sm:text-3xl font-black text-amber-950 tracking-widest uppercase">
              "CAVALLO!"
            </span>
          </div>

          {/* DUE VIE DI RISCATTO */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            
            <div className="bg-white/90 p-4 rounded-2xl border border-amber-200 space-y-1.5 shadow-xs">
              <div className="flex items-center gap-2 text-amber-950">
                <DrinkIcon />
                <h3 className="text-xs font-black uppercase">1. Il Calice del Sacrificio</h3>
              </div>
              <p className="text-[11px] text-zinc-700 font-medium leading-relaxed">
                Scolare ed estinguere fino all'ultima goccia l'intero contenuto del proprio bicchiere tutto d'un fiato (Chug / Down).
              </p>
            </div>

            <div className="bg-white/90 p-4 rounded-2xl border border-amber-200 space-y-1.5 shadow-xs">
              <div className="flex items-center gap-2 text-amber-950">
                <CoinIcon />
                <h3 className="text-xs font-black uppercase">2. Il Dazio dell'Onore</h3>
              </div>
              <p className="text-[11px] text-zinc-700 font-medium leading-relaxed">
                Sottomettersi all'accusatore e pagargli immediatamente un dazio solenne offrendogli un intero drink di sua scelta.
              </p>
            </div>

          </div>
        </div>

      </section>

      {/* IL MARCHIO DELL'INFAMIA: IL CONIGLIO */}
      <section className="space-y-3">
        
        {/* TAB INTESTAZIONE */}
        <div className="bg-zinc-950 text-white rounded-3xl p-4 shadow-xl border border-amber-500/40 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-rose-500/20 text-rose-400 border border-rose-500/30">
              <ShieldAlertIcon />
            </div>
            <div>
              <h2 className="text-xs sm:text-sm font-black uppercase tracking-wider text-amber-400 leading-tight">
                Il Marchio dell'Infamia
              </h2>
              <p className="text-[10px] text-zinc-400 font-bold">
                Ispirato alla filosofia ribelle di I Love Radio Rock
              </p>
            </div>
          </div>
          <span className="text-[10px] font-black uppercase tracking-widest text-rose-400 bg-rose-500/20 px-3 py-1 rounded-full border border-rose-500/30">
            Il Coniglio
          </span>
        </div>

        {/* BOX CONDANNA CONIGLIO */}
        <div className="bg-zinc-950 text-zinc-300 rounded-3xl p-6 shadow-2xl border border-amber-500/30 space-y-4">
          <p className="text-xs sm:text-sm font-medium leading-relaxed text-zinc-300">
            Chiunque si rifiuti di lanciare il ramino per paura, chiunque tenti di fare il furbo o accampi scuse codarde dopo essere stato sorpreso in fallo, va incontro al destino più cupo.
          </p>

          <div className="bg-rose-500/10 border border-rose-500/30 p-4 rounded-2xl text-center space-y-1">
            <span className="text-[10px] font-black uppercase tracking-widest text-rose-400 block">
              Titolo Infamante Solenne
            </span>
            <span className="text-2xl sm:text-3xl font-black text-rose-500 tracking-widest uppercase block">
              "CONIGLIO"
            </span>
          </div>

          <p className="text-xs text-zinc-400 font-medium leading-relaxed italic text-center">
            Essere un Coniglio a Monti significa portare addosso il marchio della codardia: colui che ha avuto paura di mettersi in gioco, di ridere di sé e di vivere fino in fondo lo spirito della montagna.
          </p>
        </div>

      </section>

    </main>
  );
}