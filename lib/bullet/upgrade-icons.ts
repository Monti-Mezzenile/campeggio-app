const icons: Record<string, string> = {
  "knife": "raffica.png",
  "magic_wand": "colpoguidato.png",
  "fan": "ventaglioselvaggio.png",
  "hedgehog": "riccio.png",
  "carrot_bomb": "carotaesplosiva.png",
  "return_blade": "falce.png",
  "orbit": "guardiarotante.png",
  "mine": "trappola.png",
  "frost_nova": "ondagelida.png",
  "might": "potenza.png",
  "cooldown": "grilletto facile.png",
  "movespeed": "passosvelto.png",
  "max_hp": "pellaccia.png",
  "magnet": "raccoglitore.png",
  "heal": "riprendi fiato.png"
};

export function upgradeIcon(id: string): string | undefined {
  const file = icons[id];
  return file ? `/bullet/upgrade/${encodeURIComponent(file)}` : undefined;
}
