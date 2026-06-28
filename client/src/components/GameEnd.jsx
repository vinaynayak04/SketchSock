import React from "react";
import Avatar from "./Avatar";

export default function GameEnd({ players = [], isHost, onPlayAgain, onLeave }) {
  // Sort players by final score
  const sorted = [...players].sort((a, b) => b.score - a.score);

  const firstPlace = sorted[0] || null;
  const secondPlace = sorted[1] || null;
  const thirdPlace = sorted[2] || null;
  const rest = sorted.slice(3);

  return (
    <div className="game-end-overlay">
      <div style={{ textAlign: "center", width: "100%", maxWidth: "800px", padding: "0 24px" }}>
        <h1 className="game-end-title">🏆 Game Over! 🏆</h1>
        <p style={{ color: "var(--text-secondary)", fontSize: "1.1rem", marginTop: "8px" }}>
          Here are the final standings
        </p>

        {/* Podiums */}
        <div className="podium-container">
          {/* 2nd Place */}
          {secondPlace && (
            <div className="podium-place second">
              <div className="podium-player-info">
                <Avatar emoji={secondPlace.avatar} seed={secondPlace.username} size="medium" />
                <div className="podium-username">{secondPlace.username}</div>
                <div className="podium-score">{secondPlace.score} pts</div>
              </div>
              <div className="podium-bar">2nd</div>
            </div>
          )}

          {/* 1st Place */}
          {firstPlace && (
            <div className="podium-place first">
              <div className="podium-player-info">
                <Avatar emoji={firstPlace.avatar} seed={firstPlace.username} size="large" />
                <div className="podium-username" style={{ fontSize: "1.2rem", color: "#ffd700" }}>
                  👑 {firstPlace.username}
                </div>
                <div className="podium-score" style={{ fontWeight: 600 }}>{firstPlace.score} pts</div>
              </div>
              <div className="podium-bar">1st</div>
            </div>
          )}

          {/* 3rd Place */}
          {thirdPlace && (
            <div className="podium-place third">
              <div className="podium-player-info">
                <Avatar emoji={thirdPlace.avatar} seed={thirdPlace.username} size="medium" />
                <div className="podium-username">{thirdPlace.username}</div>
                <div className="podium-score">{thirdPlace.score} pts</div>
              </div>
              <div className="podium-bar">3rd</div>
            </div>
          )}
        </div>

        {/* Rest of the players list */}
        {rest.length > 0 && (
          <div
            className="glass-panel"
            style={{
              marginTop: "32px",
              padding: "16px",
              maxHeight: "180px",
              overflowY: "auto",
              textAlign: "left"
            }}
          >
            <h4 style={{ borderBottom: "1px solid var(--glass-border)", paddingBottom: "8px", marginBottom: "8px" }}>
              Runner-ups
            </h4>
            {rest.map((p, idx) => (
              <div
                key={p.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "6px 0",
                  borderBottom: idx === rest.length - 1 ? "none" : "1px solid rgba(255,255,255,0.02)"
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <span style={{ color: "var(--text-muted)", fontWeight: "bold" }}>#{idx + 4}</span>
                  <Avatar emoji={p.avatar} seed={p.username} size="small" />
                  <span>{p.username}</span>
                </div>
                <span style={{ color: "var(--text-secondary)", fontSize: "0.9rem" }}>{p.score} pts</span>
              </div>
            ))}
          </div>
        )}

        {/* Action Buttons */}
        <div style={{ display: "flex", gap: "16px", justifyContent: "center", marginTop: "40px" }}>
          {isHost ? (
            <button className="btn btn-primary" onClick={onPlayAgain}>
              🔄 Play Again
            </button>
          ) : (
            <p style={{ color: "var(--text-muted)", fontSize: "0.95rem", alignSelf: "center" }}>
              Waiting for host to start a new game...
            </p>
          )}
          <button className="btn btn-secondary" onClick={onLeave}>
            🚪 Return to Lobby
          </button>
        </div>
      </div>
    </div>
  );
}
