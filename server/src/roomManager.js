import { getRandomWords } from "./words.js";

// Helper for close guesses
function getLevenshteinDistance(a, b) {
  a = a.toLowerCase().trim();
  b = b.toLowerCase().trim();
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;
  const matrix = [];
  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          Math.min(
            matrix[i][j - 1] + 1, // insertion
            matrix[i - 1][j] + 1 // deletion
          )
        );
      }
    }
  }
  return matrix[b.length][a.length];
}

class Room {
  constructor(id, settings = {}) {
    this.id = id;
    this.players = [];
    this.isPublic = settings.isPublic || false;
    this.settings = {
      maxPlayers: settings.maxPlayers || 12,
      rounds: settings.rounds || 3,
      drawTime: settings.drawTime || 60,
    };
    this.state = "waiting"; // waiting, starting, selecting_word, drawing, reveal, game_over
    this.currentRound = 1;
    this.drawerIndex = 0;
    this.wordOptions = [];
    this.currentWord = "";
    this.revealedHint = "";
    this.canvasHistory = [];
    this.timer = 0;
    this.timerInterval = null;
    this.guessedCount = 0;
    this.io = null; // reference to Socket.io instance
  }

  setIO(io) {
    this.io = io;
  }

  broadcast(event, data) {
    if (this.io) {
      this.io.to(this.id).emit(event, data);
    }
  }

  addPlayer(player) {
    if (this.players.length >= this.settings.maxPlayers) {
      return { success: false, error: "Room is full" };
    }
    // First player is room creator
    player.score = 0;
    player.guessed = false;
    player.roundScore = 0;
    player.creator = this.players.length === 0;
    this.players.push(player);
    this.broadcast("room-updated", this.getPublicData());
    return { success: true };
  }

  removePlayer(socketId) {
    const index = this.players.findIndex((p) => p.socketId === socketId);
    if (index === -1) return null;

    const removedPlayer = this.players[index];
    const wasDrawer = this.getDrawer() && this.getDrawer().socketId === socketId;
    this.players.splice(index, 1);

    // If room is empty, do nothing further
    if (this.players.length === 0) {
      this.clearTimer();
      return removedPlayer;
    }

    // Assign new host if creator left
    if (removedPlayer.creator && this.players.length > 0) {
      this.players[0].creator = true;
    }

    // Check if game is actively running
    const isGameActive = ["starting", "selecting_word", "drawing", "reveal"].includes(this.state);

    // If fewer than 2 players remain during an active game, end it
    if (isGameActive && this.players.length < 2) {
      this.broadcast("system-message", {
        type: "warning",
        text: "Not enough players to continue. Game ending..."
      });
      this.forceEndGame();
      return removedPlayer;
    }

    // Game is active and we have enough players to continue
    if (isGameActive) {
      if (wasDrawer) {
        // Adjust drawerIndex so advanceGame picks the right next player
        if (index < this.drawerIndex) {
          this.drawerIndex--;
        }
        // Clamp to valid range
        this.drawerIndex = Math.min(this.drawerIndex, this.players.length - 1);

        this.broadcast("system-message", {
          type: "info",
          text: `Drawer ${removedPlayer.username} left the room. Moving to next turn...`
        });
        this.clearTimer();
        // Go directly to next turn instead of endTurn->advanceGame (which would increment drawerIndex again)
        this.state = "reveal";
        this.broadcast("room-updated", this.getPublicData());
        // Short delay then advance
        this.timer = 3;
        this.timerInterval = setInterval(() => {
          this.timer--;
          if (this.timer <= 0) {
            this.clearTimer();
            this.advanceGame();
          } else {
            this.broadcast("timer-tick", this.timer);
          }
        }, 1000);
      } else {
        // Non-drawer left: adjust drawer index if needed
        if (index < this.drawerIndex) {
          this.drawerIndex--;
        }
        this.drawerIndex = Math.min(this.drawerIndex, this.players.length - 1);
        this.checkAllGuessed();
        this.broadcast("room-updated", this.getPublicData());
      }
    } else {
      // Game not active (waiting or game_over), just update
      this.broadcast("room-updated", this.getPublicData());
    }

    return removedPlayer;
  }

  forceEndGame() {
    this.clearTimer();
    this.state = "game_over";
    this.broadcast("room-updated", this.getPublicData());
    this.broadcast("game-over", this.players.sort((a, b) => b.score - a.score));
  }

  getPublicData() {
    return {
      id: this.id,
      isPublic: this.isPublic,
      settings: this.settings,
      state: this.state,
      currentRound: this.currentRound,
      drawer: this.getDrawer(),
      players: this.players.map((p) => ({
        id: p.id,
        username: p.username,
        avatar: p.avatar,
        score: p.score,
        guessed: p.guessed,
        roundScore: p.roundScore,
        creator: p.creator,
        isDrawing: this.getDrawer() && this.getDrawer().id === p.id
      })),
      timer: this.timer,
      hint: this.revealedHint,
      wordOptions: this.state === "selecting_word" ? this.wordOptions : [],
      // For drawers, reveal the actual word; for others, hide it
      currentWord: this.state === "reveal" || this.state === "game_over" ? this.currentWord : ""
    };
  }

