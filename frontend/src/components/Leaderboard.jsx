import React from "react";
export default function Leaderboard({ data }) {
  if (!data || data.length === 0) return null;
  return (
    <div className="card leaderboard">
      <h3>🏆 Leaderboard</h3>
      <ol>
        {data.map((p, i) => (
          <li key={i}>
            {p.name} - Round {p.round} - Langkah: {p.steps} - Sisa Waktu: {p.time}
          </li>
        ))}
      </ol>
    </div>
  );
}