import express from "express";
import http from "http";
import cors from "cors";
import multer from "multer";
import { Server } from "socket.io";
import { nanoid } from "nanoid";
import path from "path";
import fs from "fs";

const __dirname = path.resolve();
const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });
app.use(cors());
app.use(express.json());

const upload = multer({ dest: "uploads/" });

const sessions = {};

// ---- MULTI GAMBAR PER SESI ----
app.post("/api/create-session", upload.array('images'), (req, res) => {
  const { answers, gridSize } = req.body;
  let parsedAnswers = [];
  try {
    parsedAnswers = JSON.parse(answers);
  } catch {
    return res.status(400).json({ error: "Invalid answers format" });
  }
  if (!Array.isArray(parsedAnswers) || parsedAnswers.length === 0)
    return res.status(400).json({ error: "No answers" });

  const sessionId = nanoid(6);
  // Simpan gambar-gambar
  const images = req.files.map((file, idx) => {
    const ext = path.extname(file.originalname);
    const newFileName = `${sessionId}_${idx}${ext}`;
    fs.renameSync(file.path, path.join("uploads", newFileName));
    return `/uploads/${newFileName}`;
  });

  sessions[sessionId] = {
    answers: parsedAnswers.map(a => a.trim().toLowerCase()),
    images,
    gridSize: parseInt(gridSize) || 4,
    players: [],
    revealed: Array(parsedAnswers.length).fill(null).map(() => Array((parseInt(gridSize) || 4) ** 2).fill(false)),
    leaderboard: [],
    started: false,
    timer: 60,
    host: null,
    currentRound: 0,
    roundWinners: [],
  };

  res.json({ sessionId, imageUrls: images });
});

app.get("/api/session/:sessionId", (req, res) => {
  const session = sessions[req.params.sessionId];
  if (!session) return res.status(404).json({ error: "Not found" });
  // Kirim data round sekarang saja agar frontend tidak tahu jawaban semua round
  res.json({
    ...session,
    answer: undefined,
    currentImage: session.images[session.currentRound],
    revealed: session.revealed[session.currentRound],
    currentRound: session.currentRound,
    totalRounds: session.images.length,
    images: undefined, // jangan kirim semua gambar
    answers: undefined,
  });
});

app.use("/uploads", express.static(path.join(__dirname, "uploads")));

