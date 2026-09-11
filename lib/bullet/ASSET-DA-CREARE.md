# Bullet Hell — elenco potenziamenti e grafica

Le 15 icone del menu sono ora presenti in `public/bullet/upgrade` e collegate tramite
`upgrade-icons.ts`. Onda gelida usa `ondagelida.png`. Gli effetti Canvas restano separati.

Tutti i nomi sotto sono effettivamente presenti nel gioco. I nomi nella colonna finale erano le proposte iniziali; i nomi effettivi sono nel manifest `upgrade-icons.ts`.
Per le icone: PNG 256 × 256, sfondo trasparente, pixel art nella palette bosco/oliva/oro.
Una sola icona per potenziamento basta: i tre livelli sono indicati dall'interfaccia.
Se prepari anche sprite per gli effetti, tienili separati dalle icone dei menu.

## Potenziamenti scelti dopo un livello

| Potenziamento | Livello 1 → 2 → 3 | Grafica attuale | Asset proposto |
|---|---|---|---|
| Ventaglio selvaggio | 3 → 5 → 7 colpi simultanei a ventaglio | Colpi dorati Canvas | `upgrade_ventaglio.png` |
| Riccio furioso | 8 → 12 → 16 spine perforanti a 360° | Spine verde chiaro Canvas | `upgrade_riccio.png` |
| Carota esplosiva | 1 → 2 → 3 carote; esplosione raggio 65 → 90 → 115 | Sfera arancione e particelle Canvas | `upgrade_carota_esplosiva.png` |
| Falce di ritorno | 1 → 2 → 3 falci, colpiscono in andata e ritorno | Mezzaluna giada rotante Canvas | `upgrade_falce.png` |
| Raffica | 1 → 2 → 3 proiettili perforanti | Proiettili disegnati dal Canvas; nessuna icona dedicata | `upgrade_raffica.png` |
| Colpo guidato | 1 → 2 → 3 colpi che inseguono il nemico | Stesso proiettile Canvas; nessuna icona dedicata | `upgrade_colpo_guidato.png` |
| Guardia rotante | 2 → 4 → 6 schegge orbitanti | Schegge geometriche Canvas; nessuna icona dedicata | `upgrade_guardia_rotante.png` |
| Trappola | 1 → 2 → 3 mine per rilascio | Mine ed esplosioni Canvas; nessuna icona dedicata | `upgrade_trappola.png` |
| Onda gelida | Raggio 200 → 240 → 280; rallentamento 1,2 → 1,8 → 2,4 secondi | Particelle Canvas; nessuna icona dedicata | `upgrade_onda_gelida.png` |
| Potenza | Danni +10% → +21% → +33% complessivi | Solo testo; nessuna icona dedicata | `upgrade_potenza.png` |
| Grilletto facile | Tempi tra attacchi −8% → −15% → −22% | Solo testo; nessuna icona dedicata | `upgrade_grilletto.png` |
| Passo svelto | Velocità +10% → +21% → +33% complessivi | Solo testo; nessuna icona dedicata | `upgrade_passo_svelto.png` |
| Pellaccia | Salute massima 120 → 144 → 173 | Solo testo; nessuna icona dedicata | `upgrade_pellaccia.png` |
| Raccoglitore | Raggio di raccolta 150 → 188 → 234 | Solo testo; nessuna icona dedicata | `upgrade_raccoglitore.png` |
| Riprendi fiato | +40 salute subito, ripetibile; **senza livelli** | Solo testo; la borraccia potrebbe essere riutilizzata | `medikit.png` già presente, oppure `upgrade_cura.png` |

Le armi ai livelli 2 e 3 fanno anche +20% / +40% danni rispetto al livello 1,
sparano più spesso (−8% / −15% di intervallo) e raggiungono più lontano.
Onda gelida usa invece i raggi specifici in tabella. I bonus passivi indicano
l'effetto totale raggiunto, arrotondato. La raffica è già posseduta al livello 1
all'inizio della partita. Gli altri potenziamenti vanno prima acquisiti al livello 1.

## Oggetti raccolti nell'arena

| Oggetto | Effetto | File attuale / cosa manca |
|---|---|---|
| Carota arancione | Esperienza della partita, drop piccolo | Variante cromatica Canvas di `carota_xp.png`; manca un PNG arancione dedicato |
| Carota dorata | Esperienza della partita, drop medio | `carota_xp.png` presente |
| Carota viola | Esperienza della partita, drop grande / boss | Variante cromatica Canvas di `carota_xp.png`; manca un PNG viola dedicato |
| Borraccia / medikit | +35 salute subito | `medikit.png` presente |
| Tazza di caffè | +50% velocità per 8 secondi | `coffee.png` presente e collegato |
| Scudo | Protezione per 6 secondi | `shield.png` presente e collegato |
| Cassa di munizioni | Ricarica speciale e attacchi immediatamente | `munizioni_.png` presente (verde) |

Le carote migliorano il personaggio **durante la partita**. Gli XP della cavia sono
una ricompensa separata assegnata alla fine. Nessun drop temporaneo ha livelli.

## Sprite opzionali per gli effetti

Se vuoi sostituire anche le forme disegnate dal Canvas, oltre alle icone servono:

- Proiettile della raffica e proiettile guidato: due sprite separati.
- Scheggia orbitante: un solo sprite, replicato 2/4/6 volte dal gioco.
- Mina a terra; facoltativo spritesheet di esplosione.
- Onda gelida: facoltativa texture o animazione del ghiaccio.

La mossa speciale usa già un effetto Canvas completo (oro/giada, tre anelli e scie)
e non richiede un asset raster. Per eventuali spritesheet concordiamo numero,
dimensione e ordine dei frame prima di integrarli.

Le quattro nuove armi si aggiungono allo sparo base (massimo sei armi totali).
Al primo livello viene sempre proposta almeno una nuova modalità di tiro.
Per queste grafiche prepara icone PNG trasparenti 256 × 256: tre carote a ventaglio,
un riccio con spine radiali, una carota-bomba e una falce con freccia di ritorno.
Sprite opzionali separati: `proiettile_spina.png`, `proiettile_carota_bomba.png`
e `proiettile_falce.png` (128 × 128, trasparenti). I nomi sono proposte, non file richiesti dal runtime.