  getDrawer() {
    if (this.players.length === 0) return null;
    return this.players[this.drawerIndex % this.players.length];
  }

  startGame() {
    if (this.state !== "waiting" && this.state !== "game_over") return;
    this.state = "starting";
    this.currentRound = 1;
    this.drawerIndex = 0;
    this.players.forEach(p => {
      p.score = 0;
      p.guessed = false;
      p.roundScore = 0;
    });

    this.broadcast("system-message", { type: "success", text: "Game is starting in 3 seconds!" });
    
    this.timer = 3;
    this.clearTimer();
    this.timerInterval = setInterval(() => {
      this.timer--;
      if (this.timer <= 0) {
        this.clearTimer();
        this.startTurn();
      } else {
        this.broadcast("timer-tick", this.timer);
      }
    }, 1000);

    this.broadcast("room-updated", this.getPublicData());
  }

  startTurn() {
    this.canvasHistory = [];
    this.guessedCount = 0;
    this.players.forEach((p) => {
      p.guessed = false;
      p.roundScore = 0;
    });

    const drawer = this.getDrawer();
    if (!drawer) {
      this.state = "waiting";
      this.broadcast("room-updated", this.getPublicData());
      return;
    }

    this.state = "selecting_word";
    this.wordOptions = getRandomWords(3);
    this.currentWord = "";
    this.revealedHint = "";
    
    // Broadcast clean canvas
    this.broadcast("canvas-clear");

    this.timer = 15; // 15 seconds to pick a word
    this.clearTimer();
    this.timerInterval = setInterval(() => {
      this.timer--;
      if (this.timer <= 0) {
        // Auto select first word
        this.selectWord(this.wordOptions[0]);
      } else {
        this.broadcast("timer-tick", this.timer);
      }
    }, 1000);

    this.broadcast("room-updated", this.getPublicData());
    
    // Specifically send words to the drawer
    if (this.io) {
      this.io.to(drawer.socketId).emit("choose-word", this.wordOptions);
    }
  }

  selectWord(word) {
    if (this.state !== "selecting_word") return;
    this.currentWord = word.toLowerCase().trim();
    this.state = "drawing";
    
    // Initialize blank hint: dashes and spaces
    this.revealedHint = this.currentWord
      .split("")
      .map((char) => (char === " " ? " " : "_"))
      .join("");

    this.timer = this.settings.drawTime;
    this.clearTimer();
    
    // We will reveal letters at intervals
    const wordLength = this.currentWord.replace(/\s+/g, "").length;
    const revealTimes = [];
    if (wordLength > 3) {
      // Reveal 1 letter at 60%, another at 30% time
      revealTimes.push(Math.floor(this.settings.drawTime * 0.6));
      if (wordLength > 6) {
        revealTimes.push(Math.floor(this.settings.drawTime * 0.3));
      }
    }

    this.timerInterval = setInterval(() => {
      this.timer--;
      
      // Handle hint reveal
      if (revealTimes.includes(this.timer)) {
        this.revealLetter();
      }

      if (this.timer <= 0) {
        this.endTurn();
      } else {
        this.broadcast("timer-tick", this.timer);
      }
    }, 1000);

    const drawer = this.getDrawer();
    this.broadcast("system-message", {
      type: "info",
      text: `${drawer.username} is drawing now!`
    });
    
    // Broadcast update
    this.broadcast("room-updated", this.getPublicData());
    
    // Emit the hidden hint to non-drawers, and actual word to drawer
    this.players.forEach(p => {
      if (p.id === drawer.id) {
        if (this.io) this.io.to(p.socketId).emit("round-started", { word: this.currentWord, isDrawer: true });
      } else {
        if (this.io) this.io.to(p.socketId).emit("round-started", { word: this.revealedHint, isDrawer: false });
      }
    });
  }

  revealLetter() {
    const unrevealedIndices = [];
    for (let i = 0; i < this.currentWord.length; i++) {
      if (this.revealedHint[i] === "_" && this.currentWord[i] !== " ") {
        unrevealedIndices.push(i);
      }
    }
    if (unrevealedIndices.length > 0) {
      const randIndex = unrevealedIndices[Math.floor(Math.random() * unrevealedIndices.length)];
      const hintArr = this.revealedHint.split("");
      hintArr[randIndex] = this.currentWord[randIndex];
      this.revealedHint = hintArr.join("");
      
      const drawer = this.getDrawer();
      this.players.forEach((p) => {
        if (p.id !== drawer.id && !p.guessed) {
          if (this.io) this.io.to(p.socketId).emit("hint-updated", this.revealedHint);
        }
      });
    }
  }

