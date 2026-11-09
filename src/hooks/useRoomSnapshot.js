import { useEffect, useState } from 'react';
import { getSnapshot } from '../api/rooms';
import { errorMessage } from '../api/client';
import { connectRoom } from '../api/roomSocket';

export function useRoomSnapshot(roomId, onUnavailable) {
  const [snapshot, setSnapshot] = useState(null);
  const [status, setStatus] = useState('connecting');
  const [error, setError] = useState('');
  const [revision, setRevision] = useState(0);
  useEffect(() => {
    let active = true, live = false, busy = false, stopSocket, poll;
    const controller = new AbortController();
    async function load() {
      if (busy) return;
      busy = true;
      try {
        const data = await getSnapshot(roomId, controller.signal);
        if (active && !live) { setSnapshot(data); setError(''); }
      } catch (e) {
        if (active) {
          setError(errorMessage(e));
          if ([403,404].includes(e.status)) onUnavailable();
        }
      } finally { busy = false; }
    }
    const timer = setTimeout(async () => {
      await load();
      if (!active) return;
      stopSocket = connectRoom(roomId, {
        onSnapshot: data => { if (active) { setSnapshot(data); setError(''); } },
        onStatus: state => { live = state === 'live'; if (active) setStatus(state); },
        onUnavailable,
      });
      // Poll only while the socket is disconnected; all movement remains server-authoritative.
      poll = setInterval(() => { if (!live) load(); }, 10000);
    }, 0);
    return () => { active = false; clearTimeout(timer); clearInterval(poll); stopSocket?.(); controller.abort(); };
  }, [roomId, revision, onUnavailable]);
  return { snapshot, status, error, reconnect: () => setRevision(value => value + 1) };
}
