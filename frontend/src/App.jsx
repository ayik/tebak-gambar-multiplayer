import React, { useState } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "./components/Home";
import CreateSession from "./components/CreateSession";
import JoinSession from "./components/JoinSession";
import GameRoom from "./components/GameRoom";
import './styles/main.css';

function App() {
  const [playerName, setPlayerName] = useState("");
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home setPlayerName={setPlayerName} playerName={playerName} />} />
        <Route path="/create" element={<CreateSession playerName={playerName} />} />
        <Route path="/join" element={<JoinSession playerName={playerName} />} />
        <Route path="/room/:sessionId" element={<GameRoom playerName={playerName} />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;