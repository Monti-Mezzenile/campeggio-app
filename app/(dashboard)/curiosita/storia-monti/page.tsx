"use client";

import BackButton from "@/components/ui/BackButton";

// --- Utility SVG Icons ---
function MountainIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 20l6.5-11 3.5 6 3-4.5 5 9.5H3z" />
    </svg>
  );
}

function SnowflakeIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 2v20m10-10H2m15.071-7.071L6.929 17.071M17.071 17.071L6.929 6.929" />
    </svg>
  );
}

function FilmIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M7 4v16M17 4v16M3 8h18M3 16h18M3 12h18" />
    </svg>
  );
}

function SparklesIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 3v4M3 5h4M6 17v4m-2-2h4m11-16l1.5 4.5L21 7l-4.5 1.5L15 13l-1.5-4.5L9 7l4.5-1.5L15 1z" />
    </svg>
  );
}

export default function StoriaMontiPage() {
  return (
    <main className="min-h-screen p-4 sm:p-6 pb-32 max-w-2xl mx-auto text-zinc-900">
      {/* Botton Indietro */}
      <div className="mb-4">
        <BackButton label="Indietro" />
      </div>

      {/* HERO BANNER */}
      <div className="relative overflow-hidden bg-white/80 border border-white/90 rounded-3xl p-6 sm:p-8 shadow-xl backdrop-blur-md mb-6">
        <div className="absolute top-0 right-0 -mr-8 -mt-8 w-36 h-36 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />
        
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-950 text-[10px] font-black uppercase tracking-wider mb-3">
          <MountainIcon className="w-3.5 h-3.5 text-emerald-700" />
          <span>Monti di Mezzenile</span>
        </div>

        <h1 className="text-3xl sm:text-4xl font-black text-zinc-950 tracking-tight leading-tight mb-3">
          La Storia di Monti
        </h1>

        <p className="text-xs sm:text-sm font-medium text-zinc-600 leading-relaxed">
          Nel cuore profondo della provincia italiana, dove la routine quotidiana rischia continuamente di spegnere ogni slancio di spontaneità, nacque un rito indissolubile.
        </p>
      </div>

      {/* STRUTTURA DEL RACCONTO */}
      <div className="space-y-4">
        
        {/* PARAGRAFO 1: L'ORIGINE */}
        <div className="bg-white/80 border border-white/90 rounded-3xl p-6 shadow-md backdrop-blur-md space-y-3">
          <p className="text-xs sm:text-sm text-zinc-700 leading-relaxed font-normal">
            Un gruppo stretto di amici decise di istituire una tradizione annuale: tre giorni di totale distacco dal mondo, ritirandosi sempre nello stesso identico posto, arroccato tra le vette sopra Monti di Mezzenile. Quel luogo non era una semplice meta turistica: era Monti.
          </p>

          <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-4 text-xs font-bold text-amber-950 italic backdrop-blur-sm">
            "Con il passare del tempo, non furono gli amici a plasmare il luogo, ma fu Monti stesso a plasmare e unire il gruppo, diventando una vera e propria entità spirituale e identitaria."
          </div>
        </div>

        {/* PARAGRAFO 2: L'ANTIDOTO & LA GRADINATA D'ONORE */}
        <div className="bg-white/80 border border-white/90 rounded-3xl p-6 shadow-md backdrop-blur-md space-y-4">
          <p className="text-xs sm:text-sm text-zinc-700 leading-relaxed font-normal">
            Per il gruppo, Monti rappresentava l'antidoto perfetto alle rigide convenzioni sociali. Durante il resto dell'anno, ciascuno di loro era costretto a vivere in una società dominata da regole asfissianti, formalità, aspettative e giudizi. A Monti, invece, la realtà veniva completamente sovvertita.
          </p>

          {/* Card Evidenziata: Gradinata d'Onore */}
          <div className="bg-zinc-900 text-zinc-100 rounded-2xl p-4 sm:p-5 shadow-inner relative overflow-hidden">
            <div className="absolute -top-2 -right-2 p-2 opacity-15 text-amber-400">
              <SparklesIcon className="w-16 h-16" />
            </div>
            <span className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-amber-400 mb-2">
              <SparklesIcon className="w-3.5 h-3.5 text-amber-400" />
              <span>La Gradinata d'Onore</span>
            </span>
            <p className="text-xs leading-relaxed text-zinc-300 font-medium">
              La vista mozzafiato che si godeva dalla montagna infondeva un senso di appartenenza così assoluto che i ragazzi scherzavano spesso su pensieri estremi: se mai un giorno l'umanità avesse dovuto assistere alla propria fine — magari contemplando la caduta di una bomba atomica — non avrebbero esitato a scegliere Monti come gradinata d'onore per osservare il mondo svanire.
            </p>
          </div>
        </div>

        {/* PARAGRAFO 3: MONTI WINTER */}
        <div className="bg-white/80 border border-white/90 rounded-3xl p-6 shadow-md backdrop-blur-md space-y-3">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-xl bg-blue-500/10 text-blue-600 border border-blue-500/20">
              <SnowflakeIcon className="w-4 h-4" />
            </div>
            <h2 className="text-sm font-black text-zinc-950 uppercase tracking-wider">
              Capitoli Invernali & Goliardia
            </h2>
          </div>

          <p className="text-xs sm:text-sm text-zinc-700 leading-relaxed font-normal">
            Con l'avvento dei capitoli invernali, noti come <strong className="font-bold text-zinc-950">Monti Winter</strong>, le sfide si fecero per veri duri. Il freddo, la neve e le intemperie rafforzarono lo spirito di corpo, alimentando un fomento goliardico senza precedenti. Il gruppo iniziò a sviluppare outfit fortemente personalizzati, nomi in codice segreti, rituali di passaggio e persino medaglie al valore per premiare le gesta più memorabili.
          </p>
        </div>

        {/* PARAGRAFO 4 & 5: L'INQUISITORE E LA RISPOSTA */}
        <div className="bg-white/80 border border-white/90 rounded-3xl p-6 shadow-md backdrop-blur-md space-y-4">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-xl bg-purple-500/10 text-purple-600 border border-purple-500/20">
              <FilmIcon className="w-4 h-4" />
            </div>
            <span className="text-[11px] font-black text-purple-900 uppercase tracking-wider">
              Dal Film “Monti 3. Altrove”
            </span>
          </div>

          <p className="text-xs sm:text-sm text-zinc-700 leading-relaxed font-normal">
            Quando un inquisitore o intervistatore esterno (nel film <em>“monti 3. Altrove”</em>) tentò di analizzare il materiale filmato di quelle giornate, avanzò un'obiezione spontanea: tutto quell'affiatamento, condito da divise e cerimoniali, non era forse il preludio a una vera e propria setta?
          </p>

          <blockquote className="bg-emerald-500/10 border-l-4 border-emerald-500 p-4 rounded-r-2xl text-xs sm:text-sm text-emerald-950 leading-relaxed font-semibold">
            <span className="block font-black mb-1 uppercase text-[10px] tracking-wider text-emerald-800">
              La Risposta dei Membri:
            </span>
            "Una setta è una struttura rigida gestita da regole, dogmi e controllo. Monti, al contrario, era il regno dell'assenza di regole e di giudizio. Era uno spazio protetto in cui ciascuno poteva liberare la parte più vera, stravagante e felice di sé, giocando come da bambini senza il peso di dover dimostrare nulla a nessuno."
          </blockquote>
        </div>

        {/* MANIFESTO FINALE */}
        <div className="bg-gradient-to-r from-amber-500/20 via-amber-500/10 to-amber-500/20 border border-amber-500/30 rounded-3xl p-6 text-center backdrop-blur-md shadow-sm">
          <p className="text-sm sm:text-base font-black text-amber-950 tracking-wider uppercase">
            Questo è Monti, e lo sarà per sempre.
          </p>
        </div>

      </div>
    </main>
  );
}