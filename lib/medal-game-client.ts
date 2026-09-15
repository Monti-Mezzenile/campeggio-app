import { supabase } from '@/lib/supabase';

// Register at START, so an old game or a replayed completion cannot advance the collection.
export function beginMedalGame(game: 'corsa' | 'bullet' | 'grigliata' | 'merge') {
  const id = crypto.randomUUID();
  const ready = Promise.resolve(supabase.rpc('begin_medal_game', { p_game: game, p_run: id }));
  return { id, ready };
}
export type MedalRun = ReturnType<typeof beginMedalGame>;
export async function finishMedalGame(run: MedalRun | null, score: number, combo = 0) {
  if (!run) return;
  const registration = await run.ready;
  if (registration.error) throw new Error('Progressi distintivi non salvati. Verifica la connessione.');
  const { error } = await supabase.rpc('finish_medal_game', { p_run: run.id, p_score: Math.floor(score), p_combo: combo });
  if (error) throw new Error('Progressi distintivi non salvati. Verifica la connessione.');
  window.dispatchEvent(new Event('mascot-medals-changed'));
}
