import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import io from "socket.io-client";
import Leaderboard from "./Leaderboard";
import axios from "axios";

const socket = io(import.meta.env.VITE_BACKEND_URL);

export default function GameRoom({ playerName }) {
  const { sessionId } = useParams();
  const [session, setSession] = useState(null);
  const [players, setPlayers] = useState([]);
  const [revealed, setRevealed] = useState([]);
  const [started, setStarted] = useState(false);
  const [guess, setGuess] = useState("");
  const [status, setStatus] = useState("");
  const [timer, setTimer] = useState(60);
  const [leaderboard, setLeaderboard] = useState([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [currentImage, setCurrentImage] = useState("");
  const [currentRound, setCurrentRound] = useState(1);
  const [totalRounds, setTotalRounds] = useState(1);
  const [canNext, setCanNext] = useState(false);
  const navigate = useNavigate();
  const gridSize = session?.gridSize || 4;

  useEffect(() => {
    async function fetchSession() {
      const res = await axios.get(`/api/session/${sessionId}`);
      setSession(res.data);
      setRevealed(res.data.revealed || Array(res.data.gridSize * res.data.gridSize).fill(false));
      setCurrentImage(res.data.currentImage);
      setCurrentRound(res.data.currentRound || 1);
      setTotalRounds(res.data.totalRounds || 1);
    }
    fetchSession();
    socket.emit("join-session", { sessionId, playerName });
    socket.on("players-update", setPlayers);
    socket.on("admin-status", ({ isAdmin }) => setIsAdmin(isAdmin));
    socket.on("kicked", () => {
      alert("Anda dikeluarkan oleh admin!");
      navigate("/");
    });
    socket.on("box-revealed", ({ boxIdx }) => setRevealed(r => {
      const updated = [...r];
      updated[boxIdx] = true;
      return updated;
    }));
    socket.on("game-started", ({ timer, currentImage, currentRound, totalRounds, revealed }) => {
      setStarted(true);
      setTimer(timer);
      setStatus("");
      setCurrentImage(currentImage);
      setCurrentRound(currentRound);
      setTotalRounds(totalRounds);
      setRevealed(revealed);
    });
    socket.on("timer-update", setTimer);
    socket.on("correct-guess", ({ name }) => setStatus(`${name} berhasil menebak!`));
    socket.on("game-ended", setLeaderboard);
    socket.on("session-reset", () => {
      setStarted(false);
      setStatus("");
      setLeaderboard([]);
    });
    socket.on("round-ended", ({ canNext, winners, leaderboard, currentRound, totalRounds }) => {
      setStatus("Round selesai!");
      setLeaderboard(leaderboard);
      setCanNext(canNext);
      setCurrentRound(currentRound);
      setTotalRounds(totalRounds);
    });
    socket.on("next-round", ({ currentImage, currentRound, totalRounds, revealed }) => {
      setCurrentImage(currentImage);
      setCurrentRound(currentRound);
      setTotalRounds(totalRounds);
      setStatus("");
      setRevealed(revealed);
    });
    return () => socket.disconnect();
  }, [sessionId, playerName, navigate]);

  const handleStart = () => socket.emit("start-game", { sessionId });

  const handleReveal = idx => {
    if (!revealed[idx] && started) {
      socket.emit("reveal-box", { sessionId, boxIdx: idx });
      socket.emit("step", { sessionId });
    }
  };

  const handleGuess = e => {
    e.preventDefault();
    socket.emit("guess", { sessionId, guess });
    setGuess("");
  };

  const handleReset = () => socket.emit("reset-session", { sessionId });

  const handleKick = (playerId, name) => {
    if (window.confirm(`Kick ${name}?`)) socket.emit("kick-player", { sessionId, playerId });
  };

  const handleNextRound = () => socket.emit("next-round", { sessionId });

  function renderGrid() {
    return (
      <div className="grid" style={{
        gridTemplateColumns: `repeat(${gridSize}, 1fr)`,
        gridTemplateRows: `repeat(${gridSize}, 1fr)`
      }}>
        <img
          src={currentImage}
          style={{ gridColumn: `1 / span ${gridSize}`, gridRow: `1 / span ${gridSize}` }}
          alt="gambar"
          className="game-image"
        />
        {revealed.map((isOpen, idx) =>
          <div
            key={idx}
            className={`grid-box${isOpen ? " revealed" : ""}`}
            onClick={() => handleReveal(idx)}
          />
        )}
      </div>
    );
  }

  return (
    <div className="container">
      <h2>Kode Sesi: {sessionId}</h2>
      <div>Round: <b>{currentRound} / {totalRounds}</b></div>
      <div>Timer: <b>{timer}</b> detik</div>
      <div>
        Pemain:
        <ul>
          {players.map(p =>
            <li key={p.id}>
              {p.name} {p.isAdmin && <span style={{color:"#0a6efd"}}>[Admin]</span>}
              {isAdmin && p.id !== socket.id &&
                <button
                  className="kick-btn"
                  onClick={() => handleKick(p.id, p.name)}
                  style={{marginLeft:8, color:"red", background:"none", border:"none", cursor:"pointer"}}
                >Kick</button>
              }
            </li>
          )}
        </ul>
      </div>
      {isAdmin && !started && <button onClick={handleStart}>Mulai Game</button>}
      {renderGrid()}
      {started && (
        <form onSubmit={handleGuess}>
          <input type="text" value={guess} onChange={e => setGuess(e.target.value)} placeholder="Tebak siapa..." />
          <button type="submit">Tebak</button>
        </form>
      )}
      <div style={{marginTop: 10, fontWeight: "bold"}}>{status}</div>
      <Leaderboard data={leaderboard} />
      {isAdmin && canNext && <button className="secondary" onClick={handleNextRound}>Next Round</button>}
      {isAdmin && <button className="secondary" onClick={handleReset}>Reset Sesi</button>}
    </div>
  );
}