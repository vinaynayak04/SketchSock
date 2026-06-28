import React from "react";
import Avatar from "./Avatar";

export default function GameEnd({ players = [], isHost, onPlayAgain, onLeave }) {
  // Sort players by final score
  const sorted = [...players].sort((a, b) => b.score - a.score);

  const firstPlace = sorted[0] || null;
  const secondPlace = sorted[1] || null;
  const thirdPlace = sorted[2] || null;
  const rest = sorted.slice(3);

  const medals = ["🥇", "🥈", "🥉"];

  return (
    <div className="game-end-overlay">
      <div className="game-end-content">
        {/* Header section — always at top, never overlapped */}
        <div className="game-end-header">
          <h1 className="game-end-title">🏆 Game Over! 🏆</h1>
          <p className="game-end-subtitle">Here are the final standings</p>
        </div>

        {/* Winner card — 1st place highlighted */}
        {firstPlace && (
          <div className="winner-card winner-gold">
            <span className="winner-medal">🥇</span>
            <Avatar emoji={firstPlace.avatar} seed={firstPlace.username} className="winner-avatar winner-avatar-first" />
            <div className="winner-name">👑 {firstPlace.username}</div>
            <div className="winner-score">{firstPlace.score} pts</div>
          </div>
        )}

        {/* 2nd and 3rd place side by side */}
        {(secondPlace || thirdPlace) && (
          <div className="runner-up-row">
            {secondPlace && (
              <div className="winner-card winner-silver">
                <span className="winner-medal">🥈</span>
                <Avatar emoji={secondPlace.avatar} seed={secondPlace.username} className="winner-avatar" />
                <div className="winner-name">{secondPlace.username}</div>
                <div className="winner-score">{secondPlace.score} pts</div>
              </div>
            )}
            {thirdPlace && (
              <div className="winner-card winner-bronze">
                <span className="winner-medal">🥉</span>
                <Avatar emoji={thirdPlace.avatar} seed={thirdPlace.username} className="winner-avatar" />
                <div className="winner-name">{thirdPlace.username}</div>
                <div className="winner-score">{thirdPlace.score} pts</div>
              </div>
            )}
          </div>
        )}

        {/* Rest of the players */}
        {rest.length > 0 && (
          <div
            className="glass-panel"
            style={{
              padding: "12px 16px",
              maxHeight: "160px",
              overflowY: "auto",
              textAlign: "left",
              width: "100%",
              maxWidth: "400px"
            }}
          >
            <h4 style={{ borderBottom: "1px solid var(--glass-border)", paddingBottom: "6px", marginBottom: "6px", fontSize: "0.85rem" }}>
              Runner-ups
            </h4>
            {rest.map((p, idx) => (
              <div
                key={p.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "5px 0",
                  borderBottom: idx === rest.length - 1 ? "none" : "1px solid rgba(255,255,255,0.02)"
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <span style={{ color: "var(--text-muted)", fontWeight: "bold", fontSize: "0.85rem" }}>#{idx + 4}</span>
                  <Avatar emoji={p.avatar} seed={p.username} size="small" />
                  <span style={{ fontSize: "0.9rem" }}>{p.username}</span>
                </div>
                <span style={{ color: "var(--text-secondary)", fontSize: "0.85rem" }}>{p.score} pts</span>
              </div>
            ))}
          </div>
        )}

        {/* Action Buttons */}
        <div className="game-end-actions">
          {isHost ? (
            <button className="btn btn-primary" onClick={onPlayAgain}>
              🔄 Play Again
            </button>
          ) : (
            <p style={{ color: "var(--text-muted)", fontSize: "0.95rem", textAlign: "center" }}>
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
