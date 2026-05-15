import express from "express";
import path from "path";
import { createServer } from "http";
import { Server } from "socket.io";
import { createServer as createViteServer } from "vite";

async function startServer() {
  const app = express();
  const httpServer = createServer(app);
  const io = new Server(httpServer, {
    cors: {
      origin: "*",
    },
  });

  const PORT = 3000;

  // API Routes
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", time: new Date().toISOString() });
  });

  // Socket.io Logic
  io.on("connection", (socket) => {
    console.log("A user connected:", socket.id);

    socket.on("join_match", (matchId) => {
      socket.join(`match_${matchId}`);
      console.log(`User ${socket.id} joined match ${matchId}`);
    });

    socket.on("disconnect", () => {
      console.log("User disconnected:", socket.id);
    });
  });

  // Match Simulator - Emits events every few seconds
  let momentum = 0;
  setInterval(() => {
    momentum = Math.max(-100, Math.min(100, momentum + (Math.random() - 0.5) * 20));
    io.emit("match_update", {
      matchId: "live-match-1",
      momentum: Math.round(momentum),
      timestamp: Date.now()
    });

    // Randomly trigger heartbeats for big events
    if (Math.random() > 0.95) {
      io.emit("heartbeat", {
        intensity: "high",
        event: "Big Moment!",
        timestamp: Date.now()
      });
    }
  }, 3000);

  // Cricket API Integration
  const CRICKET_API_KEY = process.env.CRICKET_API_KEY;
  if (CRICKET_API_KEY) {
    console.log("Cricket API Key detected. Starting cricket data sync...");
    const fetchCricketData = async () => {
      try {
        const response = await fetch(`https://api.cricketdata.org/v1/currentMatches?apikey=${CRICKET_API_KEY}`);
        const data: any = await response.json();
        if (data && data.data) {
          io.emit("cricket_matches", data.data);
          console.log(`Broadcasted ${data.data.length} cricket matches`);
        }
      } catch (err) {
        console.error("Failed to fetch cricket data:", err);
      }
    };

    fetchCricketData();
    setInterval(fetchCricketData, 5 * 60 * 1000); // Sync every 5 minutes to respect rate limits
  }

  // Trigger micro-predictions occasionally
  setInterval(() => {
    if (Math.random() > 0.8) {
      const questions = [
        { q: "Will the next play be a run or a pass?", options: ["Run", "Pass"] },
        { q: "Will this drive result in a score?", options: ["Yes", "No"] },
        { q: "Who will commit the next foul?", options: ["Home Team", "Away Team"] }
      ];
      const randomQ = questions[Math.floor(Math.random() * questions.length)];
      
      io.emit("prediction_event", {
        ...randomQ,
        id: `p-${Date.now()}`,
        expiresAt: Date.now() + 15000 // 15 seconds to answer
      });
    }
  }, 20000);

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  httpServer.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
