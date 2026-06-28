import React, { useEffect } from "react";

export default function WordSelector({ wordOptions = [], timer = 15, onSelect, playWordSelect }) {
  // Play whoosh sound when word selection appears
  useEffect(() => {
    if (playWordSelect) playWordSelect();
  }, []);

  return (
    <div className="word-selection-overlay">
      <div style={{ textAlign: "center", animation: "fadeIn 0.3s ease-out" }}>
        <h3 style={{ marginBottom: "8px" }}>🎨 Choose a word to draw!</h3>
        <p style={{ color: "var(--text-secondary)", marginBottom: "24px" }}>
          You have <span style={{ color: "var(--warning-color)", fontWeight: "bold" }}>{timer}</span> seconds left
        </p>
        
        <div className="word-options-list">
          {wordOptions.map((word) => (
            <button
              key={word}
              className="word-option-btn"
              onClick={() => onSelect(word)}
            >
              {word}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