io.on("connection", (socket) => {
  socket.on("join-session", ({ sessionId, playerName }) => {
    const session = sessions[sessionId];
    if (!session) return socket.emit("error", "Sesi tidak ditemukan.");
    if (!session.players.find(p => p.id === socket.id)) {
      const isHost = session.players.length === 0;
      const player = { id: socket.id, name: playerName, steps: 0, correct: false, time: 0, isAdmin: isHost };
      session.players.push(player);
      if (isHost) session.host = socket.id;
      socket.join(sessionId);
    }
    io.to(sessionId).emit("players-update", session.players);
    socket.emit("admin-status", { isAdmin: session.host === socket.id });
  });

  socket.on("start-game", ({ sessionId }) => {
    const session = sessions[sessionId];
    if (!session || session.host !== socket.id) return;
    session.started = true;
    session.currentRound = 0;
    session.revealed = Array(session.images.length).fill(null).map(() => Array(session.gridSize * session.gridSize).fill(false));
    session.roundWinners = [];
    io.to(sessionId).emit("game-started", {
      timer: session.timer,
      currentImage: session.images[session.currentRound],
      currentRound: session.currentRound + 1,
      totalRounds: session.images.length,
      revealed: session.revealed[session.currentRound]
    });
    startRoundTimer(sessionId);
  });

  function startRoundTimer(sessionId) {
    const session = sessions[sessionId];
    if (!session) return;
    let countdown = session.timer;
    session.roundTimer = setInterval(() => {
      countdown--;
      io.to(sessionId).emit("timer-update", countdown);
      if (countdown <= 0 || session.players.every(p => p.correct)) {
        clearInterval(session.roundTimer);
        endRound(sessionId);
      }
    }, 1000);
    io.to(sessionId).emit("timer-update", countdown);
  }

  function endRound(sessionId) {
    const session = sessions[sessionId];
    if (!session) return;
    // Simpan pemenang round ini
    const winners = session.players.filter(p => p.correct).map(p => ({
      name: p.name,
      steps: p.steps,
      time: p.time,
      round: session.currentRound + 1
    }));
    session.roundWinners.push(...winners);
    // Jika masih ada round berikutnya, admin bisa next round, else game end
    io.to(sessionId).emit("round-ended", {
      currentRound: session.currentRound + 1,
      totalRounds: session.images.length,
      winners,
      canNext: session.currentRound + 1 < session.images.length && session.host === socket.id,
      leaderboard: session.roundWinners
    });
    // Reset correct/steps/time utk next round
    session.players.forEach(p => { p.correct = false; p.steps = 0; p.time = 0; });
  }

  socket.on("reveal-box", ({ sessionId, boxIdx }) => {
    const session = sessions[sessionId];
    if (!session || !session.started) return;
    const round = session.currentRound;
    session.revealed[round][boxIdx] = true;
    io.to(sessionId).emit("box-revealed", { boxIdx });
  });

  socket.on("guess", ({ sessionId, guess }) => {
    const session = sessions[sessionId];
    if (!session || !session.started) return;
    const round = session.currentRound;
    if (guess.trim().toLowerCase() === session.answers[round]) {
      const player = session.players.find(p => p.id === socket.id);
      if (player && !player.correct) {
        player.correct = true;
        player.time = session.timer;
        io.to(sessionId).emit("correct-guess", { name: player.name });
      }
      if (session.players.every(p => p.correct)) {
        clearInterval(session.roundTimer);
        endRound(sessionId);
      }
    } else {
      socket.emit("guess-result", false);
    }
  });

  socket.on("step", ({ sessionId }) => {
    const session = sessions[sessionId];
    if (!session) return;
    const player = session.players.find(p => p.id === socket.id);
    if (player) player.steps += 1;
  });

  socket.on("next-round", ({ sessionId }) => {
    const session = sessions[sessionId];
    if (!session || session.host !== socket.id) return;
    if (session.currentRound + 1 >= session.images.length) return; // No more round
    session.currentRound += 1;
    session.players.forEach(p => { p.correct = false; p.steps = 0; p.time = 0; });
    io.to(sessionId).emit("next-round", {
      currentImage: session.images[session.currentRound],
      currentRound: session.currentRound + 1,
      totalRounds: session.images.length,
      revealed: session.revealed[session.currentRound]
    });
    startRoundTimer(sessionId);
  });

  socket.on("reset-session", ({ sessionId }) => {
    const session = sessions[sessionId];
    if (!session || session.host !== socket.id) return;
    session.started = false;
    session.revealed = Array(session.images.length).fill(null).map(() => Array(session.gridSize * session.gridSize).fill(false));
    session.leaderboard = [];
    session.roundWinners = [];
    session.currentRound = 0;
    session.players.forEach(p => { p.correct = false; p.steps = 0; p.time = 0; });
    io.to(sessionId).emit("session-reset");
    io.to(sessionId).emit("players-update", session.players);
  });

  socket.on("kick-player", ({ sessionId, playerId }) => {
    const session = sessions[sessionId];
    if (!session || session.host !== socket.id) return;
    const idx = session.players.findIndex(p => p.id === playerId);
    if (idx !== -1) {
      const [kicked] = session.players.splice(idx, 1);
      io.to(sessionId).emit("players-update", session.players);
      io.to(playerId).emit("kicked");
    }
  });

  socket.on("disconnect", () => {
    for (const sessionId in sessions) {
      const session = sessions[sessionId];
      const i = session.players.findIndex(p => p.id === socket.id);
      if (i !== -1) {
        const wasAdmin = session.players[i].isAdmin;
        session.players.splice(i, 1);
        // Transfer admin if admin leaves
        if (wasAdmin && session.players.length > 0) {
          session.host = session.players[0].id;
          session.players[0].isAdmin = true;
        }
        io.to(sessionId).emit("players-update", session.players);
      }
    }
  });
});
const PORT = process.env.PORT || 4000;
app.get("/", (req, res) => {
  res.send("Tebak Gambar Multiplayer Backend is running.");
});
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
