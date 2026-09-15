import "./App.css";
import { useContext } from "react";
import { MyContext } from "./MyContext.jsx";

function Sidebar() {
  const {
    allThreads,
    currThreadId,
    newChat,
    createNewChat,
    changeThread,
    deleteThread,
    sidebarOpen,
    setSidebarOpen,
  } = useContext(MyContext);

  return (
    <>
      {/* Mobile backdrop overlay */}
      {sidebarOpen && (
        <div
          className="sidebar-backdrop"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside className={`sidebar ${sidebarOpen ? "sidebar-open" : ""}`}>
        {/* Top Header & Brand */}
        <div className="sidebar-header">
          <div className="brand-badge">
            <div className="brand-icon">
              <i className="fa-solid fa-bolt-lightning"></i>
            </div>
            <div className="brand-info">
              <span className="brand-name">Horizon AI</span>
              <span className="brand-sub">Conversational Assistant</span>
            </div>
          </div>

          {/* Close button for mobile */}
          <button
            className="mobile-close-btn"
            onClick={() => setSidebarOpen(false)}
            aria-label="Close Sidebar"
          >
            <i className="fa-solid fa-xmark"></i>
          </button>
        </div>

        {/* New Chat Button (ChatGPT style) */}
        <div className="new-chat-container">
          <button
            className="new-chat-btn"
            onClick={createNewChat}
            title="Start a new conversation"
          >
            <div className="new-chat-left">
              <i className="fa-solid fa-plus"></i>
              <span>New chat</span>
            </div>
            <i className="fa-regular fa-pen-to-square pen-icon"></i>
          </button>
        </div>

        {/* Conversation History List */}
        <div className="history-section">
          <div className="history-header">
            <span>Recent Conversations</span>
            {allThreads?.length > 0 && (
              <span className="history-count">{allThreads.length}</span>
            )}
          </div>

          <ul className="history-list">
            {allThreads && allThreads.length > 0 ? (
              allThreads.map((thread) => {
                const isActive = !newChat && thread.threadId === currThreadId;
                return (
                  <li
                    key={thread.threadId}
                    onClick={() => changeThread(thread.threadId)}
                    className={`history-item ${isActive ? "active-item" : ""}`}
                    title={thread.title}
                  >
                    <i className="fa-regular fa-message thread-icon"></i>
                    <span className="thread-title">{thread.title}</span>
                    <button
                      className="delete-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteThread(thread.threadId);
                      }}
                      title="Delete chat"
                    >
                      <i className="fa-regular fa-trash-can"></i>
                    </button>
                  </li>
                );
              })
            ) : (
              <div className="empty-history">
                <i className="fa-regular fa-comments"></i>
                <p>No saved conversations yet</p>
                <span>Your chat history will appear here</span>
              </div>
            )}
          </ul>
        </div>

        {/* Sidebar Footer / User & Model Info */}
        <div className="sidebar-footer">
          <div className="user-profile-badge">
            <div className="user-avatar">
              <i className="fa-solid fa-user"></i>
            </div>
            <div className="user-details">
              <span className="user-title">Horizon AI</span>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}

export default Sidebar;
