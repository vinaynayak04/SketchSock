import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import cors from "cors";
import { roomManager } from "./roomManager.js";

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 5000;
const httpServer = createServer(app);

const io = new Server(httpServer, {
  cors: {
    origin: "*", // allow development connections
    methods: ["GET", "POST"]
  }
});

// Simple API Check
app.get("/api/health", (req, res) => {
  res.json({ status: "healthy", roomsCount: roomManager.rooms.size });
});

io.on("connection", (socket) => {
  console.log(`Socket connected: ${socket.id}`);

  // 1. Create Room
  socket.on("create-room", ({ username, avatar, settings }) => {
    const room = roomManager.createRoom(settings);
    room.setIO(io);

    const player = {
      id: socket.id,
      socketId: socket.id,
      username: username || "Artist",
      avatar: avatar || "🐱"
    };

    socket.join(room.id);
    const joinRes = room.addPlayer(player);
    if (joinRes.success) {
      socket.emit("room-joined", { roomCode: room.id, player });
      console.log(`Room created: ${room.id} by ${player.username} (${room.isPublic ? 'public' : 'private'})`);
    } else {
      socket.leave(room.id);
      socket.emit("error-message", joinRes.error);
    }
  });

  // 1b. Get Public Rooms
  socket.on("get-public-rooms", (callback) => {
    const rooms = roomManager.getPublicRooms();
    if (typeof callback === 'function') {
      callback(rooms);
    } else {
      socket.emit("public-rooms-list", rooms);
    }
  });

  // 2. Join Room
  socket.on("join-room", ({ roomCode, username, avatar }) => {
    const room = roomManager.getRoom(roomCode);
    if (!room) {
      socket.emit("error-message", "Room not found");
      return;
    }

    if (room.state !== "waiting" && room.state !== "game_over") {
      socket.emit("error-message", "Game has already started in this room");
      return;
    }

    const player = {
      id: socket.id,
      socketId: socket.id,
      username: username || "Guesser",
      avatar: avatar || "🐶"
    };

    socket.join(room.id);
    const joinRes = room.addPlayer(player);
    if (joinRes.success) {
      socket.emit("room-joined", { roomCode: room.id, player });
      
      // Notify details
      room.broadcast("system-message", {
        type: "info",
        text: `${player.username} joined the lobby!`
      });

      console.log(`Player ${player.username} joined room: ${room.id}`);
    } else {
      socket.leave(room.id);
      socket.emit("error-message", joinRes.error);
    }
  });

  // 3. Start Game
  socket.on("start-game", ({ roomCode }) => {
    const room = roomManager.getRoom(roomCode);
    if (!room) return;

    // Only host can start game
    const player = room.players.find(p => p.socketId === socket.id);
    if (player && player.creator) {
      room.startGame();
    }
  });

  // 4. Select Word
  socket.on("select-word", ({ roomCode, word }) => {
    const room = roomManager.getRoom(roomCode);
    if (!room) return;

    // Check if the sender is indeed the drawer
    const drawer = room.getDrawer();
    if (drawer && drawer.socketId === socket.id) {
      room.selectWord(word);
    }
  });

  // 5. Canvas Drawing Sync
  socket.on("draw-stroke", ({ roomCode, stroke }) => {
    const room = roomManager.getRoom(roomCode);
    if (!room || room.state !== "drawing") return;

    // Verify drawing user is the actual drawer
    const drawer = room.getDrawer();
    if (drawer && drawer.socketId === socket.id) {
      room.addCanvasDraw(stroke);
      // Relay to other users in room
      socket.to(roomCode).emit("draw-stroke", stroke);
    }
  });

  socket.on("canvas-clear", ({ roomCode }) => {
    const room = roomManager.getRoom(roomCode);
    if (!room || room.state !== "drawing") return;

    const drawer = room.getDrawer();
    if (drawer && drawer.socketId === socket.id) {
      room.clearCanvas();
      socket.to(roomCode).emit("canvas-clear");
    }
  });

  socket.on("canvas-undo", ({ roomCode }) => {
    const room = roomManager.getRoom(roomCode);
    if (!room || room.state !== "drawing") return;

    const drawer = room.getDrawer();
    if (drawer && drawer.socketId === socket.id) {
      room.undoCanvas();
      // To keep simple, broadcast the full redrawn history
      socket.to(roomCode).emit("canvas-redraw", room.canvasHistory);
    }
  });

  // 6. Chat and Guess
  socket.on("chat-message", ({ roomCode, text }) => {
    const room = roomManager.getRoom(roomCode);
    if (!room) return;

    const player = room.players.find(p => p.socketId === socket.id);
    if (!player) return;

    // Clean text
    const cleanText = text.trim();
    if (!cleanText) return;

    // Check if player has guessed
    if (player.guessed) {
      // Guessed players can chat, but their chat is only visible to other guessed players
      // to avoid spoiling the word.
      const guessedSocketIds = room.players.filter(p => p.guessed || p.id === room.getDrawer()?.id).map(p => p.socketId);
      
      guessedSocketIds.forEach(sid => {
        io.to(sid).emit("chat-message", {
          sender: player.username,
          senderId: player.id,
          text: cleanText,
          isGuessedChat: true
        });
      });
      return;
    }

    // Try guessing
    const guessResult = room.handleGuess(socket.id, cleanText);

    if (guessResult.processed) {
      if (guessResult.isCorrect) {
        // Handled internally in room, will broadcast system green message
        return;
      }
      if (guessResult.isClose) {
        // Send close guess prompt to the guesser only
        socket.emit("system-message", {
          type: "warning",
          text: `"${cleanText}" is very close!`
        });
        
        // Also show their guess as chat to non-guessed players
        // (but hide it if they manage to hit exactly)
      }
    }

    // Normal message broadcast to everyone if game not drawing or player hasn't guessed it
    room.broadcast("chat-message", {
      sender: player.username,
      senderId: player.id,
      text: cleanText,
      isGuessedChat: false
    });
  });

  // Request history (for drawer transition or sync)
  socket.on("request-canvas-history", ({ roomCode }) => {
    const room = roomManager.getRoom(roomCode);
    if (room) {
      socket.emit("canvas-redraw", room.canvasHistory);
    }
  });

  // 7. Disconnection
  socket.on("disconnect", () => {
    console.log(`Socket disconnected: ${socket.id}`);
    
    // Find rooms this player was in
    for (const [code, room] of roomManager.rooms.entries()) {
      const removed = room.removePlayer(socket.id);
      if (removed) {
        room.broadcast("system-message", {
          type: "info",
          text: `${removed.username} left the room.`
        });
        
        // Delete room if empty
        if (room.players.length === 0) {
          roomManager.deleteRoom(code);
          console.log(`Room ${code} deleted because it became empty.`);
        }
        break;
      }
    }
  });
});

httpServer.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
