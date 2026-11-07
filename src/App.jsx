import { useState } from "react";
import HomePage from "./pages/HomePage";
import JoinRoomPage from "./pages/JoinRoomPage";
import CreateRoomPage from "./pages/CreateRoomPage";
import RoomPage from "./pages/RoomPage";
import MapGrid from "./pages/MapGrid";

export default function App() {
  const [page, setPage] = useState("home");
  const [roomPreview, setRoomPreview] = useState(null);

  function openRoomPreview(data) {
    setRoomPreview(data);
    setPage("room");
  }

  if (page === "room" && roomPreview) {
    return (
      <RoomPage
        room={roomPreview}
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
      onJoin={() => setPage("join")}
      onCreate={() => setPage("create")}
    />
  );
}