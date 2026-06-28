import React from "react";

// Curated list of high-quality background gradients
const GRADIENTS = [
  "linear-gradient(135deg, #f59e0b, #e11d48)", // Amber to Rose
  "linear-gradient(135deg, #10b981, #06b6d4)", // Emerald to Cyan
  "linear-gradient(135deg, #6366f1, #d946ef)", // Indigo to Fuchsia
  "linear-gradient(135deg, #3b82f6, #8b5cf6)", // Blue to Violet
  "linear-gradient(135deg, #f43f5e, #e11d48)", // Rose to Crimson
  "linear-gradient(135deg, #ec4899, #f43f5e)", // Pink to Rose
  "linear-gradient(135deg, #8b5cf6, #ec4899)", // Violet to Pink
  "linear-gradient(135deg, #06b6d4, #3b82f6)", // Cyan to Blue
  "linear-gradient(135deg, #f59e0b, #d97706)", // Amber to Gold
  "linear-gradient(135deg, #10b981, #047857)"  // Emerald to Forest
];

export const AVATAR_EMOJIS = [
  "🐶", "🐱", "🐭", "🐹", "🐰", "🦊", "🐻", "🐼", "🐨", "🐯",
  "🦁", "🐮", "🐷", "🐸", "🐵", "🐔", "🐧", "🐦", "🐣", "🦆",
  "🦅", "🦉", "🦇", "🐺", "🐗", "🐴", "🦄", "🐝", "🐛", "🦋",
  "🐌", "🐞", "🐜", "🦟", "🦗", "🕷", "🦂", "🐢", "🐍", "🦎",
  "🦖", "🦕", "🐙", "🦑", "🦐", "🦞", "🦀", "🐡", "🐠", "🐟"
];

function getHash(str) {
  let hash = 0;
  if (!str) return 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0; // Convert to 32bit integer
  }
  return Math.abs(hash);
}

export default function Avatar({ emoji = "🐱", seed = "Sketch", size = "medium", className = "" }) {
  const hash = getHash(seed + emoji);
  const gradient = GRADIENTS[hash % GRADIENTS.length];
  
  const sizeStyles = {
    small: {
      width: "36px",
      height: "36px",
      fontSize: "1.4rem"
    },
    medium: {
      width: "52px",
      height: "52px",
      fontSize: "2.1rem"
    },
    large: {
      width: "100px",
      height: "100px",
      fontSize: "3.8rem"
    }
  };

  const style = sizeStyles[size] || sizeStyles.medium;

  return (
    <div
      className={`player-avatar-container ${className}`}
      style={{
        ...style,
        background: gradient,
        borderRadius: "50%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        boxShadow: "0 4px 12px rgba(0, 0, 0, 0.25), inset 0 2px 4px rgba(255, 255, 255, 0.2)",
        userSelect: "none"
      }}
    >
      <span style={{ filter: "drop-shadow(0 2px 4px rgba(0, 0, 0, 0.2))" }}>
        {emoji}
      </span>
    </div>
  );
}
