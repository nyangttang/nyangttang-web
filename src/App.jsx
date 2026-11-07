import { useState } from "react";
import HomePage from "./pages/HomePage";
import JoinRoomPage from "./pages/JoinRoomPage";
import CreateRoomPage from "./pages/CreateRoomPage";
import MapGrid from "./pages/MapGrid";

export default function App() {
  const [page, setPage] = useState("home");

  if (page === "join") {
    return <JoinRoomPage onBack={() => setPage("home")} />;
  }

  if (page === "create") {
    return <CreateRoomPage onBack={() => setPage("home")} />;
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
