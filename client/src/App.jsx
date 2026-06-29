import React, { useState, useEffect, useRef, useCallback } from "react";
import io from "socket.io-client";
import Lobby from "./components/Lobby";
import Scoreboard from "./components/Scoreboard";
import Canvas from "./components/Canvas";
import Chat from "./components/Chat";
import WordSelector from "./components/WordSelector";
import GameEnd from "./components/GameEnd";
import useSounds from "./useSounds";

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || "http://localhost:5000";

export default function App() {
  const [socket, setSocket] = useState(() => io(SOCKET_URL));
  const [player, setPlayer] = useState(null);
  const [roomCode, setRoomCode] = useState("");
  const [roomState, setRoomState] = useState(null);
  const [messages, setMessages] = useState([]);
  const [error, setError] = useState("");
  const [copiedCode, setCopiedCode] = useState(false);

  // Theme & performance preferences
  const [theme, setTheme] = useState(() => localStorage.getItem("sketchsock-theme") || "dark");
  const [showBlobs, setShowBlobs] = useState(() => localStorage.getItem("sketchsock-show-blobs") !== "false");

  // Sync theme to document body
  useEffect(() => {
    document.body.setAttribute("data-theme", theme);
    localStorage.setItem("sketchsock-theme", theme);
  }, [theme]);

  // Sync blobs preference
  useEffect(() => {
    localStorage.setItem("sketchsock-show-blobs", String(showBlobs));
  }, [showBlobs]);

  // Sound system
  const sounds = useSounds();
  const prevTimerRef = useRef(null);
  const prevStateRef = useRef(null);

  // Initialize socket connection
  useEffect(() => {
    if (!socket) return;

    socket.on("connect", () => {
      console.log("Connected to server:", socket.id);
      setError("");
    });

    socket.on("connect_error", () => {
      setError("Unable to connect to game server. Make sure it is running.");
    });

    // 1. Joined room successfully
    socket.on("room-joined", ({ roomCode, player }) => {
      setRoomCode(roomCode);
      setPlayer(player);
      setMessages([]);
      setError("");
    });

    // 2. Room State Updates
    socket.on("room-updated", (state) => {
      setRoomState(state);
    });

    // 3. Simple timer tick
    socket.on("timer-tick", (timeLeft) => {
      setRoomState((prev) => (prev ? { ...prev, timer: timeLeft } : null));
    });

    // 4. Update word hint (for guessers)
    socket.on("hint-updated", (hint) => {
      setRoomState((prev) => (prev ? { ...prev, hint } : null));
    });

    // 5. Turn transitions
    socket.on("round-started", ({ word, isDrawer }) => {
      // Set localized hint or drawer word
      setRoomState((prev) => {
        if (!prev) return null;
        if (isDrawer) {
          return { ...prev, currentWord: word, state: "drawing" };
        } else {
          return { ...prev, hint: word, state: "drawing" };
        }
      });
    });

    socket.on("round-ended", ({ word, scores }) => {
      // Clear logs slightly on new rounds, or just show reveal banner
      setMessages((prev) => [
        ...prev,
        {
          isSystem: true,
          type: "info",
          text: `Round ended! The correct word was "${word.toUpperCase()}"`
        }
      ]);
    });

    // 6. Messaging
    socket.on("chat-message", (msg) => {
      setMessages((prev) => [...prev, msg]);
    });

    socket.on("system-message", (sysMsg) => {
      setMessages((prev) => [...prev, { ...sysMsg, isSystem: true }]);
    });

    socket.on("error-message", (errMsg) => {
      setError(errMsg);
    });

    return () => {
      socket.off("connect");
      socket.off("connect_error");
      socket.off("room-joined");
      socket.off("room-updated");
      socket.off("timer-tick");
      socket.off("hint-updated");
      socket.off("round-started");
      socket.off("round-ended");
      socket.off("chat-message");
      socket.off("system-message");
      socket.off("error-message");
    };
  }, [socket]);

  // ═══════════════════════════════════════════════════════════════════
  // SOUND TRIGGERS — Timer ticking
  // ═══════════════════════════════════════════════════════════════════
  useEffect(() => {
    if (!roomState) return;
    const { timer, state } = roomState;

    // Only tick during active phases
    if (state !== "drawing" && state !== "selecting_word") {
      prevTimerRef.current = timer;
      return;
    }

    // Only play on actual decrement (not on initial state)
    if (prevTimerRef.current !== null && timer < prevTimerRef.current) {
      if (state === "drawing") {
        if (timer <= 5) {
          sounds.playCriticalTick();
        } else if (timer <= 10) {
          sounds.playUrgentTick();
        } else {
          sounds.playTick();
        }
      } else if (state === "selecting_word") {
        // Softer tick during word selection
        if (timer <= 5) {
          sounds.playUrgentTick();
        } else {
          sounds.playTick();
        }
      }
    }

    prevTimerRef.current = timer;
  }, [roomState?.timer, roomState?.state, sounds]);

  // ═══════════════════════════════════════════════════════════════════
  // SOUND TRIGGERS — State transitions
  // ═══════════════════════════════════════════════════════════════════
  useEffect(() => {
    if (!roomState) return;
    const currentState = roomState.state;
    const prevState = prevStateRef.current;

    if (prevState && prevState !== currentState) {
      if (currentState === "drawing" && prevState === "selecting_word") {
        sounds.playRoundStart();
      } else if (currentState === "reveal") {
        sounds.playRoundEnd();
      } else if (currentState === "game_over") {
        sounds.playGameOver();
      }
    }

    prevStateRef.current = currentState;
  }, [roomState?.state, sounds]);

  // ═══════════════════════════════════════════════════════════════════
  // SOUND TRIGGERS — Socket events (one-time wiring)
  // ═══════════════════════════════════════════════════════════════════
  const soundsRef = useRef(sounds);
  soundsRef.current = sounds;

  useEffect(() => {
    if (!socket) return;

    // Correct guess (you guessed it!)
    const handleWordGuessedSuccess = () => {
      soundsRef.current.playCorrectGuess();
    };

    // System messages: guessed, join, leave, close guess
    const handleSystemSound = (sysMsg) => {
      const text = sysMsg.text || "";
      if (sysMsg.type === "success" && text.includes("guessed the word")) {
        soundsRef.current.playSomeoneGuessed();
      } else if (sysMsg.type === "warning" && text.includes("very close")) {
        soundsRef.current.playCloseGuess();
      } else if (sysMsg.type === "info" && text.includes("joined")) {
        soundsRef.current.playPlayerJoin();
      } else if (sysMsg.type === "info" && text.includes("left")) {
        soundsRef.current.playPlayerLeave();
      }
    };

    socket.on("word-guessed-success", handleWordGuessedSuccess);
    socket.on("system-message", handleSystemSound);

    return () => {
      socket.off("word-guessed-success", handleWordGuessedSuccess);
      socket.off("system-message", handleSystemSound);
    };
  }, [socket]);

  const handleCreateRoom = ({ username, avatar, settings }) => {
    if (!socket) return;
    setError("");
    socket.emit("create-room", { username, avatar, settings });
  };

  const handleJoinRoom = ({ username, avatar, roomCode }) => {
    if (!socket) return;
    setError("");
    socket.emit("join-room", { roomCode, username, avatar });
  };

  const handleStartGame = () => {
    if (!socket || !roomCode) return;
    socket.emit("start-game", { roomCode });
  };

  const handleSelectWord = (word) => {
    if (!socket || !roomCode) return;
    socket.emit("select-word", { roomCode, word });
  };

  const handleLeaveRoom = () => {
    if (!socket) return;
    
    // 1. Terminate current room session socket on server
    socket.disconnect();
    
    // 2. Reset React local states back to lobby defaults
    setRoomCode("");
    setRoomState(null);
    setPlayer(null);
    setMessages([]);
    setError("");

    // 3. Open a brand new lobby socket session
    const newSocket = io(SOCKET_URL);
    setSocket(newSocket);
  };

  const copyRoomCode = () => {
    if (!roomCode) return;
    navigator.clipboard.writeText(roomCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  // Helper flags
  const isLobby = !roomState;
  const isHost = roomState?.players.find((p) => p.id === player?.id)?.creator;
  const currentDrawer = roomState?.drawer;
  const isDrawer = currentDrawer?.id === player?.id;
  const hasGuessed = roomState?.players.find((p) => p.id === player?.id)?.guessed;

  // Timer urgency class
  const timerUrgencyClass =
    roomState?.state === "drawing"
      ? roomState.timer <= 5
        ? "timer-critical"
        : roomState.timer <= 10
        ? "timer-urgent"
        : ""
      : "";

  // LOBBY PAGE RENDERING & ACTIVE GAMEPLAY SCREEN
  return (
    <div className="app-wrapper">
      {showBlobs && (
        <div className="bg-blobs">
          <div className="blob blob-1"></div>
          <div className="blob blob-2"></div>
          <div className="blob blob-3"></div>
        </div>
      )}

      {isLobby ? (
        <Lobby
          socket={socket}
          onCreateRoom={handleCreateRoom}
          onJoinRoom={handleJoinRoom}
          error={error}
          sounds={sounds}
          theme={theme}
          setTheme={setTheme}
          showBlobs={showBlobs}
          setShowBlobs={setShowBlobs}
        />
      ) : (
        <div className="app-container">
      {/* Top Header Controls */}
      <header className="glass-panel header">
        <h1 className="logo">
          <img src="/favicon.svg" alt="SketchSock" className="logo-svg" />Sketch<span className="logo-accent">Sock</span>
        </h1>
        
        {/* State/Action Indicators */}
        <div className="header-actions">
          {/* Mute / Unmute Toggle */}
          <button
            className={`btn btn-secondary btn-sound-toggle ${sounds.muted ? "is-muted" : ""}`}
            onClick={sounds.toggleMute}
            title={sounds.muted ? "Unmute sounds" : "Mute sounds"}
          >
            {sounds.muted ? "🔇" : "🔊"}
          </button>

          {/* Share room code */}
          <div className="room-code-display" onClick={copyRoomCode} title="Click to copy code">
            <span className="room-code-label">
              Room:
            </span>
            <span className="room-code-text">{roomCode}</span>
            <span className="room-code-copy">
              {copiedCode ? "✅" : "📋"}
            </span>
          </div>

          {/* Leave room */}
          <button className="btn btn-secondary btn-leave" onClick={handleLeaveRoom}>
            🚪 Leave
          </button>
        </div>
      </header>

      {/* Main Grid View */}
      <main className="game-grid">
        {/* Left Side: Scoreboard */}
        <Scoreboard players={roomState.players} />

        {/* Center Canvas area */}
        <div className="glass-panel canvas-panel" style={{ position: "relative" }}>
          {/* Active Round Info and Timer Bar */}
          <div className="game-info-bar">
            {/* Timer */}
            <div className={`timer-indicator ${timerUrgencyClass}`} title="Seconds remaining">
              ⏱️ {roomState.timer}s
            </div>

            {/* Word details or hints */}
            <div className="word-hint-wrapper" style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
              {roomState.state === "drawing" ? (
                isDrawer ? (
                  <div className="word-hint drawing-hint">
                    DRAW THIS: <span style={{ textTransform: "uppercase", letterSpacing: "0.05em", color: "#fff" }}>{roomState.currentWord}</span>
                  </div>
                ) : (
                  <div className="word-hint" title="Guess word hint">
                    {roomState.hint}
                  </div>
                )
              ) : roomState.state === "selecting_word" ? (
                <div style={{ fontStyle: "italic", color: "var(--text-secondary)", fontSize: "1.1rem" }}>
                  {isDrawer ? "Choose a word..." : `${currentDrawer?.username} is choosing a word...`}
                </div>
              ) : roomState.state === "reveal" ? (
                <div style={{ fontWeight: 700, color: "var(--success-color)", fontSize: "1.3rem" }}>
                  Word was: <span style={{ textTransform: "uppercase" }}>{roomState.currentWord}</span>
                </div>
              ) : (
                <div style={{ color: "var(--text-secondary)" }}>Lobby</div>
              )}
            </div>

            {/* Round info */}
            <div className="round-info">
              Round {roomState.currentRound}/{roomState.settings.rounds}
            </div>
          </div>

          {/* The Drawing Board Component */}
          <Canvas
            socket={socket}
            roomCode={roomCode}
            isDrawer={isDrawer}
            drawerName={currentDrawer?.username}
          />


        </div>

        {/* Right Side: Chat & Guessing Logs */}
        <Chat
          socket={socket}
          roomCode={roomCode}
          messages={messages}
          isDrawer={isDrawer}
          hasGuessed={hasGuessed}
          playChatSend={sounds.playChatSend}
        />
      </main>

      {/* OVERLAY 1: Pre-game waiting room / Lobby start trigger */}
      {roomState.state === "waiting" && (
        <div className="canvas-overlay-message" style={{ background: "rgba(10, 10, 15, 0.9)" }}>
          <div style={{ fontSize: "4rem" }}>🎨</div>
          <h3>Lobby Waiting Area</h3>
          <p style={{ maxWidth: "400px", margin: "0 auto", fontSize: "0.95rem" }}>
            Share the room code above with friends. The game requires at least 2 players to start.
          </p>
          {isHost ? (
            <button
              className="btn btn-primary"
              onClick={handleStartGame}
              disabled={roomState.players.length < 2}
              style={{ marginTop: "12px", padding: "12px 24px", fontSize: "1.05rem" }}
            >
              🚀 Start Game ({roomState.players.length} Players)
            </button>
          ) : (
            <div style={{ marginTop: "12px", color: "var(--text-muted)", fontStyle: "italic", fontSize: "0.95rem" }}>
              Waiting for host ({roomState.players.find(p => p.creator)?.username}) to start...
            </div>
          )}
        </div>
      )}

      {/* OVERLAY 2: Word Selector Modal (only visible to drawer in word selection stage) */}
      {roomState.state === "selecting_word" && isDrawer && (
        <WordSelector
          wordOptions={roomState.wordOptions}
          timer={roomState.timer}
          onSelect={handleSelectWord}
          playWordSelect={sounds.playWordSelect}
        />
      )}

      {/* OVERLAY 3: Intermission / Reveal view */}
      {roomState.state === "reveal" && (
        <div className="canvas-overlay-message">
          <h3>Word Revealed!</h3>
          <div style={{ fontSize: "2.5rem", fontWeight: 800, color: "#fff", margin: "10px 0" }}>
            {roomState.currentWord.toUpperCase()}
          </div>
          <p style={{ color: "var(--success-color)", fontWeight: "bold" }}>
            Standings updating, next turn in {roomState.timer}s...
          </p>
        </div>
      )}

      {/* OVERLAY 4: Game Over stand pod lists */}
      {roomState.state === "game_over" && (
        <GameEnd
          players={roomState.players}
          isHost={isHost}
          onPlayAgain={handleStartGame}
          onLeave={handleLeaveRoom}
        />
      )}

      <footer className="footer-watermark">
        SketchSock - Designed with 💜 
      </footer>
        </div>
      )}
    </div>
  );
}
