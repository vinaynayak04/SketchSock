import React, { useState, useEffect, useRef } from "react";

export default function FooterModals({
  activeTab, // "contact" | "terms" | "credits" | "privacy"
  onClose,
  sounds,
  theme,
  setTheme,
  showBlobs,
  setShowBlobs
}) {
  const [currentTab, setCurrentTab] = useState(activeTab);
  const modalRef = useRef(null);

  // Form states for contact
  const [contactName, setContactName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactCategory, setContactCategory] = useState("Feedback");
  const [contactMessage, setContactMessage] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [gmailDraftUrl, setGmailDraftUrl] = useState("");
  const [mailtoFallbackUrl, setMailtoFallbackUrl] = useState("");

  // Sync tab state when activeTab prop changes
  useEffect(() => {
    setCurrentTab(activeTab);
    setSubmitted(false); // Reset form submission when changing/opening tabs
  }, [activeTab]);

  // Handle ESC key press to close modal
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  // Close modal when clicking outside of the content container
  const handleOverlayClick = (e) => {
    if (modalRef.current && !modalRef.current.contains(e.target)) {
      onClose();
    }
  };

  // Submit Contact Form - Redirects to Gmail web compose or Mailto fallback
  const handleContactSubmit = (e) => {
    e.preventDefault();
    if (!contactName || !contactMessage) return;

    const targetEmail = "support@sketchsock.com";
    const emailSubject = `[SketchSock ${contactCategory}] Message from ${contactName}`;
    const emailBody = `Hi SketchSock Team,

${contactMessage}

Best regards,
${contactName}
Contact Email: ${contactEmail || "Not Provided"}`;

    // Gmail Web Compose Link
    const gmailComposeUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(
      targetEmail
    )}&su=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(emailBody)}`;

    // Standard mailto link
    const mailtoUrl = `mailto:${targetEmail}?subject=${encodeURIComponent(
      emailSubject
    )}&body=${encodeURIComponent(emailBody)}`;

    setGmailDraftUrl(gmailComposeUrl);
    setMailtoFallbackUrl(mailtoUrl);

    // Play sound if available
    if (sounds && typeof sounds.playCorrectGuess === "function") {
      sounds.playCorrectGuess();
    }

    // Open Gmail in a new tab/window
    window.open(gmailComposeUrl, "_blank");

    setSubmitted(true);
  };

  // Reset settings to default
  const handleClearCache = () => {
    if (window.confirm("Are you sure you want to clear your local SketchSock cache and reset settings?")) {
      localStorage.clear();
      setTheme("dark");
      setShowBlobs(true);
      if (sounds && sounds.muted) {
        sounds.toggleMute();
      }
      alert("Settings reset to defaults!");
      onClose();
    }
  };

  return (
    <div className="modal-overlay" onClick={handleOverlayClick}>
      <div className="modal-content" ref={modalRef}>
        {/* Header */}
        <header className="modal-header">
          <h3 className="modal-title">
            {currentTab === "contact" && "📬 Contact Support"}
            {currentTab === "terms" && "📜 Terms of Service"}
            {currentTab === "credits" && "🎉 Game Credits"}
            {currentTab === "privacy" && "🔒 Privacy Settings"}
          </h3>
          <button className="modal-close-btn" onClick={onClose} aria-label="Close modal">
            &times;
          </button>
        </header>

        {/* Tab Buttons */}
        <nav className="modal-tabs" style={{ padding: "0 24px" }}>
          <button
            className={`modal-tab-btn ${currentTab === "contact" ? "active" : ""}`}
            onClick={() => {
              setCurrentTab("contact");
              setSubmitted(false);
            }}
          >
            Contact
          </button>
          <button
            className={`modal-tab-btn ${currentTab === "terms" ? "active" : ""}`}
            onClick={() => setCurrentTab("terms")}
          >
            Terms of Service
          </button>
          <button
            className={`modal-tab-btn ${currentTab === "credits" ? "active" : ""}`}
            onClick={() => setCurrentTab("credits")}
          >
            Credits
          </button>
          <button
            className={`modal-tab-btn ${currentTab === "privacy" ? "active" : ""}`}
            onClick={() => setCurrentTab("privacy")}
          >
            Privacy Settings
          </button>
        </nav>

        {/* Body content */}
        <div className="modal-body">
          {/* TAB 1: CONTACT SUPPORT */}
          {currentTab === "contact" && (
            <div className="modal-section">
              {!submitted ? (
                <>
                  <p>
                    Have feedback, found a bug, or want to suggest new features? Fill out the details below,
                    and we will launch Gmail to draft your email support message.
                  </p>
                  <form onSubmit={handleContactSubmit} className="contact-form">
                    <div className="form-group">
                      <label htmlFor="contact-name">Your Name *</label>
                      <input
                        id="contact-name"
                        type="text"
                        className="input-field"
                        placeholder="e.g. SketchMaster"
                        value={contactName}
                        onChange={(e) => setContactName(e.target.value)}
                        required
                      />
                    </div>

                    <div className="form-group">
                      <label htmlFor="contact-email">Email Address (Optional)</label>
                      <input
                        id="contact-email"
                        type="email"
                        className="input-field"
                        placeholder="e.g. you@example.com"
                        value={contactEmail}
                        onChange={(e) => setContactEmail(e.target.value)}
                      />
                    </div>

                    <div className="form-group">
                      <label htmlFor="contact-category">What is this regarding?</label>
                      <select
                        id="contact-category"
                        className="input-field"
                        value={contactCategory}
                        onChange={(e) => setContactCategory(e.target.value)}
                      >
                        <option value="Feedback">General Feedback</option>
                        <option value="Bug Report">Bug Report 🐛</option>
                        <option value="Feature Request">Feature Request 💡</option>
                        <option value="Other">Other Topic</option>
                      </select>
                    </div>

                    <div className="form-group">
                      <label htmlFor="contact-msg">Message *</label>
                      <textarea
                        id="contact-msg"
                        className="input-field"
                        style={{ minHeight: "110px", resize: "vertical" }}
                        placeholder="Write your message here..."
                        value={contactMessage}
                        onChange={(e) => setContactMessage(e.target.value)}
                        required
                      />
                    </div>

                    <button type="submit" className="btn btn-primary" style={{ marginTop: "8px" }}>
                      🚀 Open Gmail Draft
                    </button>
                  </form>
                </>
              ) : (
                <div className="contact-success">
                  <div className="success-icon-wrapper">✉️</div>
                  <h4>Gmail Draft Opened!</h4>
                  <p>
                    A new tab has been launched pre-populated with your support mail content. 
                    Please review and hit <strong>Send</strong> in your Gmail interface!
                  </p>
                  <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", justifyContent: "center" }}>
                    <a
                      href={gmailDraftUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn-primary success-email-btn"
                    >
                      📧 Try Opening Gmail Again
                    </a>
                    <a href={mailtoFallbackUrl} className="btn btn-secondary success-email-btn">
                      📬 Send via Mailto Fallback
                    </a>
                  </div>
                  <button
                    className="btn btn-secondary"
                    style={{ marginTop: "20px" }}
                    onClick={() => {
                      setSubmitted(false);
                      setContactMessage("");
                    }}
                  >
                    Write Another Message
                  </button>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: TERMS OF SERVICE */}
          {currentTab === "terms" && (
            <div className="modal-section">
              <p style={{ fontStyle: "italic", fontSize: "0.85rem", color: "var(--text-muted)", marginBottom: "16px" }}>
                Last updated: June 2026
              </p>
              
              <h4>1. Play Nice & Be Respectful</h4>
              <p>
                SketchSock is a multiplayer canvas game meant for all ages. You agree not to type offensive language, 
                harass other players, or draw inappropriate content. Failure to do so may result in an immediate kick or IP ban.
              </p>

              <h4>2. User-Generated Canvas & Chat</h4>
              <p>
                All drawings, nicknames, and chat messages are user-generated. The owner of SketchSock does not assume 
                responsibility or liability for any content created by other users on this platform.
              </p>

              <h4>3. Web Audio & Browser Capabilities</h4>
              <p>
                This application synthesizes sound effects programmatically using the Web Audio API to provide high-quality 
                retro-styled alert noises without loading heavy static assets. By using the app, you grant permission for 
                audio synthesizers to fire in response to game events.
              </p>

              <h4>4. Disclaimer of Warranties</h4>
              <p>
                SketchSock is provided on an "as is" and "as available" basis without warranties of any kind. We hope you 
                enjoy the server, but we cannot guarantee that server disconnects won't happen during a critical game.
              </p>
            </div>
          )}

          {/* TAB 3: CREDITS */}
          {currentTab === "credits" && (
            <div className="modal-section">
              <p>
                SketchSock is made with love. A huge thank you to everyone who supported this project!
              </p>

              <div className="credits-grid">
                <div className="credit-card">
                  <span className="credit-card-role">Developer & Creator</span>
                  <span className="credit-card-name">Vinay Nayak</span>
                  <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>Full-Stack engineering and Web Audio synthesizer engine.</span>
                </div>

                <div className="credit-card">
                  <span className="credit-card-role">Open Source Frameworks</span>
                  <span className="credit-card-name">React & Socket.io</span>
                  <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>Powers the robust client reactivity and real-time room communication websockets.</span>
                </div>

                <div className="credit-card">
                  <span className="credit-card-role">Styling System</span>
                  <span className="credit-card-name">CSS Glassmorphism</span>
                  <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>Tailored dark color variables, HSL glow vectors, and neon themes.</span>
                </div>

                <div className="credit-card">
                  <span className="credit-card-role">Audio Synthesizer</span>
                  <span className="credit-card-name">Web Audio API</span>
                  <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>Programmatic oscillator waves creating skribbl-style gameplay bells.</span>
                </div>
              </div>
              
              <div style={{ marginTop: "24px", textAlign: "center", borderTop: "1px solid var(--glass-border)", paddingTop: "16px" }}>
                <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>
                  💡 Want to contribute or report a bug? Check out the <strong>Contact</strong> section to email us directly!
                </p>
              </div>
            </div>
          )}

          {/* TAB 4: PRIVACY SETTINGS */}
          {currentTab === "privacy" && (
            <div className="modal-section">
              <p style={{ marginBottom: "20px" }}>
                Manage your layout experience, audio preferences, and performance optimizations.
              </p>

              <div className="privacy-settings-list">
                {/* Setting 1: Theme selection */}
                <div className="setting-row">
                  <div className="setting-info">
                    <span className="setting-title">Aesthetic Theme</span>
                    <span className="setting-desc">Instantly updates the lobby colors, panels, and gradients.</span>
                  </div>
                  <div className="setting-control">
                    <select
                      className="input-field"
                      style={{ padding: "6px 12px", width: "130px" }}
                      value={theme}
                      onChange={(e) => setTheme(e.target.value)}
                    >
                      <option value="dark">Classic Dark</option>
                      <option value="neon">Retro Neon</option>
                      <option value="ocean">Ocean Blue</option>
                    </select>
                  </div>
                </div>

                {/* Setting 2: Game Audio Effects */}
                <div className="setting-row">
                  <div className="setting-info">
                    <span className="setting-title">Game Sound Effects</span>
                    <span className="setting-desc">Enable or mute real-time alert bells, ticks, and horn fanfares.</span>
                  </div>
                  <div className="setting-control">
                    <label className="switch">
                      <input
                        type="checkbox"
                        checked={sounds ? !sounds.muted : true}
                        onChange={() => sounds && sounds.toggleMute()}
                      />
                      <span className="slider"></span>
                    </label>
                  </div>
                </div>

                {/* Setting 3: Background blobs */}
                <div className="setting-row">
                  <div className="setting-info">
                    <span className="setting-title">Background Blobs</span>
                    <span className="setting-desc">Disable the floating blur background divs for better performance.</span>
                  </div>
                  <div className="setting-control">
                    <label className="switch">
                      <input
                        type="checkbox"
                        checked={showBlobs}
                        onChange={(e) => setShowBlobs(e.target.checked)}
                      />
                      <span className="slider"></span>
                    </label>
                  </div>
                </div>

                {/* Setting 4: Reset Cache */}
                <div className="setting-row" style={{ borderBottom: "none" }}>
                  <div className="setting-info">
                    <span className="setting-title">Reset Client Data</span>
                    <span className="setting-desc">Clear local cookies, mute preferences, and selected themes.</span>
                  </div>
                  <div className="setting-control">
                    <button className="btn btn-secondary" style={{ padding: "6px 12px" }} onClick={handleClearCache}>
                      🗑️ Clear Cache
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
