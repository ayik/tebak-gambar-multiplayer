import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

export default function CreateSession({ playerName }) {
  const [images, setImages] = useState([]);
  const [answers, setAnswers] = useState([""]);
  const [gridSize, setGridSize] = useState(4);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    setImages(files);
    setAnswers(Array(files.length).fill(""));
  };

  const handleAnswerChange = (i, val) => {
    setAnswers(ans => ans.map((a, idx) => idx === i ? val : a));
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData();
    images.forEach(img => formData.append("images", img));
    formData.append("answers", JSON.stringify(answers));
    formData.append("gridSize", gridSize);
    const res = await axios.post('/api/create-session', formData, {
      headers: { "Content-Type": "multipart/form-data" }
    });
    setLoading(false);
    navigate(`/room/${res.data.sessionId}`);
  };

  return (
    <div className="container">
      <h2>Buat Sesi Baru</h2>
      <form className="card" onSubmit={handleSubmit}>
        <input type="file" accept="image/*" required multiple onChange={handleFileChange} />
        {images.map((img, i) => (
          <div key={i} style={{marginBottom:8}}>
            <span>{img.name}:</span>
            <input type="text" placeholder="Jawaban gambar ini" value={answers[i] || ""} onChange={e => handleAnswerChange(i, e.target.value)} required />
          </div>
        ))}
        <label>Grid Kotak:</label>
        <select value={gridSize} onChange={e => setGridSize(e.target.value)}>
          <option value={4}>4x4</option>
          <option value={5}>5x5</option>
        </select>
        <button type="submit" disabled={loading}>Mulai & Bagikan Kode</button>
      </form>
    </div>
  );
}