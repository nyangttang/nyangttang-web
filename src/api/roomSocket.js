import { API_BASE_URL, getSession, clearSession } from './client.js';
// Each connection has its own sequence. Time-only updates can share snapshotVersion.
export function connectRoom(roomId, { onSnapshot, onStatus, onUnavailable }) {
  let stopped = false, socket, retryTimer, heartbeat, watchdog, attempts = 0;
  const stopTimers = () => { clearInterval(heartbeat); clearInterval(watchdog); };
  function connect() {
    if (stopped) return;
    onStatus('connecting');
    let sequence = -1, receivedAt = Date.now();
    const url = new URL(API_BASE_URL); url.protocol = url.protocol === 'https:' ? 'wss:' : 'ws:';
    url.pathname = `/ws/rooms/${encodeURIComponent(roomId)}`; url.search = '';
    socket = new WebSocket(url);
    socket.onopen = () => {
      socket.send(JSON.stringify({ type: 'AUTH', accessToken: getSession()?.accessToken }));
      heartbeat = setInterval(() => { if (socket.readyState === WebSocket.OPEN) socket.send(JSON.stringify({ type: 'PING' })); }, 15000);
      watchdog = setInterval(() => { if (Date.now() - receivedAt > 35000) socket.close(4000, 'heartbeat timeout'); }, 5000);
    };
    socket.onmessage = ({ data }) => {
      if (stopped) return;
      receivedAt = Date.now();
      try {
        const message = JSON.parse(data);
        if (message.type === 'SNAPSHOT' && message.streamSeq > sequence) {
          sequence = message.streamSeq; attempts = 0; onStatus('live'); onSnapshot(message.data);
        }
      } catch { socket.close(4000, 'invalid response'); }
    };
    socket.onclose = ({ code }) => {
      stopTimers();
      if (stopped) return;
      if (code === 4401) { clearSession(); window.dispatchEvent(new Event('nyangttang:session-expired')); return; }
      if ([4403, 4404].includes(code)) { onStatus('offline'); onUnavailable(); return; }
      if ([1000, 4400, 1003, 1009, 4429].includes(code) || attempts >= 6) { onStatus('offline'); return; }
      onStatus('reconnecting'); retryTimer = setTimeout(connect, Math.min(1000 * 2 ** attempts++, 30000));
    };
    socket.onerror = () => { /* onclose handles retry; do not expose authentication messages. */ };
  }
  connect();
  return () => { stopped = true; clearTimeout(retryTimer); stopTimers(); if (socket) { socket.onclose = null; socket.close(); } };
}
