import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function Home({ setPlayerName, playerName }) {
  const [name, setName] = useState(playerName || "");
  const navigate = useNavigate();

  const handleSubmit = e => {
    e.preventDefault();
    setPlayerName(name);
    navigate("/create");
  };

  return (
    <div className="container">
      <h1>Tebak Gambar: Siapa Orang Ini?</h1>
      <form onSubmit={handleSubmit} className="card">
        <input
          type="text"
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="Nama Anda"
          required
        />
        <button type="submit">Buat Sesi Baru</button>
      </form>
      <button className="secondary" onClick={() => {
        setPlayerName(name);
        navigate("/join");
      }}>
        Gabung Sesi
      </button>
    </div>
  );
}