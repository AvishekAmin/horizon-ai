import "./App.css";
import Chat from "./Chat.jsx";
import { MyContext } from "./MyContext.jsx";
import { useContext, useState, useRef, useEffect } from "react";

const SUGGESTIONS = [
  {
    icon: "fa-solid fa-lightbulb",
    title: "Explain a concept",
    prompt: "Explain quantum computing in simple everyday analogies.",
  },
  {
    icon: "fa-solid fa-code",
    title: "Code & Debug",
    prompt: "Write a clean Express.js rate-limiting middleware example.",
  },
  {
    icon: "fa-solid fa-rocket",
    title: "Product Strategy",
    prompt: "Draft a launch strategy and key features for an AI SaaS tool.",
  },
  {
    icon: "fa-solid fa-pen-nib",
    title: "Summarize & Compare",
    prompt: "Compare SQL and NoSQL databases: when to choose which?",
  },
];

function ChatWindow() {
  const {
    prompt,
    setPrompt,
    prevChats,
    newChat,
    loading,
    error,
    setError,
    isQuotaError,
    sidebarOpen,
    setSidebarOpen,
    sendMessage,
    createNewChat,
  } = useContext(MyContext);

  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, [newChat]);

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (prompt.trim() && !loading) {
        sendMessage(prompt);
      }
    }
  };

  const handleSendClick = () => {
    if (prompt.trim() && !loading) {
      sendMessage(prompt);
    }
  };

  const handleSuggestionClick = (suggestionPrompt) => {
    setPrompt(suggestionPrompt);
    sendMessage(suggestionPrompt);
  };

  return (
    <main className="chat-window">
      <header className="top-navbar">
        <div className="nav-left">
          <button
            className="mobile-menu-btn"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            aria-label="Toggle Sidebar"
          >
            <i className="fa-solid fa-bars"></i>
          </button>

          <span className="platform-title">Horizon AI</span>
        </div>

        <div className="nav-right">
          <button
            className="nav-action-btn mobile-only"
            onClick={createNewChat}
            title="New Chat"
          >
            <i className="fa-regular fa-pen-to-square"></i>
          </button>

          <div className="user-profile-wrapper">
            <button
              className="profile-icon-btn"
              onClick={() => setProfileMenuOpen(!profileMenuOpen)}
              aria-label="User Menu"
            >
              <i className="fa-solid fa-user"></i>
            </button>

            {profileMenuOpen && (
              <div className="profile-dropdown-menu">
                <div className="profile-menu-header">
                  <div className="user-avatar-sm">
                    <i className="fa-solid fa-user"></i>
                  </div>
                  <div className="profile-user-info">
                    <span className="user-display-name">Horizon AI User</span>
                    <span className="user-tier">Free Tier Plan</span>
                  </div>
                </div>
                <div className="dropdown-divider"></div>
                <div
                  className="dropdown-menu-item"
                  onClick={() => setProfileMenuOpen(false)}
                >
                  <i className="fa-solid fa-gear"></i>
                  <span>Settings</span>
                </div>
                <div
                  className="dropdown-menu-item"
                  onClick={() => {
                    createNewChat();
                    setProfileMenuOpen(false);
                  }}
                >
                  <i className="fa-solid fa-clock-rotate-left"></i>
                  <span>Reset Conversation</span>
                </div>
                <div className="dropdown-divider"></div>
                <div
                  className="dropdown-menu-item item-about"
                  onClick={() => setProfileMenuOpen(false)}
                >
                  <i className="fa-solid fa-circle-info"></i>
                  <span>About Horizon AI v1.0</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {error && (
        <div className={`error-banner ${isQuotaError ? "quota-banner" : ""}`}>
          <div className="error-banner-content">
            <i
              className={`fa-solid ${
                isQuotaError
                  ? "fa-triangle-exclamation"
                  : "fa-circle-exclamation"
              }`}
            ></i>
            <span>{error}</span>
          </div>
          <button
            className="error-dismiss-btn"
            onClick={() => setError(null)}
            title="Dismiss"
          >
            <i className="fa-solid fa-xmark"></i>
          </button>
        </div>
      )}

      <div className="chat-content-area">
        {newChat && prevChats.length === 0 ? (
          <div className="empty-state-container">
            <div className="empty-hero">
              <div className="hero-logo">
                <i className="fa-solid fa-bolt-lightning"></i>
              </div>
              <h1 className="hero-title">Where should we begin?</h1>
              <p className="hero-subtitle">
                Ask a question, write code, or explore ideas with Horizon AI.
              </p>
            </div>

            <div className="suggestions-grid">
              {SUGGESTIONS.map((item, idx) => (
                <button
                  key={idx}
                  className="suggestion-card"
                  onClick={() => handleSuggestionClick(item.prompt)}
                >
                  <div className="suggestion-icon">
                    <i className={item.icon}></i>
                  </div>
                  <div className="suggestion-text">
                    <span className="suggestion-title">{item.title}</span>
                    <span className="suggestion-prompt">{item.prompt}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <Chat />
        )}
      </div>

      <footer className="chat-input-wrapper">
        <div className="input-container">
          <textarea
            ref={inputRef}
            className="chat-textarea"
            rows="1"
            placeholder="Message Horizon AI..."
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={loading}
          />

          <button
            className={`send-button ${
              prompt.trim() && !loading ? "active-send" : ""
            }`}
            onClick={handleSendClick}
            disabled={!prompt.trim() || loading}
            aria-label="Send message"
            title="Send message"
          >
            {loading ? (
              <i className="fa-solid fa-circle-notch fa-spin"></i>
            ) : (
              <i className="fa-solid fa-arrow-up"></i>
            )}
          </button>
        </div>

        <p className="disclaimer-text">
          Horizon AI can make mistakes. Verify important information. Powered by Google Gemini.
        </p>
      </footer>
    </main>
  );
}

export default ChatWindow;
