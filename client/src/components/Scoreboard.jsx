import React from "react";
import Avatar from "./Avatar";

export default function Scoreboard({ players = [] }) {
  // Sort players by score descending
  const sortedPlayers = [...players].sort((a, b) => b.score - a.score);

  return (
    <div className="glass-panel scoreboard-panel">
      <div className="panel-header">
        <h3>Players</h3>
        <span style={{ fontSize: "0.85rem", color: "var(--text-secondary)", fontWeight: 600 }}>
          {players.length} online
        </span>
      </div>
      
      <div className="players-list">
        {sortedPlayers.map((player, index) => {
          const rank = index + 1;
          
          return (
            <div
              key={player.id}
              className={`player-card ${player.isDrawing ? "drawing" : ""} ${player.guessed ? "guessed" : ""}`}
            >
              {/* Rank indicator */}
              <span
                style={{
                  fontSize: "0.8rem",
                  fontWeight: 800,
                  width: "16px",
                  color: rank === 1 ? "#ffd700" : rank === 2 ? "#c0c0c0" : rank === 3 ? "#cd7f32" : "var(--text-muted)",
                  marginRight: "-4px"
                }}
              >
                #{rank}
              </span>

              {/* Avatar Component */}
              <Avatar emoji={player.avatar} seed={player.username} size="small" />

              {/* Player Name and Score */}
              <div className="player-info">
                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <span className="player-name">
                    {player.username}
                  </span>
                  {player.creator && (
                    <span
                      title="Room Host"
                      style={{
                        fontSize: "0.7rem",
                        color: "var(--warning-color)",
                        cursor: "default"
                      }}
                    >
                      👑
                    </span>
                  )}
                </div>
                
                <div className="player-meta">
                  <span className="player-score">{player.score} points</span>
                </div>
              </div>

              {/* Status Badges */}
              {player.isDrawing && (
                <span className="player-badge draw">Drawing</span>
              )}
              {!player.isDrawing && player.guessed && (
                <span className="player-badge guess">Guessed</span>
              )}

              {/* Floating score indicator if they scored points in the current turn */}
              {player.roundScore > 0 && (
                <span className="player-round-score">+{player.roundScore}</span>
              )}
            </div>
          );
        })}

        {sortedPlayers.length === 0 && (
          <div style={{ textAlign: "center", padding: "20px", color: "var(--text-muted)", fontSize: "0.9rem" }}>
            No players in lobby.
          </div>
        )}
      </div>
    </div>
  );
}
