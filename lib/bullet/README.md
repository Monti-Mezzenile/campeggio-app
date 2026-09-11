# Bullet Hell — la rivolta della cavia

La scheda su `/mascotte` apre `/bullet-hell`, protetta dallo stesso proxy degli
altri giochi. All'apertura compaiono le regole; durante la partita rimangono HUD,
arena e comandi. Il contenitore usa l'altezza dinamica del viewport e le safe area
su tutti e quattro i lati, senza altezze minime che spingano i comandi fuori schermo.

## Modalità infinita

Nessuna vittoria o fine automatica a tempo. La partita termina alla morte oppure
con «Termina e riscuoti XP» dalla pausa.

- Punti: 10 per nemico + 2 per secondo di sopravvivenza.
- XP della cavia: 2 × (floor(nemici / 4) + floor(secondi / 6)).
- Record punti in `monti-bullet-best-score`, separato dal vecchio record di uccisioni.
- Ricompensa inviata una sola volta per partita con `increment_mascot_exp`;
  lo stato di salvataggio impedisce replay/uscita finché la richiesta è in corso.

Ondate infinite di 40 secondi: 32 di arrivi e 8 senza nuovi rinforzi.
Si alternano sciami, tenaglie, colonne blindate, accerchiamenti, fuoco incrociato
e picchiate. Ogni quarta ondata è un assedio con boss (il primo a 120 secondi).
I primi tre assedi presentano un boss alla volta; i successivi tre tutte le coppie,
poi arrivano tutti e tre insieme. Un gruppo ancora vivo impedisce nuovi gruppi.
Vita, danno e velocità dei boss restano fissi; sotto metà vita diventano furiosi.
Ogni boss ha la propria barra salute e gli attacchi iniziali sono sfalsati.
Fauci di ferro spara tre ventagli, lo Scorpione alterna spirali e anelli con varchi,
la Regina usa globuli guidati brevemente, esplosioni velenose preannunciate e rinforzi.
La difficoltà parte con 5 nemici, 90% HP, 70% danni e 92% velocità.
HP, danni e densità crescono nel tempo; i gruppi sono limitati a 12 e i nemici a 300.

| Nemico | HP base | Caratteristica |
| --- | ---: | --- |
| Ratto | 24 | Sciame |
| Scarabeo | 68 | Tenaglia |
| Vespa | 18 | Rapida e fragile |
| Libellula | 38 | Zigzag |
| Pipistrello | 46 | Scatto preannunciato |
| Corazzato | 210 | Lento, scudo aggiuntivo 55 |
| Ragno acido | 320 | Tiro a distanza |
| Predatore | 92 | Fuoco incrociato |
| Fauci di ferro | 1100 | Ventagli |
| Scorpione d’assedio | 1650 | Spirali e anelli |
| Regina della covata | 2300 | Veleno e rinforzi |

Menu visivo con `public/locandinegiochi/bullet.jpeg`. Musica in loop
`public/audio/giochi/bullet.mp3`, avviata dal gesto di avvio e sospesa in pausa.
Corsa e Bullet Hell occupano le prime due posizioni della sala giochi.

La soglia iniziale è 100 XP partita, cresce del 35% fino al limite di 1500 per
livello. Le scelte si aprono subito alla salita di livello; più livelli acquisiti
insieme danno scelte consecutive prima di riprendere la partita. Ogni arma/passivo
selezionabile ha tre livelli. La cura è immediata e ripetibile. Gli upgrade al
massimo non ricompaiono. Vedi `upgrades.js` per le descrizioni e i livelli reali.

## Grafica, controlli e moduli

- `game.js`: simulazione, punteggio, difficoltà, drop, scelte e speciale.
- `waves.js` e `bosses.js`: formazioni, roster, preavvisi e attacchi dei boss.
- `shot-patterns.js`: ventagli, spine radiali, carote esplosive e falci di ritorno;
  quattro armi aggiuntive a tre livelli, con una scelta garantita al primo livello.
- `upgrades.js`: livelli 1–3 e definizioni delle armi dell'integrazione.
- `assets.js`: manifest, pose, rotazioni, varianti carote e punti di spawn opachi.
- `renderer.js`: terreno → entità ed effetti → copertura degli alberi → testo HUD.
- `special-effect.js`: onda oro/giada con tre anelli, alone e 24 scie radiali;
  versione con movimento ridotto. L'origine rimane il punto di attivazione.
- `input.js`: joystick con pointer capture, multi-touch, dead zone e tastiera.
- `runtime.js`: caricamento cancellabile, fixed step, RAF, ResizeObserver e cleanup.

Mappa 2816 × 1536; attori e camera non vengono ingranditi. Il player usa i frame
0–11 in coppie direzionali quando si muove; 12–17 per la posa fissa quando si ferma;
18–23 per lo speciale nella stessa direzione. I nemici usano quattro frame e
ruotano dalla direzione iniziale verso l'alto verso il player. Solo le tre varianti Enemy_fast
hanno l'ombra. L'elenco della grafica presente/mancante è in `ASSET-DA-CREARE.md`.

WASD/frecce muovono, Spazio usa lo speciale, Escape mette in pausa. Il joystick
non occupa l'arena. Il pulsante rosso resta senza scritte; sopra, il countdown e
«PRONTA», insieme all'anello di carica e all'alone, mostrano la disponibilità.
Lo speciale ricarica in 12 secondi. Un tocco durante la ricarica non fa nulla e non
sposta il focus. Cambio finestra/visibilità mettono in pausa; un focusout mobile
senza destinazione non la attiva. Alla chiusura, input, RAF e observer vengono rimossi.

## Provenienza e verifiche

`core/` deriva da `/Users/actingm3/Desktop/gioco/src` (Survivor Game, MIT;
licenza conservata qui). Riutilizza armi, entità, collisioni e cataloghi. La shell,
service worker, replay e funzioni di menu non necessarie sono omessi. Le ricerche
spaziali ampie scandiscono solo i bucket occupati. I conteggi dei tre livelli
sono opzionali nei moduli core, per mantenere separati i valori dell'integrazione.

`node --test tests/bullet-game.test.cjs` verifica pose, spawn, ombre, collisioni,
pausa, oltre dieci minuti di simulazione, livelli delle armi, cap dei passivi,
ricarica e disegno dello speciale. `npm run build -- --webpack` verifica la build.
Il controllo visivo sul telefono resta necessario: i permessi di controllo del
browser non erano disponibili nella sessione. Controllare in particolare notch,
safe area inferiore, orientamento e leggibilità delle barre sul dispositivo reale.
