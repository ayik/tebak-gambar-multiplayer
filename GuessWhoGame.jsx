import React, { useState } from 'react';

// Ganti dengan gambar orang yang ingin ditebak
const IMAGE_URL = "https://i.imgur.com/8Km9tLL.jpg"; // Contoh gambar wajah
const ANSWER = "Albert Einstein"; // Jawaban yang benar (case-insensitive)
const GRID_SIZE = 4; // 4x4 grid

function GuessWhoGame() {
  // Status game
  const [revealed, setRevealed] = useState(Array(GRID_SIZE * GRID_SIZE).fill(false));
  const [guess, setGuess] = useState("");
  const [status, setStatus] = useState("");
  const [completed, setCompleted] = useState(false);
  const [steps, setSteps] = useState(0);

  // Membuka kotak tertentu
  function handleReveal(idx) {
    if (completed) return;
    if (!revealed[idx]) {
      const updated = revealed.slice();
      updated[idx] = true;
      setRevealed(updated);
      setSteps(steps + 1);
    }
  }

  // Mengecek jawaban
  function handleGuessSubmit(e) {
    e.preventDefault();
    if (guess.trim().toLowerCase() === ANSWER.toLowerCase()) {
      setStatus("Benar! 🎉");
      setRevealed(Array(GRID_SIZE * GRID_SIZE).fill(true));
      setCompleted(true);
    } else {
      setStatus("Salah, coba lagi!");
    }
  }

  // Render grid kotak
  function renderGrid() {
    const boxSize = 100 / GRID_SIZE + "%";
    return (
      <div
        style={{
          display: "grid",
          gridTemplateColumns: `repeat(${GRID_SIZE}, 1fr)`,
          gridTemplateRows: `repeat(${GRID_SIZE}, 1fr)`,
          width: 320,
          height: 320,
          position: "relative",
          margin: "auto"
        }}
      >
        {/* Gambar di background */}
        <img
          src={IMAGE_URL}
          alt="Guess Who"
          style={{
            gridColumn: `1 / span ${GRID_SIZE}`,
            gridRow: `1 / span ${GRID_SIZE}`,
            width: "100%",
            height: "100%",
            objectFit: "cover",
            position: "absolute",
            zIndex: 0
          }}
        />
        {/* Kotak penutup */}
        {revealed.map((isOpen, idx) => (
          <div
            key={idx}
            onClick={() => handleReveal(idx)}
            style={{
              background: isOpen ? "transparent" : "#333",
              opacity: isOpen ? 0 : 0.9,
              border: "1px solid #fff",
              cursor: isOpen || completed ? "default" : "pointer",
              zIndex: 1,
              transition: "opacity 0.3s",
            }}
          />
        ))}
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 400, margin: "auto", textAlign: "center", fontFamily: "sans-serif" }}>
      <h2>Tebak Gambar: Siapa Orang Ini?</h2>
      {renderGrid()}
      <form onSubmit={handleGuessSubmit} style={{ marginTop: 20 }}>
        <input
          type="text"
          value={guess}
          onChange={e => setGuess(e.target.value)}
          placeholder="Tebak siapa orang ini..."
          disabled={completed}
          style={{ padding: 8, width: "80%" }}
        />
        <button type="submit" disabled={completed} style={{ padding: 8, marginLeft: 8 }}>
          Tebak
        </button>
      </form>
      <div style={{ marginTop: 10, fontWeight: "bold" }}>{status}</div>
      <div style={{ marginTop: 8, fontSize: 14 }}>
        Kotak dibuka: {revealed.filter(Boolean).length} / {GRID_SIZE * GRID_SIZE}
      </div>
      <div style={{ marginTop: 4, fontSize: 14 }}>
        Langkah: {steps}
      </div>
    </div>
  );
}

export default GuessWhoGame;