  handleGuess(socketId, text) {
    const player = this.players.find((p) => p.socketId === socketId);
    if (!player || player.guessed || this.state !== "drawing") return { processed: false };

    // Drawer cannot guess
    const drawer = this.getDrawer();
    if (drawer && drawer.id === player.id) return { processed: false };

    const cleanGuess = text.toLowerCase().trim();
    if (cleanGuess === this.currentWord) {
      // Correct guess!
      player.guessed = true;
      this.guessedCount++;
      
      // Scoring formula: maximum 500, decay based on time, min 100
      const fractionTime = this.timer / this.settings.drawTime;
      const guessScore = Math.max(100, Math.round(fractionTime * 400 + 100));
      player.roundScore = guessScore;
      player.score += guessScore;

      // Reward drawer (max 250 points, split based on guess order/count)
      if (drawer) {
        const drawerBonus = Math.max(10, Math.round(50 - this.guessedCount * 2));
        drawer.roundScore += drawerBonus;
        drawer.score += drawerBonus;
      }

      this.broadcast("system-message", {
        type: "success",
        text: `${player.username} guessed the word!`
      });
      
      this.broadcast("room-updated", this.getPublicData());
      
      if (this.io) {
        this.io.to(player.socketId).emit("word-guessed-success", this.currentWord);
      }

      this.checkAllGuessed();

      return { processed: true, isCorrect: true };
    }

    // Levenshtein close guess
    const dist = getLevenshteinDistance(cleanGuess, this.currentWord);
    if (dist <= 2 && this.currentWord.length > 3) {
      return { processed: true, isClose: true };
    }

    return { processed: false };
  }

  checkAllGuessed() {
    const activeGuessers = this.players.filter((p) => p.id !== this.getDrawer()?.id);
    if (activeGuessers.length > 0 && activeGuessers.every((p) => p.guessed)) {
      this.broadcast("system-message", {
        type: "info",
        text: "Everyone guessed the word!"
      });
      this.endTurn();
    }
  }

  endTurn() {
    this.clearTimer();
    this.state = "reveal";
    
    // Reveal scores and word
    this.broadcast("room-updated", this.getPublicData());
    this.broadcast("round-ended", {
      word: this.currentWord,
      scores: this.players.map(p => ({ username: p.username, score: p.score, roundScore: p.roundScore }))
    });

    this.timer = 6; // 6 seconds intermission to see correct word and standings
    this.timerInterval = setInterval(() => {
      this.timer--;
      if (this.timer <= 0) {
        this.clearTimer();
        this.advanceGame();
      } else {
        this.broadcast("timer-tick", this.timer);
      }
    }, 1000);
  }

  advanceGame() {
    // Safety check: not enough players to continue
    if (this.players.length < 2) {
      this.forceEndGame();
      return;
    }

    this.drawerIndex++;
    
    // Check if round is complete (everyone has drawn once)
    if (this.drawerIndex >= this.players.length) {
      this.drawerIndex = 0;
      this.currentRound++;
    }

    if (this.currentRound > this.settings.rounds) {
      // Game Over
      this.state = "game_over";
      this.broadcast("room-updated", this.getPublicData());
      this.broadcast("game-over", this.players.sort((a, b) => b.score - a.score));
    } else {
      // Start next turn
      this.startTurn();
    }
  }

  clearTimer() {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
  }

  addCanvasDraw(stroke) {
    this.canvasHistory.push(stroke);
  }

  clearCanvas() {
    this.canvasHistory = [];
  }

  undoCanvas() {
    this.canvasHistory.pop();
  }
}

class RoomManager {
  constructor() {
    this.rooms = new Map();
  }

  createRoom(settings) {
    // Generate unique 6 letter alphanumeric code
    let code;
    do {
      code = Math.random().toString(36).substring(2, 8).toUpperCase();
    } while (this.rooms.has(code));

    const room = new Room(code, settings);
    this.rooms.set(code, room);
    return room;
  }

  getRoom(code) {
    return this.rooms.get(code.toUpperCase());
  }

  getPublicRooms() {
    const publicRooms = [];
    for (const [code, room] of this.rooms.entries()) {
      if (
        room.isPublic &&
        (room.state === "waiting" || room.state === "game_over") &&
        room.players.length < room.settings.maxPlayers
      ) {
        const host = room.players.find((p) => p.creator);
        publicRooms.push({
          roomCode: code,
          hostName: host ? host.username : "Unknown",
          hostAvatar: host ? host.avatar : "🎨",
          playerCount: room.players.length,
          maxPlayers: room.settings.maxPlayers,
          rounds: room.settings.rounds,
          drawTime: room.settings.drawTime,
        });
      }
    }
    return publicRooms;
  }

  deleteRoom(code) {
    const room = this.getRoom(code);
    if (room) {
      room.clearTimer();
      this.rooms.delete(code.toUpperCase());
    }
  }
}

export const roomManager = new RoomManager();
export { Room };
