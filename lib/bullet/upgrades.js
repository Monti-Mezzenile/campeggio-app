// One catalogue for the upgrade picker, tier caps and asset handoff.
export const UPGRADE_CAP = 3;
export const UPGRADE_TIERS = {
  fan: ['3 colpi simultanei a ventaglio.', '5 colpi a ventaglio · danni +20%.', '7 colpi a ventaglio · danni +40%.'],
  hedgehog: ['8 spine perforanti a 360°.', '12 spine a 360° · danni +20%.', '16 spine a 360° · danni +40%.'],
  carrot_bomb: ['1 carota esplosiva · raggio 65.', '2 carote esplosive · raggio 90.', '3 carote esplosive · raggio 115.'],
  return_blade: ['1 falce: colpisce andando e tornando.', '2 falci di ritorno · danni +20%.', '3 falci di ritorno · danni +40%.'],
  knife: ['1 proiettile perforante per raffica.', '2 proiettili per raffica · danni +20%.', '3 proiettili per raffica · danni +40%.'],
  magic_wand: ['1 colpo guidato per attacco.', '2 colpi guidati · danni +20%.', '3 colpi guidati · danni +40%.'],
  orbit: ['2 schegge ruotano intorno alla cavia.', '4 schegge · danni +20%.', '6 schegge · danni +40%.'],
  mine: ['1 mina per rilascio.', '2 mine per rilascio · danni +20%.', '3 mine per rilascio · danni +40%.'],
  frost_nova: ['Raggio 200 · rallenta per 1,2 s.', 'Raggio 240 · rallenta per 1,8 s.', 'Raggio 280 · rallenta per 2,4 s.'],
  might: ['Danni totali +10%.', 'Danni totali +21%.', 'Danni totali +33%.'],
  cooldown: ['Tempi tra gli attacchi −8%.', 'Tempi tra gli attacchi −15%.', 'Tempi tra gli attacchi −22%.'],
  movespeed: ['Velocità totale +10%.', 'Velocità totale +21%.', 'Velocità totale +33%.'],
  max_hp: ['Salute massima: 120.', 'Salute massima: 144.', 'Salute massima: 173.'],
  magnet: ['Raccolta carote: raggio 150.', 'Raccolta carote: raggio 188.', 'Raccolta carote: raggio 234.'],
};
export function upgradeDescription(id, level) { return UPGRADE_TIERS[id]?.[level - 1] || ''; }
export function tieredWeaponDefinition(def) {
  return {
    ...def,
    evolveLevel: 0,
    maxLevel: UPGRADE_CAP,
    ...(def.type === 'projectile' ? { projectileCounts: [1, 2, 3] } : {}),
    ...(def.type === 'orbit' ? { orbitCounts: [2, 4, 6] } : {}),
    ...(def.type === 'mine' ? { mineCounts: [1, 2, 3] } : {}),
    ...(def.type === 'nova' ? { ranges: [200, 240, 280], slowDurations: [1.2, 1.8, 2.4] } : {}),
  };
}
