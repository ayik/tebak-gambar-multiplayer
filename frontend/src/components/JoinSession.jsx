import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function JoinSession({ playerName }) {
  const [sessionId, setSessionId] = useState("");
  const navigate = useNavigate();

  const handleJoin = e => {
    e.preventDefault();
    navigate(`/room/${sessionId}`);
  };

  return (
    <div className="container">
      <h2>Gabung Sesi Game</h2>
      <form className="card" onSubmit={handleJoin}>
        <input type="text" placeholder="Kode Sesi" value={sessionId} onChange={e => setSessionId(e.target.value)} required />
        <button type="submit">Gabung</button>
      </form>
    </div>
  );
}