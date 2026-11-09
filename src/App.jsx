import { getSession, errorMessage } from './api/client';
import { getMe, getMyRoom, getDevice } from './api/rooms';
import { roomView } from './api/viewModels';
import { useCallback, useEffect, useState } from "react";
import HomePage from "./pages/HomePage";
import JoinRoomPage from "./pages/JoinRoomPage";
import CreateRoomPage from "./pages/CreateRoomPage";
import RoomPage from "./pages/RoomPage";
import MapGrid from "./pages/MapGrid";

export default function App() {
  const [page, setPage] = useState("home");
  const [roomPreview, setRoomPreview] = useState(null);

  const [loading, setLoading] = useState(!!getSession()?.accessToken);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const restore = useCallback(async (signal) => {
    if (!getSession()?.accessToken) { setLoading(false); return; }
    setLoading(true); setError('');
    try {
      await getMe(signal); const current = await getMyRoom(signal);
      const device = current ? await getDevice(current.roomId, signal) : null;
      if (!signal?.aborted) { setRoomPreview(current ? roomView(current, device?.deviceCode) : null); setPage(current ? 'room' : 'home'); }
    } catch (e) { if (!signal?.aborted) setError(errorMessage(e)); }
    finally { if (!signal?.aborted) setLoading(false); }
  }, []);
  useEffect(() => {
    const controller = new AbortController();
    const timer = setTimeout(() => restore(controller.signal), 0);
    const expired = () => { setRoomPreview(null); setPage('home'); setError('세션이 만료됐어요. 다시 시작해 주세요.'); };
    window.addEventListener('nyangttang:session-expired', expired);
    return () => { clearTimeout(timer); controller.abort(); window.removeEventListener('nyangttang:session-expired', expired); };
  }, [restore]);

  function openRoomPreview(data, message = '') {
    setNotice(message);
    setRoomPreview(data);
    setPage("room");
  }

  if (loading) return <main className="home-page"><p role="status">참여 중인 방을 불러오고 있어요.</p></main>;
  if (error && getSession()?.accessToken) return <main className="home-page"><p role="alert">{error}</p><button onClick={() => restore()}>다시 연결</button></main>;

  if (page === "room" && roomPreview) {
    return (
      <RoomPage
        room={roomPreview}
        notice={notice}
        onUnavailable={restore}
        onBack={() => setPage("home")}
      />
    );
  }

  if (page === "join") {
    return (
      <JoinRoomPage
        onBack={() => setPage("home")}
        onPreview={openRoomPreview}
      />
    );
  }

  if (page === "create") {
    return (
      <CreateRoomPage
        onBack={() => setPage("home")}
        onPreview={openRoomPreview}
      />
    );
  }

  if (window.location.pathname === "/map") {
    return <MapGrid />;
  }

  return (
    <HomePage
      onJoin={() => setPage(roomPreview ? "room" : "join")}
      onCreate={() => setPage(roomPreview ? "room" : "create")}
    />
  );
}