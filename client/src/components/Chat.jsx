import React, { useRef, useState, useEffect } from "react";

export default function Chat({ socket, roomCode, messages = [], isDrawer, hasGuessed, playChatSend }) {
  const [inputText, setInputText] = useState("");
  const chatHistoryRef = useRef(null);

  // Auto-scroll to bottom of chat history on new message
  useEffect(() => {
    if (chatHistoryRef.current) {
      chatHistoryRef.current.scrollTop = chatHistoryRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSubmit = (e) => {
    e.preventDefault();
    const text = inputText.trim();
    if (!text) return;

    if (socket && roomCode) {
      socket.emit("chat-message", { roomCode, text });
      if (playChatSend) playChatSend();
    }
    setInputText("");
  };

  // Determine placeholder and disabled state based on player game state
  let placeholder = "Type your guess here...";
  let isDisabled = false;

  if (isDrawer) {
    placeholder = "You are drawing! You cannot guess.";
    isDisabled = true;
  } else if (hasGuessed) {
    placeholder = "Correct! Chat with other winners...";
  }

  return (
    <div className="glass-panel chat-panel">
      <div className="panel-header">
        <h3>Guesses & Chat</h3>
      </div>

      {/* Chat scroll box */}
      <div className="chat-history" ref={chatHistoryRef}>
        {messages.map((msg, idx) => {
          // Render system updates
          if (msg.isSystem) {
            return (
              <div key={idx} className={`chat-bubble system ${msg.type || "info"}`}>
                {msg.text}
              </div>
            );
          }

          // Render guessed chats (green bubbles)
          if (msg.isGuessedChat) {
            return (
              <div key={idx} className="chat-bubble guessed-msg">
                <span className="sender">{msg.sender}:</span>
                {msg.text}
              </div>
            );
          }

          // Render standard messages
          return (
            <div key={idx} className="chat-bubble">
              <span className="sender">{msg.sender}:</span>
              {msg.text}
            </div>
          );
        })}
      </div>

      {/* Message submission input */}
      <form onSubmit={handleSubmit} className="chat-input-form">
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder={placeholder}
          disabled={isDisabled}
          className="input-field"
          maxLength={80}
          autoComplete="off"
        />
        <button
          type="submit"
          className="btn btn-primary"
          disabled={isDisabled || !inputText.trim()}
          style={{ padding: "10px 16px" }}
        >
          Send
        </button>
      </form>
    </div>
  );
}
