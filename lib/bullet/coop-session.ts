import { supabase } from '@/lib/supabase';
export type CoopRoom = { id: string; code: string; host_id: string; guest_id: string | null; status: string; expires_at: string };
export type CoopConnection = {
  role: 'host' | 'guest'; room: CoopRoom;
  send: (packet: unknown) => void;
  listen: (handler: (packet: unknown) => void) => () => void; // Wire format is validated by the runtime.
  close: () => void;
};
export async function connectCoop(room: CoopRoom, role: 'host' | 'guest', signal: AbortSignal): Promise<CoopConnection> {
  await supabase.realtime.setAuth();
  const handlers = new Set<(packet: unknown) => void>();
  const channels = ['host', 'guest'].map(side => supabase.channel(`bullet:${room.id}:${side}`, { config: { private: true } }));
  const incoming = channels[role === 'host' ? 1 : 0];
  const outgoing = channels[role === 'host' ? 0 : 1];
  incoming.on('broadcast', { event: 'packet' }, ({ payload }) => { for (const handler of handlers) handler(payload); });
  let closed = false;
  const close = () => { if (closed) return; closed = true; handlers.clear(); channels.forEach(channel => { void supabase.removeChannel(channel); }); };
  if (signal.aborted) { close(); throw new Error('Connessione annullata'); }
  signal.addEventListener('abort', close, { once: true });
  try {
    await Promise.all(channels.map(channel => new Promise<void>((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error('Connessione alla stanza scaduta. Riprova.')), 12000);
      const abort = () => { clearTimeout(timer); reject(new Error('Connessione annullata')); };
      signal.addEventListener('abort', abort, { once: true });
      channel.subscribe(status => {
        if (status === 'SUBSCRIBED') { clearTimeout(timer); signal.removeEventListener('abort', abort); resolve(); }
        else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') {
          clearTimeout(timer); signal.removeEventListener('abort', abort); reject(new Error('Connessione alla stanza non disponibile.'));
        }
      });
    })));
    if (signal.aborted) throw new Error('Connessione annullata');
    return { room, role, close,
      send(packet) { if (!closed) void outgoing.send({ type: 'broadcast', event: 'packet', payload: packet }).catch(() => {}); },
      listen(handler) { handlers.add(handler); return () => { handlers.delete(handler); }; },
    };
  } catch (error) { close(); throw error; }
}
