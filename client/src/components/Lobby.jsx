import React, { useState, useEffect, useCallback } from "react";
import Avatar, { AVATAR_EMOJIS } from "./Avatar";

export default function Lobby({ socket, onCreateRoom, onJoinRoom, error }) {
  const [activeTab, setActiveTab] = useState("public"); // public | join | create
  const [username, setUsername] = useState(
    () => `Player${Math.floor(Math.random() * 900) + 100}`
  );
  
  // Choose random initial avatar
  const [avatar, setAvatar] = useState(
    () => AVATAR_EMOJIS[Math.floor(Math.random() * AVATAR_EMOJIS.length)]
  );

  // Room settings
  const [rounds, setRounds] = useState(3);
  const [drawTime, setDrawTime] = useState(60);
  const [maxPlayers, setMaxPlayers] = useState(12);
  const [isPublic, setIsPublic] = useState(true);
  const [roomCodeInput, setRoomCodeInput] = useState("");

  // Public rooms
  const [publicRooms, setPublicRooms] = useState([]);
  const [loadingRooms, setLoadingRooms] = useState(false);

  const fetchPublicRooms = useCallback(() => {
    if (!socket) return;
    setLoadingRooms(true);
    socket.emit("get-public-rooms", (rooms) => {
      setPublicRooms(rooms || []);
      setLoadingRooms(false);
    });

    // Fallback if server uses emit instead of callback
    const handleRoomsList = (rooms) => {
      setPublicRooms(rooms || []);
      setLoadingRooms(false);
    };
    socket.on("public-rooms-list", handleRoomsList);

    return () => {
      socket.off("public-rooms-list", handleRoomsList);
    };
  }, [socket]);

  // Fetch public rooms when tab is active
  useEffect(() => {
    if (activeTab === "public") {
      fetchPublicRooms();
      const interval = setInterval(fetchPublicRooms, 5000);
      return () => clearInterval(interval);
    }
  }, [activeTab, fetchPublicRooms]);

  const handleRandomizeAvatar = () => {
    const randomEmoji = AVATAR_EMOJIS[Math.floor(Math.random() * AVATAR_EMOJIS.length)];
    setAvatar(randomEmoji);
  };

  const handleCreateSubmit = (e) => {
    e.preventDefault();
    if (!username.trim()) return;
    onCreateRoom({
      username: username.trim(),
      avatar,
      settings: { rounds, drawTime, maxPlayers, isPublic }
    });
  };

  const handleJoinSubmit = (e) => {
    e.preventDefault();
    if (!username.trim() || !roomCodeInput.trim()) return;
    onJoinRoom({
      username: username.trim(),
      avatar,
      roomCode: roomCodeInput.trim().toUpperCase()
    });
  };

  const handleJoinPublicRoom = (roomCode) => {
    if (!username.trim()) return;
    onJoinRoom({
      username: username.trim(),
      avatar,
      roomCode
    });
  };

  // Limit selection size for preview grid
  const previewEmojis = AVATAR_EMOJIS.slice(0, 15);

  return (
    <div className="lobby-layout">
      <div className="glass-panel lobby-card">
        <div>
          <h2 className="lobby-title">🎨 SketchSock</h2>
          <p style={{ textAlign: "center", color: "var(--text-secondary)", fontSize: "0.95rem" }}>
            The ultimate drawing & guessing showdown
          </p>
        </div>

        {error && (
          <div
            className="chat-bubble system warning"
            style={{
              padding: "10px",
              textAlign: "center",
              borderRadius: "var(--radius-sm)",
              fontSize: "0.85rem",
              fontWeight: 500
            }}
          >
            ⚠️ {error}
          </div>
        )}

        {/* Profile configuration */}
        <div className="lobby-avatar-section">
          <div
            className="avatar-display-large"
            onClick={handleRandomizeAvatar}
            title="Click to randomize"
          >
            {avatar}
          </div>
          
          <button
            type="button"
            className="btn btn-secondary"
            onClick={handleRandomizeAvatar}
            style={{ padding: "6px 12px", fontSize: "0.8rem", borderRadius: "20px" }}
          >
            🎲 Randomize Emoji
          </button>

          {/* Quick grid selector */}
          <div className="avatar-grid">
            {previewEmojis.map((emoji) => (
              <div
                key={emoji}
                className={`avatar-option ${avatar === emoji ? "selected" : ""}`}
                onClick={() => setAvatar(emoji)}
              >
                {emoji}
              </div>
            ))}
          </div>
        </div>

        {/* Username field */}
        <div className="form-group">
          <label htmlFor="username">Your Nickname</label>
          <input
            id="username"
            type="text"
            className="input-field"
            value={username}
            onChange={(e) => setUsername(e.target.value.slice(0, 15))}
            placeholder="Enter name..."
            required
            maxLength={15}
          />
        </div>

        {/* Three Tab Headers */}
        <div className="tabs-header">
          <button
            type="button"
            className={`tab-btn ${activeTab === "public" ? "active" : ""}`}
            onClick={() => setActiveTab("public")}
          >
            🌐 Public
          </button>
          <button
            type="button"
            className={`tab-btn ${activeTab === "join" ? "active" : ""}`}
            onClick={() => setActiveTab("join")}
          >
            🔒 Private
          </button>
          <button
            type="button"
            className={`tab-btn ${activeTab === "create" ? "active" : ""}`}
            onClick={() => setActiveTab("create")}
          >
            ✨ Create
          </button>
        </div>

        {/* ===================== TAB: PUBLIC ROOMS ===================== */}
        {activeTab === "public" && (
          <div className="public-rooms-container">
            <div className="public-rooms-header">
              <span className="public-rooms-count">
                {publicRooms.length} room{publicRooms.length !== 1 ? "s" : ""} available
              </span>
              <button
                type="button"
                className="btn btn-secondary btn-refresh"
                onClick={fetchPublicRooms}
                disabled={loadingRooms}
              >
                {loadingRooms ? "⏳" : "🔄"} Refresh
              </button>
            </div>

            <div className="public-rooms-list">
              {publicRooms.length === 0 ? (
                <div className="public-rooms-empty">
                  <div style={{ fontSize: "2.5rem", marginBottom: "8px" }}>🏠</div>
                  <p>No public rooms available right now.</p>
                  <p style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
                    Create one and others will see it here!
                  </p>
                </div>
              ) : (
                publicRooms.map((room) => (
                  <div key={room.roomCode} className="public-room-card">
                    <div className="public-room-info">
                      <div className="public-room-host">
                        <span className="public-room-avatar">{room.hostAvatar}</span>
                        <span className="public-room-host-name">{room.hostName}'s Room</span>
                      </div>
                      <div className="public-room-meta">
                        <span className="public-room-tag">
                          👥 {room.playerCount}/{room.maxPlayers}
                        </span>
                        <span className="public-room-tag">
                          🔄 {room.rounds} rounds
                        </span>
                        <span className="public-room-tag">
                          ⏱️ {room.drawTime}s
                        </span>
                      </div>
                    </div>
                    <button
                      className="btn btn-primary btn-join-public"
                      onClick={() => handleJoinPublicRoom(room.roomCode)}
                    >
                      Join
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* ===================== TAB: JOIN PRIVATE ===================== */}
        {activeTab === "join" && (
          <form onSubmit={handleJoinSubmit} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            <div className="form-group">
              <label htmlFor="roomCode">Room Code</label>
              <input
                id="roomCode"
                type="text"
                className="input-field"
                value={roomCodeInput}
                onChange={(e) => setRoomCodeInput(e.target.value.toUpperCase().slice(0, 6))}
                placeholder="Enter 6-character code"
                required
                style={{ textTransform: "uppercase", textAlign: "center", fontSize: "1.2rem", fontWeight: 700 }}
              />
            </div>
            <button type="submit" className="btn btn-primary" style={{ width: "100%", padding: "12px" }}>
              🎮 Enter Game
            </button>
          </form>
        )}

        {/* ===================== TAB: CREATE ROOM ===================== */}
        {activeTab === "create" && (
          <form onSubmit={handleCreateSubmit} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            {/* Public / Private Toggle */}
            <div className="room-type-toggle">
              <button
                type="button"
                className={`room-type-btn ${isPublic ? "active" : ""}`}
                onClick={() => setIsPublic(true)}
              >
                <span className="room-type-icon">🌐</span>
                <span className="room-type-label">Public Room</span>
                <span className="room-type-desc">Anyone can find & join</span>
              </button>
              <button
                type="button"
                className={`room-type-btn ${!isPublic ? "active" : ""}`}
                onClick={() => setIsPublic(false)}
              >
                <span className="room-type-icon">🔒</span>
                <span className="room-type-label">Private Room</span>
                <span className="room-type-desc">Share code to invite</span>
              </button>
            </div>

            <div className="lobby-settings-grid">
              <div className="form-group">
                <label htmlFor="rounds">Rounds</label>
                <select
                  id="rounds"
                  className="input-field"
                  value={rounds}
                  onChange={(e) => setRounds(Number(e.target.value))}
                >
                  <option value={2}>2 Rounds</option>
                  <option value={3}>3 Rounds</option>
                  <option value={5}>5 Rounds</option>
                  <option value={8}>8 Rounds</option>
                  <option value={10}>10 Rounds</option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="drawTime">Time Limit (Sec)</label>
                <select
                  id="drawTime"
                  className="input-field"
                  value={drawTime}
                  onChange={(e) => setDrawTime(Number(e.target.value))}
                >
                  <option value={30}>30 sec</option>
                  <option value={45}>45 sec</option>
                  <option value={60}>60 sec</option>
                  <option value={90}>90 sec</option>
                  <option value={120}>120 sec</option>
                  <option value={180}>180 sec</option>
                </select>
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="maxPlayers">Max Players</label>
              <select
                id="maxPlayers"
                className="input-field"
                value={maxPlayers}
                onChange={(e) => setMaxPlayers(Number(e.target.value))}
              >
                <option value={4}>4 players</option>
                <option value={8}>8 players</option>
                <option value={12}>12 players</option>
                <option value={16}>16 players</option>
                <option value={20}>20 players</option>
              </select>
            </div>

            <button type="submit" className="btn btn-primary" style={{ width: "100%", padding: "12px" }}>
              {isPublic ? "🌐 Create Public Room" : "🔒 Create Private Room"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
