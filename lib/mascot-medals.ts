export interface Medal { id: string; name: string; category: string; requirement: string; quip: string; target: number; image: string | null }
export const MEDALS: Medal[] = [
  {
    "id": "indagato-grigliata",
    "name": "Indagato per grigliata aggravata",
    "category": "Finanza",
    "requirement": "Subire una correzione degli XP della grigliata.",
    "quip": "Dichiarava carote. Fatturava costine.",
    "target": 1,
    "image": "/medagliegiochi/indagato-grigliata.png"
  },
  {
    "id": "nullatenente-di-ritorno",
    "name": "Nullatenente di ritorno",
    "category": "Finanza",
    "requirement": "Perdere almeno una fase durante la verifica fiscale.",
    "quip": "Il patrimonio era tutto in salsicce.",
    "target": 1,
    "image": "/medagliegiochi/ullatenente-di-ritorno.png"
  },
  {
    "id": "riabilitato-alla-brace",
    "name": "Riabilitato alla brace",
    "category": "Finanza",
    "requirement": "Completare 10 grigliate iniziate dopo la tua verifica fiscale. Contano soltanto le partite del nuovo registro.",
    "quip": "Ha pagato il conto. Ora pretende la ricevuta.",
    "target": 10,
    "image": "/medagliegiochi/fedina-culinaria-pulita.png"
  },
  {
    "id": "testimone-della-griglia",
    "name": "Testimone della griglia",
    "category": "Finanza",
    "requirement": "Avere una cavia all’attivazione del medagliere.",
    "quip": "Non ho visto niente. Ero alla griglia.",
    "target": 1,
    "image": "/medagliegiochi/testimone-della-griglia.png"
  },
  {
    "id": "responsabile-essere-discutibile",
    "name": "Responsabile di un essere discutibile",
    "category": "Vita da cavia",
    "requirement": "Prenderti cura della cavia per 15 giorni consecutivi.",
    "quip": "Qualcuno doveva pur farlo.",
    "target": 15,
    "image": "/medagliegiochi/responsabile-essere-discutibile.png"
  },
  {
    "id": "tagliando-completo",
    "name": "Tagliando completo",
    "category": "Vita da cavia",
    "requirement": "Riportare tutte le barre al massimo 50 volte. Conta un nuovo riempimento, dopo che una barra è scesa sotto il massimo.",
    "quip": "Per trenta secondi non aveva niente di cui lamentarsi.",
    "target": 50,
    "image": "/medagliegiochi/tagliando-completo.png"
  },
  {
    "id": "carota-identita",
    "name": "Carota d’identità",
    "category": "Vita da cavia",
    "requirement": "Dare 100 carote alla tua cavia.",
    "quip": "Ormai è composta al 70% da arancione.",
    "target": 100,
    "image": "/medagliegiochi/carota-identita.png"
  },
  {
    "id": "fegato-comodato",
    "name": "Fegato in comodato d’uso",
    "category": "Vita da cavia",
    "requirement": "Dare 100 birre alla tua cavia.",
    "quip": "Il proprietario originale lo rivorrebbe.",
    "target": 100,
    "image": "/medagliegiochi/fegato-comodato.png"
  },
  {
    "id": "patentino-revocato",
    "name": "Patentino revocato",
    "category": "Vita da cavia",
    "requirement": "Usare il drone 100 volte con la tua cavia.",
    "quip": "Il bosco è una zona di interdizione al volo.",
    "target": 100,
    "image": "/medagliegiochi/patentino-revocato.png"
  },
  {
    "id": "non-era-un-coniglio",
    "name": "Non era un coniglio?",
    "category": "Vita da cavia",
    "requirement": "Raggiungere la fase 5 con una nuova evoluzione dopo l’apertura del medagliere.",
    "quip": "Sulla confezione sembrava più piccolo.",
    "target": 1,
    "image": "/medagliegiochi/non-era-un-coniglio.png"
  },
  {
    "id": "pigna-di-traverso",
    "name": "Pigna di traverso",
    "category": "Pessimo vicinato",
    "requirement": "Lanciare una pigna a un’altra cavia.",
    "quip": "Un saluto che lascia il segno.",
    "target": 1,
    "image": "/medagliegiochi/pigna-di-traverso.png"
  },
  {
    "id": "problema-condominiale",
    "name": "Problema condominiale",
    "category": "Pessimo vicinato",
    "requirement": "Disturbare altre cavie 50 volte con pigne o sveglie.",
    "quip": "La riunione straordinaria parla di te.",
    "target": 50,
    "image": "/medagliegiochi/problema-condominiale.png"
  },
  {
    "id": "protezione-civile-cavie",
    "name": "Protezione Civile delle Cavie",
    "category": "Pessimo vicinato",
    "requirement": "Aiutare altre cavie 50 volte con cibo, birra o gioco.",
    "quip": "Interviene dove i proprietari hanno fallito.",
    "target": 50,
    "image": "/medagliegiochi/protezione-civile-cavie.png"
  },
  {
    "id": "diplomazia-alla-spina",
    "name": "Diplomazia alla spina",
    "category": "Pessimo vicinato",
    "requirement": "Offrire 50 birre alle cavie degli altri.",
    "quip": "Le tensioni restano. Ma si vedono doppie.",
    "target": 50,
    "image": "/medagliegiochi/diplomazia-alla-spina.png"
  },
  {
    "id": "pace-armata",
    "name": "Pace armata",
    "category": "Pessimo vicinato",
    "requirement": "Offrire una birra a una cavia a cui hai prima lanciato una pigna.",
    "quip": "Prima il trauma, poi l’aperitivo.",
    "target": 1,
    "image": "/medagliegiochi/pace-armata.png"
  },
  {
    "id": "curriculum-poco-spendibile",
    "name": "Curriculum poco spendibile",
    "category": "Imprese e figuracce",
    "requirement": "Completare una partita a tutti e quattro i giochi.",
    "quip": "Quattro specializzazioni. Nessuno stipendio.",
    "target": 4,
    "image": "/medagliegiochi/curriculum-poco-spendibile.png"
  },
  {
    "id": "accanimento-terapeutico",
    "name": "Accanimento terapeutico",
    "category": "Imprese e figuracce",
    "requirement": "Completare 10 partite consecutive allo stesso gioco senza migliorare il record del nuovo medagliere.",
    "quip": "Il talento tarda. Lui resta.",
    "target": 10,
    "image": "/medagliegiochi/accanimento-terapeutico.png"
  },
  {
    "id": "miracolo-documentato",
    "name": "Miracolo documentato",
    "category": "Imprese e figuracce",
    "requirement": "Migliorare il record dopo almeno 10 tentativi consecutivi senza riuscirci nello stesso gioco.",
    "quip": "Abbiamo controllato. È successo davvero.",
    "target": 1,
    "image": "/medagliegiochi/miracolo-documentato.png"
  },
  {
    "id": "commercialista-della-brace",
    "name": "Commercialista della brace",
    "category": "Imprese e figuracce",
    "requirement": "Servire 35 ordini consecutivi senza errori in una grigliata.",
    "quip": "Questa volta torna tutto.",
    "target": 35,
    "image": "/medagliegiochi/commercialista-della-brace.png"
  },
  {
    "id": "era-lultima-giuro",
    "name": "Era l’ultima, giuro",
    "category": "Imprese e figuracce",
    "requirement": "Completare partite in 50 giorni diversi, anche non consecutivi.",
    "quip": "La dichiarazione non ha valore legale.",
    "target": 50,
    "image": "/medagliegiochi/era-lultima-giuro.png"
  }
];
for (const [game, name] of [['corsa', 'Corsa'], ['bullet', 'Bullet Hell'], ['grigliata', 'Grigliata'], ['merge', 'Merge']]) {
  for (let rank = 1; rank <= 3; rank++) MEDALS.push({ id: `${game}${rank}`, name: `${name} · ${rank}° posto`, category: 'Podi dei giochi', requirement: `Raggiungere il ${rank}° posto nella classifica del medagliere, con le partite giocate dalla sua apertura. Il distintivo resta tuo anche se vieni superato. A parità di punti conta chi li ha ottenuti prima.`, quip: 'Il podio passa. La gloria resta.', target: 1, image: `/medagliegiochi/${game}${rank}.png` });
}
export interface MedalState {
  launched_at: string | null;
  progress: Record<string, number>;
  earned: Record<string, string>;
  featured: string[];
  intro_seen: boolean;
  audit_seen: boolean;
  audit: { status: 'pending' | 'clear' | 'corrected'; before_xp: number; after_xp: number; removed: number; before_phase: number; after_phase: number } | null;
}
